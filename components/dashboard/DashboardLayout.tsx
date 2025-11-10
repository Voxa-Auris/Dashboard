'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: any
  profile: any
}

export default function DashboardLayout({ children, user, profile }: DashboardLayoutProps) {
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold glow-text">
              Voxa <span className="text-primary">Auris</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <a
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium"
            >
              <span>📊</span>
              Overzicht
            </a>

            {profile.role === 'admin' && (
              <>
                <a
                  href="/dashboard/clients"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>👥</span>
                  Klanten
                </a>
                <a
                  href="/dashboard/calls"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>📞</span>
                  Alle Gesprekken
                </a>
                <a
                  href="/dashboard/webhooks"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>🔗</span>
                  Webhooks
                </a>
                <a
                  href="/dashboard/analytics"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>📈</span>
                  Analyses
                </a>
              </>
            )}

            {profile.role === 'client' && (
              <>
                <a
                  href="/dashboard/calls"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>📞</span>
                  Mijn Gesprekken
                </a>
                <a
                  href="/dashboard/appointments"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>📅</span>
                  Afspraken
                </a>
                <a
                  href="/dashboard/usage"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>⏱️</span>
                  Gebruik
                </a>
              </>
            )}

            <a
              href="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>⚙️</span>
              Instellingen
            </a>
          </nav>

          {/* User profile & logout */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                {(profile.full_name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{profile.full_name || user.email}</div>
                <div className="text-xs text-muted-foreground capitalize">{profile.role}</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors text-sm font-medium"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border p-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
