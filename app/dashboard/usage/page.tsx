import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import StatsCard from '@/components/dashboard/StatsCard'
import CallsChart from '@/components/charts/CallsChart'
import { calculateUsage, formatCurrency, formatPercentage } from '@/lib/calculations'
import { format, subDays, startOfMonth, eachDayOfInterval } from 'date-fns'

export default async function UsagePage() {
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

  // Fetch client with plan
  const { data: client } = await supabase
    .from('clients')
    .select('*, plans(*)')
    .eq('id', profile.client_id)
    .single()

  if (!client || !client.plans) {
    redirect('/dashboard')
  }

  // Fetch all calls
  const { data: calls } = await supabase
    .from('ai_calls')
    .select('*, agents(name)')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  const allCalls = calls || []
  const plan = client.plans

  // Calculate usage
  const usage = calculateUsage(client, plan, allCalls)

  // This month's calls
  const monthStart = startOfMonth(new Date())
  const monthCalls = allCalls.filter(c => new Date(c.created_at) >= monthStart)

  // Calls per day (this month)
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: new Date()
  })

  const callsPerDayData = daysInMonth.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayCalls = allCalls.filter(c => c.created_at.startsWith(dateStr))
    const dayMinutes = dayCalls.reduce((sum, c) => sum + (c.call_duration_seconds || 0), 0) / 60

    return {
      date: format(day, 'dd MMM'),
      calls: dayCalls.length,
      successful: dayCalls.filter(c => c.call_status === 'completed').length,
      failed: dayCalls.filter(c => c.call_status === 'failed').length,
      minutes: dayMinutes
    }
  })

  // Breakdown by agent
  const agentBreakdown = allCalls.reduce((acc: any, call) => {
    const agentName = call.agents?.name || 'Unknown'
    if (!acc[agentName]) {
      acc[agentName] = {
        calls: 0,
        minutes: 0,
        cost: 0
      }
    }
    acc[agentName].calls++
    const callMinutes = (call.call_duration_seconds || 0) / 60
    acc[agentName].minutes += callMinutes
    acc[agentName].cost += callMinutes * usage.rate
    return acc
  }, {})

  // Daily average
  const totalDays = daysInMonth.length
  const avgCallsPerDay = monthCalls.length / totalDays
  const avgMinutesPerDay = usage.minutes / totalDays

  // Projected usage for rest of month
  const daysRemainingInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()
  const projectedMinutes = usage.minutes + (avgMinutesPerDay * daysRemainingInMonth)
  const projectedCost = projectedMinutes * usage.rate
  const projectedOverage = Math.max(0, (projectedCost - usage.includedCost) * (1 + plan.overage_markup))

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 glow-text">
          Mijn <span className="text-primary">Gebruik</span>
        </h1>
        <p className="text-muted-foreground">
          Gedetailleerde usage statistieken voor {format(new Date(), 'MMMM yyyy')}
        </p>
      </div>

      {/* Current Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Gesprekken Deze Maand"
          value={monthCalls.length}
          subtitle={`${avgCallsPerDay.toFixed(1)} per dag`}
          icon="📞"
        />
        <StatsCard
          title="Minuten Gebruikt"
          value={Math.round(usage.minutes)}
          subtitle={`${avgMinutesPerDay.toFixed(1)} per dag`}
          icon="⏱️"
        />
        <StatsCard
          title="Kosten Deze Maand"
          value={formatCurrency(usage.usedCost)}
          subtitle={`van ${formatCurrency(usage.includedCost)}`}
          icon="💳"
        />
        <StatsCard
          title="Quota Gebruikt"
          value={formatPercentage(usage.percentageUsed)}
          subtitle={usage.status === 'exceeded' ? 'Overschreden!' : 'Gebruikt'}
          icon={usage.status === 'exceeded' ? '🚨' : usage.status === 'danger' ? '⚠️' : '✅'}
        />
      </div>

      {/* Usage Progress */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Quota Overzicht</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Gebruikt: {formatCurrency(usage.usedCost)}</span>
              <span className={`font-semibold ${
                usage.percentageUsed >= 100 ? 'text-destructive' :
                usage.percentageUsed >= 80 ? 'text-secondary' :
                'text-foreground'
              }`}>
                {formatPercentage(usage.percentageUsed)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${
                  usage.status === 'exceeded' ? 'bg-destructive' :
                  usage.status === 'danger' ? 'bg-destructive' :
                  usage.status === 'warning' ? 'bg-secondary' :
                  'bg-primary'
                }`}
                style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
              />
            </div>
          </div>

          {usage.overageBillable > 0 && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚠️</span>
                <span className="font-semibold text-destructive">Overage Kosten</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Je hebt je inbegrepen budget overschreden. De volgende kosten worden gefactureerd:
              </p>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(usage.overageBillable)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                (€{usage.overageCostRaw.toFixed(2)} × {plan.overage_markup * 100}% markup = {formatCurrency(usage.overageBillable)})
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Projected Usage */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Projectie Einde Maand</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Op basis van je huidige gemiddelde gebruik ({avgCallsPerDay.toFixed(1)} calls/dag, {avgMinutesPerDay.toFixed(1)} min/dag)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Geprojecteerde Minuten</div>
            <div className="text-2xl font-bold">{Math.round(projectedMinutes)}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Geprojecteerde Kosten</div>
            <div className="text-2xl font-bold">{formatCurrency(projectedCost)}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Geprojecteerde Overage</div>
            <div className={`text-2xl font-bold ${projectedOverage > 0 ? 'text-destructive' : 'text-green-500'}`}>
              {projectedOverage > 0 ? formatCurrency(projectedOverage) : '€0'}
            </div>
          </div>
        </div>

        {projectedOverage > 0 && (
          <div className="mt-4 p-4 bg-secondary/10 border border-secondary/50 rounded-lg">
            <p className="text-sm">
              💡 <strong>Tip:</strong> Op basis van je huidige gebruik wordt verwacht dat je je quota overschrijdt.
              Overweeg een upgrade naar een hoger plan om kosten te besparen.
            </p>
            <button className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Upgrade Plan
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="mb-8">
        <CallsChart data={callsPerDayData} title="Gebruik Deze Maand" />
      </div>

      {/* Breakdown by Agent */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Breakdown per Agent</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold">Agent</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Gesprekken</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Minuten</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Kosten</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">% van Totaal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(agentBreakdown).map(([agent, stats]: [string, any]) => {
                const percentage = usage.usedCost > 0 ? (stats.cost / usage.usedCost) * 100 : 0
                return (
                  <tr key={agent} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{agent}</td>
                    <td className="py-3 px-4">{stats.calls}</td>
                    <td className="py-3 px-4">{Math.round(stats.minutes)}</td>
                    <td className="py-3 px-4">{formatCurrency(stats.cost)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[100px]">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
