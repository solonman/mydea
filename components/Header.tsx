
import React, { useState, useEffect, useRef } from 'react';
import { Stage, User } from '../types';
import { useLanguage } from '../i18n/useLanguage';

interface HeaderProps {
  onNavigateToDashboard: () => void;
  onLogout: () => void;
  onBackToHome: () => void;
  onNavigateToSettings: () => void; // 添加设置页面导航函数
  currentStage: Stage;
  user: User | null;
  returnToProjectId?: string | null;
  isFromProjectDetails?: boolean; // 标记是否从项目详情页来的
}

const Header: React.FC<HeaderProps> = ({ onNavigateToDashboard, onLogout, onBackToHome, onNavigateToSettings, currentStage, user, returnToProjectId, isFromProjectDetails }) => {
  const { t } = useLanguage();
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
  // 特殊情况：如果在主页但有返回项目ID，也需要显示返回按钮
  const showBackButton = isSecondaryPage || (currentStage === Stage.HOME && returnToProjectId);

  return (
    <>
      {/* 顶部标题栏 */}
      <header className="flex justify-between items-center pb-8">
        {/* 左侧：Logo 和 Slogan */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
          <img 
            src="/logo.png" 
            alt="Mydea Logo" 
            style={{
              width: '120px',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
          <div>
            <p className="text-sm text-gray-400 hidden sm:block">
              AI时代的创意之道
            </p>
          </div>
        </div>

        {/* 右侧：项目管理 + 用户菜单 */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              {/* 项目管理按钮 */}
              <button
                onClick={onNavigateToDashboard}
                className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-600 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors"
              >
                {t('projectManagement')}
              </button>
              
              {/* 用户菜单 */}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-600 hover:bg-gray-700">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={t('avatar')} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="#9CA3AF" strokeWidth="2"/>
                        <path d="M3 21C3 17.6863 5.68629 15 9 15H15C18.3137 15 21 17.6863 21 21V22H3V21Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                  <span className="text-white font-medium">{user.username}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 z-10">
                    <button 
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigateToSettings();
                      }} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                    >
                      {t('settings')}
                    </button>
                    <button 
                      onClick={onLogout} 
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>
      
      {/* 分隔线 */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 20%, rgba(236, 72, 153, 0.3) 50%, rgba(239, 68, 68, 0.3) 80%, transparent 100%)',
        margin: showBackButton ? '0 0 32px 0' : '0 0 40px 0'
      }} />
      
      {/* 返回按钮（在分隔线下面） */}
      {showBackButton && (
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={onBackToHome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
              border: '1.5px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              color: '#60A5FA',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
              e.currentTarget.style.transform = 'translateX(-4px)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ transition: 'transform 0.3s ease' }}
            >
              <path 
                d="M19 12H5M5 12L12 19M5 12L12 5" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span>{currentStage === Stage.PROJECT_DETAILS ? t('returnToProjectList') : currentStage === Stage.BRIEF_REFINEMENT || currentStage === Stage.RESULTS ? t('returnToProjectDetails') : returnToProjectId ? t('returnToProjectDetails') : t('returnToHome')}</span>
          </button>
        </div>
      )}
    </>
  );
};

export default Header;
