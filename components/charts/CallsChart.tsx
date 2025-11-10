'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, subDays } from 'date-fns'

interface CallsChartProps {
  data: Array<{
    date: string
    calls: number
    successful: number
    failed: number
  }>
  title?: string
}

export default function CallsChart({ data, title = 'Gesprekken Trend' }: CallsChartProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="date"
            stroke="#ffffff60"
            tick={{ fill: '#ffffff60' }}
          />
          <YAxis
            stroke="#ffffff60"
            tick={{ fill: '#ffffff60' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="calls"
            stroke="#11b4eb"
            name="Totaal"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="successful"
            stroke="#10b981"
            name="Succesvol"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="failed"
            stroke="#ef4444"
            name="Mislukt"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
