import { OpenClawFrame } from './types'
import { ActivityEntry } from '../types'
import { generateId } from '../utils'

// Map lowercase OpenClaw agent IDs → dashboard identity
const AGENT_MAP: Record<string, { id: string; emoji: string; name: string }> = {
  leader:     { id: 'leader',     emoji: '👑', name: 'Leader' },
  scout:      { id: 'scout',      emoji: '🔍', name: 'Scout' },
  strategist: { id: 'strategist', emoji: '🧠', name: 'Strategist' },
  architect:  { id: 'architect',  emoji: '🏗️', name: 'Architect' },
  developer:  { id: 'developer',  emoji: '💻', name: 'Developer' },
  builder:    { id: 'builder',    emoji: '🔨', name: 'Builder' },
  qa:         { id: 'qa',         emoji: '🛡️', name: 'QA Tester' },
  content:    { id: 'content',    emoji: '🎨', name: 'Content' },
  keeper:     { id: 'keeper',     emoji: '🛡️', name: 'Keeper' },
}

function resolveAgent(raw?: string) {
  if (!raw) return { id: 'system', emoji: '⚙️', name: 'System' }
  const key = raw.toLowerCase().replace(/[^a-z]/g, '')
  return AGENT_MAP[key] ?? { id: raw, emoji: '🤖', name: raw }
}

function str(v: unknown, max = 100): string {
  if (!v) return ''
  return String(v).slice(0, max)
}

// Converts a raw WebSocket frame into an ActivityEntry for the store.
// Returns null for frames that should not appear in the feed (heartbeats, acks).
export function frameToActivity(frame: OpenClawFrame): Omit<ActivityEntry, 'id'> | null {
  if (frame.type !== 'event' || !frame.event) return null

  const p = (frame.payload ?? {}) as Record<string, unknown>
  const agentRaw = str(p.agentId ?? p.agent_id ?? p.agent)
  const agent = resolveAgent(agentRaw || undefined)
  const ts = new Date().toISOString()

  switch (frame.event) {
    case 'message.received': {
      const content = str(p.content ?? p.text ?? p.message, 100)
      const channel = str(p.channel ?? p.channelType ?? 'Telegram', 20)
      return {
        timestamp: ts,
        agentId: agent.id,
        agentEmoji: agent.emoji,
        agentName: agent.name,
        type: 'info',
        action: `[${channel}] Received: "${content}"`,
      }
    }

    case 'message.sent':
    case 'agent.response': {
      const content = str(p.content ?? p.text ?? p.response, 100)
      return {
        timestamp: ts,
        agentId: agent.id,
        agentEmoji: agent.emoji,
        agentName: agent.name,
        type: 'success',
        action: `Responded: "${content}"`,
      }
    }

    case 'agent.thinking': {
      return {
        timestamp: ts,
        agentId: agent.id,
        agentEmoji: agent.emoji,
        agentName: agent.name,
        type: 'info',
        action: 'Processing request...',
      }
    }

    case 'agent.status': {
      const status = str(p.status ?? p.newStatus, 20)
      const type = status === 'error' ? 'error' : status === 'active' ? 'success' : 'info'
      return {
        timestamp: ts,
        agentId: agent.id,
        agentEmoji: agent.emoji,
        agentName: agent.name,
        type,
        action: `Status → ${status}`,
      }
    }

    case 'session.created': {
      const user = str(p.userId ?? p.user_id ?? p.userName ?? 'user', 30)
      return {
        timestamp: ts,
        agentId: agent.id,
        agentEmoji: agent.emoji,
        agentName: agent.name,
        type: 'info',
        action: `New session with ${user}`,
      }
    }

    case 'session.updated':
      return null // Too noisy for feed

    case 'tool.invoked': {
      const tool = str(p.tool ?? p.toolName ?? p.name, 30)
      const args = p.args ? ` (${JSON.stringify(p.args).slice(0, 40)})` : ''
      return {
        timestamp: ts,
        agentId: agent.id,
        agentEmoji: agent.emoji,
        agentName: agent.name,
        type: 'info',
        action: `Tool: ${tool}${args}`,
      }
    }

    case 'error': {
      const msg = str(p.message ?? p.error ?? 'Unknown error', 100)
      return {
        timestamp: ts,
        agentId: agent.id,
        agentEmoji: agent.emoji,
        agentName: agent.name,
        type: 'error',
        action: `Error: ${msg}`,
      }
    }

    case 'heartbeat':
      return null

    default: {
      // Show unknown events as dimmed system messages
      const payload = Object.keys(p).length
        ? ': ' + JSON.stringify(p).slice(0, 60)
        : ''
      return {
        timestamp: ts,
        agentId: 'system',
        agentEmoji: '⚙️',
        agentName: 'System',
        type: 'info',
        action: `${frame.event}${payload}`,
      }
    }
  }
}

// Returns { agentId, status } if the frame carries a status update, else null.
export function frameToStatusUpdate(
  frame: OpenClawFrame
): { agentId: string; status: 'active' | 'idle' | 'error'; isThinking: boolean } | null {
  if (frame.type !== 'event' || !frame.event) return null
  const p = (frame.payload ?? {}) as Record<string, unknown>
  const agentRaw = str(p.agentId ?? p.agent_id ?? p.agent)
  if (!agentRaw) return null
  const agent = resolveAgent(agentRaw)

  if (frame.event === 'agent.status') {
    const status = str(p.status ?? p.newStatus) as 'active' | 'idle' | 'error'
    return { agentId: agent.id, status: status || 'idle', isThinking: false }
  }
  if (frame.event === 'agent.thinking') {
    return { agentId: agent.id, status: 'active', isThinking: true }
  }
  if (frame.event === 'message.sent' || frame.event === 'agent.response') {
    return { agentId: agent.id, status: 'active', isThinking: false }
  }
  if (frame.event === 'message.received') {
    return { agentId: agent.id, status: 'active', isThinking: false }
  }
  return null
}
