import { NextRequest, NextResponse } from 'next/server'

const OPENCLAW_URL = process.env.NEXT_PUBLIC_OPENCLAW_URL ?? 'https://openclaw-luz6.srv1506369.hstgr.cloud'
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN ?? 'zJpZgL6n3v58jRo6QZ04Z06sKdQDwMPB'

async function fetchWithAuth(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
}

// ── Handlers ───────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (await params).path.join('/')
  try {
    const res = await fetchWithAuth(`${OPENCLAW_URL}/${path}`, {})
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ error: 'upstream_error', detail: String(err) }, { status: 502 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (await params).path.join('/')
  try {
    const body = await req.json()
    const res = await fetchWithAuth(`${OPENCLAW_URL}/${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ error: 'upstream_error', detail: String(err) }, { status: 502 })
  }
}
