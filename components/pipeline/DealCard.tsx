'use client'

import { Deal } from '@/lib/types'
import { PRIORITY_CONFIG, SECTOR_COLORS } from '@/lib/constants'
import { formatEuro } from '@/lib/utils'
import { cn } from '@/lib/utils'
import StatusDot from '@/components/shared/StatusDot'
import { Clock } from 'lucide-react'

interface DealCardProps {
  deal: Deal
  onClick: () => void
  isDragging?: boolean
}

export default function DealCard({ deal, onClick, isDragging }: DealCardProps) {
  const priority = PRIORITY_CONFIG[deal.priority]
  const sectorColor = SECTOR_COLORS[deal.sector] || '#6d7a96'

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-accent-violet/40 transition-all space-y-2',
        isDragging && 'opacity-80 rotate-1 shadow-2xl',
        deal.priority === 'critical' && 'border-l-2 border-l-danger'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-text-primary truncate">{deal.company}</div>
          <div className="text-[11px] text-text-muted truncate">{deal.contact}</div>
        </div>
        <span className="text-sm flex-shrink-0">{priority.dot}</span>
      </div>

      {/* Sector + Score */}
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ backgroundColor: `${sectorColor}20`, color: sectorColor }}
        >
          {deal.sector}
        </span>
        <span className="text-[10px] font-mono text-text-muted ml-auto">
          Score: <span className="text-text-secondary">{deal.score}/10</span>
        </span>
      </div>

      {/* Value */}
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs text-success">{formatEuro(deal.value.setup + deal.value.monthly)}</div>
        <div className="text-[10px] text-text-muted">
          {formatEuro(deal.value.setup)} + {formatEuro(deal.value.monthly)}/mo
        </div>
      </div>

      {/* Agents + Days */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {deal.assignedAgents.slice(0, 3).map((agentId) => (
            <div
              key={agentId}
              className="w-5 h-5 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-[9px] text-text-muted"
            >
              {agentId[0].toUpperCase()}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-text-muted">
          <Clock className="w-3 h-3" />
          {deal.daysInStage}d
        </div>
      </div>
    </div>
  )
}
