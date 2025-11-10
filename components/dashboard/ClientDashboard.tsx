import { createClient } from '@/lib/supabase/server'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import RecentCallsTable from './RecentCallsTable'

interface ClientDashboardProps {
  user: any
  profile: any
}

export default async function ClientDashboard({ user, profile }: ClientDashboardProps) {
  const supabase = await createClient()

  if (!profile.client_id) {
    return (
      <DashboardLayout user={user} profile={profile}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Geen Client Toegewezen</h2>
            <p className="text-muted-foreground">
              Neem contact op met Voxa Auris om je account te activeren.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Fetch client data
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', profile.client_id)
    .single()

  // Fetch client's calls
  const { data: calls, count: totalCalls } = await supabase
    .from('ai_calls')
    .select('*', { count: 'exact' })
    .eq('client_id', profile.client_id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate this month's calls
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const { count: monthCalls } = await supabase
    .from('ai_calls')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', profile.client_id)
    .gte('created_at', firstDayOfMonth.toISOString())

  // Get upcoming appointments
  const { data: upcomingAppointments } = await supabase
    .from('ai_calls')
    .select('*')
    .eq('client_id', profile.client_id)
    .eq('call_status', 'scheduled')
    .gte('appointment_date', new Date().toISOString())
    .order('appointment_date', { ascending: true })
    .limit(5)

  // Calculate minute usage percentage
  const minutesUsedPercentage = client
    ? Math.round((client.total_minutes_used / client.monthly_minute_limit) * 100)
    : 0

  return (
    <DashboardLayout user={user} profile={profile}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 glow-text">
          {client?.company_name}
        </h1>
        <p className="text-muted-foreground">
          Welkom terug, {profile.full_name || user.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Totaal Gesprekken"
          value={totalCalls || 0}
          subtitle={`${monthCalls || 0} deze maand`}
          icon="📞"
        />
        <StatsCard
          title="Minuten Gebruikt"
          value={client?.total_minutes_used || 0}
          subtitle={`van ${client?.monthly_minute_limit || 0} minuten`}
          icon="⏱️"
          progress={minutesUsedPercentage}
        />
        <StatsCard
          title="Komende Afspraken"
          value={upcomingAppointments?.length || 0}
          subtitle="Ingepland"
          icon="📅"
        />
        <StatsCard
          title="Account Status"
          value={client?.status === 'active' ? 'Actief' : client?.status || 'N/A'}
          subtitle={client?.plan_type || 'Starter'}
          icon="✨"
        />
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments && upcomingAppointments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Komende Afspraken</h2>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-semibold">{appointment.lead_name || 'Onbekend'}</div>
                    <div className="text-sm text-muted-foreground">{appointment.lead_phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-primary">
                      {appointment.appointment_date
                        ? new Date(appointment.appointment_date).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Nog niet ingepland'}
                    </div>
                    <div className="text-xs text-muted-foreground">Agent: {appointment.agent_name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Calls */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recente Gesprekken</h2>
        <RecentCallsTable calls={calls || []} />
      </div>
    </DashboardLayout>
  )
}
