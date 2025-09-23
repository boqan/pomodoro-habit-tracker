import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TimerDisplay } from './TimerDisplay'
import {
  MiniTimerChannelProvider,
  type MiniTimerControlAction,
  useMiniTimerSubscription
} from '@/hooks/useMiniTimerChannel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MAX_REGULAR_MINUTES } from '@/types/timer'
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

const formatMinutesValue = (value: number) => {
  const normalized = Math.round(value * 100) / 100
  return normalized.toString()
}

export const MiniTimerDisplay: React.FC<MiniTimerDisplayProps> = ({ onRequestClose, showCloseAction = false }) => {
  const sendControlRef = useRef<((action: MiniTimerControlAction, payload?: unknown) => void) | null>(null)
  const [publisherMissing, setPublisherMissing] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [minutesInput, setMinutesInput] = useState('25')
  const [startBusy, setStartBusy] = useState(false)
  const [startStatus, setStartStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleControl = useCallback(
    (action: MiniTimerControlAction, payload?: unknown) => {
      if (action === 'request-close') {
        if (onRequestClose) {
          onRequestClose()
        } else {
          window.close()
        }
        sendControlRef.current?.('mini-closed')
      } else if (action === 'main-closed') {
        setPublisherMissing(true)
        setStartBusy(false)
      } else if (action === 'publisher-reset') {
        setPublisherMissing(false)
        setStartBusy(false)
      } else if (action === 'regular-start-request') {
        // Ignore requests echoed back to this window.
      } else if (action === 'regular-start-success') {
        setStartBusy(false)
        let minutes: number | null = null
        if (payload && typeof payload === 'object') {
          const raw = (payload as { minutes?: unknown }).minutes
          const parsed = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
          if (Number.isFinite(parsed)) {
            minutes = parsed
          }
        }
        if (minutes !== null) {
          const formatted = formatMinutesValue(minutes)
          setMinutesInput(formatted)
          setStartStatus({ type: 'success', message: `Started ${formatted} min timer.` })
        } else {
          setStartStatus({ type: 'success', message: 'Timer started.' })
        }
      } else if (action === 'regular-start-error') {
        setStartBusy(false)
        let message = 'Unable to start a new timer from the mini view.'
        if (payload && typeof payload === 'object' && 'message' in (payload as Record<string, unknown>)) {
          const raw = (payload as { message?: unknown }).message
          if (typeof raw === 'string') {
            message = raw
          }
        }
        setStartStatus({ type: 'error', message })
      }
    },
    [onRequestClose]
  )

  const { snapshot, lastUpdated, sendControl, connected } = useMiniTimerSubscription({ onControl: handleControl })
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

  useEffect(() => {
    if (snapshot.mode !== 'regular') return
    if (snapshot.segmentDuration <= 0) return
    const derivedMinutes = snapshot.segmentDuration / 60
    const formatted = formatMinutesValue(derivedMinutes)
    setMinutesInput(prev => {
      const prevNumber = Number(prev)
      if (Number.isFinite(prevNumber) && Math.abs(prevNumber - derivedMinutes) < 0.01) {
        return prev
      }
      return formatted
    })
  }, [snapshot.mode, snapshot.segmentDuration])

  useEffect(() => {
    if (!startStatus || startStatus.type !== 'success') return
    const timeout = window.setTimeout(() => setStartStatus(null), 2500)
    return () => window.clearTimeout(timeout)
  }, [startStatus])

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

  const regularMode = snapshot.mode === 'regular'
  const parsedMinutes = Number(minutesInput)
  const minutesValid = Number.isFinite(parsedMinutes) && parsedMinutes >= 1 && parsedMinutes <= MAX_REGULAR_MINUTES
  const connectionReady = connected && !publisherMissing && !stale
  const canSubmit = regularMode && connectionReady && minutesValid && !startBusy

  useEffect(() => {
    if (!regularMode || !connectionReady) {
      setStartBusy(false)
    }
  }, [regularMode, connectionReady])

  const handleMinutesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMinutesInput(event.target.value)
    if (startStatus?.type === 'error') {
      setStartStatus(null)
    }
  }

  const handleStartSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (startBusy) return
    if (!regularMode) {
      setStartStatus({
        type: 'error',
        message: 'Switch the main timer to Simple mode to launch it from this window.',
      })
      return
    }
    if (!connectionReady) {
      setStartStatus({
        type: 'error',
        message: 'Reconnect the main timer tab before starting a new countdown.',
      })
      return
    }
    if (!Number.isFinite(parsedMinutes)) {
      setStartStatus({ type: 'error', message: 'Enter a valid number of minutes.' })
      return
    }

    const sanitized = Math.round(Math.min(Math.max(parsedMinutes, 1), MAX_REGULAR_MINUTES) * 100) / 100
    setMinutesInput(formatMinutesValue(sanitized))
    setStartStatus(null)
    setStartBusy(true)
    sendControl('regular-start-request', { minutes: sanitized })
  }

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
      {regularMode ? (
        <form onSubmit={handleStartSubmit} className="flex w-full flex-wrap items-center justify-center gap-2 text-xs">
          <Input
            name="minutes"
            type="number"
            inputMode="decimal"
            min={1}
            max={MAX_REGULAR_MINUTES}
            step="1"
            value={minutesInput}
            onChange={handleMinutesChange}
            className="h-8 w-20 text-center"
            disabled={startBusy}
          />
          <Button type="submit" size="sm" disabled={!canSubmit}>
            Start
          </Button>
        </form>
      ) : (
        <div className="w-full text-center text-xs text-muted-foreground">
          Switch to the Simple timer in the main tab to launch quick sessions from here.
        </div>
      )}
      {startStatus && (
        <div
          className={cn(
            'w-full text-center text-xs',
            startStatus.type === 'error' ? 'text-destructive' : 'text-emerald-500 dark:text-emerald-400',
          )}
        >
          {startStatus.message}
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
