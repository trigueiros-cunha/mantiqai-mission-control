'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  trendLabel?: string
  icon?: ReactNode
  accent?: 'violet' | 'pink' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
  children?: ReactNode
}

const accentStyles = {
  violet: 'border-accent-violet/30 bg-accent-violet/5',
  pink: 'border-accent-pink/30 bg-accent-pink/5',
  success: 'border-success/30 bg-success/5',
  warning: 'border-warning/30 bg-warning/5',
  danger: 'border-danger/30 bg-danger/5',
  info: 'border-info/30 bg-info/5',
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  accent,
  className,
  children,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-bg-card border border-border rounded-xl p-4 flex flex-col gap-2',
        accent && accentStyles[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-text-muted font-medium uppercase tracking-wider">{title}</div>
        {icon && <div className="text-text-muted flex-shrink-0">{icon}</div>}
      </div>
      <div className="font-mono text-2xl font-semibold text-text-primary leading-none">{value}</div>
      <div className="flex items-center gap-2">
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trend >= 0 ? 'text-success' : 'text-danger')}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
        {subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
        {trendLabel && <span className="text-xs text-text-muted">{trendLabel}</span>}
      </div>
      {children}
    </div>
  )
}
