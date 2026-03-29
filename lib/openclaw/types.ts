export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

// Raw frame from WebSocket
export interface OpenClawFrame {
  type: 'req' | 'res' | 'event' | 'err' | 'ping' | 'pong'
  id?: string
  method?: string
  event?: string
  params?: Record<string, unknown>
  result?: Record<string, unknown>
  payload?: Record<string, unknown>
  error?: { code: string; message: string }
}

// Agent as reported by the gateway
export interface GatewayAgent {
  id: string
  name: string
  status: 'active' | 'idle' | 'error'
  lastMessage?: string
  messagesTotal?: number
  tokensToday?: number
  costToday?: number
  lastActiveAt?: string
}

export interface GatewaySession {
  id: string
  agentId: string
  channelId: string
  userId: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface GatewayChannel {
  id: string
  type: 'telegram' | string
  status: 'connected' | 'disconnected' | 'error'
  name?: string
  lastActivity?: string
}

export interface GatewayHealth {
  status: string
  uptime: number
  version?: string
}

export interface GatewayUsage {
  tokensToday: number
  costToday: number
  requestsToday: number
}

export interface GatewayStatus {
  agents?: GatewayAgent[]
  sessions?: GatewaySession[]
  channels?: GatewayChannel[]
  usage?: GatewayUsage
}

// Normalised live data per agent
export interface LiveAgentStatus {
  status: 'active' | 'idle' | 'error'
  lastMessage?: string
  messagesTotal: number
  tokensToday: number
  costToday: number
  isThinking: boolean
  lastActiveAt?: string
}

export interface SystemMetrics {
  uptime: number
  totalTokensToday: number
  totalCostToday: number
  lastHealthCheck: string
  activeAgents: number
  totalAgents: number
  activeSessions: number
  creditBalance: number | null
  remainingBalance: number | null
}