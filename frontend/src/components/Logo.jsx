export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" className="text-amber-400">
        <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M12 9v4l3 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M9 2h6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
      <span className="font-bold tracking-wide">Time Manager</span>
    </div>
  )
}
