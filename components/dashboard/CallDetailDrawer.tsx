'use client'

import { useEffect } from 'react'
import AudioPlayer from '@/components/AudioPlayer'
import { format } from 'date-fns'

interface CallDetailDrawerProps {
  call: any
  isOpen: boolean
  onClose: () => void
}

export default function CallDetailDrawer({ call, isOpen, onClose }: CallDetailDrawerProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !call) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-background border-l border-border z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Gesprek Details</h2>
              <p className="text-sm text-muted-foreground">
                {format(new Date(call.created_at), 'dd MMMM yyyy, HH:mm')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Audio Player */}
          {call.recording_url && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2">Opname</h3>
              <AudioPlayer url={call.recording_url} />
            </div>
          )}

          {/* Lead Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Lead Informatie</h3>
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Naam:</span>
                <span className="font-medium">{call.lead_name || 'Onbekend'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefoon:</span>
                <span className="font-medium">{call.lead_phone || 'N/A'}</span>
              </div>
              {call.lead_email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{call.lead_email}</span>
                </div>
              )}
              {call.lead_company && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bedrijf:</span>
                  <span className="font-medium">{call.lead_company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Call Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Gesprek Details</h3>
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agent:</span>
                <span className="font-medium">{call.agents?.name || 'N/A'}</span>
              </div>
              {call.clients?.company_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Klant:</span>
                  <span className="font-medium">{call.clients.company_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Richting:</span>
                <span className="font-medium capitalize">{call.direction || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{call.type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duur:</span>
                <span className="font-medium">
                  {call.call_duration_seconds
                    ? `${Math.floor(call.call_duration_seconds / 60)}m ${call.call_duration_seconds % 60}s`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  call.call_status === 'completed' ? 'bg-green-500/10 text-green-500' :
                  call.call_status === 'failed' ? 'bg-red-500/10 text-red-500' :
                  'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {call.call_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uitkomst:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  call.call_outcome === 'appointment' ? 'bg-primary/10 text-primary' :
                  call.call_outcome === 'interested' ? 'bg-blue-500/10 text-blue-500' :
                  call.call_outcome === 'not-interested' ? 'bg-gray-500/10 text-gray-500' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {call.call_outcome || 'N/A'}
                </span>
              </div>
              {call.response_time_sec !== null && call.response_time_sec !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Responstijd:</span>
                  <span className={`font-medium ${call.response_time_sec <= 60 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {call.response_time_sec}s {call.response_time_sec <= 60 && '⚡'}
                  </span>
                </div>
              )}
              {call.sentiment_score !== null && call.sentiment_score !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sentiment:</span>
                  <span className={`font-medium ${
                    call.sentiment_score >= 0.7 ? 'text-green-500' :
                    call.sentiment_score >= 0.4 ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {(call.sentiment_score * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {call.cost_eur !== null && call.cost_eur !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kosten:</span>
                  <span className="font-medium">€{call.cost_eur.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          {call.call_outcome === 'appointment' && call.appointment_date && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Afspraak</h3>
              <div className="bg-primary/10 border border-primary/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold text-primary">
                    {format(new Date(call.appointment_date), 'dd MMMM yyyy, HH:mm')}
                  </span>
                </div>
                {call.appointment_notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {call.appointment_notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Transcript */}
          {call.transcript_url && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Transcript</h3>
              <div className="bg-card border border-border rounded-lg p-4">
                <a
                  href={call.transcript_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Bekijk Transcript
                </a>
              </div>
            </div>
          )}

          {/* Notes */}
          {call.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Notities</h3>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{call.notes}</p>
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Technische Details</h3>
            <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Call ID:</span>
                <span>{call.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{format(new Date(call.created_at), 'yyyy-MM-dd HH:mm:ss')}</span>
              </div>
              {call.external_call_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">External ID:</span>
                  <span>{call.external_call_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
