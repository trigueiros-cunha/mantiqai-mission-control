'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStore } from '../store'
import { openClawConnection } from './connection'
import { getHealth, getStatus } from './api'
import { ConnectionStatus, SystemMetrics } from './types'

export function useOpenClaw() {
  const [status, setStatus] = useState<ConnectionStatus>(openClawConnection.getStatus())

  useEffect(() => {
    setStatus(openClawConnection.getStatus())
    const unsub = openClawConnection.onStatusChange(setStatus)
    return () => { unsub() }
  }, [])

  const reconnect = useCallback(() => {
    openClawConnection.disconnect()
    setTimeout(() => openClawConnection.connect(), 150)
  }, [])

  return { status, reconnect }
}

export function useSystemHealth() {
  const agents = useStore((s) => s.agents)
  const connectionStatus = useStore((s) => s.connectionStatus)
  const updateLiveAgent = useStore((s) => s.updateLiveAgentStatus)

  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptime: 0,
    totalTokensToday: 0,
    totalCostToday: 0,
    lastHealthCheck: '',
    activeAgents: 0,
    totalAgents: agents.length,
    activeSessions: 0,
  })

  useEffect(() => {
    if (connectionStatus !== 'connected') return

    const poll = async () => {
      try {
        const [h, s] = await Promise.all([getHealth(), getStatus()])
        setMetrics({
          uptime: h.uptime ?? 0,
          totalTokensToday: s.usage?.tokensToday ?? 0,
          totalCostToday: s.usage?.costToday ?? 0,
          lastHealthCheck: new Date().toISOString(),
          activeAgents: s.agents?.filter((a) => a.status === 'active').length ?? 0,
          totalAgents: s.agents?.length ?? agents.length,
          activeSessions: s.sessions?.length ?? 0,
        })

        // Wire per-agent stats from HTTP into live store
        s.agents?.forEach((a) => {
          updateLiveAgent(a.id.toLowerCase(), {
            status: a.status,
            messagesTotal: a.messagesTotal ?? 0,
            tokensToday: a.tokensToday ?? 0,
            costToday: a.costToday ?? 0,
          })
        })
      } catch {}
    }

    poll()
    const t = setInterval(poll, 60_000)
    return () => clearInterval(t)
  }, [connectionStatus, agents.length, updateLiveAgent])

  return metrics
}

export function useAgentStats(agentId: string) {
  const agent = useStore((s) => s.agents.find((a) => a.id === agentId))
  const live = useStore((s) => s.liveAgentStatuses[agentId])

  return {
    messages: live?.messagesTotal ?? agent?.stats.messages ?? 0,
    tokens: agent?.stats.tokens ?? 0,
    cost: live?.costToday ?? agent?.stats.cost ?? 0,
    avgResponseTime: agent?.stats.avgResponseTime ?? 0,
    isOnline: (live?.status ?? agent?.status) === 'active',
    isThinking: live?.isThinking ?? false,
    status: live?.status ?? agent?.status ?? 'idle',
  }
}
