'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useStore } from '@/lib/store'
import { TASK_STATUS_CONFIG } from '@/lib/constants'
import { Task, TaskStatus } from '@/lib/types'
import TaskCard from './TaskCard'
import TaskDetail from './TaskDetail'

const statuses: TaskStatus[] = ['backlog', 'todo', 'doing', 'blocked', 'done']

interface TaskKanbanProps {
  filterAgent?: string
  filterPriority?: string
  searchQuery?: string
}

export default function TaskKanban({ filterAgent, filterPriority, searchQuery }: TaskKanbanProps) {
  const { tasks, moveTask } = useStore()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const filteredTasks = tasks.filter((t) => {
    if (filterAgent && t.assignedAgent !== filterAgent) return false
    if (filterPriority && t.priority !== filterPriority) return false
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    moveTask(result.draggableId, result.destination.droppableId as TaskStatus)
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
          {statuses.map((status) => {
            const config = TASK_STATUS_CONFIG[status]
            const statusTasks = filteredTasks.filter((t) => t.status === status)

            return (
              <div key={status} className="flex-shrink-0 w-60 flex flex-col">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{config.emoji}</span>
                    <span className="text-xs font-semibold text-text-secondary">{config.label}</span>
                    <span className="text-[10px] font-mono bg-bg-surface border border-border rounded px-1.5 py-0.5 text-text-muted">
                      {statusTasks.length}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={status}>
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
                      {statusTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                onClick={() => setSelectedTask(task)}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
      <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
    </>
  )
}
