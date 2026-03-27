'use client'

import { useStore } from '@/lib/store'

export default function QuickMetrics() {
  const { deals, clients } = useStore()

  const closedDeals = deals.filter((d) => d.stage === 'delivered')
  const totalLeads = deals.length
  const conversionRate = totalLeads > 0 ? Math.round((closedDeals.length / totalLeads) * 100) : 0

  const avgDealSize = deals.length > 0
    ? Math.round(deals.reduce((sum, d) => sum + d.value.setup + d.value.monthly, 0) / deals.length)
    : 0

  const avgHealth = clients.length > 0
    ? Math.round(clients.reduce((sum, c) => sum + c.health, 0) / clients.length)
    : 0

  const metrics = [
    { label: 'Conversion Rate', value: `${conversionRate}%`, sub: 'leads → clients', color: 'text-accent-violet' },
    { label: 'Avg Deal Size', value: `€${avgDealSize}`, sub: 'setup + first month', color: 'text-success' },
    { label: 'Active Clients', value: clients.filter(c => c.status === 'active').length.toString(), sub: 'currently live', color: 'text-info' },
    { label: 'Client Health', value: `${avgHealth}%`, sub: 'average score', color: avgHealth >= 90 ? 'text-success' : 'text-warning' },
    { label: 'Open Deals', value: deals.filter(d => d.stage !== 'delivered').length.toString(), sub: 'in pipeline', color: 'text-warning' },
  ]

  return (
    <div className="grid grid-cols-5 gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="bg-bg-card border border-border rounded-xl p-3 text-center">
          <div className={`font-mono text-xl font-bold ${m.color}`}>{m.value}</div>
          <div className="text-xs font-medium text-text-primary mt-0.5">{m.label}</div>
          <div className="text-[10px] text-text-muted mt-0.5">{m.sub}</div>
        </div>
      ))}
    </div>
  )
}
