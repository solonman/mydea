/**
 * 项目管理 Hook
 * 
 * 提供项目的 CRUD 操作和状态管理
 */

import { useState, useEffect, useCallback } from 'react';
import {
  createProject as createProjectService,
  getProjects as getProjectsService,
  updateProject as updateProjectService,
  archiveProject as archiveProjectService,
  deleteProject as deleteProjectService,
  type Project,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '../services/supabase';
import { handleError, logger, AppError } from '../utils/errors';

/**
 * useProjects Hook
 * 
 * @param userId 用户 ID
 * @param includeArchived 是否包含已归档的项目
 */
export function useProjects(userId: string | null, includeArchived: boolean = false) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 加载项目列表
  useEffect(() => {
    if (!userId) {
      setProjects([]);
      return;
    }

    let isMounted = true;

    async function loadProjects() {
      try {
        setLoading(true);
        setError(null);
        
        logger.info('Loading projects', { userId, includeArchived });
        const data = await getProjectsService(userId, includeArchived);
        
        if (isMounted) {
          setProjects(data);
          logger.info('Projects loaded', { count: data.length });
        }
      } catch (err) {
        const error = handleError(err);
        if (isMounted) {
          setError(error);
          logger.error('Failed to load projects', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, [userId, includeArchived, refreshKey]);

  // 创建项目
  const createProject = useCallback(async (input: Omit<CreateProjectInput, 'user_id'>) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      setLoading(true);
      setError(null);

      logger.info('Creating project', { name: input.name });
      const newProject = await createProjectService({
        ...input,
        user_id: userId,
      });

      // 添加到列表
      setProjects(prev => [newProject, ...prev]);
      logger.info('Project created', { projectId: newProject.id });

      return newProject;
    } catch (err) {
      const error = handleError(err);
      setError(error);
      logger.error('Failed to create project', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 更新项目
  const updateProject = useCallback(async (projectId: string, input: UpdateProjectInput) => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Updating project', { projectId });
      const updatedProject = await updateProjectService(projectId, input);

      // 更新列表中的项目
      setProjects(prev =>
        prev.map(p => (p.id === projectId ? updatedProject : p))
      );
      logger.info('Project updated', { projectId });

      return updatedProject;
    } catch (err) {
      const error = handleError(err);
      setError(error);
      logger.error('Failed to update project', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 归档项目
  const archiveProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Archiving project', { projectId });
      await archiveProjectService(projectId);

      // 如果不显示归档项目，则从列表中移除
      if (!includeArchived) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } else {
        // 否则更新状态
        setProjects(prev =>
          prev.map(p => (p.id === projectId ? { ...p, status: 'archived' as const } : p))
        );
      }

      logger.info('Project archived', { projectId });
    } catch (err) {
      const error = handleError(err);
      setError(error);
      logger.error('Failed to archive project', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  // 删除项目
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Deleting project', { projectId });
      await deleteProjectService(projectId);

      // 从列表中移除
      setProjects(prev => prev.filter(p => p.id !== projectId));
      logger.info('Project deleted', { projectId });
    } catch (err) {
      const error = handleError(err);
      setError(error);
      logger.error('Failed to delete project', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 刷新项目列表
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // 统计信息
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    archived: projects.filter(p => p.status === 'archived').length,
  };

  return {
    projects,
    loading,
    error,
    stats,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    refresh,
  };
}

/**
 * useSingleProject Hook
 * 
 * 用于获取单个项目的详情
 * 
 * @param projectId 项目 ID
 */
export function useSingleProject(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }

    let isMounted = true;

    async function loadProject() {
      try {
        setLoading(true);
        setError(null);

        logger.info('Loading project', { projectId });
        const { getProjectById } = await import('../services/supabase');
        const data = await getProjectById(projectId);

        if (isMounted) {
          setProject(data);
          logger.info('Project loaded', { projectId });
        }
      } catch (err) {
        const error = handleError(err);
        if (isMounted) {
          setError(error);
          logger.error('Failed to load project', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  return {
    project,
    loading,
    error,
  };
}
