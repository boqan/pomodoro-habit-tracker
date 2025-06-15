import React, { useState, useEffect } from 'react';
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
  let minutes = total;
  let elapsed = 0;

  while (minutes >= focusLen) {
    schedule.push({ type: 'focus', duration: focusLen });
    minutes -= focusLen;
    elapsed += focusLen;

    if (minutes <= 0) break;

    let breakLen = shortBreak;
    const isLongBreak = elapsed >= 120;
    if (isLongBreak) {
      breakLen = longBreak;
    }

    if (minutes < breakLen) break;
    schedule.push({ type: isLongBreak ? 'longBreak' : 'break', duration: breakLen });
    minutes -= breakLen;
    elapsed += breakLen;

    if (isLongBreak) {
      elapsed = 0;
    }
  }

  if (minutes >= focusLen / 2) {
    schedule.push({ type: 'focus', duration: minutes });
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
  onStateChange?: (running: boolean, isBreak: boolean, timeLeft: number) => void;
  shieldEnabled: boolean;
  onShieldToggle: (enabled: boolean) => void;
}

export const DualTimer: React.FC<DualTimerProps> = ({ onStateChange, shieldEnabled, onShieldToggle }) => {
  const [mode, setMode] = useState<'regular' | 'pomodoro'>('regular');
  const [regularMinutes, setRegularMinutes] = useState(25);
  const [totalMinutes, setTotalMinutes] = useState(60);

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

  // notify parent when running state, segment, or remaining time changes
  useEffect(() => {
    onStateChange?.(running, schedule[index]?.type !== 'focus', secondsLeft);
  }, [onStateChange, running, index, secondsLeft, schedule]);

  const handleSegmentEnd = React.useCallback(() => {
    if (index + 1 < schedule.length) {
      const next = index + 1;
      setIndex(next);
      setSecondsLeft(schedule[next].duration * 60);
    } else {
      setRunning(false);
    }
  }, [index, schedule]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [running, index]);

  useEffect(() => {
    if (running && secondsLeft === 0) {
      handleSegmentEnd();
    }
  }, [secondsLeft, running, handleSegmentEnd]);

  const start = () => {
    if (!schedule.length) return;
    setIndex(0);
    setSecondsLeft(schedule[0].duration * 60);
    setRunning(true);
    setPaused(false);
  };
  const pause = () => {
    setRunning(false);
    setPaused(true);
  };
  const resume = () => {
    setRunning(true);
    setPaused(false);
  };
  const stop = () => {
    setRunning(false);
    setPaused(false);
    setIndex(0);
    setSecondsLeft(0);
  };

  const summary = React.useMemo(() => summarizeSchedule(schedule, focusLen), [schedule, focusLen]);
  const preview = React.useMemo(
    () => renderScheduleSummary(summary, focusLen, shortBreak, effectiveLongBreak),
    [summary, focusLen, shortBreak, effectiveLongBreak]
  );

  return (
    <Card className="p-8 w-full space-y-8 rounded-2xl shadow-lg bg-gradient-to-br from-card via-muted/50 to-background">
      <TimerDisplay
        timeLeft={secondsLeft}
        progress={schedule.length ? (schedule[index].duration * 60 - secondsLeft) / (schedule[index].duration * 60) : 0}
        isBreak={schedule[index]?.type !== 'focus'}
        isPaused={paused}
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
                <Label htmlFor="total" className="text-foreground">Total focus window, min</Label>
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

      <div className="flex justify-center space-x-4">
        {!running ? (
          <Button onClick={paused ? resume : start} className="bg-primary hover:bg-primary/90">
            {paused ? 'Resume' : 'Start'}
          </Button>
        ) : (
          <>
            <Button onClick={pause} variant="outline">Pause</Button>
            <Button onClick={stop} variant="destructive">Stop</Button>
          </>
        )}
      </div>
    </Card>
  );
};
