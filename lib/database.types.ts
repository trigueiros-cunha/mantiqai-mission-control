export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      deals: {
        Row: {
          id: string
          company: string
          contact: string
          email: string
          phone: string
          sector: string
          stage: string
          priority: string
          score: number
          value_setup: number
          value_monthly: number
          source: string
          notes: string
          next_action: string
          next_action_date: string | null
          location_lat: number
          location_lng: number
          location_city: string
          assigned_agent: string
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          company: string
          contact?: string
          email?: string
          phone?: string
          sector?: string
          stage?: string
          priority?: string
          score?: number
          value_setup?: number
          value_monthly?: number
          source?: string
          notes?: string
          next_action?: string
          next_action_date?: string | null
          location_lat?: number
          location_lng?: number
          location_city?: string
          assigned_agent?: string
          created_by?: string
        }
        Update: {
          company?: string
          contact?: string
          email?: string
          phone?: string
          sector?: string
          stage?: string
          priority?: string
          score?: number
          value_setup?: number
          value_monthly?: number
          source?: string
          notes?: string
          next_action?: string
          next_action_date?: string | null
          location_lat?: number
          location_lng?: number
          location_city?: string
          assigned_agent?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          company: string
          sector: string
          plan: string
          mrr: number
          setup_fee: number
          agents_count: number
          agent_list: string[]
          health: number
          start_date: string
          renewal_date: string | null
          status: string
          contact: string
          email: string
          phone: string
          website: string
          location_lat: number
          location_lng: number
          location_city: string
          created_at: string
          updated_at: string
          deal_id: string | null
        }
        Insert: {
          id?: string
          company: string
          sector?: string
          plan?: string
          mrr?: number
          setup_fee?: number
          agents_count?: number
          agent_list?: string[]
          health?: number
          start_date?: string
          renewal_date?: string | null
          status?: string
          contact?: string
          email?: string
          phone?: string
          website?: string
          location_lat?: number
          location_lng?: number
          location_city?: string
          deal_id?: string | null
        }
        Update: {
          company?: string
          sector?: string
          plan?: string
          mrr?: number
          setup_fee?: number
          agents_count?: number
          agent_list?: string[]
          health?: number
          start_date?: string
          renewal_date?: string | null
          status?: string
          contact?: string
          email?: string
          phone?: string
          website?: string
          location_lat?: number
          location_lng?: number
          location_city?: string
          deal_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          status: string
          priority: string
          assigned_agent: string
          client_id: string | null
          deal_id: string | null
          due_date: string | null
          completed_at: string | null
          labels: string[]
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          status?: string
          priority?: string
          assigned_agent?: string
          client_id?: string | null
          deal_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          labels?: string[]
          created_by?: string
        }
        Update: {
          title?: string
          description?: string
          status?: string
          priority?: string
          assigned_agent?: string
          client_id?: string | null
          deal_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          labels?: string[]
        }
        Relationships: []
      }
      content: {
        Row: {
          id: string
          title: string
          type: string
          status: string
          body: string
          scheduled_date: string | null
          published_date: string | null
          labels: string[]
          impressions: number
          engagement: number
          clicks: number
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          title: string
          type?: string
          status?: string
          body?: string
          scheduled_date?: string | null
          published_date?: string | null
          labels?: string[]
          impressions?: number
          engagement?: number
          clicks?: number
          created_by?: string
        }
        Update: {
          title?: string
          type?: string
          status?: string
          body?: string
          scheduled_date?: string | null
          published_date?: string | null
          labels?: string[]
          impressions?: number
          engagement?: number
          clicks?: number
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          agent_id: string
          agent_name: string
          agent_emoji: string
          action: string
          type: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          agent_name?: string
          agent_emoji?: string
          action: string
          type?: string
          metadata?: Json
        }
        Update: {
          agent_id?: string
          agent_name?: string
          agent_emoji?: string
          action?: string
          type?: string
          metadata?: Json
        }
        Relationships: []
      }
      agent_logs: {
        Row: {
          id: string
          agent_id: string
          date: string
          messages: number
          tokens_input: number
          tokens_output: number
          cost: number
          errors: number
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          date?: string
          messages?: number
          tokens_input?: number
          tokens_output?: number
          cost?: number
          errors?: number
        }
        Update: {
          messages?: number
          tokens_input?: number
          tokens_output?: number
          cost?: number
          errors?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          title: string
          message: string
          type: string
          read: boolean
          link: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          message?: string
          type?: string
          read?: boolean
          link?: string
        }
        Update: {
          title?: string
          message?: string
          type?: string
          read?: boolean
          link?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
