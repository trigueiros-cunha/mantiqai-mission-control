'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Home,
  GitBranch,
  Bot,
  Building2,
  CheckSquare,
  DollarSign,
  BarChart3,
  Map,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'

const navItems = [
  { href: '/command', label: 'Command Center', icon: Home, emoji: '🏠' },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch, emoji: '📊' },
  { href: '/agents', label: 'Agents', icon: Bot, emoji: '🤖' },
  { href: '/clients', label: 'Clients', icon: Building2, emoji: '🏢' },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, emoji: '✅' },
  { href: '/financials', label: 'Financials', icon: DollarSign, emoji: '💰' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, emoji: '📈' },
  { href: '/map', label: 'Map', icon: Map, emoji: '🗺️' },
  { href: '/content', label: 'Content', icon: FileText, emoji: '📝' },
  { href: '/settings', label: 'Settings', icon: Settings, emoji: '⚙️' },
]

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useStore()
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-bg-surface border-r border-border sticky top-0 transition-all duration-300 z-20',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-border', sidebarCollapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <div className="font-heading font-bold text-sm text-text-primary leading-none">MantiqAI</div>
            <div className="text-xs text-text-muted font-mono">Mission Control</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-accent-violet/15 text-accent-violet border border-accent-violet/20'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-card',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="text-base flex-shrink-0" role="img">{item.emoji}</span>
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card text-sm transition-all',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
