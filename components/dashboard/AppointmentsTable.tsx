'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import CallDetailDrawer from './CallDetailDrawer'

interface AppointmentsTableProps {
  appointments: any[]
  showDate?: boolean
}

export default function AppointmentsTable({ appointments, showDate = true }: AppointmentsTableProps) {
  const [selectedCall, setSelectedCall] = useState<any | null>(null)

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {showDate && <th className="text-left px-4 py-3 text-sm font-semibold">Datum & Tijd</th>}
                <th className="text-left px-4 py-3 text-sm font-semibold">Lead</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Agent</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Notities</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={showDate ? 6 : 5} className="px-4 py-12 text-center text-muted-foreground">
                    Geen afspraken
                  </td>
                </tr>
              ) : (
                appointments.map(appointment => (
                  <tr
                    key={appointment.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedCall(appointment)}
                  >
                    {showDate && (
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {format(new Date(appointment.appointment_date), 'dd MMM yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(appointment.appointment_date), 'HH:mm')}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-medium">{appointment.lead_name || 'Onbekend'}</div>
                      {appointment.lead_company && (
                        <div className="text-sm text-muted-foreground">{appointment.lead_company}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{appointment.lead_phone}</div>
                      {appointment.lead_email && (
                        <div className="text-xs text-muted-foreground">{appointment.lead_email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {appointment.agents?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {appointment.appointment_notes || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCall(appointment)
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
