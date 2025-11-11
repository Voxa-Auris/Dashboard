import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import StatsCard from '@/components/dashboard/StatsCard'
import CallsChart from '@/components/charts/CallsChart'
import ConversionChart from '@/components/charts/ConversionChart'
import RevenueChart from '@/components/charts/RevenueChart'
import { calculateConversion, calculateGoldenWindow, estimateRevenue, formatCurrency, formatPercentage } from '@/lib/calculations'
import { format, subDays, startOfWeek, endOfWeek, eachWeekOfInterval, subMonths, eachMonthOfInterval } from 'date-fns'

export default async function AnalyticsPage() {
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

  // Fetch all data
  const { data: calls } = await supabase
    .from('ai_calls')
    .select('*, clients(company_name, avg_deal_value), agents(name)')
    .order('created_at', { ascending: false })

  const { data: clients } = await supabase.from('clients').select('*')
  const { data: agents } = await supabase.from('agents').select('*')

  const allCalls = calls || []
  const allClients = clients || []
  const allAgents = agents || []

  // Overall metrics
  const totalCalls = allCalls.length
  const totalMinutes = allCalls.reduce((sum, c) => sum + (c.call_duration_seconds || 0), 0) / 60
  const conversion = calculateConversion(allCalls)
  const goldenWindow = calculateGoldenWindow(allCalls)
  const totalRevenue = estimateRevenue(allCalls, 0) // Will calculate per client

  // Calls per day (last 30 days)
  const callsChartData = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(new Date(), 29 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayCalls = allCalls.filter(c => c.created_at.startsWith(dateStr))
    return {
      date: format(date, 'dd MMM'),
      calls: dayCalls.length,
      successful: dayCalls.filter(c => c.call_status === 'completed').length,
      failed: dayCalls.filter(c => c.call_status === 'failed').length
    }
  })

  // Conversion by week (last 8 weeks)
  const conversionChartData = Array.from({ length: 8 }).map((_, i) => {
    const weekStart = startOfWeek(subDays(new Date(), (7 - i) * 7))
    const weekEnd = endOfWeek(weekStart)
    const weekCalls = allCalls.filter(c => {
      const callDate = new Date(c.created_at)
      return callDate >= weekStart && callDate <= weekEnd
    })
    const weekConversion = calculateConversion(weekCalls)
    return {
      period: format(weekStart, 'dd MMM'),
      conversie: weekConversion.conversionRate,
      target: 20
    }
  })

  // Revenue by month (last 6 months)
  const revenueChartData = Array.from({ length: 6 }).map((_, i) => {
    const monthDate = subMonths(new Date(), 5 - i)
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
    const monthCalls = allCalls.filter(c => {
      const callDate = new Date(c.created_at)
      return callDate >= monthStart && callDate <= monthEnd
    })

    const costs = monthCalls.reduce((sum, c) => sum + (c.cost_eur || 0), 0)
    const value = monthCalls
      .filter(c => c.call_outcome === 'appointment')
      .reduce((sum, c) => sum + (c.clients?.avg_deal_value || 0), 0)

    return {
      period: format(monthDate, 'MMM'),
      kosten: costs,
      waarde: value,
      marge: value - costs
    }
  })

  // Agent performance
  const agentStats = allAgents.map(agent => {
    const agentCalls = allCalls.filter(c => c.agent_id === agent.id)
    const agentConversion = calculateConversion(agentCalls)
    const agentGoldenWindow = calculateGoldenWindow(agentCalls)
    const totalMinutes = agentCalls.reduce((sum, c) => sum + (c.call_duration_seconds || 0), 0) / 60

    return {
      ...agent,
      totalCalls: agentCalls.length,
      appointments: agentConversion.appointments,
      conversionRate: agentConversion.conversionRate,
      goldenWindowPercentage: agentGoldenWindow.percentage,
      totalMinutes: Math.round(totalMinutes)
    }
  }).sort((a, b) => b.totalCalls - a.totalCalls)

  // Top performing clients
  const clientStats = allClients.map(client => {
    const clientCalls = allCalls.filter(c => c.client_id === client.id)
    const clientConversion = calculateConversion(clientCalls)
    const revenue = estimateRevenue(clientCalls, client.avg_deal_value || 0)

    return {
      ...client,
      totalCalls: clientCalls.length,
      appointments: clientConversion.appointments,
      conversionRate: clientConversion.conversionRate,
      revenue
    }
  }).sort((a, b) => b.revenue - a.revenue)

  // Call outcomes distribution
  const outcomesStats = {
    appointment: allCalls.filter(c => c.call_outcome === 'appointment').length,
    interested: allCalls.filter(c => c.call_outcome === 'interested').length,
    notInterested: allCalls.filter(c => c.call_outcome === 'not-interested').length,
    callback: allCalls.filter(c => c.call_outcome === 'callback').length,
    noResponse: allCalls.filter(c => c.call_outcome === 'no-response').length
  }

  // Call status distribution
  const statusStats = {
    completed: allCalls.filter(c => c.call_status === 'completed').length,
    failed: allCalls.filter(c => c.call_status === 'failed').length,
    noAnswer: allCalls.filter(c => c.call_status === 'no-answer').length,
    busy: allCalls.filter(c => c.call_status === 'busy').length
  }

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 glow-text">
          Diepgaande <span className="text-primary">Analyses</span>
        </h1>
        <p className="text-muted-foreground">
          Complete performance analytics en insights
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Totaal Gesprekken"
          value={totalCalls}
          subtitle={`${Math.round(totalMinutes)} minuten`}
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
          title="Totale Waarde"
          value={formatCurrency(clientStats.reduce((sum, c) => sum + c.revenue, 0))}
          subtitle="Geschatte omzet"
          icon="💰"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CallsChart data={callsChartData} title="Gesprekken Trend (30 Dagen)" />
        <ConversionChart data={conversionChartData} title="Conversie per Week" />
      </div>

      <div className="mb-8">
        <RevenueChart data={revenueChartData} title="Kosten vs Waarde (6 Maanden)" />
      </div>

      {/* Outcomes & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Outcomes */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Uitkomsten Verdeling</h3>
          <div className="space-y-3">
            {Object.entries(outcomesStats).map(([outcome, count]) => {
              const percentage = totalCalls > 0 ? (count / totalCalls) * 100 : 0
              return (
                <div key={outcome}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{outcome.replace('-', ' ')}</span>
                    <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Status Verdeling</h3>
          <div className="space-y-3">
            {Object.entries(statusStats).map(([status, count]) => {
              const percentage = totalCalls > 0 ? (count / totalCalls) * 100 : 0
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{status.replace('-', ' ')}</span>
                    <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        status === 'completed' ? 'bg-green-500' :
                        status === 'failed' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Agent Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold">Agent</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Gesprekken</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Afspraken</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Conversie</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Golden Window</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Minuten</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agentStats.map(agent => (
                <tr key={agent.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{agent.name}</td>
                  <td className="py-3 px-4">{agent.totalCalls}</td>
                  <td className="py-3 px-4">{agent.appointments}</td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${
                      agent.conversionRate >= 20 ? 'text-green-500' :
                      agent.conversionRate >= 10 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {formatPercentage(agent.conversionRate)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${
                      agent.goldenWindowPercentage >= 80 ? 'text-green-500' :
                      agent.goldenWindowPercentage >= 60 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {formatPercentage(agent.goldenWindowPercentage)}
                    </span>
                  </td>
                  <td className="py-3 px-4">{agent.totalMinutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Top Klanten (naar Waarde)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold">Klant</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Gesprekken</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Afspraken</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Conversie</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Geschatte Waarde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientStats.slice(0, 10).map(client => (
                <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{client.company_name}</td>
                  <td className="py-3 px-4">{client.totalCalls}</td>
                  <td className="py-3 px-4">{client.appointments}</td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${
                      client.conversionRate >= 20 ? 'text-green-500' :
                      client.conversionRate >= 10 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {formatPercentage(client.conversionRate)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-primary">
                    {formatCurrency(client.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
