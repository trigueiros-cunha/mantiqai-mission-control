import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import OpenClawProvider from '@/components/openclaw/OpenClawProvider'
import ConnectionStatus from '@/components/openclaw/ConnectionStatus'
import SupabaseRealtimeProvider from '@/components/providers/SupabaseRealtimeProvider'
import HydrationProvider from '@/components/providers/HydrationProvider'

export const metadata: Metadata = {
  title: 'MantiqAI Mission Control',
  description: 'AI Automation Agency Command Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-bg-base text-text-primary font-body antialiased">
        <OpenClawProvider />
        <SupabaseRealtimeProvider />
        <HydrationProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </HydrationProvider>
        <ConnectionStatus />
      </body>
    </html>
  )
}
