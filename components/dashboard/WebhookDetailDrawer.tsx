'use client'

import { useEffect } from 'react'
import { format } from 'date-fns'

interface WebhookDetailDrawerProps {
  webhook: any
  isOpen: boolean
  onClose: () => void
}

export default function WebhookDetailDrawer({ webhook, isOpen, onClose }: WebhookDetailDrawerProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !webhook) return null

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
              <h2 className="text-2xl font-bold mb-1">Webhook Details</h2>
              <p className="text-sm text-muted-foreground">
                {format(new Date(webhook.created_at), 'dd MMMM yyyy, HH:mm:ss')}
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

          {/* Status Badge */}
          <div className="mb-6">
            <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              webhook.status === 'success'
                ? 'bg-green-500/10 text-green-500 border border-green-500/50'
                : 'bg-red-500/10 text-red-500 border border-red-500/50'
            }`}>
              {webhook.status === 'success' ? '✓' : '✗'} {webhook.status.toUpperCase()}
            </span>
          </div>

          {/* Basic Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Informatie</h3>
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event Type:</span>
                <span className="font-medium">{webhook.event_type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Klant:</span>
                <span className="font-medium">{webhook.clients?.company_name || 'N/A'}</span>
              </div>
              {webhook.response_time_ms !== null && webhook.response_time_ms !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="font-medium">{webhook.response_time_ms}ms</span>
                </div>
              )}
              {webhook.http_status_code && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HTTP Status:</span>
                  <span className={`font-medium ${
                    webhook.http_status_code >= 200 && webhook.http_status_code < 300
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                    {webhook.http_status_code}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payload */}
          {webhook.payload && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Payload</h3>
              <div className="bg-card border border-border rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {typeof webhook.payload === 'string'
                    ? webhook.payload
                    : JSON.stringify(webhook.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Response */}
          {webhook.response && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Response</h3>
              <div className="bg-card border border-border rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {typeof webhook.response === 'string'
                    ? webhook.response
                    : JSON.stringify(webhook.response, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Error */}
          {webhook.error_message && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-red-500">Error</h3>
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-sm text-red-500 whitespace-pre-wrap">
                  {webhook.error_message}
                </p>
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Technische Details</h3>
            <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Webhook ID:</span>
                <span>{webhook.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{format(new Date(webhook.created_at), 'yyyy-MM-dd HH:mm:ss')}</span>
              </div>
              {webhook.client_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client ID:</span>
                  <span>{webhook.client_id}</span>
                </div>
              )}
              {webhook.external_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">External ID:</span>
                  <span>{webhook.external_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Retry Button (if failed) */}
          {webhook.status === 'failure' && (
            <div className="mb-6">
              <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                🔄 Retry Webhook
              </button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                (Functie beschikbaar in toekomstige versie)
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
