'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import TaskKanban from '@/components/tasks/TaskKanban'
import NewTaskForm from '@/components/tasks/NewTaskForm'
import { Plus, Search } from 'lucide-react'

const agentOptions = ['all', 'leader', 'scout', 'strategist', 'architect', 'developer', 'builder', 'qa', 'content', 'keeper']
const priorityOptions = ['all', 'critical', 'high', 'medium', 'low']

export default function TasksPage() {
  const { tasks } = useStore()
  const [showNewTask, setShowNewTask] = useState(false)
  const [filterAgent, setFilterAgent] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const openTasks = tasks.filter(t => t.status !== 'done').length
  const criticalTasks = tasks.filter(t => t.priority === 'critical' && t.status !== 'done').length
  const overdueTasks = tasks.filter(t => {
    try {
      return new Date(t.dueDate) < new Date() && t.status !== 'done'
    } catch { return false }
  }).length

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="px-5 py-4 border-b border-border bg-bg-surface flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-lg font-bold text-text-primary">Tasks</h1>
            <p className="text-xs text-text-muted">
              <span className="font-mono text-text-secondary">{openTasks}</span> open ·{' '}
              {criticalTasks > 0 && <span className="text-danger font-medium">{criticalTasks} critical · </span>}
              {overdueTasks > 0 && <span className="text-warning font-medium">{overdueTasks} overdue</span>}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-bg-card border border-border rounded-lg pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50 w-40"
              />
            </div>
            <select
              value={filterAgent}
              onChange={e => setFilterAgent(e.target.value)}
              className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none"
            >
              {agentOptions.map(a => <option key={a} value={a}>{a === 'all' ? 'All Agents' : a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none"
            >
              {priorityOptions.map(p => <option key={p} value={p}>{p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <button
              onClick={() => setShowNewTask(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-accent-violet/20 hover:bg-accent-violet/30 border border-accent-violet/40 rounded-lg text-accent-violet text-xs font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New Task
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-5">
        <TaskKanban
          filterAgent={filterAgent === 'all' ? undefined : filterAgent}
          filterPriority={filterPriority === 'all' ? undefined : filterPriority}
          searchQuery={searchQuery}
        />
      </div>

      <NewTaskForm open={showNewTask} onClose={() => setShowNewTask(false)} />
    </div>
  )
}
