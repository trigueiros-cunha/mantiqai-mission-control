import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OPENCLAW_WS    = process.env.NEXT_PUBLIC_OPENCLAW_WS ?? 'wss://openclaw-luz6.srv1506369.hstgr.cloud/ws'
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN ?? 'zJpZgL6n3v58jRo6QZ04Z06sKdQDwMPB'

function openClawRPC(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const WS = globalThis.WebSocket
    const ws = new WS(OPENCLAW_WS)
    const timer = setTimeout(() => { ws.close(); reject(new Error('timeout')) }, 12000)
    const cleanup = () => { clearTimeout(timer); try { ws.close() } catch {} }

    ws.onerror = () => { cleanup(); reject(new Error('ws error')) }
    ws.onmessage = (event) => {
      let msg: any
      try { msg = JSON.parse(String(event.data)) } catch { return }

      if (msg.type === 'event' && msg.event === 'connect.challenge') {
        ws.send(JSON.stringify({
          type: 'req', id: 'conn', method: 'connect',
          params: {
            minProtocol: 3, maxProtocol: 3,
            client: { id: 'openclaw-control-ui', version: 'control-ui', platform: 'web', mode: 'ui' },
            role: 'operator',
            scopes: ['operator.admin', 'operator.read', 'operator.write', 'operator.approvals', 'operator.pairing'],
            caps: ['tool-events'],
            auth: { token: OPENCLAW_TOKEN },
          },
        }))
        return
      }
      if (msg.type === 'res' && msg.id === 'conn') {
        if (!msg.ok) { cleanup(); reject(new Error(msg.error?.message ?? 'connect rejected')); return }
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

export async function GET() {
  const creditBalance = parseFloat(process.env.ANTHROPIC_CREDIT_BALANCE ?? '20.65')

  try {
    const data = await openClawRPC('usage.cost') as any

    const daily = data.daily ?? []
    const today = daily[daily.length - 1]
    const monthlyCost = data.totals?.totalCost ?? 0

    return NextResponse.json({
      source: 'openclaw',
      date: today?.date ?? new Date().toISOString().split('T')[0],
      totalInputTokens: today?.input ?? 0,
      totalOutputTokens: today?.output ?? 0,
      totalTokens: today?.totalTokens ?? 0,
      totalCostToday: Math.round((today?.totalCost ?? 0) * 10000) / 10000,
      monthlyCost: Math.round(monthlyCost * 10000) / 10000,
      creditBalance,
      remainingBalance: Math.round((creditBalance - monthlyCost) * 100) / 100,
    })
  } catch (err) {
    return NextResponse.json({
      source: 'manual',
      totalCostToday: 0,
      monthlyCost: 0,
      creditBalance,
      remainingBalance: creditBalance,
      error: String(err),
    })
  }
}