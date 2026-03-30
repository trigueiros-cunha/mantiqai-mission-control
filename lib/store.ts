'use client'

import { create } from 'zustand'
import { Agent, Deal, Client, Task, ContentItem, ActivityEntry, Notification } from './types'
import { agentsData } from './data/agents'
import { generateId } from './utils'
import type { ConnectionStatus, LiveAgentStatus } from './openclaw/types'
import {
  dealQueries, clientQueries, taskQueries, contentQueries,
  activityQueries, notificationQueries,
} from './supabase-queries'

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${generateId()}`
}

interface AppState {
  // ── OpenClaw live state ──────────────────────────────────────────────────
  connectionStatus: ConnectionStatus
  lastConnected: string | null
  liveAgentStatuses: Record<string, LiveAgentStatus>

  setConnectionStatus: (status: ConnectionStatus) => void
  setLastConnected: (ts: string) => void
  updateLiveAgentStatus: (agentId: string, data: Partial<LiveAgentStatus>) => void
  clearLiveAgentThinking: (agentId: string) => void

  // Data
  agents: Agent[]
  deals: Deal[]
  clients: Client[]
  tasks: Task[]
  content: ContentItem[]
  activity: ActivityEntry[]
  notifications: Notification[]

  // Hydration
  isHydrated: boolean
  hydrate: () => Promise<void>

  // UI State
  sidebarCollapsed: boolean
  activePage: string
  searchQuery: string
  selectedDealId: string | null
  selectedClientId: string | null
  selectedTaskId: string | null

  // Actions - Agents
  updateAgent: (id: string, updates: Partial<Agent>) => void

  // Actions - Deals
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateDeal: (id: string, updates: Partial<Deal>) => void
  moveDeal: (id: string, stage: Deal['stage']) => void
  deleteDeal: (id: string) => void

  // Actions - Clients
  addClient: (client: Omit<Client, 'id'>) => void
  updateClient: (id: string, updates: Partial<Client>) => void
  deleteClient: (id: string) => void

  // Actions - Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  moveTask: (id: string, status: Task['status']) => void
  deleteTask: (id: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void

  // Actions - Content
  addContent: (item: Omit<ContentItem, 'id'>) => void
  updateContent: (id: string, updates: Partial<ContentItem>) => void
  deleteContent: (id: string) => void

  // Actions - Activity
  addActivity: (entry: Omit<ActivityEntry, 'id'>) => void

  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void

  // Actions - UI
  setSidebarCollapsed: (collapsed: boolean) => void
  setActivePage: (page: string) => void
  setSearchQuery: (query: string) => void
  setSelectedDeal: (id: string | null) => void
  setSelectedClient: (id: string | null) => void
  setSelectedTask: (id: string | null) => void

  // Computed
  getTotalMRR: () => number
  getTotalPipelineValue: () => number
  getActiveAgents: () => number
  getOpenTasks: () => number
  getTodayAPICost: () => number
}

export const useStore = create<AppState>()((set, get) => ({
  // ── OpenClaw state ────────────────────────────────────────────────────
  connectionStatus: 'disconnected' as ConnectionStatus,
  lastConnected: null,
  liveAgentStatuses: {},

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setLastConnected: (ts) => set({ lastConnected: ts }),
  updateLiveAgentStatus: (agentId, data) =>
    set((state) => ({
      liveAgentStatuses: {
        ...state.liveAgentStatuses,
        [agentId]: {
          ...{ status: 'idle' as const, messagesTotal: 0, tokensToday: 0, costToday: 0, isThinking: false },
          ...state.liveAgentStatuses[agentId],
          ...data,
        },
      },
    })),
  clearLiveAgentThinking: (agentId) =>
    set((state) => ({
      liveAgentStatuses: {
        ...state.liveAgentStatuses,
        [agentId]: state.liveAgentStatuses[agentId]
          ? { ...state.liveAgentStatuses[agentId], isThinking: false }
          : state.liveAgentStatuses[agentId],
      },
    })),

  // Initial state — data loaded via hydrate()
  agents: agentsData,
  deals: [],
  clients: [],
  tasks: [],
  content: [],
  activity: [],
  notifications: [],

  // Hydration
  isHydrated: false,
  hydrate: async () => {
    if (get().isHydrated) return
    try {
      const [deals, clients, tasks, content, activity, notifications] = await Promise.all([
        dealQueries.getAll(),
        clientQueries.getAll(),
        taskQueries.getAll(),
        contentQueries.getAll(),
        activityQueries.getRecent(100),
        notificationQueries.getAll(),
      ])
      set({ deals, clients, tasks, content, activity, notifications, isHydrated: true })
    } catch (err) {
      console.error('[store] Hydration failed:', err)
      set({ isHydrated: true })
    }
  },

  // UI State
  sidebarCollapsed: false,
  activePage: 'command',
  searchQuery: '',
  selectedDealId: null,
  selectedClientId: null,
  selectedTaskId: null,

  // Agent Actions (agents are static config, no DB write needed)
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  // Deal Actions
  addDeal: (dealInput) => {
    const id = uuid()
    const now = new Date().toISOString()
    const newDeal: Deal = {
      ...dealInput,
      id,
      createdAt: now,
      updatedAt: now,
      notes: [],
      history: [],
      daysInStage: 0,
    }
    set((state) => ({ deals: [...state.deals, newDeal] }))
    dealQueries.create(newDeal).catch((err) => {
      console.error('[store] addDeal failed:', err)
      set((state) => ({ deals: state.deals.filter((d) => d.id !== id) }))
    })
  },

  updateDeal: (id, updates) => {
    set((state) => ({
      deals: state.deals.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ),
    }))
    dealQueries.update(id, updates).catch((err) => console.error('[store] updateDeal failed:', err))
  },

  moveDeal: (id, stage) => {
    set((state) => ({
      deals: state.deals.map((d) =>
        d.id === id ? { ...d, stage, updatedAt: new Date().toISOString(), daysInStage: 0 } : d
      ),
    }))
    dealQueries.update(id, { stage }).catch((err) => console.error('[store] moveDeal failed:', err))
  },

  deleteDeal: (id) => {
    const prev = get().deals.find((d) => d.id === id)
    set((state) => ({ deals: state.deals.filter((d) => d.id !== id) }))
    dealQueries.delete(id).catch((err) => {
      console.error('[store] deleteDeal failed:', err)
      if (prev) set((state) => ({ deals: [...state.deals, prev] }))
    })
  },

  // Client Actions
  addClient: (clientInput) => {
    const id = uuid()
    const newClient: Client = { ...clientInput, id }
    set((state) => ({ clients: [...state.clients, newClient] }))
    clientQueries.create(newClient).catch((err) => {
      console.error('[store] addClient failed:', err)
      set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }))
    })
  },

  updateClient: (id, updates) => {
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
    clientQueries.update(id, updates).catch((err) => console.error('[store] updateClient failed:', err))
  },

  deleteClient: (id) => {
    const prev = get().clients.find((c) => c.id === id)
    set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }))
    clientQueries.delete(id).catch((err) => {
      console.error('[store] deleteClient failed:', err)
      if (prev) set((state) => ({ clients: [...state.clients, prev] }))
    })
  },

  // Task Actions
  addTask: (taskInput) => {
    const id = uuid()
    const newTask: Task = { ...taskInput, id, createdAt: new Date().toISOString() }
    set((state) => ({ tasks: [...state.tasks, newTask] }))
    taskQueries.create(newTask).catch((err) => {
      console.error('[store] addTask failed:', err)
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
    })
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
    taskQueries.update(id, updates).catch((err) => console.error('[store] updateTask failed:', err))
  },

  moveTask: (id, status) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : undefined }
          : t
      ),
    }))
    const completedAt = status === 'done' ? new Date().toISOString() : undefined
    taskQueries.update(id, { status, completedAt }).catch((err) => console.error('[store] moveTask failed:', err))
  },

  deleteTask: (id) => {
    const prev = get().tasks.find((t) => t.id === id)
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
    taskQueries.delete(id).catch((err) => {
      console.error('[store] deleteTask failed:', err)
      if (prev) set((state) => ({ tasks: [...state.tasks, prev] }))
    })
  },

  toggleSubtask: (taskId, subtaskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, done: !s.done } : s
              ),
            }
          : t
      ),
    })),

  // Content Actions
  addContent: (itemInput) => {
    const id = uuid()
    const newItem: ContentItem = { ...itemInput, id }
    set((state) => ({ content: [...state.content, newItem] }))
    contentQueries.create(newItem).catch((err) => {
      console.error('[store] addContent failed:', err)
      set((state) => ({ content: state.content.filter((c) => c.id !== id) }))
    })
  },

  updateContent: (id, updates) => {
    set((state) => ({
      content: state.content.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
    contentQueries.update(id, updates).catch((err) => console.error('[store] updateContent failed:', err))
  },

  deleteContent: (id) => {
    const prev = get().content.find((c) => c.id === id)
    set((state) => ({ content: state.content.filter((c) => c.id !== id) }))
    contentQueries.delete(id).catch((err) => {
      console.error('[store] deleteContent failed:', err)
      if (prev) set((state) => ({ content: [...state.content, prev] }))
    })
  },

  // Activity Actions
  addActivity: (entry) => {
    const id = uuid()
    const newEntry: ActivityEntry = { ...entry, id }
    set((state) => ({
      activity: [newEntry, ...state.activity.slice(0, 99)],
    }))
    activityQueries.create({
      agent_id: entry.agentId,
      agent_name: entry.agentName,
      agent_emoji: entry.agentEmoji,
      action: entry.action,
      type: entry.type,
    }).catch((err) => console.error('[store] addActivity failed:', err))
  },

  // Notification Actions
  addNotification: (notification) => {
    const id = uuid()
    const newNotif: Notification = { ...notification, id, createdAt: new Date().toISOString() }
    set((state) => ({ notifications: [newNotif, ...state.notifications] }))
    notificationQueries.create({
      title: notification.title,
      message: notification.message,
      type: notification.type,
    }).catch((err) => console.error('[store] addNotification failed:', err))
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
    notificationQueries.markRead(id).catch((err) => console.error('[store] markNotificationRead failed:', err))
  },

  clearNotifications: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }))
    notificationQueries.markAllRead().catch((err) => console.error('[store] clearNotifications failed:', err))
  },

  // UI Actions
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setActivePage: (page) => set({ activePage: page }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDeal: (id) => set({ selectedDealId: id }),
  setSelectedClient: (id) => set({ selectedClientId: id }),
  setSelectedTask: (id) => set({ selectedTaskId: id }),

  // Computed
  getTotalMRR: () => get().clients.filter((c) => c.status === 'active').reduce((sum, c) => sum + c.mrr, 0),
  getTotalPipelineValue: () =>
    get().deals
      .filter((d) => d.stage !== 'delivered')
      .reduce((sum, d) => sum + d.value.setup + d.value.monthly * 12, 0),
  getActiveAgents: () => get().agents.filter((a) => a.status === 'active').length,
  getOpenTasks: () => get().tasks.filter((t) => t.status !== 'done').length,
  getTodayAPICost: () => {
    const live = get().liveAgentStatuses
    const liveTotal = Object.values(live).reduce((sum, l) => sum + (l?.costToday ?? 0), 0)
    if (liveTotal > 0) return liveTotal
    return get().agents.reduce((sum, a) => sum + a.stats.cost, 0)
  },
}))
