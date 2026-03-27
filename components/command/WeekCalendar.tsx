'use client'

import { useStore } from '@/lib/store'
import { startOfWeek, addDays, format, isSameDay, parseISO, isToday } from 'date-fns'
import { cn } from '@/lib/utils'

const typeColors: Record<string, string> = {
  'development': 'bg-accent-pink/20 text-accent-pink border-accent-pink/30',
  'content': 'bg-accent-violet/20 text-accent-violet border-accent-violet/30',
  'reporting': 'bg-success/20 text-success border-success/30',
  'diagnosis': 'bg-warning/20 text-warning border-warning/30',
  'architecture': 'bg-info/20 text-info border-info/30',
  'default': 'bg-bg-elevated text-text-muted border-border',
}

export default function WeekCalendar() {
  const { tasks } = useStore()
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-4">This Week</h3>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayTasks = tasks.filter((t) => {
            try { return isSameDay(parseISO(t.dueDate), day) } catch { return false }
          })
          const dayIsToday = isToday(day)
          return (
            <div key={day.toISOString()} className="flex flex-col gap-1">
              <div className={cn(
                'text-center text-[10px] font-medium pb-1',
                dayIsToday ? 'text-accent-violet' : 'text-text-muted'
              )}>
                <div>{format(day, 'EEE').toUpperCase()}</div>
                <div className={cn(
                  'w-5 h-5 rounded-full mx-auto flex items-center justify-center font-mono',
                  dayIsToday && 'bg-accent-violet text-white'
                )}>{format(day, 'd')}</div>
              </div>
              <div className="space-y-0.5 min-h-8">
                {dayTasks.slice(0, 2).map((task) => {
                  const label = task.labels[0] || 'default'
                  const colorClass = typeColors[label] || typeColors.default
                  return (
                    <div
                      key={task.id}
                      className={cn('text-[9px] px-1 py-0.5 rounded border truncate', colorClass)}
                      title={task.title}
                    >
                      {task.title.substring(0, 12)}…
                    </div>
                  )
                })}
                {dayTasks.length > 2 && (
                  <div className="text-[9px] text-text-muted text-center">+{dayTasks.length - 2}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
