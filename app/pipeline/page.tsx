'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import KanbanBoard from '@/components/pipeline/KanbanBoard'
import NewDealForm from '@/components/pipeline/NewDealForm'
import { formatEuro } from '@/lib/utils'
import { SECTOR_COLORS } from '@/lib/constants'
import { Plus, Search, Filter } from 'lucide-react'

const sectors = ['All', 'Restaurants', 'Hospitality', 'Healthcare', 'Technology', 'Retail', 'Real Estate', 'E-commerce', 'Education', 'Finance']
const priorities = ['All', 'critical', 'high', 'medium', 'low']

export default function PipelinePage() {
  const { deals, getTotalPipelineValue } = useStore()
  const [showNewDeal, setShowNewDeal] = useState(false)
  const [filterSector, setFilterSector] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const pipelineValue = getTotalPipelineValue()
  const activeDealCount = deals.filter(d => d.stage !== 'delivered').length

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="px-5 py-4 border-b border-border bg-bg-surface flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="font-heading text-lg font-bold text-text-primary">Pipeline</h1>
              <p className="text-xs text-text-muted">
                <span className="font-mono text-text-secondary">{activeDealCount}</span> active deals ·{' '}
                <span className="font-mono text-success">{formatEuro(pipelineValue)}</span> total value
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-bg-card border border-border rounded-lg pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50 transition-colors w-44"
              />
            </div>

            {/* Sector Filter */}
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent-violet/50 transition-colors"
            >
              {sectors.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>)}
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent-violet/50 transition-colors"
            >
              {priorities.map(p => <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>

            <button
              onClick={() => setShowNewDeal(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-accent-violet/20 hover:bg-accent-violet/30 border border-accent-violet/40 rounded-lg text-accent-violet text-xs font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New Lead
            </button>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto p-5">
        <KanbanBoard
          onNewDeal={() => setShowNewDeal(true)}
          filterSector={filterSector === 'All' ? undefined : filterSector}
          filterPriority={filterPriority === 'All' ? undefined : filterPriority}
          searchQuery={searchQuery}
        />
      </div>

      <NewDealForm open={showNewDeal} onClose={() => setShowNewDeal(false)} />
    </div>
  )
}
