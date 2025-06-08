
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface TimerSettingsProps {
  mode: 'regular' | 'pomodoro';
  focusLength: number;
  breakLength: number;
  totalDuration: number;
  breakCount: number;
  shieldEnabled: boolean;
  onModeChange: (mode: 'regular' | 'pomodoro') => void;
  onFocusLengthChange: (value: number) => void;
  onBreakLengthChange: (value: number) => void;
  onTotalDurationChange: (value: number) => void;
  onShieldToggle: (enabled: boolean) => void;
}

export const TimerSettings: React.FC<TimerSettingsProps> = ({
  mode,
  focusLength,
  breakLength,
  totalDuration,
  breakCount,
  shieldEnabled,
  onModeChange,
  onFocusLengthChange,
  onBreakLengthChange,
  onTotalDurationChange,
  onShieldToggle
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-2">
        <Label htmlFor="mode" className="text-foreground">Mode</Label>
        <Select value={mode} onValueChange={(val) => onModeChange(val as 'regular' | 'pomodoro')}>
          <SelectTrigger id="mode" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="pomodoro">Pomodoro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="focus-length" className="text-foreground">Focus</Label>
          <Input
            id="focus-length"
            type="number"
            value={focusLength}
            onChange={(e) => onFocusLengthChange(Number(e.target.value))}
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
            onChange={(e) => onBreakLengthChange(Number(e.target.value))}
            className="w-20"
            min="1"
            max="30"
          />
          <span className="text-sm text-muted-foreground">min</span>
        </div>
        {mode === 'pomodoro' && (
          <div className="flex items-center space-x-2">
            <Label htmlFor="total-duration" className="text-foreground">Total</Label>
            <Input
              id="total-duration"
              type="number"
              value={totalDuration}
              onChange={(e) => onTotalDurationChange(Number(e.target.value))}
              className="w-20"
              min="1"
            />
            <span className="text-sm text-muted-foreground">min</span>
          </div>
        )}
      </div>

      {mode === 'pomodoro' && (
        <p className="text-sm text-muted-foreground text-center">Breaks: {breakCount}</p>
      )}

      <div className="flex items-center justify-center space-x-2">
        <Switch
          id="shield"
          checked={shieldEnabled}
          onCheckedChange={onShieldToggle}
        />
        <Label htmlFor="shield" className="flex items-center space-x-2 text-foreground">
          <Shield className="h-4 w-4" />
          <span>Distraction Shield</span>
        </Label>
      </div>

      {shieldEnabled && (
        <p className="text-xs text-muted-foreground text-center">
          Shield will overlay the screen during focus sessions (works best in full browser)
        </p>
      )}
    </div>
  );
};
