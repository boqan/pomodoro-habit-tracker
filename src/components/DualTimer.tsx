import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PictureInPicture2, X } from 'lucide-react';
import { notify } from '@/lib/notify';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { TimerDisplay } from './TimerDisplay';
import { MiniTimerDisplayWithProvider } from './MiniTimerDisplay';
import { useMiniTimerPublisher } from '@/hooks/useMiniTimerChannel';
import { type TimerSnapshot, MAX_REGULAR_MINUTES } from '@/types/timer';

interface Segment {
  type: 'focus' | 'break' | 'longBreak';
  duration: number; // in minutes
}

function computeSchedule(
  total: number,
  focusLen: number,
  shortBreak: number,
  longBreak: number
): Segment[] {
  focusLen = Math.max(1, focusLen);
  shortBreak = Math.max(1, shortBreak);
  longBreak = Math.max(1, longBreak);

  const schedule: Segment[] = [];
  let remaining = total;
  let focusAccum = 0;

  while (remaining > 0) {
    const work = Math.min(focusLen, remaining);
    schedule.push({ type: 'focus', duration: work });
    remaining -= work;
    focusAccum += work;

    if (remaining <= 0) break;

    // Only add a break if there's enough remaining focus time to make it worthwhile
    // (at least half a focus block remaining)
    if (remaining < focusLen * 0.5) {
      // Extend the current focus block with remaining time instead of adding a break
      schedule[schedule.length - 1].duration += remaining;
      remaining = 0;
      break;
    }

    let breakLen = shortBreak;
    const isLongBreak = focusAccum >= 120;
    if (isLongBreak) {
      breakLen = longBreak;
    }

    schedule.push({ type: isLongBreak ? 'longBreak' : 'break', duration: breakLen });
    
    // Reset focus accumulator after long break is added to schedule
    if (isLongBreak) {
      focusAccum = 0;
    }
  }

  const hasLongBreak = schedule.some((s) => s.type === 'longBreak');
  if (!hasLongBreak && total >= 120) {
    schedule.push({ type: 'longBreak', duration: longBreak });
  }
  return schedule;
}

interface ScheduleSummary {
  workBlocks: number;
  partialFocus: number | null;
  shortBreaks: number;
  longBreaks: number;
}

// Summarize the computed schedule for easy rendering in the preview alert
function summarizeSchedule(schedule: Segment[], focusLen: number): ScheduleSummary {
  let workBlocks = 0;
  let partialFocus: number | null = null;
  let shortBreaks = 0;
  let longBreaks = 0;

  for (const seg of schedule) {
    if (seg.type === 'focus') {
      if (seg.duration === focusLen) workBlocks++;
      else partialFocus = seg.duration;
    } else if (seg.type === 'break') {
      shortBreaks++;
    } else {
      longBreaks++;
    }
  }

  return { workBlocks, partialFocus, shortBreaks, longBreaks };
}

// Convert the summary into React nodes so we can show multiple lines
function renderScheduleSummary(
  summary: ScheduleSummary,
  focusLen: number,
  shortBreak: number,
  longBreak: number
) {
  const lines: string[] = [];

  // Calculate total session duration
  const totalFocusTime = summary.workBlocks * focusLen + (summary.partialFocus || 0);
  const totalBreakTime = summary.shortBreaks * shortBreak + summary.longBreaks * longBreak;
  const totalSessionTime = totalFocusTime + totalBreakTime;

  // Add total session duration at the top
  lines.push(`Total session: ${totalSessionTime} min`);

  if (summary.workBlocks > 0) {
    lines.push(`Work blocks: ${summary.workBlocks} × ${focusLen} min`);
  }
  if (summary.partialFocus !== null) {
    lines.push(`Final focus block: ${summary.partialFocus} min`);
  }
  if (summary.shortBreaks > 0) {
    lines.push(`Breaks: ${summary.shortBreaks} × ${shortBreak} min`);
  }
  if (summary.longBreaks > 0) {
    lines.push(`Long breaks: ${summary.longBreaks} × ${longBreak} min`);
  }

  return (
    <div className="mt-4 text-center text-sm text-muted-foreground space-y-1">
      <p className="font-semibold">Your Pomodoro Schedule</p>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

interface DualTimerProps {
  onStateChange?: (snapshot: TimerSnapshot) => void;
  shieldEnabled: boolean;
  onShieldToggle: (enabled: boolean) => void;
}

export const DualTimer: React.FC<DualTimerProps> = ({ onStateChange, shieldEnabled, onShieldToggle }) => {
  const [mode, setMode] = useState<'regular' | 'pomodoro'>('regular');
  const [regularMinutes, setRegularMinutes] = useState(25);
  const [totalMinutes, setTotalMinutes] = useState(60);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const endRef = useRef<number | null>(null);
  const timerId = useRef<number | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const pipRootRef = useRef<Root | null>(null);
  const pipCleanupRef = useRef<(() => void) | null>(null);
  const popupRef = useRef<Window | null>(null);
  const popupMonitorRef = useRef<number | null>(null);

  const { publishSnapshot, addListener, sendControl, registerFallbackTarget, unregisterFallbackTarget, supportsBroadcastChannel } =
    useMiniTimerPublisher();
  const [miniMode, setMiniMode] = useState<'pip' | 'popup' | null>(null);
  const [miniBusy, setMiniBusy] = useState(false);
  const [pipSupported] = useState(() => typeof window !== 'undefined' && !!window.documentPictureInPicture);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const win = window as unknown as { webkitAudioContext?: typeof AudioContext };
      const Ctx = (window.AudioContext || win.webkitAudioContext) as typeof AudioContext;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current!;
  }, []);

  const playTone = useCallback(
    (freq: number, startOffset = 0) => {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + startOffset;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.15, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.start(start);
      osc.stop(start + 0.18);
    },
    [getAudioCtx]
  );

  const playFocusStart = useCallback(() => {
    const ctx = getAudioCtx();
    ctx.resume();
    playTone(660);
    playTone(880, 0.25);
  }, [getAudioCtx, playTone]);

  const playFocusEnd = useCallback(() => {
    const ctx = getAudioCtx();
    ctx.resume();
    playTone(440);
    playTone(330, 0.25);
    playTone(220, 0.5);
  }, [getAudioCtx, playTone]);

  const [method, setMethod] = useState<'classic' | '50' | '60' | 'custom'>('classic');
  const [focusLen, setFocusLen] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);

  const [longChoice, setLongChoice] = useState<'15' | '30' | 'custom'>('15');
  const [customLong, setCustomLong] = useState(15);
  const [showSettings, setShowSettings] = useState(false);

  const effectiveLongBreak = longChoice === 'custom' ? customLong : parseInt(longChoice, 10);

  useEffect(() => {
    if (method === 'classic') {
      setFocusLen(25);
      setShortBreak(5);
      setLongBreak(15);
    } else if (method === '50') {
      setFocusLen(50);
      setShortBreak(10);
      setLongBreak(15);
    } else if (method === '60') {
      setFocusLen(60);
      setShortBreak(15);
      setLongBreak(20);
    }
  }, [method]);

  const schedule: Segment[] = React.useMemo(
    () =>
      mode === 'pomodoro'
        ? computeSchedule(totalMinutes, focusLen, shortBreak, effectiveLongBreak)
        : [{ type: 'focus', duration: regularMinutes }],
    [mode, totalMinutes, focusLen, shortBreak, effectiveLongBreak, regularMinutes]
  );

  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const settingsVisible = !running && !paused;

  useEffect(() => {
    if (running || paused) return;
    setIndex(0);
    setSecondsLeft(schedule[0]?.duration ? schedule[0].duration * 60 : 0);
  }, [schedule, running, paused]);

  const cleanupPipListeners = useCallback(() => {
    if (pipWindowRef.current && pipCleanupRef.current) {
      pipWindowRef.current.removeEventListener('pagehide', pipCleanupRef.current);
      pipWindowRef.current.removeEventListener('beforeunload', pipCleanupRef.current);
    }
    pipCleanupRef.current = null;
  }, []);

  const cleanupMiniView = useCallback(() => {
    cleanupPipListeners();
    if (pipRootRef.current) {
      pipRootRef.current.unmount();
      pipRootRef.current = null;
    }
    if (pipWindowRef.current) {
      if (!supportsBroadcastChannel) {
        unregisterFallbackTarget(pipWindowRef.current);
      }
      try {
        pipWindowRef.current.close();
      } catch (error) {
        console.debug('[DualTimer] Failed to close PiP window', error);
      }
      pipWindowRef.current = null;
    }
    if (popupMonitorRef.current) {
      window.clearInterval(popupMonitorRef.current);
      popupMonitorRef.current = null;
    }
    if (popupRef.current) {
      if (!supportsBroadcastChannel) {
        unregisterFallbackTarget(popupRef.current);
      }
      try {
        popupRef.current.close();
      } catch (error) {
        console.debug('[DualTimer] Failed to close popup window', error);
      }
      popupRef.current = null;
    }
    setMiniMode(null);
    setMiniBusy(false);
  }, [cleanupPipListeners, unregisterFallbackTarget, supportsBroadcastChannel]);

  const copyStylesToDocument = useCallback((target: Document) => {
    target.head.innerHTML = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
      target.head.appendChild(node.cloneNode(true));
    });
    target.documentElement.className = document.documentElement.className;
  }, []);

  const openPiPWindow = useCallback(async () => {
    if (!pipSupported || !window.documentPictureInPicture?.requestWindow) {
      setMiniBusy(false);
      return false;
    }

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({ width: 260, height: 200 });
      pipWindowRef.current = pipWindow;
      if (!supportsBroadcastChannel) {
        registerFallbackTarget(pipWindow);
      }

      copyStylesToDocument(pipWindow.document);
      pipWindow.document.body.innerHTML = '';
      pipWindow.document.body.className = 'bg-background text-foreground flex min-h-full items-center justify-center';
      pipWindow.document.body.style.margin = '0';

      const container = pipWindow.document.createElement('div');
      container.id = 'mini-timer-root';
      pipWindow.document.body.appendChild(container);

      const root = createRoot(container);
      pipRootRef.current = root;

      const handleClose = () => {
        sendControl('mini-closed');
        cleanupMiniView();
      };
      pipCleanupRef.current = handleClose;
      pipWindow.addEventListener('pagehide', handleClose);
      pipWindow.addEventListener('beforeunload', handleClose);

      root.render(<MiniTimerDisplayWithProvider onRequestClose={cleanupMiniView} showCloseAction />);

      setMiniMode('pip');
      setMiniBusy(false);
      return true;
    } catch (error) {
      console.error('[DualTimer] Unable to open Picture-in-Picture window', error);
      cleanupMiniView();
      setMiniBusy(false);
      return false;
    }
  }, [cleanupMiniView, copyStylesToDocument, pipSupported, registerFallbackTarget, sendControl, supportsBroadcastChannel]);

  const openPopupWindow = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      setMiniBusy(false);
      return true;
    }

    const base = import.meta.env.BASE_URL ?? '/';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    const url = `${window.location.origin}${normalizedBase}mini`;
    const featuresBase = 'width=280,height=220,resizable=no,scrollbars=no';
    const features = supportsBroadcastChannel ? `${featuresBase},noopener,noreferrer` : featuresBase;

    const popup = window.open(url, 'pomodoro-mini-view', features);
    if (!popup) {
      setMiniBusy(false);
      notify('Unable to open mini timer window. Check your popup blocker settings.');
      return false;
    }

    popupRef.current = popup;
    if (!supportsBroadcastChannel) {
      registerFallbackTarget(popup);
    }

    if (popupMonitorRef.current) {
      window.clearInterval(popupMonitorRef.current);
    }
    popupMonitorRef.current = window.setInterval(() => {
      const popupWindow = popupRef.current;
      if (!popupWindow || popupWindow.closed) {
        if (popupMonitorRef.current) {
          window.clearInterval(popupMonitorRef.current);
          popupMonitorRef.current = null;
        }
        cleanupMiniView();
        sendControl('mini-closed');
      }
    }, 1000);

    popup.focus();
    setMiniMode('popup');
    setMiniBusy(false);
    return true;
  }, [cleanupMiniView, registerFallbackTarget, sendControl, supportsBroadcastChannel]);

  const openMiniView = useCallback(async () => {
    if (miniBusy) return;
    if (miniMode === 'pip' && pipWindowRef.current) {
      pipWindowRef.current.focus();
      return;
    }
    if (miniMode === 'popup' && popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      return;
    }

    setMiniBusy(true);
    const pipOpened = await openPiPWindow();
    if (!pipOpened) {
      openPopupWindow();
    }
  }, [miniBusy, miniMode, openPiPWindow, openPopupWindow]);

  const closeMiniView = useCallback(() => {
    sendControl('request-close');
    cleanupMiniView();
  }, [cleanupMiniView, sendControl]);

  const handleSegmentEnd = useCallback(() => {
    if (index + 1 < schedule.length) {
      const next = index + 1;
      const current = schedule[index];
      if (current.type === 'focus') {
        playFocusEnd();
      }
      setIndex(next);
      setSecondsLeft(schedule[next].duration * 60);
      endRef.current = Date.now() + schedule[next].duration * 60 * 1000;
      if (schedule[next].type === 'focus' && mode === 'pomodoro') {
        playFocusStart();
      }
      if (
        current.type === 'focus' &&
        (schedule[next].type === 'break' || schedule[next].type === 'longBreak')
      ) {
        notify('Focus block ended – break starting.');
      } else if (
        current.type !== 'focus' &&
        schedule[next].type === 'focus'
      ) {
        notify('Focus block started – break over.');
      }
    } else {
      if (schedule[index].type === 'focus') {
        playFocusEnd();
      }
      setRunning(false);
    }
  }, [index, schedule, mode, playFocusEnd, playFocusStart]);

  const scheduleTick = useCallback(() => {
    if (timerId.current) {
      clearTimeout(timerId.current);
      timerId.current = null;
    }

    const tick = () => {
      if (!endRef.current) {
        return;
      }

      const diff = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setSecondsLeft(diff);

      if (diff <= 0) {
        handleSegmentEnd();
      } else {
        timerId.current = window.setTimeout(tick, 500);
      }
    };

    timerId.current = window.setTimeout(tick, 0);
  }, [handleSegmentEnd]);

  const handleRegularStartRequest = useCallback(
    (payload: unknown) => {
      let requestedMinutes: number | null = null;
      if (typeof payload === 'number' && Number.isFinite(payload)) {
        requestedMinutes = payload;
      } else if (payload && typeof payload === 'object') {
        const raw = (payload as { minutes?: unknown }).minutes;
        if (typeof raw === 'number' && Number.isFinite(raw)) {
          requestedMinutes = raw;
        } else if (typeof raw === 'string') {
          const parsed = Number(raw);
          if (Number.isFinite(parsed)) {
            requestedMinutes = parsed;
          }
        }
      }

      if (requestedMinutes === null) {
        sendControl('regular-start-error', {
          message: 'Enter a valid number of minutes to start the simple timer.',
        });
        return;
      }

      const sanitizedMinutes =
        Math.round(Math.min(Math.max(requestedMinutes, 1), MAX_REGULAR_MINUTES) * 100) / 100;

      if (!Number.isFinite(sanitizedMinutes) || sanitizedMinutes <= 0) {
        sendControl('regular-start-error', {
          message: 'Use at least one minute for the simple timer.',
        });
        return;
      }

      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => null);
        }

        const totalSeconds = sanitizedMinutes * 60;

        setMode('regular');
        setShowSettings(false);
        setRegularMinutes(sanitizedMinutes);
        setPaused(false);
        setIndex(0);
        setSecondsLeft(totalSeconds);
        endRef.current = Date.now() + totalSeconds * 1000;
        getAudioCtx().resume();
        setRunning(true);
        scheduleTick();

        sendControl('regular-start-success', { minutes: sanitizedMinutes });
      } catch (error) {
        console.error('[DualTimer] Unable to start regular timer from mini view', error);
        sendControl('regular-start-error', {
          message: 'Unable to start the timer automatically. Try again from the main tab.',
        });
      }
    },
    [
      getAudioCtx,
      sendControl,
      setMode,
      setShowSettings,
      setRegularMinutes,
      setPaused,
      setIndex,
      setSecondsLeft,
      setRunning,
      scheduleTick,
    ]
  );

  useEffect(() => {
    return addListener(message => {
      if (message.type !== 'control') return;

      if (message.action === 'mini-closed') {
        cleanupMiniView();
      } else if (message.action === 'regular-start-request') {
        handleRegularStartRequest(message.payload);
      }
    });
  }, [addListener, cleanupMiniView, handleRegularStartRequest]);

  useEffect(() => {
    return () => {
      sendControl('main-closed');
      cleanupMiniView();
    };
  }, [cleanupMiniView, sendControl]);

  useEffect(() => {
    if (!running) {
      return;
    }

    scheduleTick();

    return () => {
      if (timerId.current) {
        clearTimeout(timerId.current);
        timerId.current = null;
      }
    };
  }, [running, scheduleTick]);

  const start = () => {
    if (!schedule.length) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => null);
    }
    setIndex(0);
    setSecondsLeft(schedule[0].duration * 60);
    endRef.current = Date.now() + schedule[0].duration * 60 * 1000;
    getAudioCtx().resume();
    if (schedule[0].type === 'focus' && mode === 'pomodoro') {
      playFocusStart();
    }
    setRunning(true);
    setPaused(false);
  };
  const pause = () => {
    setRunning(false);
    setPaused(true);
    if (secondsLeft > 0) {
      endRef.current = Date.now() + secondsLeft * 1000;
    }
  };
  const resume = () => {
    getAudioCtx().resume();
    if (secondsLeft > 0) {
      endRef.current = Date.now() + secondsLeft * 1000;
    }
    setRunning(true);
    setPaused(false);
  };
  const stop = () => {
    setRunning(false);
    setPaused(false);
    setIndex(0);
    setSecondsLeft(schedule[0]?.duration ? schedule[0].duration * 60 : 0);
    endRef.current = null;
  };

  const focusSegments = useMemo(() => schedule.filter(seg => seg.type === 'focus').length, [schedule]);

  const snapshot = useMemo<TimerSnapshot>(() => {
    const segment = schedule[index] ?? null;
    const segmentDurationSeconds = segment ? segment.duration * 60 : 0;
    const baseTimeLeft = running || paused ? secondsLeft : segmentDurationSeconds;
    const safeTimeLeft = Math.max(0, Math.round(baseTimeLeft));
    const progress = segmentDurationSeconds > 0 ? Math.min(1, Math.max(0, (segmentDurationSeconds - baseTimeLeft) / segmentDurationSeconds)) : 0;
    const completedFocusBefore = schedule.slice(0, index).filter(s => s.type === 'focus').length;
    const focusOrdinal = segment
      ? segment.type === 'focus'
        ? completedFocusBefore + 1
        : completedFocusBefore
      : focusSegments > 0
      ? 1
      : 0;

    let statusLabel: string;
    if (paused) {
      statusLabel = 'Paused';
    } else if (!segment) {
      statusLabel = 'Ready';
    } else if (segment.type === 'focus') {
      statusLabel = running ? 'Focus' : 'Ready';
    } else if (segment.type === 'longBreak') {
      statusLabel = 'Long Break';
    } else {
      statusLabel = 'Break';
    }

    const modeLabel = mode === 'pomodoro' ? 'Pomodoro' : 'Simple Timer';

    return {
      mode,
      running,
      paused,
      segmentType: segment ? segment.type : 'idle',
      segmentIndex: segment ? index : -1,
      segmentCount: schedule.length,
      segmentDuration: segmentDurationSeconds,
      timeLeft: safeTimeLeft,
      progress,
      focusSegmentOrdinal: focusOrdinal,
      totalFocusSegments: focusSegments,
      statusLabel,
      modeLabel,
      updatedAt: Date.now()
    } satisfies TimerSnapshot;
  }, [mode, running, paused, schedule, index, secondsLeft, focusSegments]);

  useEffect(() => {
    publishSnapshot(snapshot);
    onStateChange?.(snapshot);
  }, [snapshot, publishSnapshot, onStateChange]);

  const summary = useMemo(() => summarizeSchedule(schedule, focusLen), [schedule, focusLen]);
  const preview = useMemo(
    () => renderScheduleSummary(summary, focusLen, shortBreak, effectiveLongBreak),
    [summary, focusLen, shortBreak, effectiveLongBreak]
  );
  const miniButtonLabel = miniMode
    ? miniMode === 'pip'
      ? 'Mini view active'
      : 'Popup active'
    : pipSupported
    ? 'Mini view'
    : 'Mini popup';

  return (
    <Card className="p-8 w-full space-y-8 rounded-2xl shadow-lg bg-gradient-to-br from-card via-muted/50 to-background">
      <TimerDisplay
        timeLeft={snapshot.timeLeft}
        progress={snapshot.progress}
        isBreak={snapshot.segmentType === 'break' || snapshot.segmentType === 'longBreak'}
        isPaused={snapshot.paused}
      />
      <div className={`transition-all duration-500 overflow-hidden ${settingsVisible ? 'opacity-100 max-h-[800px]' : 'opacity-0 max-h-0 pointer-events-none'}`}>
        <div className="flex flex-col items-center space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center space-x-2">
              <Label htmlFor="mode">Auto Pomodoro</Label>
              <Switch id="mode" checked={mode === 'pomodoro'} onCheckedChange={c => setMode(c ? 'pomodoro' : 'regular')} />
            </div>
            {mode === 'regular' ? (
              <div className="flex items-center space-x-2">
                <Label htmlFor="regular" className="text-foreground">Minutes</Label>
                <Input id="regular" type="number" min={1} className="w-24" value={regularMinutes} onChange={e => setRegularMinutes(Math.max(1, Number(e.target.value)))} />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Label htmlFor="total" className="text-foreground">Total focus time, min (breaks added automatically)</Label>
                <Input id="total" type="number" min={1} className="w-24" value={totalMinutes} onChange={e => setTotalMinutes(Math.max(1, Number(e.target.value)))} />
              </div>
            )}
          </div>
          {mode === 'pomodoro' && (
            <Button variant="outline" onClick={() => setShowSettings(s => !s)} className="mx-auto">Customize Pomodoro Settings</Button>
          )}
          {mode === 'pomodoro' && showSettings && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="method">Method</Label>
                <Select value={method} onValueChange={v => setMethod(v as 'classic' | '50' | '60' | 'custom')}>
                  <SelectTrigger id="method" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic 25/5</SelectItem>
                    <SelectItem value="50">50/10</SelectItem>
                    <SelectItem value="60">60/15</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {method === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="focus">Focus</Label>
                    <Input id="focus" type="number" min={1} className="w-16" value={focusLen} onChange={e => setFocusLen(Math.max(1, Number(e.target.value)))} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="break">Break</Label>
                    <Input id="break" type="number" min={1} className="w-16" value={shortBreak} onChange={e => setShortBreak(Math.max(1, Number(e.target.value)))} />
                  </div>
                  {totalMinutes >= 120 && (
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="long">Long Break</Label>
                      <Input id="long" type="number" min={1} className="w-16" value={longBreak} onChange={e => setLongBreak(Math.max(1, Number(e.target.value)))} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {mode === 'pomodoro' && totalMinutes >= 120 && (
            <div className="space-y-2">
              <p className="text-sm text-center">Studies show that after 2 hours your effectiveness degrades - choose your long breaks duration.</p>
              <ToggleGroup type="single" value={longChoice} onValueChange={v => v && setLongChoice(v as '15' | '30' | 'custom')} className="flex justify-center">
                <ToggleGroupItem value="15">15 min</ToggleGroupItem>
                <ToggleGroupItem value="30">30 min</ToggleGroupItem>
          <ToggleGroupItem value="custom" className="px-2">
            <Input type="number" min={1} className="w-12" value={customLong} onChange={e => setCustomLong(Math.max(1, Number(e.target.value)))} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      )}

        </div>

        {preview}
      </div>

      {!settingsVisible && (
        <div className="flex items-center justify-center space-x-2 transition-opacity duration-500">
          <Switch id="shield" checked={shieldEnabled} onCheckedChange={onShieldToggle} />
          <Label htmlFor="shield">Distraction Shield</Label>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {!running ? (
          <Button onClick={paused ? resume : start} className="bg-primary hover:bg-primary/90">
            {paused ? 'Resume' : 'Start'}
          </Button>
        ) : (
          <>
            <Button onClick={pause} variant="outline">
              Pause
            </Button>
            <Button onClick={stop} variant="destructive">
              Stop
            </Button>
          </>
        )}
        <Button
          onClick={openMiniView}
          variant={miniMode ? 'secondary' : 'outline'}
          disabled={miniBusy}
          className="flex items-center gap-2"
        >
          <PictureInPicture2 className="h-4 w-4" />
          {miniBusy ? 'Opening…' : miniButtonLabel}
        </Button>
        {miniMode && (
          <Button variant="ghost" size="icon" onClick={closeMiniView} title="Close mini view">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {!pipSupported && (
        <p className="text-center text-xs text-muted-foreground">
          Your browser will open a popup window for the mini view.
        </p>
      )}
    </Card>
  );
};
