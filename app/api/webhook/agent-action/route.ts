import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? 'mantiqai-webhook-2024-secure-token'

// Use service role key for webhook writes (bypasses RLS)
// Uses untyped client intentionally — webhook handles dynamic external payloads
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

async function logActivity(
  sb: ReturnType<typeof getServiceClient>,
  agentId: string,
  action: string,
  type: string,
  metadata: Record<string, unknown> = {}
) {
  const agentMeta: Record<string, { name: string; emoji: string }> = {
    leader: { name: 'Leader', emoji: '👑' },
    scout: { name: 'Scout', emoji: '🔍' },
    strategist: { name: 'Strategist', emoji: '🧠' },
    architect: { name: 'Architect', emoji: '🏗️' },
    developer: { name: 'Developer', emoji: '💻' },
    builder: { name: 'Builder', emoji: '🔨' },
    qa: { name: 'QA Tester', emoji: '🛡️' },
    content: { name: 'Content', emoji: '🎨' },
    keeper: { name: 'Keeper', emoji: '🛡️' },
  }
  const meta = agentMeta[agentId] ?? { name: agentId, emoji: '🤖' }
  await sb.from('activities').insert({
    agent_id: agentId,
    agent_name: meta.name,
    agent_emoji: meta.emoji,
    action,
    type,
    metadata,
  })
}

export async function POST(req: NextRequest) {
  // Auth
  const token = req.headers.get('X-Webhook-Token')
  if (token !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { agent_id: string; action_type: string; data: Record<string, unknown>; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { agent_id, action_type, data, message } = body
  if (!agent_id || !action_type) {
    return NextResponse.json({ error: 'Missing agent_id or action_type' }, { status: 400 })
  }

  const sb = getServiceClient()

  try {
    switch (action_type) {
      // ── DEALS ─────────────────────────────────────────────────────────
      case 'deal.create': {
        const { error } = await sb.from('deals').insert({
          company: String(data.company ?? ''),
          contact: String(data.contact ?? ''),
          email: String(data.email ?? ''),
          phone: String(data.phone ?? ''),
          sector: String(data.sector ?? 'Technology'),
          stage: String(data.stage ?? 'lead'),
          priority: String(data.priority ?? 'medium'),
          score: Number(data.score ?? 5),
          value_setup: Number(data.value_setup ?? 0),
          value_monthly: Number(data.value_monthly ?? 0),
          source: String(data.source ?? agent_id),
          notes: data.notes ? JSON.stringify([{ content: data.notes, author: agent_id, createdAt: new Date().toISOString() }]) : '[]',
          location_lat: Number(data.location_lat ?? 41.1579),
          location_lng: Number(data.location_lng ?? -8.6291),
          location_city: String(data.location_city ?? 'Porto'),
          assigned_agent: agent_id,
          created_by: agent_id,
        })
        if (error) throw error
        await logActivity(sb, agent_id, message ?? `New deal created: ${data.company}`, 'success', data)
        break
      }

      case 'deal.update': {
        const dealId = String(data.deal_id ?? '')
        if (!dealId) return NextResponse.json({ error: 'Missing deal_id' }, { status: 400 })
        const update: Record<string, unknown> = {}
        if (data.stage !== undefined) update.stage = data.stage
        if (data.score !== undefined) update.score = Number(data.score)
        if (data.priority !== undefined) update.priority = data.priority
        if (data.next_action !== undefined) update.next_action = data.next_action
        if (data.next_action_date !== undefined) update.next_action_date = data.next_action_date
        if (data.notes !== undefined) {
          const { data: existing } = await sb.from('deals').select('notes').eq('id', dealId).single()
          let notes = []
          try { notes = JSON.parse(existing?.notes ?? '[]') } catch { notes = [] }
          notes.push({ id: Date.now(), content: String(data.notes), author: agent_id, createdAt: new Date().toISOString() })
          update.notes = JSON.stringify(notes)
        }
        const { error } = await sb.from('deals').update(update).eq('id', dealId)
        if (error) throw error
        await logActivity(sb, agent_id, message ?? `Deal updated`, 'info', data)
        break
      }

      case 'deal.stage_move': {
        const dealId = String(data.deal_id ?? '')
        if (!dealId) return NextResponse.json({ error: 'Missing deal_id' }, { status: 400 })
        const { error } = await sb.from('deals').update({ stage: String(data.stage) }).eq('id', dealId)
        if (error) throw error
        await logActivity(sb, agent_id, message ?? `Deal moved to ${data.stage}`, 'success', data)
        // Auto-create client when deal reaches 'delivered'
        if (data.stage === 'delivered') {
          const { data: deal } = await sb.from('deals').select('*').eq('id', dealId).single()
          if (deal) {
            await sb.from('clients').insert({
              company: deal.company,
              contact: deal.contact,
              email: deal.email,
              phone: deal.phone,
              sector: deal.sector,
              plan: 'starter',
              mrr: deal.value_monthly,
              setup_fee: deal.value_setup,
              status: 'active',
              health: 100,
              location_lat: deal.location_lat,
              location_lng: deal.location_lng,
              location_city: deal.location_city,
              deal_id: dealId,
            })
          }
        }
        break
      }

      // ── CLIENTS ───────────────────────────────────────────────────────
      case 'client.create': {
        const { error } = await sb.from('clients').insert({
          company: String(data.company ?? ''),
          contact: String(data.contact ?? ''),
          email: String(data.email ?? ''),
          phone: String(data.phone ?? ''),
          sector: String(data.sector ?? ''),
          plan: String(data.plan ?? 'starter'),
          mrr: Number(data.mrr ?? 0),
          setup_fee: Number(data.setup_fee ?? 0),
          status: String(data.status ?? 'active'),
          health: Number(data.health ?? 100),
          location_lat: Number(data.location_lat ?? 41.1579),
          location_lng: Number(data.location_lng ?? -8.6291),
          location_city: String(data.location_city ?? 'Porto'),
        })
        if (error) throw error
        await logActivity(sb, agent_id, message ?? `New client created: ${data.company}`, 'success', data)
        break
      }

      case 'client.update': {
        const clientId = String(data.client_id ?? '')
        if (!clientId) return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
        const update: Record<string, unknown> = {}
        if (data.health !== undefined) update.health = Number(data.health)
        if (data.status !== undefined) update.status = data.status
        if (data.mrr !== undefined) update.mrr = Number(data.mrr)
        if (data.plan !== undefined) update.plan = data.plan
        const { error } = await sb.from('clients').update(update).eq('id', clientId)
        if (error) throw error
        await logActivity(sb, agent_id, message ?? `Client updated`, 'info', data)
        break
      }

      case 'client.alert': {
        const clientId = String(data.client_id ?? '')
        const severity = String(data.severity ?? 'warning')
        if (data.health_delta !== undefined && clientId) {
          const { data: client } = await sb.from('clients').select('health').eq('id', clientId).single()
          if (client) {
            const newHealth = Math.max(0, Math.min(100, client.health + Number(data.health_delta)))
            await sb.from('clients').update({ health: newHealth }).eq('id', clientId)
          }
        }
        await logActivity(sb, agent_id, message ?? `Client alert`, severity === 'error' ? 'error' : 'warning', data)
        await sb.from('notifications').insert({
          title: `Alert: ${message ?? 'Client issue detected'}`,
          message: String(data.reason ?? ''),
          type: severity === 'error' ? 'error' : 'warning',
        })
        break
      }

      // ── TASKS ─────────────────────────────────────────────────────────
      case 'task.create': {
        const { error } = await sb.from('tasks').insert({
          title: String(data.title ?? ''),
          description: String(data.description ?? ''),
          status: 'todo',
          priority: String(data.priority ?? 'medium'),
          assigned_agent: String(data.assigned_agent ?? agent_id),
          client_id: data.client_id ? String(data.client_id) : null,
          deal_id: data.deal_id ? String(data.deal_id) : null,
          due_date: data.due_date ? String(data.due_date) : null,
          labels: Array.isArray(data.labels) ? data.labels : [],
          created_by: agent_id,
        })
        if (error) throw error
        await logActivity(sb, agent_id, message ?? `Task created: ${data.title}`, 'info', data)
        break
      }

      case 'task.update': {
        const taskId = String(data.task_id ?? '')
        if (!taskId) return NextResponse.json({ error: 'Missing task_id' }, { status: 400 })
        const update: Record<string, unknown> = {}
        if (data.status !== undefined) update.status = data.status
        if (data.priority !== undefined) update.priority = data.priority
        if (data.description !== undefined) update.description = data.description
        const { error } = await sb.from('tasks').update(update).eq('id', taskId)
        if (error) throw error
        await logActivity(sb, agent_id, message ?? `Task updated`, 'info', data)
        break
      }

      case 'task.complete': {
        const taskId = String(data.task_id ?? '')
        if (!taskId) return NextResponse.json({ error: 'Missing task_id' }, { status: 400 })
        const { error } = await sb.from('tasks')
          .update({ status: 'done', completed_at: new Date().toISOString() })
          .eq('id', taskId)
        if (error) throw error
        await logActivity(sb, agent_id, message ?? `Task completed`, 'success', data)
        break
      }

      // ── CONTENT ───────────────────────────────────────────────────────
      case 'content.create': {
        const { error } = await sb.from('content').insert({
          title: String(data.title ?? ''),
          type: String(data.type ?? 'linkedin'),
          status: String(data.status ?? 'draft'),
          body: String(data.body ?? ''),
          scheduled_date: data.scheduled_date ? String(data.scheduled_date) : null,
          labels: Array.isArray(data.labels) ? data.labels : [],
          created_by: agent_id,
        })
        if (error) throw error
        await logActivity(sb, agent_id, message ?? `Content created: ${data.title}`, 'success', data)
        break
      }

      case 'content.update': {
        const contentId = String(data.content_id ?? '')
        if (!contentId) return NextResponse.json({ error: 'Missing content_id' }, { status: 400 })
        const update: Record<string, unknown> = {}
        if (data.status !== undefined) update.status = data.status
        if (data.body !== undefined) update.body = data.body
        const { error } = await sb.from('content').update(update).eq('id', contentId)
        if (error) throw error
        await logActivity(sb, agent_id, message ?? `Content updated`, 'info', data)
        break
      }

      case 'content.publish': {
        const contentId = String(data.content_id ?? '')
        if (!contentId) return NextResponse.json({ error: 'Missing content_id' }, { status: 400 })
        const { error } = await sb.from('content')
          .update({ status: 'published', published_date: new Date().toISOString() })
          .eq('id', contentId)
        if (error) throw error
        await logActivity(sb, agent_id, message ?? `Content published`, 'success', data)
        break
      }

      // ── AGENT LOGS ────────────────────────────────────────────────────
      case 'agent.log': {
        const today = new Date().toISOString().split('T')[0]
        const { error } = await sb.from('agent_logs').upsert({
          agent_id,
          date: today,
          messages: Number(data.messages ?? 0),
          tokens_input: Number(data.tokens_input ?? 0),
          tokens_output: Number(data.tokens_output ?? 0),
          cost: Number(data.cost ?? 0),
          errors: Number(data.errors ?? 0),
        }, { onConflict: 'agent_id,date' })
        if (error) throw error
        break
      }

      // ── GENERIC ───────────────────────────────────────────────────────
      case 'activity.log': {
        await logActivity(sb, agent_id, message ?? 'Agent activity', String(data.type ?? 'info'), data)
        break
      }

      case 'notification': {
        await sb.from('notifications').insert({
          title: String(data.title ?? message ?? 'Agent notification'),
          message: String(data.message ?? ''),
          type: String(data.type ?? 'info'),
        })
        await logActivity(sb, agent_id, message ?? 'Notification sent', 'info', data)
        break
      }

      default:
        return NextResponse.json({ error: `Unknown action_type: ${action_type}` }, { status: 400 })
    }

    return NextResponse.json({ ok: true, action_type, agent_id })
  } catch (err) {
    console.error('[webhook] Error processing action:', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}
