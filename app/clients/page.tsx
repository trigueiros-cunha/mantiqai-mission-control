'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import ClientCard from '@/components/clients/ClientCard'
import ClientDetail from '@/components/clients/ClientDetail'
import { Client } from '@/lib/types'
import { formatEuro } from '@/lib/utils'
import { TrendingUp, Users, DollarSign, Activity, Plus, X } from 'lucide-react'

export default function ClientsPage() {
  const { clients, addClient } = useStore()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [form, setForm] = useState({
    company: '',
    sector: '',
    plan: 'starter' as 'starter' | 'business' | 'enterprise',
    mrr: '',
    setupFee: '',
    contact: '',
    email: '',
    phone: '',
    website: '',
    status: 'active' as 'active' | 'at-risk' | 'churned',
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    addClient({
      company: form.company,
      sector: form.sector,
      plan: form.plan,
      mrr: Number(form.mrr) || 0,
      setupFee: Number(form.setupFee) || 0,
      agents: 0,
      agentList: [],
      health: 100,
      startDate: new Date().toISOString().split('T')[0],
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: form.status,
      monthlyMetrics: [],
      location: { lat: 0, lng: 0, city: '' },
      contact: form.contact,
      email: form.email,
      phone: form.phone,
      website: form.website,
    })
    setShowNewClientModal(false)
    setForm({ company: '', sector: '', plan: 'starter', mrr: '', setupFee: '', contact: '', email: '', phone: '', website: '', status: 'active' })
  }

  const activeClients = clients.filter(c => c.status === 'active')
  const totalMRR = activeClients.reduce((sum, c) => sum + c.mrr, 0)
  const avgHealth = activeClients.length > 0
    ? Math.round(activeClients.reduce((sum, c) => sum + c.health, 0) / activeClients.length)
    : 0
  const totalARR = totalMRR * 12

  const filtered = clients.filter(c => filterStatus === 'all' || c.status === filterStatus)

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary">Clients</h1>
          <p className="text-xs text-text-muted">{activeClients.length} active clients · {formatEuro(totalMRR)}/mo</p>
        </div>
        <button
          onClick={() => setShowNewClientModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-violet/15 hover:bg-accent-violet/25 border border-accent-violet/30 rounded-lg text-accent-violet text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total MRR', value: formatEuro(totalMRR), icon: <DollarSign className="w-4 h-4" />, color: 'text-success' },
          { label: 'ARR', value: formatEuro(totalARR), icon: <TrendingUp className="w-4 h-4" />, color: 'text-accent-violet' },
          { label: 'Active Clients', value: activeClients.length.toString(), icon: <Users className="w-4 h-4" />, color: 'text-info' },
          { label: 'Avg Health', value: `${avgHealth}%`, icon: <Activity className="w-4 h-4" />, color: avgHealth >= 90 ? 'text-success' : 'text-warning' },
        ].map((s) => (
          <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-text-muted">{s.label}</div>
              <div className="text-text-muted">{s.icon}</div>
            </div>
            <div className={`font-mono text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['all', 'active', 'at-risk', 'churned'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === status
                ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30'
                : 'text-text-muted hover:text-text-secondary bg-bg-card border border-border'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onClick={() => setSelectedClient(client)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-text-muted">
            No clients found for the selected filter.
          </div>
        )}
      </div>

      <ClientDetail client={selectedClient} onClose={() => setSelectedClient(null)} />

      {/* New Client Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNewClientModal(false)}>
          <div className="bg-bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-base font-bold text-text-primary">New Client</h2>
              <button onClick={() => setShowNewClientModal(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-text-muted mb-1 block">Company *</label>
                  <input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-violet/50 transition-colors" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Sector</label>
                  <input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-violet/50 transition-colors" placeholder="SaaS" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Plan</label>
                  <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value as typeof f.plan }))}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-violet/50 transition-colors">
                    <option value="starter">Starter</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">MRR (€)</label>
                  <input type="number" value={form.mrr} onChange={e => setForm(f => ({ ...f, mrr: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-violet/50 transition-colors" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Setup Fee (€)</label>
                  <input type="number" value={form.setupFee} onChange={e => setForm(f => ({ ...f, setupFee: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-violet/50 transition-colors" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof f.status }))}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-violet/50 transition-colors">
                    <option value="active">Active</option>
                    <option value="at-risk">At risk</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-text-muted mb-1 block">Contact Name</label>
                  <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-violet/50 transition-colors" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-violet/50 transition-colors" placeholder="john@acme.com" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-violet/50 transition-colors" placeholder="+351 000 000 000" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-text-muted mb-1 block">Website</label>
                  <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-violet/50 transition-colors" placeholder="https://acme.com" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowNewClientModal(false)}
                  className="flex-1 px-3 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-text-muted hover:text-text-primary transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-3 py-2 bg-accent-violet/20 hover:bg-accent-violet/30 border border-accent-violet/40 rounded-lg text-xs text-accent-violet font-medium transition-colors">
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
