'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export default function HydrationProvider({ children }: { children: React.ReactNode }) {
  const { hydrate, isHydrated } = useStore()

  useEffect(() => {
    hydrate()
  }, [])

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent-violet/30 border-t-accent-violet rounded-full animate-spin" />
          <div className="text-xs text-text-muted font-mono">Loading MantiqAI...</div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
