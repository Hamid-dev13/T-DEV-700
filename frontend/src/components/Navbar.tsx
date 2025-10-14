import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#1A1A1A] border-b border-[#333333] backdrop-blur-lg bg-opacity-95 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#FFC107] 
                          rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-[#0A0A0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Time Manager
            </h1>
          </div>

          {/* User info + Logout */}
          <div className="flex items-center gap-6">
            {/* User Card */}
            <div className="hidden sm:block bg-[#2A2A2A] border border-[#333333] 
                          rounded-xl px-5 py-2.5 transition-all duration-300 hover:border-[#FFD700]/50">
              <p className="text-sm font-semibold text-white">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-[#999999] mt-0.5">
                {user?.email}
              </p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold 
                         bg-[#2A2A2A] border border-[#333333]
                         text-[#FFD700] hover:bg-[#FFD700] 
                         hover:text-[#0A0A0A] rounded-xl 
                         transition-all duration-300 hover:shadow-lg hover:shadow-[#FFD700]/20
                         transform hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;