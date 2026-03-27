import {
  GatewayAgent,
  GatewayChannel,
  GatewayHealth,
  GatewaySession,
  GatewayStatus,
} from './types'

// All REST calls are proxied through /api/gateway/* to avoid CORS
const BASE = '/api/gateway'

async function gw<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store', ...options })
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export const getHealth = () => gw<GatewayHealth>('/health')

export const getStatus = () => gw<GatewayStatus>('/v1/status')

export const getAgents = () => gw<GatewayAgent[]>('/v1/agents')

export const getSessions = () => gw<GatewaySession[]>('/v1/sessions')

export const getChannels = () => gw<GatewayChannel[]>('/v1/channels')

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
