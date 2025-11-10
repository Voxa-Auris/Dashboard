import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import WebhooksTableClient from '@/components/dashboard/WebhooksTableClient'

export default async function WebhooksPage() {
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

  // Fetch webhook logs with client info
  const { data: webhooks, count: totalWebhooks } = await supabase
    .from('webhook_logs')
    .select('*, clients(company_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(200)

  // Fetch clients for filter
  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .order('company_name')

  // Calculate stats
  const successCount = webhooks?.filter(w => w.status === 'success').length || 0
  const failureCount = webhooks?.filter(w => w.status === 'failure').length || 0
  const successRate = totalWebhooks ? (successCount / totalWebhooks) * 100 : 0

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 glow-text">
          Webhook <span className="text-primary">Logs</span>
        </h1>
        <p className="text-muted-foreground">
          {totalWebhooks || 0} webhooks totaal
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Totaal Webhooks</div>
          <div className="text-3xl font-bold">{totalWebhooks || 0}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Succesvol</div>
          <div className="text-3xl font-bold text-green-500">{successCount}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Mislukt</div>
          <div className="text-3xl font-bold text-red-500">{failureCount}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
          <div className="text-3xl font-bold">{successRate.toFixed(1)}%</div>
        </div>
      </div>

      <WebhooksTableClient
        initialWebhooks={webhooks || []}
        clients={clients || []}
      />
    </DashboardLayout>
  )
}
