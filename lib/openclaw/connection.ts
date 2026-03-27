import { ConnectionStatus, OpenClawFrame } from './types'

type FrameHandler = (frame: OpenClawFrame) => void
type StatusHandler = (status: ConnectionStatus) => void

const WS_URL = process.env.NEXT_PUBLIC_OPENCLAW_WS ?? 'ws://187.124.44.65:53823/ws'
const TOKEN = process.env.NEXT_PUBLIC_OPENCLAW_TOKEN ?? ''
const HEARTBEAT_MS = 25_000
const MAX_BACKOFF_MS = 30_000

let reqCounter = 1
const nextId = () => `mc-${reqCounter++}`

class OpenClawConnection {
  private ws: WebSocket | null = null
  private _status: ConnectionStatus = 'disconnected'
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private attempts = 0
  private frameHandlers = new Set<FrameHandler>()
  private statusHandlers = new Set<StatusHandler>()
  private sendQueue: string[] = []

  // ── Public API ────────────────────────────────────────────────────────────

  connect() {
    if (typeof window === 'undefined') return
    if (this.ws?.readyState === WebSocket.CONNECTING) return
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.setStatus('connecting')

    try {
      this.ws = new WebSocket(WS_URL)
      this.ws.onopen = this.onOpen
      this.ws.onmessage = this.onMessage
      this.ws.onerror = this.onError
      this.ws.onclose = this.onClose
    } catch {
      this.setStatus('error')
      this.scheduleReconnect()
    }
  }

  disconnect() {
    this.cancelReconnect()
    this.stopHeartbeat()
    const prev = this._status
    this._status = 'disconnected'
    if (prev !== 'disconnected') this.statusHandlers.forEach((h) => h('disconnected'))
    this.ws?.close()
    this.ws = null
  }

  send(data: Record<string, unknown>) {
    const raw = JSON.stringify(data)
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(raw)
    } else {
      this.sendQueue.push(raw)
    }
  }

  onFrame(handler: FrameHandler) {
    this.frameHandlers.add(handler)
    return () => this.frameHandlers.delete(handler)
  }

  onStatusChange(handler: StatusHandler) {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  getStatus(): ConnectionStatus {
    return this._status
  }

  // ── Private handlers ──────────────────────────────────────────────────────

  private onOpen = () => {
    this.attempts = 0
    this.sendHandshake()
    this.startHeartbeat()
    // Flush queued messages
    const q = this.sendQueue.splice(0)
    q.forEach((msg) => this.ws?.send(msg))
  }

  private onMessage = (ev: MessageEvent) => {
    try {
      const frame = JSON.parse(ev.data as string) as OpenClawFrame

      // Handle challenge-response auth
      if (frame.type === 'req' && frame.method === 'connect.challenge') {
        this.send({ type: 'res', id: frame.id, result: { token: TOKEN } })
        return
      }

      // Connection ack
      if (frame.type === 'res' && frame.id === 'connect-1') {
        this.setStatus('connected')
      }

      // Pong
      if (frame.type === 'pong') return

      this.frameHandlers.forEach((h) => h(frame))
    } catch {
      // malformed frame — ignore
    }
  }

  private onError = () => {
    this.setStatus('error')
  }

  private onClose = () => {
    this.stopHeartbeat()
    if (this._status !== 'disconnected') {
      this.setStatus('disconnected')
      this.scheduleReconnect()
    }
  }

  private sendHandshake() {
    this.send({
      type: 'req',
      id: 'connect-1',
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'mantiq-mission-control',
          version: '1.0.0',
          platform: 'web',
          mode: 'operator',
        },
        role: 'operator',
        scopes: ['operator.read'],
        auth: { token: TOKEN },
      },
    })
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', id: nextId() })
      }
    }, HEARTBEAT_MS)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect() {
    this.cancelReconnect()
    const delay = Math.min(1_000 * 2 ** this.attempts, MAX_BACKOFF_MS)
    this.attempts++
    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }

  private cancelReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private setStatus(s: ConnectionStatus) {
    if (this._status === s) return
    this._status = s
    this.statusHandlers.forEach((h) => h(s))
  }
}

// Module-level singleton — persists across page navigations
export const openClawConnection = new OpenClawConnection()
