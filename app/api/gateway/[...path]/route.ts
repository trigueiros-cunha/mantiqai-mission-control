import { NextRequest, NextResponse } from 'next/server'

const OPENCLAW_URL = process.env.NEXT_PUBLIC_OPENCLAW_URL ?? 'https://openclaw-luz6.srv1506369.hstgr.cloud'
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN ?? 'zJpZgL6n3v58jRo6QZ04Z06sKdQDwMPB'

// ── Session cache ──────────────────────────────────────────────────────────
// Module-level so it survives across requests within the same serverless
// instance. On a cold start or after eviction we just re-authenticate.
let sessionCookie: string | null = null

async function login(): Promise<string> {
  const form = new URLSearchParams()
  form.set('token', OPENCLAW_TOKEN)

  const res = await fetch(`${OPENCLAW_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    redirect: 'manual', // don't follow redirects — we need the Set-Cookie header
  })

  // Collect all Set-Cookie values into one header string
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) {
    throw new Error(`Login failed — no Set-Cookie returned (status ${res.status})`)
  }

  // Keep only the cookie name=value pairs (drop path/httponly/etc.)
  const cookie = setCookie
    .split(',')
    .map((part) => part.split(';')[0].trim())
    .join('; ')

  sessionCookie = cookie
  return cookie
}

// Returns true if the response looks like the login HTML page (i.e. the session
// has expired or was never established).
function isLoginRedirect(res: Response): boolean {
  const ct = res.headers.get('content-type') ?? ''
  return !ct.includes('application/json')
}

async function fetchWithAuth(url: string, init: RequestInit): Promise<Response> {
  if (!sessionCookie) await login()

  // Forçamos o header Cookie de forma mais explícita
  const headers = new Headers(init.headers)
  if (sessionCookie) {
    headers.set('Cookie', sessionCookie)
  }

  const res = await fetch(url, {
    ...init,
    headers: headers,
    cache: 'no-store',
  })

  if (isLoginRedirect(res)) {
    console.log("Sessão expirada, a renovar...");
    await login()
    headers.set('Cookie', sessionCookie!)
    return fetch(url, {
      ...init,
      headers: headers,
      cache: 'no-store',
    })
  }

  return res
}

// ── Handlers ───────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/')
  try {
    const res = await fetchWithAuth(`${OPENCLAW_URL}/${path}`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (isLoginRedirect(res)) {
      return NextResponse.json(
        { error: 'auth_failed', hint: 'Login succeeded but session was not accepted' },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ error: 'upstream_error', detail: String(err) }, { status: 502 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/')
  try {
    const body = await req.json()
    const res = await fetchWithAuth(`${OPENCLAW_URL}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (isLoginRedirect(res)) {
      return NextResponse.json(
        { error: 'auth_failed', hint: 'Login succeeded but session was not accepted' },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ error: 'upstream_error', detail: String(err) }, { status: 502 })
  }
}
