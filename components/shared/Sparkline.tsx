'use client'

import { ResponsiveContainer, LineChart, Line } from 'recharts'

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
}

export default function Sparkline({ data, color = '#a78bfa', height = 32, width = 80 }: SparklineProps) {
  const chartData = data.map((v, i) => ({ v, i }))
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
