import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization — only created client-side when env vars are available
let _client: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  _client = createClient(url, key)
  return _client
}

// Custom storage adapter for Zustand persist
// Falls back to localStorage if Supabase is unavailable
export const supabaseStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null
    const client = getClient()
    if (!client) return localStorage.getItem(name)
    try {
      const { data, error } = await client
        .from('app_state')
        .select('value')
        .eq('key', name)
        .maybeSingle()
      if (error) return localStorage.getItem(name)
      return data?.value ?? localStorage.getItem(name)
    } catch {
      return localStorage.getItem(name)
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return
    localStorage.setItem(name, value)
    const client = getClient()
    if (!client) return
    try {
      await client
        .from('app_state')
        .upsert({ key: name, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    } catch {
      // Silent — localStorage already has the data
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(name)
    const client = getClient()
    if (!client) return
    try {
      await client.from('app_state').delete().eq('key', name)
    } catch {}
  },
}
