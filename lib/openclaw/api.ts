import {
  GatewayAgent,
  GatewayHealth,
  GatewayStatus,
} from './types'

// All REST calls are proxied through /api/gateway/* which does WS-RPC
const BASE = '/api/gateway'

async function gw<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store', ...options })
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

/* ── Health ───────────────────────────────────────────────────────────── */

export async function getHealth(): Promise<GatewayHealth> {
  const raw = await gw<any>('/health')
  return {
    status: raw.ok ? 'ok' : 'error',
    uptime: raw.durationMs ?? 0,
    version: raw.agents?.[0]?.heartbeat?.every ?? undefined,
  }
}

/* ── Status  (the main poller) ───────────────────────────────────────── */

export async function getStatus(): Promise<GatewayStatus> {
  // Fetch both status and usage/cost in parallel
  const [statusRaw, costRaw] = await Promise.all([
    gw<any>('/v1/status'),
    gw<any>('/usage/cost').catch(() => null),
  ])

  // --- Map agents from sessions.recent ---
  const recentSessions: any[] = statusRaw.sessions?.recent ?? []
  const heartbeatAgents: any[] = statusRaw.heartbeat?.agents ?? []

  const agents: GatewayAgent[] = recentSessions.map((session: any) => {
    const agentId = session.agentId ?? 'unknown'
    const hbAgent = heartbeatAgents.find((h: any) => h.agentId === agentId)
    const isActive = hbAgent?.enabled === true
    const ageMs = session.age ?? Infinity
    const recentlyActive = ageMs < 3600_000 // active in the last hour

    return {
      id: agentId,
      name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
      status: recentlyActive ? 'active' : (isActive ? 'idle' : 'idle'),
      messagesTotal: (session.inputTokens ?? 0) > 0 ? 1 : 0, // approximate
      tokensToday: session.totalTokens ?? 0,
      costToday: 0, // will be filled from cost endpoint
      lastActiveAt: session.updatedAt
        ? new Date(session.updatedAt).toISOString()
        : undefined,
    } satisfies GatewayAgent
  })

  // --- Map usage from cost endpoint ---
  const dailyToday = costRaw?.daily?.[costRaw.daily.length - 1]
  const totalCost = dailyToday?.totalCost ?? costRaw?.totals?.totalCost ?? 0
  const totalTokens = dailyToday?.totalTokens ?? costRaw?.totals?.totalTokens ?? 0

  // Distribute cost proportionally across agents by token usage
  const totalAgentTokens = agents.reduce((sum, a) => sum + a.tokensToday!, 0)
  if (totalAgentTokens > 0 && totalCost > 0) {
    agents.forEach((a) => {
      a.costToday = (a.tokensToday! / totalAgentTokens) * totalCost
    })
  }

  // --- Map channels ---
  const channelSummary: string[] = statusRaw.channelSummary ?? []
  const channels = channelSummary
    .filter((line: string) => !line.startsWith('  '))
    .map((line: string) => {
      const [name, ...rest] = line.split(':')
      const statusText = rest.join(':').trim().toLowerCase()
      return {
        id: name.trim().toLowerCase(),
        type: name.trim().toLowerCase(),
        status: statusText.includes('configured') || statusText.includes('linked')
          ? 'connected' as const
          : 'disconnected' as const,
        name: name.trim(),
      }
    })

  return {
    agents,
    sessions: [],
    channels,
    usage: {
      tokensToday: totalTokens,
      costToday: totalCost,
      requestsToday: recentSessions.length,
    },
  }
}

/* ── Convenience (kept for compatibility) ─────────────────────────────── */

export const getAgents = async () => (await getStatus()).agents ?? []
export const getSessions = async () => (await getStatus()).sessions ?? []
export const getChannels = async () => (await getStatus()).channels ?? []

export async function sendMessage(agentId: string, message: string): Promise<unknown> {
  return gw('/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `openclaw:${agentId}`,
      messages: [{ role: 'user', content: message }],
    }),
  })
}