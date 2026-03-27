'use client'

import { useRef, useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const typeStyles = {
  success: 'text-success border-success/30',
  warning: 'text-warning border-warning/30',
  error: 'text-danger border-danger/30',
  info: 'text-info border-info/30',
}

const typeBg = {
  success: 'bg-success/5',
  warning: 'bg-warning/5',
  error: 'bg-danger/5',
  info: 'bg-info/5',
}

export default function ActivityFeed() {
  const activity           = useStore((s) => s.activity)
  const connectionStatus   = useStore((s) => s.connectionStatus)
  const listRef            = useRef<HTMLDivElement>(null)
  const prevLengthRef      = useRef(activity.length)
  const [newCount, setNewCount] = useState(0)
  const [atTop, setAtTop]       = useState(true)

  // Track how many new events arrived while user has scrolled away from top
  useEffect(() => {
    if (activity.length > prevLengthRef.current) {
      const delta = activity.length - prevLengthRef.current
      if (!atTop) setNewCount((c) => c + delta)
      prevLengthRef.current = activity.length
    }
  }, [activity.length, atTop])

  const scrollToTop = () => {
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setNewCount(0)
  }

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    setAtTop(el.scrollTop < 32)
    if (el.scrollTop < 32) setNewCount(0)
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl flex flex-col" style={{ height: '320px' }}>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Live Activity</h3>
          {connectionStatus === 'disconnected' || connectionStatus === 'error' ? (
            <span className="text-[10px] font-mono text-danger bg-danger/10 px-1.5 py-0.5 rounded">OFFLINE</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <button
              onClick={scrollToTop}
              className="text-[10px] font-mono text-accent-violet bg-accent-violet/10 hover:bg-accent-violet/20 px-2 py-0.5 rounded transition-all"
            >
              ↑ {newCount} new
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full',
              connectionStatus === 'connected' ? 'bg-success animate-pulse-dot' : 'bg-text-faint'
            )} />
            <span className="text-xs text-text-muted font-mono">LIVE</span>
          </div>
        </div>
      </div>
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="overflow-y-auto flex-1 p-2 space-y-1"
      >
        {activity.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              'flex items-start gap-2.5 px-3 py-2 rounded-lg border text-xs',
              typeBg[entry.type],
              typeStyles[entry.type]
            )}
          >
            <span className="font-mono text-[10px] text-text-muted flex-shrink-0 mt-0.5 w-10">
              {formatTime(entry.timestamp)}
            </span>
            <span className="flex-shrink-0">{entry.agentEmoji}</span>
            <span className="text-text-secondary leading-relaxed">{entry.action}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
