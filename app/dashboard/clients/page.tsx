import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ClientsListTable from '@/components/dashboard/ClientsListTable'

export default async function ClientsPage() {
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

  // Only admins can access this page
  if (profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch all clients with their plans
  const { data: clients } = await supabase
    .from('clients')
    .select('*, plans(*)')
    .order('created_at', { ascending: false })

  // Fetch all calls for usage calculation
  const { data: calls } = await supabase
    .from('ai_calls')
    .select('*')

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 glow-text">
          Klanten <span className="text-primary">Overzicht</span>
        </h1>
        <p className="text-muted-foreground">
          {clients?.length || 0} klanten totaal
        </p>
      </div>

      <ClientsListTable clients={clients || []} calls={calls || []} />
    </DashboardLayout>
  )
}
