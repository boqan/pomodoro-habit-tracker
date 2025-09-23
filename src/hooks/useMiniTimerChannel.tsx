import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { initialTimerSnapshot, type TimerSnapshot } from '@/types/timer'

export type MiniTimerControlAction =
  | 'request-close'
  | 'mini-closed'
  | 'main-closed'
  | 'publisher-reset'

export type MiniTimerMessage =
  | { type: 'snapshot'; snapshot: TimerSnapshot }
  | { type: 'control'; action: MiniTimerControlAction; payload?: unknown }

interface MiniTimerChannelContextValue {
  publishSnapshot: (snapshot: TimerSnapshot) => void
  sendControl: (action: MiniTimerControlAction, payload?: unknown) => void
  addListener: (listener: (message: MiniTimerMessage) => void) => () => void
  getLastSnapshot: () => TimerSnapshot
  registerFallbackTarget: (win: Window | null | undefined) => void
  unregisterFallbackTarget: (win: Window | null | undefined) => void
  supportsBroadcastChannel: boolean
}

const MiniTimerChannelContext = createContext<MiniTimerChannelContextValue | null>(null)

const CHANNEL_IDENTIFIER = 'pomodoro-mini-timer-channel'
const FALLBACK_EVENT_KEY = '__pomodoro_mini_timer__'

type Listener = (message: MiniTimerMessage) => void

export const MiniTimerChannelProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const listenersRef = useRef<Set<Listener>>(new Set())
  const fallbackTargetsRef = useRef<Set<Window>>(new Set())
  const lastSnapshotRef = useRef<TimerSnapshot>(initialTimerSnapshot)
  const broadcastRef = useRef<BroadcastChannel | null>(null)

  const supportsBroadcastChannel = useMemo(() => typeof window !== 'undefined' && 'BroadcastChannel' in window, [])

  const deliverMessage = useCallback((message: MiniTimerMessage) => {
    if (message.type === 'snapshot') {
      lastSnapshotRef.current = message.snapshot
    }
    listenersRef.current.forEach(listener => {
      try {
        listener(message)
      } catch (error) {
        console.error('[MiniTimerChannel] listener error', error)
      }
    })
  }, [])

  useEffect(() => {
    if (!supportsBroadcastChannel) return

    const channel = new BroadcastChannel(CHANNEL_IDENTIFIER)
    broadcastRef.current = channel

    const handleMessage = (event: MessageEvent<MiniTimerMessage>) => {
      if (!event.data) return
      deliverMessage(event.data)
    }

    channel.addEventListener('message', handleMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
      broadcastRef.current = null
    }
  }, [supportsBroadcastChannel, deliverMessage])

  useEffect(() => {
    if (supportsBroadcastChannel) return

    const handleMessage = (event: MessageEvent) => {
      const data = event.data
      if (!data || typeof data !== 'object') return
      if ((data as { key?: string }).key !== FALLBACK_EVENT_KEY) return
      const payload = (data as { message?: MiniTimerMessage }).message
      if (!payload) return
      deliverMessage(payload)
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [supportsBroadcastChannel, deliverMessage])

  const postFallbackMessage = useCallback(
    (message: MiniTimerMessage) => {
      const payload = { key: FALLBACK_EVENT_KEY, message }
      const targets = Array.from(fallbackTargetsRef.current)
      targets.forEach(target => {
        if (!target || target.closed) {
          fallbackTargetsRef.current.delete(target)
          return
        }
        try {
          target.postMessage(payload, '*')
        } catch (error) {
          console.error('[MiniTimerChannel] postMessage failed', error)
        }
      })
    },
    []
  )

  const publishSnapshot = useCallback(
    (snapshot: TimerSnapshot) => {
      const message: MiniTimerMessage = { type: 'snapshot', snapshot }
      deliverMessage(message)
      if (supportsBroadcastChannel && broadcastRef.current) {
        broadcastRef.current.postMessage(message)
      } else {
        postFallbackMessage(message)
      }
    },
    [deliverMessage, supportsBroadcastChannel, postFallbackMessage]
  )

  const sendControl = useCallback(
    (action: MiniTimerControlAction, payload?: unknown) => {
      const message: MiniTimerMessage = { type: 'control', action, payload }
      deliverMessage(message)
      if (supportsBroadcastChannel && broadcastRef.current) {
        broadcastRef.current.postMessage(message)
      } else {
        postFallbackMessage(message)
      }
    },
    [deliverMessage, supportsBroadcastChannel, postFallbackMessage]
  )

  const addListener = useCallback((listener: Listener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const getLastSnapshot = useCallback(() => lastSnapshotRef.current, [])

  const registerFallbackTarget = useCallback(
    (win: Window | null | undefined) => {
      if (!win || supportsBroadcastChannel) return
      fallbackTargetsRef.current.add(win)
    },
    [supportsBroadcastChannel]
  )

  const unregisterFallbackTarget = useCallback((win: Window | null | undefined) => {
    if (!win || supportsBroadcastChannel) return
    fallbackTargetsRef.current.delete(win)
  }, [supportsBroadcastChannel])

  const value = useMemo<MiniTimerChannelContextValue>(
    () => ({
      publishSnapshot,
      sendControl,
      addListener,
      getLastSnapshot,
      registerFallbackTarget,
      unregisterFallbackTarget,
      supportsBroadcastChannel,
    }),
    [publishSnapshot, sendControl, addListener, getLastSnapshot, registerFallbackTarget, unregisterFallbackTarget, supportsBroadcastChannel]
  )

  return <MiniTimerChannelContext.Provider value={value}>{children}</MiniTimerChannelContext.Provider>
}

const useMiniTimerChannelContext = () => {
  const context = useContext(MiniTimerChannelContext)
  if (!context) {
    throw new Error('useMiniTimerChannel must be used within a MiniTimerChannelProvider')
  }
  return context
}

export const useMiniTimerPublisher = () => {
  const context = useMiniTimerChannelContext()
  return {
    publishSnapshot: context.publishSnapshot,
    sendControl: context.sendControl,
    addListener: context.addListener,
    registerFallbackTarget: context.registerFallbackTarget,
    unregisterFallbackTarget: context.unregisterFallbackTarget,
    supportsBroadcastChannel: context.supportsBroadcastChannel,
  }
}

interface SubscriptionOptions {
  onControl?: (action: MiniTimerControlAction, payload?: unknown) => void
}

export const useMiniTimerSubscription = (options?: SubscriptionOptions) => {
  const context = useMiniTimerChannelContext()
  const controlRef = useRef(options?.onControl)
  controlRef.current = options?.onControl

  const [snapshot, setSnapshot] = React.useState<TimerSnapshot>(() => context.getLastSnapshot())
  const [lastUpdated, setLastUpdated] = React.useState<number>(() => context.getLastSnapshot().updatedAt)

  useEffect(() => {
    return context.addListener(message => {
      if (message.type === 'snapshot') {
        setSnapshot(message.snapshot)
        setLastUpdated(message.snapshot.updatedAt)
      } else if (message.type === 'control') {
        controlRef.current?.(message.action, message.payload)
      }
    })
  }, [context])

  const connected = lastUpdated > 0

  return {
    snapshot,
    lastUpdated,
    connected,
    sendControl: context.sendControl,
    supportsBroadcastChannel: context.supportsBroadcastChannel,
  }
}
