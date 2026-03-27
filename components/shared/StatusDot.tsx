import { cn } from '@/lib/utils'

interface StatusDotProps {
  status: 'active' | 'idle' | 'error' | 'online' | 'offline'
  size?: 'sm' | 'md'
  pulse?: boolean
}

const colors = {
  active: 'bg-success',
  idle: 'bg-warning',
  error: 'bg-danger',
  online: 'bg-success',
  offline: 'bg-text-muted',
}

export default function StatusDot({ status, size = 'sm', pulse = false }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full flex-shrink-0',
        colors[status],
        size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
        pulse && status === 'active' && 'animate-pulse-dot'
      )}
    />
  )
}
