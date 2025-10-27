/**
 * 项目服务
 * 
 * 提供项目相关的数据库操作
 */

import { supabase } from './client';
import { handleError, logger, AppError, ErrorCodes } from '../../utils/errors';
import { withTimeoutAndRetry } from '../../utils/retry';

/**
 * 项目状态
 */
export type ProjectStatus = 'active' | 'archived' | 'deleted';

/**
 * 项目数据类型
 */
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

/**
 * 创建项目输入类型
 */
export interface CreateProjectInput {
  user_id: string;
  name: string;
  description?: string;
}

/**
 * 更新项目输入类型
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

/**
 * 创建新项目
 * 
 * @param input 项目信息
 * @returns 创建的项目对象
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  try {
    // 验证输入
    if (!input.user_id || input.user_id.trim().length === 0) {
      throw new AppError(
        'User ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '用户 ID 不能为空',
        false
      );
    }

    if (!input.name || input.name.trim().length === 0) {
      throw new AppError(
        'Project name is required',
        ErrorCodes.VALIDATION_ERROR,
        '项目名称不能为空',
        false
      );
    }

    if (input.name.length > 200) {
      throw new AppError(
        'Project name too long',
        ErrorCodes.VALIDATION_ERROR,
        '项目名称不能超过 200 个字符',
        false
      );
    }

    logger.info('Creating project', { userId: input.user_id, name: input.name });

    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: input.user_id,
            name: input.name.trim(),
            description: input.description?.trim() || null,
            status: 'active',
          })
          .select()
          .single();

        if (error) throw error;
        return data as Project;
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
      }
    );

    logger.info('Project created successfully', { projectId: result.id, name: result.name });
    return result;

  } catch (error) {
    logger.error('Failed to create project', error as Error);
    throw handleError(error);
  }
}

/**
 * 获取用户的所有项目
 * 
 * @param userId 用户 ID
 * @param includeArchived 是否包含已归档的项目（默认否）
 * @returns 项目列表
 */
export async function getProjects(
  userId: string,
  includeArchived: boolean = false
): Promise<Project[]> {
  try {
    if (!userId || userId.trim().length === 0) {
      throw new AppError(
        'User ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '用户 ID 不能为空',
        false
      );
    }

    logger.info('Getting projects', { userId, includeArchived });

    const result = await withTimeoutAndRetry(
      async () => {
        let query = supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .neq('status', 'deleted')
          .order('created_at', { ascending: false });

        if (!includeArchived) {
          query = query.eq('status', 'active');
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as Project[];
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
      }
    );

    logger.info('Projects retrieved successfully', { count: result.length });
    return result;

  } catch (error) {
    logger.error('Failed to get projects', error as Error);
    throw handleError(error);
  }
}

/**
 * 根据 ID 获取项目
 * 
 * @param projectId 项目 ID
 * @returns 项目对象，如果不存在返回 null
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    if (!projectId || projectId.trim().length === 0) {
      throw new AppError(
        'Project ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '项目 ID 不能为空',
        false
      );
    }

    logger.info('Getting project by ID', { projectId });

    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();

        if (error) throw error;
        return data as Project | null;
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
      }
    );

    if (result) {
      logger.info('Project found', { projectId: result.id, name: result.name });
    } else {
      logger.info('Project not found', { projectId });
    }

    return result;

  } catch (error) {
    logger.error('Failed to get project by ID', error as Error);
    throw handleError(error);
  }
}

/**
 * 更新项目信息
 * 
 * @param projectId 项目 ID
 * @param input 要更新的字段
 * @returns 更新后的项目对象
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<Project> {
  try {
    if (!projectId || projectId.trim().length === 0) {
      throw new AppError(
        'Project ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '项目 ID 不能为空',
        false
      );
    }

    if (input.name !== undefined && input.name.length > 200) {
      throw new AppError(
        'Project name too long',
        ErrorCodes.VALIDATION_ERROR,
        '项目名称不能超过 200 个字符',
        false
      );
    }

    logger.info('Updating project', { projectId, fields: Object.keys(input) });

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.description !== undefined) updateData.description = input.description?.trim() || null;
    if (input.status !== undefined) updateData.status = input.status;

    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', projectId)
          .select()
          .single();

        if (error) throw error;
        return data as Project;
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
      }
    );

    logger.info('Project updated successfully', { projectId: result.id });
    return result;

  } catch (error) {
    logger.error('Failed to update project', error as Error);
    throw handleError(error);
  }
}

/**
 * 归档项目
 * 
 * @param projectId 项目 ID
 * @returns 更新后的项目对象
 */
export async function archiveProject(projectId: string): Promise<Project> {
  try {
    logger.info('Archiving project', { projectId });
    return await updateProject(projectId, { status: 'archived' });
  } catch (error) {
    logger.error('Failed to archive project', error as Error);
    throw handleError(error);
  }
}

/**
 * 取消归档项目
 * 
 * @param projectId 项目 ID
 * @returns 更新后的项目对象
 */
export async function unarchiveProject(projectId: string): Promise<Project> {
  try {
    logger.info('Unarchiving project', { projectId });
    return await updateProject(projectId, { status: 'active' });
  } catch (error) {
    logger.error('Failed to unarchive project', error as Error);
    throw handleError(error);
  }
}

/**
 * 删除项目（软删除）
 * 
 * 注意：这是软删除，项目状态设为 'deleted'，不会真正从数据库删除
 * 
 * @param projectId 项目 ID
 */
export async function deleteProject(projectId: string): Promise<void> {
  try {
    logger.info('Deleting project (soft delete)', { projectId });
    await updateProject(projectId, { status: 'deleted' });
    logger.info('Project deleted successfully', { projectId });
  } catch (error) {
    logger.error('Failed to delete project', error as Error);
    throw handleError(error);
  }
}

/**
 * 永久删除项目（硬删除）
 * 
 * 警告：这会真正从数据库删除项目及其所有关联的创意任务
 * 
 * @param projectId 项目 ID
 */
export async function permanentlyDeleteProject(projectId: string): Promise<void> {
  try {
    if (!projectId || projectId.trim().length === 0) {
      throw new AppError(
        'Project ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '项目 ID 不能为空',
        false
      );
    }

    logger.warn('Permanently deleting project', { projectId });

    await withTimeoutAndRetry(
      async () => {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId);

        if (error) throw error;
      },
      {
        timeoutMs: 10000,
        maxRetries: 2,
      }
    );

    logger.info('Project permanently deleted', { projectId });

  } catch (error) {
    logger.error('Failed to permanently delete project', error as Error);
    throw handleError(error);
  }
}

/**
 * 获取用户的项目统计
 * 
 * @param userId 用户 ID
 * @returns 统计信息
 */
export async function getProjectStats(userId: string): Promise<{
  total: number;
  active: number;
  archived: number;
}> {
  try {
    if (!userId || userId.trim().length === 0) {
      throw new AppError(
        'User ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '用户 ID 不能为空',
        false
      );
    }

    logger.info('Getting project stats', { userId });

    const projects = await getProjects(userId, true);

    const stats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      archived: projects.filter(p => p.status === 'archived').length,
    };

    logger.info('Project stats retrieved', { userId, stats });
    return stats;

  } catch (error) {
    logger.error('Failed to get project stats', error as Error);
    throw handleError(error);
  }
}
