import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TimerDisplay } from './TimerDisplay'
import {
  MiniTimerChannelProvider,
  type MiniTimerControlAction,
  useMiniTimerSubscription
} from '@/hooks/useMiniTimerChannel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MiniTimerDisplayProps {
  onRequestClose?: () => void
  showCloseAction?: boolean
}

const formatCycleLabel = (current: number, total: number) => {
  if (!total) return null
  if (!current) return `Cycle 1 of ${total}`
  return `Cycle ${Math.min(current, total)} of ${total}`
}

export const MiniTimerDisplay: React.FC<MiniTimerDisplayProps> = ({ onRequestClose, showCloseAction = false }) => {
  const sendControlRef = useRef<((action: MiniTimerControlAction, payload?: unknown) => void) | null>(null)
  const [publisherMissing, setPublisherMissing] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const handleControl = useCallback(
    (action: MiniTimerControlAction) => {
      if (action === 'request-close') {
        if (onRequestClose) {
          onRequestClose()
        } else {
          window.close()
        }
        sendControlRef.current?.('mini-closed')
      } else if (action === 'main-closed') {
        setPublisherMissing(true)
      } else if (action === 'publisher-reset') {
        setPublisherMissing(false)
      }
    },
    [onRequestClose]
  )

  const { snapshot, lastUpdated, sendControl } = useMiniTimerSubscription({ onControl: handleControl })
  sendControlRef.current = sendControl

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (snapshot.updatedAt > 0) {
      setPublisherMissing(false)
    }
  }, [snapshot.updatedAt])

  const isBreak = snapshot.segmentType === 'break' || snapshot.segmentType === 'longBreak'
  const cycleLabel = useMemo(() => formatCycleLabel(snapshot.focusSegmentOrdinal, snapshot.totalFocusSegments), [
    snapshot.focusSegmentOrdinal,
    snapshot.totalFocusSegments
  ])

  const stale = snapshot.updatedAt === 0 || now - lastUpdated > 4000
  const statusMessage = useMemo(() => {
    if (publisherMissing) {
      return 'Main timer not detected. Reopen the dashboard to continue.'
    }
    if (snapshot.updatedAt === 0) {
      return 'Waiting for a timer to connect…'
    }
    if (stale) {
      return 'Connection lost. Return to the main timer tab to resume syncing.'
    }
    return null
  }, [publisherMissing, snapshot.updatedAt, stale])

  const handleCloseClick = () => {
    sendControl('mini-closed')
    if (onRequestClose) {
      onRequestClose()
    } else {
      window.close()
    }
  }

  const cardClasses = cn('flex w-full flex-col items-center gap-4 p-4 text-sm text-foreground')

  return (
    <div className={cardClasses}>
      <div className="flex w-full items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
        <span>{snapshot.modeLabel}</span>
        <span>{snapshot.statusLabel}</span>
      </div>
      <TimerDisplay
        timeLeft={snapshot.timeLeft}
        progress={snapshot.progress}
        isBreak={isBreak}
        isPaused={snapshot.paused}
        size="compact"
        className={stale ? 'opacity-60' : undefined}
      />
      {cycleLabel && (
        <div className="text-xs text-muted-foreground">{cycleLabel}</div>
      )}
      {statusMessage && (
        <div className="w-full rounded-md border border-dashed border-muted-foreground/40 bg-background/60 p-2 text-center text-xs text-muted-foreground">
          {statusMessage}
        </div>
      )}
      <div className="flex w-full flex-wrap items-center justify-center gap-2 text-xs">
        <Button variant="ghost" size="sm" asChild>
          <a href="/" target="_blank" rel="noreferrer">
            Open main timer
          </a>
        </Button>
        {showCloseAction && (
          <Button size="sm" variant="secondary" onClick={handleCloseClick}>
            Close mini view
          </Button>
        )}
      </div>
    </div>
  )
}

export const MiniTimerDisplayWithProvider: React.FC<MiniTimerDisplayProps> = props => {
  return (
    <MiniTimerChannelProvider>
      <MiniTimerDisplay {...props} />
    </MiniTimerChannelProvider>
  )
}
