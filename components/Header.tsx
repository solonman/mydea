
import React, { useState, useEffect, useRef } from 'react';
import { Stage, User } from '../types';

interface HeaderProps {
  onNavigateToDashboard: () => void;
  onLogout: () => void;
  onBackToHome: () => void;
  currentStage: Stage;
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ onNavigateToDashboard, onLogout, onBackToHome, currentStage, user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const isSecondaryPage = ![Stage.LOGIN, Stage.HOME].includes(currentStage);

  return (
    <header className="flex justify-between items-center relative">
      <div>
        {isSecondaryPage ? (
           <button 
             onClick={onBackToHome}
             className="px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
           >
             &larr; 返回主页
           </button>
        ) : (
          <div className="w-28"></div> // Placeholder for alignment
        )}
      </div>

      <div className="text-center absolute left-1/2 -translate-x-1/2">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          Mydea
        </h1>
        <p className="mt-2 text-lg text-gray-300 hidden sm:block">
          你的专属 AI 广告创意伙伴
        </p>
      </div>

      <div className="relative" ref={menuRef}>
        {user && (
          <div>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full border border-gray-600 hover:bg-gray-700">
              <span className="text-white font-medium">{user.username}</span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 z-10">
                <button 
                  onClick={() => { onNavigateToDashboard(); setMenuOpen(false); }} 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                >
                  项目管理
                </button>
                <button 
                  onClick={onLogout} 
                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
