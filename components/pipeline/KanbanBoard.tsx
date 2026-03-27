'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useStore } from '@/lib/store'
import { STAGE_CONFIG } from '@/lib/constants'
import { Deal, DealStage } from '@/lib/types'
import { formatEuro } from '@/lib/utils'
import DealCard from './DealCard'
import DealDetail from './DealDetail'
import { Plus } from 'lucide-react'

const stages: DealStage[] = ['lead', 'contacted', 'diagnosis', 'proposal', 'building', 'delivered']

interface KanbanBoardProps {
  onNewDeal: () => void
  filterSector?: string
  filterPriority?: string
  searchQuery?: string
}

export default function KanbanBoard({ onNewDeal, filterSector, filterPriority, searchQuery }: KanbanBoardProps) {
  const { deals, moveDeal } = useStore()
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const selectedDeal = deals.find((d) => d.id === selectedDealId) ?? null

  const filteredDeals = deals.filter((d) => {
    if (filterSector && d.sector !== filterSector) return false
    if (filterPriority && d.priority !== filterPriority) return false
    if (searchQuery && !d.company.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !d.contact.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const dealId = result.draggableId
    const newStage = result.destination.droppableId as DealStage
    moveDeal(dealId, newStage)
  }

  const handleDealClick = (deal: Deal) => {
    setSelectedDealId(deal.id)
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
          {stages.map((stage) => {
            const config = STAGE_CONFIG[stage]
            const stageDeals = filteredDeals.filter((d) => d.stage === stage)
            const stageValue = stageDeals.reduce((sum, d) => sum + d.value.setup + d.value.monthly, 0)

            return (
              <div key={stage} className="flex-shrink-0 w-64 flex flex-col">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{config.emoji}</span>
                    <span className="text-xs font-semibold text-text-secondary">{config.label}</span>
                    <span className="text-[10px] font-mono bg-bg-surface border border-border rounded px-1.5 py-0.5 text-text-muted">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">{formatEuro(stageValue)}</span>
                </div>

                {/* Droppable Column */}
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-xl border-2 border-dashed p-2 space-y-2 transition-colors min-h-32 ${
                        snapshot.isDraggingOver
                          ? 'border-accent-violet/40 bg-accent-violet/5'
                          : 'border-border/50 bg-bg-surface/30'
                      }`}
                    >
                      {stageDeals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <DealCard
                                deal={deal}
                                onClick={() => handleDealClick(deal)}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {stage === 'lead' && (
                        <button
                          onClick={onNewDeal}
                          className="w-full py-2 border border-dashed border-border/50 rounded-lg text-xs text-text-faint hover:text-text-muted hover:border-border transition-all flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add lead
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      <DealDetail
        deal={selectedDeal}
        onClose={() => setSelectedDealId(null)}
      />
    </>
  )
}
