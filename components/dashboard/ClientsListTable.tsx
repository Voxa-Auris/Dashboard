'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { calculateUsage, formatCurrency, formatPercentage } from '@/lib/calculations'
import { exportClientsToCSV } from '@/lib/exports'
import ExportButton from '@/components/ExportButton'

interface ClientsListTableProps {
  clients: any[]
  calls: any[]
}

export default function ClientsListTable({ clients, calls }: ClientsListTableProps) {
  const [filters, setFilters] = useState({
    status: '',
    plan: '',
    search: ''
  })

  // Calculate usage for each client
  const clientsWithUsage = useMemo(() => {
    return clients.map(client => {
      const clientCalls = calls.filter((c: any) => c.client_id === client.id)
      const totalMinutes = clientCalls.reduce((sum: number, c: any) => sum + (c.call_duration_seconds || 0), 0) / 60
      const totalCalls = clientCalls.length

      let usage = null
      if (client.plans) {
        usage = calculateUsage(client, client.plans, clientCalls)
      }

      return {
        ...client,
        totalMinutes,
        totalCalls,
        usage
      }
    })
  }, [clients, calls])

  // Filter clients
  const filteredClients = useMemo(() => {
    return clientsWithUsage.filter(client => {
      if (filters.status && client.status !== filters.status) return false
      if (filters.plan && client.plan_id !== filters.plan) return false
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        return (
          client.company_name?.toLowerCase().includes(searchLower) ||
          client.contact_email?.toLowerCase().includes(searchLower) ||
          client.contact_phone?.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }, [clientsWithUsage, filters])

  const resetFilters = () => {
    setFilters({ status: '', plan: '', search: '' })
  }

  const handleExport = () => {
    exportClientsToCSV(filteredClients)
  }

  // Get unique plans for filter
  const uniquePlans = Array.from(new Set(clients.map(c => c.plans).filter(Boolean)))

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Zoek bedrijf, email, telefoon..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Alle Statussen</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="paused">Paused</option>
          </select>

          {/* Plan */}
          <select
            value={filters.plan}
            onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Alle Plannen</option>
            {uniquePlans.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredClients.length} van {clients.length} klanten
          </p>
          <ExportButton onExport={handleExport} disabled={filteredClients.length === 0} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Totaal Klanten</div>
          <div className="text-3xl font-bold">{clients.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Actieve Klanten</div>
          <div className="text-3xl font-bold text-green-500">
            {clients.filter(c => c.status === 'active').length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Totaal Gesprekken</div>
          <div className="text-3xl font-bold">{calls.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Totaal Minuten</div>
          <div className="text-3xl font-bold">
            {Math.round(calls.reduce((sum: number, c: any) => sum + (c.call_duration_seconds || 0), 0) / 60)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold">Bedrijf</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Plan</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Gesprekken</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Minuten</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Gebruik</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    Geen klanten gevonden
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr
                    key={client.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{client.company_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{client.contact_email || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{client.contact_phone || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium capitalize">
                        {client.plans?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        client.status === 'active' ? 'bg-green-500/10 text-green-500' :
                        client.status === 'inactive' ? 'bg-red-500/10 text-red-500' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {client.totalCalls}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {Math.round(client.totalMinutes)}
                    </td>
                    <td className="px-4 py-3">
                      {client.usage ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-[60px]">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  client.usage.status === 'exceeded' ? 'bg-destructive' :
                                  client.usage.status === 'danger' ? 'bg-destructive' :
                                  client.usage.status === 'warning' ? 'bg-secondary' :
                                  'bg-primary'
                                }`}
                                style={{ width: `${Math.min(client.usage.percentageUsed, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className={`text-xs font-medium ${
                            client.usage.percentageUsed >= 100 ? 'text-destructive' :
                            client.usage.percentageUsed >= 80 ? 'text-secondary' :
                            'text-muted-foreground'
                          }`}>
                            {formatPercentage(client.usage.percentageUsed)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
