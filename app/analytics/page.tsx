'use client'

import { useStore } from '@/lib/store'
import { formatEuro } from '@/lib/utils'
import { STAGE_CONFIG, AGENT_COLORS, SECTOR_COLORS } from '@/lib/constants'
import {
  FunnelChart, Funnel, LabelList, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'
import { subDays, format } from 'date-fns'
import { TrendingUp, Target, Activity, Users } from 'lucide-react'

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
        <div className="text-text-muted mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex gap-2 items-center">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
            <span className="text-text-secondary">{p.name}: </span>
            <span className="font-mono text-text-primary">{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const { deals, agents, clients } = useStore()

  // Conversion funnel
  const stages = ['lead', 'contacted', 'diagnosis', 'proposal', 'building', 'delivered'] as const
  const funnelData = stages.map((stage, i) => ({
    name: STAGE_CONFIG[stage].label,
    value: deals.filter(d => {
      const idx = stages.indexOf(d.stage)
      return idx >= i
    }).length,
    fill: STAGE_CONFIG[stage].color,
  }))

  // Win rate by sector
  const sectors = [...new Set(deals.map(d => d.sector))]
  const winRateData = sectors.map(sector => {
    const sectorDeals = deals.filter(d => d.sector === sector)
    const won = sectorDeals.filter(d => d.stage === 'delivered').length
    return {
      sector: sector.substring(0, 10),
      winRate: sectorDeals.length > 0 ? Math.round((won / sectorDeals.length) * 100) : 0,
      total: sectorDeals.length,
      color: SECTOR_COLORS[sector] || '#6d7a96',
    }
  }).sort((a, b) => b.winRate - a.winRate)

  // Agent messages last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const entry: Record<string, any> = { date: format(date, 'dd/MM') }
    agents.slice(0, 4).forEach(agent => {
      const hist = agent.dailyHistory.find(h => h.date === dateStr)
      entry[agent.name] = hist ? hist.messages : 0
    })
    return entry
  })

  // Cost per message
  const costPerMsg = agents.map(a => ({
    name: a.name,
    value: a.stats.messages > 0 ? parseFloat((a.stats.cost / a.stats.messages).toFixed(3)) : 0,
    color: AGENT_COLORS[a.id] || '#6d7a96',
  })).sort((a, b) => a.value - b.value)

  // Client health trend (simulated)
  const healthTrend = Array.from({ length: 6 }, (_, i) => ({
    month: format(subDays(new Date(), (5 - i) * 30), 'MMM'),
    ...Object.fromEntries(clients.map(c => [
      c.company.split(' ')[0],
      Math.min(100, c.health + (Math.random() - 0.5) * 10)
    ])),
  }))

  // Deals by sector
  const dealsBySector = sectors.map(s => ({
    name: s,
    deals: deals.filter(d => d.sector === s).length,
    value: deals.filter(d => d.sector === s).reduce((sum, d) => sum + d.value.setup + d.value.monthly, 0),
    color: SECTOR_COLORS[s] || '#6d7a96',
  })).sort((a, b) => b.deals - a.deals)

  const totalDeals = deals.length
  const wonDeals = deals.filter(d => d.stage === 'delivered').length
  const overallWinRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0
  const avgScore = deals.length > 0 ? (deals.reduce((s, d) => s + d.score, 0) / deals.length).toFixed(1) : '0'
  const totalPipelineValue = deals.filter(d => d.stage !== 'delivered').reduce((s, d) => s + d.value.setup + d.value.monthly * 12, 0)

  return (
    <div className="p-5 space-y-5">
      <div>
        <h1 className="font-heading text-xl font-bold text-text-primary">Analytics</h1>
        <p className="text-xs text-text-muted">Deep KPIs and performance trends</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Deals', value: totalDeals.toString(), icon: <TrendingUp className="w-4 h-4" />, color: 'text-accent-violet' },
          { label: 'Win Rate', value: `${overallWinRate}%`, icon: <Target className="w-4 h-4" />, color: 'text-success' },
          { label: 'Avg Lead Score', value: `${avgScore}/10`, icon: <Activity className="w-4 h-4" />, color: 'text-info' },
          { label: 'Pipeline Value', value: formatEuro(totalPipelineValue), icon: <Users className="w-4 h-4" />, color: 'text-warning' },
        ].map(s => (
          <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-text-muted">{s.label}</div>
              <div className="text-text-muted">{s.icon}</div>
            </div>
            <div className={`font-mono text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Sales Analytics */}
      <div className="bg-bg-surface border border-border rounded-xl p-4">
        <h2 className="text-sm font-bold text-text-primary mb-1">Sales Analytics</h2>
        <p className="text-xs text-text-muted mb-4">Pipeline conversion and win rates</p>
        <div className="grid grid-cols-2 gap-5">
          {/* Conversion Funnel */}
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-secondary mb-4">Conversion Funnel</h3>
            <div className="space-y-2">
              {funnelData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-[10px] text-text-muted w-20 flex-shrink-0">{item.name}</span>
                  <div className="flex-1 bg-bg-surface rounded-full h-5 overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all flex items-center px-2"
                      style={{
                        width: `${funnelData[0].value > 0 ? (item.value / funnelData[0].value) * 100 : 0}%`,
                        backgroundColor: `${item.fill}30`,
                        border: `1px solid ${item.fill}40`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs text-text-secondary w-6 flex-shrink-0">{item.value}</span>
                  {i > 0 && (
                    <span className="text-[10px] text-text-muted w-8 flex-shrink-0">
                      {funnelData[i-1].value > 0 ? `${Math.round((item.value / funnelData[i-1].value) * 100)}%` : '-'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Win Rate by Sector */}
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-secondary mb-4">Win Rate by Sector</h3>
            <div className="space-y-2">
              {winRateData.map(item => (
                <div key={item.sector} className="flex items-center gap-3">
                  <span className="text-[10px] text-text-muted w-20 truncate flex-shrink-0">{item.sector}</span>
                  <div className="flex-1 h-4 bg-bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.winRate}%`, backgroundColor: item.color + '80' }}
                    />
                  </div>
                  <span className="font-mono text-xs text-text-secondary w-8 flex-shrink-0">{item.winRate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Analytics */}
      <div className="bg-bg-surface border border-border rounded-xl p-4">
        <h2 className="text-sm font-bold text-text-primary mb-1">Agent Analytics</h2>
        <p className="text-xs text-text-muted mb-4">Performance metrics across all 9 agents</p>
        <div className="grid grid-cols-2 gap-5">
          {/* Messages last 30 days */}
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-secondary mb-4">Messages/Day (Top 4 Agents)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={last30.filter((_, i) => i % 2 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
                <XAxis dataKey="date" tick={{ fill: '#6d7a96', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6d7a96', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                {agents.slice(0, 4).map(agent => (
                  <Line
                    key={agent.id}
                    type="monotone"
                    dataKey={agent.name}
                    stroke={AGENT_COLORS[agent.id] || '#6d7a96'}
                    strokeWidth={1.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cost per message */}
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-secondary mb-4">Cost per Message (€)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={costPerMsg} layout="vertical" barSize={12}>
                <XAxis type="number" tick={{ fill: '#6d7a96', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#6d7a96', fontSize: 9 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {costPerMsg.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Client Analytics */}
      <div className="bg-bg-surface border border-border rounded-xl p-4">
        <h2 className="text-sm font-bold text-text-primary mb-1">Client Analytics</h2>
        <p className="text-xs text-text-muted mb-4">Health and engagement metrics</p>
        <div className="grid grid-cols-2 gap-5">
          {/* Health Trend */}
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-secondary mb-4">Health Score Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={healthTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
                <XAxis dataKey="month" tick={{ fill: '#6d7a96', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 100]} tick={{ fill: '#6d7a96', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                {clients.map((client, i) => (
                  <Line
                    key={client.id}
                    type="monotone"
                    dataKey={client.company.split(' ')[0]}
                    stroke={['#10b981', '#3b82f6', '#f59e0b'][i]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Deals by sector */}
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-secondary mb-4">Pipeline by Sector</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dealsBySector} barSize={18}>
                <XAxis dataKey="name" tick={{ fill: '#6d7a96', fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6d7a96', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="deals" radius={[4, 4, 0, 0]}>
                  {dealsBySector.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
