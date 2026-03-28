import { ConnectionStatus, OpenClawFrame } from './types'

type FrameHandler = (frame: OpenClawFrame) => void
type StatusHandler = (status: ConnectionStatus) => void

const WS_URL = 'wss://openclaw-luz6.srv1506369.hstgr.cloud/ws'
const HEARTBEAT_MS = 25_000
const MAX_BACKOFF_MS = 30_000

let _idCounter = 0
const nextId = () => `mc-${++_idCounter}`

const FALLBACK_TOKEN = 'zJpZgL6n3v58jRo6QZ04Z06sKdQDwMPB'

// Helper para gerir o Token no Browser
const getStoredToken = () => {
  if (typeof window === 'undefined') return FALLBACK_TOKEN
  return localStorage.getItem('openclaw_token') || FALLBACK_TOKEN
}

// ID de instância estável — identifica este "device" no sistema de pairing
const getOrCreateInstanceId = () => {
  if (typeof window === 'undefined') return 'mantiq-mission-control'
  let id = localStorage.getItem('openclaw_instance_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('openclaw_instance_id', id)
  }
  return id
}

// Guarda o deviceToken retornado pelo servidor após aprovação
const saveDeviceToken = (token: string) => {
  if (typeof window !== 'undefined') localStorage.setItem('openclaw_device_token', token)
}
const getDeviceToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('openclaw_device_token')
}

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
      const frame = JSON.parse(ev.data as string) as any // Usamos any para evitar erros de tipos agora

      // 1. Captura erros explícitos do servidor
      if (frame.type === 'err') {
        console.error('[OpenClaw] Server error frame:', JSON.stringify(frame))
        this.setStatus('error')
        return
      }

      // 2. Se o servidor pedir a chave (Challenge)
      if (frame.type === 'req' && frame.method === 'connect.challenge') {
        let currentToken = getStoredToken()

        // Se não houver token guardado, pede ao utilizador
        if (!currentToken) {
          currentToken = window.prompt("Insira o seu OpenClaw Token (zJpZg...):") || ''
          if (currentToken) localStorage.setItem('openclaw_token', currentToken)
        }

        console.debug('[OpenClaw] Responding to connect.challenge, id:', frame.id, 'nonce:', frame.params?.nonce)
        this.send({
          type: 'res',
          id: frame.id,
          result: { token: currentToken }
        })
        return
      }

      // 3. Se a conexão for aceite (resposta ao connect inicial)
      if (frame.type === 'res' && (frame.id === 'connect-1' || frame.method === 'connect')) {
        console.debug('[OpenClaw] Connection accepted:', JSON.stringify(frame))
        const deviceToken = frame.result?.auth?.deviceToken as string | undefined
        if (deviceToken) {
          console.debug('[OpenClaw] Saving device token for future connections')
          saveDeviceToken(deviceToken)
        }
        this.setStatus('connected')
      }

      if (frame.type === 'pong') return
      this.frameHandlers.forEach((h) => h(frame))
    } catch (e) {
      console.error("Erro no processamento da mensagem:", e)
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
    const deviceToken = getDeviceToken()
    this.send({
      type: 'req',
      id: 'connect-1',
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'openclaw-control-ui',
          version: 'control-ui',
          platform: 'web',
          mode: 'webchat',
          instanceId: getOrCreateInstanceId(),
        },
        role: 'operator',
        scopes: ['operator.read', 'operator.admin'],
        auth: deviceToken
          ? { deviceToken }
          : { token: getStoredToken() },
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
