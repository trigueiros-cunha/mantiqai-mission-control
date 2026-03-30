import type { Tables, TablesInsert, TablesUpdate } from './database.types'
import type {
  Deal, Client, Task, ContentItem, ActivityEntry, Notification,
  Note, HistoryEntry, DealStage, Priority, Plan, ClientStatus, TaskStatus, ContentType, ContentStatus,
} from './types'

// ─── DEALS ──────────────────────────────────────────────────────────────────

type DbDeal = Tables<'deals'>

export function dbDealToDeal(row: DbDeal): Deal {
  let notes: Note[] = []
  try { notes = JSON.parse(row.notes || '[]') } catch { notes = [] }

  let history: HistoryEntry[] = []

  return {
    id: row.id,
    company: row.company,
    contact: row.contact,
    email: row.email,
    phone: row.phone,
    website: '',
    sector: row.sector,
    stage: row.stage as DealStage,
    value: { setup: Number(row.value_setup), monthly: Number(row.value_monthly) },
    score: row.score,
    priority: row.priority as Priority,
    assignedAgents: row.assigned_agent ? [row.assigned_agent] : [],
    notes,
    history,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    location: { lat: row.location_lat, lng: row.location_lng, city: row.location_city },
    daysInStage: 0,
  }
}

export function dealToDbInsert(deal: Omit<Deal, 'history' | 'daysInStage'> & { id: string }): TablesInsert<'deals'> {
  return {
    id: deal.id,
    company: deal.company,
    contact: deal.contact,
    email: deal.email,
    phone: deal.phone,
    sector: deal.sector,
    stage: deal.stage,
    priority: deal.priority,
    score: deal.score,
    value_setup: deal.value.setup,
    value_monthly: deal.value.monthly,
    notes: JSON.stringify(deal.notes ?? []),
    location_lat: deal.location?.lat ?? 41.1579,
    location_lng: deal.location?.lng ?? -8.6291,
    location_city: deal.location?.city ?? 'Porto',
    assigned_agent: deal.assignedAgents?.[0] ?? 'scout',
    created_by: 'manual',
  }
}

export function dealToDbUpdate(updates: Partial<Deal>): TablesUpdate<'deals'> {
  const out: TablesUpdate<'deals'> = {}
  if (updates.company !== undefined) out.company = updates.company
  if (updates.contact !== undefined) out.contact = updates.contact
  if (updates.email !== undefined) out.email = updates.email
  if (updates.phone !== undefined) out.phone = updates.phone
  if (updates.sector !== undefined) out.sector = updates.sector
  if (updates.stage !== undefined) out.stage = updates.stage
  if (updates.priority !== undefined) out.priority = updates.priority
  if (updates.score !== undefined) out.score = updates.score
  if (updates.value !== undefined) {
    out.value_setup = updates.value.setup
    out.value_monthly = updates.value.monthly
  }
  if (updates.notes !== undefined) out.notes = JSON.stringify(updates.notes)
  if (updates.location !== undefined) {
    out.location_lat = updates.location.lat
    out.location_lng = updates.location.lng
    out.location_city = updates.location.city
  }
  if (updates.assignedAgents !== undefined) out.assigned_agent = updates.assignedAgents[0] ?? 'scout'
  return out
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

type DbClient = Tables<'clients'>

export function dbClientToClient(row: DbClient): Client {
  return {
    id: row.id,
    company: row.company,
    sector: row.sector,
    plan: row.plan as Plan,
    mrr: Number(row.mrr),
    setupFee: Number(row.setup_fee),
    agents: row.agents_count,
    agentList: row.agent_list ?? [],
    health: row.health,
    startDate: row.start_date,
    renewalDate: row.renewal_date ?? '',
    status: row.status as ClientStatus,
    monthlyMetrics: [],
    location: { lat: row.location_lat, lng: row.location_lng, city: row.location_city },
    contact: row.contact,
    email: row.email,
    phone: row.phone,
    website: row.website,
  }
}

export function clientToDbInsert(client: Client): TablesInsert<'clients'> {
  return {
    id: client.id,
    company: client.company,
    sector: client.sector,
    plan: client.plan,
    mrr: client.mrr,
    setup_fee: client.setupFee,
    agents_count: client.agents,
    agent_list: client.agentList,
    health: client.health,
    start_date: client.startDate,
    renewal_date: client.renewalDate || null,
    status: client.status,
    contact: client.contact,
    email: client.email,
    phone: client.phone,
    website: client.website,
    location_lat: client.location?.lat ?? 41.1579,
    location_lng: client.location?.lng ?? -8.6291,
    location_city: client.location?.city ?? 'Porto',
  }
}

export function clientToDbUpdate(updates: Partial<Client>): TablesUpdate<'clients'> {
  const out: TablesUpdate<'clients'> = {}
  if (updates.company !== undefined) out.company = updates.company
  if (updates.sector !== undefined) out.sector = updates.sector
  if (updates.plan !== undefined) out.plan = updates.plan
  if (updates.mrr !== undefined) out.mrr = updates.mrr
  if (updates.setupFee !== undefined) out.setup_fee = updates.setupFee
  if (updates.agents !== undefined) out.agents_count = updates.agents
  if (updates.agentList !== undefined) out.agent_list = updates.agentList
  if (updates.health !== undefined) out.health = updates.health
  if (updates.startDate !== undefined) out.start_date = updates.startDate
  if (updates.renewalDate !== undefined) out.renewal_date = updates.renewalDate || null
  if (updates.status !== undefined) out.status = updates.status
  if (updates.contact !== undefined) out.contact = updates.contact
  if (updates.email !== undefined) out.email = updates.email
  if (updates.phone !== undefined) out.phone = updates.phone
  if (updates.website !== undefined) out.website = updates.website
  if (updates.location !== undefined) {
    out.location_lat = updates.location.lat
    out.location_lng = updates.location.lng
    out.location_city = updates.location.city
  }
  return out
}

// ─── TASKS ───────────────────────────────────────────────────────────────────

type DbTask = Tables<'tasks'>

// DB uses 'in-progress'/'review', frontend uses 'doing'/'blocked'
function dbStatusToTask(s: string): TaskStatus {
  if (s === 'in-progress') return 'doing'
  if (s === 'review') return 'blocked'
  return s as TaskStatus
}
function taskStatusToDb(s: TaskStatus): string {
  if (s === 'doing') return 'in-progress'
  if (s === 'blocked') return 'review'
  return s
}

export function dbTaskToTask(row: DbTask): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assignedAgent: row.assigned_agent,
    priority: row.priority as Priority,
    status: dbStatusToTask(row.status),
    dueDate: row.due_date ?? '',
    relatedClientId: row.client_id ?? undefined,
    relatedDealId: row.deal_id ?? undefined,
    subtasks: [],
    labels: row.labels ?? [],
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    timeSpent: 0,
  }
}

export function taskToDbInsert(task: Task): TablesInsert<'tasks'> {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: taskStatusToDb(task.status),
    priority: task.priority,
    assigned_agent: task.assignedAgent,
    client_id: task.relatedClientId ?? null,
    deal_id: task.relatedDealId ?? null,
    due_date: task.dueDate || null,
    completed_at: task.completedAt ?? null,
    labels: task.labels,
    created_by: 'manual',
  }
}

export function taskToDbUpdate(updates: Partial<Task>): TablesUpdate<'tasks'> {
  const out: TablesUpdate<'tasks'> = {}
  if (updates.title !== undefined) out.title = updates.title
  if (updates.description !== undefined) out.description = updates.description
  if (updates.status !== undefined) out.status = taskStatusToDb(updates.status)
  if (updates.priority !== undefined) out.priority = updates.priority
  if (updates.assignedAgent !== undefined) out.assigned_agent = updates.assignedAgent
  if (updates.relatedClientId !== undefined) out.client_id = updates.relatedClientId ?? null
  if (updates.relatedDealId !== undefined) out.deal_id = updates.relatedDealId ?? null
  if (updates.dueDate !== undefined) out.due_date = updates.dueDate || null
  if (updates.completedAt !== undefined) out.completed_at = updates.completedAt ?? null
  if (updates.labels !== undefined) out.labels = updates.labels
  return out
}

// ─── CONTENT ─────────────────────────────────────────────────────────────────

type DbContent = Tables<'content'>

export function dbContentToContent(row: DbContent): ContentItem {
  return {
    id: row.id,
    type: row.type as ContentType,
    title: row.title,
    status: row.status as ContentStatus,
    scheduledDate: row.scheduled_date ?? '',
    publishedDate: row.published_date ?? undefined,
    content: row.body,
    metrics: { impressions: row.impressions, engagement: row.engagement, clicks: row.clicks },
    labels: row.labels ?? [],
  }
}

export function contentToDbInsert(item: ContentItem): TablesInsert<'content'> {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.status,
    body: item.content ?? '',
    scheduled_date: item.scheduledDate || null,
    published_date: item.publishedDate ?? null,
    labels: item.labels,
    impressions: item.metrics?.impressions ?? 0,
    engagement: item.metrics?.engagement ?? 0,
    clicks: item.metrics?.clicks ?? 0,
    created_by: 'manual',
  }
}

export function contentToDbUpdate(updates: Partial<ContentItem>): TablesUpdate<'content'> {
  const out: TablesUpdate<'content'> = {}
  if (updates.title !== undefined) out.title = updates.title
  if (updates.type !== undefined) out.type = updates.type
  if (updates.status !== undefined) out.status = updates.status
  if (updates.content !== undefined) out.body = updates.content
  if (updates.scheduledDate !== undefined) out.scheduled_date = updates.scheduledDate || null
  if (updates.publishedDate !== undefined) out.published_date = updates.publishedDate ?? null
  if (updates.labels !== undefined) out.labels = updates.labels
  if (updates.metrics !== undefined) {
    out.impressions = updates.metrics.impressions
    out.engagement = updates.metrics.engagement
    out.clicks = updates.metrics.clicks
  }
  return out
}

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────

type DbActivity = Tables<'activities'>

export function dbActivityToEntry(row: DbActivity): ActivityEntry {
  return {
    id: row.id,
    timestamp: row.created_at,
    agentId: row.agent_id,
    agentEmoji: row.agent_emoji,
    agentName: row.agent_name,
    action: row.action,
    type: row.type as ActivityEntry['type'],
  }
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

type DbNotification = Tables<'notifications'>

export function dbNotificationToNotification(row: DbNotification): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type as Notification['type'],
    read: row.read,
    createdAt: row.created_at,
  }
}
