'use client'

import { useStore } from '@/lib/store'
import { formatEuro } from '@/lib/utils'
import { STAGE_CONFIG } from '@/lib/constants'
import { useRouter } from 'next/navigation'

const stages = ['lead', 'contacted', 'diagnosis', 'proposal', 'building', 'delivered'] as const

export default function PipelineFunnel() {
  const { deals } = useStore()
  const router = useRouter()

  const stageData = stages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage)
    const totalValue = stageDeals.reduce((sum, d) => sum + d.value.setup + d.value.monthly, 0)
    return { stage, count: stageDeals.length, value: totalValue, config: STAGE_CONFIG[stage] }
  })

  const maxCount = Math.max(...stageData.map((s) => s.count), 1)

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Pipeline Snapshot</h3>
        <button
          onClick={() => router.push('/pipeline')}
          className="text-xs text-accent-violet hover:text-accent-violet/80 transition-colors"
        >
          View full →
        </button>
      </div>
      <div className="space-y-1.5">
        {stageData.map(({ stage, count, value, config }) => (
          <button
            key={stage}
            onClick={() => router.push('/pipeline')}
            className="w-full flex items-center gap-3 group hover:bg-bg-surface rounded-lg px-2 py-1.5 transition-all"
          >
            <span className="text-sm w-5 flex-shrink-0">{config.emoji}</span>
            <span className="text-xs text-text-muted w-20 flex-shrink-0 text-left">{config.label}</span>
            <div className="flex-1 bg-bg-surface rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                  backgroundColor: config.color,
                }}
              />
            </div>
            <span className="text-xs font-mono text-text-secondary w-5 text-right flex-shrink-0">{count}</span>
            <span className="text-xs font-mono text-text-muted w-16 text-right flex-shrink-0">{formatEuro(value)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
