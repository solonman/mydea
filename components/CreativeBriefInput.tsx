import React, { useState } from 'react';
import type { Brief, CreativeType } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface CreativeBriefInputProps {
  onSubmit: (brief: Brief) => void;
  isLoading: boolean;
}

const CREATIVE_TYPES: CreativeType[] = ["Slogan", "社交媒体文案", "平面设计", "视频创意", "公关活动", "品牌命名"];

const CreativeBriefInput: React.FC<CreativeBriefInputProps> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [selectedType, setSelectedType] = useState<CreativeType>('Slogan');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSubmit({ text, type: selectedType });
    }
  };

  const charCount = text.length;
  const maxChars = 500;

  return (
    <div className="w-full">
      <div className="card-glass animate-fade-in" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="creative-brief" 
              style={{
                display: 'block',
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                letterSpacing: '-0.01em'
              }}
            >
              💡 请告诉我你的创意需求是什么？
            </label>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>
              信息越详细，AI 生成的创意越精准
            </p>
          </div>

          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <textarea
              id="creative-brief"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={maxChars}
              className="input-modern"
              style={{
                resize: 'vertical',
                minHeight: '150px',
                paddingBottom: '40px'
              }}
              placeholder="例如：为我的咖啡品牌写一个新的 Slogan，它主打高品质阿拉比卡豆和城市白领市场。"
            />
            <div style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              fontSize: '12px',
              color: charCount > maxChars * 0.9 ? '#F59E0B' : 'var(--text-muted)',
              fontWeight: '500'
            }}>
              {charCount} / {maxChars}
            </div>
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <p style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              marginBottom: '12px'
            }}>
              选择创意类型：
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CREATIVE_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    borderRadius: '20px',
                    border: selectedType === type 
                      ? '1.5px solid var(--brand-blue)' 
                      : undefined,
                    background: selectedType === type
                      ? 'rgba(59, 130, 246, 0.15)'
                      : undefined,
                    color: selectedType === type
                      ? 'var(--brand-blue-light)'
                      : undefined,
                    boxShadow: selectedType === type
                      ? '0 0 20px rgba(59, 130, 246, 0.2)'
                      : undefined
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className="btn-primary"
              style={{ padding: '14px 48px', fontSize: '16px', width: '100%', maxWidth: '400px' }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <LoadingSpinner />
                  <span>生成中...</span>
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 10V3L4 14H11L11 21L20 10L13 10Z" fill="currentColor"/>
                  </svg>
                  <span>生成创意</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreativeBriefInput;
