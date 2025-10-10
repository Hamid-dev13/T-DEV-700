import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function NavBar({ links }) {
  const { user, logout } = useAuth()
  return (
    <header className="sticky top-0 z-50">
      <div className="glass mx-auto max-w-6xl mt-4 px-4 py-3 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-3">
          {links?.map(l => (
            <Link key={l.to} to={l.to} className="px-3 py-1 rounded-xl hover:bg-white/5">{l.label}</Link>
          ))}
          <div className="text-sm opacity-80 mr-2 hidden sm:block">{user?.firstName} {user?.lastName}</div>
          <button onClick={logout} className="btn btn-primary">Déconnexion</button>
        </nav>
      </div>
    </header>
  )
}
