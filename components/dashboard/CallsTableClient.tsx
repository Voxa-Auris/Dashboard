'use client'

import { useState, useMemo } from 'react'
import AudioPlayer from '@/components/AudioPlayer'
import ExportButton from '@/components/ExportButton'
import CallDetailDrawer from './CallDetailDrawer'
import { exportCallsToCSV } from '@/lib/exports'
import { format } from 'date-fns'

interface CallsTableClientProps {
  initialCalls: any[]
  agents: any[]
  clients: any[]
  isAdmin: boolean
}

export default function CallsTableClient({ initialCalls, agents, clients, isAdmin }: CallsTableClientProps) {
  const [selectedCall, setSelectedCall] = useState<any | null>(null)
  const [filters, setFilters] = useState({
    agent: '',
    client: '',
    status: '',
    outcome: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  })

  // Filter calls based on current filters
  const filteredCalls = useMemo(() => {
    return initialCalls.filter(call => {
      if (filters.agent && call.agent_id !== filters.agent) return false
      if (filters.client && call.client_id !== filters.client) return false
      if (filters.status && call.call_status !== filters.status) return false
      if (filters.outcome && call.call_outcome !== filters.outcome) return false
      if (filters.type && call.type !== filters.type) return false
      if (filters.dateFrom && call.created_at < filters.dateFrom) return false
      if (filters.dateTo && call.created_at > filters.dateTo) return false
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        return (
          call.lead_name?.toLowerCase().includes(searchLower) ||
          call.lead_phone?.toLowerCase().includes(searchLower) ||
          call.lead_email?.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }, [initialCalls, filters])

  const handleExport = () => {
    exportCallsToCSV(filteredCalls)
  }

  const resetFilters = () => {
    setFilters({
      agent: '',
      client: '',
      status: '',
      outcome: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    })
  }

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Zoek naam, telefoon, email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Agent */}
          <select
            value={filters.agent}
            onChange={(e) => setFilters({ ...filters, agent: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Alle Agents</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>

          {/* Client (admin only) */}
          {isAdmin && (
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
          )}

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Alle Statussen</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="no-answer">No Answer</option>
            <option value="busy">Busy</option>
          </select>

          {/* Outcome */}
          <select
            value={filters.outcome}
            onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Alle Uitkomsten</option>
            <option value="appointment">Afspraak</option>
            <option value="interested">Geïnteresseerd</option>
            <option value="not-interested">Niet Geïnteresseerd</option>
            <option value="callback">Terugbellen</option>
            <option value="no-response">Geen Reactie</option>
          </select>

          {/* Type */}
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Alle Types</option>
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
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

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredCalls.length} van {initialCalls.length} gesprekken
          </p>
          <ExportButton onExport={handleExport} disabled={filteredCalls.length === 0} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold">Datum</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Lead</th>
                {isAdmin && <th className="text-left px-4 py-3 text-sm font-semibold">Klant</th>}
                <th className="text-left px-4 py-3 text-sm font-semibold">Agent</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Duur</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Uitkomst</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Audio</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-4 py-12 text-center text-muted-foreground">
                    Geen gesprekken gevonden
                  </td>
                </tr>
              ) : (
                filteredCalls.map(call => (
                  <tr
                    key={call.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedCall(call)}
                  >
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(call.created_at), 'dd MMM yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{call.lead_name || 'Onbekend'}</div>
                      <div className="text-xs text-muted-foreground">{call.lead_phone}</div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-sm">
                        {call.clients?.company_name || 'N/A'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm">
                      {call.agents?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {call.call_duration_seconds
                        ? `${Math.floor(call.call_duration_seconds / 60)}:${(call.call_duration_seconds % 60).toString().padStart(2, '0')}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        call.call_status === 'completed' ? 'bg-green-500/10 text-green-500' :
                        call.call_status === 'failed' ? 'bg-red-500/10 text-red-500' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {call.call_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        call.call_outcome === 'appointment' ? 'bg-primary/10 text-primary' :
                        call.call_outcome === 'interested' ? 'bg-blue-500/10 text-blue-500' :
                        call.call_outcome === 'not-interested' ? 'bg-gray-500/10 text-gray-500' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {call.call_outcome || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {call.recording_url ? (
                        <button className="text-primary hover:text-primary/80 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCall(call)
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
      <CallDetailDrawer
        call={selectedCall}
        isOpen={!!selectedCall}
        onClose={() => setSelectedCall(null)}
      />
    </>
  )
}
