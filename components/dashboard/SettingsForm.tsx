'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SettingsFormProps {
  user: any
  profile: any
  client: any
}

export default function SettingsForm({ user, profile, client }: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Profile form state
  const [fullName, setFullName] = useState(profile.full_name || '')

  // Client info (if applicable)
  const [contactEmail, setContactEmail] = useState(client?.contact_email || '')
  const [contactPhone, setContactPhone] = useState(client?.contact_phone || '')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update client info if applicable
      if (client && profile.role === 'client') {
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            contact_email: contactEmail,
            contact_phone: contactPhone
          })
          .eq('id', client.id)

        if (clientError) throw clientError
      }

      setMessage({ type: 'success', text: 'Profiel succesvol bijgewerkt!' })
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Er is een fout opgetreden' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Account Information */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Account Informatie</h2>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-2">
              Volledige Naam
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Jouw naam"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email kan niet worden gewijzigd
            </p>
          </div>

          {/* Role (read-only) */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Rol
            </label>
            <input
              id="role"
              type="text"
              value={profile.role === 'admin' ? 'Administrator' : 'Client'}
              disabled
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-muted-foreground cursor-not-allowed capitalize"
            />
          </div>

          {/* Client-specific fields */}
          {client && profile.role === 'client' && (
            <>
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold mb-3">Bedrijfsinformatie</h3>
              </div>

              {/* Company Name (read-only) */}
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium mb-2">
                  Bedrijfsnaam
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={client.company_name}
                  disabled
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-muted-foreground cursor-not-allowed"
                />
              </div>

              {/* Plan (read-only) */}
              <div>
                <label htmlFor="plan" className="block text-sm font-medium mb-2">
                  Plan
                </label>
                <input
                  id="plan"
                  type="text"
                  value={client.plans?.name || 'N/A'}
                  disabled
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-muted-foreground cursor-not-allowed capitalize"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium mb-2">
                  Contact Email
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="contact@bedrijf.nl"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium mb-2">
                  Contact Telefoon
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+31 6 12345678"
                />
              </div>
            </>
          )}

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/50 text-green-500'
                : 'bg-red-500/10 border border-red-500/50 text-red-500'
            }`}>
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Opslaan...' : 'Wijzigingen Opslaan'}
          </button>
        </form>
      </div>

      {/* Security */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Beveiliging</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Wachtwoord Wijzigen</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Wil je je wachtwoord wijzigen? We sturen je een reset link.
            </p>
            <button
              onClick={async () => {
                setLoading(true)
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                    redirectTo: `${window.location.origin}/reset-password`
                  })
                  if (error) throw error
                  setMessage({ type: 'success', text: 'Reset link verzonden naar je email!' })
                } catch (error: any) {
                  setMessage({ type: 'error', text: error.message })
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-muted border border-border rounded-lg font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Wachtwoord Reset Link Versturen
            </button>
          </div>
        </div>
      </div>

      {/* Notifications (Placeholder) */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Notificaties</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Beheer je notificatie voorkeuren (beschikbaar in toekomstige versie)
        </p>

        <div className="space-y-3 opacity-50">
          <label className="flex items-center gap-3 cursor-not-allowed">
            <input type="checkbox" disabled className="w-4 h-4" />
            <span className="text-sm">Email notificaties voor nieuwe afspraken</span>
          </label>
          <label className="flex items-center gap-3 cursor-not-allowed">
            <input type="checkbox" disabled className="w-4 h-4" />
            <span className="text-sm">Waarschuwingen bij 80% quota gebruik</span>
          </label>
          <label className="flex items-center gap-3 cursor-not-allowed">
            <input type="checkbox" disabled className="w-4 h-4" />
            <span className="text-sm">Wekelijkse usage rapporten</span>
          </label>
        </div>
      </div>

      {/* API Keys (Admin only) */}
      {profile.role === 'admin' && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">API Keys</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Beheer API keys voor integraties (beschikbaar in toekomstige versie)
          </p>
          <button
            disabled
            className="px-4 py-2 bg-muted border border-border rounded-lg font-medium opacity-50 cursor-not-allowed"
          >
            Nieuwe API Key Genereren
          </button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-destructive/10 border border-destructive/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanente acties die niet ongedaan gemaakt kunnen worden
        </p>
        <button
          disabled
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium opacity-50 cursor-not-allowed"
        >
          Account Verwijderen
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Neem contact op met support om je account te verwijderen
        </p>
      </div>
    </div>
  )
}
