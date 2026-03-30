import { supabase } from './supabase'
import {
  dbDealToDeal, dealToDbInsert, dealToDbUpdate,
  dbClientToClient, clientToDbInsert, clientToDbUpdate,
  dbTaskToTask, taskToDbInsert, taskToDbUpdate,
  dbContentToContent, contentToDbInsert, contentToDbUpdate,
  dbActivityToEntry, dbNotificationToNotification,
} from './mappers'
import type { Deal, Client, Task, ContentItem, ActivityEntry, Notification } from './types'
import type { Tables, TablesInsert } from './database.types'

// ─── DEALS ───────────────────────────────────────────────────────────────────

export const dealQueries = {
  getAll: async (): Promise<Deal[]> => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as Tables<'deals'>[]).map(dbDealToDeal)
  },

  create: async (deal: Deal): Promise<void> => {
    const { error } = await supabase.from('deals').insert(dealToDbInsert(deal) as any)
    if (error) throw error
  },

  update: async (id: string, updates: Partial<Deal>): Promise<void> => {
    const { error } = await supabase.from('deals').update(dealToDbUpdate(updates) as any).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

export const clientQueries = {
  getAll: async (): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as Tables<'clients'>[]).map(dbClientToClient)
  },

  create: async (client: Client): Promise<void> => {
    const { error } = await supabase.from('clients').insert(clientToDbInsert(client) as any)
    if (error) throw error
  },

  update: async (id: string, updates: Partial<Client>): Promise<void> => {
    const { error } = await supabase.from('clients').update(clientToDbUpdate(updates) as any).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── TASKS ───────────────────────────────────────────────────────────────────

export const taskQueries = {
  getAll: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as Tables<'tasks'>[]).map(dbTaskToTask)
  },

  create: async (task: Task): Promise<void> => {
    const { error } = await supabase.from('tasks').insert(taskToDbInsert(task) as any)
    if (error) throw error
  },

  update: async (id: string, updates: Partial<Task>): Promise<void> => {
    const { error } = await supabase.from('tasks').update(taskToDbUpdate(updates) as any).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── CONTENT ─────────────────────────────────────────────────────────────────

export const contentQueries = {
  getAll: async (): Promise<ContentItem[]> => {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as Tables<'content'>[]).map(dbContentToContent)
  },

  create: async (item: ContentItem): Promise<void> => {
    const { error } = await supabase.from('content').insert(contentToDbInsert(item) as any)
    if (error) throw error
  },

  update: async (id: string, updates: Partial<ContentItem>): Promise<void> => {
    const { error } = await supabase.from('content').update(contentToDbUpdate(updates) as any).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('content').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────

export const activityQueries = {
  getRecent: async (limit = 100): Promise<ActivityEntry[]> => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return ((data ?? []) as Tables<'activities'>[]).map(dbActivityToEntry)
  },

  getWarningsAndErrors: async (limit = 10): Promise<ActivityEntry[]> => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .in('type', ['warning', 'error'])
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return ((data ?? []) as Tables<'activities'>[]).map(dbActivityToEntry)
  },

  create: async (entry: Omit<TablesInsert<'activities'>, 'id'>): Promise<void> => {
    const { error } = await supabase.from('activities').insert(entry as any)
    if (error) throw error
  },
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const notificationQueries = {
  getAll: async (): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return ((data ?? []) as Tables<'notifications'>[]).map(dbNotificationToNotification)
  },

  create: async (n: Omit<TablesInsert<'notifications'>, 'id'>): Promise<void> => {
    const { error } = await supabase.from('notifications').insert(n as any)
    if (error) throw error
  },

  markRead: async (id: string): Promise<void> => {
    const { error } = await supabase.from('notifications').update({ read: true } as any).eq('id', id)
    if (error) throw error
  },

  markAllRead: async (): Promise<void> => {
    const { error } = await supabase.from('notifications').update({ read: true } as any).eq('read', false)
    if (error) throw error
  },
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export const settingsQueries = {
  get: async (key: string): Promise<unknown> => {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (error) throw error
    return (data as any)?.value ?? null
  },

  getAll: async (): Promise<Record<string, unknown>> => {
    const { data, error } = await supabase.from('settings').select('*')
    if (error) throw error
    return Object.fromEntries(((data ?? []) as Tables<'settings'>[]).map(row => [row.key, row.value]))
  },

  set: async (key: string, value: unknown): Promise<void> => {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value: value as any, updated_at: new Date().toISOString() } as any, { onConflict: 'key' })
    if (error) throw error
  },
}

// ─── AGENT LOGS ───────────────────────────────────────────────────────────────

export const agentLogQueries = {
  getTodayByAgent: async (): Promise<Record<string, { messages: number; tokens: number; cost: number }>> => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('date', today)
    if (error) throw error
    return Object.fromEntries(
      ((data ?? []) as Tables<'agent_logs'>[]).map(row => [
        row.agent_id,
        {
          messages: row.messages,
          tokens: row.tokens_input + row.tokens_output,
          cost: Number(row.cost),
        },
      ])
    )
  },

  upsert: async (
    agentId: string,
    data: { messages: number; tokens_input: number; tokens_output: number; cost: number; errors?: number }
  ): Promise<void> => {
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('agent_logs')
      .upsert({ agent_id: agentId, date: today, ...data } as any, { onConflict: 'agent_id,date' })
    if (error) throw error
  },
}
