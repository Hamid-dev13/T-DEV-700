import React from 'react'

interface DataPoint {
  label: string
  value: number
}

interface BarChartProps {
  data: DataPoint[]
  color?: string
  maxValue?: number
  unit?: string
  height?: number
}

export default function BarChart({ 
  data, 
  color = '#f59e0b', 
  maxValue, 
  unit = '',
  height = 400 
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    )
  }

  const displayData = data.length > 14 ? data.slice(-14) : data
  const max = maxValue || Math.max(...displayData.map(d => d.value), 1)
  
  const chartHeight = height - 100

  return (
    <div className="w-full bg-white rounded-lg p-6">
      <div className="flex items-end justify-around gap-3" style={{ height: `${chartHeight}px` }}>
        {displayData.map((point, index) => {
          const barHeightPx = max > 0 ? (point.value / max) * (chartHeight - 40) : 0
          
          let displayValue = ''
          if (unit === 'h') {
            displayValue = `${Math.floor(point.value / 60)}h${Math.round(point.value % 60).toString().padStart(2, '0')}`
          } else if (unit === 'min') {
            const totalMinutes = Math.round(point.value)
            if (totalMinutes >= 60) {
              const hours = Math.floor(totalMinutes / 60)
              const mins = totalMinutes % 60
              displayValue = `${hours}h${mins.toString().padStart(2, '0')}`
            } else {
              displayValue = `${totalMinutes}min`
            }
          } else {
            displayValue = Math.round(point.value).toString() + unit
          }
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 max-w-[100px]">
              <div className="text-sm font-bold text-gray-800 mb-2" style={{ minHeight: '20px' }}>
                {point.value > 0 ? displayValue : ''}
              </div>
              
              <div 
                className="w-full rounded-t-lg hover:opacity-80 transition-opacity"
                style={{ 
                  height: `${barHeightPx}px`,
                  backgroundColor: point.value > 0 ? color : '#e5e7eb',
                  minHeight: '4px'
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-around gap-3 mt-4 pt-4 border-t border-gray-200">
        {displayData.map((point, index) => (
          <div 
            key={index} 
            className="flex-1 max-w-[100px] text-center"
          >
            <div className="text-xs text-gray-700 font-medium">
              {point.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
