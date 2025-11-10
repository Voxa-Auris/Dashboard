'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface RevenueChartProps {
  data: Array<{
    period: string
    kosten: number
    waarde: number
    marge: number
  }>
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Kosten vs Waarde</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="period"
            stroke="#ffffff60"
            tick={{ fill: '#ffffff60' }}
          />
          <YAxis
            stroke="#ffffff60"
            tick={{ fill: '#ffffff60' }}
            label={{ value: '€', angle: -90, position: 'insideLeft', fill: '#ffffff60' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px'
            }}
            formatter={(value: number) => `€${value.toFixed(2)}`}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="waarde"
            stackId="1"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
            name="Waarde"
          />
          <Area
            type="monotone"
            dataKey="kosten"
            stackId="2"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.6}
            name="Kosten"
          />
          <Area
            type="monotone"
            dataKey="marge"
            stackId="3"
            stroke="#f4dd8d"
            fill="#f4dd8d"
            fillOpacity={0.6}
            name="Marge"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
