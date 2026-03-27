'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import Modal from '@/components/shared/Modal'
import { Deal } from '@/lib/types'

interface NewDealFormProps {
  open: boolean
  onClose: () => void
}

const sectors = ['Restaurants', 'Hospitality', 'Healthcare', 'Technology', 'Retail', 'Real Estate', 'E-commerce', 'Education', 'Finance', 'Other']
const agents = ['leader', 'scout', 'strategist', 'architect', 'developer', 'builder', 'qa', 'content', 'keeper']

export default function NewDealForm({ open, onClose }: NewDealFormProps) {
  const { addDeal } = useStore()
  const [form, setForm] = useState({
    company: '',
    contact: '',
    email: '',
    phone: '',
    website: '',
    sector: 'Restaurants',
    setup: '800',
    monthly: '200',
    score: '7',
    priority: 'medium' as Deal['priority'],
    city: 'Porto',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addDeal({
      company: form.company,
      contact: form.contact,
      email: form.email,
      phone: form.phone,
      website: form.website,
      sector: form.sector,
      stage: 'lead',
      value: { setup: parseInt(form.setup) || 0, monthly: parseInt(form.monthly) || 0 },
      score: parseInt(form.score) || 7,
      priority: form.priority,
      assignedAgents: ['scout'],
      notes: [],
      history: [],
      location: { lat: 41.1579, lng: -8.6291, city: form.city },
      daysInStage: 0,
    })
    onClose()
    setForm({ company: '', contact: '', email: '', phone: '', website: '', sector: 'Restaurants', setup: '800', monthly: '200', score: '7', priority: 'medium', city: 'Porto' })
  }

  const inputCls = "w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50 transition-colors"

  return (
    <Modal open={open} onClose={onClose} title="New Lead" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Company *</label>
            <input required className={inputCls} placeholder="Company name" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Contact *</label>
            <input required className={inputCls} placeholder="Contact person" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Email</label>
            <input type="email" className={inputCls} placeholder="email@company.pt" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Phone</label>
            <input className={inputCls} placeholder="+351 9XX XXX XXX" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Sector</label>
            <select className={inputCls} value={form.sector} onChange={e => setForm({...form, sector: e.target.value})}>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">City</label>
            <input className={inputCls} placeholder="Porto" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Setup Fee (€)</label>
            <input type="number" className={inputCls} placeholder="800" value={form.setup} onChange={e => setForm({...form, setup: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Monthly (€)</label>
            <input type="number" className={inputCls} placeholder="200" value={form.monthly} onChange={e => setForm({...form, monthly: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Score (1-10)</label>
            <input type="number" min="1" max="10" className={inputCls} value={form.score} onChange={e => setForm({...form, score: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Priority</label>
            <select className={inputCls} value={form.priority} onChange={e => setForm({...form, priority: e.target.value as Deal['priority']})}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-border rounded-lg text-text-muted text-sm hover:text-text-secondary transition-colors">
            Cancel
          </button>
          <button type="submit" className="flex-1 py-2 bg-accent-violet/20 hover:bg-accent-violet/30 border border-accent-violet/40 rounded-lg text-accent-violet text-sm font-medium transition-all">
            Add Lead
          </button>
        </div>
      </form>
    </Modal>
  )
}
