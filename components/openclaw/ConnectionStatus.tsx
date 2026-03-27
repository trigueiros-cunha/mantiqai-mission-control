'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useOpenClaw, useSystemHealth } from '@/lib/openclaw/hooks'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff, Loader2, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react'

function formatUptime(seconds: number): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatTime(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function ConnectionStatus() {
  const { status, reconnect } = useOpenClaw()
  const metrics    = useSystemHealth()
  const lastConnected = useStore((s) => s.lastConnected)
  const [expanded, setExpanded] = useState(false)
  const [ping, setPing]         = useState<number | null>(null)

  // Measure round-trip by timing a /health fetch
  useEffect(() => {
    if (status !== 'connected') { setPing(null); return }
    const measure = async () => {
      const t0 = Date.now()
      try {
        await fetch('/api/gateway/health', { cache: 'no-store' })
        setPing(Date.now() - t0)
      } catch { setPing(null) }
    }
    measure()
    const t = setInterval(measure, 30_000)
    return () => clearInterval(t)
  }, [status])

  const dot = {
    connected:    'bg-success',
    connecting:   'bg-warning animate-pulse',
    disconnected: 'bg-danger',
    error:        'bg-danger',
  }[status]

  const label = {
    connected:    'Connected',
    connecting:   'Connecting…',
    disconnected: 'Offline',
    error:        'Error',
  }[status]

  const Icon = status === 'connected'
    ? Wifi
    : status === 'connecting'
    ? Loader2
    : WifiOff

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1">
      {/* Expanded panel */}
      {expanded && (
        <div className="bg-bg-card border border-border rounded-xl shadow-2xl w-60 p-3 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text-primary">OpenClaw Gateway</span>
            <span className={cn(
              'px-1.5 py-0.5 rounded font-mono text-[10px]',
              status === 'connected'    ? 'bg-success/10 text-success' :
              status === 'connecting'   ? 'bg-warning/10 text-warning' :
                                          'bg-danger/10 text-danger'
            )}>{label.toUpperCase()}</span>
          </div>

          <div className="space-y-1.5 text-text-muted">
            {ping !== null && (
              <Row label="Ping" value={`${ping} ms`} />
            )}
            {metrics.uptime > 0 && (
              <Row label="Gateway uptime" value={formatUptime(metrics.uptime)} />
            )}
            {metrics.activeAgents > 0 && (
              <Row label="Active agents" value={`${metrics.activeAgents}/${metrics.totalAgents}`} />
            )}
            {metrics.activeSessions > 0 && (
              <Row label="Sessions" value={String(metrics.activeSessions)} />
            )}
            {lastConnected && (
              <Row label="Last connected" value={formatTime(lastConnected)} />
            )}
          </div>

          {(status === 'disconnected' || status === 'error') && (
            <button
              onClick={reconnect}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-accent-violet/40 transition-all text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              Reconnect
            </button>
          )}

          {status === 'disconnected' && (
            <p className="text-[10px] text-text-faint text-center">
              Using cached / local data
            </p>
          )}
        </div>
      )}

      {/* Pill button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg text-xs font-medium transition-all',
          status === 'connected'
            ? 'bg-bg-card border-success/30 text-success hover:border-success/60'
            : status === 'connecting'
            ? 'bg-bg-card border-warning/30 text-warning hover:border-warning/60'
            : 'bg-bg-card border-danger/30 text-danger hover:border-danger/60'
        )}
      >
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dot)} />
        <Icon className={cn('w-3 h-3', status === 'connecting' && 'animate-spin')} />
        <span>OpenClaw</span>
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="font-mono text-text-secondary">{value}</span>
    </div>
  )
}
