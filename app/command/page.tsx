'use client'

import { useSystemHealth } from '@/lib/openclaw/hooks'
import { useStore } from '@/lib/store'
import StatCard from '@/components/shared/StatCard'
import ActivityFeed from '@/components/command/ActivityFeed'
import AgentGrid from '@/components/command/AgentGrid'
import PipelineFunnel from '@/components/command/PipelineFunnel'
import WeekCalendar from '@/components/command/WeekCalendar'
import QuickMetrics from '@/components/command/QuickMetrics'
import StatusDot from '@/components/shared/StatusDot'
import { formatEuro, formatNumber } from '@/lib/utils'
import { DAILY_API_BUDGET, MRR_TARGET } from '@/lib/constants'
import { TrendingUp, Bot, CheckSquare, Zap, DollarSign } from 'lucide-react'

export default function CommandPage() {
  const { getTotalMRR, getTotalPipelineValue, getActiveAgents, getOpenTasks, getTodayAPICost, agents, tasks } = useStore()
  
  const metrics = useSystemHealth()
  const totalMRR = getTotalMRR()
  const pipelineValue = getTotalPipelineValue()
  const activeAgents = getActiveAgents()
  const openTasks = getOpenTasks()
  const todayCost = getTodayAPICost()
  const urgentTasks = tasks.filter((t) => t.priority === 'critical' && t.status !== 'done').length

  const mrrProgress = Math.min(100, Math.round((totalMRR / MRR_TARGET) * 100))
  const costProgress = Math.min(100, Math.round((todayCost / DAILY_API_BUDGET) * 100))

  return (
    <div className="p-5 space-y-5 max-w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary">Command Center</h1>
          <p className="text-xs text-text-muted mt-0.5">Your agency at a glance</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse-dot" />
          <span>All systems operational</span>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          title="Pipeline Value"
          value={formatEuro(pipelineValue)}
          trend={12}
          trendLabel="vs last month"
          icon={<TrendingUp className="w-4 h-4" />}
          accent="violet"
        />
        <div className="bg-bg-card border border-border-strong rounded-xl p-4 flex flex-col gap-2 border-success/30 bg-success/5">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">MRR</div>
            <DollarSign className="w-4 h-4 text-text-muted" />
          </div>
          <div className="font-mono text-2xl font-semibold text-text-primary">{formatEuro(totalMRR)}</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-bg-surface rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: `${mrrProgress}%` }} />
            </div>
            <span className="text-xs font-mono text-text-muted">{mrrProgress}%</span>
          </div>
          <span className="text-[10px] text-text-muted">Target: {formatEuro(MRR_TARGET)}/mo</span>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
          <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Agents Online</div>
          <div className="font-mono text-2xl font-semibold text-text-primary">{activeAgents}/9</div>
          <div className="flex gap-1 flex-wrap">
            {agents.map((a) => (
              <StatusDot key={a.id} status={a.status} pulse={a.status === 'active'} />
            ))}
          </div>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Open Tasks</div>
            <CheckSquare className="w-4 h-4 text-text-muted" />
          </div>
          <div className="font-mono text-2xl font-semibold text-text-primary">{openTasks}</div>
          {urgentTasks > 0 && (
            <div className="text-xs text-danger font-medium">⚠️ {urgentTasks} critical</div>
          )}
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">API Cost Today</div>
            <Zap className="w-4 h-4 text-text-muted" />
          </div>
          <div className="font-mono text-2xl font-semibold text-text-primary">{formatEuro(todayCost, 2)}</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-bg-surface rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${costProgress > 80 ? 'bg-danger' : costProgress > 60 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${costProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-text-muted">{costProgress}%</span>
          </div>
          <span className="text-[10px] text-text-muted">Budget: {formatEuro(DAILY_API_BUDGET)}/day</span>
            {metrics.remainingBalance !== null && (
        <span className="text-[10px] text-success font-medium">Balance: ${metrics.remainingBalance}</span>
)}
        </div>
      </div>

      {/* Activity + Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActivityFeed />
        <AgentGrid />
      </div>

      {/* Pipeline + Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PipelineFunnel />
        <WeekCalendar />
      </div>

      {/* Quick Metrics */}
      <QuickMetrics />
    </div>
  )
}
