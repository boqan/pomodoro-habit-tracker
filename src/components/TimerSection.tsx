import React from 'react';
import { Card } from '@/components/ui/card';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { TimerSettings } from './TimerSettings';

interface TimerSectionProps {
  timeLeft: number;
  progress: number;
  isRunning: boolean;
  isPaused: boolean;
  isBreak: boolean;
  mode: 'regular' | 'pomodoro';
  focusLength: number;
  breakLength: number;
  totalDuration: number;
  breakCount: number;
  shieldEnabled: boolean;
  onStart: () => void;
  onResume: () => void;
  onPause: () => void;
  onStop: () => void;
  onQuickStart: (task: string) => void;
  onModeChange: (mode: 'regular' | 'pomodoro') => void;
  onFocusLengthChange: (value: number) => void;
  onBreakLengthChange: (value: number) => void;
  onTotalDurationChange: (value: number) => void;
  onShieldToggle: (enabled: boolean) => void;
}

export const TimerSection: React.FC<TimerSectionProps> = ({
  timeLeft,
  progress,
  isRunning,
  isPaused,
  isBreak,
  mode,
  focusLength,
  breakLength,
  totalDuration,
  breakCount,
  shieldEnabled,
  onStart,
  onResume,
  onPause,
  onStop,
  onQuickStart,
  onModeChange,
  onFocusLengthChange,
  onBreakLengthChange,
  onTotalDurationChange,
  onShieldToggle
}) => {
  return (
    <Card className="p-6">
      <div className="text-center space-y-6">
        <TimerSettings
          mode={mode}
          focusLength={focusLength}
          breakLength={breakLength}
          totalDuration={totalDuration}
          breakCount={breakCount}
          shieldEnabled={shieldEnabled}
          onModeChange={onModeChange}
          onFocusLengthChange={onFocusLengthChange}
          onBreakLengthChange={onBreakLengthChange}
          onTotalDurationChange={onTotalDurationChange}
          onShieldToggle={onShieldToggle}
        />

        <TimerDisplay
          timeLeft={timeLeft}
          progress={progress}
          isBreak={isBreak}
          isPaused={isPaused}
        />

        <TimerControls
          isRunning={isRunning}
          isPaused={isPaused}
          onStart={onStart}
          onResume={onResume}
          onPause={onPause}
          onStop={onStop}
          onQuickStart={onQuickStart}
        />
      </div>
    </Card>
  );
};
