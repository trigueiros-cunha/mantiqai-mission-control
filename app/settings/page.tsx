'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Agent } from '@/lib/types'
import { getTelegramUrl, formatEuro } from '@/lib/utils'
import { VPS_COST, MRR_TARGET, DAILY_API_BUDGET } from '@/lib/constants'
import { ExternalLink, Save, RefreshCw, Server, Bot, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { settingsQueries } from '@/lib/supabase-queries'

export default function SettingsPage() {
  const { agents, updateAgent } = useStore()
  const [activeTab, setActiveTab] = useState<'agents' | 'pricing' | 'system'>('agents')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const [pricing, setPricing] = useState({
    starter: { setup: 600, monthly: 180, agents: 1, description: 'Perfect for small businesses with 1 AI agent' },
    business: { setup: 1200, monthly: 450, agents: 3, description: 'For growing businesses needing 3 AI agents' },
    enterprise: { setup: 2400, monthly: 900, agents: 7, description: 'Full agent team for large operations' },
  })

  const [budget, setBudget] = useState({
    daily_api_budget: DAILY_API_BUDGET,
    vps_cost: VPS_COST,
    mrr_target: MRR_TARGET,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const agentConfig = Object.fromEntries(agents.map(a => [a.id, { model: a.model, status: a.status }]))
      await Promise.all([
        settingsQueries.set('pricing', {
          starter: { setup: pricing.starter.setup, monthly: pricing.starter.monthly, agents: pricing.starter.agents },
          business: { setup: pricing.business.setup, monthly: pricing.business.monthly, agents: pricing.business.agents },
          enterprise: { setup: pricing.enterprise.setup, monthly: pricing.enterprise.monthly, agents: pricing.enterprise.agents },
        }),
        settingsQueries.set('budget', budget),
        settingsQueries.set('agent_config', agentConfig),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('[settings] Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50 w-full"

  const tabs = [
    { id: 'agents', label: '🤖 Agent Config' },
    { id: 'pricing', label: '💰 Pricing' },
    { id: 'system', label: '⚙️ System' },
  ] as const

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-text-primary">Settings</h1>
          <p className="text-xs text-text-muted">Configuration, pricing templates, and system management</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60',
            saved
              ? 'bg-success/20 text-success border border-success/30'
              : 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30 hover:bg-accent-violet/30'
          )}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-medium transition-all',
              activeTab === tab.id
                ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30'
                : 'text-text-muted bg-bg-card border border-border hover:text-text-secondary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Agent Config Tab */}
      {activeTab === 'agents' && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">Configure model, status, and Telegram connections for each agent.</p>
          <div className="space-y-2">
            {agents.map(agent => (
              <div key={agent.id} className="bg-bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-4">
                  {/* Agent Info */}
                  <div className="flex items-center gap-3 w-52 flex-shrink-0">
                    <span className="text-2xl">{agent.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{agent.name}</div>
                      <div className="text-xs text-text-muted">{agent.role}</div>
                    </div>
                  </div>

                  {/* Status */}
                  <select
                    value={agent.status}
                    onChange={e => updateAgent(agent.id, { status: e.target.value as Agent['status'] })}
                    className="bg-bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent-violet/50 w-24"
                  >
                    <option value="active">Active</option>
                    <option value="idle">Idle</option>
                    <option value="error">Error</option>
                  </select>

                  {/* Model */}
                  <select
                    value={agent.model}
                    onChange={e => updateAgent(agent.id, { model: e.target.value })}
                    className="bg-bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent-violet/50 flex-1"
                  >
                    <option value="claude-sonnet-4-6">Sonnet 4.6 (Recommended)</option>
                    <option value="claude-haiku-4-5-20251001">Haiku 4.5 (Fast/Cheap)</option>
                    <option value="claude-opus-4-6">Opus 4.6 (Most Capable)</option>
                  </select>

                  {/* Telegram */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono text-text-muted">@{agent.telegramBot}</span>
                    <a
                      href={getTelegramUrl(agent.telegramBot)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-bg-elevated transition-colors text-text-muted hover:text-accent-violet"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="space-y-5">
          <p className="text-xs text-text-muted">Configure plan pricing and inclusions. Margin is calculated automatically.</p>

          <div className="grid grid-cols-3 gap-5">
            {(Object.entries(pricing) as [keyof typeof pricing, typeof pricing.starter][]).map(([plan, config]) => {
              const planColors = {
                starter: { accent: '#10b981', bg: 'bg-success/5', border: 'border-success/20' },
                business: { accent: '#3b82f6', bg: 'bg-info/5', border: 'border-info/20' },
                enterprise: { accent: '#a78bfa', bg: 'bg-accent-violet/5', border: 'border-accent-violet/20' },
              }
              const colors = planColors[plan]
              const margin = config.monthly - (config.agents * 2.5) - (VPS_COST / 3)
              const marginPct = Math.round((margin / config.monthly) * 100)

              return (
                <div key={plan} className={cn('bg-bg-card border rounded-xl p-5 space-y-4', colors.bg, colors.border)}>
                  <div>
                    <div className="text-sm font-bold text-text-primary capitalize">{plan}</div>
                    <div className="text-xs text-text-muted mt-0.5">{config.description}</div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Setup Fee (€)</label>
                      <input type="number" className={inputCls} value={config.setup}
                        onChange={e => setPricing(p => ({ ...p, [plan]: { ...p[plan], setup: parseInt(e.target.value) || 0 } }))} />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Monthly (€)</label>
                      <input type="number" className={inputCls} value={config.monthly}
                        onChange={e => setPricing(p => ({ ...p, [plan]: { ...p[plan], monthly: parseInt(e.target.value) || 0 } }))} />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Agents Included</label>
                      <input type="number" className={inputCls} value={config.agents}
                        onChange={e => setPricing(p => ({ ...p, [plan]: { ...p[plan], agents: parseInt(e.target.value) || 1 } }))} />
                    </div>
                  </div>

                  {/* Margin Preview */}
                  <div className="bg-bg-surface rounded-lg p-3 space-y-1.5">
                    <div className="text-xs text-text-muted">Estimated Margin</div>
                    <div className="font-mono text-sm font-bold text-success">{formatEuro(Math.round(margin))}/mo</div>
                    <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.max(0, marginPct)}%`, backgroundColor: colors.accent }}
                      />
                    </div>
                    <div className="text-[10px] text-text-muted">{marginPct}% margin after costs</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Breakeven Analysis */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Breakeven Analysis</h3>
            <div className="grid grid-cols-3 gap-5 text-xs">
              <div className="bg-bg-surface rounded-lg p-3">
                <div className="text-text-muted mb-1">Fixed Costs/mo</div>
                <div className="font-mono text-lg font-bold text-danger">{formatEuro(VPS_COST)}</div>
                <div className="text-text-muted mt-1">VPS infrastructure</div>
              </div>
              <div className="bg-bg-surface rounded-lg p-3">
                <div className="text-text-muted mb-1">Breakeven Point</div>
                <div className="font-mono text-lg font-bold text-warning">
                  {Math.ceil(VPS_COST / pricing.starter.monthly)} Starter clients
                </div>
                <div className="text-text-muted mt-1">or {Math.ceil(VPS_COST / pricing.business.monthly)} Business clients</div>
              </div>
              <div className="bg-bg-surface rounded-lg p-3">
                <div className="text-text-muted mb-1">MRR Target</div>
                <div className="font-mono text-lg font-bold text-accent-violet">{formatEuro(MRR_TARGET)}/mo</div>
                <div className="text-text-muted mt-1">= {Math.ceil(MRR_TARGET / pricing.business.monthly)} Business clients</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          {/* System Status */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Server className="w-4 h-4" /> System Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Dashboard App', uptime: '99.9%', status: 'operational' },
                { label: 'VPS Server', uptime: '99.7%', status: 'operational' },
                { label: 'Telegram Bots', uptime: '99.8%', status: 'operational' },
                { label: 'OpenClaw API', uptime: '99.5%', status: 'operational' },
              ].map(item => (
                <div key={item.label} className="bg-bg-surface border border-border rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-text-primary">{item.label}</div>
                    <div className="text-[10px] text-text-muted">Uptime: {item.uptime}</div>
                  </div>
                  <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full border border-success/20">
                    ● {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Budget & Limits */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Budget & Limits
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted block mb-1">Daily API Budget (€)</label>
                <input type="number" className={inputCls} defaultValue={DAILY_API_BUDGET} />
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">VPS Monthly Cost (€)</label>
                <input type="number" className={inputCls} defaultValue={VPS_COST} />
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">MRR Target (€)</label>
                <input type="number" className={inputCls} defaultValue={MRR_TARGET} />
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Max tokens per request</label>
                <input type="number" className={inputCls} defaultValue={8192} />
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Data Management</h3>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => { if (confirm('Reset all data to demo state?')) window.location.reload() }}
                className="flex items-center gap-2 px-4 py-2 bg-danger/10 border border-danger/30 rounded-lg text-xs text-danger hover:bg-danger/20 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset to Demo Data
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary transition-all">
                Export JSON
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary transition-all">
                Export CSV
              </button>
            </div>
          </div>

          {/* Telegram Bot Links */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4" /> All Telegram Bots
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {agents.map(agent => (
                <a
                  key={agent.id}
                  href={getTelegramUrl(agent.telegramBot)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 bg-bg-surface border border-border rounded-lg hover:border-accent-violet/40 transition-all group"
                >
                  <span className="text-lg">{agent.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text-primary">{agent.name}</div>
                    <div className="text-[10px] text-text-muted truncate">@{agent.telegramBot}</div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-text-faint group-hover:text-accent-violet transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
