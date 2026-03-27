'use client'

import { Client } from '@/lib/types'
import { PLAN_CONFIG } from '@/lib/constants'
import { formatEuro, formatDate, getHealthColor, getHealthText } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Calendar, Users, TrendingUp } from 'lucide-react'

interface ClientCardProps {
  client: Client
  onClick: () => void
}

export default function ClientCard({ client, onClick }: ClientCardProps) {
  const plan = PLAN_CONFIG[client.plan]
  const healthColor = getHealthColor(client.health)
  const healthText = getHealthText(client.health)

  return (
    <div
      onClick={onClick}
      className="bg-bg-card border border-border rounded-xl p-5 hover:border-accent-violet/30 transition-all cursor-pointer space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border flex items-center justify-center text-lg font-bold text-text-muted">
            {client.company[0]}
          </div>
          <div>
            <div className="font-heading font-semibold text-text-primary text-sm">{client.company}</div>
            <div className="text-xs text-text-muted">{client.sector}</div>
          </div>
        </div>
        <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', plan.bgColor, plan.textColor)}>
          {plan.label}
        </span>
      </div>

      {/* MRR */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted">MRR</div>
          <div className="font-mono text-xl font-bold text-success">{formatEuro(client.mrr)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-muted">Health</div>
          <div className={cn('font-mono text-xl font-bold', healthText)}>{client.health}%</div>
        </div>
      </div>

      {/* Health Bar */}
      <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${client.health}%`, backgroundColor: healthColor }}
        />
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-text-muted">
          <Users className="w-3 h-3" />
          {client.agents} agent{client.agents > 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-1.5 text-text-muted">
          <Calendar className="w-3 h-3" />
          Since {formatDate(client.startDate)}
        </div>
        <div className="flex items-center gap-1.5 text-text-muted col-span-2">
          <TrendingUp className="w-3 h-3" />
          ARR: <span className="text-text-secondary font-mono ml-1">{formatEuro(client.mrr * 12)}</span>
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <span className={cn(
          'text-[10px] px-2 py-0.5 rounded-full font-medium',
          client.status === 'active' ? 'bg-success/10 text-success' :
          client.status === 'at-risk' ? 'bg-warning/10 text-warning' :
          'bg-danger/10 text-danger'
        )}>
          {client.status === 'active' ? '● Active' : client.status === 'at-risk' ? '⚠ At Risk' : '✕ Churned'}
        </span>
      </div>
    </div>
  )
}
