'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { formatEuro, calcMarginPercent } from '@/lib/utils'
import { VPS_COST, MRR_TARGET, AGENT_COLORS } from '@/lib/constants'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ReferenceLine, CartesianGrid
} from 'recharts'
import { TrendingUp, DollarSign, Percent, Target } from 'lucide-react'
import { format, subMonths } from 'date-fns'

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-3 text-xs">
        <div className="text-text-muted mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color }} className="flex gap-2">
            <span>{p.name}:</span>
            <span className="font-mono">{typeof p.value === 'number' && p.value > 10 ? formatEuro(p.value) : p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function FinancialsPage() {
  const { clients, agents } = useStore()
  const [newClientsPerMonth, setNewClientsPerMonth] = useState(1)

  const activeClients = clients.filter(c => c.status === 'active')
  const totalMRR = activeClients.reduce((sum, c) => sum + c.mrr, 0)
  const totalARR = totalMRR * 12
  const totalApiCost = agents.reduce((sum, a) => sum + a.stats.cost * 30, 0)
  const totalCost = totalApiCost + VPS_COST
  const grossMargin = totalMRR - totalCost
  const grossMarginPct = calcMarginPercent(totalMRR, totalCost)

  // MRR history (last 12 months)
  const mrrHistory = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), 11 - i)
    const progressFactor = (i + 1) / 12
    return {
      month: format(date, 'MMM'),
      MRR: Math.round(totalMRR * progressFactor * (0.7 + Math.random() * 0.2)),
      Target: Math.round((MRR_TARGET / 12) * (i + 1)),
    }
  })
  mrrHistory[11].MRR = totalMRR

  // Cost breakdown
  const costData = [
    { name: 'API Costs', value: Math.round(totalApiCost), color: '#a78bfa' },
    { name: 'VPS', value: VPS_COST, color: '#3b82f6' },
  ]

  // Revenue by plan
  const planRevenue = [
    { plan: 'Starter', value: activeClients.filter(c => c.plan === 'starter').reduce((s, c) => s + c.mrr, 0), color: '#10b981' },
    { plan: 'Business', value: activeClients.filter(c => c.plan === 'business').reduce((s, c) => s + c.mrr, 0), color: '#3b82f6' },
    { plan: 'Enterprise', value: activeClients.filter(c => c.plan === 'enterprise').reduce((s, c) => s + c.mrr, 0), color: '#a78bfa' },
  ]

  // Per-client margin
  const clientMargins = activeClients.map(c => {
    const avgCost = c.monthlyMetrics.length > 0 ? c.monthlyMetrics[c.monthlyMetrics.length - 1].apiCost : 0
    const vpsFrac = VPS_COST / activeClients.length
    return {
      name: c.company.split(' ')[0],
      MRR: c.mrr,
      Cost: Math.round(avgCost + vpsFrac),
      Margin: Math.round(c.mrr - avgCost - vpsFrac),
    }
  })

  // Projection
  const avgNewClientMRR = totalMRR / Math.max(activeClients.length, 1)
  const projectedMRR = Array.from({ length: 12 }, (_, i) => ({
    month: format(subMonths(new Date(), -i), 'MMM'),
    Projected: Math.round(totalMRR + (newClientsPerMonth * avgNewClientMRR * (i + 1))),
    Target: MRR_TARGET,
  }))

  const mrrProgress = Math.min(100, Math.round((totalMRR / MRR_TARGET) * 100))

  return (
    <div className="p-5 space-y-5">
      <div>
        <h1 className="font-heading text-xl font-bold text-text-primary">Financials</h1>
        <p className="text-xs text-text-muted">Revenue, costs, and projections</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'MRR', value: formatEuro(totalMRR), icon: <DollarSign className="w-4 h-4" />, color: 'text-success' },
          { label: 'ARR', value: formatEuro(totalARR), icon: <TrendingUp className="w-4 h-4" />, color: 'text-accent-violet' },
          { label: 'Total Costs/mo', value: formatEuro(Math.round(totalCost)), icon: <DollarSign className="w-4 h-4" />, color: 'text-danger' },
          { label: 'Gross Margin', value: formatEuro(grossMargin), icon: <Percent className="w-4 h-4" />, color: grossMargin > 0 ? 'text-success' : 'text-danger' },
          { label: 'Margin %', value: `${grossMarginPct}%`, icon: <Target className="w-4 h-4" />, color: grossMarginPct > 60 ? 'text-success' : grossMarginPct > 30 ? 'text-warning' : 'text-danger' },
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

      {/* MRR Goal Progress */}
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-text-primary">MRR Goal: {formatEuro(MRR_TARGET)}/mo</div>
          <div className="font-mono text-sm text-success">{mrrProgress}% achieved</div>
        </div>
        <div className="h-3 bg-bg-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${mrrProgress}%`,
              background: 'linear-gradient(90deg, #a78bfa, #ec4899)',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-text-muted mt-1">
          <span>{formatEuro(totalMRR)} current</span>
          <span>{formatEuro(MRR_TARGET - totalMRR)} to go</span>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-5">
        {/* MRR Chart */}
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">MRR Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mrrHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
              <XAxis dataKey="month" tick={{ fill: '#6d7a96', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6d7a96', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="MRR" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Target" stroke="#a78bfa" strokeWidth={1} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Plan */}
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue by Plan</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={180}>
              <PieChart>
                <Pie data={planRevenue} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  {planRevenue.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {planRevenue.map(p => (
                <div key={p.plan}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-text-muted">{p.plan}</span>
                    </div>
                    <span className="font-mono text-text-secondary">{formatEuro(p.value)}</span>
                  </div>
                  <div className="h-1 bg-bg-surface rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: totalMRR ? `${(p.value / totalMRR) * 100}%` : '0%', background: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-5">
        {/* Per-client margin */}
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Margin per Client</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={clientMargins} barGap={4}>
              <XAxis dataKey="name" tick={{ fill: '#6d7a96', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6d7a96', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="MRR" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Margin" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Costs</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={costData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {costData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {costData.map(c => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-text-muted flex-1">{c.name}</span>
                  <span className="font-mono text-text-secondary">{formatEuro(c.value)}</span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-text-muted font-medium">Total</span>
                <span className="font-mono text-danger font-semibold">{formatEuro(Math.round(totalCost))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Modeler */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">12-Month Projection Modeler</h3>
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-muted">New clients/month:</label>
            <input
              type="range" min="0" max="5" step="0.5" value={newClientsPerMonth}
              onChange={e => setNewClientsPerMonth(parseFloat(e.target.value))}
              className="w-32 accent-accent-violet"
            />
            <span className="font-mono text-accent-violet text-sm w-6">{newClientsPerMonth}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-text-muted">Projected MRR: </span>
              <span className="font-mono text-success">{formatEuro(projectedMRR[11].Projected)}</span>
            </div>
            <div>
              <span className="text-text-muted">ARR: </span>
              <span className="font-mono text-accent-violet">{formatEuro(projectedMRR[11].Projected * 12)}</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={projectedMRR}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
            <XAxis dataKey="month" tick={{ fill: '#6d7a96', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6d7a96', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={MRR_TARGET} stroke="#a78bfa" strokeDasharray="4 4" label={{ value: 'Target', fill: '#a78bfa', fontSize: 10 }} />
            <Line type="monotone" dataKey="Projected" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
