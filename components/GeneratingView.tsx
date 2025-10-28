import React from 'react';
import { GeneratingStatus } from '../types';
import { useLanguage } from '../i18n/useLanguage';
import LoadingSpinner from './LoadingSpinner';

interface GeneratingViewProps {
  status: GeneratingStatus;
}

const GeneratingView: React.FC<GeneratingViewProps> = ({ status }) => {
  const { t } = useLanguage();
  
  const statusConfig: Record<GeneratingStatus, { message: string; progress: number; icon: string }> = {
    analyzing: { message: t('analyzingRequirements'), progress: 25, icon: "🔍" },
    inspiring: { message: t('searchingGlobalInspirations'), progress: 55, icon: "🌍" },
    creating: { message: t('creatingProposals'), progress: 85, icon: "✨" },
    finished: { message: t('finishingUp'), progress: 100, icon: "🎉" }
  };
  
  const config = statusConfig[status];
  
  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in" style={{ padding: '80px 20px' }}>
      <div className="card-glass" style={{ padding: '48px 40px', maxWidth: '600px', width: '100%' }}>
        {/* Loading 动画 */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))',
          marginBottom: '24px',
          animation: 'pulse-glow 2s ease-in-out infinite'
        }}>
          <LoadingSpinner className="w-12 h-12" />
        </div>

        {/* 状态图标 */}
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
          animation: 'fadeInUp 0.6s ease'
        }}>
          {config.icon}
        </div>

        {/* 状态文字 */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '12px',
          letterSpacing: '-0.01em'
        }}>
          {config.message}
        </h2>
        
        <p style={{
          fontSize: '14px',
          color: 'var(--text-tertiary)',
          marginBottom: '32px'
        }}>
          {t('pleaseWait')}
        </p>
        
        {/* 进度条 */}
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {t('progress')}
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--brand-blue-light)'
            }}>
              {config.progress}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div
              style={{
                width: `${config.progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)',
                borderRadius: '4px',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
              }}
            />
          </div>
        </div>

        {/* 提示文字 */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: 'rgba(59, 130, 246, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.1)'
        }}>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: '1.6'
          }}>
            💡 {t('aiGeneratingProposals')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneratingView;
