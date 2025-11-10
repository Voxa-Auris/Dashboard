interface Call {
  id: string
  agent_name: string
  lead_name: string | null
  lead_phone: string
  call_status: string
  call_outcome: string | null
  call_duration_seconds: number
  created_at: string
  clients?: {
    company_name: string
  }
}

interface RecentCallsTableProps {
  calls: Call[]
}

export default function RecentCallsTable({ calls }: RecentCallsTableProps) {
  if (!calls || calls.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="text-muted-foreground">Nog geen gesprekken</div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-primary/10 text-primary',
      pending: 'bg-secondary/10 text-secondary-foreground',
      failed: 'bg-destructive/10 text-destructive',
      scheduled: 'bg-accent text-accent-foreground',
    }

    return styles[status as keyof typeof styles] || 'bg-muted text-muted-foreground'
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Agent
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Lead
              </th>
              {calls[0]?.clients && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Klant
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Duur
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Datum
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {calls.map((call) => (
              <tr key={call.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {call.agent_name.charAt(0)}
                    </div>
                    <span className="font-medium">{call.agent_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{call.lead_name || 'Onbekend'}</div>
                  <div className="text-sm text-muted-foreground">{call.lead_phone}</div>
                </td>
                {call.clients && (
                  <td className="px-6 py-4">
                    <span className="text-sm">{call.clients.company_name}</span>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(call.call_status)}`}>
                    {call.call_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {call.call_duration_seconds > 0 ? formatDuration(call.call_duration_seconds) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {new Date(call.created_at).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
