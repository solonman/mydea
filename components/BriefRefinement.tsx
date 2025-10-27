import React, { useState } from 'react';
import type { Brief, RefinementData } from '../types';
import { useLanguage } from '../i18n/useLanguage';
import LoadingSpinner from './LoadingSpinner';

interface BriefRefinementProps {
  brief: Brief;
  refinementData: RefinementData;
  onSubmit: (answers: string) => void;
  isLoading: boolean;
}

const BriefRefinement: React.FC<BriefRefinementProps> = ({ brief, refinementData, onSubmit, isLoading }) => {
  const { t } = useLanguage();
  const [answers, setAnswers] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onSubmit(answers);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in" style={{ padding: '0 20px' }}>
      <div className="card-glass" style={{ padding: '32px' }}>
        <h2 className="heading-gradient" style={{ 
          fontSize: '28px', 
          textAlign: 'center', 
          marginBottom: '32px',
          letterSpacing: '-0.01em'
        }}>
          {t('intelligentRequirementAnalysis')}
        </h2>
        
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* 初步需求 */}
          <div className="card-glass" style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12H15M12 9V15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {t('yourInitialRequirement')}
              </h3>
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                background: 'rgba(59, 130, 246, 0.2)',
                color: 'var(--brand-blue-light)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                {brief.type}
              </span>
            </div>
            <p style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              lineHeight: '1.6',
              margin: 0
            }}>
              "{brief.text}"
            </p>
          </div>

          {/* AI 理解 */}
          <div className="card-glass" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {t('myUnderstanding')}
              </h3>
            </div>
            <p style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              margin: 0
            }}>
              {refinementData.summary}
            </p>
          </div>

          {/* 补充信息 */}
          <div className="card-glass" style={{ padding: '20px', background: 'rgba(168, 85, 247, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {t('improveCreativity')}
              </h3>
            </div>
            <div style={{ 
              padding: '16px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              {refinementData.questions.map((q, i) => (
                <div 
                  key={i} 
                  style={{ 
                    display: 'flex',
                    gap: '12px',
                    marginBottom: i < refinementData.questions.length - 1 ? '12px' : 0
                  }}
                >
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: 'var(--brand-blue-light)',
                    fontSize: '13px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ 
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.6',
                    flex: 1
                  }}>
                    {q}
                  </span>
                </div>
              ))}
            </div>
            <textarea
              rows={5}
              value={answers}
              onChange={(e) => setAnswers(e.target.value)}
              className="input-modern"
              placeholder={t('pleaseEnterFeedback')}
              style={{ resize: 'vertical', minHeight: '120px' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-primary"
            style={{ padding: '14px 48px', fontSize: '16px', minWidth: '240px' }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LoadingSpinner />
                <span>生成中...</span>
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{t('confirmAndGenerateInspirations')}</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BriefRefinement;
