import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 15

const OPENCLAW_WS    = process.env.NEXT_PUBLIC_OPENCLAW_WS
                     ?? 'wss://openclaw-luz6.srv1506369.hstgr.cloud/ws'
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN
                     ?? 'zJpZgL6n3v58jRo6QZ04Z06sKdQDwMPB'

function openClawRPC(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // Use native globalThis.WebSocket (available in Node 21+)
    // or fallback to undici WebSocket (Node 18-20)
    let WS: typeof WebSocket
    try {
      WS = globalThis.WebSocket
    } catch {
      reject(new Error('WebSocket not available'))
      return
    }

    const ws = new WS(OPENCLAW_WS)
    const timer = setTimeout(() => {
      ws.close()
      reject(new Error('OpenClaw RPC timed out after 12000ms'))
    }, 12000)

    const cleanup = () => { clearTimeout(timer); try { ws.close() } catch {} }

    ws.onerror = () => { cleanup(); reject(new Error('WebSocket connection failed')) }

    ws.onmessage = (event) => {
      let msg: any
      try { msg = JSON.parse(String(event.data)) } catch { return }

      if (msg.type === 'event' && msg.event === 'connect.challenge') {
        ws.send(JSON.stringify({
          type: 'req',
          id: 'conn',
          method: 'connect',
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: 'gateway-client',
              version: '1.0.0',
              platform: 'vercel',
              mode: 'backend' as const,
            },
            role: 'operator',
            scopes: ['operator.admin'],
            caps: ['tool-events'],
            auth: { token: OPENCLAW_TOKEN },
          },
        }))
        return
      }

      if (msg.type === 'res' && msg.id === 'conn') {
        if (!msg.ok) {
          cleanup()
          reject(new Error(msg.error?.message ?? 'connect rejected'))
          return
        }
        ws.send(JSON.stringify({ type: 'req', id: 'rpc', method, params }))
        return
      }

      if (msg.type === 'res' && msg.id === 'rpc') {
        cleanup()
        if (msg.ok) resolve(msg.payload)
        else reject(new Error(msg.error?.message ?? 'RPC failed'))
      }
    }
  })
}

function resolveMethod(pathSegments: string[]): { method: string; params: Record<string, unknown> } {
  const joined = pathSegments.join('/')
  const methodMap: Record<string, string> = {
    'health':          'health',
    'v1/status':       'status',
    'status':          'status',
    'agents':          'agents.list',
    'agents/list':     'agents.list',
    'channels/status': 'channels.status',
    'channels':        'channels.status',
    'sessions':        'sessions.usage',
    'usage':           'usage.status',
    'usage/cost':      'usage.cost',
    'usage/status':    'usage.status',
    'config':          'config.get',
    'config/get':      'config.get',
    'models':          'models.list',
    'models/list':     'models.list',
    'skills/status':   'skills.status',
    'logs':            'logs.tail',
    'logs/tail':       'logs.tail',
    'tools/catalog':   'tools.catalog',
  }
  const method = methodMap[joined]
  if (method) return { method, params: {} }
  return { method: joined.replace(/\//g, '.'), params: {} }
}

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (await params).path
  const { method, params: rpcParams } = resolveMethod(path)
  try {
    const data = await openClawRPC(method, rpcParams)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'upstream_error', detail: String(err) }, { status: 502 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (await params).path
  const { method } = resolveMethod(path)
  try {
    const body = await req.json().catch(() => ({}))
    const data = await openClawRPC(method, body as Record<string, unknown>)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'upstream_error', detail: String(err) }, { status: 502 })
  }
}