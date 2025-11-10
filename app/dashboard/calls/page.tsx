import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import CallsTableClient from '@/components/dashboard/CallsTableClient'

export default async function CallsPage() {
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

  // Fetch calls based on role
  let callsQuery = supabase
    .from('ai_calls')
    .select('*, clients(company_name), agents(name)')
    .order('created_at', { ascending: false })

  // If client role, filter to their calls only
  if (profile.role === 'client' && profile.client_id) {
    callsQuery = callsQuery.eq('client_id', profile.client_id)
  }

  const { data: calls, count: totalCalls } = await callsQuery

  // Fetch agents and clients for filter options
  const { data: agents } = await supabase.from('agents').select('*').order('name')

  let clients: any[] = []
  if (profile.role === 'admin') {
    const { data: clientsData } = await supabase
      .from('clients')
      .select('id, company_name')
      .order('company_name')
    clients = clientsData || []
  }

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 glow-text">
          Alle <span className="text-primary">Gesprekken</span>
        </h1>
        <p className="text-muted-foreground">
          {totalCalls || 0} gesprekken in totaal
        </p>
      </div>

      <CallsTableClient
        initialCalls={calls || []}
        agents={agents || []}
        clients={clients}
        isAdmin={profile.role === 'admin'}
      />
    </DashboardLayout>
  )
}
