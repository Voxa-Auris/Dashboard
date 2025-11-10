interface Client {
  id: string
  company_name: string
  contact_email: string
  contact_phone: string | null
  plan_type: string
  status: string
  total_minutes_used: number
  monthly_minute_limit: number
  created_at: string
}

interface ClientsTableProps {
  clients: Client[]
}

export default function ClientsTable({ clients }: ClientsTableProps) {
  if (!clients || clients.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="text-muted-foreground">Nog geen klanten</div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-primary/10 text-primary',
      inactive: 'bg-muted text-muted-foreground',
      trial: 'bg-secondary/10 text-secondary-foreground',
    }

    return styles[status as keyof typeof styles] || 'bg-muted text-muted-foreground'
  }

  const getPlanBadge = (plan: string) => {
    const styles = {
      starter: 'bg-accent text-accent-foreground',
      professional: 'bg-primary/10 text-primary',
      enterprise: 'bg-secondary/10 text-secondary-foreground',
    }

    return styles[plan as keyof typeof styles] || 'bg-muted text-muted-foreground'
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Bedrijf
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Gebruik
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Lid sinds
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.map((client) => {
              const usagePercentage = Math.round((client.total_minutes_used / client.monthly_minute_limit) * 100)

              return (
                <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{client.company_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{client.contact_email}</div>
                    {client.contact_phone && (
                      <div className="text-sm text-muted-foreground">{client.contact_phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full capitalize ${getPlanBadge(client.plan_type)}`}>
                      {client.plan_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">
                          {client.total_minutes_used} / {client.monthly_minute_limit} min
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${usagePercentage >= 90 ? 'bg-destructive' : usagePercentage >= 70 ? 'bg-secondary' : 'bg-primary'}`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {usagePercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(client.created_at).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
