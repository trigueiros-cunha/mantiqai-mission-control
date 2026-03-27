'use client'

import { Client } from '@/lib/types'
import { PLAN_CONFIG } from '@/lib/constants'
import { formatEuro, formatDate, getHealthColor, getHealthText, calcMarginPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'
import SlidePanel from '@/components/shared/SlidePanel'
import { Mail, Phone, Globe, ExternalLink, TrendingUp, DollarSign } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { VPS_COST } from '@/lib/constants'

interface ClientDetailProps {
  client: Client | null
  onClose: () => void
}

export default function ClientDetail({ client, onClose }: ClientDetailProps) {
  if (!client) return null

  const plan = PLAN_CONFIG[client.plan]
  const healthColor = getHealthColor(client.health)
  const healthText = getHealthText(client.health)
  const avgApiCost = client.monthlyMetrics.length > 0
    ? client.monthlyMetrics[client.monthlyMetrics.length - 1].apiCost
    : 0
  const vpsFraction = VPS_COST / 3
  const grossMargin = client.mrr - avgApiCost - vpsFraction
  const marginPct = calcMarginPercent(client.mrr, avgApiCost + vpsFraction)

  return (
    <SlidePanel open={!!client} onClose={onClose} title={client.company} width="w-[520px]">
      <div className="space-y-5">
        {/* Status Row */}
        <div className="flex items-center gap-3">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', plan.bgColor, plan.textColor)}>
            {plan.label}
          </span>
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', healthText,
            client.health >= 90 ? 'bg-success/10' : client.health >= 70 ? 'bg-warning/10' : 'bg-danger/10'
          )}>
            {client.health}% Health
          </span>
          <span className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium ml-auto',
            client.status === 'active' ? 'bg-success/10 text-success' :
            client.status === 'at-risk' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
          )}>
            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </span>
        </div>

        {/* Contact */}
        <div className="bg-bg-surface border border-border rounded-lg p-4 space-y-2">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Contact</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-text-muted w-16">Contact</span>
              <span className="text-text-secondary">{client.contact}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 text-text-muted" />
              <a href={`mailto:${client.email}`} className="text-accent-violet hover:underline">{client.email}</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 text-text-muted" />
              <span className="text-text-secondary">{client.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 text-text-muted" />
              <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-accent-violet hover:underline flex items-center gap-1">
                {client.website} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Financials</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'MRR', value: formatEuro(client.mrr), color: 'text-success' },
              { label: 'ARR', value: formatEuro(client.mrr * 12), color: 'text-success' },
              { label: 'API Cost/mo', value: formatEuro(avgApiCost, 2), color: 'text-warning' },
              { label: 'Gross Margin', value: `${marginPct}%`, color: marginPct > 70 ? 'text-success' : 'text-warning' },
              { label: 'Setup Fee', value: formatEuro(client.setupFee), color: 'text-info' },
              { label: 'Renewal', value: formatDate(client.renewalDate), color: 'text-text-secondary' },
            ].map((item) => (
              <div key={item.label} className="bg-bg-card rounded-lg p-2.5">
                <div className="text-[10px] text-text-muted">{item.label}</div>
                <div className={`font-mono text-sm font-semibold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Agents */}
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Deployed Agents</h4>
          <div className="flex flex-wrap gap-2">
            {client.agentList.map((agentId) => (
              <span key={agentId} className="px-2.5 py-1 bg-bg-elevated border border-border rounded-full text-xs text-text-secondary capitalize">
                {agentId}
              </span>
            ))}
          </div>
        </div>

        {/* Monthly Metrics Chart */}
        {client.monthlyMetrics.length > 0 && (
          <div className="bg-bg-surface border border-border rounded-lg p-4">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Monthly Messages</h4>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={client.monthlyMetrics}>
                <XAxis dataKey="month" tick={{ fill: '#6d7a96', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6d7a96', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={{ background: '#111520', border: '1px solid #1a1f2e', borderRadius: '8px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="messages" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </SlidePanel>
  )
}
