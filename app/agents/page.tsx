'use client'

import { useStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import AgentCard from '@/components/agents/AgentCard'
import TokenChart from '@/components/agents/TokenChart'
import { formatEuro, formatTokens } from '@/lib/utils'

interface UsageData {
  date: string
  totalTokens: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  byModel: Record<string, { inputTokens: number; outputTokens: number; cost: number; requests: number }>
  rawEntries: number
}

export default function AgentsPage() {
  const { agents } = useStore()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [usageLoading, setUsageLoading] = useState(true)

  const activeCount = agents.filter((a) => a.status === 'active').length

  // Fallback to mock data when API data isn't available
  const mockTotalCost = agents.reduce((sum, a) => sum + a.stats.cost, 0)
  const mockTotalMessages = agents.reduce((sum, a) => sum + a.stats.messages, 0)
  const mockTotalTokens = agents.reduce((sum, a) => sum + a.stats.tokens, 0)

  useEffect(() => {
    fetch('/api/anthropic/usage')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setUsage(data)
      })
      .catch(() => {})
      .finally(() => setUsageLoading(false))
  }, [])

  const displayCost = usage?.totalCost ?? mockTotalCost
  const displayTokens = usage?.totalTokens ?? mockTotalTokens
  const displayMessages = usage?.rawEntries ?? mockTotalMessages
  const isRealData = !!usage

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary">Agents</h1>
          <p className="text-xs text-text-muted">Your AI agent fleet — 9 specialized intelligences</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRealData ? 'bg-success animate-pulse' : 'bg-text-faint'}`} />
          <span className="text-xs text-text-muted">
            {usageLoading ? 'Loading real usage...' : isRealData ? 'Live Anthropic data' : 'Estimated data'}
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active Now', value: `${activeCount}/9`, color: 'text-success' },
          {
            label: 'API Calls Today',
            value: usageLoading ? '—' : displayMessages.toString(),
            color: 'text-accent-violet',
          },
          {
            label: 'Tokens Used',
            value: usageLoading ? '—' : formatTokens(displayTokens),
            color: 'text-info',
          },
          {
            label: 'Cost Today',
            value: usageLoading ? '—' : formatEuro(displayCost, 2),
            color: 'text-warning',
          },
        ].map((s) => (
          <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-text-muted mb-1">{s.label}</div>
            <div className={`font-mono text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Real Usage Breakdown — only shown when real data is available */}
      {usage && Object.keys(usage.byModel).length > 0 && (
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            Usage by Model
            <span className="text-[10px] font-mono bg-success/10 text-success px-2 py-0.5 rounded-full">LIVE</span>
          </h3>
          <div className="space-y-2">
            {Object.entries(usage.byModel).map(([model, stats]) => (
              <div key={model} className="flex items-center gap-3 text-xs">
                <span className="font-mono text-text-secondary w-48 truncate">{model}</span>
                <div className="flex-1 bg-bg-surface rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-accent-violet rounded-full"
                    style={{ width: `${Math.min(100, (stats.cost / usage.totalCost) * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-text-muted w-20 text-right">{formatTokens(stats.inputTokens + stats.outputTokens)}</span>
                <span className="font-mono text-warning w-16 text-right">{formatEuro(stats.cost, 3)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <span>Total today ({usage.date})</span>
            <span className="font-mono text-text-secondary">
              {formatTokens(usage.totalTokens)} tokens · {formatEuro(usage.totalCost, 2)}
            </span>
          </div>
        </div>
      )}

      {/* Agent Grid */}
      <div className="grid grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Charts */}
      <TokenChart />

      {/* Alert Log */}
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Recent Alerts</h3>
        <div className="space-y-2">
          {[
            { agent: 'Keeper', msg: 'Response time spike on Casa Porto Premium — auto-resolved', time: '11:42', color: 'text-warning' },
            { agent: 'QA', msg: 'Test blocked: waiting on Developer to complete WhatsApp integration', time: '10:15', color: 'text-warning' },
            { agent: 'Builder', msg: 'Idle state — no tasks assigned since 09:00', time: '09:05', color: 'text-info' },
          ].map((alert, i) => (
            <div key={i} className="flex items-start gap-3 bg-bg-surface border border-border rounded-lg px-3 py-2.5 text-xs">
              <span className={`font-medium flex-shrink-0 ${alert.color}`}>{alert.agent}</span>
              <span className="text-text-muted flex-1">{alert.msg}</span>
              <span className="font-mono text-text-faint flex-shrink-0">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
