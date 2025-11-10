'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import WebhookDetailDrawer from './WebhookDetailDrawer'

interface WebhooksTableClientProps {
  initialWebhooks: any[]
  clients: any[]
}

export default function WebhooksTableClient({ initialWebhooks, clients }: WebhooksTableClientProps) {
  const [selectedWebhook, setSelectedWebhook] = useState<any | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    event_type: '',
    client: '',
    dateFrom: '',
    dateTo: ''
  })

  // Filter webhooks
  const filteredWebhooks = useMemo(() => {
    return initialWebhooks.filter(webhook => {
      if (filters.status && webhook.status !== filters.status) return false
      if (filters.event_type && webhook.event_type !== filters.event_type) return false
      if (filters.client && webhook.client_id !== filters.client) return false
      if (filters.dateFrom && webhook.created_at < filters.dateFrom) return false
      if (filters.dateTo && webhook.created_at > filters.dateTo) return false
      return true
    })
  }, [initialWebhooks, filters])

  const resetFilters = () => {
    setFilters({
      status: '',
      event_type: '',
      client: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  // Get unique event types
  const uniqueEventTypes = Array.from(new Set(initialWebhooks.map(w => w.event_type).filter(Boolean)))

  return (
    <>
      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button
            onClick={resetFilters}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Alle Statussen</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>

          {/* Event Type */}
          <select
            value={filters.event_type}
            onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Alle Event Types</option>
            {uniqueEventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Client */}
          <select
            value={filters.client}
            onChange={(e) => setFilters({ ...filters, client: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Alle Klanten</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.company_name}</option>
            ))}
          </select>

          {/* Date From */}
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Date To */}
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          {filteredWebhooks.length} van {initialWebhooks.length} webhooks
        </p>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold">Timestamp</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Event Type</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Klant</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Response Time</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredWebhooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Geen webhooks gevonden
                  </td>
                </tr>
              ) : (
                filteredWebhooks.map(webhook => (
                  <tr
                    key={webhook.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedWebhook(webhook)}
                  >
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(webhook.created_at), 'dd MMM yyyy HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted">
                        {webhook.event_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {webhook.clients?.company_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        webhook.status === 'success' ? 'bg-green-500/10 text-green-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {webhook.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {webhook.response_time_ms ? `${webhook.response_time_ms}ms` : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedWebhook(webhook)
                        }}
                        className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <WebhookDetailDrawer
        webhook={selectedWebhook}
        isOpen={!!selectedWebhook}
        onClose={() => setSelectedWebhook(null)}
      />
    </>
  )
}
