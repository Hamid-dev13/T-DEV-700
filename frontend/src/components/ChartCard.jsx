import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts'

export function LineChartCard({ title, data, dataKeyX, dataKeyY }) {
  return (
    <div className="glass p-4">
      <div className="font-semibold mb-2">{title}</div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKeyX} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={dataKeyY} stroke="var(--chart-color, #22d3ee)" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function BarChartCard({ title, data, dataKeyX, dataKeyY }) {
  return (
    <div className="glass p-4">
      <div className="font-semibold mb-2">{title}</div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKeyX} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={dataKeyY} fill="var(--chart-color, #22d3ee)" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
