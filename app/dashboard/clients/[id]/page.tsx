import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentCallsTable from '@/components/dashboard/RecentCallsTable'
import CallsChart from '@/components/charts/CallsChart'
import { calculateUsage, calculateConversion, calculateGoldenWindow, estimateRevenue, formatCurrency, formatPercentage } from '@/lib/calculations'
import { format, subDays } from 'date-fns'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
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

  // Fetch client with plan
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*, plans(*)')
    .eq('id', params.id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  // Fetch client's calls
  const { data: calls, count: totalCalls } = await supabase
    .from('ai_calls')
    .select('*, agents(name)', { count: 'exact' })
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  const allCalls = calls || []
  const plan = client.plans

  // Calculate metrics
  const conversion = calculateConversion(allCalls)
  const goldenWindow = calculateGoldenWindow(allCalls)
  const usage = plan ? calculateUsage(client, plan, allCalls) : null
  const revenue = estimateRevenue(allCalls, client.avg_deal_value || 0)

  // Calculate this month's calls
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthCalls = allCalls.filter((c: any) => new Date(c.created_at) >= firstDayOfMonth).length

  // Chart data: calls per day (last 30 days)
  const callsChartData = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(new Date(), 29 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayCalls = allCalls.filter((c: any) => c.created_at.startsWith(dateStr))
    return {
      date: format(date, 'dd MMM'),
      calls: dayCalls.length,
      successful: dayCalls.filter((c: any) => c.call_status === 'completed').length,
      failed: dayCalls.filter((c: any) => c.call_status === 'failed').length
    }
  })

  // Agent performance
  const agentStats = allCalls.reduce((acc: any, call: any) => {
    const agentName = call.agents?.name || 'Unknown'
    if (!acc[agentName]) {
      acc[agentName] = {
        totalCalls: 0,
        appointments: 0,
        totalMinutes: 0
      }
    }
    acc[agentName].totalCalls++
    if (call.call_outcome === 'appointment') acc[agentName].appointments++
    acc[agentName].totalMinutes += (call.call_duration_seconds || 0) / 60
    return acc
  }, {})

  return (
    <DashboardLayout user={user} profile={profile}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <a href="/dashboard/clients" className="hover:text-foreground transition-colors">Klanten</a>
          <span>→</span>
          <span>{client.company_name}</span>
        </div>
        <h1 className="text-4xl font-bold mb-2 glow-text">
          {client.company_name}
        </h1>
        <p className="text-muted-foreground">
          {client.contact_email} • {client.contact_phone || 'Geen telefoon'}
        </p>
      </div>

      {/* Client Info Card */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Klant Informatie</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Status</div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              client.status === 'active' ? 'bg-green-500/10 text-green-500' :
              client.status === 'inactive' ? 'bg-red-500/10 text-red-500' :
              'bg-yellow-500/10 text-yellow-500'
            }`}>
              {client.status}
            </span>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Plan</div>
            <div className="text-lg font-semibold capitalize">{plan?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Gemiddelde Deal Waarde</div>
            <div className="text-lg font-semibold">{formatCurrency(client.avg_deal_value || 0)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Klant Sinds</div>
            <div className="text-lg font-semibold">
              {format(new Date(client.created_at), 'dd MMM yyyy')}
            </div>
          </div>
        </div>
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

      {/* Usage Card */}
      {usage && (
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">💳</span>
            Belminuten Gebruik
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Gebruikt</div>
                <div className="text-2xl font-bold">{formatCurrency(usage.usedCost)}</div>
                <div className="text-xs text-muted-foreground">{usage.minutes.toFixed(0)} minuten</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Inbegrepen</div>
                <div className="text-2xl font-bold">{formatCurrency(usage.includedCost)}</div>
                <div className="text-xs text-muted-foreground">per maand</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Overage</div>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(usage.overageBillable)}
                </div>
                <div className="text-xs text-muted-foreground">gefactureerd</div>
              </div>
            </div>
            <div>
              <div className="w-full bg-muted rounded-full h-3 mb-2">
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quota Gebruik</span>
                <span className={`font-semibold ${
                  usage.percentageUsed >= 100 ? 'text-destructive' :
                  usage.percentageUsed >= 80 ? 'text-secondary' :
                  'text-foreground'
                }`}>
                  {formatPercentage(usage.percentageUsed)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Performance */}
      {Object.keys(agentStats).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Agent Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(agentStats).map(([agentName, stats]: [string, any]) => (
              <div key={agentName} className="bg-muted/50 rounded-lg p-4">
                <div className="font-semibold mb-2">{agentName}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gesprekken:</span>
                    <span className="font-medium">{stats.totalCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Afspraken:</span>
                    <span className="font-medium">{stats.appointments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversie:</span>
                    <span className="font-medium">
                      {formatPercentage((stats.appointments / stats.totalCalls) * 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minuten:</span>
                    <span className="font-medium">{Math.round(stats.totalMinutes)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calls Chart */}
      <div className="mb-8">
        <CallsChart data={callsChartData} title="Gesprekken (Laatste 30 Dagen)" />
      </div>

      {/* Recent Calls */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recente Gesprekken</h2>
        <RecentCallsTable calls={allCalls.slice(0, 20)} />
      </div>
    </DashboardLayout>
  )
}
