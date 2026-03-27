'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { CONTENT_TYPE_CONFIG } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ContentType, ContentStatus } from '@/lib/types'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, parseISO, startOfWeek, addDays
} from 'date-fns'
import { ExternalLink, Eye, TrendingUp, Plus } from 'lucide-react'
import Modal from '@/components/shared/Modal'

const statusColors: Record<ContentStatus, string> = {
  planned: 'bg-bg-elevated text-text-muted border border-border',
  draft: 'bg-info/10 text-info border border-info/30',
  review: 'bg-warning/10 text-warning border border-warning/30',
  published: 'bg-success/10 text-success border border-success/30',
}

function NewContentForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addContent } = useStore()
  const [form, setForm] = useState({
    title: '',
    type: 'linkedin' as ContentType,
    status: 'planned' as ContentStatus,
    scheduledDate: '',
    content: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addContent({
      title: form.title,
      type: form.type,
      status: form.status,
      scheduledDate: form.scheduledDate
        ? new Date(form.scheduledDate).toISOString()
        : new Date().toISOString(),
      content: form.content,
      labels: [form.type],
    })
    onClose()
    setForm({ title: '', type: 'linkedin', status: 'planned', scheduledDate: '', content: '' })
  }

  const inputCls = "w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50"

  return (
    <Modal open={open} onClose={onClose} title="New Content" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-text-muted block mb-1">Title *</label>
          <input required className={inputCls} placeholder="Content title" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Type</label>
            <select className={inputCls} value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value as ContentType })}>
              {(['linkedin', 'blog', 'email', 'case-study', 'one-pager'] as ContentType[]).map(t => (
                <option key={t} value={t}>{CONTENT_TYPE_CONFIG[t].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Status</label>
            <select className={inputCls} value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as ContentStatus })}>
              {(['planned', 'draft', 'review', 'published'] as ContentStatus[]).map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Scheduled Date</label>
          <input type="datetime-local" className={inputCls} value={form.scheduledDate}
            onChange={e => setForm({ ...form, scheduledDate: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Content (optional)</label>
          <textarea className={inputCls} rows={3} placeholder="Content body..."
            value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 border border-border rounded-lg text-text-muted text-sm hover:text-text-secondary transition-colors">
            Cancel
          </button>
          <button type="submit"
            className="flex-1 py-2 bg-accent-violet/20 border border-accent-violet/40 rounded-lg text-accent-violet text-sm font-medium hover:bg-accent-violet/30 transition-all">
            Create
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function ContentPage() {
  const { content } = useStore()
  const [activeTab, setActiveTab] = useState<'calendar' | 'library' | 'templates'>('calendar')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showNew, setShowNew] = useState(false)
  const today = new Date()

  const publishedContent = content.filter(c => c.status === 'published')
  const totalImpressions = publishedContent.reduce((s, c) => s + (c.metrics?.impressions || 0), 0)
  const totalEngagement = publishedContent.reduce((s, c) => s + (c.metrics?.engagement || 0), 0)

  // Calendar for current month
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1

  const filteredContent = content.filter(c => {
    if (selectedType !== 'all' && c.type !== selectedType) return false
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false
    return true
  })

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary">Content</h1>
          <p className="text-xs text-text-muted">Marketing calendar and content library</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-accent-violet/20 hover:bg-accent-violet/30 border border-accent-violet/40 rounded-lg text-accent-violet text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> New Content
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Published', value: publishedContent.length.toString(), color: 'text-success' },
          { label: 'Total Impressions', value: totalImpressions.toLocaleString('pt-PT'), color: 'text-accent-violet' },
          { label: 'Engagement', value: totalEngagement.toString(), color: 'text-info' },
          { label: 'Planned', value: content.filter(c => c.status === 'planned').length.toString(), color: 'text-warning' },
        ].map(s => (
          <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-text-muted mb-1">{s.label}</div>
            <div className={`font-mono text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['calendar', 'library', 'templates'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-medium transition-all',
              activeTab === tab
                ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30'
                : 'text-text-muted bg-bg-card border border-border hover:text-text-secondary'
            )}
          >
            {tab === 'calendar' ? '📅 Calendar' : tab === 'library' ? '📚 Library' : '📋 Templates'}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {activeTab === 'calendar' && (
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">{format(today, 'MMMM yyyy')}</h3>
            <div className="flex items-center gap-3 text-xs flex-wrap">
              {(['linkedin', 'blog', 'email', 'case-study'] as ContentType[]).map(t => {
                const cfg = CONTENT_TYPE_CONFIG[t]
                return (
                  <div key={t} className="flex items-center gap-1.5">
                    <div className={cn('w-2 h-2 rounded-full', cfg.bgColor)} />
                    <span className={cfg.textColor}>{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-[10px] text-text-muted font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20" />
            ))}
            {calendarDays.map(day => {
              const dayContent = content.filter(c => {
                try {
                  const dateStr = c.publishedDate || c.scheduledDate
                  return isSameDay(parseISO(dateStr), day)
                } catch { return false }
              })
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'h-20 rounded-lg p-1.5 border transition-colors',
                    isToday
                      ? 'border-accent-violet/50 bg-accent-violet/5'
                      : 'border-border/30 bg-bg-surface/20 hover:border-border/60'
                  )}
                >
                  <div className={cn(
                    'text-[10px] font-mono mb-1 font-medium',
                    isToday ? 'text-accent-violet' : 'text-text-muted'
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayContent.slice(0, 2).map(item => {
                      const cfg = CONTENT_TYPE_CONFIG[item.type]
                      return (
                        <div
                          key={item.id}
                          className={cn('text-[8px] px-1 py-0.5 rounded truncate border', cfg.textColor, cfg.bgColor)}
                          title={item.title}
                        >
                          {item.title.substring(0, 15)}…
                        </div>
                      )
                    })}
                    {dayContent.length > 2 && (
                      <div className="text-[8px] text-text-muted pl-1">+{dayContent.length - 2}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Library View */}
      {activeTab === 'library' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent-violet/50"
            >
              <option value="all">All Types</option>
              {(['linkedin', 'blog', 'email', 'case-study', 'one-pager'] as ContentType[]).map(t => (
                <option key={t} value={t}>{CONTENT_TYPE_CONFIG[t].label}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent-violet/50"
            >
              <option value="all">All Status</option>
              {(['planned', 'draft', 'review', 'published'] as ContentStatus[]).map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {filteredContent.map(item => {
              const typeCfg = CONTENT_TYPE_CONFIG[item.type]
              return (
                <div key={item.id} className="bg-bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-border-strong transition-colors">
                  <div className={cn('px-2.5 py-1 rounded text-xs font-medium flex-shrink-0', typeCfg.bgColor, typeCfg.textColor)}>
                    {typeCfg.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{item.title}</div>
                    <div className="text-xs text-text-muted">
                      {item.publishedDate
                        ? `Published ${formatDate(item.publishedDate)}`
                        : `Scheduled ${formatDate(item.scheduledDate)}`}
                    </div>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0', statusColors[item.status])}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                  {item.metrics && (
                    <div className="flex items-center gap-4 text-xs text-text-muted flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.metrics.impressions.toLocaleString('pt-PT')}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {item.metrics.engagement}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {filteredContent.length === 0 && (
              <div className="text-center py-12 text-text-muted text-sm">
                No content found for selected filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates View */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              title: 'Outreach Email Template',
              type: 'email' as ContentType,
              description: 'Cold outreach personalized by sector. High conversion rate.',
              preview: 'Hello [Name], I noticed [Company] and thought AI automation could...',
            },
            {
              title: 'LinkedIn Post Template',
              type: 'linkedin' as ContentType,
              description: 'Engaging posts showcasing AI automation results and insights.',
              preview: '3 ways AI is transforming [sector] businesses in Portugal...',
            },
            {
              title: 'Case Study Template',
              type: 'case-study' as ContentType,
              description: 'Document client success with before/after metrics.',
              preview: 'Client: [Company] | Result: [X]% improvement in [metric]...',
            },
            {
              title: 'Proposal Template',
              type: 'one-pager' as ContentType,
              description: 'Standard proposal with agent configuration and pricing.',
              preview: 'MantiqAI Proposal for [Company] · [Date]...',
            },
            {
              title: 'Monthly Report Template',
              type: 'one-pager' as ContentType,
              description: 'Client monthly performance report with all key metrics.',
              preview: 'Monthly Report — [Month] [Year] · Powered by MantiqAI...',
            },
            {
              title: 'SLA Template',
              type: 'one-pager' as ContentType,
              description: 'Service level agreement template for new clients.',
              preview: 'Service Level Agreement between MantiqAI and [Client]...',
            },
          ].map((tmpl) => {
            const cfg = CONTENT_TYPE_CONFIG[tmpl.type]
            return (
              <div key={tmpl.title} className="bg-bg-card border border-border rounded-xl p-4 space-y-3 hover:border-accent-violet/30 transition-colors">
                <span className={cn('text-xs px-2 py-0.5 rounded font-medium', cfg.bgColor, cfg.textColor)}>
                  {cfg.label}
                </span>
                <div>
                  <div className="text-sm font-semibold text-text-primary">{tmpl.title}</div>
                  <div className="text-xs text-text-muted mt-1">{tmpl.description}</div>
                </div>
                <div className="bg-bg-surface rounded-lg p-2 text-[10px] text-text-muted font-mono italic leading-relaxed">
                  {tmpl.preview}
                </div>
                <a
                  href={`https://t.me/mantiq_content_bot?start=template_${tmpl.type}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-accent-violet hover:text-accent-violet/80 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ask Content Agent to use this →
                </a>
              </div>
            )
          })}
        </div>
      )}

      <NewContentForm open={showNew} onClose={() => setShowNew(false)} />
    </div>
  )
}
