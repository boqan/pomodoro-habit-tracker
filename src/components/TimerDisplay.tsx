import React from 'react';
import { Pause } from 'lucide-react';

interface TimerDisplayProps {
  timeLeft: number;
  progress: number;
  isBreak: boolean;
  isPaused?: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLeft,
  progress,
  isBreak,
  isPaused = false
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 45}`}
          strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress)}`}
          className={`transition-all duration-1000 ${isBreak ? 'text-green-500' : 'text-primary'}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-foreground">
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-muted-foreground">
            {isBreak ? 'Break Time' : 'Focus Time'}
          </div>
        </div>
      </div>
      
      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px] flex items-center justify-center rounded-full">
          <div className="flex flex-col items-center space-y-2">
            <Pause className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Paused</span>
          </div>
        </div>
      )}
    </div>
  );
};
