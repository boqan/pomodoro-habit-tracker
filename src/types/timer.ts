export type TimerMode = 'regular' | 'pomodoro'
export type TimerSegmentType = 'focus' | 'break' | 'longBreak'
export type TimerSegmentState = TimerSegmentType | 'idle'

export interface TimerSnapshot {
  mode: TimerMode
  running: boolean
  paused: boolean
  segmentType: TimerSegmentState
  segmentIndex: number
  segmentCount: number
  segmentDuration: number
  timeLeft: number
  progress: number
  focusSegmentOrdinal: number
  totalFocusSegments: number
  statusLabel: string
  modeLabel: string
  updatedAt: number
}

export const initialTimerSnapshot: TimerSnapshot = {
  mode: 'regular',
  running: false,
  paused: false,
  segmentType: 'idle',
  segmentIndex: -1,
  segmentCount: 0,
  segmentDuration: 0,
  timeLeft: 0,
  progress: 0,
  focusSegmentOrdinal: 0,
  totalFocusSegments: 0,
  statusLabel: 'Ready',
  modeLabel: 'Simple Timer',
  updatedAt: 0,
}
