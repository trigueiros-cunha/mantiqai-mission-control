'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabaseStorage } from './supabase'
import { Agent, Deal, Client, Task, ContentItem, ActivityEntry, Notification } from './types'
import { agentsData } from './data/agents'
import { dealsData } from './data/deals'
import { clientsData } from './data/clients'
import { tasksData } from './data/tasks'
import { contentData } from './data/content'
import { activityData } from './data/activity'
import { generateId } from './utils'
import type { ConnectionStatus, LiveAgentStatus } from './openclaw/types'

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

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
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

      // Initial Data
      agents: agentsData,
      deals: dealsData,
      clients: clientsData,
      tasks: tasksData,
      content: contentData,
      activity: activityData,
      notifications: [],

      // UI State
      sidebarCollapsed: false,
      activePage: 'command',
      searchQuery: '',
      selectedDealId: null,
      selectedClientId: null,
      selectedTaskId: null,

      // Agent Actions
      updateAgent: (id, updates) =>
        set((state) => ({
          agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),

      // Deal Actions
      addDeal: (deal) =>
        set((state) => ({
          deals: [
            ...state.deals,
            {
              ...deal,
              id: `deal-${generateId()}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              notes: [],
              history: [],
              daysInStage: 0,
            },
          ],
        })),
      updateDeal: (id, updates) =>
        set((state) => ({
          deals: state.deals.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        })),
      moveDeal: (id, stage) =>
        set((state) => ({
          deals: state.deals.map((d) =>
            d.id === id
              ? { ...d, stage, updatedAt: new Date().toISOString(), daysInStage: 0 }
              : d
          ),
        })),
      deleteDeal: (id) =>
        set((state) => ({ deals: state.deals.filter((d) => d.id !== id) })),

      // Client Actions
      addClient: (client) =>
        set((state) => ({
          clients: [...state.clients, { ...client, id: `client-${generateId()}` }],
        })),
      updateClient: (id, updates) =>
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteClient: (id) =>
        set((state) => ({ clients: state.clients.filter((c) => c.id !== id) })),

      // Task Actions
      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            { ...task, id: `task-${generateId()}`, createdAt: new Date().toISOString() },
          ],
        })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      moveTask: (id, status) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  completedAt: status === 'done' ? new Date().toISOString() : undefined,
                }
              : t
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
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
      addContent: (item) =>
        set((state) => ({
          content: [...state.content, { ...item, id: `content-${generateId()}` }],
        })),
      updateContent: (id, updates) =>
        set((state) => ({
          content: state.content.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteContent: (id) =>
        set((state) => ({ content: state.content.filter((c) => c.id !== id) })),

      // Activity Actions
      addActivity: (entry) =>
        set((state) => ({
          activity: [
            { ...entry, id: `act-${generateId()}` },
            ...state.activity.slice(0, 49),
          ],
        })),

      // Notification Actions
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            { ...notification, id: `notif-${generateId()}`, createdAt: new Date().toISOString() },
            ...state.notifications,
          ],
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

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
      getTodayAPICost: () =>
        get().agents.reduce((sum, a) => sum + a.stats.cost, 0),
    }),
    {
      name: 'mantiqai-store-v2',
      storage: createJSONStorage(() => supabaseStorage),
      partialize: (state) => ({
        agents: state.agents,
        deals: state.deals,
        clients: state.clients,
        tasks: state.tasks,
        content: state.content,
        notifications: state.notifications,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
