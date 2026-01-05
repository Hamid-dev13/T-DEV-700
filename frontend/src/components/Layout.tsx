import React, { ReactNode } from 'react'
import { navigate } from '../router'
import { useAuth } from '../context/AuthContext'

export function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  const currentPath = window.location.pathname
  function isActive(path: string): boolean {
    return currentPath === path
  }

  return (
    <div className="min-h-screen">
      <header className="header">
        <div className="header-bar" />
        <div>
          <div className="header-inner">
            <div className="flex items-center gap-3 md:gap-4">
              <span className="brand" style={{ fontWeight: 800, fontSize: "1.05rem" }}>MR5</span>
              {user && !isActive('/login') && (
                <>
                  <button onClick={() => navigate('/clock')} className={"nav-pill" + (isActive('/clock') ? ' active' : '')}>Pointage</button>
                  <button onClick={() => navigate('/dashboard')} className={"nav-pill" + (isActive('/dashboard') ? ' active' : '')}>Dashboard</button>
                  <button onClick={() => navigate('/team')} className={"nav-pill" + (isActive('/team') ? ' active' : '')}>Équipe</button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {user && !isActive('/login') && (
                <>
                  <button onClick={() => navigate('/account')} className="nav-pill">Mon compte</button>
                  <button onClick={() => { logout().then(() => navigate('/login')); }} className="btn-ghost">Se déconnecter</button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {children}
      </main>
      <footer className="footer">© {new Date().getFullYear()} — Démo</footer>
    </div>
  )
}

// Type des props du Card
interface CardProps {
  title: string
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export function Card({ title, actions, footer, children }: CardProps) {
  return (
    <div className="glass">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
        {actions}
      </div>
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}

// Type des props du Link
interface LinkProps {
  to: string
  children: ReactNode
}

export function Link({ to, children }: LinkProps) {
  return (
    <button onClick={() => navigate(to)} className="link">
      {children}
    </button>
  )
}
