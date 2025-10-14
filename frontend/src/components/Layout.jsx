import React from 'react'
import { navigate } from '../router'
import { useAuth } from '../context/AuthContext'

export function Shell({ children }) {
  const { user, logout } = useAuth()
  function isActive(path){ return location === path }

  return (
    <div className="min-h-screen">
      <header className="header">
      
        <div className="header-bar" />
        <div className="">
          <div className="header-inner">
            <div className="flex items-center gap-3 md:gap-4"><span className="brand" style={{fontWeight:800,fontSize:"1.05rem"}}>MR5</span>
              {user && !isActive('/login') ? (
                <>
                  <button onClick={() => navigate('/clock')} className={"nav-pill" + (isActive('/clock') ? ' active' : '')}>Pointage</button>
                  <button onClick={() => navigate('/dashboard')} className={"nav-pill" + (isActive('/dashboard') ? ' active' : '')}>Dashboard</button>
                  <button onClick={() => navigate('/team')} className={"nav-pill" + (isActive('/team') ? ' active' : '')}>Équipe</button>
                </>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {user && !isActive('/login') ? (
                <>
                  <button onClick={() => navigate('/account')} className="nav-pill">Mon compte</button>
                  <button onClick={() => { logout(); navigate('/login'); }} className="btn-ghost">Se déconnecter</button>
                </>
              ) : null}
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

export function Card({ title, actions, footer, children }) {
  return (
    <div className="glass">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
        {actions}
      </div>
      <div className="card-body">{children}</div>
      {footer ? <div className="card-footer">{footer}</div> : null}
    </div>
  )
}

export function Link({ to, children }) {
  return (<button onClick={() => navigate(to)} className="link">{children}</button>)
}