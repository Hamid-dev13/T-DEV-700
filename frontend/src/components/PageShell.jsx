export default function PageShell({ title, description, children, actions }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="opacity-80">{description}</p>}
        </div>
        <div className="flex gap-2">{actions}</div>
      </div>
      <div className="glass p-4">{children}</div>
    </div>
  )
}
