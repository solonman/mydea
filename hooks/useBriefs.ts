/**
 * 创意任务管理 Hook
 * 
 * 提供创意任务的 CRUD 操作和状态管理
 */

import { useState, useEffect, useCallback } from 'react';
import {
  createBrief as createBriefService,
  getBriefs as getBriefsService,
  updateBrief as updateBriefService,
  updateBriefProposals as updateBriefProposalsService,
  archiveBrief as archiveBriefService,
  deleteBrief as deleteBriefService,
  type CreateBriefInput,
  type UpdateBriefInput,
} from '../services/supabase';
import type { BriefHistoryItem, CreativeProposal } from '../types';
import { handleError, logger, AppError } from '../utils/errors';

/**
 * useBriefs Hook
 * 
 * @param projectId 项目 ID
 * @param includeArchived 是否包含已归档的任务
 */
export function useBriefs(projectId: string | null, includeArchived: boolean = false) {
  const [briefs, setBriefs] = useState<BriefHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 加载创意任务列表
  useEffect(() => {
    if (!projectId) {
      setBriefs([]);
      return;
    }

    let isMounted = true;

    async function loadBriefs() {
      try {
        setLoading(true);
        setError(null);

        logger.info('Loading briefs', { projectId, includeArchived });
        const data = await getBriefsService(projectId, includeArchived);

        if (isMounted) {
          setBriefs(data);
          logger.info('Briefs loaded', { count: data.length });
        }
      } catch (err) {
        const error = handleError(err);
        if (isMounted) {
          setError(error);
          logger.error('Failed to load briefs', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBriefs();

    return () => {
      isMounted = false;
    };
  }, [projectId, includeArchived, refreshKey]);

  // 创建创意任务
  const createBrief = useCallback(async (input: Omit<CreateBriefInput, 'project_id'>) => {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    try {
      setLoading(true);
      setError(null);

      logger.info('Creating brief', { projectId, briefType: input.initial_brief.type });
      const newBrief = await createBriefService({
        ...input,
        project_id: projectId,
      });

      // 添加到列表
      setBriefs(prev => [newBrief, ...prev]);
      logger.info('Brief created', { briefId: newBrief.id });

      return newBrief;
    } catch (err) {
      const error = handleError(err);
      setError(error);
      logger.error('Failed to create brief', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // 更新创意任务
  const updateBrief = useCallback(async (briefId: string, input: UpdateBriefInput) => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Updating brief', { briefId });
      const updatedBrief = await updateBriefService(briefId, input);

      // 更新列表中的任务
      setBriefs(prev =>
        prev.map(b => (b.id === briefId ? updatedBrief : b))
      );
      logger.info('Brief updated', { briefId });

      return updatedBrief;
    } catch (err) {
      const error = handleError(err);
      setError(error);
      logger.error('Failed to update brief', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新创意方案
  const updateProposals = useCallback(async (briefId: string, proposals: CreativeProposal[]) => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Updating brief proposals', { briefId, proposalCount: proposals.length });
      const updatedBrief = await updateBriefProposalsService(briefId, proposals);

      // 更新列表中的任务
      setBriefs(prev =>
        prev.map(b => (b.id === briefId ? updatedBrief : b))
      );
      logger.info('Brief proposals updated', { briefId });

      return updatedBrief;
    } catch (err) {
      const error = handleError(err);
      setError(error);
      logger.error('Failed to update brief proposals', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 归档创意任务
  const archiveBrief = useCallback(async (briefId: string) => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Archiving brief', { briefId });
      await archiveBriefService(briefId);

      // 如果不显示归档任务，则从列表中移除
      if (!includeArchived) {
        setBriefs(prev => prev.filter(b => b.id !== briefId));
      }

      logger.info('Brief archived', { briefId });
    } catch (err) {
      const error = handleError(err);
      setError(error);
      logger.error('Failed to archive brief', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  // 删除创意任务
  const deleteBrief = useCallback(async (briefId: string) => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Deleting brief', { briefId });
      await deleteBriefService(briefId);

      // 从列表中移除
      setBriefs(prev => prev.filter(b => b.id !== briefId));
      logger.info('Brief deleted', { briefId });
    } catch (err) {
      const error = handleError(err);
      setError(error);
      logger.error('Failed to delete brief', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 刷新任务列表
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return {
    briefs,
    loading,
    error,
    createBrief,
    updateBrief,
    updateProposals,
    archiveBrief,
    deleteBrief,
    refresh,
  };
}

/**
 * useSingleBrief Hook
 * 
 * 用于获取单个创意任务的详情
 * 
 * @param briefId 任务 ID
 */
export function useSingleBrief(briefId: string | null) {
  const [brief, setBrief] = useState<BriefHistoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (!briefId) {
      setBrief(null);
      return;
    }

    let isMounted = true;

    async function loadBrief() {
      try {
        setLoading(true);
        setError(null);

        logger.info('Loading brief', { briefId });
        const { getBriefById } = await import('../services/supabase');
        const data = await getBriefById(briefId);

        if (isMounted) {
          setBrief(data);
          logger.info('Brief loaded', { briefId });
        }
      } catch (err) {
        const error = handleError(err);
        if (isMounted) {
          setError(error);
          logger.error('Failed to load brief', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBrief();

    return () => {
      isMounted = false;
    };
  }, [briefId]);

  // 更新当前任务的方案
  const updateProposals = useCallback(async (proposals: CreativeProposal[]) => {
    if (!briefId) {
      throw new Error('Brief ID is required');
    }

    try {
      setLoading(true);
      setError(null);

      logger.info('Updating current brief proposals', { briefId, proposalCount: proposals.length });
      const updatedBrief = await updateBriefProposalsService(briefId, proposals);

      setBrief(updatedBrief);
      logger.info('Current brief proposals updated', { briefId });

      return updatedBrief;
    } catch (err) {
      const error = handleError(err);
      setError(error);
      logger.error('Failed to update current brief proposals', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [briefId]);

  return {
    brief,
    loading,
    error,
    updateProposals,
  };
}
