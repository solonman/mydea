import React, { useState } from 'react';
import type { User, Project } from '../types';
import { useLanguage } from '../i18n/useLanguage';
import { useProjects } from '../hooks';
import type { User as SupabaseUser } from '../services/supabase';

interface ProjectDashboardProps {
  user: User;
  supabaseUser?: SupabaseUser | null;
  onCreateProject: (projectName: string) => void;
  onViewProject: (projectId: string) => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ user, supabaseUser, onCreateProject, onViewProject }) => {
  const { t } = useLanguage();
  const [newProjectName, setNewProjectName] = useState('');

  // Use Supabase projects if available
  const {
    projects: supabaseProjects,
    loading: projectsLoading,
    error: projectsError,
    stats,
    createProject: createSupabaseProject,
    archiveProject,
    deleteProject,
  } = useProjects(supabaseUser?.id || null);

  // Determine which projects to use
  const projects = supabaseUser ? supabaseProjects : user.projects;
  const hasSupabase = !!supabaseUser;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      try {
        if (hasSupabase) {
          // Create in Supabase
          await createSupabaseProject({
            name: newProjectName.trim(),
          });
        }
        // Also create in localStorage for compatibility
        onCreateProject(newProjectName.trim());
        setNewProjectName('');
      } catch (error: any) {
        alert(error.userMessage || '创建项目失败，请重试');
      }
    }
  };
  
  const handleArchiveProject = async (projectId: string, projectName: string) => {
    if (confirm(`确定要归档项目“${projectName}”吗？`)) {
      try {
        if (hasSupabase) {
          await archiveProject(projectId);
        }
        // TODO: Also archive in localStorage
      } catch (error: any) {
        alert(error.userMessage || '归档项目失败，请重试');
      }
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`确定要删除项目“${projectName}”吗？此操作不可恢复！`)) {
      try {
        if (hasSupabase) {
          await deleteProject(projectId);
        }
        // TODO: Also delete in localStorage
      } catch (error: any) {
        alert(error.userMessage || '删除项目失败，请重试');
      }
    }
  };

  // Show error if projects failed to load
  if (hasSupabase && projectsError) {
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
              加载项目失败
            </p>
            <p style={{ fontSize: '14px', color: '#FEE2E2', marginBottom: '20px' }}>
              {projectsError.userMessage || projectsError.message || '未知错误'}
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
      {/* 标题区域 */}
      <div className="text-center" style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '8px',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em'
        }}>
          {t('helloUser', { username: user.username })}! 👋
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '8px' }}>
          {t('manageYourCreativeProjects')}
        </p>
        {hasSupabase && (
          <span className="badge-success">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="6" r="5" fill="currentColor"/>
            </svg>
            {t('connectedSupabase')} • {t('activeProjects', { count: stats.active })}
          </span>
        )}
      </div>
      
      {/* 新建项目表单 */}
      <div className="card-glass animate-fade-in animate-delay-100" style={{ padding: '24px', marginBottom: '40px' }}>
        <form onSubmit={handleCreateProject}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder={t('inputNewProjectName')}
              className="input-modern"
              style={{ flex: '1 1 300px', minWidth: '200px' }}
              aria-label="New project name"
            />
            <button
              type="submit"
              disabled={!newProjectName.trim() || projectsLoading}
              className="btn-primary"
              style={{ padding: '12px 32px', whiteSpace: 'nowrap' }}
            >
              {projectsLoading ? t('creating') : t('createNewProject')}
            </button>
          </div>
        </form>
      </div>

      {/* 项目列表 */}
      <div className="animate-fade-in animate-delay-200">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {t('myProjects')}
          </h3>
          {projectsLoading && (
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              {t('loading')}
            </span>
          )}
        </div>

        {projectsLoading ? (
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
              {t('loadingProjects')}
            </p>
          </div>
        ) : projects && projects.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {projects.map((project, index) => (
              <div 
                key={project.id} 
                className="card-glass animate-fade-in"
                style={{ 
                  padding: '20px',
                  animationDelay: `${0.3 + index * 0.05}s`,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      {project.name}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {hasSupabase ? (
                        <span>{project.status === 'active' ? t('active') : t('archived')}</span>
                      ) : (
                        <span>{project.briefs?.length || 0} {t('creativeTasks')}</span>
                      )}
                    </p>
                    {hasSupabase && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {t('createdAt')}: {new Date(project.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <button 
                      onClick={() => onViewProject(project.id)}
                      className="btn-primary"
                      style={{ padding: '10px 20px', fontSize: '14px' }}
                    >
                      {t('viewDetails')}
                    </button>
                    {hasSupabase && project.status === 'active' && (
                      <button 
                        onClick={() => handleArchiveProject(project.id, project.name)}
                        className="btn-secondary"
                        style={{ padding: '10px 16px', fontSize: '14px' }}
                        title="归档项目"
                      >
                        {t('archive')}
                      </button>
                    )}
                    {hasSupabase && (
                      <button 
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        className="btn-secondary"
                        style={{ 
                          padding: '10px 16px',
                          fontSize: '14px',
                          borderColor: 'rgba(239, 68, 68, 0.3)',
                          color: '#FCA5A5'
                        }}
                        title="删除项目"
                      >
                        {t('delete')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-glass text-center" style={{ padding: '60px 24px', border: '1.5px dashed var(--border-default)' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'rgba(59, 130, 246, 0.1)',
              marginBottom: '16px'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12H15M12 9V15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {t('noProjects')}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
              {t('createNewProjectToStart')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;
