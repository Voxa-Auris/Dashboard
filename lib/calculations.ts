/**
 * Usage & Cost Calculations for Voxa Auris Dashboard
 */

export interface Plan {
  id: string
  name: string
  included_cost_eur: number
  rate_eur_per_min: number
  overage_markup: number
  reset_day: number
}

export interface Client {
  id: string
  company_name: string
  plan_id: string
  custom_rate_eur_per_min?: number | null
  custom_included_cost_eur?: number | null
  total_minutes_used: number
  monthly_minute_limit: number
  avg_deal_value?: number | null
}

export interface AICall {
  id: string
  client_id: string
  agent_id: string
  call_duration_seconds: number
  call_status: string
  call_outcome?: string | null
  response_time_sec?: number | null
  sentiment_score?: number | null
  created_at: string
}

/**
 * Calculate usage metrics for a client
 */
export function calculateUsage(
  client: Client,
  plan: Plan,
  calls: AICall[]
) {
  // Total minutes from calls
  const totalSeconds = calls.reduce((sum, call) => sum + (call.call_duration_seconds || 0), 0)
  const minutes = totalSeconds / 60

  // Rate (use custom or plan default)
  const rate = client.custom_rate_eur_per_min ?? plan.rate_eur_per_min

  // Included cost (use custom or plan default)
  const includedCost = client.custom_included_cost_eur ?? plan.included_cost_eur

  // Used cost
  const usedCost = minutes * rate

  // Overage
  const overageCostRaw = Math.max(0, usedCost - includedCost)
  const overageBillable = overageCostRaw * (1 + plan.overage_markup)

  // Percentage
  const percentageUsed = includedCost > 0 ? (usedCost / includedCost) * 100 : 0

  // Status
  let status: 'normal' | 'warning' | 'danger' | 'exceeded' = 'normal'
  if (percentageUsed >= 100) status = 'exceeded'
  else if (percentageUsed >= 90) status = 'danger'
  else if (percentageUsed >= 70) status = 'warning'

  return {
    minutes: Math.round(minutes * 100) / 100,
    usedCost: Math.round(usedCost * 100) / 100,
    includedCost,
    overageCostRaw: Math.round(overageCostRaw * 100) / 100,
    overageBillable: Math.round(overageBillable * 100) / 100,
    percentageUsed: Math.round(percentageUsed * 10) / 10,
    status,
    rate
  }
}

/**
 * Calculate Golden Window metrics
 * Golden Window = % of calls where response_time_sec <= 60
 */
export function calculateGoldenWindow(calls: AICall[]) {
  const totalCalls = calls.length
  if (totalCalls === 0) {
    return {
      percentage: 0,
      withinWindow: 0,
      outsideWindow: 0,
      medianResponseTime: 0
    }
  }

  // Filter calls within 60 seconds
  const withinWindow = calls.filter(c => (c.response_time_sec ?? 9999) <= 60).length
  const outsideWindow = totalCalls - withinWindow
  const percentage = (withinWindow / totalCalls) * 100

  // Calculate median response time
  const responseTimes = calls
    .map(c => c.response_time_sec ?? 9999)
    .sort((a, b) => a - b)

  const mid = Math.floor(responseTimes.length / 2)
  const medianResponseTime = responseTimes.length % 2 === 0
    ? (responseTimes[mid - 1] + responseTimes[mid]) / 2
    : responseTimes[mid]

  return {
    percentage: Math.round(percentage * 10) / 10,
    withinWindow,
    outsideWindow,
    medianResponseTime: Math.round(medianResponseTime)
  }
}

/**
 * Calculate conversion metrics
 */
export function calculateConversion(calls: AICall[]) {
  const totalCalls = calls.length
  if (totalCalls === 0) {
    return {
      conversionRate: 0,
      appointments: 0,
      qualified: 0,
      notInterested: 0
    }
  }

  const appointments = calls.filter(c => c.call_outcome === 'appointment').length
  const qualified = calls.filter(c => c.call_outcome === 'qualified').length
  const notInterested = calls.filter(c =>
    c.call_outcome === 'not_interested' ||
    c.call_outcome === 'other' ||
    c.call_status === 'failed'
  ).length

  const conversionRate = (appointments / totalCalls) * 100

  return {
    conversionRate: Math.round(conversionRate * 10) / 10,
    appointments,
    qualified,
    notInterested
  }
}

/**
 * Estimate revenue based on appointments and average deal value
 */
export function estimateRevenue(calls: AICall[], avgDealValue: number = 0) {
  const appointments = calls.filter(c => c.call_outcome === 'appointment').length
  return Math.round(appointments * avgDealValue * 100) / 100
}

/**
 * Calculate sentiment distribution
 */
export function calculateSentiment(calls: AICall[]) {
  const withSentiment = calls.filter(c => c.sentiment_score !== null && c.sentiment_score !== undefined)

  if (withSentiment.length === 0) {
    return {
      positive: 0,
      neutral: 0,
      negative: 0,
      average: 0
    }
  }

  const positive = withSentiment.filter(c => (c.sentiment_score ?? 0) >= 0.7).length
  const neutral = withSentiment.filter(c => {
    const score = c.sentiment_score ?? 0
    return score >= 0.4 && score < 0.7
  }).length
  const negative = withSentiment.filter(c => (c.sentiment_score ?? 0) < 0.4).length

  const sum = withSentiment.reduce((acc, c) => acc + (c.sentiment_score ?? 0), 0)
  const average = sum / withSentiment.length

  return {
    positive,
    neutral,
    negative,
    average: Math.round(average * 100) / 100
  }
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency
  }).format(amount)
}

/**
 * Format duration (seconds to readable format)
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
