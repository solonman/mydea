import React, { useState, useEffect } from 'react';
import type { InspirationCase, CreativeProposal, RefinementExpression } from '../types';
import { useLanguage } from '../i18n/useLanguage';
import LoadingSpinner from './LoadingSpinner';
import InspirationDetail from './InspirationDetail';
import RichTextEditor from './RichTextEditor';
import { refineCreativeExpression } from '../services/geminiService';
import { downloadAsMarkdown, downloadAsDocx } from '../services/downloadService';

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
    
    // 确保所有字符串字段都是字符串
    const safeProposal = {
      ...proposal,
      conceptTitle: typeof proposal.conceptTitle === 'string' ? proposal.conceptTitle : JSON.stringify(proposal.conceptTitle),
      coreIdea: typeof proposal.coreIdea === 'string' ? proposal.coreIdea : JSON.stringify(proposal.coreIdea),
      detailedDescription: typeof proposal.detailedDescription === 'string' ? proposal.detailedDescription : JSON.stringify(proposal.detailedDescription),
      example: typeof proposal.example === 'string' ? proposal.example : JSON.stringify(proposal.example),
      whyItWorks: typeof proposal.whyItWorks === 'string' ? proposal.whyItWorks : JSON.stringify(proposal.whyItWorks),
    };

    const handlePromote = async () => {
        if(window.confirm(`您确定要选择 V${safeProposal.version} 作为最终版本并生成执行方案吗？这将会创建一个新的版本。`)) {
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
                            {safeProposal.conceptTitle}
                        </h3>
                        <span className="badge-info" style={{ fontSize: '13px' }}>版本 {safeProposal.version}</span>
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
                            {safeProposal.coreIdea}
                        </p>
                    </div>
                    
                    <div className="card-glass" style={{ padding: '20px', background: 'rgba(168, 85, 247, 0.05)' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#A855F7', marginBottom: '12px' }}>
                            📝 创意详述
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            {safeProposal.detailedDescription}
                        </p>
                    </div>
                    
                    <div className="card-glass" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#10B981', marginBottom: '12px' }}>
                            💬 应用示例
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.6' }}>
                            "{safeProposal.example}"
                        </p>
                    </div>
                    
                    <div className="card-glass" style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#F59E0B', marginBottom: '12px' }}>
                            ✨ 为什么会奏效
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            {safeProposal.whyItWorks}
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
                            `选用 V${safeProposal.version} 并执行`
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
  onRefinementSave?: (proposal: CreativeProposal, refinement: RefinementExpression) => Promise<void>;
  creativeType?: string;
  contextBrief?: string;
  isProcessing: boolean;
  t: (key: any, options?: any) => string;
  openVersionMenuId?: string | null;
  setOpenVersionMenuId?: (id: string | null) => void;
  anyFeedbackFormOpen: boolean;
  setAnyFeedbackFormOpen: (open: boolean) => void;
  anyTaskRunning: boolean;
  setAnyTaskRunning: (running: boolean) => void;
  onOpenEditor?: (proposal: CreativeProposal, refinement: RefinementExpression) => void;
}> = ({ proposal, index, onOptimize, onExecute, onPromoteAndExecute, onRefinementSave, creativeType = '创意', contextBrief = '', isProcessing, t, openVersionMenuId, setOpenVersionMenuId, anyFeedbackFormOpen, setAnyFeedbackFormOpen, anyTaskRunning, setAnyTaskRunning, onOpenEditor }) => {
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<Omit<CreativeProposal, 'history' | 'isFinalized' | 'executionDetails'> | null>(null);
  const [isRefinementExpanded, setIsRefinementExpanded] = useState(true);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  // 只记录选中的版本号，不记录整个对象
  const [selectedVersionNumber, setSelectedVersionNumber] = useState(proposal.version);
  const [showRefinementVersionMenu, setShowRefinementVersionMenu] = useState(false);
  // 细化版本数据显示：v1 或 v2
  const [displayRefinementVersion, setDisplayRefinementVersion] = useState<'v1' | 'v2'>('v1');
  
  // 根据版本号获取实际的版本对象
  const getCurrentDisplayVersion = (): CreativeProposal => {
    if (selectedVersionNumber === proposal.version) {
      return proposal;
    }
    // 从 history 中查找对应版本
    const historyVersion = proposal.history?.find(v => v.version === selectedVersionNumber);
    if (historyVersion) {
      return {
        ...historyVersion,
        history: proposal.history || [],
        isFinalized: false,
        executionDetails: null
      };
    }
    // 如果找不到，返回当前版本
    return proposal;
  };
  
  const displayVersion = getCurrentDisplayVersion();
  
  // 确保所有字符串字段都是字符串，而不是对象
  const safeDisplayVersion = {
    ...displayVersion,
    conceptTitle: typeof displayVersion.conceptTitle === 'string' ? displayVersion.conceptTitle : JSON.stringify(displayVersion.conceptTitle),
    coreIdea: typeof displayVersion.coreIdea === 'string' ? displayVersion.coreIdea : JSON.stringify(displayVersion.coreIdea),
    detailedDescription: typeof displayVersion.detailedDescription === 'string' ? displayVersion.detailedDescription : JSON.stringify(displayVersion.detailedDescription),
    example: typeof displayVersion.example === 'string' ? displayVersion.example : JSON.stringify(displayVersion.example),
    whyItWorks: typeof displayVersion.whyItWorks === 'string' ? displayVersion.whyItWorks : JSON.stringify(displayVersion.whyItWorks),
  };
  
  // 根据 refinement 中的 versionLabel 判断是否有用户修改的 v2 版本
  const hasV2Version = displayVersion.refinement?.versionLabel?.startsWith('v2');
  
  // 根据displayRefinementVersion选择显示的细化内容（v1原始版本或v2修改版本）
  const getDisplayRefinement = () => {
    if (displayRefinementVersion === 'v2' && hasV2Version) {
      // 显示 v2 修改版本
      return displayVersion.refinement;
    }
    // 显示 v1 原始版本
    return displayVersion.refinementV1 || displayVersion.refinement;
  };
  
  const currentDisplayRefinement = getDisplayRefinement();
  
  const handleOptimizeClick = () => {
    setShowOptimizer(true);
    setAnyFeedbackFormOpen(true);
    setAnyTaskRunning(true);
  };
  const handleCancel = () => {
    setShowOptimizer(false);
    setFeedback('');
    setAnyFeedbackFormOpen(false);
    setAnyTaskRunning(false);
  };
  
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    await onOptimize(proposal, feedback);
    setShowOptimizer(false);
    setFeedback('');
    setAnyFeedbackFormOpen(false);
    setAnyTaskRunning(false);
  };
  
  const handleExecute = async () => {
      if(window.confirm("确定要将此方案定稿并生成执行细则吗？定稿后将无法再进行优化。")) {
          setIsExecuting(true);
          setAnyTaskRunning(true);
          await onExecute(proposal);
          setIsExecuting(false);
          setAnyTaskRunning(false);
      }
  }

  const handleRefineClick = async () => {
    if (!proposal.refinement) {
      // 生成细化内容
      setIsRefining(true);
      setAnyTaskRunning(true);
      try {
        const refinement = await refineCreativeExpression(
          proposal,
          creativeType as any,
          contextBrief
        );
        // 自动保存细化内容
        if (onRefinementSave) {
          await onRefinementSave(proposal, refinement);
          setIsRefinementExpanded(true);
        }
      } catch (error) {
        console.error('Error refining creative expression:', error);
        alert('生成细化内容失败，请重试');
      } finally {
        setIsRefining(false);
        setAnyTaskRunning(false);
      }
    } else {
      // 已有细化内容，直接展开/折叠
      setIsRefinementExpanded(!isRefinementExpanded);
    }
  }

  const handleSaveRefinement = async (refinement: RefinementExpression) => {
    if (onRefinementSave) {
      setIsRefining(true);
      try {
        // 保存用户修改的版本（versionLabel 已在编辑器中设置）
        await onRefinementSave(proposal, refinement);
        // 编辑完成后自动切换到 v2 显示
        setDisplayRefinementVersion('v2');
        setIsRefinementExpanded(true);
      } catch (error) {
        console.error('Error saving refinement:', error);
        alert('保存失败，请重试');
      } finally {
        setIsRefining(false);
      }
    }
  }

  const handleEditClick = () => {
    if (displayVersion.refinement && onOpenEditor) {
      onOpenEditor(proposal, displayVersion.refinement);
    }
  };

  const charCount = feedback.length;
  const maxChars = 300;
  
  // 下载处理
  const handleDownload = (format: string) => {
    switch(format) {
      case 'markdown':
        downloadAsMarkdown(proposal);
        break;
      case 'docx':
        downloadAsDocx(proposal);
        break;
    }
    setShowDownloadMenu(false);
  };

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
      {/* 标题和版本号 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <h3 className="heading-gradient" style={{ fontSize: '24px', marginBottom: '0', letterSpacing: '-0.01em', flex: 1 }}>
          方案 {index + 1}: {displayVersion.conceptTitle}
        </h3>
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              // 开方案简句菜单
              setOpenVersionMenuId?.(openVersionMenuId === proposal.id ? null : proposal.id);
            }}
            style={{
              padding: '8px 16px',
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--brand-blue)',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '6px',
              cursor: proposal.history && proposal.history.length > 0 ? 'pointer' : 'default',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (proposal.history && proposal.history.length > 0) {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            }}
          >
            V{displayVersion.version}
          </button>
          
          {/* 版本菜单 - 由父组件控制是否打开 */}
          {openVersionMenuId === proposal.id && (
            <>
              {/* 蓄层 */}
              <div
                onClick={() => setOpenVersionMenuId?.(null)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9998,
                  background: 'transparent'
                }}
              />
              {/* 菜单 */}
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  padding: '12px',
                  minWidth: '160px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                  zIndex: 9999
                }}
              >
                {/* 当前版本 */}
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    cursor: 'default',
                    fontWeight: '600'
                  }}
                >
                  V{displayVersion.version} (当前)
                </button>
                
                {/* 历史版本和未来版本 */}
                {(() => {
                  const allVersions = [...(proposal.history || []), proposal];
                  return allVersions
                   .filter(v => v.version !== selectedVersionNumber)
                   .sort((a, b) => b.version - a.version)
                   .map(ver => (
                     <button key={ver.version} onClick={() => {
                      setSelectedVersionNumber(ver.version);
                      setIsRefinementExpanded(false);
                      setOpenVersionMenuId?.(null);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      background: 'transparent',
                      border: '1px solid rgba(100,116,139,0.3)',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(100,116,139,0.3)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    V{ver.version}
                  </button>
                ));
                })()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 创意信息卡片组 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div className="card-glass" style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--brand-blue)', marginBottom: '12px' }}>
            💡 核心创意
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.7' }}>
            {safeDisplayVersion.coreIdea}
          </p>
        </div>
        
        <div className="card-glass" style={{ padding: '20px', background: 'rgba(168, 85, 247, 0.05)' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#A855F7', marginBottom: '12px' }}>
            📝 创意详述
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.7' }}>
            {safeDisplayVersion.detailedDescription}
          </p>
        </div>
        
        <div className="card-glass" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#10B981', marginBottom: '12px' }}>
            💬 应用示例
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.7' }}>
            "{safeDisplayVersion.example}"
          </p>
        </div>
        
        <div className="card-glass" style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#F59E0B', marginBottom: '12px' }}>
            ✨ 为什么会奏效
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.7' }}>
            {safeDisplayVersion.whyItWorks}
          </p>
        </div>
      </div>
      
      {/* 细化表达内容（展开/折叠） - 仅在当前显示版本有细化时显示 */}
      {displayVersion.refinement && (
        <div className="card-glass" style={{ padding: '24px', marginTop: '24px', background: 'rgba(59, 130, 246, 0.05)', border: '1.5px solid rgba(59, 130, 246, 0.2)' }}>
          {/* 标题行：V2细化方案 + 展开/折叠按鑵 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--brand-blue)', margin: 0 }}>
              V{displayVersion.version}细化方案
            </h4>
            <button
              onClick={() => setIsRefinementExpanded(!isRefinementExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                color: 'var(--brand-blue)',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  transform: isRefinementExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              >
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{isRefinementExpanded ? '折叠' : '展开'}</span>
            </button>
          </div>

          {isRefinementExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
              {/* 细化展示区 - 背景区块 */}
              <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '8px' }}>
                {/* 展示区右上角显示小写版本号 v1 或 v2 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', position: 'relative' }}>
                  <button
                    onClick={() => setShowRefinementVersionMenu(!showRefinementVersionMenu)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--brand-blue)',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                    }}
                  >
                    {displayRefinementVersion === 'v2' && hasV2Version ? displayVersion.refinement?.versionLabel : 'v1'}
                  </button>
                  
                  {/* 版本切换菜单 */}
                  {showRefinementVersionMenu && (
                    <>
                      <div
                        onClick={() => setShowRefinementVersionMenu(false)}
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 1998,
                          background: 'transparent'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '8px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-default)',
                          borderRadius: '8px',
                          padding: '8px',
                          minWidth: '160px',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                          zIndex: 1999
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDisplayRefinementVersion('v1');
                            setShowRefinementVersionMenu(false);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 12px',
                            fontSize: '13px',
                            color: displayRefinementVersion === 'v1' ? 'var(--brand-blue)' : 'var(--text-secondary)',
                            background: displayRefinementVersion === 'v1' ? 'rgba(59,130,246,0.15)' : 'transparent',
                            border: displayRefinementVersion === 'v1' ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(100,116,139,0.3)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginBottom: '4px',
                            fontWeight: displayRefinementVersion === 'v1' ? '600' : '500',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = displayRefinementVersion === 'v1' ? 'rgba(59,130,246,0.15)' : 'transparent';
                            e.currentTarget.style.borderColor = displayRefinementVersion === 'v1' ? 'rgba(59,130,246,0.4)' : 'rgba(100,116,139,0.3)';
                          }}
                        >
                          v1 原始版本
                        </button>
                        {hasV2Version && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDisplayRefinementVersion('v2');
                              setShowRefinementVersionMenu(false);
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 12px',
                              fontSize: '13px',
                              color: displayRefinementVersion === 'v2' ? 'var(--brand-blue)' : 'var(--text-secondary)',
                              background: displayRefinementVersion === 'v2' ? 'rgba(59,130,246,0.15)' : 'transparent',
                              border: displayRefinementVersion === 'v2' ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(100,116,139,0.3)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: displayRefinementVersion === 'v2' ? '600' : '500',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = displayRefinementVersion === 'v2' ? 'rgba(59,130,246,0.15)' : 'transparent';
                              e.currentTarget.style.borderColor = displayRefinementVersion === 'v2' ? 'rgba(59,130,246,0.4)' : 'rgba(100,116,139,0.3)';
                            }}
                          >
                            {displayVersion.refinement?.versionLabel}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* 细化内容显示 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 如果refinedExample包含HTML标签，则使用dangerouslySetInnerHTML渲染 */}
                  {currentDisplayRefinement.refinedExample && /<[^>]*>/.test(currentDisplayRefinement.refinedExample) ? (
                    <div
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.6',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: currentDisplayRefinement.refinedExample
                      }}
                      className="refinement-html-content"
                    />
                  ) : (
                    // 如果没有HTML标签，按原来的方式显示各个字段
                    <>
                      <div>
                        <h5 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--brand-blue)', marginBottom: '8px', marginTop: 0 }}>
                          标题
                        </h5>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>
                          {currentDisplayRefinement.title}
                        </p>
                      </div>

                      <div>
                        <h5 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--brand-blue)', marginBottom: '8px', marginTop: 0 }}>
                          核心创意
                        </h5>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>
                          {currentDisplayRefinement.refinedCoreIdea}
                        </p>
                      </div>

                      <div>
                        <h5 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--brand-blue)', marginBottom: '8px', marginTop: 0 }}>
                          最终表达示例
                        </h5>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {currentDisplayRefinement.refinedExample}
                        </p>
                      </div>

                      {currentDisplayRefinement.alternatives && currentDisplayRefinement.alternatives.length > 0 && (
                        <div>
                          <h5 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--brand-blue)', marginBottom: '8px', marginTop: 0 }}>
                            可选表达方式
                          </h5>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {currentDisplayRefinement.alternatives.map((alt, idx) => (
                              <li key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '6px' }}>
                                {alt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <h5 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--brand-blue)', marginBottom: '8px', marginTop: 0 }}>
                          表达理由
                        </h5>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>
                          {currentDisplayRefinement.reasoning}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* 细化展示区下部：下载和编辑按钮 */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(59, 130, 246, 0.15)', display: 'grid', gridTemplateColumns: displayRefinementVersion === 'v2' && hasV2Version ? '1fr 1fr' : '1fr', gap: '12px', position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      className="btn-secondary"
                      disabled={isRefining || anyTaskRunning}
                      style={{ padding: '10px 16px', fontSize: '14px', width: '100%', opacity: (isRefining || anyTaskRunning) ? 0.5 : 1 }}
                    >
                      下载
                    </button>
                                    
                    {/* 下载菜单 */}
                    {showDownloadMenu && (
                      <>
                        <div
                          onClick={() => setShowDownloadMenu(false)}
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 998,
                            background: 'transparent'
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 0,
                            marginBottom: '8px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '8px',
                            padding: '8px',
                            minWidth: '200px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                            zIndex: 999
                          }}
                        >
                          <button
                            onClick={() => handleDownload('markdown')}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 12px',
                              fontSize: '14px',
                              color: 'var(--text-primary)',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              marginBottom: '4px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            📄 Markdown (.md)
                          </button>
                          <button
                            onClick={() => handleDownload('docx')}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 12px',
                              fontSize: '14px',
                              color: 'var(--text-primary)',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            📕 Word (.docx)
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {/* 编辑按钮：只在显示 v2 版本时显示 */}
                  {displayRefinementVersion === 'v2' && hasV2Version && (
                    <button
                      onClick={handleEditClick}
                      className="btn-secondary"
                      disabled={isRefining || !displayVersion.refinement || anyTaskRunning}
                      style={{ padding: '10px 16px', fontSize: '14px', opacity: (isRefining || !displayVersion.refinement || anyTaskRunning) ? 0.5 : 1 }}
                    >
                      编辑
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
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
                    <span>{t('enterOptimizationFeedback')}</span>
                  </label>
                  <textarea 
                    id={`feedback-${proposal.id}`}
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="input-modern"
                    placeholder={t('enterOptimizationFeedback')}
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
                        {t('cancel')}
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
                            <span>{t('submitting')}</span>
                          </span>
                        ) : (
                          <span>{t('submitOptimization')}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* 操作按钮 - 仅在没有细化内容时显示 */}
            {!showOptimizer && !displayVersion.refinement && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                <button 
                  onClick={handleOptimizeClick} 
                  disabled={isProcessing || isExecuting || isRefining || anyFeedbackFormOpen || anyTaskRunning} 
                  className="btn-secondary"
                  style={{ padding: '12px 24px', fontSize: '14px', opacity: (isProcessing || isExecuting || isRefining || anyFeedbackFormOpen || anyTaskRunning) ? 0.5 : 1, cursor: (isProcessing || isExecuting || isRefining || anyFeedbackFormOpen || anyTaskRunning) ? 'not-allowed' : 'pointer' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 5H6C4.89543 5 4 5.89543 4 7V18C4 19.1046 4.89543 20 6 20H17C18.1046 20 19 19.1046 19 18V13M17.5858 3.58579C18.3668 2.80474 19.6332 2.80474 20.4142 3.58579C21.1953 4.36683 21.1953 5.63316 20.4142 6.41421L11.8284 15H9L9 12.1716L17.5858 3.58579Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('optimize')}</span>
                  </span>
                </button>
                <button 
                  onClick={handleRefineClick} 
                  disabled={isProcessing || isExecuting || isRefining || anyFeedbackFormOpen || anyTaskRunning} 
                  className="btn-secondary"
                  style={{ padding: '12px 24px', fontSize: '14px', opacity: (isProcessing || isExecuting || isRefining || anyFeedbackFormOpen || anyTaskRunning) ? 0.5 : 1, cursor: (isProcessing || isExecuting || isRefining || anyFeedbackFormOpen || anyTaskRunning) ? 'not-allowed' : 'pointer' }}
                >
                  {isRefining ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LoadingSpinner className="w-4 h-4"/>
                      <span>正在细化...</span>
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V9L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 13H15M9 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>{t('refineExpression')}</span>
                    </span>
                  )}
                </button>

              </div>
            )}
          </>
      )}
    </div>
    <style>{`
      .refinement-html-content h1 {
        font-size: 24px;
        font-weight: 700;
        margin: 24px 0 12px 0;
        color: var(--text-primary);
      }
      
      .refinement-html-content h2 {
        font-size: 20px;
        font-weight: 700;
        margin: 20px 0 10px 0;
        color: var(--text-primary);
      }
      
      .refinement-html-content h3 {
        font-size: 17px;
        font-weight: 600;
        margin: 16px 0 8px 0;
        color: var(--text-primary);
      }
      
      .refinement-html-content p {
        margin: 10px 0;
        color: var(--text-primary);
        line-height: 1.6;
      }
      
      .refinement-html-content ul, .refinement-html-content ol {
        margin: 12px 0;
        padding-left: 24px;
        color: var(--text-primary);
      }
      
      .refinement-html-content li {
        margin: 6px 0;
        color: var(--text-primary);
        line-height: 1.6;
      }
      
      .refinement-html-content strong {
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .refinement-html-content em {
        font-style: italic;
        color: var(--text-primary);
      }
      
      .refinement-html-content u {
        text-decoration: underline;
        color: var(--text-primary);
      }
    `}</style>
    </>
  );
};

interface ResultsViewProps {
  inspirations: InspirationCase[];
  proposals: CreativeProposal[];
  onOptimize: (proposal: CreativeProposal, feedback: string) => Promise<void>;
  onExecute: (proposal: CreativeProposal) => Promise<void>;
  onPromoteAndExecute: (currentProposal: CreativeProposal, versionToPromote: Omit<CreativeProposal, 'history'|'isFinalized'|'executionDetails'>) => Promise<void>;
  onRefinementSave?: (proposal: CreativeProposal, refinement: RefinementExpression) => Promise<void>;
  creativeType?: string;
  contextBrief?: string;
  isProcessing: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ inspirations, proposals, onOptimize, onExecute, onPromoteAndExecute, onRefinementSave, creativeType = '创意', contextBrief = '', isProcessing }) => {
  const { t } = useLanguage();
  const [selectedInspirationIndex, setSelectedInspirationIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [openVersionMenuId, setOpenVersionMenuId] = useState<string | null>(null); // 子元素控制版本菜单
  const [anyFeedbackFormOpen, setAnyFeedbackFormOpen] = useState(false); // 追踪是否有任何反馈表单打开
  const [anyTaskRunning, setAnyTaskRunning] = useState(false); // 追踪是否有任何卡片在运行优化/细化任务
  
  // 全局编辑器状态
  const [globalEditor, setGlobalEditor] = useState<{isOpen: false} | {isOpen: true; proposal: CreativeProposal; refinement: RefinementExpression}>({
    isOpen: false
  });
  
  // 每页展示 3 个案例
  const itemsPerPage = 3;
  const totalPages = Math.ceil(inspirations.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const displayedInspirations = inspirations.slice(startIndex, startIndex + itemsPerPage);
  
  const selectedInspiration = selectedInspirationIndex !== null ? inspirations[selectedInspirationIndex] : null;
  
  const handlePrevPage = () => setCurrentPage(Math.max(0, currentPage - 1));
  const handleNextPage = () => setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
  
  return (
    <>
      {/* 全局富文本编辑器 */}
      {globalEditor.isOpen && (
        <RichTextEditor
          refinement={globalEditor.refinement}
          onClose={() => setGlobalEditor({ isOpen: false })}
          onSave={async (refinement) => {
            if (onRefinementSave) {
              await onRefinementSave(globalEditor.proposal, refinement);
            }
            // 注意：仅执行保存，不关闭编辑器
            // 编辑器仅有用户点击"完成编辑"才会关闭
          }}
          isProcessing={isProcessing}
        />
      )}
      
      {selectedInspiration && (
        <InspirationDetail
          case={selectedInspiration}
          onClose={() => setSelectedInspirationIndex(null)}
        />
      )}
      <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 灵感探索区 */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className="heading-gradient" style={{
              fontSize: '32px',
              marginBottom: '12px',
              letterSpacing: '-0.02em'
            }}>
              {t('globalInspirationExploration')}
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              {t('getInspiredFromExcellentCases')}
            </p>
          </div>
          
          {/* 案例卡片区域（支持分页） */}
          <div style={{ position: 'relative', marginBottom: '40px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '24px'
            }}>
              {displayedInspirations.map((item, idx) => {
                const actualIndex = startIndex + idx;
                return (
                  <button
                    key={actualIndex}
                    onClick={() => setSelectedInspirationIndex(actualIndex)}
                    className="card-glass animate-fade-in"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      animationDelay: `${idx * 0.1}s`,
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      border: 'none',
                      cursor: 'pointer',
                      background: 'inherit',
                      width: '100%',
                      textAlign: 'left'
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
                    <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {item.title}
                      </h3>
                      {item.relevanceScore !== undefined && (
                        <p style={{ fontSize: '12px', color: '#22C55E', marginBottom: '8px', fontWeight: '600' }}>
                          相关度: {item.relevanceScore}%
                        </p>
                      )}
                      <p style={{ fontSize: '13px', color: 'var(--brand-blue-light)', marginBottom: '8px', fontWeight: '500' }}>
                        ✨ 创意亮点
                      </p>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
                        {item.highlight}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--brand-blue)', fontWeight: '500' }}>点击查看详情 →</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* 左箭头按钮 */}
            {totalPages > 1 && (
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                style={{
                  position: 'absolute',
                  left: '-60px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: currentPage === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)',
                  color: currentPage === 0 ? 'rgba(59, 130, 246, 0.3)' : 'var(--brand-blue)',
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 0) {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = currentPage === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            
            {/* 右箭头按钮 */}
            {totalPages > 1 && (
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                style={{
                  position: 'absolute',
                  right: '-60px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: currentPage === totalPages - 1 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)',
                  color: currentPage === totalPages - 1 ? 'rgba(59, 130, 246, 0.3)' : 'var(--brand-blue)',
                  cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages - 1) {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = currentPage === totalPages - 1 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          
          {/* 分页指示器 */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
            }}>
              {Array.from({ length: totalPages }).map((_, pageIdx) => (
                <button
                  key={pageIdx}
                  onClick={() => setCurrentPage(pageIdx)}
                  style={{
                    width: pageIdx === currentPage ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: pageIdx === currentPage ? 'var(--brand-blue)' : 'rgba(59, 130, 246, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 创意方案区 */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className="heading-gradient" style={{
              fontSize: '32px',
              marginBottom: '12px',
              letterSpacing: '-0.02em'
            }}>
              {t('generatedCreativeProposals')}
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              {t('baseOnAIAnalysis')}
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
                onRefinementSave={onRefinementSave}
                creativeType={creativeType}
                contextBrief={contextBrief}
                isProcessing={isProcessing}
                t={t}
                openVersionMenuId={openVersionMenuId}
                setOpenVersionMenuId={setOpenVersionMenuId}
                anyFeedbackFormOpen={anyFeedbackFormOpen}
                setAnyFeedbackFormOpen={setAnyFeedbackFormOpen}
                anyTaskRunning={anyTaskRunning}
                setAnyTaskRunning={setAnyTaskRunning}
                onOpenEditor={(proposal, refinement) => setGlobalEditor({ isOpen: true, proposal, refinement })}
              />
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default ResultsView;
