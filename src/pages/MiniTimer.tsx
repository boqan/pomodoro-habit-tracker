import React from 'react'
import { Helmet } from 'react-helmet-async'
import { MiniTimerDisplay } from '@/components/MiniTimerDisplay'

const MiniTimer = () => {
  return (
    <>
      <Helmet>
        <title>Pomodoro Mini Timer</title>
        <meta name="description" content="Compact floating timer for Smart Pomodoro." />
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-xs rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-lg">
          <MiniTimerDisplay showCloseAction />
        </div>
      </div>
    </>
  )
}

export default MiniTimer
