import { NextRequest, NextResponse } from 'next/server'
import WebSocket from 'ws'          // npm i ws  +  npm i -D @types/ws

/* ── env ─────────────────────────────────────────────────────────────── */
const OPENCLAW_WS  = process.env.NEXT_PUBLIC_OPENCLAW_WS
                   ?? 'wss://openclaw-luz6.srv1506369.hstgr.cloud/ws'
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN
                   ?? 'zJpZgL6n3v58jRo6QZ04Z06sKdQDwMPB'

/* ── helpers ─────────────────────────────────────────────────────────── */

/**
 * Open a WebSocket to OpenClaw, complete the connect handshake,
 * then call `method` and return the result as JSON.
 *
 * The full protocol is:
 *   1. Server sends  { type:"event", event:"connect.challenge", payload:{ nonce } }
 *   2. Client sends  { type:"req", id:"conn", method:"connect", params:{ auth, role, … } }
 *   3. Server sends  { type:"res", id:"conn", ok:true, payload:{ type:"hello-ok", … } }
 *   4. Client sends  { type:"req", id:"rpc",  method:<method>, params:<params> }
 *   5. Server sends  { type:"res", id:"rpc",  ok:true|false,  payload|error }
 */
function openClawRPC(method: string, params: Record<string, unknown> = {}, timeoutMs = 15_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(OPENCLAW_WS)
    const timer = setTimeout(() => {
      ws.close()
      reject(new Error(`OpenClaw RPC timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    const cleanup = () => { clearTimeout(timer); try { ws.close() } catch {} }

    ws.on('error', (err) => { cleanup(); reject(err) })

    ws.on('message', (raw) => {
      let msg: any
      try { msg = JSON.parse(raw.toString()) } catch { return }

      /* Step 1 → 2: respond to challenge */
      if (msg.type === 'event' && msg.event === 'connect.challenge') {
        ws.send(JSON.stringify({
          type: 'req',
          id: 'conn',
          method: 'connect',
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id:       'mission-control-proxy',
              version:  '1.0.0',
              platform: 'vercel',
              mode:     'backend',
            },
            role:   'operator',
            scopes: ['operator.admin'],
            caps:   ['tool-events'],
            auth:   { token: OPENCLAW_TOKEN },
          },
        }))
        return
      }

      /* Step 3: after hello-ok, fire the actual RPC */
      if (msg.type === 'res' && msg.id === 'conn') {
        if (!msg.ok) {
          cleanup()
          reject(new Error(msg.error?.message ?? 'connect rejected'))
          return
        }
        ws.send(JSON.stringify({
          type:   'req',
          id:     'rpc',
          method,
          params,
        }))
        return
      }

      /* Step 5: return the RPC result */
      if (msg.type === 'res' && msg.id === 'rpc') {
        cleanup()
        if (msg.ok) resolve(msg.payload)
        else reject(new Error(msg.error?.message ?? 'RPC failed'))
      }
    })
  })
}

/* ── Map URL paths to OpenClaw RPC methods ───────────────────────────── */

/**
 * The dashboard calls paths like /api/gateway/v1/status or /api/gateway/health.
 * We map those to the RPC methods the OpenClaw WebSocket actually supports.
 */
function resolveMethod(pathSegments: string[]): { method: string; params: Record<string, unknown> } {
  const joined = pathSegments.join('/')

  // Direct method mappings
  const methodMap: Record<string, string> = {
    'health':            'health',
    'v1/status':         'status',
    'status':            'status',
    'agents':            'agents.list',
    'agents/list':       'agents.list',
    'channels/status':   'channels.status',
    'channels':          'channels.status',
    'sessions':          'sessions.usage',
    'usage':             'usage.status',
    'usage/cost':        'usage.cost',
    'usage/status':      'usage.status',
    'config':            'config.get',
    'config/get':        'config.get',
    'models':            'models.list',
    'models/list':       'models.list',
    'skills/status':     'skills.status',
    'logs':              'logs.tail',
    'logs/tail':         'logs.tail',
    'tools/catalog':     'tools.catalog',
  }

  const method = methodMap[joined]
  if (method) return { method, params: {} }

  // Fallback: use the path itself as the method name (dot-separated)
  // e.g. "sessions/usage/timeseries" → "sessions.usage.timeseries"
  return { method: joined.replace(/\//g, '.'), params: {} }
}

/* ── Route handlers ──────────────────────────────────────────────────── */

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (await params).path
  const { method, params: rpcParams } = resolveMethod(path)

  try {
    const data = await openClawRPC(method, rpcParams)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: 'upstream_error', detail: String(err) },
      { status: 502 },
    )
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
    return NextResponse.json(
      { error: 'upstream_error', detail: String(err) },
      { status: 502 },
    )
  }
}