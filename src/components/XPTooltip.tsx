
import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { HelpCircle, Zap, Trophy, Target } from 'lucide-react';

export const XPTooltip: React.FC = () => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="h-4 w-4" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Leveling System
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span>+10 XP per completed focus session</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3 text-green-500" />
              <span>100 XP = 1 Level</span>
            </div>
            <p className="text-muted-foreground text-xs mt-2">
              Level up to unlock confetti celebrations and track your productivity progress!
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
