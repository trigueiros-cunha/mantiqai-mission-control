'use client'

import { Deal } from '@/lib/types'
import { useStore } from '@/lib/store'
import { STAGE_CONFIG, PRIORITY_CONFIG, SECTOR_COLORS } from '@/lib/constants'
import { formatEuro, formatDate, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import SlidePanel from '@/components/shared/SlidePanel'
import { ExternalLink, Mail, Phone, Globe, Calendar, TrendingUp } from 'lucide-react'

interface DealDetailProps {
  deal: Deal | null
  onClose: () => void
}

const stages = ['lead', 'contacted', 'diagnosis', 'proposal', 'building', 'delivered'] as const

export default function DealDetail({ deal, onClose }: DealDetailProps) {
  const { moveDeal } = useStore()

  if (!deal) return null

  const stage = STAGE_CONFIG[deal.stage]
  const priority = PRIORITY_CONFIG[deal.priority]
  const sectorColor = SECTOR_COLORS[deal.sector] || '#6d7a96'
  const currentStageIdx = stages.indexOf(deal.stage)

  const handleNextStage = () => {
    if (currentStageIdx < stages.length - 1) {
      moveDeal(deal.id, stages[currentStageIdx + 1])
    }
  }

  return (
    <SlidePanel open={!!deal} onClose={onClose} title={deal.company} width="w-[520px]">
      <div className="space-y-5">
        {/* Stage + Priority */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium',
              stage.bgColor,
              stage.textColor
            )}
          >
            {stage.emoji} {stage.label}
          </span>
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', priority.bgColor, priority.textColor)}>
            {priority.dot} {priority.label}
          </span>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium ml-auto"
            style={{ backgroundColor: `${sectorColor}20`, color: sectorColor }}
          >
            {deal.sector}
          </span>
        </div>

        {/* Contact Info */}
        <div className="bg-bg-surface border border-border rounded-lg p-4 space-y-2">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Contact</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-muted font-medium w-16">Contact</span>
              <span className="text-text-secondary">{deal.contact}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Mail className="w-3 h-3 text-text-muted" />
              <a href={`mailto:${deal.email}`} className="text-accent-violet hover:underline">{deal.email}</a>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Phone className="w-3 h-3 text-text-muted" />
              <span className="text-text-secondary">{deal.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Globe className="w-3 h-3 text-text-muted" />
              <a href={deal.website} target="_blank" rel="noopener noreferrer" className="text-accent-violet hover:underline flex items-center gap-1">
                {deal.website} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3 h-3 text-text-muted" />
              <span className="text-text-muted">{deal.location.city}</span>
            </div>
          </div>
        </div>

        {/* Deal Value */}
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Deal Value</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-success">{formatEuro(deal.value.setup)}</div>
              <div className="text-[10px] text-text-muted">Setup Fee</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-accent-violet">{formatEuro(deal.value.monthly)}</div>
              <div className="text-[10px] text-text-muted">Monthly</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-text-primary">{formatEuro(deal.value.monthly * 12)}</div>
              <div className="text-[10px] text-text-muted">ARR</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-text-muted" />
            <span className="text-xs text-text-muted">Score: </span>
            <div className="flex-1 bg-bg-card rounded-full h-1.5">
              <div className="h-full bg-accent-violet rounded-full" style={{ width: `${deal.score * 10}%` }} />
            </div>
            <span className="text-xs font-mono text-text-secondary">{deal.score}/10</span>
          </div>
        </div>

        {/* Assigned Agents */}
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Assigned Agents</h4>
          <div className="flex flex-wrap gap-2">
            {deal.assignedAgents.map((agentId) => (
              <span key={agentId} className="px-2 py-1 bg-bg-elevated border border-border rounded text-xs text-text-secondary capitalize">
                {agentId}
              </span>
            ))}
          </div>
        </div>

        {/* Notes */}
        {deal.notes.length > 0 && (
          <div className="bg-bg-surface border border-border rounded-lg p-4">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Notes</h4>
            <div className="space-y-2">
              {deal.notes.map((note) => (
                <div key={note.id} className="text-xs text-text-secondary bg-bg-card rounded p-2">
                  <div className="text-text-muted text-[10px] mb-1">{note.author} · {formatDateTime(note.createdAt)}</div>
                  {note.content}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">History</h4>
          <div className="space-y-2">
            {deal.history.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 bg-accent-violet/50 rounded-full mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-text-secondary">{entry.description}</div>
                  <div className="text-text-muted text-[10px]">{formatDateTime(entry.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {currentStageIdx < stages.length - 1 && (
            <button
              onClick={handleNextStage}
              className="flex-1 py-2 bg-accent-violet/15 hover:bg-accent-violet/25 border border-accent-violet/30 rounded-lg text-accent-violet text-xs font-medium transition-all"
            >
              Move to {STAGE_CONFIG[stages[currentStageIdx + 1]].label} →
            </button>
          )}
          <a
            href={`mailto:${deal.email}`}
            className="px-4 py-2 bg-bg-elevated hover:bg-bg-surface border border-border rounded-lg text-text-secondary text-xs font-medium transition-all flex items-center gap-1"
          >
            <Mail className="w-3 h-3" /> Email
          </a>
        </div>
      </div>
    </SlidePanel>
  )
}
