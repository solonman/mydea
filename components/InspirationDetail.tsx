import React from 'react';
import { InspirationCase } from '../types';

interface InspirationDetailProps {
  case: InspirationCase;
  onClose: () => void;
}

const InspirationDetail: React.FC<InspirationDetailProps> = ({ case: caseData, onClose }) => {
  return (
    <>
      {/* 背景蒙层 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Modal 容器 */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '800px',
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          border: '1px solid var(--border-default)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInScale 0.3s ease',
        }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--brand-blue)',
            transition: 'all 0.2s ease',
            zIndex: 1002,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* 内容区域 */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* 案例图片 */}
          <img
            src={caseData.imageUrl}
            alt={caseData.title}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          {/* 内容信息 */}
          <div style={{ padding: '32px' }}>
            {/* 标题 */}
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '8px',
              letterSpacing: '-0.02em',
            }}>
              {caseData.title}
            </h2>

            {/* 相关性评分和分类 */}
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
            }}>
              {caseData.relevanceScore !== undefined && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                }}>
                  <span style={{ color: '#22C55E', fontWeight: '600', fontSize: '14px' }}>
                    相关度: {caseData.relevanceScore}%
                  </span>
                </div>
              )}
              {caseData.category && (
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'var(--brand-blue)',
                  fontWeight: '500',
                }}>
                  {caseData.category}
                </div>
              )}
            </div>

            {/* 创意亮点 */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '12px',
              }}>
                ✨ 创意亮点
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
              }}>
                {caseData.highlight}
              </p>
            </div>

            {/* 详细描述 */}
            {caseData.detailedDescription && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                }}>
                  📋 案例详述
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {caseData.detailedDescription}
                </p>
              </div>
            )}

            {/* 核心洞察 */}
            {caseData.keyInsights && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                }}>
                  🎯 核心洞察
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {caseData.keyInsights}
                </p>
              </div>
            )}

            {/* 目标人群 */}
            {caseData.targetAudience && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  👥 目标人群
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                }}>
                  {caseData.targetAudience}
                </p>
              </div>
            )}

            {/* 所属行业 */}
            {caseData.industry && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  🏢 所属行业
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                }}>
                  {caseData.industry}
                </p>
              </div>
            )}

            {/* 来源链接 */}
            {caseData.sourceUrl && (
              <div style={{
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <a
                  href={caseData.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                    border: '1.5px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    color: 'var(--brand-blue)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                >
                  <span>查看原案例</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default InspirationDetail;
