import React from 'react'
import { navigate } from '../router'
import { currentUser, signOut } from '../auth'

export function Shell({ children }) {
  function isActive(path){ return location.hash === '#' + path }
  const me = currentUser()
  const base = me ? (me.role === 'manager' ? '/manager' : '/employee') : '/login'

  return (
    <div className="min-h-screen">
      <header className="header">
      
        <div className="header-bar" />
        <div className="">
          <div className="header-inner">
            <div className="flex items-center gap-3 md:gap-4"><span className="brand" style={{fontWeight:800,fontSize:"1.05rem"}}>MR5</span>
              {me && me.role === 'manager' ? (
                <>
                  <button onClick={() => navigate('/manager/punch')} className={"nav-pill" + (isActive('/manager/punch') ? ' active' : '')}>Pointage</button>
                  <button onClick={() => navigate('/manager/dashboard')} className={"nav-pill" + (isActive('/manager/dashboard') ? ' active' : '')}>Dashboard</button>
                  <button onClick={() => navigate('/manager/team')} className={"nav-pill" + (isActive('/manager/team') ? ' active' : '')}>Équipe</button>
                </>
              ) : me ? (
                <>
                  <button onClick={() => navigate('/employee/punch')} className={"nav-pill" + (isActive('/employee/punch') ? ' active' : '')}>Pointage</button>
                  <button onClick={() => navigate('/employee/dashboard')} className={"nav-pill" + (isActive('/employee/dashboard') ? ' active' : '')}>Mon dashboard</button>
                  </>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {me ? (
                <>
                  <button onClick={() => navigate(base + '/account')} className="nav-pill">Mon compte</button>
                  <button onClick={() => { signOut(); navigate('/login'); }} className="btn-ghost">Se déconnecter</button>
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