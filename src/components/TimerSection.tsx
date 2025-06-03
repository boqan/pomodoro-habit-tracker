
import React from 'react';
import { Card } from '@/components/ui/card';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { TimerSettings } from './TimerSettings';

interface TimerSectionProps {
  timeLeft: number;
  progress: number;
  isRunning: boolean;
  isBreak: boolean;
  focusLength: number;
  breakLength: number;
  shieldEnabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onQuickStart: (task: string) => void;
  onFocusLengthChange: (value: number) => void;
  onBreakLengthChange: (value: number) => void;
  onShieldToggle: (enabled: boolean) => void;
}

export const TimerSection: React.FC<TimerSectionProps> = ({
  timeLeft,
  progress,
  isRunning,
  isBreak,
  focusLength,
  breakLength,
  shieldEnabled,
  onStart,
  onPause,
  onStop,
  onQuickStart,
  onFocusLengthChange,
  onBreakLengthChange,
  onShieldToggle
}) => {
  return (
    <Card className="p-6">
      <div className="text-center space-y-6">
        <TimerSettings
          focusLength={focusLength}
          breakLength={breakLength}
          shieldEnabled={shieldEnabled}
          onFocusLengthChange={onFocusLengthChange}
          onBreakLengthChange={onBreakLengthChange}
          onShieldToggle={onShieldToggle}
        />

        <TimerDisplay
          timeLeft={timeLeft}
          progress={progress}
          isBreak={isBreak}
        />

        <TimerControls
          isRunning={isRunning}
          onStart={onStart}
          onPause={onPause}
          onStop={onStop}
          onQuickStart={onQuickStart}
        />
      </div>
    </Card>
  );
};
