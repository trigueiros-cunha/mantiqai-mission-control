'use client'

import { Task } from '@/lib/types'
import { PRIORITY_CONFIG } from '@/lib/constants'
import { formatDate, isOverdue, cn } from '@/lib/utils'
import { Calendar, CheckSquare, AlertTriangle } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onClick: () => void
  isDragging?: boolean
}

export default function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority]
  const overdue = isOverdue(task.dueDate) && task.status !== 'done'
  const doneSubtasks = task.subtasks.filter((s) => s.done).length
  const totalSubtasks = task.subtasks.length

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-accent-violet/40 transition-all space-y-2',
        isDragging && 'opacity-80 rotate-1 shadow-2xl',
        task.priority === 'critical' && 'border-l-2 border-l-danger',
        overdue && 'border-danger/40',
      )}
    >
      {/* Title */}
      <div className="text-xs font-semibold text-text-primary leading-relaxed">{task.title}</div>

      {/* Priority + Agent */}
      <div className="flex items-center gap-2">
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', priority.bgColor, priority.textColor)}>
          {priority.dot} {priority.label}
        </span>
        <span className="text-[10px] text-text-muted capitalize ml-auto">{task.assignedAgent}</span>
      </div>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((label) => (
            <span key={label} className="text-[9px] px-1.5 py-0.5 bg-bg-elevated border border-border rounded text-text-muted">
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px]">
        {totalSubtasks > 0 && (
          <div className="flex items-center gap-1 text-text-muted">
            <CheckSquare className="w-3 h-3" />
            {doneSubtasks}/{totalSubtasks}
          </div>
        )}
        <div className={cn('flex items-center gap-1 ml-auto', overdue ? 'text-danger' : 'text-text-muted')}>
          {overdue && <AlertTriangle className="w-3 h-3" />}
          <Calendar className="w-3 h-3" />
          {formatDate(task.dueDate)}
        </div>
      </div>
    </div>
  )
}
