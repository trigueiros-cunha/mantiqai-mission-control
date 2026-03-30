'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import {
  dbDealToDeal, dbClientToClient, dbTaskToTask,
  dbContentToContent, dbActivityToEntry, dbNotificationToNotification,
} from '@/lib/mappers'

export default function SupabaseRealtimeProvider() {
  useEffect(() => {
    const channel = supabase
      .channel('realtime-all')

      // ── Deals ──────────────────────────────────────────────────────────
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deals' }, ({ new: row }) => {
        const deal = dbDealToDeal(row as any)
        useStore.setState((s) => {
          if (s.deals.find((d) => d.id === deal.id)) return s
          return { deals: [deal, ...s.deals] }
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deals' }, ({ new: row }) => {
        const deal = dbDealToDeal(row as any)
        useStore.setState((s) => ({
          deals: s.deals.map((d) => (d.id === deal.id ? deal : d)),
        }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'deals' }, ({ old: row }) => {
        useStore.setState((s) => ({
          deals: s.deals.filter((d) => d.id !== (row as any).id),
        }))
      })

      // ── Clients ─────────────────────────────────────────────────────────
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clients' }, ({ new: row }) => {
        const client = dbClientToClient(row as any)
        useStore.setState((s) => {
          if (s.clients.find((c) => c.id === client.id)) return s
          return { clients: [client, ...s.clients] }
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients' }, ({ new: row }) => {
        const client = dbClientToClient(row as any)
        useStore.setState((s) => ({
          clients: s.clients.map((c) => (c.id === client.id ? client : c)),
        }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clients' }, ({ old: row }) => {
        useStore.setState((s) => ({
          clients: s.clients.filter((c) => c.id !== (row as any).id),
        }))
      })

      // ── Tasks ───────────────────────────────────────────────────────────
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, ({ new: row }) => {
        const task = dbTaskToTask(row as any)
        useStore.setState((s) => {
          if (s.tasks.find((t) => t.id === task.id)) return s
          return { tasks: [task, ...s.tasks] }
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, ({ new: row }) => {
        const task = dbTaskToTask(row as any)
        useStore.setState((s) => ({
          tasks: s.tasks.map((t) => (t.id === task.id ? { ...task, subtasks: t.subtasks } : t)),
        }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, ({ old: row }) => {
        useStore.setState((s) => ({
          tasks: s.tasks.filter((t) => t.id !== (row as any).id),
        }))
      })

      // ── Content ─────────────────────────────────────────────────────────
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'content' }, ({ new: row }) => {
        const item = dbContentToContent(row as any)
        useStore.setState((s) => {
          if (s.content.find((c) => c.id === item.id)) return s
          return { content: [item, ...s.content] }
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'content' }, ({ new: row }) => {
        const item = dbContentToContent(row as any)
        useStore.setState((s) => ({
          content: s.content.map((c) => (c.id === item.id ? item : c)),
        }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'content' }, ({ old: row }) => {
        useStore.setState((s) => ({
          content: s.content.filter((c) => c.id !== (row as any).id),
        }))
      })

      // ── Activities ──────────────────────────────────────────────────────
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, ({ new: row }) => {
        const entry = dbActivityToEntry(row as any)
        useStore.setState((s) => {
          if (s.activity.find((a) => a.id === entry.id)) return s
          return { activity: [entry, ...s.activity.slice(0, 99)] }
        })
      })

      // ── Notifications ───────────────────────────────────────────────────
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, ({ new: row }) => {
        const notif = dbNotificationToNotification(row as any)
        useStore.setState((s) => {
          if (s.notifications.find((n) => n.id === notif.id)) return s
          return { notifications: [notif, ...s.notifications] }
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, ({ new: row }) => {
        const notif = dbNotificationToNotification(row as any)
        useStore.setState((s) => ({
          notifications: s.notifications.map((n) => (n.id === notif.id ? notif : n)),
        }))
      })

      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return null
}
