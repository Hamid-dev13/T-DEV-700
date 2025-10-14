import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { clockIn } from '../services/api';

const EmployeePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleClockIn = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await clockIn();
      setMessage({ 
        type: 'success', 
        text: `Pointage enregistré à ${new Date(result.at).toLocaleTimeString('fr-FR')}` 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erreur lors du pointage' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Contenu principal */}
      <div className="flex flex-col items-center justify-center px-4 relative" 
           style={{ minHeight: 'calc(100vh - 5rem)' }}>
        
        {/* Background decorative grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute inset-0" 
               style={{
                 backgroundImage: `radial-gradient(circle at 2px 2px, #FFD700 1px, transparent 0)`,
                 backgroundSize: '50px 50px'
               }}>
          </div>
        </div>

        {/* Heure actuelle */}
        <div className="text-center mb-12 animate-fadeIn">
          <p className="text-gray-600 text-sm font-medium mb-2 tracking-wider uppercase">
            Temps actuel
          </p>
          <h2 className="text-6xl font-bold text-black tracking-tight">
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </h2>
          <p className="text-[#FFD700] text-lg mt-2">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {/* Bouton Pointer - Design moderne */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FFC107] 
                          rounded-full blur-3xl opacity-20 animate-pulse-glow"></div>
          
          <button
            onClick={handleClockIn}
            disabled={isLoading}
            className="relative bg-gradient-to-br from-[#FFD700] to-[#FFC107] 
                       hover:from-[#FFC107] hover:to-[#FFEB3B]
                       text-black font-bold text-3xl
                       w-72 h-72 rounded-full shadow-2xl
                       transition-all duration-500 ease-out
                       hover:scale-110 active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                       border-4 border-white
                       flex flex-col items-center justify-center gap-4
                       group overflow-hidden"
          >
            {/* Inner ring decoration */}
            <div className="absolute inset-8 border-2 border-black/20 rounded-full 
                            group-hover:scale-110 transition-transform duration-500"></div>
            
            {isLoading ? (
              <div className="flex flex-col items-center gap-4 z-10">
                <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xl">Envoi...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 z-10">
                <svg className="w-24 h-24 transform group-hover:rotate-12 transition-transform duration-500" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="tracking-wide">POINTER</span>
              </div>
            )}
          </button>
        </div>

        {/* Message de feedback */}
        {message && (
          <div className={`mt-12 px-8 py-4 rounded-2xl shadow-xl max-w-md text-center
                          transition-all duration-500 animate-fadeIn backdrop-blur-sm
                          border-2
                          ${message.type === 'success' 
                            ? 'bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]' 
                            : 'bg-red-500/10 border-red-500 text-red-400'}`}>
            <div className="flex items-center justify-center gap-3">
              {message.type === 'success' ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className="font-semibold text-lg">{message.text}</p>
            </div>
          </div>
        )}

        {/* Instructions subtiles */}
        <div className="mt-16 text-center animate-fadeIn">
          <p className="text-gray-600 text-sm">
            Cliquez sur le bouton pour enregistrer votre pointage
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;
