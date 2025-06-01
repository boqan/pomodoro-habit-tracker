
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
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

  const handleStart = () => {
    setShowIntentDialog(true);
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
    addXP(10);
    
    // Check for level up
    const newLevel = Math.floor((meta.xp + 10) / 100);
    if (newLevel > level) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
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

  const quickStartTasks = [
    "Read one article or chapter",
    "Clear email inbox",
    "Write for 25 minutes",
    "Plan tomorrow's tasks",
    "Organize workspace",
    "Review project notes",
    "Research topic for 25 minutes",
    "Practice a skill"
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {showConfetti && <Confetti />}
      {showShield && <DistractionShield timeLeft={timeLeft} onEscape={() => setShowShield(false)} />}
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Pomodoro 2.0</h1>
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
              <span className="text-sm text-gray-600 dark:text-gray-300">{meta.xp} XP</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timer Card */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="flex justify-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="focus-length">Focus</Label>
                    <Input
                      id="focus-length"
                      type="number"
                      value={focusLength}
                      onChange={(e) => setFocusLength(Number(e.target.value))}
                      className="w-20"
                      min="1"
                      max="60"
                    />
                    <span className="text-sm text-gray-500">min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="break-length">Break</Label>
                    <Input
                      id="break-length"
                      type="number"
                      value={breakLength}
                      onChange={(e) => setBreakLength(Number(e.target.value))}
                      className="w-20"
                      min="1"
                      max="30"
                    />
                    <span className="text-sm text-gray-500">min</span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <Switch
                    id="shield"
                    checked={shieldEnabled}
                    onCheckedChange={setShieldEnabled}
                  />
                  <Label htmlFor="shield" className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Distraction Shield</span>
                  </Label>
                </div>
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
                    className="text-gray-200 dark:text-gray-700"
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
                    className={`transition-all duration-1000 ${isBreak ? 'text-green-500' : 'text-blue-500'}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {isBreak ? 'Break Time' : 'Focus Time'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center space-x-4">
                {!isRunning ? (
                  <Button onClick={handleStart} size="lg" className="bg-blue-600 hover:bg-blue-700">
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
                
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="lg">
                      Quick Start
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>2-Minute Rule Quick Start</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 space-y-2">
                      {quickStartTasks.map((task, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setIntent(task);
                            handleIntentSubmit();
                          }}
                        >
                          {task}
                        </Button>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </Card>

          {/* Tasks and Habits */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
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

      {/* Intent Dialog */}
      <Dialog open={showIntentDialog} onOpenChange={setShowIntentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Your Focus Intent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="intent">In this session I will...</Label>
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
