/**
 * 创意任务服务
 * 
 * 提供创意任务相关的数据库操作
 */

import { supabase } from './client';
import { handleError, logger, AppError, ErrorCodes } from '../../utils/errors';
import { withTimeoutAndRetry } from '../../utils/retry';
import type { 
  BriefHistoryItem, 
  Brief, 
  InspirationCase, 
  CreativeProposal 
} from '../../types';

/**
 * 任务状态
 */
export type BriefStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

/**
 * 创意任务数据类型（数据库格式）
 */
export interface DbBrief {
  id: string;
  project_id: string;
  initial_brief: any; // JSONB
  refined_brief_text: string | null;
  inspirations: any | null; // JSONB
  proposals: any | null; // JSONB
  status: BriefStatus;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * 创建任务输入类型
 */
export interface CreateBriefInput {
  project_id: string;
  initial_brief: Brief;
  refined_brief_text?: string;
  inspirations?: InspirationCase[];
  proposals?: CreativeProposal[];
  status?: BriefStatus;
  tags?: string[];
}

/**
 * 更新任务输入类型
 */
export interface UpdateBriefInput {
  refined_brief_text?: string;
  inspirations?: InspirationCase[];
  proposals?: CreativeProposal[];
  status?: BriefStatus;
  tags?: string[];
}

/**
 * 将数据库格式转换为应用格式
 */
function dbBriefToBriefHistoryItem(dbBrief: DbBrief): BriefHistoryItem {
  return {
    id: dbBrief.id,
    createdAt: dbBrief.created_at,
    initialBrief: dbBrief.initial_brief as Brief,
    refinedBriefText: dbBrief.refined_brief_text || '',
    inspirations: (dbBrief.inspirations as InspirationCase[]) || [],
    proposals: (dbBrief.proposals as CreativeProposal[]) || [],
  };
}

/**
 * 创建新的创意任务
 * 
 * @param input 任务信息
 * @returns 创建的任务对象
 */
export async function createBrief(input: CreateBriefInput): Promise<BriefHistoryItem> {
  try {
    // 验证输入
    if (!input.project_id || input.project_id.trim().length === 0) {
      throw new AppError(
        'Project ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '项目 ID 不能为空',
        false
      );
    }

    if (!input.initial_brief || !input.initial_brief.text) {
      throw new AppError(
        'Initial brief is required',
        ErrorCodes.VALIDATION_ERROR,
        '初始需求不能为空',
        false
      );
    }

    logger.info('Creating brief', { 
      projectId: input.project_id, 
      briefType: input.initial_brief.type 
    });

    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('briefs')
          .insert({
            project_id: input.project_id,
            initial_brief: input.initial_brief,
            refined_brief_text: input.refined_brief_text || null,
            inspirations: input.inspirations || null,
            proposals: input.proposals || null,
            status: input.status || 'draft',
            tags: input.tags || null,
          })
          .select()
          .single();

        if (error) throw error;
        return data as DbBrief;
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
      }
    );

    logger.info('Brief created successfully', { briefId: result.id });
    return dbBriefToBriefHistoryItem(result);

  } catch (error) {
    logger.error('Failed to create brief', error as Error);
    throw handleError(error);
  }
}

/**
 * 获取项目的所有创意任务
 * 
 * @param projectId 项目 ID
 * @param includeArchived 是否包含已归档的任务（默认否）
 * @returns 任务列表
 */
export async function getBriefs(
  projectId: string,
  includeArchived: boolean = false
): Promise<BriefHistoryItem[]> {
  try {
    if (!projectId || projectId.trim().length === 0) {
      throw new AppError(
        'Project ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '项目 ID 不能为空',
        false
      );
    }

    logger.info('Getting briefs', { projectId, includeArchived });

    const result = await withTimeoutAndRetry(
      async () => {
        let query = supabase
          .from('briefs')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (!includeArchived) {
          query = query.neq('status', 'archived');
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as DbBrief[];
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
      }
    );

    const briefs = result.map(dbBriefToBriefHistoryItem);
    logger.info('Briefs retrieved successfully', { count: briefs.length });
    return briefs;

  } catch (error) {
    logger.error('Failed to get briefs', error as Error);
    throw handleError(error);
  }
}

/**
 * 根据 ID 获取创意任务
 * 
 * @param briefId 任务 ID
 * @returns 任务对象，如果不存在返回 null
 */
export async function getBriefById(briefId: string): Promise<BriefHistoryItem | null> {
  try {
    if (!briefId || briefId.trim().length === 0) {
      throw new AppError(
        'Brief ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '任务 ID 不能为空',
        false
      );
    }

    logger.info('Getting brief by ID', { briefId });

    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('briefs')
          .select('*')
          .eq('id', briefId)
          .maybeSingle();

        if (error) throw error;
        return data as DbBrief | null;
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
      }
    );

    if (result) {
      logger.info('Brief found', { briefId: result.id });
      return dbBriefToBriefHistoryItem(result);
    } else {
      logger.info('Brief not found', { briefId });
      return null;
    }

  } catch (error) {
    logger.error('Failed to get brief by ID', error as Error);
    throw handleError(error);
  }
}

/**
 * 更新创意任务
 * 
 * @param briefId 任务 ID
 * @param input 要更新的字段
 * @returns 更新后的任务对象
 */
export async function updateBrief(
  briefId: string,
  input: UpdateBriefInput
): Promise<BriefHistoryItem> {
  try {
    if (!briefId || briefId.trim().length === 0) {
      throw new AppError(
        'Brief ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '任务 ID 不能为空',
        false
      );
    }

    logger.info('Updating brief', { briefId, fields: Object.keys(input) });

    const updateData: any = {};
    if (input.refined_brief_text !== undefined) {
      updateData.refined_brief_text = input.refined_brief_text;
    }
    if (input.inspirations !== undefined) {
      updateData.inspirations = input.inspirations;
    }
    if (input.proposals !== undefined) {
      updateData.proposals = input.proposals;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.tags !== undefined) {
      updateData.tags = input.tags;
    }

    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('briefs')
          .update(updateData)
          .eq('id', briefId)
          .select()
          .single();

        if (error) throw error;
        return data as DbBrief;
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
      }
    );

    logger.info('Brief updated successfully', { briefId: result.id });
    return dbBriefToBriefHistoryItem(result);

  } catch (error) {
    logger.error('Failed to update brief', error as Error);
    throw handleError(error);
  }
}

/**
 * 更新创意方案列表
 * 
 * 这是一个便捷方法，专门用于更新方案
 * 
 * @param briefId 任务 ID
 * @param proposals 新的方案列表
 * @returns 更新后的任务对象
 */
export async function updateBriefProposals(
  briefId: string,
  proposals: CreativeProposal[]
): Promise<BriefHistoryItem> {
  try {
    logger.info('Updating brief proposals', { briefId, proposalCount: proposals.length });
    return await updateBrief(briefId, { proposals });
  } catch (error) {
    logger.error('Failed to update brief proposals', error as Error);
    throw handleError(error);
  }
}

/**
 * 归档创意任务
 * 
 * @param briefId 任务 ID
 * @returns 更新后的任务对象
 */
export async function archiveBrief(briefId: string): Promise<BriefHistoryItem> {
  try {
    logger.info('Archiving brief', { briefId });
    return await updateBrief(briefId, { status: 'archived' });
  } catch (error) {
    logger.error('Failed to archive brief', error as Error);
    throw handleError(error);
  }
}

/**
 * 删除创意任务
 * 
 * 注意：这会永久删除任务
 * 
 * @param briefId 任务 ID
 */
export async function deleteBrief(briefId: string): Promise<void> {
  try {
    if (!briefId || briefId.trim().length === 0) {
      throw new AppError(
        'Brief ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '任务 ID 不能为空',
        false
      );
    }

    logger.warn('Deleting brief', { briefId });

    await withTimeoutAndRetry(
      async () => {
        const { error } = await supabase
          .from('briefs')
          .delete()
          .eq('id', briefId);

        if (error) throw error;
      },
      {
        timeoutMs: 10000,
        maxRetries: 2,
      }
    );

    logger.info('Brief deleted successfully', { briefId });

  } catch (error) {
    logger.error('Failed to delete brief', error as Error);
    throw handleError(error);
  }
}

/**
 * 获取项目的任务统计
 * 
 * @param projectId 项目 ID
 * @returns 统计信息
 */
export async function getBriefStats(projectId: string): Promise<{
  total: number;
  draft: number;
  in_progress: number;
  completed: number;
  archived: number;
}> {
  try {
    if (!projectId || projectId.trim().length === 0) {
      throw new AppError(
        'Project ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '项目 ID 不能为空',
        false
      );
    }

    logger.info('Getting brief stats', { projectId });

    const briefs = await getBriefs(projectId, true);

    const stats = {
      total: briefs.length,
      draft: 0,
      in_progress: 0,
      completed: 0,
      archived: 0,
    };

    // 由于我们转换后丢失了 status，需要重新查询
    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('briefs')
          .select('status')
          .eq('project_id', projectId);

        if (error) throw error;
        return data as { status: BriefStatus }[];
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
      }
    );

    result.forEach(brief => {
      stats[brief.status]++;
    });

    logger.info('Brief stats retrieved', { projectId, stats });
    return stats;

  } catch (error) {
    logger.error('Failed to get brief stats', error as Error);
    throw handleError(error);
  }
}
