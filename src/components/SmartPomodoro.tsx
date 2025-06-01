import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Play, Pause, Square, Shield, Target, Trophy, Zap } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { useTimer } from '../hooks/useTimer';
import { TaskManager } from './TaskManager';
import { HabitTracker } from './HabitTracker';
import { SessionCompleteModal } from './SessionCompleteModal';
import { DistractionShield } from './DistractionShield';
import { Confetti } from './Confetti';
import { QuickStartDialog } from './QuickStartDialog';
import { XPTooltip } from './XPTooltip';
import { DistractionLog } from './DistractionLog';
import { Footer } from './Footer';

const SmartPomodoro = () => {
  const [focusLength, setFocusLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [showIntentDialog, setShowIntentDialog] = useState(false);
  const [intent, setIntent] = useState('');
  const [shieldEnabled, setShieldEnabled] = useState(false);
  const [showShield, setShowShield] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const { 
    timeLeft, 
    isRunning, 
    isBreak, 
    startTimer, 
    pauseTimer, 
    stopTimer,
    progress 
  } = useTimer(focusLength * 60, breakLength * 60);

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

  const handleStart = () => {
    setShowIntentDialog(true);
  };

  const handleQuickStart = (task: string) => {
    setIntent(task);
    startTimer();
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
    startTimer();
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

  const handleSessionComplete = () => {
    setShowShield(false);
    setShowSessionComplete(true);
    
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
    if (!isRunning && timeLeft === 0 && !isBreak) {
      handleSessionComplete();
    }
  }, [isRunning, timeLeft, isBreak]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Validation functions for timer inputs
  const handleFocusLengthChange = (value: number) => {
    const validValue = Math.max(1, Math.min(60, value)); // Min 1, Max 60
    setFocusLength(validValue);
  };

  const handleBreakLengthChange = (value: number) => {
    const validValue = Math.max(1, Math.min(30, value)); // Min 1, Max 30
    setBreakLength(validValue);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {showConfetti && <Confetti />}
      {showShield && <DistractionShield timeLeft={timeLeft} onEscape={() => setShowShield(false)} />}
      
      <div className="container mx-auto px-4 py-6">
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

        {/* Distraction Log - only show when timer is running */}
        <DistractionLog visible={isRunning && !isBreak} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Timer Card */}
          <Card className="p-6">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="flex justify-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="focus-length" className="text-foreground">Focus</Label>
                    <Input
                      id="focus-length"
                      type="number"
                      value={focusLength}
                      onChange={(e) => handleFocusLengthChange(Number(e.target.value))}
                      className="w-20"
                      min="1"
                      max="60"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="break-length" className="text-foreground">Break</Label>
                    <Input
                      id="break-length"
                      type="number"
                      value={breakLength}
                      onChange={(e) => handleBreakLengthChange(Number(e.target.value))}
                      className="w-20"
                      min="1"
                      max="30"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <Switch
                    id="shield"
                    checked={shieldEnabled}
                    onCheckedChange={setShieldEnabled}
                  />
                  <Label htmlFor="shield" className="flex items-center space-x-2 text-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Distraction Shield</span>
                  </Label>
                </div>
                
                {shieldEnabled && (
                  <p className="text-xs text-muted-foreground">
                    Shield will overlay the screen during focus sessions (works best in full browser)
                  </p>
                )}
              </div>

              {/* Circular Timer */}
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
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center space-x-4">
                {!isRunning ? (
                  <Button onClick={handleStart} size="lg" className="bg-primary hover:bg-primary/90">
                    <Play className="h-5 w-5 mr-2" />
                    Start Focus
                  </Button>
                ) : (
                  <>
                    <Button onClick={pauseTimer} variant="outline" size="lg">
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </Button>
                    <Button onClick={stopTimer} variant="destructive" size="lg">
                      <Square className="h-5 w-5 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
                
                <QuickStartDialog onSelectTask={handleQuickStart} />
              </div>
            </div>
          </Card>

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
