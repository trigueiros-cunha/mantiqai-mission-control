'use client'

import { useStore } from '@/lib/store'
import { AGENT_COLORS } from '@/lib/constants'
import { formatEuro } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { format, subDays } from 'date-fns'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-3 text-xs">
        <div className="text-text-muted mb-2">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
            <span className="text-text-secondary capitalize">{p.name}: {p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function TokenChart() {
  const { agents } = useStore()

  // Last 14 days combined usage
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const entry: Record<string, any> = { date: format(date, 'dd/MM') }
    agents.forEach((agent) => {
      const hist = agent.dailyHistory.find((h) => h.date === dateStr)
      entry[agent.id] = hist ? hist.messages : 0
    })
    return entry
  })

  // Cost breakdown for pie
  const costData = agents.map((agent) => ({
    name: agent.name,
    value: parseFloat(agent.stats.cost.toFixed(2)),
    color: AGENT_COLORS[agent.id] || '#6d7a96',
  }))

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Stacked Bar */}
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Messages Last 14 Days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={last14} barSize={6}>
            <XAxis dataKey="date" tick={{ fill: '#6d7a96', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6d7a96', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {agents.slice(0, 5).map((agent) => (
              <Bar key={agent.id} dataKey={agent.id} stackId="a" fill={AGENT_COLORS[agent.id] || '#6d7a96'} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie */}
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Cost by Agent (Today)</h3>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="60%" height={200}>
            <PieChart>
              <Pie data={costData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                {costData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatEuro(value, 2)} contentStyle={{ background: '#111520', border: '1px solid #1a1f2e', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {costData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-text-muted flex-1">{d.name}</span>
                <span className="font-mono text-text-secondary">{formatEuro(d.value, 2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
