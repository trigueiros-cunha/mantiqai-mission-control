'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { openClawConnection } from '@/lib/openclaw/connection'
import { frameToActivity, frameToStatusUpdate } from '@/lib/openclaw/events'

/**
 * Mounts once at app root. Boots the WebSocket connection and wires
 * incoming frames into the Zustand store so all components see live data.
 * Renders nothing — purely side-effects.
 */
export default function OpenClawProvider() {
  const setConnectionStatus = useStore((s) => s.setConnectionStatus)
  const setLastConnected    = useStore((s) => s.setLastConnected)
  const addActivity         = useStore((s) => s.addActivity)
  const updateLiveAgent     = useStore((s) => s.updateLiveAgentStatus)
  const thinkingTimers      = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    // ── Status changes ────────────────────────────────────────────────────
    const unsubStatus = openClawConnection.onStatusChange((status) => {
      setConnectionStatus(status)
      if (status === 'connected') {
        setLastConnected(new Date().toISOString())
      }
    })

    // ── Frame handler ─────────────────────────────────────────────────────
    const unsubFrames = openClawConnection.onFrame((frame) => {
      // Activity feed entry
      const entry = frameToActivity(frame)
      if (entry) {
        addActivity(entry)
      }

      // Agent status update
      const su = frameToStatusUpdate(frame)
      if (su) {
        updateLiveAgent(su.agentId, { status: su.status, isThinking: su.isThinking })

        // Auto-clear "thinking" after 10 s in case we miss the follow-up event
        if (su.isThinking) {
          clearTimeout(thinkingTimers.current[su.agentId])
          thinkingTimers.current[su.agentId] = setTimeout(() => {
            updateLiveAgent(su.agentId, { isThinking: false })
          }, 10_000)
        } else {
          clearTimeout(thinkingTimers.current[su.agentId])
        }
      }
    })

    // ── Boot connection ───────────────────────────────────────────────────
    openClawConnection.connect()

    return () => {
      unsubStatus()
      unsubFrames()
      Object.values(thinkingTimers.current).forEach(clearTimeout)
    }
  }, [setConnectionStatus, setLastConnected, addActivity, updateLiveAgent])

  return null
}
