'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { Bell, Search, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useOpenClaw } from '@/lib/openclaw/hooks'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () => setTime(format(new Date(), 'HH:mm:ss'))
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="font-mono text-sm text-text-secondary tabular-nums">{time}</span>
  )
}

export default function Header() {
  const { agents, notifications, deals, clients, tasks, searchQuery, setSearchQuery, connectionStatus } = useStore()
  const { reconnect } = useOpenClaw()
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const q = searchQuery.trim().toLowerCase()
  const searchResults = q.length < 2 ? [] : [
    ...deals
      .filter((d) => d.company.toLowerCase().includes(q) || d.contact.toLowerCase().includes(q))
      .slice(0, 3)
      .map((d) => ({ label: d.company, sub: d.contact, href: '/pipeline', type: 'Deal' as const })),
    ...clients
      .filter((c) => c.company.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q))
      .slice(0, 3)
      .map((c) => ({ label: c.company, sub: c.contact, href: '/clients', type: 'Client' as const })),
    ...tasks
      .filter((t) => t.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map((t) => ({ label: t.title, sub: t.status, href: '/tasks', type: 'Task' as const })),
  ]

  const liveAgentStatuses = useStore((s) => s.liveAgentStatuses)
  const liveActive = Object.values(liveAgentStatuses).filter((a) => a.status === 'active').length
  const activeAgents = connectionStatus === 'connected' && liveActive > 0
    ? liveActive
    : agents.filter((a) => a.status === 'active').length
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="h-14 bg-bg-surface border-b border-border flex items-center gap-4 px-4 sticky top-0 z-30">
      {/* Clock */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <LiveClock />
      </div>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Agent Pulse */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse-dot" />
        </div>
        <span className="text-xs font-mono text-success font-medium">{activeAgents}/9 LIVE</span>
      </div>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Gateway connection indicator */}
      <button
        onClick={() => (connectionStatus === 'disconnected' || connectionStatus === 'error') && reconnect()}
        title={connectionStatus === 'connected' ? 'Gateway connected' : connectionStatus === 'connecting' ? 'Connecting to gateway…' : 'Gateway offline — click to reconnect'}
        className={cn(
          'flex items-center gap-1.5 flex-shrink-0 transition-all',
          (connectionStatus === 'disconnected' || connectionStatus === 'error') && 'cursor-pointer hover:opacity-80'
        )}
      >
        {connectionStatus === 'connected' && (
          <><Wifi className="w-3.5 h-3.5 text-success" /><span className="text-[10px] font-mono text-success">GW</span></>
        )}
        {connectionStatus === 'connecting' && (
          <><Loader2 className="w-3.5 h-3.5 text-warning animate-spin" /><span className="text-[10px] font-mono text-warning">GW</span></>
        )}
        {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
          <><WifiOff className="w-3.5 h-3.5 text-danger" /><span className="text-[10px] font-mono text-danger">GW</span></>
        )}
      </button>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Search */}
      <div className="flex-1 max-w-sm relative hidden sm:block" ref={searchRef}>
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted z-10" />
        <input
          type="text"
          placeholder="Search leads, clients, tasks..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true) }}
          onFocus={() => setShowSearch(true)}
          className="w-full bg-bg-card border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50 transition-colors"
        />
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-bg-card border border-border rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => { router.push(r.href); setShowSearch(false); setSearchQuery('') }}
                className="w-full text-left px-3 py-2 hover:bg-bg-elevated transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs text-text-primary">{r.label}</div>
                  <div className="text-[10px] text-text-muted capitalize">{r.sub}</div>
                </div>
                <span className="text-[10px] font-mono text-text-faint px-1.5 py-0.5 bg-bg-surface border border-border rounded flex-shrink-0">
                  {r.type}
                </span>
              </button>
            ))}
          </div>
        )}
        {showSearch && q.length >= 2 && searchResults.length === 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-bg-card border border-border rounded-lg shadow-xl z-50 px-3 py-2">
            <span className="text-xs text-text-muted">No results for "{searchQuery}"</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger rounded-full text-[9px] text-white font-mono flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          GC
        </div>
      </div>
    </header>
  )
}

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, markNotificationRead, clearNotifications } = useStore()

  const typeColors = {
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-danger',
    info: 'text-info',
  }

  return (
    <div className="absolute right-0 top-full mt-1 w-80 bg-bg-card border border-border rounded-lg shadow-xl z-50">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="text-sm font-medium text-text-primary">Notifications</span>
        <button
          onClick={() => { clearNotifications(); onClose() }}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.slice(0, 5).map((n) => (
          <button
            key={n.id}
            onClick={() => markNotificationRead(n.id)}
            className={cn(
              'w-full text-left p-3 hover:bg-bg-elevated border-b border-border/50 transition-colors',
              !n.read && 'bg-bg-surface'
            )}
          >
            <div className="flex items-start gap-2">
              {!n.read && <div className="w-1.5 h-1.5 bg-accent-violet rounded-full mt-1.5 flex-shrink-0" />}
              <div className={cn('flex-1', n.read && 'ml-3.5')}>
                <div className={cn('text-xs font-medium', typeColors[n.type])}>{n.title}</div>
                <div className="text-xs text-text-muted mt-0.5">{n.message}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
