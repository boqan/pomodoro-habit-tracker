
import React, { useEffect } from 'react';

interface DistractionShieldProps {
  timeLeft: number;
  onEscape: () => void;
}

export const DistractionShield: React.FC<DistractionShieldProps> = ({
  timeLeft,
  onEscape
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center text-white space-y-4">
        <div className="text-8xl font-mono font-bold animate-pulse">
          {formatTime(timeLeft)}
        </div>
        <h2 className="text-2xl font-semibold">Focus Mode Active</h2>
        <p className="text-lg text-gray-300">Stay focused on your task</p>
        <p className="text-sm text-gray-400">Press ESC to exit distraction shield</p>
      </div>
    </div>
  );
};
