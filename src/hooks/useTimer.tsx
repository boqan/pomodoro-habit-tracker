import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = (focusDuration: number, breakDuration: number) => {
  const [timeLeft, setTimeLeft] = useState(focusDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(focusDuration);
  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number | null>(null);

  // Add isPaused state for UI
  const isPaused = !isRunning && pausedTimeRef.current !== null;

  const progress = sessionDuration > 0 ? (sessionDuration - timeLeft) / sessionDuration : 0;

  const startTimer = useCallback(() => {
    const current = pausedTimeRef.current ?? timeLeft;
    endTimeRef.current = Date.now() + current * 1000;
    setTimeLeft(current);
    pausedTimeRef.current = null;
    setIsRunning(true);
  }, [timeLeft]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    if (endTimeRef.current) {
      const remaining = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000)
      );
      pausedTimeRef.current = remaining;
      setTimeLeft(remaining);
    } else {
      pausedTimeRef.current = timeLeft;
    }
    endTimeRef.current = null;
  }, [timeLeft]);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    pausedTimeRef.current = null;
    setTimeLeft(isBreak ? breakDuration : focusDuration);
    setSessionDuration(isBreak ? breakDuration : focusDuration);
    endTimeRef.current = null;
  }, [isBreak, focusDuration, breakDuration]);

  const switchToBreak = useCallback(() => {
    setIsBreak(true);
    pausedTimeRef.current = null;
    setTimeLeft(breakDuration);
    setSessionDuration(breakDuration);
    setIsRunning(false);
    endTimeRef.current = null;
  }, [breakDuration]);

  const switchToFocus = useCallback(() => {
    setIsBreak(false);
    pausedTimeRef.current = null;
    setTimeLeft(focusDuration);
    setSessionDuration(focusDuration);
    setIsRunning(false);
    endTimeRef.current = null;
  }, [focusDuration]);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const tick = () => {
      if (!endTimeRef.current) return;
      const diff = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        setIsRunning(false);
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      } else {
        timerRef.current = window.setTimeout(tick, 500);
      }
    };

    timerRef.current = window.setTimeout(tick, 0);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning]);

  // Update timer when focus/break duration changes (only if not running AND not paused)
  useEffect(() => {
    if (!isRunning && pausedTimeRef.current === null) {
      const newDuration = isBreak ? breakDuration : focusDuration;
      setTimeLeft(newDuration);
      setSessionDuration(newDuration);
    }
  }, [focusDuration, breakDuration, isBreak, isRunning]);

  return {
    timeLeft,
    isRunning,
    isPaused,
    isBreak,
    progress,
    startTimer,
    pauseTimer,
    stopTimer,
    switchToBreak,
    switchToFocus
  };
};
