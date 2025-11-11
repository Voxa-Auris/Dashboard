import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import AppointmentsTable from '@/components/dashboard/AppointmentsTable'
import StatsCard from '@/components/dashboard/StatsCard'
import { format, isFuture, isPast, isToday } from 'date-fns'

export default async function AppointmentsPage() {
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

  // Only clients can access this page
  if (profile.role !== 'client' || !profile.client_id) {
    redirect('/dashboard')
  }

  // Fetch all calls with appointments
  const { data: appointments } = await supabase
    .from('ai_calls')
    .select('*, agents(name)')
    .eq('client_id', profile.client_id)
    .eq('call_outcome', 'appointment')
    .not('appointment_date', 'is', null)
    .order('appointment_date', { ascending: true })

  const allAppointments = appointments || []

  // Split into upcoming and past
  const upcomingAppointments = allAppointments.filter(a => isFuture(new Date(a.appointment_date)))
  const pastAppointments = allAppointments.filter(a => isPast(new Date(a.appointment_date)) && !isToday(new Date(a.appointment_date)))
  const todayAppointments = allAppointments.filter(a => isToday(new Date(a.appointment_date)))

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 glow-text">
          Mijn <span className="text-primary">Afspraken</span>
        </h1>
        <p className="text-muted-foreground">
          {allAppointments.length} afspraken totaal
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Vandaag"
          value={todayAppointments.length}
          subtitle="Afspraken vandaag"
          icon="📅"
        />
        <StatsCard
          title="Komend"
          value={upcomingAppointments.length}
          subtitle="Geplande afspraken"
          icon="🔜"
        />
        <StatsCard
          title="Afgerond"
          value={pastAppointments.length}
          subtitle="Voorbije afspraken"
          icon="✅"
        />
      </div>

      {/* Today's Appointments */}
      {todayAppointments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>🔥</span>
            Vandaag
          </h2>
          <AppointmentsTable appointments={todayAppointments} showDate={false} />
        </div>
      )}

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Komende Afspraken</h2>
        {upcomingAppointments.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground">Geen komende afspraken</p>
          </div>
        ) : (
          <AppointmentsTable appointments={upcomingAppointments} />
        )}
      </div>

      {/* Past Appointments */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Afgeronde Afspraken</h2>
        {pastAppointments.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground">Geen afgeronde afspraken</p>
          </div>
        ) : (
          <AppointmentsTable appointments={pastAppointments.slice(0, 20)} />
        )}
      </div>
    </DashboardLayout>
  )
}
