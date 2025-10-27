import React, { useState } from 'react';
import type { InspirationCase, CreativeProposal } from '../types';
import LoadingSpinner from './LoadingSpinner';

// A simple markdown renderer
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const html = text
        .replace(/\n/g, '<br />')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const HistoricalVersionModal: React.FC<{ 
    proposal: Omit<CreativeProposal, 'history' | 'isFinalized' | 'executionDetails'>, 
    onClose: () => void,
    onPromoteAndExecute: (versionToPromote: Omit<CreativeProposal, 'history' | 'isFinalized' | 'executionDetails'>) => Promise<void>,
    isProcessing: boolean
}> = ({ proposal, onClose, onPromoteAndExecute, isProcessing }) => {
    const [isExecuting, setIsExecuting] = useState(false);

    const handlePromote = async () => {
        if(window.confirm(`您确定要选择 V${proposal.version} 作为最终版本并生成执行方案吗？这将会创建一个新的版本。`)) {
            setIsExecuting(true);
            await onPromoteAndExecute(proposal);
            setIsExecuting(false);
            onClose();
        }
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="card-glass animate-fade-in" 
                style={{ padding: '32px', maxWidth: '800px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <h3 className="heading-gradient" style={{ fontSize: '24px', marginBottom: '8px' }}>
                            {proposal.conceptTitle}
                        </h3>
                        <span className="badge-info" style={{ fontSize: '13px' }}>版本 {proposal.version}</span>
                    </div>
                    <button 
                        onClick={onClose} 
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '28px',
                            cursor: 'pointer',
                            lineHeight: '1',
                            padding: '0',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = '#EF4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                    >
                        &times;
                    </button>
                </div>
                
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px', 
                    overflowY: 'auto', 
                    paddingRight: '12px',
                    marginBottom: '24px',
                    flex: '1'
                }}>
                    <div className="card-glass" style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--brand-blue)', marginBottom: '12px' }}>
                            💡 核心创意
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            {proposal.coreIdea}
                        </p>
                    </div>
                    
                    <div className="card-glass" style={{ padding: '20px', background: 'rgba(168, 85, 247, 0.05)' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#A855F7', marginBottom: '12px' }}>
                            📝 创意详述
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            {proposal.detailedDescription}
                        </p>
                    </div>
                    
                    <div className="card-glass" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#10B981', marginBottom: '12px' }}>
                            💬 应用示例
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.6' }}>
                            "{proposal.example}"
                        </p>
                    </div>
                    
                    <div className="card-glass" style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#F59E0B', marginBottom: '12px' }}>
                            ✨ 为什么会奏效
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            {proposal.whyItWorks}
                        </p>
                    </div>
                </div>
                
                <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button 
                        onClick={handlePromote} 
                        disabled={isProcessing || isExecuting} 
                        className="btn-primary"
                        style={{ width: '100%', fontSize: '15px', padding: '12px' }}
                    >
                        {isExecuting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <LoadingSpinner className="w-4 h-4"/>
                                <span>正在处理...</span>
                            </span>
                        ) : (
                            `选用 V${proposal.version} 并执行`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProposalCard: React.FC<{ 
  proposal: CreativeProposal; 
  index: number; 
  onOptimize: (proposal: CreativeProposal, feedback: string) => Promise<void>;
  onExecute: (proposal: CreativeProposal) => Promise<void>;
  onPromoteAndExecute: (currentProposal: CreativeProposal, versionToPromote: Omit<CreativeProposal, 'history' | 'isFinalized' | 'executionDetails'>) => Promise<void>;
  isProcessing: boolean;
}> = ({ proposal, index, onOptimize, onExecute, onPromoteAndExecute, isProcessing }) => {
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<Omit<CreativeProposal, 'history' | 'isFinalized' | 'executionDetails'> | null>(null);
  
  const handleOptimizeClick = () => setShowOptimizer(true);
  const handleCancel = () => {
    setShowOptimizer(false);
    setFeedback('');
  };
  
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    await onOptimize(proposal, feedback);
    setShowOptimizer(false);
    setFeedback('');
  };
  
  const handleExecute = async () => {
      if(window.confirm("确定要将此方案定稿并生成执行细则吗？定稿后将无法再进行优化。")) {
          setIsExecuting(true);
          await onExecute(proposal);
          setIsExecuting(false);
      }
  }

  const charCount = feedback.length;
  const maxChars = 300;

  return (
    <>
    {viewingHistory && (
        <HistoricalVersionModal 
            proposal={viewingHistory} 
            onClose={() => setViewingHistory(null)} 
            onPromoteAndExecute={(version) => onPromoteAndExecute(proposal, version)}
            isProcessing={isProcessing}
        />
    )}
    <div className="card-glass animate-fade-in" style={{ padding: '32px', animationDelay: `${index * 0.1}s` }}>
      {/* 标题和版本徽章 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h3 className="heading-gradient" style={{ fontSize: '24px', marginBottom: '8px', letterSpacing: '-0.01em' }}>
            方案 {index + 1}: {proposal.conceptTitle}
          </h3>
        </div>
        <span className={proposal.isFinalized ? 'badge-success' : 'badge-info'} style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
            V{proposal.version}{proposal.isFinalized ? ' (已定稿)' : ''}
        </span>
      </div>

      {/* 创意信息卡片组 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div className="card-glass" style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--brand-blue)', marginBottom: '12px' }}>
            💡 核心创意
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.7' }}>
            {proposal.coreIdea}
          </p>
        </div>
        
        <div className="card-glass" style={{ padding: '20px', background: 'rgba(168, 85, 247, 0.05)' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#A855F7', marginBottom: '12px' }}>
            📝 创意详述
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.7' }}>
            {proposal.detailedDescription}
          </p>
        </div>
        
        <div className="card-glass" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#10B981', marginBottom: '12px' }}>
            💬 应用示例
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.7' }}>
            "{proposal.example}"
          </p>
        </div>
        
        <div className="card-glass" style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#F59E0B', marginBottom: '12px' }}>
            ✨ 为什么会奏效
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.7' }}>
            {proposal.whyItWorks}
          </p>
        </div>
      </div>
      
      {/* 历史版本 */}
      {proposal.history && proposal.history.length > 0 && (
        <details 
          className="card-glass" 
          style={{ padding: '16px', marginBottom: '24px', background: 'rgba(100, 116, 139, 0.05)' }}
        >
          <summary style={{ 
            cursor: 'pointer', 
            fontSize: '14px', 
            color: 'var(--text-secondary)', 
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            userSelect: 'none'
          }}>
            <span>📚</span>
            <span>查看历史版本 ({proposal.history.length})</span>
          </summary>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {proposal.history.slice().reverse().map(ver => (
              <button 
                key={ver.version}
                onClick={() => setViewingHistory(ver)} 
                className="card-glass"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(31, 41, 55, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--brand-blue)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(31, 41, 55, 0.5)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  <span className="badge-info" style={{ fontSize: '11px', marginRight: '8px' }}>V{ver.version}</span>
                  {ver.conceptTitle}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ver.coreIdea}
                </p>
              </button>
            ))}
          </div>
        </details>
      )}

      {/* 执行细则（已定稿方案） */}
      {proposal.isFinalized && proposal.executionDetails ? (
        <div className="card-glass" style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#10B981', margin: 0 }}>
                {proposal.executionDetails.title}
              </h4>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.8' }}>
               <SimpleMarkdown text={proposal.executionDetails.content} />
            </div>
        </div>
      ) : (
          <>
            {/* 优化反馈表单 */}
            {showOptimizer && (
              <div className="card-glass animate-fade-in" style={{ 
                padding: '24px', 
                marginBottom: '24px', 
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1.5px solid rgba(168, 85, 247, 0.3)'
              }}>
                <form onSubmit={handleSubmitFeedback}>
                  <label 
                    htmlFor={`feedback-${proposal.id}`} 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '15px', 
                      fontWeight: '600', 
                      color: '#A855F7', 
                      marginBottom: '16px' 
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 5H6C4.89543 5 4 5.89543 4 7V18C4 19.1046 4.89543 20 6 20H17C18.1046 20 19 19.1046 19 18V13M17.5858 3.58579C18.3668 2.80474 19.6332 2.80474 20.4142 3.58579C21.1953 4.36683 21.1953 5.63316 20.4142 6.41421L11.8284 15H9L9 12.1716L17.5858 3.58579Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>请输入您的修改意见</span>
                  </label>
                  <textarea 
                    id={`feedback-${proposal.id}`}
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="input-modern"
                    placeholder="例如：这个想法不错，但能让文案更幽默一点吗？或者可以增加一些互动元素..."
                    style={{ 
                      width: '100%',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      resize: 'vertical',
                      minHeight: '100px'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <div style={{ 
                      fontSize: '13px', 
                      color: charCount > maxChars * 0.9 ? '#F59E0B' : 'var(--text-muted)',
                      fontWeight: '500'
                    }}>
                      {charCount} / {maxChars}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        type="button" 
                        onClick={handleCancel} 
                        className="btn-secondary"
                        style={{ padding: '10px 24px', fontSize: '14px' }}
                      >
                        取消
                      </button>
                      <button 
                        type="submit" 
                        disabled={isProcessing || !feedback.trim() || charCount > maxChars} 
                        className="btn-primary"
                        style={{ padding: '10px 24px', fontSize: '14px' }}
                      >
                        {isProcessing ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LoadingSpinner className="w-4 h-4"/>
                            <span>正在优化...</span>
                          </span>
                        ) : (
                          '提交优化'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* 操作按钮 */}
            {!showOptimizer && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button 
                  onClick={handleOptimizeClick} 
                  disabled={isProcessing || isExecuting} 
                  className="btn-secondary"
                  style={{ padding: '12px 24px', fontSize: '14px' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 5H6C4.89543 5 4 5.89543 4 7V18C4 19.1046 4.89543 20 6 20H17C18.1046 20 19 19.1046 19 18V13M17.5858 3.58579C18.3668 2.80474 19.6332 2.80474 20.4142 3.58579C21.1953 4.36683 21.1953 5.63316 20.4142 6.41421L11.8284 15H9L9 12.1716L17.5858 3.58579Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>优化此方案</span>
                  </span>
                </button>
                <button 
                  onClick={handleExecute} 
                  disabled={isProcessing || isExecuting} 
                  className="btn-primary"
                  style={{ padding: '12px 32px', fontSize: '14px' }}
                >
                  {isExecuting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LoadingSpinner className="w-4 h-4"/>
                      <span>正在生成...</span>
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>定稿并执行</span>
                    </span>
                  )}
                </button>
              </div>
            )}
          </>
      )}
    </div>
    </>
  );
};

interface ResultsViewProps {
  inspirations: InspirationCase[];
  proposals: CreativeProposal[];
  onFinish: () => void;
  onOptimize: (proposal: CreativeProposal, feedback: string) => Promise<void>;
  onExecute: (proposal: CreativeProposal) => Promise<void>;
  onPromoteAndExecute: (currentProposal: CreativeProposal, versionToPromote: Omit<CreativeProposal, 'history'|'isFinalized'|'executionDetails'>) => Promise<void>;
  isProcessing: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ inspirations, proposals, onFinish, onOptimize, onExecute, onPromoteAndExecute, isProcessing }) => {
  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 灵感探索区 */}
      <div style={{ marginBottom: '64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 className="heading-gradient" style={{
            fontSize: '32px',
            marginBottom: '12px',
            letterSpacing: '-0.02em'
          }}>
            🌍 全球灵感探索
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            从世界各地的优秀案例中汲取灵感
          </p>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '24px' 
        }}>
          {inspirations.map((item, index) => (
            <div 
              key={index} 
              className="card-glass animate-fade-in"
              style={{
                padding: 0,
                overflow: 'hidden',
                animationDelay: `${index * 0.1}s`,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--brand-blue-light)', marginBottom: '8px', fontWeight: '500' }}>
                  ✨ 创意亮点
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
                  {item.highlight}
                </p>
                {item.sourceUrl && (
                  <a 
                    href={item.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      color: 'var(--brand-blue)',
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-blue-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--brand-blue)'}
                  >
                    查看来源
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9L9 3M9 3H5M9 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 创意方案区 */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 className="heading-gradient" style={{
            fontSize: '32px',
            marginBottom: '12px',
            letterSpacing: '-0.02em'
          }}>
            💡 为您生成的创意方案
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            基于 AI 智能分析，结合全球最佳实践
          </p>
        </div>
        <div style={{ display: 'grid', gap: '24px' }}>
          {proposals.map((proposal, index) => (
            <ProposalCard 
              key={proposal.id + proposal.version} 
              proposal={proposal} 
              index={index} 
              onOptimize={onOptimize} 
              onExecute={onExecute} 
              onPromoteAndExecute={onPromoteAndExecute}
              isProcessing={isProcessing} 
            />
          ))}
        </div>
      </div>
      
      {/* 完成按钮 */}
      <div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '32px' }}>
        <button
          onClick={onFinish}
          className="btn-primary"
          style={{ padding: '14px 48px', fontSize: '16px', minWidth: '240px' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>完成并保存</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
