'use client'

import dynamic from 'next/dynamic'
import { useStore } from '@/lib/store'
import { formatEuro } from '@/lib/utils'

const BusinessMap = dynamic(() => import('@/components/map/BusinessMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-bg-surface rounded-xl flex items-center justify-center">
      <div className="text-text-muted text-sm animate-pulse">Loading map...</div>
    </div>
  ),
})

export default function MapPage() {
  const { deals, clients } = useStore()

  const activeClients = clients.filter(c => c.status === 'active')
  const activeDeals = deals.filter(d => d.stage !== 'delivered')

  // Group deals by city
  const byCityMap: Record<string, typeof activeDeals> = {}
  activeDeals.forEach(d => {
    if (!byCityMap[d.location.city]) byCityMap[d.location.city] = []
    byCityMap[d.location.city].push(d)
  })

  return (
    <div className="p-5 flex flex-col gap-4" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary">Map</h1>
          <p className="text-xs text-text-muted">Geographic view of clients and pipeline deals</p>
        </div>
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-text-muted">Active Clients ({activeClients.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-info" />
            <span className="text-text-muted">Pipeline Deals ({activeDeals.length})</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Map */}
        <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-border">
          <BusinessMap />
        </div>

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-3 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Active Clients', value: activeClients.length.toString(), color: 'text-success' },
              { label: 'Pipeline Deals', value: activeDeals.length.toString(), color: 'text-info' },
              { label: 'Pipeline Value', value: formatEuro(activeDeals.reduce((s, d) => s + d.value.setup + d.value.monthly, 0)), color: 'text-accent-violet' },
              { label: 'Total MRR', value: formatEuro(activeClients.reduce((s, c) => s + c.mrr, 0)), color: 'text-success' },
            ].map(s => (
              <div key={s.label} className="bg-bg-card border border-border rounded-lg p-2.5">
                <div className="text-[10px] text-text-muted">{s.label}</div>
                <div className={`font-mono text-sm font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Active Clients */}
          <div className="bg-bg-card border border-border rounded-xl p-3">
            <h3 className="text-xs font-semibold text-text-secondary mb-2">Active Clients</h3>
            <div className="space-y-2">
              {activeClients.map(client => (
                <div key={client.id} className="flex items-start gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-success flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-text-secondary truncate font-medium">{client.company}</div>
                    <div className="text-text-muted">{client.location.city} · {formatEuro(client.mrr)}/mo</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline by City */}
          <div className="bg-bg-card border border-border rounded-xl p-3">
            <h3 className="text-xs font-semibold text-text-secondary mb-2">Pipeline by City</h3>
            <div className="space-y-1">
              {Object.entries(byCityMap).map(([city, cityDeals]) => (
                <div key={city} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-info flex-shrink-0" />
                    <span className="text-text-secondary">{city}</span>
                  </div>
                  <span className="font-mono text-text-muted">{cityDeals.length} deals</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
