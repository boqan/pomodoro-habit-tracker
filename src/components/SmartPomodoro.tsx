
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Settings, Target, Trophy, Zap } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { useTimer } from '../hooks/useTimer';
import { TaskManager } from './TaskManager';
import { HabitTracker } from './HabitTracker';
import { SessionCompleteModal } from './SessionCompleteModal';
import { DistractionShield } from './DistractionShield';
import { Confetti } from './Confetti';
import { XPTooltip } from './XPTooltip';
import { DistractionLog } from './DistractionLog';
import { Footer } from './Footer';
import { DualTimer } from './DualTimer';

const SmartPomodoro = () => {
  const [focusLength, setFocusLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [totalDuration, setTotalDuration] = useState(60);
  const [mode, setMode] = useState<'regular' | 'pomodoro'>('regular');
  const [currentCycle, setCurrentCycle] = useState(1);
  const [showIntentDialog, setShowIntentDialog] = useState(false);
  const [intent, setIntent] = useState('');
  const [shieldEnabled, setShieldEnabled] = useState(false);
  const [showShield, setShowShield] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);

  const { 
    timeLeft, 
    isRunning, 
    isBreak, 
    startTimer,
    pauseTimer,
    stopTimer,
    switchToBreak,
    switchToFocus,
    progress
  } = useTimer(focusLength * 60, breakLength * 60);

  const isPaused = sessionStarted && !isRunning && timeLeft > 0;

  const cycles = Math.max(1, Math.floor(totalDuration / focusLength));
  const breakCount = Math.max(0, cycles - 1);

  const {
    tasks,
    habits,
    meta,
    addTask,
    toggleTask,
    deleteTask,
    addHabit,
    toggleHabit,
    addXP,
    sessions,
    addSession
  } = useDatabase();

  const level = Math.floor(meta.xp / 100);
  const xpProgress = meta.xp % 100;

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Show or hide the overlay when the shield toggle changes
  useEffect(() => {
    if (shieldEnabled) {
      setShowShield(true);
    } else {
      setShowShield(false);
    }
  }, [shieldEnabled]);

  const handleStart = () => {
    setShowIntentDialog(true);
  };

  const handleResume = () => {
    startTimer();
    if (shieldEnabled) {
      setShowShield(true);
    }
  };

  const handleQuickStart = (task: string) => {
    setIntent(task);
    switchToFocus();
    setCurrentCycle(1);
    startTimer();
    setSessionStarted(true);
    if (shieldEnabled) {
      setShowShield(true);
    }
    addSession({
      start: new Date(),
      length: focusLength * 60,
      intent: task,
      isBreak: false
    });
  };

  const handleIntentSubmit = () => {
    setShowIntentDialog(false);
    switchToFocus();
    setCurrentCycle(1);
    startTimer();
    setSessionStarted(true);
    if (shieldEnabled) {
      setShowShield(true);
    }
    addSession({
      start: new Date(),
      length: focusLength * 60,
      intent,
      isBreak: false
    });
  };

  const handleStop = () => {
    stopTimer();
    switchToFocus();
    setShowShield(false);
    setSessionStarted(false);
    setCurrentCycle(1);
  };

  const handleSessionComplete = () => {
    setShowShield(false);
    setShowSessionComplete(true);
    setSessionStarted(false);
    
    // Only award XP if the session was at least 1 minute long
    if (focusLength >= 1) {
      // Calculate new level before and after XP addition
      const currentLevel = Math.floor(meta.xp / 100);
      addXP(10);
      const newLevel = Math.floor((meta.xp + 10) / 100);
      
      // Show confetti if level increased - longer duration
      if (newLevel > currentLevel) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 7000); // 7 seconds instead of 3
      }
    }
  };

  useEffect(() => {
    if (isRunning || timeLeft !== 0) return;

    if (mode !== 'pomodoro') {
      if (!isBreak) handleSessionComplete();
      return;
    }

    const sessionComplete = () => handleSessionComplete();

    if (isBreak) {
      if (currentCycle >= cycles) return sessionComplete();
      switchToFocus();
    } else {
      if (currentCycle >= cycles) return sessionComplete();
      setCurrentCycle((c) => c + 1);
      switchToBreak();
    }

    startTimer();
  }, [isRunning, timeLeft, isBreak, mode, cycles, currentCycle]);

  // Validation functions for timer inputs
  const handleFocusLengthChange = (value: number) => {
    const validValue = Math.max(1, Math.min(60, value)); // Min 1, Max 60
    setFocusLength(validValue);
  };

  const handleBreakLengthChange = (value: number) => {
    const validValue = Math.max(1, Math.min(30, value)); // Min 1, Max 30
    setBreakLength(validValue);
  };

  const handleTotalDurationChange = (value: number) => {
    const validValue = Math.max(1, value);
    setTotalDuration(validValue);
  };

  const handleModeChange = (val: 'regular' | 'pomodoro') => {
    setMode(val);
    setCurrentCycle(1);
    switchToFocus();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {showConfetti && <Confetti />}

      {showShield && (
        <DistractionShield
          timeLeft={timeLeft}
          onEscape={() => {
            setShowShield(false);
            setShieldEnabled(false);
          }}
        />
      )}
      
      <div className="container mx-auto px-4 py-6 flex-grow">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Smart Pomodoro 2.0</h1>
            </div>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Trophy className="h-4 w-4" />
              <span>Level {level}</span>
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <div className="w-32">
                <Progress value={xpProgress} className="h-2" />
              </div>
              <span className="text-sm text-muted-foreground">{meta.xp} XP</span>
              <XPTooltip />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>{darkMode ? 'Light' : 'Dark'}</span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Timer Card */}
          <DualTimer />

          {/* Tasks and Habits */}
          <Card className="p-6">
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="habits">Habits</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks" className="mt-6">
                <TaskManager 
                  tasks={tasks}
                  onAddTask={addTask}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                />
              </TabsContent>
              
              <TabsContent value="habits" className="mt-6">
                <HabitTracker 
                  habits={habits}
                  onAddHabit={addHabit}
                  onToggleHabit={toggleHabit}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Distraction Log - only show when timer is running */}
        <div className="my-8 w-full lg:w-1/2 mx-auto">
          <DistractionLog visible={isRunning && !isBreak} />
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Intent Dialog */}
      <Dialog open={showIntentDialog} onOpenChange={setShowIntentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Your Focus Intent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="intent" className="text-foreground">In this session I will...</Label>
            <Textarea
              id="intent"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="Be specific about what you want to accomplish"
              className="min-h-[100px]"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowIntentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleIntentSubmit} disabled={!intent.trim()}>
                Start Focus Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Complete Modal */}
      <SessionCompleteModal
        open={showSessionComplete}
        onOpenChange={setShowSessionComplete}
        intent={intent}
        earnedXP={10}
        habits={habits}
        onMarkHabitDone={toggleHabit}
      />
    </div>
  );
};

export default SmartPomodoro;
