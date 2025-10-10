export default function Stat({ label, value, hint }) {
  return (
    <div className="glass p-4">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      {hint && <div className="text-xs opacity-60">{hint}</div>}
    </div>
  )
}
