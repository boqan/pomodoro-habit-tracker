
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash, Plus } from 'lucide-react';

interface QuickStartDialogProps {
  onSelectTask: (task: string) => void;
}

const defaultTasks = [
  "Read one article or chapter",
  "Clear email inbox", 
  "Write for 25 minutes",
  "Plan tomorrow's tasks",
  "Organize workspace",
  "Review project notes",
  "Research topic for 25 minutes",
  "Practice a skill"
];

export const QuickStartDialog: React.FC<QuickStartDialogProps> = ({ onSelectTask }) => {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('quickStartTasks');
    return saved ? JSON.parse(saved) : defaultTasks;
  });
  const [newTask, setNewTask] = useState('');

  const saveTasks = (updatedTasks: string[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('quickStartTasks', JSON.stringify(updatedTasks));
  };

  const addTask = () => {
    if (newTask.trim()) {
      saveTasks([...tasks, newTask.trim()]);
      setNewTask('');
    }
  };

  const deleteTask = (index: number) => {
    saveTasks(tasks.filter((_, i) => i !== index));
  };

  const selectTask = (task: string) => {
    setOpen(false);
    onSelectTask(task);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          Quick Start
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>2-Minute Rule Quick Start</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add custom quick task..."
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              className="flex-1"
            />
            <Button onClick={addTask} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tasks.map((task, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <Button
                  variant="ghost"
                  className="flex-1 justify-start h-auto p-2 text-left"
                  onClick={() => selectTask(task)}
                >
                  {task}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTask(index)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
