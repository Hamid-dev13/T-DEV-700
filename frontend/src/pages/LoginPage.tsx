import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // État pour stocker l'email tapé par l'utilisateur
  const [email, setEmail] = useState('');
  
  // État pour stocker le mot de passe tapé par l'utilisateur
  const [password, setPassword] = useState('');
  
  // État pour savoir si on est en train de charger
  const [isLoading, setIsLoading] = useState(false);
  
  // État pour stocker les erreurs
  const [error, setError] = useState('');

  // Fonction qui s'exécute quand on soumet le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    
    // Réinitialise l'erreur
    setError('');
    
    // Active le chargement
    setIsLoading(true);
    
    try {
      // Utilise la vraie fonction de connexion
      const result = await login(email, password);
      
      if (result.success) {
        // Connexion réussie - la redirection se fait automatiquement via PrivateRoute
        navigate('/employee');
      } else {
        // Erreur de connexion
        setError(result.error || 'Email ou mot de passe incorrect');
      }
    } catch (err) {
      // Erreur inattendue
      setError('Erreur de connexion');
    } finally {
      // Désactive le chargement
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Background decorative grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute inset-0" 
             style={{
               backgroundImage: `radial-gradient(circle at 2px 2px, #FFD700 1px, transparent 0)`,
               backgroundSize: '50px 50px'
             }}>
        </div>
      </div>

      {/* Carte blanche */}
      <div className="bg-white/95 backdrop-blur-xl p-12 rounded-2xl shadow-2xl max-w-md w-full mx-4 relative border border-white/20">
      
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Champ Email */}
          <div>
            <label 
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-3 tracking-wide"
            >
              Email
            </label>
            <input 
              id="email"
              type="email" 
              placeholder="votre.email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 border-0 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-[#FFD700]/30 focus:bg-white transition-all duration-300 text-black placeholder:text-gray-400 text-base font-medium shadow-sm hover:shadow-md focus:shadow-lg backdrop-blur-sm"
            />
          </div>

          {/* Champ Mot de passe */}
          <div>
            <label 
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-3 tracking-wide"
            >
              Mot de passe
            </label>
            <input 
              id="password"
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 border-0 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-[#FFD700]/30 focus:bg-white transition-all duration-300 text-black placeholder:text-gray-400 text-base font-medium shadow-sm hover:shadow-md focus:shadow-lg backdrop-blur-sm"
            />
          </div>

          {/* Affichage de l'erreur si elle existe */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Bouton de connexion */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold 
                       bg-[#2A2A2A] border border-[#333333]
                       text-[#FFD700] hover:bg-[#FFD700] 
                       hover:text-[#0A0A0A] rounded-xl 
                       transition-all duration-300 hover:shadow-lg hover:shadow-[#FFD700]/20
                       transform hover:scale-105 active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
                Connexion en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Se connecter
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
