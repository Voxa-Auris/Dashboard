import { createClient } from '@/lib/supabase/server'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import RecentCallsTable from './RecentCallsTable'
import CallsChart from '@/components/charts/CallsChart'
import { calculateUsage, calculateConversion, calculateGoldenWindow, estimateRevenue, formatCurrency, formatPercentage } from '@/lib/calculations'
import { format, subDays } from 'date-fns'

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

  // Fetch client data with plan
  const { data: client } = await supabase
    .from('clients')
    .select('*, plans(*)')
    .eq('id', profile.client_id)
    .single()

  // Fetch client's calls
  const { data: calls, count: totalCalls } = await supabase
    .from('ai_calls')
    .select('*, agents(name)', { count: 'exact' })
    .eq('client_id', profile.client_id)
    .order('created_at', { ascending: false })
    .limit(50)

  const allCalls = calls || []
  const plan = client?.plans

  // Calculate metrics
  const conversion = calculateConversion(allCalls)
  const goldenWindow = calculateGoldenWindow(allCalls)
  const usage = plan ? calculateUsage(client, plan, allCalls) : null
  const revenue = estimateRevenue(allCalls, client?.avg_deal_value || 0)

  // Calculate this month's calls
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthCalls = allCalls.filter((c: any) => new Date(c.created_at) >= firstDayOfMonth).length

  // Get upcoming appointments
  const upcomingAppointments = allCalls.filter(
    (c: any) => c.call_outcome === 'appointment' && c.appointment_date && new Date(c.appointment_date) > new Date()
  ).slice(0, 5)

  // Chart data: calls per day (last 7 days)
  const callsChartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayCalls = allCalls.filter((c: any) => c.created_at.startsWith(dateStr))
    return {
      date: format(date, 'dd MMM'),
      calls: dayCalls.length,
      successful: dayCalls.filter((c: any) => c.call_status === 'completed').length,
      failed: dayCalls.filter((c: any) => c.call_status === 'failed').length
    }
  })

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
          subtitle={`${monthCalls} deze maand`}
          icon="📞"
        />
        <StatsCard
          title="Conversie Rate"
          value={formatPercentage(conversion.conversionRate)}
          subtitle={`${conversion.appointments} afspraken`}
          icon="📊"
        />
        <StatsCard
          title="Golden Window"
          value={formatPercentage(goldenWindow.percentage)}
          subtitle={`${goldenWindow.medianResponseTime}s mediaan`}
          icon="⚡"
        />
        <StatsCard
          title="Geschatte Waarde"
          value={formatCurrency(revenue)}
          subtitle="Op basis van afspraken"
          icon="💰"
        />
      </div>

      {/* Usage Warning */}
      {usage && usage.percentageUsed >= 80 && (
        <div className={`mb-8 p-4 rounded-xl border ${
          usage.percentageUsed >= 100
            ? 'bg-destructive/10 border-destructive/50'
            : 'bg-secondary/10 border-secondary/50'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{usage.percentageUsed >= 100 ? '🚨' : '⚠️'}</span>
            <div className="flex-1">
              <h3 className={`font-semibold mb-2 ${usage.percentageUsed >= 100 ? 'text-destructive' : 'text-secondary-foreground'}`}>
                {usage.percentageUsed >= 100 ? 'Quota Overschreden!' : 'Quota Bijna Bereikt'}
              </h3>
              <p className="text-sm mb-3">
                Je hebt {formatCurrency(usage.usedCost)} gebruikt van {formatCurrency(usage.includedCost)} inbegrepen belkosten ({formatPercentage(usage.percentageUsed)}).
                {usage.percentageUsed >= 100 && (
                  <span className="block mt-1 font-semibold">
                    Overage: {formatCurrency(usage.overageBillable)} wordt gefactureerd.
                  </span>
                )}
              </p>
              {usage.percentageUsed < 100 && (
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Usage Card */}
      {usage && (
        <div className="mb-8 bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">💳</span>
            Belminuten Gebruik
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold mb-1">
                {formatCurrency(usage.usedCost)}
              </div>
              <div className="text-sm text-muted-foreground">
                van {formatCurrency(usage.includedCost)} inbegrepen
              </div>
            </div>
            <div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    usage.status === 'exceeded' ? 'bg-destructive' :
                    usage.status === 'danger' ? 'bg-destructive' :
                    usage.status === 'warning' ? 'bg-secondary' :
                    'bg-primary'
                  }`}
                  style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{usage.minutes.toFixed(0)} minuten gebruikt</span>
                <span>{formatPercentage(usage.percentageUsed)}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Tarief</div>
                <div className="font-semibold">{formatCurrency(usage.rate)}/min</div>
              </div>
              <div>
                <div className="text-muted-foreground">Plan</div>
                <div className="font-semibold capitalize">{plan?.name || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calls Chart */}
      <div className="mb-8">
        <CallsChart data={callsChartData} />
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments && upcomingAppointments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Komende Afspraken</h2>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="space-y-4">
              {upcomingAppointments.map((appointment: any) => (
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
                    <div className="text-xs text-muted-foreground">Agent: {appointment.agents?.name || 'N/A'}</div>
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
        <RecentCallsTable calls={allCalls.slice(0, 10)} />
      </div>
    </DashboardLayout>
  )
}
