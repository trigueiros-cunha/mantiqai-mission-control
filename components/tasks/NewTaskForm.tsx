'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import Modal from '@/components/shared/Modal'
import { Task } from '@/lib/types'

interface NewTaskFormProps {
  open: boolean
  onClose: () => void
}

const agentOptions = ['leader', 'scout', 'strategist', 'architect', 'developer', 'builder', 'qa', 'content', 'keeper']

export default function NewTaskForm({ open, onClose }: NewTaskFormProps) {
  const { addTask } = useStore()
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedAgent: 'leader',
    priority: 'medium' as Task['priority'],
    status: 'todo' as Task['status'],
    dueDate: '',
    labels: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addTask({
      title: form.title,
      description: form.description,
      assignedAgent: form.assignedAgent,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      subtasks: [],
      labels: form.labels ? form.labels.split(',').map(l => l.trim()) : [],
    })
    onClose()
    setForm({ title: '', description: '', assignedAgent: 'leader', priority: 'medium', status: 'todo', dueDate: '', labels: '' })
  }

  const inputCls = "w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50 transition-colors"

  return (
    <Modal open={open} onClose={onClose} title="New Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-text-muted block mb-1">Title *</label>
          <input required className={inputCls} placeholder="Task title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Description</label>
          <textarea className={inputCls} rows={2} placeholder="Task description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Agent</label>
            <select className={inputCls} value={form.assignedAgent} onChange={e => setForm({...form, assignedAgent: e.target.value})}>
              {agentOptions.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Priority</label>
            <select className={inputCls} value={form.priority} onChange={e => setForm({...form, priority: e.target.value as Task['priority']})}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Status</label>
            <select className={inputCls} value={form.status} onChange={e => setForm({...form, status: e.target.value as Task['status']})}>
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="doing">In Progress</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Due Date</label>
            <input type="date" className={inputCls} value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Labels (comma-separated)</label>
          <input className={inputCls} placeholder="development, client, urgent" value={form.labels} onChange={e => setForm({...form, labels: e.target.value})} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-border rounded-lg text-text-muted text-sm hover:text-text-secondary transition-colors">
            Cancel
          </button>
          <button type="submit" className="flex-1 py-2 bg-accent-violet/20 hover:bg-accent-violet/30 border border-accent-violet/40 rounded-lg text-accent-violet text-sm font-medium transition-all">
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  )
}
