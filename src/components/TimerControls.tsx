
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { QuickStartDialog } from './QuickStartDialog';

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onResume: () => void;
  onPause: () => void;
  onStop: () => void;
  onQuickStart: (task: string) => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  isPaused,
  onStart,
  onResume,
  onPause,
  onStop,
  onQuickStart
}) => {
  return (
    <div className="flex justify-center space-x-4">
      {!isRunning ? (
        <Button
          onClick={isPaused ? onResume : onStart}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          <Play className="h-5 w-5 mr-2" />
          {isPaused ? 'Resume' : 'Start Focus'}
        </Button>
      ) : (
        <>
          <Button onClick={onPause} variant="outline" size="lg">
            <Pause className="h-5 w-5 mr-2" />
            Pause
          </Button>
          <Button onClick={onStop} variant="destructive" size="lg">
            <Square className="h-5 w-5 mr-2" />
            Stop
          </Button>
        </>
      )}
      
      <QuickStartDialog onSelectTask={onQuickStart} />
    </div>
  );
};
