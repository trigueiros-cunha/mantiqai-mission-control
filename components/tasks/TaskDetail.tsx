'use client'

import { Task } from '@/lib/types'
import { useStore } from '@/lib/store'
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG } from '@/lib/constants'
import { formatDate, formatDateTime, isOverdue, cn } from '@/lib/utils'
import SlidePanel from '@/components/shared/SlidePanel'
import { Calendar, AlertTriangle } from 'lucide-react'

interface TaskDetailProps {
  task: Task | null
  onClose: () => void
}

export default function TaskDetail({ task, onClose }: TaskDetailProps) {
  const { toggleSubtask, moveTask } = useStore()

  if (!task) return null

  const priority = PRIORITY_CONFIG[task.priority]
  const status = TASK_STATUS_CONFIG[task.status]
  const overdue = isOverdue(task.dueDate) && task.status !== 'done'
  const doneSubtasks = task.subtasks.filter((s) => s.done).length

  return (
    <SlidePanel open={!!task} onClose={onClose} title={task.title} width="w-[480px]">
      <div className="space-y-5">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', priority.bgColor, priority.textColor)}>
            {priority.dot} {priority.label}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-bg-elevated text-text-secondary">
            {status.emoji} {status.label}
          </span>
          {overdue && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Overdue
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="bg-bg-surface border border-border rounded-lg p-3 text-xs text-text-secondary leading-relaxed">
            {task.description}
          </div>
        )}

        {/* Meta */}
        <div className="bg-bg-surface border border-border rounded-lg p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-text-muted w-24">Assigned to</span>
            <span className="text-text-secondary capitalize">{task.assignedAgent}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-text-muted" />
            <span className={overdue ? 'text-danger' : 'text-text-secondary'}>
              Due {formatDate(task.dueDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted w-24">Created</span>
            <span className="text-text-secondary">{formatDateTime(task.createdAt)}</span>
          </div>
          {task.completedAt && (
            <div className="flex items-center gap-2">
              <span className="text-text-muted w-24">Completed</span>
              <span className="text-success">{formatDateTime(task.completedAt)}</span>
            </div>
          )}
        </div>

        {/* Subtasks */}
        {task.subtasks.length > 0 && (
          <div className="bg-bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Subtasks ({doneSubtasks}/{task.subtasks.length})
              </h4>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-bg-card rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-accent-violet rounded-full transition-all"
                style={{ width: task.subtasks.length > 0 ? `${(doneSubtasks / task.subtasks.length) * 100}%` : '0%' }}
              />
            </div>
            <div className="space-y-2">
              {task.subtasks.map((subtask) => (
                <button
                  key={subtask.id}
                  onClick={() => toggleSubtask(task.id, subtask.id)}
                  className="w-full flex items-center gap-2.5 text-left hover:bg-bg-elevated rounded-lg px-2 py-1.5 transition-colors"
                >
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                    subtask.done
                      ? 'bg-success/20 border-success/40'
                      : 'border-border'
                  )}>
                    {subtask.done && <span className="text-success text-[8px]">✓</span>}
                  </div>
                  <span className={cn(
                    'text-xs',
                    subtask.done ? 'line-through text-text-muted' : 'text-text-secondary'
                  )}>
                    {subtask.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Labels */}
        {task.labels.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Labels</h4>
            <div className="flex flex-wrap gap-2">
              {task.labels.map((label) => (
                <span key={label} className="px-2 py-0.5 bg-bg-elevated border border-border rounded text-xs text-text-muted">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Move to Status */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Move to</h4>
          <div className="flex flex-wrap gap-2">
            {(['backlog', 'todo', 'doing', 'blocked', 'done'] as const).filter(s => s !== task.status).map((s) => {
              const sc = TASK_STATUS_CONFIG[s]
              return (
                <button
                  key={s}
                  onClick={() => { moveTask(task.id, s); onClose() }}
                  className="px-3 py-1.5 bg-bg-elevated hover:bg-bg-surface border border-border rounded-lg text-xs text-text-secondary transition-all"
                >
                  {sc.emoji} {sc.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </SlidePanel>
  )
}
