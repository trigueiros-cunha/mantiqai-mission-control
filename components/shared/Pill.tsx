import { cn } from '@/lib/utils'

interface PillProps {
  label: string
  color?: string
  bgColor?: string
  textColor?: string
  size?: 'xs' | 'sm'
  className?: string
}

export default function Pill({ label, bgColor, textColor, size = 'xs', className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        bgColor ?? 'bg-bg-elevated',
        textColor ?? 'text-text-muted',
        className
      )}
    >
      {label}
    </span>
  )
}
