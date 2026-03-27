import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEuro(amount: number, decimals = 0): string {
  return `€${amount.toLocaleString('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy')
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm')
  } catch {
    return dateString
  }
}

export function formatTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'HH:mm')
  } catch {
    return dateString
  }
}

export function timeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
  } catch {
    return dateString
  }
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`
  return tokens.toString()
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function getHealthColor(health: number): string {
  if (health >= 90) return '#10b981'
  if (health >= 70) return '#f59e0b'
  return '#ef4444'
}

export function getHealthText(health: number): string {
  if (health >= 90) return 'text-success'
  if (health >= 70) return 'text-warning'
  return 'text-danger'
}

export function getDaysInStage(updatedAt: string): number {
  const updated = parseISO(updatedAt)
  const now = new Date()
  return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24))
}

export function calcGrossMargin(mrr: number, apiCost: number, vpsFraction: number): number {
  return mrr - apiCost - vpsFraction
}

export function calcMarginPercent(mrr: number, cost: number): number {
  if (mrr === 0) return 0
  return Math.round(((mrr - cost) / mrr) * 100)
}

export function generateSparklineData(base: number, days = 7): number[] {
  return Array.from({ length: days }, (_, i) =>
    Math.max(0, base + (Math.random() - 0.5) * base * 0.4)
  )
}

export function generateDailyHistory(baseMessages: number, baseCost: number, days = 30) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - i - 1))
    const messages = Math.max(0, Math.round(baseMessages + (Math.random() - 0.5) * baseMessages * 0.6))
    const tokens = messages * Math.round(800 + Math.random() * 400)
    const cost = parseFloat((messages * (baseCost / baseMessages)).toFixed(2))
    return {
      date: format(date, 'yyyy-MM-dd'),
      messages,
      tokens,
      cost,
    }
  })
}

export function isOverdue(dueDate: string): boolean {
  try {
    return parseISO(dueDate) < new Date()
  } catch {
    return false
  }
}

export function getTelegramUrl(botName: string): string {
  return `https://t.me/${botName}`
}
