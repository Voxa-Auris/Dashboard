import { createClient } from '@/lib/supabase/server'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import RecentCallsTable from './RecentCallsTable'
import ClientsTable from './ClientsTable'
import CallsChart from '@/components/charts/CallsChart'
import ConversionChart from '@/components/charts/ConversionChart'
import RevenueChart from '@/components/charts/RevenueChart'
import { calculateGoldenWindow, calculateConversion, calculateUsage, estimateRevenue, formatCurrency, formatPercentage } from '@/lib/calculations'
import { format, subDays } from 'date-fns'

interface AdminDashboardProps {
  user: any
  profile: any
}

export default async function AdminDashboard({ user, profile }: AdminDashboardProps) {
  const supabase = await createClient()

  // Fetch all data
  const { data: clients } = await supabase.from('clients').select('*, plans(*)').order('created_at', { ascending: false })
  const { data: calls, count: totalCalls } = await supabase.from('ai_calls').select('*, clients(company_name), agents(name)', { count: 'exact' }).order('created_at', { ascending: false }).limit(100)
  const { data: plans } = await supabase.from('plans').select('*')

  const allCalls = calls || []
  const allClients = clients || []

  // Calculate metrics
  const totalMinutes = allCalls.reduce((sum, c) => sum + (c.call_duration_seconds || 0), 0) / 60
  const conversion = calculateConversion(allCalls)
  const goldenWindow = calculateGoldenWindow(allCalls)

  // Calculate total revenue
  const totalRevenue = allClients.reduce((sum, client) => {
    const clientCalls = allCalls.filter((c: any) => c.client_id === client.id)
    return sum + estimateRevenue(clientCalls, client.avg_deal_value || 0)
  }, 0)

  // Calculate usage across all clients
  const totalUsage = allClients.reduce((sum, client) => {
    const plan = plans?.find(p => p.id === client.plan_id)
    if (!plan) return sum
    const clientCalls = allCalls.filter((c: any) => c.client_id === client.id)
    const usage = calculateUsage(client, plan, clientCalls)
    return sum + usage.usedCost
  }, 0)

  const totalIncluded = allClients.reduce((sum, client) => {
    const plan = plans?.find(p => p.id === client.plan_id)
    if (!plan) return sum
    return sum + (client.custom_included_cost_eur || plan.included_cost_eur)
  }, 0)

  // Alerts: clients over 80% usage
  const atRiskClients = allClients.filter(client => {
    const plan = plans?.find(p => p.id === client.plan_id)
    if (!plan) return false
    const clientCalls = allCalls.filter((c: any) => c.client_id === client.id)
    const usage = calculateUsage(client, plan, clientCalls)
    return usage.percentageUsed >= 80
  })

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

  // Conversion chart data
  const conversionChartData = Array.from({ length: 4 }).map((_, i) => {
    const weekStart = subDays(new Date(), (3 - i) * 7)
    const weekEnd = subDays(new Date(), (3 - i) * 7 - 6)
    const weekCalls = allCalls.filter((c: any) => {
      const callDate = new Date(c.created_at)
      return callDate >= weekEnd && callDate <= weekStart
    })
    const conv = calculateConversion(weekCalls)
    return {
      period: `Week ${i + 1}`,
      conversie: conv.conversionRate,
      target: 30
    }
  })

  // Revenue chart data
  const revenueChartData = Array.from({ length: 6 }).map((_, i) => {
    const monthStart = new Date()
    monthStart.setMonth(monthStart.getMonth() - (5 - i))
    monthStart.setDate(1)
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)

    const monthCalls = allCalls.filter((c: any) => {
      const callDate = new Date(c.created_at)
      return callDate >= monthStart && callDate < monthEnd
    })

    const kosten = monthCalls.reduce((sum, c: any) => sum + (c.cost_eur || 0), 0)
    const waarde = allClients.reduce((sum, client) => {
      const clientMonthCalls = monthCalls.filter((c: any) => c.client_id === client.id)
      return sum + estimateRevenue(clientMonthCalls, client.avg_deal_value || 0)
    }, 0)

    return {
      period: format(monthStart, 'MMM'),
      kosten: Math.round(kosten),
      waarde: Math.round(waarde),
      marge: Math.round(waarde - kosten)
    }
  })

  const activeClients = allClients.filter(c => c.status === 'active').length
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthCalls = allCalls.filter((c: any) => new Date(c.created_at) >= firstDayOfMonth).length

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

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Totaal Gesprekken"
          value={totalCalls || 0}
          subtitle={`${monthCalls} deze maand`}
          icon="📞"
        />
        <StatsCard
          title="Totaal Minuten"
          value={Math.round(totalMinutes)}
          subtitle="Belminuten gebruikt"
          icon="⏱️"
        />
        <StatsCard
          title="Conversie Rate"
          value={formatPercentage(conversion.conversionRate)}
          subtitle={`${conversion.appointments} afspraken`}
          icon="📊"
          trend={conversion.conversionRate >= 30 ? '+5%' : '-2%'}
        />
        <StatsCard
          title="Geschatte Omzet"
          value={formatCurrency(totalRevenue)}
          subtitle="Op basis van afspraken"
          icon="💰"
          trend="+12%"
        />
      </div>

      {/* Golden Window + Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Golden Window
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-primary mb-1">
                {formatPercentage(goldenWindow.percentage, 1)}
              </div>
              <div className="text-sm text-muted-foreground">
                {goldenWindow.withinWindow} van {totalCalls || 0} calls binnen 60 seconden
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-1">Mediane responstijd</div>
              <div className="text-2xl font-semibold">{goldenWindow.medianResponseTime}s</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">💳</span>
            Quota & Kosten
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold mb-1">
                {formatCurrency(totalUsage)}
              </div>
              <div className="text-sm text-muted-foreground">
                van {formatCurrency(totalIncluded)} inbegrepen
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  (totalUsage / totalIncluded) * 100 >= 90 ? 'bg-destructive' : 'bg-primary'
                }`}
                style={{ width: `${Math.min((totalUsage / totalIncluded) * 100, 100)}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {formatPercentage((totalUsage / totalIncluded) * 100, 1)} gebruikt
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {atRiskClients.length > 0 && (
        <div className="mb-8 p-4 bg-destructive/10 border border-destructive/50 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-destructive mb-2">Waarschuwingen</h3>
              <ul className="space-y-1 text-sm">
                {atRiskClients.slice(0, 3).map(client => {
                  const plan = plans?.find(p => p.id === client.plan_id)
                  if (!plan) return null
                  const clientCalls = allCalls.filter((c: any) => c.client_id === client.id)
                  const usage = calculateUsage(client, plan, clientCalls)
                  return (
                    <li key={client.id}>
                      <span className="font-medium">{client.company_name}</span>: {formatPercentage(usage.percentageUsed)} quota gebruikt
                      {usage.percentageUsed >= 100 && <span className="text-destructive font-semibold"> (OVERSCHREDEN)</span>}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CallsChart data={callsChartData} />
        <ConversionChart data={conversionChartData} />
      </div>

      <div className="mb-8">
        <RevenueChart data={revenueChartData} />
      </div>

      {/* Recent Calls */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recente Gesprekken</h2>
        <RecentCallsTable calls={allCalls.slice(0, 10)} />
      </div>

      {/* Clients Overview */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Klanten Overzicht</h2>
        <ClientsTable clients={allClients} />
      </div>
    </DashboardLayout>
  )
}
