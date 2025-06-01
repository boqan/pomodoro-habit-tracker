
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Flame } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  streak: number;
  lastDone: Date | null;
}

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (name: string) => void;
  onToggleHabit: (id: string) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits,
  onAddHabit,
  onToggleHabit
}) => {
  const [newHabit, setNewHabit] = useState('');

  const handleAddHabit = () => {
    if (newHabit.trim()) {
      onAddHabit(newHabit.trim());
      setNewHabit('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddHabit();
    }
  };

  const isCompletedToday = (habit: Habit) => {
    if (!habit.lastDone) return false;
    const today = new Date().toDateString();
    return habit.lastDone.toDateString() === today;
  };

  const StreakRing: React.FC<{ streak: number; completed: boolean }> = ({ streak, completed }) => {
    const circumference = 2 * Math.PI * 20;
    const progress = Math.min(streak / 30, 1); // Max ring at 30 day streak
    const strokeDashoffset = circumference - (progress * circumference);

    return (
      <div className="relative w-12 h-12">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-500 ${
              completed ? 'text-orange-500' : 'text-gray-400'
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center">
            <Flame className={`h-4 w-4 ${completed ? 'text-orange-500' : 'text-gray-400'}`} />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {streak}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Daily Habits</h3>
        <Badge variant="secondary">
          {habits.filter(h => isCompletedToday(h)).length}/{habits.length} today
        </Badge>
      </div>

      <div className="flex space-x-2">
        <Input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a daily habit..."
          className="flex-1"
        />
        <Button onClick={handleAddHabit} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {habits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No habits yet. Start building good ones!</p>
          </div>
        ) : (
          habits.map((habit) => {
            const completed = isCompletedToday(habit);
            return (
              <div
                key={habit.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                  completed
                    ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                    : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                <StreakRing streak={habit.streak} completed={completed} />
                
                <div className="flex-1">
                  <div className={`font-medium transition-all duration-200 ${
                    completed
                      ? 'text-orange-700 dark:text-orange-300'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {habit.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {habit.streak} day streak
                  </div>
                </div>

                <Button
                  onClick={() => onToggleHabit(habit.id)}
                  variant={completed ? "default" : "outline"}
                  size="sm"
                  className={completed ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  {completed ? 'Done Today' : 'Mark Done'}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
