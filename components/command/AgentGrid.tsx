'use client'

import { useStore } from '@/lib/store'
import { formatEuro, getTelegramUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'
import StatusDot from '@/components/shared/StatusDot'
import { ExternalLink } from 'lucide-react'

export default function AgentGrid() {
  const agents             = useStore((s) => s.agents)
  const liveStatuses       = useStore((s) => s.liveAgentStatuses)
  const connectionStatus   = useStore((s) => s.connectionStatus)
  const isLive = connectionStatus === 'connected'

  return (
    <div className="bg-bg-card border border-border rounded-xl flex flex-col" style={{ height: '320px' }}>
      <div className="px-4 py-3 border-b border-border flex-shrink-0 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Agent Status</h3>
        {isLive && (
          <span className="text-[10px] font-mono text-success bg-success/10 px-1.5 py-0.5 rounded">LIVE</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-3 gap-2">
          {agents.map((agent) => {
            const live     = liveStatuses[agent.id]
            const status   = (isLive && live?.status) ? live.status : agent.status
            const messages = live?.messagesTotal ?? agent.stats.messages
            const cost     = live?.costToday     ?? agent.stats.cost
            const thinking = isLive && !!live?.isThinking

            return (
              <a
                key={agent.id}
                href={getTelegramUrl(agent.telegramBot)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'bg-bg-surface border border-border rounded-lg p-2.5 flex flex-col gap-1 hover:border-accent-violet/40 transition-all cursor-pointer group relative overflow-hidden',
                  status === 'error' && 'pulse-border border-danger/40',
                )}
              >
                {/* thinking shimmer */}
                {thinking && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-violet/5 to-transparent animate-shimmer pointer-events-none" />
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg">{agent.emoji}</span>
                  <div className="flex items-center gap-1">
                    {thinking && (
                      <span className="w-1 h-1 rounded-full bg-accent-violet animate-bounce" style={{ animationDelay: '0ms' }} />
                    )}
                    <StatusDot status={status} pulse={status === 'active'} />
                  </div>
                </div>
                <div className="text-xs font-medium text-text-primary truncate">{agent.name}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-mono">{messages} msgs</span>
                  <span className="text-[10px] text-text-muted font-mono">{formatEuro(cost, 2)}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-text-faint group-hover:text-accent-violet transition-colors" />
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
