'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'

interface ConversionChartProps {
  data: Array<{
    period: string
    conversie: number
    target: number
  }>
  title?: string
}

export default function ConversionChart({ data, title = 'Conversie Trend' }: ConversionChartProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="period"
            stroke="#ffffff60"
            tick={{ fill: '#ffffff60' }}
          />
          <YAxis
            stroke="#ffffff60"
            tick={{ fill: '#ffffff60' }}
            label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#ffffff60' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px'
            }}
            formatter={(value: number) => `${value}%`}
          />
          <Legend />
          <Bar dataKey="conversie" fill="#11b4eb" name="Conversie" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.conversie >= entry.target ? '#10b981' : '#11b4eb'} />
            ))}
          </Bar>
          <Bar dataKey="target" fill="#f4dd8d" name="Target" radius={[8, 8, 0, 0]} opacity={0.3} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
