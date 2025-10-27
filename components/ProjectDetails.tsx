import React from 'react';
import type { Project, BriefHistoryItem } from '../types';
import { useBriefs, useSingleProject } from '../hooks';
import type { User as SupabaseUser } from '../services/supabase';

interface ProjectDetailsProps {
    project: Project;
    supabaseUser?: SupabaseUser | null;
    onStartNewBrief: (projectId: string) => void;
    onViewBrief: (brief: BriefHistoryItem) => void;
    onDeleteBrief: (projectId: string, briefId: string) => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, supabaseUser, onStartNewBrief, onViewBrief, onDeleteBrief }) => {
    // Use Supabase project if available
    const {
        project: supabaseProject,
        loading: projectLoading,
        error: projectError,
    } = useSingleProject(supabaseUser ? project.id : null);

    // Use Supabase briefs if available
    const {
        briefs: supabaseBriefs,
        loading: briefsLoading,
        error: briefsError,
        deleteBrief: deleteSupabaseBrief,
    } = useBriefs(supabaseUser ? project.id : null);

    // Determine which project and briefs to use
    const displayProject = supabaseUser && supabaseProject ? supabaseProject : project;
    const briefs = supabaseUser ? supabaseBriefs : (project.briefs || []);
    const hasSupabase = !!supabaseUser;
    const isLoading = projectLoading || briefsLoading;

    const handleDelete = async (briefId: string) => {
        if (window.confirm("您确定要删除这个创意任务及其所有方案吗？此操作无法撤销。")) {
            try {
                if (hasSupabase) {
                    await deleteSupabaseBrief(briefId);
                }
                // Also delete from localStorage
                onDeleteBrief(project.id, briefId);
            } catch (error: any) {
                alert(error.userMessage || '删除任务失败，请重试');
            }
        }
    };

    // Show error if project or briefs failed to load
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
                        <p style={{ fontSize: '14px', color: '#FEE2E2', marginBottom: '20px' }}>
                            {error?.userMessage || error?.message || '未知错误'}
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
                        项目下的所有创意任务
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
                    + 开启新创意
                </button>
            </div>
            
            {/* 任务列表 */}
            <div>
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
                            加载任务中...
                        </p>
                    </div>
                ) : briefs && briefs.length > 0 ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {briefs.slice().reverse().map((brief, index) => (
                            <div 
                                key={brief.id} 
                                className="card-glass animate-fade-in" 
                                style={{ 
                                    padding: '20px',
                                    animationDelay: `${index * 0.05}s`,
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    justifyContent: 'space-between',
                                    gap: '16px'
                                }}
                            >
                                <div style={{ flex: '1 1 300px' }}>
                                    <p style={{
                                        fontWeight: '600',
                                        color: 'var(--brand-blue-light)',
                                        fontSize: '13px',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {brief.initialBrief.type}
                                    </p>
                                    <p style={{
                                        fontSize: '16px',
                                        color: 'var(--text-primary)',
                                        marginBottom: '8px',
                                        lineHeight: '1.5',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical'
                                    }}>
                                        {brief.initialBrief.text}
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        创建于: {new Date(brief.createdAt).toLocaleString('zh-CN')}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                    <button 
                                        onClick={() => onViewBrief(brief)} 
                                        className="btn-primary"
                                        style={{ padding: '10px 20px', fontSize: '14px' }}
                                    >
                                        查看
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(brief.id)} 
                                        className="btn-secondary"
                                        style={{
                                            padding: '10px 20px',
                                            fontSize: '14px',
                                            borderColor: 'rgba(239, 68, 68, 0.3)',
                                            color: '#FCA5A5'
                                        }}
                                    >
                                        删除
                                    </button>
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
                            {/* 空文件夹图标 */}
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 7C3 5.89543 3.89543 5 5 5H9L11 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V7Z" 
                                    stroke="#9CA3AF" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                                {/* 文件夹内部的虚线，表示空 */}
                                <path d="M8 13H16M8 16H13" 
                                    stroke="#9CA3AF" 
                                    strokeWidth="1.5" 
                                    strokeLinecap="round" 
                                    strokeDasharray="2 2"
                                    opacity="0.4"
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
                            还没有创意任务
                        </h3>
                        <p style={{ 
                            fontSize: '15px', 
                            color: 'var(--text-secondary)',
                            marginBottom: '24px',
                            lineHeight: '1.6'
                        }}>
                            点击右上角的 <span style={{ 
                                color: '#60A5FA',
                                fontWeight: '500',
                                padding: '2px 8px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '4px'
                            }}>“+ 开启新创意”</span> 按钮开始创作！
                        </p>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: 'rgba(59, 130, 246, 0.05)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: 'var(--text-tertiary)'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                                    stroke="#60A5FA" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    opacity="0.5"
                                />
                            </svg>
                            每个项目可以包含多个创意任务
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProjectDetails;