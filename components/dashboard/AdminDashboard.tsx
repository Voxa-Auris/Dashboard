import { createClient } from '@/lib/supabase/server'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import RecentCallsTable from './RecentCallsTable'
import ClientsTable from './ClientsTable'

interface AdminDashboardProps {
  user: any
  profile: any
}

export default async function AdminDashboard({ user, profile }: AdminDashboardProps) {
  const supabase = await createClient()

  // Fetch all clients
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch all calls with count
  const { data: calls, count: totalCalls } = await supabase
    .from('ai_calls')
    .select('*, clients(company_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate total minutes
  const { data: minutesData } = await supabase
    .from('call_minutes')
    .select('minutes_used')

  const totalMinutes = minutesData?.reduce((sum, record) => sum + Number(record.minutes_used), 0) || 0

  // Calculate active clients
  const activeClients = clients?.filter(c => c.status === 'active').length || 0

  // Calculate this month's calls
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const { count: monthCalls } = await supabase
    .from('ai_calls')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', firstDayOfMonth.toISOString())

  return (
    <DashboardLayout user={user} profile={profile}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 glow-text">
          Admin <span className="text-primary">Dashboard</span>
        </h1>
        <p className="text-muted-foreground">
          Welkom terug, {profile.full_name || user.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Totaal Klanten"
          value={clients?.length || 0}
          subtitle={`${activeClients} actief`}
          icon="👥"
          trend="+12%"
        />
        <StatsCard
          title="Totaal Gesprekken"
          value={totalCalls || 0}
          subtitle={`${monthCalls || 0} deze maand`}
          icon="📞"
          trend="+24%"
        />
        <StatsCard
          title="Totaal Minuten"
          value={Math.round(totalMinutes)}
          subtitle="Alle tijd"
          icon="⏱️"
          trend="+18%"
        />
        <StatsCard
          title="Conversie Rate"
          value="78%"
          subtitle="Afspraken ingepland"
          icon="📊"
          trend="+5%"
        />
      </div>

      {/* Recent Calls */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recente Gesprekken</h2>
        <RecentCallsTable calls={calls || []} />
      </div>

      {/* Clients Overview */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Klanten Overzicht</h2>
        <ClientsTable clients={clients || []} />
      </div>
    </DashboardLayout>
  )
}
