/**
 * CSV Export utilities for Voxa Auris Dashboard
 */

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: any[], headers: string[]): string {
  const rows = [headers.join(',')]

  data.forEach(item => {
    const values = headers.map(header => {
      const value = item[header] ?? ''
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value).replace(/"/g, '""')
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue
    })
    rows.push(values.join(','))
  })

  return rows.join('\n')
}

/**
 * Trigger browser download of CSV file
 */
function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export calls to CSV
 */
export function exportCallsToCSV(
  calls: any[],
  filename: string = `voxa-auris-calls-${new Date().toISOString().split('T')[0]}.csv`
) {
  const headers = [
    'id',
    'created_at',
    'client_id',
    'agent_id',
    'lead_name',
    'lead_phone',
    'lead_email',
    'call_duration_seconds',
    'call_status',
    'call_outcome',
    'direction',
    'type',
    'response_time_sec',
    'sentiment_score',
    'appointment_date',
    'recording_url',
    'transcript_url'
  ]

  const csvContent = arrayToCSV(calls, headers)
  downloadCSV(filename, csvContent)
}

/**
 * Export clients to CSV
 */
export function exportClientsToCSV(
  clients: any[],
  filename: string = `voxa-auris-clients-${new Date().toISOString().split('T')[0]}.csv`
) {
  const headers = [
    'id',
    'company_name',
    'contact_email',
    'contact_phone',
    'plan_id',
    'status',
    'total_minutes_used',
    'monthly_minute_limit',
    'avg_deal_value',
    'created_at'
  ]

  const csvContent = arrayToCSV(clients, headers)
  downloadCSV(filename, csvContent)
}

/**
 * Export usage data to CSV
 */
export function exportUsageToCSV(
  usageData: any[],
  filename: string = `voxa-auris-usage-${new Date().toISOString().split('T')[0]}.csv`
) {
  const headers = [
    'client_id',
    'client_name',
    'plan_name',
    'minutes_used',
    'cost_eur',
    'included_cost_eur',
    'overage_eur',
    'percentage_used',
    'status'
  ]

  const csvContent = arrayToCSV(usageData, headers)
  downloadCSV(filename, csvContent)
}

/**
 * Generic export function
 */
export function exportToCSV(
  data: any[],
  headers: string[],
  filename: string
) {
  const csvContent = arrayToCSV(data, headers)
  downloadCSV(filename, csvContent)
}
