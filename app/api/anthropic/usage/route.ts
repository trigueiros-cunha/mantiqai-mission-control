import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Anthropic pricing per million tokens (as of 2025)
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-4-5': { input: 0.8, output: 4 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4 },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
}

function calcCost(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICING[model] ?? { input: 3, output: 15 }
  return (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output
}

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 })
  }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  try {
    // Fetch usage from Anthropic API
    const res = await fetch(
      `https://api.anthropic.com/v1/usage?start_date=${yesterday}&end_date=${today}`,
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      const text = await res.text()
      console.error('Anthropic usage API error:', res.status, text)
      return NextResponse.json({ error: 'Anthropic API error', status: res.status }, { status: res.status })
    }

    const json = await res.json()
    const data: Array<{
      timestamp: string
      model: string
      input_tokens: number
      output_tokens: number
      cache_read_input_tokens?: number
      cache_creation_input_tokens?: number
    }> = json.data ?? []

    // Filter to today only
    const todayEntries = data.filter((e) => e.timestamp.startsWith(today))

    // Aggregate by model
    const byModel: Record<string, { inputTokens: number; outputTokens: number; cost: number; requests: number }> = {}
    let totalInput = 0
    let totalOutput = 0
    let totalCost = 0

    for (const entry of todayEntries) {
      const model = entry.model
      const input = entry.input_tokens + (entry.cache_read_input_tokens ?? 0)
      const output = entry.output_tokens
      const cost = calcCost(model, input, output)

      if (!byModel[model]) {
        byModel[model] = { inputTokens: 0, outputTokens: 0, cost: 0, requests: 0 }
      }
      byModel[model].inputTokens += input
      byModel[model].outputTokens += output
      byModel[model].cost += cost
      byModel[model].requests += 1

      totalInput += input
      totalOutput += output
      totalCost += cost
    }

    return NextResponse.json({
      date: today,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalTokens: totalInput + totalOutput,
      totalCost,
      byModel,
      rawEntries: todayEntries.length,
    })
  } catch (err) {
    console.error('Usage fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
  }
}
