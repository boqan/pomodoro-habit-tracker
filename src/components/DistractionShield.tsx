
import React, { useEffect } from 'react';
import { DistractionLog } from './DistractionLog';

interface DistractionShieldProps {
  timeLeft: number;
  onEscape: () => void;
  isBreak: boolean;
}

export const DistractionShield: React.FC<DistractionShieldProps> = ({
  timeLeft,
  onEscape,
  isBreak
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    // Prevent tab switching and other shortcuts
    const handleKeyDownPrevent = (event: KeyboardEvent) => {
      // Prevent common shortcuts for switching tabs/apps
      if (
        (event.ctrlKey && (event.key === 'Tab' || event.key === 't' || event.key === 'w')) ||
        (event.altKey && event.key === 'Tab') ||
        (event.metaKey && (event.key === 'Tab' || event.key === 't' || event.key === 'w'))
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDownPrevent, true);

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onEscape();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Attempt to focus lock (works best in full browser)
    const originalTabIndex = document.body.tabIndex;
    document.body.tabIndex = -1;

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleKeyDownPrevent, true);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.body.tabIndex = originalTabIndex;
    };
  }, [onEscape]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[110] flex items-center justify-center">
      <div className="text-center text-white space-y-4 flex flex-col items-center">
        <div className="text-8xl font-mono font-bold animate-pulse">
          {formatTime(timeLeft)}
        </div>
        <h2 className="text-2xl font-semibold">
          {isBreak ? 'Break Time' : '🛡️ Focus Mode Active'}
        </h2>
        <p className="text-lg text-gray-300">
          {isBreak ? 'Relax and recharge' : 'Stay focused on your task'}
        </p>
        <div className="text-sm text-gray-400 space-y-1">
          <p>Press ESC to exit distraction shield</p>
          <p className="text-xs opacity-75">
            (Shield blocks shortcuts and tab switching - works best in full browser)
          </p>
        </div>
        <div className="max-w-sm w-full pt-6">
          <DistractionLog visible={!isBreak} />
        </div>
      </div>
    </div>
  );
};
