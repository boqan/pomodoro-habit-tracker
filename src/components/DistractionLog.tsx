
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { HelpCircle, Plus, X } from 'lucide-react';

interface DistractionLogProps {
  visible: boolean;
}

export const DistractionLog: React.FC<DistractionLogProps> = ({ visible }) => {
  const [distractions, setDistractions] = useState<string[]>([]);
  const [newDistraction, setNewDistraction] = useState('');

  const addDistraction = () => {
    if (newDistraction.trim()) {
      setDistractions([...distractions, newDistraction.trim()]);
      setNewDistraction('');
    }
  };

  const removeDistraction = (index: number) => {
    setDistractions(distractions.filter((_, i) => i !== index));
  };

  if (!visible) return null;

  return (
    <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-medium text-orange-900 dark:text-orange-100">
          Distraction Log
        </h3>
        <HoverCard>
          <HoverCardTrigger asChild>
            <button className="text-orange-600 hover:text-orange-700 dark:text-orange-400">
              <HelpCircle className="h-4 w-4" />
            </button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-semibold">Building Awareness</h4>
              <p className="text-sm text-muted-foreground">
                Research shows that simply acknowledging distractions increases metacognitive awareness, 
                helping you recognize patterns and reduce their frequency over time.
              </p>
              <p className="text-xs text-muted-foreground italic">
                "Mindful awareness of distracting thoughts without judgment reduces their disruptive power" 
                - Mindfulness-Based Attention Training studies
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={newDistraction}
            onChange={(e) => setNewDistraction(e.target.value)}
            placeholder="What distracted you?"
            onKeyDown={(e) => e.key === 'Enter' && addDistraction()}
            className="flex-1 bg-white dark:bg-gray-800"
          />
          <Button 
            onClick={addDistraction} 
            size="sm"
            variant="outline"
            className="border-orange-300 hover:bg-orange-100 dark:border-orange-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {distractions.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {distractions.map((distraction, index) => (
              <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded text-sm">
                <span className="text-gray-700 dark:text-gray-300">{distraction}</span>
                <Button
                  onClick={() => removeDistraction(index)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
