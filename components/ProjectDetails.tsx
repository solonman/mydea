import type { Project, BriefHistoryItem } from '../types';
import { useLanguage } from '../i18n/useLanguage';
import { useBriefs, useSingleProject } from '../hooks';
import type { User as SupabaseUser } from '../services/supabase';
import { groupAndSortBriefs, formatLastUpdated } from '../utils/taskGrouping';
import { useState } from 'react';

interface ProjectDetailsProps {
    project: Project;
    supabaseUser?: SupabaseUser | null;
    onStartNewBrief: (projectId: string) => void;
    onViewBrief: (brief: BriefHistoryItem) => void;
    onDeleteBrief: (projectId: string, briefId: string) => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, supabaseUser, onStartNewBrief, onViewBrief, onDeleteBrief }) => {
    const { t } = useLanguage();
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
    const [selectedBriefs, setSelectedBriefs] = useState<Set<string>>(new Set());
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    
    const {
        project: supabaseProject,
        loading: projectLoading,
        error: projectError,
    } = useSingleProject(supabaseUser ? project.id : null);

    const {
        briefs: supabaseBriefs,
        loading: briefsLoading,
        error: briefsError,
        deleteBrief: deleteSupabaseBrief,
    } = useBriefs(supabaseUser ? project.id : null);

    const displayProject = supabaseUser && supabaseProject ? supabaseProject : project;
    let briefs = supabaseUser ? supabaseBriefs : (project.briefs || []);
    const hasSupabase = !!supabaseUser;
    const isLoading = projectLoading || briefsLoading;

    // 应用类型筛选
    if (selectedTypes.size > 0) {
        briefs = briefs.filter(brief => selectedTypes.has(brief.initialBrief.type));
    }
    
    const allTypes = Array.from(new Set(briefs.map(b => b.initialBrief.type))).sort();
    const groupedBriefs = groupAndSortBriefs(briefs);

    const handleDelete = async (briefId: string) => {
        if (window.confirm("您确定要删除这个创意任务及其所有方案吗？此操作无法撤销。")) {
            try {
                // 先删除 localStorage 中的数据——这个不应该失败
                onDeleteBrief(project.id, briefId);
                
                // 您后删除 Supabase 中的数据（可选）
                if (hasSupabase) {
                    try {
                        await deleteSupabaseBrief(briefId);
                    } catch (supabaseError) {
                        // Supabase 删除失败不地唐，不裡告試用戶
                        console.warn('从 Supabase 删除任务失败，但本地删除成功:', supabaseError);
                    }
                }
            } catch (error: any) {
                // 本地删除失败是真正的错误，需要告試用户
                console.error('删除任务错误:', error);
                alert('删除任务失败，请重试');
            }
        }
    };
    
    const handleBatchDelete = async () => {
        if (selectedBriefs.size === 0) {
            alert('请先选择要删除的任务');
            return;
        }
        
        if (window.confirm(`确定要删除 ${selectedBriefs.size} 个任务吗？此操作无法撤销。`)) {
            try {
                // 先删除 localStorage
                for (const briefId of selectedBriefs) {
                    onDeleteBrief(project.id, briefId);
                }
                
                // 然后删除 Supabase（可选）
                if (hasSupabase) {
                    try {
                        for (const briefId of selectedBriefs) {
                            await deleteSupabaseBrief(briefId);
                        }
                    } catch (supabaseError) {
                        console.warn('从 Supabase 删除执会失败，但本地删除成功:', supabaseError);
                    }
                }
                
                setSelectedBriefs(new Set());
                setIsMultiSelectMode(false);
            } catch (error: any) {
                console.error('批量删除任务错误:', error);
                alert('删除任务失败，请重试');
            }
        }
    };
    
    const toggleTypeFilter = (type: string) => {
        const newTypes = new Set(selectedTypes);
        if (newTypes.has(type)) {
            newTypes.delete(type);
        } else {
            newTypes.add(type);
        }
        setSelectedTypes(newTypes);
    };
    
    const toggleSelectBrief = (briefId: string) => {
        const newSelected = new Set(selectedBriefs);
        if (newSelected.has(briefId)) {
            newSelected.delete(briefId);
        } else {
            newSelected.add(briefId);
        }
        setSelectedBriefs(newSelected);
    };
    
    // ... existing code ...
    
    const clearSelection = () => {
        setSelectedBriefs(new Set());
        setIsMultiSelectMode(false);
    };

    if (hasSupabase && (projectError || briefsError)) {
        const error = projectError || briefsError;
        return (
            <div className="w-full max-w-4xl mx-auto" style={{ padding: '0 20px' }}>
                <div className="card-glass" style={{ 
                    padding: '24px',
                    border: '1.5px solid rgba(239, 68, 68, 0.3)',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(185, 28, 28, 0.1) 100%)'
                }}>
                    <div className="text-center">
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            marginBottom: '16px'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <p style={{ fontWeight: '600', color: '#FCA5A5', fontSize: '16px', marginBottom: '8px' }}>
                            {projectError ? '加载项目失败' : '加载创意任务失败'}
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="btn-primary"
                            style={{
                                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            重试
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in" style={{ padding: '0 20px' }}>
            {isLoading && (
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-block',
                        width: '24px',
                        height: '24px',
                        border: '2px solid var(--border-default)',
                        borderTop: '2px solid var(--brand-blue)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{ marginLeft: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>加载中...</span>
                </div>
            )}

            {/* 标题区域 */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '32px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)',
                gap: '16px'
            }}>
                <div>
                    <h2 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                        letterSpacing: '-0.01em'
                    }}>
                        {displayProject.name}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {t('projectAllCreativeTasks')}
                    </p>
                    {hasSupabase && (
                        <span className="badge-success" style={{ marginTop: '8px' }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="6" cy="6" r="5" fill="currentColor"/>
                            </svg>
                            已连接 Supabase
                        </span>
                    )}
                </div>
                <button 
                    onClick={() => onStartNewBrief(project.id)}
                    className="btn-primary"
                    style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}
                >
                    + {t('startNewCreative')}
                </button>
            </div>
            
            {/* 筛选工具栏 */}
            {briefs.length > 0 && (
                <div style={{
                    marginBottom: '24px',
                    padding: '16px',
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    alignItems: 'center'
                }}>
                    {allTypes.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>按类型筛选：</span>
                            {allTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleTypeFilter(type)}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        borderRadius: '4px',
                                        border: selectedTypes.has(type) ? '1px solid var(--brand-blue)' : '1px solid rgba(59, 130, 246, 0.3)',
                                        background: selectedTypes.has(type) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                        color: selectedTypes.has(type) ? 'var(--brand-blue)' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div style={{ flex: 1 }} />
                    
                    {selectedBriefs.size > 0 && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                已选择 {selectedBriefs.size} 项
                            </span>
                            <button
                                onClick={handleBatchDelete}
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    borderRadius: '4px',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#FCA5A5',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                🗑️ 批量删除
                            </button>
                            <button
                                onClick={clearSelection}
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    borderRadius: '4px',
                                    background: 'transparent',
                                    border: '1px solid rgba(100, 116, 139, 0.3)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                取消选择
                            </button>
                        </div>
                    )}
                    
                    {isMultiSelectMode && selectedBriefs.size === 0 && briefs.length > 0 && (
                        <button
                            onClick={() => {
                                setIsMultiSelectMode(false);
                                setSelectedBriefs(new Set());
                            }}
                            style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                background: 'transparent',
                                border: '1px solid rgba(100, 116, 139, 0.3)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            ❌ 取消多选
                        </button>
                    )}
                    
                    {!isMultiSelectMode && selectedBriefs.size === 0 && briefs.length > 0 && (
                        <button
                            onClick={() => {
                                setIsMultiSelectMode(true);
                            }}
                            style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                background: 'transparent',
                                border: '1px solid rgba(100, 116, 139, 0.3)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            ⚙️ 任务管理
                        </button>
                    )}
                </div>
            )}
            
            {/* 任务列表 */}
            {isLoading && !briefs.length ? (
                <div className="text-center" style={{ padding: '60px 0' }}>
                    <div style={{
                        display: 'inline-block',
                        width: '40px',
                        height: '40px',
                        border: '3px solid var(--border-default)',
                        borderTop: '3px solid var(--brand-blue)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontSize: '14px' }}>
                        {t('loadingTasks')}
                    </p>
                </div>
            ) : briefs && briefs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {groupedBriefs.map((group) => (
                        <div key={group.label}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--text-secondary)',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                                borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                {group.label}
                            </div>
                            
                            <div style={{ display: 'grid', gap: '0px' }}>
                                {group.briefs.map((brief, index) => (
                            <div
                                key={brief.id}
                                style={{
                                    padding: '16px 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
                                    background: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {/* 只在多选模式下显示复选框 */}
                                {isMultiSelectMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedBriefs.has(brief.id)}
                                        onChange={() => toggleSelectBrief(brief.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            cursor: 'pointer',
                                            width: '16px',
                                            height: '16px',
                                            flexShrink: 0
                                        }}
                                    />
                                )}
                                
                                <div
                                    onClick={() => onViewBrief(brief)}
                                    style={{
                                        flex: 1,
                                        minWidth: 0
                                    }}
                                >
                                    {/* 主体：任务名称 */}
                                    <div style={{
                                        fontSize: '15px',
                                        color: 'var(--text-primary)',
                                        fontWeight: '500',
                                        marginBottom: '6px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {brief.initialBrief.text}
                                    </div>
                                    {/* 辅助信息：类型和时间 */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center',
                                        fontSize: '10px',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <span style={{
                                            fontSize: '9px',
                                            fontWeight: '600',
                                            color: 'var(--brand-blue)',
                                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0
                                        }}>
                                            {brief.initialBrief.type}
                                        </span>
                                        <span>
                                            {formatLastUpdated(brief.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* ... existing code ... */}
                            </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card-glass text-center" style={{ 
                    padding: '60px 24px',
                    border: '1.5px dashed var(--border-default)'
                }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(75, 85, 99, 0.05) 100%)',
                        marginBottom: '20px'
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 7C3 5.89543 3.89543 5 5 5H9L11 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V7Z" 
                                stroke="#9CA3AF" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <h3 style={{ 
                        fontSize: '20px', 
                        fontWeight: '600', 
                        color: 'var(--text-primary)', 
                        marginBottom: '12px',
                        letterSpacing: '-0.01em'
                    }}>
                        {t('noCreativeTasks')}
                    </h3>
                    <p style={{ 
                        fontSize: '15px', 
                        color: 'var(--text-secondary)',
                        marginBottom: '24px',
                        lineHeight: '1.6'
                    }}>
                        {t('clickButtonToStartCreative')}
                    </p>
                </div>
            )}
        </div>
    )
}

export default ProjectDetails;
