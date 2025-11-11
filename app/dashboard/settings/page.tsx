import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import SettingsForm from '@/components/dashboard/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Get client info if user is a client
  let client = null
  if (profile.role === 'client' && profile.client_id) {
    const { data: clientData } = await supabase
      .from('clients')
      .select('*, plans(*)')
      .eq('id', profile.client_id)
      .single()
    client = clientData
  }

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 glow-text">
          <span className="text-primary">Instellingen</span>
        </h1>
        <p className="text-muted-foreground">
          Beheer je account en voorkeuren
        </p>
      </div>

      <div className="max-w-3xl">
        <SettingsForm user={user} profile={profile} client={client} />
      </div>
    </DashboardLayout>
  )
}
