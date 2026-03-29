import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const creditBalance = parseFloat(process.env.ANTHROPIC_CREDIT_BALANCE ?? '20.65')

  try {
    // Fetch real cost data from OpenClaw
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'

    const res = await fetch(`${baseUrl}/api/gateway/usage/cost`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Gateway ${res.status}`)
    const data = await res.json()

    const daily = data.daily ?? []
    const today = daily[daily.length - 1]
    const monthlyCost = data.totals?.totalCost ?? 0

    return NextResponse.json({
      source: 'openclaw',
      date: today?.date ?? new Date().toISOString().split('T')[0],
      totalInputTokens: today?.input ?? 0,
      totalOutputTokens: today?.output ?? 0,
      totalTokens: today?.totalTokens ?? 0,
      totalCostToday: Math.round((today?.totalCost ?? 0) * 100) / 100,
      monthlyCost: Math.round(monthlyCost * 100) / 100,
      creditBalance,
      remainingBalance: Math.round((creditBalance - monthlyCost) * 100) / 100,
    })
  } catch (err) {
    // If OpenClaw fails, return just the balance
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