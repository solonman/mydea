import React, { useState } from 'react';
import { RefinementExpression } from '../types';
import { useLanguage } from '../i18n/useLanguage';

interface RefinementEditorModalProps {
  refinement: RefinementExpression;
  onClose: () => void;
  onSave: (refinement: RefinementExpression) => void;
  isProcessing?: boolean;
}

const RefinementEditorModal: React.FC<RefinementEditorModalProps> = ({
  refinement,
  onClose,
  onSave,
  isProcessing = false,
}) => {
  const { t } = useLanguage();
  const [editedRefinement, setEditedRefinement] = useState<RefinementExpression>(refinement);
  const [activeTab, setActiveTab] = useState<'main' | 'alternatives' | 'guidance'>('main');

  const handleFieldChange = (field: keyof RefinementExpression, value: any) => {
    setEditedRefinement((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAlternativeChange = (index: number, value: string) => {
    const newAlternatives = [...(editedRefinement.alternatives || [])];
    newAlternatives[index] = value;
    setEditedRefinement((prev) => ({
      ...prev,
      alternatives: newAlternatives,
    }));
  };

  const handleSave = () => {
    onSave({
      ...editedRefinement,
      isUserModified: true,
    });
  };

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
          zIndex: 2000,
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
          zIndex: 2001,
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '1000px',
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
        {/* 头部 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 32px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(37, 99, 235, 0.03) 100%)',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: '4px',
              }}
            >
              细化创意表达
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              基于你的创意方案进行精炼和具体化
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            ✕
          </button>
        </div>

        {/* 标签页 */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            paddingLeft: '32px',
          }}
        >
          {(['main', 'alternatives', 'guidance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab ? '600' : '500',
                color: activeTab === tab ? 'var(--brand-blue)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab ? '2px solid var(--brand-blue)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {tab === 'main' && '主体内容'}
              {tab === 'alternatives' && '可选方案'}
              {tab === 'guidance' && '风格指导'}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px',
          }}
        >
          {activeTab === 'main' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  标题
                </label>
                <input
                  type="text"
                  value={editedRefinement.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  核心创意
                </label>
                <textarea
                  value={editedRefinement.refinedCoreIdea}
                  onChange={(e) => handleFieldChange('refinedCoreIdea', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    minHeight: '100px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  最终表达示例
                </label>
                <textarea
                  value={editedRefinement.refinedExample}
                  onChange={(e) => handleFieldChange('refinedExample', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    minHeight: '150px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  表达理由
                </label>
                <textarea
                  value={editedRefinement.reasoning}
                  onChange={(e) => handleFieldChange('reasoning', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    minHeight: '100px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'alternatives' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                编辑可选的表达方式，每个方案代表一个不同的角度或风格
              </p>
              {(editedRefinement.alternatives || []).map((alt, idx) => (
                <div key={idx}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    可选方案 {idx + 1}
                  </label>
                  <textarea
                    value={alt}
                    onChange={(e) => handleAlternativeChange(idx, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '8px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      minHeight: '120px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'guidance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  视觉指导
                </label>
                <textarea
                  value={editedRefinement.visualGuidance || ''}
                  onChange={(e) => handleFieldChange('visualGuidance', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    minHeight: '120px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                  placeholder="针对平面设计、视频等视觉创意的具体指导..."
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  语调指导
                </label>
                <textarea
                  value={editedRefinement.toneGuidance || ''}
                  onChange={(e) => handleFieldChange('toneGuidance', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    minHeight: '120px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                  placeholder="表达的语调、风格和基调..."
                />
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '20px 32px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isProcessing ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-primary)';
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              background: 'linear-gradient(135deg, var(--brand-blue) 0%, #2563eb 100%)',
              color: 'white',
              borderRadius: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isProcessing ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isProcessing ? '保存中...' : '保存为新版本'}
          </button>
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
      </div>
    </>
  );
};

export default RefinementEditorModal;
