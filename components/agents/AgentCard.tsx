'use client'

import { Agent } from '@/lib/types'
import { useStore } from '@/lib/store'
import { formatEuro, formatTokens, getTelegramUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'
import StatusDot from '@/components/shared/StatusDot'
import Sparkline from '@/components/shared/Sparkline'
import { ExternalLink, MessageSquare, Zap, Clock } from 'lucide-react'
import { AGENT_COLORS } from '@/lib/constants'

interface AgentCardProps {
  agent: Agent
}

export default function AgentCard({ agent }: AgentCardProps) {
  const accentColor  = AGENT_COLORS[agent.id] || '#a78bfa'
  const sparkData    = agent.dailyHistory.slice(-7).map((d) => d.messages)

  const live             = useStore((s) => s.liveAgentStatuses[agent.id])
  const connectionStatus = useStore((s) => s.connectionStatus)
  const isLive = connectionStatus === 'connected'

  const status   = (isLive && live?.status)       ? live.status          : agent.status
  const messages = (isLive && live?.messagesTotal) ? live.messagesTotal   : agent.stats.messages
  const tokens   = agent.stats.tokens // gateway doesn't yet surface per-agent token counts
  const cost     = (isLive && live?.costToday)     ? live.costToday       : agent.stats.cost
  const thinking = isLive && !!live?.isThinking

  return (
    <div
      className={cn(
        'bg-bg-card border border-border rounded-xl p-5 flex flex-col gap-4 transition-all hover:border-opacity-60 relative overflow-hidden',
        status === 'error' && 'pulse-border border-danger/40',
      )}
      style={{ borderTopColor: accentColor, borderTopWidth: '2px' }}
    >
      {/* thinking shimmer overlay */}
      {thinking && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-violet/5 to-transparent animate-shimmer pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
          >
            {agent.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-text-primary">{agent.name}</span>
              <StatusDot status={status} pulse={status === 'active'} />
              {thinking && (
                <span className="flex items-center gap-0.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-1 h-1 rounded-full bg-accent-violet animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
              )}
            </div>
            <div className="text-xs text-text-muted">{agent.role}</div>
          </div>
        </div>
        <a
          href={getTelegramUrl(agent.telegramBot)}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-bg-elevated border border-border transition-all text-text-muted hover:text-text-secondary"
          title="Open in Telegram"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Model Badge */}
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 bg-bg-surface border border-border rounded text-[10px] font-mono text-text-muted">
          {agent.model.includes('haiku') ? 'Haiku 4.5' : 'Sonnet 4.6'}
        </span>
        <span className={cn(
          'px-2 py-0.5 rounded text-[10px] font-medium',
          status === 'active' ? 'bg-success/10 text-success' :
          status === 'idle'   ? 'bg-warning/10 text-warning' :
                                 'bg-danger/10 text-danger'
        )}>
          {status.toUpperCase()}
        </span>
        {isLive && (
          <span className="px-1.5 py-0.5 bg-accent-violet/10 text-accent-violet rounded text-[10px] font-mono">LIVE</span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-surface rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3 h-3 text-text-muted" />
            <span className="text-[10px] text-text-muted">Messages</span>
          </div>
          <div className="font-mono text-sm font-semibold text-text-primary">{messages}</div>
        </div>
        <div className="bg-bg-surface rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-text-muted" />
            <span className="text-[10px] text-text-muted">Tokens</span>
          </div>
          <div className="font-mono text-sm font-semibold text-text-primary">{formatTokens(tokens)}</div>
        </div>
        <div className="bg-bg-surface rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] text-text-muted">Cost Today</span>
          </div>
          <div className="font-mono text-sm font-semibold text-success">{formatEuro(cost, 2)}</div>
        </div>
        <div className="bg-bg-surface rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-text-muted" />
            <span className="text-[10px] text-text-muted">Avg Response</span>
          </div>
          <div className="font-mono text-sm font-semibold text-text-primary">{agent.stats.avgResponseTime}s</div>
        </div>
      </div>

      {/* Sparkline */}
      <div>
        <div className="text-[10px] text-text-muted mb-1.5">7-day activity</div>
        <Sparkline data={sparkData} color={accentColor} height={36} width={undefined as any} />
      </div>

      {/* Telegram Link */}
      <a
        href={getTelegramUrl(agent.telegramBot)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-2 border border-border rounded-lg text-xs text-text-muted hover:text-text-secondary hover:border-border-strong transition-all"
      >
        <ExternalLink className="w-3 h-3" />
        Open in Telegram
      </a>
    </div>
  )
}
