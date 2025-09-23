import React from 'react';
import { Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimerDisplaySize = 'default' | 'compact';

interface TimerDisplayProps {
  timeLeft: number;
  progress: number;
  isBreak: boolean;
  isPaused?: boolean;
  size?: TimerDisplaySize;
  className?: string;
}

const sizeStyles: Record<TimerDisplaySize, { container: string; time: string; label: string; icon: string; track: number; arc: number }> = {
  default: {
    container: 'w-64 h-64',
    time: 'text-4xl',
    label: 'text-sm',
    icon: 'w-8 h-8',
    track: 2,
    arc: 4
  },
  compact: {
    container: 'w-40 h-40',
    time: 'text-3xl',
    label: 'text-xs',
    icon: 'w-6 h-6',
    track: 1.5,
    arc: 3
  }
};

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLeft,
  progress,
  isBreak,
  isPaused = false,
  size = 'default',
  className
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const variant = sizeStyles[size];
  const safeProgress = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const safeTime = Number.isFinite(timeLeft) ? Math.max(0, Math.round(timeLeft)) : 0;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn('relative mx-auto', variant.container, className)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth={variant.track}
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth={variant.arc}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - safeProgress)}
          className={`transition-all duration-1000 ${isBreak ? 'text-green-500' : 'text-primary'}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={cn('font-mono font-bold text-foreground', variant.time)}>
            {formatTime(safeTime)}
          </div>
          <div className={cn('text-muted-foreground', variant.label)}>
            {isBreak ? 'Break Time' : 'Focus Time'}
          </div>
        </div>
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px] flex items-center justify-center rounded-full">
          <div className="flex flex-col items-center space-y-2">
            <Pause className={cn('text-muted-foreground', variant.icon)} />
            <span className="text-sm font-medium text-muted-foreground">Paused</span>
          </div>
        </div>
      )}
    </div>
  );
};
