import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = (focusDuration: number, breakDuration: number) => {
  const [timeLeft, setTimeLeft] = useState(focusDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(focusDuration);
  const intervalRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number | null>(null);

  const progress = sessionDuration > 0 ? (sessionDuration - timeLeft) / sessionDuration : 0;

  const startTimer = useCallback(() => {
    if (pausedTimeRef.current !== null) {
      setTimeLeft(pausedTimeRef.current);
      pausedTimeRef.current = null;
    }
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    pausedTimeRef.current = timeLeft;
  }, [timeLeft]);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    pausedTimeRef.current = null;
    setTimeLeft(isBreak ? breakDuration : focusDuration);
    setSessionDuration(isBreak ? breakDuration : focusDuration);
  }, [isBreak, focusDuration, breakDuration]);

  const switchToBreak = useCallback(() => {
    setIsBreak(true);
    pausedTimeRef.current = null;
    setTimeLeft(breakDuration);
    setSessionDuration(breakDuration);
    setIsRunning(false);
  }, [breakDuration]);

  const switchToFocus = useCallback(() => {
    setIsBreak(false);
    pausedTimeRef.current = null;
    setTimeLeft(focusDuration);
    setSessionDuration(focusDuration);
    setIsRunning(false);
  }, [focusDuration]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            
            // Vibrate if supported
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Update timer when focus/break duration changes (only if not running)
  // When pausing the timer we don't want to reset the remaining time, so
  // exclude `isRunning` from the dependency list. This ensures the timer
  // updates only when the durations themselves change while the timer is not
  // actively counting down.
  useEffect(() => {
    if (!isRunning) {
      const newDuration = isBreak ? breakDuration : focusDuration;
      setTimeLeft(newDuration);
      setSessionDuration(newDuration);
    }
  }, [focusDuration, breakDuration, isBreak, isRunning]);

  return {
    timeLeft,
    isRunning,
    isBreak,
    progress,
    startTimer,
    pauseTimer,
    stopTimer,
    switchToBreak,
    switchToFocus
  };
};
