'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import ClientCard from '@/components/clients/ClientCard'
import ClientDetail from '@/components/clients/ClientDetail'
import { Client } from '@/lib/types'
import { formatEuro } from '@/lib/utils'
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'

export default function ClientsPage() {
  const { clients } = useStore()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

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
    </div>
  )
}
