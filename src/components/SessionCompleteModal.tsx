
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Trophy, Zap, CheckCircle } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  streak: number;
  lastDone: Date | null;
}

interface SessionCompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent: string;
  earnedXP: number;
  habits: Habit[];
  onMarkHabitDone: (habitId: string) => void;
}

export const SessionCompleteModal: React.FC<SessionCompleteModalProps> = ({
  open,
  onOpenChange,
  intent,
  earnedXP,
  habits,
  onMarkHabitDone
}) => {
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());

  const handleHabitToggle = (habitId: string) => {
    const newSelected = new Set(selectedHabits);
    if (newSelected.has(habitId)) {
      newSelected.delete(habitId);
    } else {
      newSelected.add(habitId);
    }
    setSelectedHabits(newSelected);
  };

  const handleComplete = () => {
    selectedHabits.forEach(habitId => {
      onMarkHabitDone(habitId);
    });
    setSelectedHabits(new Set());
    onOpenChange(false);
  };

  const isCompletedToday = (habit: Habit) => {
    if (!habit.lastDone) return false;
    const today = new Date().toDateString();
    return habit.lastDone.toDateString() === today;
  };

  const availableHabits = habits.filter(habit => !isCompletedToday(habit));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <span>Focus Session Complete!</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Intent Review */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              You accomplished:
            </h4>
            <p className="text-blue-800 dark:text-blue-200 italic">"{intent}"</p>
          </div>

          {/* XP Earned */}
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              +{earnedXP} XP Earned!
            </Badge>
          </div>

          {/* Habit Completion */}
          {availableHabits.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Mark any habits you completed:
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={habit.id}
                      checked={selectedHabits.has(habit.id)}
                      onCheckedChange={() => handleHabitToggle(habit.id)}
                    />
                    <Label htmlFor={habit.id} className="flex-1 cursor-pointer">
                      {habit.name}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {habit.streak} day streak
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Skip
            </Button>
            <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
              <Trophy className="h-4 w-4 mr-2" />
              Complete Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
