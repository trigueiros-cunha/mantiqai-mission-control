export const STAGE_CONFIG = {
  lead: { label: 'New Lead', emoji: '🟢', color: '#10b981', bgColor: 'bg-success/10', textColor: 'text-success' },
  contacted: { label: 'Contacted', emoji: '📞', color: '#3b82f6', bgColor: 'bg-info/10', textColor: 'text-info' },
  diagnosis: { label: 'Diagnosis', emoji: '🔍', color: '#f59e0b', bgColor: 'bg-warning/10', textColor: 'text-warning' },
  proposal: { label: 'Proposal', emoji: '📋', color: '#a78bfa', bgColor: 'bg-accent-violet/10', textColor: 'text-accent-violet' },
  building: { label: 'Building', emoji: '🔨', color: '#ec4899', bgColor: 'bg-accent-pink/10', textColor: 'text-accent-pink' },
  delivered: { label: 'Delivered', emoji: '✅', color: '#10b981', bgColor: 'bg-success/10', textColor: 'text-success' },
} as const

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: '#ef4444', dot: '🔴', bgColor: 'bg-danger/10', textColor: 'text-danger' },
  high: { label: 'High', color: '#f97316', dot: '🟠', bgColor: 'bg-orange-500/10', textColor: 'text-orange-400' },
  medium: { label: 'Medium', color: '#f59e0b', dot: '🟡', bgColor: 'bg-warning/10', textColor: 'text-warning' },
  low: { label: 'Low', color: '#6d7a96', dot: '⚪', bgColor: 'bg-text-muted/10', textColor: 'text-text-muted' },
} as const

export const PLAN_CONFIG = {
  starter: { label: 'Starter', color: '#10b981', bgColor: 'bg-success/10', textColor: 'text-success' },
  business: { label: 'Business', color: '#3b82f6', bgColor: 'bg-info/10', textColor: 'text-info' },
  enterprise: { label: 'Enterprise', color: '#a78bfa', bgColor: 'bg-accent-violet/10', textColor: 'text-accent-violet' },
} as const

export const TASK_STATUS_CONFIG = {
  backlog: { label: 'Backlog', emoji: '📋', color: '#6d7a96' },
  todo: { label: 'To Do', emoji: '📌', color: '#3b82f6' },
  doing: { label: 'In Progress', emoji: '⚡', color: '#f59e0b' },
  blocked: { label: 'Blocked', emoji: '⏸️', color: '#ef4444' },
  done: { label: 'Done', emoji: '✅', color: '#10b981' },
} as const

export const CONTENT_TYPE_CONFIG = {
  linkedin: { label: 'LinkedIn', color: '#0077b5', bgColor: 'bg-blue-600/10', textColor: 'text-blue-400' },
  blog: { label: 'Blog', color: '#a78bfa', bgColor: 'bg-accent-violet/10', textColor: 'text-accent-violet' },
  email: { label: 'Email', color: '#10b981', bgColor: 'bg-success/10', textColor: 'text-success' },
  'case-study': { label: 'Case Study', color: '#f59e0b', bgColor: 'bg-warning/10', textColor: 'text-warning' },
  'one-pager': { label: 'One-Pager', color: '#ec4899', bgColor: 'bg-accent-pink/10', textColor: 'text-accent-pink' },
} as const

export const SECTOR_COLORS: Record<string, string> = {
  'Restaurants': '#f97316',
  'Hospitality': '#3b82f6',
  'Healthcare': '#10b981',
  'Technology': '#a78bfa',
  'Retail': '#ec4899',
  'Real Estate': '#f59e0b',
  'E-commerce': '#06b6d4',
  'Education': '#8b5cf6',
  'Finance': '#22c55e',
  'Other': '#6d7a96',
}

export const AGENT_COLORS: Record<string, string> = {
  leader: '#a78bfa',
  scout: '#10b981',
  strategist: '#3b82f6',
  architect: '#f59e0b',
  developer: '#ec4899',
  builder: '#f97316',
  qa: '#06b6d4',
  content: '#8b5cf6',
  keeper: '#22c55e',
}

export const MRR_TARGET = 7200
export const DAILY_API_BUDGET = 50
export const VPS_COST = 120
