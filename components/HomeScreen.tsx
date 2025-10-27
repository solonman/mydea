
import React, { useState, useEffect } from 'react';
import type { User, Brief, Project } from '../types';
import CreativeBriefInput from './CreativeBriefInput';
import { useProjects } from '../hooks';
import type { User as SupabaseUser } from '../services/supabase';

interface HomeScreenProps {
  user: User;
  supabaseUser?: SupabaseUser | null;
  onCreateProject: (projectName: string) => Project;
  onBriefSubmit: (brief: Brief, projectId: string) => void;
  isLoading: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, supabaseUser, onCreateProject, onBriefSubmit, isLoading }) => {
  // Use Supabase projects if available, otherwise fall back to localStorage
  const {
    projects: supabaseProjects,
    loading: projectsLoading,
    error: projectsError,
    createProject: createSupabaseProject,
  } = useProjects(supabaseUser?.id || null);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Determine which projects to use
  const projects = supabaseUser ? supabaseProjects : user.projects;
  const hasSupabase = !!supabaseUser;

  // Set default project on load
  useEffect(() => {
    if (projects && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
      setShowNewProjectInput(false);
    } else {
      setSelectedProjectId('new');
      setShowNewProjectInput(true); // Show input by default if no projects exist
    }
  }, [projects]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedProjectId(value);
    if (value === 'new') {
      setShowNewProjectInput(true);
    } else {
      setShowNewProjectInput(false);
    }
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      try {
        let newProject: Project;
        
        if (hasSupabase) {
          // Create in Supabase
          const sbProject = await createSupabaseProject({
            name: newProjectName.trim(),
          });
          // Also create in localStorage for compatibility
          newProject = onCreateProject(newProjectName.trim());
          // Use Supabase project ID
          setSelectedProjectId(sbProject.id);
        } else {
          // Create in localStorage only
          newProject = onCreateProject(newProjectName.trim());
          setSelectedProjectId(newProject.id);
        }
        
        setNewProjectName('');
        setShowNewProjectInput(false);
      } catch (error: any) {
        alert(error.userMessage || '创建项目失败，请重试');
      }
    }
  };

  const handleSubmitBrief = async (brief: Brief) => {
    let projectIdToSubmit = selectedProjectId;

    // Handle case where 'new' is selected and name is typed
    if (selectedProjectId === 'new') {
       if (!newProjectName.trim()) {
           alert("请为您的新项目命名。");
           return;
       }
       
       try {
         if (hasSupabase) {
           const sbProject = await createSupabaseProject({
             name: newProjectName.trim(),
           });
           const newProject = onCreateProject(newProjectName.trim());
           setSelectedProjectId(sbProject.id);
           setNewProjectName('');
           setShowNewProjectInput(false);
           projectIdToSubmit = sbProject.id;
         } else {
           const newProject = onCreateProject(newProjectName.trim());
           setSelectedProjectId(newProject.id);
           setNewProjectName('');
           setShowNewProjectInput(false);
           projectIdToSubmit = newProject.id;
         }
       } catch (error: any) {
         alert(error.userMessage || '创建项目失败，请重试');
         return;
       }
    }
    
    if (projectIdToSubmit && projectIdToSubmit !== 'new') {
        onBriefSubmit(brief, projectIdToSubmit);
    }
  };
  
  // Show error if projects failed to load
  if (hasSupabase && projectsError) {
    return (
      <div className="w-full max-w-3xl mx-auto" style={{ padding: '0 20px' }}>
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
            <p style={{ 
              fontWeight: '600',
              color: '#FCA5A5',
              fontSize: '16px',
              marginBottom: '8px'
            }}>
              加载项目失败
            </p>
            <p style={{ 
              fontSize: '14px',
              color: '#FEE2E2',
              marginBottom: '20px'
            }}>
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M8 2V6M8 2L6 4M8 2L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                重试
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in" style={{ padding: '0 20px' }}>
      {/* 欢迎区域 */}
      <div className="text-center" style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em'
        }}>
          你好, {user.username}! 👋
        </h2>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '15px',
          margin: 0
        }}>
          准备好激发下一个绝妙创意了吗？
        </p>
        {hasSupabase && (
          <div style={{ marginTop: '12px' }}>
            <span className="badge-success">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6" cy="6" r="5" fill="currentColor"/>
              </svg>
              已连接 Supabase
            </span>
          </div>
        )}
      </div>

      {/* 项目选择器 */}
      <div className="card-glass animate-fade-in animate-delay-100" style={{ padding: '20px', marginBottom: '24px' }}>
        <label 
          htmlFor="project-select" 
          style={{
            display: 'block',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: '500',
            marginBottom: '12px',
            letterSpacing: '0.01em'
          }}
        >
          归属项目
        </label>
        <select
          id="project-select"
          value={selectedProjectId}
          onChange={handleProjectChange}
          disabled={projectsLoading}
          className="input-modern"
          style={{
            cursor: projectsLoading ? 'not-allowed' : 'pointer',
            paddingRight: '40px',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 16px center'
          }}
        >
          {projectsLoading ? (
            <option>加载中...</option>
          ) : (
            <>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="new">+ 新建项目</option>
            </>
          )}
        </select>
      </div>

      {/* 新建项目输入 */}
      {showNewProjectInput && (
        <div className="card-glass animate-fade-in" style={{ padding: '20px', marginBottom: '24px' }}>
          <label 
            style={{
              display: 'block',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '12px'
            }}
          >
            新项目名称
          </label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="输入新项目名称..."
              className="input-modern"
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              disabled={projectsLoading}
            />
            {selectedProjectId === 'new' && (
              <button 
                onClick={handleCreateProject}
                disabled={projectsLoading || !newProjectName.trim()}
                className="btn-primary"
                style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}
              >
                {projectsLoading ? '创建中...' : '创建'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 创意输入区域 */}
      <div className="animate-fade-in animate-delay-200">
        <CreativeBriefInput onSubmit={handleSubmitBrief} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default HomeScreen;
