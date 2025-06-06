import { useState, useEffect } from 'react';

// Safe UUID generator that works in all environments
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (error) {
      // Fallback if crypto.randomUUID fails
    }
  }
  
  // Fallback UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: Date;
}

interface Habit {
  id: string;
  name: string;
  streak: number;
  lastDone: Date | null;
}

interface Session {
  id: string;
  start: Date;
  length: number;
  intent?: string;
  taskId?: string;
  habitId?: string;
  isBreak: boolean;
}

interface Meta {
  xp: number;
  level: number;
}

const STORAGE_KEYS = {
  TASKS: 'smart-pomodoro-tasks',
  HABITS: 'smart-pomodoro-habits',
  SESSIONS: 'smart-pomodoro-sessions',
  META: 'smart-pomodoro-meta'
};

export const useDatabase = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [meta, setMeta] = useState<Meta>({ xp: 0, level: 0 });

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const loadedHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
    const loadedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    const loadedMeta = localStorage.getItem(STORAGE_KEYS.META);

    if (loadedTasks) {
      setTasks(JSON.parse(loadedTasks, (key, value) => {
        if (key === 'createdAt') return new Date(value);
        return value;
      }));
    }

    if (loadedHabits) {
      setHabits(JSON.parse(loadedHabits, (key, value) => {
        if (key === 'lastDone' && value) return new Date(value);
        return value;
      }));
    }

    if (loadedSessions) {
      setSessions(JSON.parse(loadedSessions, (key, value) => {
        if (key === 'start') return new Date(value);
        return value;
      }));
    }

    if (loadedMeta) {
      setMeta(JSON.parse(loadedMeta));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.META, JSON.stringify(meta));
  }, [meta]);

  // Update habit streaks daily
  useEffect(() => {
    const updateHabitStreaks = () => {
      const today = new Date().toDateString();
      setHabits(prevHabits => 
        prevHabits.map(habit => {
          if (!habit.lastDone) return habit;
          
          const lastDoneDate = habit.lastDone.toDateString();
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayString = yesterday.toDateString();
          
          // Reset streak if last done was not today or yesterday
          if (lastDoneDate !== today && lastDoneDate !== yesterdayString) {
            return { ...habit, streak: 0 };
          }
          
          return habit;
        })
      );
    };

    updateHabitStreaks();
    // Check daily at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeout = setTimeout(() => {
      updateHabitStreaks();
      // Set up daily interval
      setInterval(updateHabitStreaks, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  // Task operations
  const addTask = (title: string) => {
    const newTask: Task = {
      id: generateUUID(),
      title,
      done: false,
      createdAt: new Date()
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  // Habit operations
  const addHabit = (name: string) => {
    const newHabit: Habit = {
      id: generateUUID(),
      name,
      streak: 0,
      lastDone: null
    };
    setHabits(prev => [newHabit, ...prev]);
  };

  const toggleHabit = (id: string) => {
    setHabits(prev => 
      prev.map(habit => {
        if (habit.id !== id) return habit;
        
        const today = new Date().toDateString();
        const isCompletedToday = habit.lastDone?.toDateString() === today;
        
        if (isCompletedToday) {
          // Unchecking today - reset to yesterday's state
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return {
            ...habit,
            lastDone: yesterday,
            streak: Math.max(0, habit.streak - 1)
          };
        } else {
          // Checking today - increment streak
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const wasCompletedYesterday = habit.lastDone?.toDateString() === yesterday.toDateString();
          
          return {
            ...habit,
            lastDone: new Date(),
            streak: wasCompletedYesterday || habit.streak === 0 ? habit.streak + 1 : 1
          };
        }
      })
    );
  };

  // Session operations
  const addSession = (sessionData: Omit<Session, 'id'>) => {
    const newSession: Session = {
      id: generateUUID(),
      ...sessionData
    };
    setSessions(prev => [newSession, ...prev]);
  };

  // Meta operations
  const addXP = (amount: number) => {
    setMeta(prev => ({
      xp: prev.xp + amount,
      level: Math.floor((prev.xp + amount) / 100)
    }));
  };

  return {
    tasks,
    habits,
    sessions,
    meta,
    addTask,
    toggleTask,
    deleteTask,
    addHabit,
    toggleHabit,
    addSession,
    addXP
  };
};
