import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/employee');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        {/* Logo / Titre */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1E2448] mb-2">
            Time Manager
          </h1>
          <p className="text-[#64748B]">
            Connectez-vous pour pointer
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-[#1E2448] mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
               className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-[#FFC933] 
                          transition-all text-gray-900"
              placeholder="votre.email@exemple.com"
            />
          </div>

          {/* Password */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-[#1E2448] mb-2"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
               className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-[#FFC933] 
                          transition-all text-gray-900"
              placeholder="••••••••"
            />
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-[#FF6B6B] text-[#FF6B6B] 
                          px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FFC933] hover:bg-[#FFBF00] 
                       text-[#1E2448] font-semibold py-3 px-6 rounded-lg 
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-md hover:shadow-lg"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;