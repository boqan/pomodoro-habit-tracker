import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  longBreak: number,
  interval: number
): Segment[] {
  const schedule: Segment[] = [];
  let minutes = total;
  let cycle = 0;
  let timeElapsed = 0;
  let nextLongMark = 120;

  while (minutes >= focusLen) {
    schedule.push({ type: 'focus', duration: focusLen });
    minutes -= focusLen;
    timeElapsed += focusLen;
    cycle++;

    if (minutes <= 0) break;

    let breakLen = shortBreak;
    if (cycle % interval === 0) breakLen = longBreak;
    if (timeElapsed >= nextLongMark) {
      breakLen = longBreak;
      nextLongMark += 120;
    }

    if (minutes < breakLen) break;
    schedule.push({ type: breakLen === longBreak ? 'longBreak' : 'break', duration: breakLen });
    minutes -= breakLen;
    timeElapsed += breakLen;
  }

  if (minutes >= focusLen / 2) {
    schedule.push({ type: 'focus', duration: minutes });
  }
  return schedule;
}

function describeSchedule(schedule: Segment[], focusLen: number, shortBreak: number, longBreak: number) {
  let focusCount = 0;
  let breakCount = 0;
  let longBreakCount = 0;
  schedule.forEach((s) => {
    if (s.type === 'focus') focusCount++;
    else if (s.type === 'break') breakCount++;
    else longBreakCount++;
  });
  const parts = [`You will work ${focusCount} × ${focusLen} min`];
  if (breakCount > 0) parts.push(`${breakCount} × ${shortBreak} min breaks`);
  if (longBreakCount > 0) parts.push(`${longBreakCount} × ${longBreak} min long breaks`);
  if (schedule.length && schedule[schedule.length - 1].duration !== focusLen) {
    const extra = schedule[schedule.length - 1];
    if (extra.type === 'focus' && extra.duration !== focusLen) {
      parts.push(`final focus ${extra.duration} min`);
    }
  }
  return parts.join(' with ') + '.';
}

export const DualTimer: React.FC = () => {
  const [mode, setMode] = useState<'regular' | 'pomodoro'>('regular');
  const [regularMinutes, setRegularMinutes] = useState(25);
  const [totalMinutes, setTotalMinutes] = useState(60);

  const [method, setMethod] = useState<'classic' | '50' | '60' | 'custom'>('classic');
  const [focusLen, setFocusLen] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [interval, setIntervalCount] = useState(4);

  const [longChoice, setLongChoice] = useState<'15' | '30' | 'custom'>('15');
  const [customLong, setCustomLong] = useState(15);
  const [showSettings, setShowSettings] = useState(false);
  const [shieldEnabled, setShieldEnabled] = useState(false);

  const effectiveLongBreak = longChoice === 'custom' ? customLong : parseInt(longChoice, 10);

  useEffect(() => {
    if (method === 'classic') {
      setFocusLen(25);
      setShortBreak(5);
      setLongBreak(15);
      setIntervalCount(4);
    } else if (method === '50') {
      setFocusLen(50);
      setShortBreak(10);
      setLongBreak(15);
      setIntervalCount(3);
    } else if (method === '60') {
      setFocusLen(60);
      setShortBreak(15);
      setLongBreak(20);
      setIntervalCount(2);
    }
  }, [method]);

  const schedule: Segment[] = React.useMemo(
    () =>
      mode === 'pomodoro'
        ? computeSchedule(totalMinutes, focusLen, shortBreak, effectiveLongBreak, interval)
        : [{ type: 'focus', duration: regularMinutes }],
    [mode, totalMinutes, focusLen, shortBreak, effectiveLongBreak, interval, regularMinutes]
  );

  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const settingsVisible = !running && !paused;

  const handleSegmentEnd = React.useCallback(() => {
    if (index + 1 < schedule.length) {
      const next = index + 1;
      setIndex(next);
      setSecondsLeft(schedule[next].duration * 60);
      setRunning(true);
    } else {
      setRunning(false);
    }
  }, [index, schedule]);
      
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          handleSegmentEnd();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, handleSegmentEnd]);

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

  const preview = describeSchedule(schedule, focusLen, shortBreak, effectiveLongBreak);

  return (
    <Card className="p-6 space-y-6">
      <div className={`transition-all duration-500 overflow-hidden ${settingsVisible ? 'opacity-100 max-h-[800px]' : 'opacity-0 max-h-0 pointer-events-none'}`}> 
        <div className="flex flex-col items-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="mode">Auto Pomodoro</Label>
              <Switch id="mode" checked={mode === 'pomodoro'} onCheckedChange={c => setMode(c ? 'pomodoro' : 'regular')} />
            </div>
            {mode === 'regular' ? (
              <div className="flex items-center space-x-2">
                <Label htmlFor="regular" className="text-foreground">Minutes</Label>
                <Input id="regular" type="number" className="w-24" value={regularMinutes} onChange={e => setRegularMinutes(Number(e.target.value))} />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Label htmlFor="total" className="text-foreground">Total focus window, min</Label>
                <Input id="total" type="number" className="w-24" value={totalMinutes} onChange={e => setTotalMinutes(Number(e.target.value))} />
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
                    <Input id="focus" type="number" className="w-16" value={focusLen} onChange={e => setFocusLen(Number(e.target.value))} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="break">Break</Label>
                    <Input id="break" type="number" className="w-16" value={shortBreak} onChange={e => setShortBreak(Number(e.target.value))} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="long">Long Break</Label>
                    <Input id="long" type="number" className="w-16" value={longBreak} onChange={e => setLongBreak(Number(e.target.value))} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="interval">Blocks before long break</Label>
                    <Input id="interval" type="number" className="w-16" value={interval} onChange={e => setIntervalCount(Number(e.target.value))} />
                  </div>
                </div>
              )}
            </div>
          )}
          {mode === 'pomodoro' && totalMinutes > 120 && (
            <div className="space-y-2">
              <p className="text-sm text-center">Studies show that after 2 hours your effectiveness degrades - choose your long breaks duration.</p>
              <ToggleGroup type="single" value={longChoice} onValueChange={v => v && setLongChoice(v as '15' | '30' | 'custom')} className="flex justify-center">
                <ToggleGroupItem value="15">15 min</ToggleGroupItem>
                <ToggleGroupItem value="30">30 min</ToggleGroupItem>
          <ToggleGroupItem value="custom" className="px-2">
            <Input type="number" className="w-12" value={customLong} onChange={e => setCustomLong(Number(e.target.value))} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      )}

        </div>

        <Alert className="mt-4">
          <AlertDescription>{preview}</AlertDescription>
        </Alert>
      </div>

      {!settingsVisible && (
        <div className="flex items-center justify-center space-x-2 transition-opacity duration-500">
          <Switch id="shield" checked={shieldEnabled} onCheckedChange={setShieldEnabled} />
          <Label htmlFor="shield">Distraction Shield</Label>
        </div>
      )}

      <TimerDisplay timeLeft={secondsLeft} progress={schedule.length ? (schedule[index].duration * 60 - secondsLeft) / (schedule[index].duration * 60) : 0} isBreak={schedule[index]?.type !== 'focus'} isPaused={paused} />

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
