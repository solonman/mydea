/**
 * 用户服务
 * 
 * 提供用户相关的数据库操作
 */

import { supabase } from './client';
import { handleError, logger, AppError, ErrorCodes } from '../../utils/errors';
import { withTimeoutAndRetry } from '../../utils/retry';

/**
 * 用户数据类型
 */
export interface User {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 创建用户输入类型
 */
export interface CreateUserInput {
  username: string;
  email?: string;
  avatar_url?: string;
}

/**
 * 更新用户输入类型
 */
export interface UpdateUserInput {
  email?: string;
  avatar_url?: string;
}

/**
 * 创建新用户
 * 
 * @param input 用户信息
 * @returns 创建的用户对象
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    // 验证输入
    if (!input.username || input.username.trim().length < 2) {
      throw new AppError(
        'Invalid username',
        ErrorCodes.VALIDATION_ERROR,
        '用户名长度至少为 2 个字符',
        false
      );
    }

    if (input.username.length > 50) {
      throw new AppError(
        'Username too long',
        ErrorCodes.VALIDATION_ERROR,
        '用户名长度不能超过 50 个字符',
        false
      );
    }

    logger.info('Creating user', { username: input.username });

    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('users')
          .insert({
            username: input.username.trim(),
            email: input.email || null,
            avatar_url: input.avatar_url || null,
          })
          .select()
          .single();

        if (error) {
          // 检查是否是用户名重复错误
          if (error.code === '23505') {
            throw new AppError(
              'Username already exists',
              ErrorCodes.VALIDATION_ERROR,
              '该用户名已被使用，请选择其他用户名',
              false
            );
          }
          throw error;
        }

        return data as User;
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
        delayMs: 1000,
      }
    );

    logger.info('User created successfully', { userId: result.id, username: result.username });
    return result;

  } catch (error) {
    logger.error('Failed to create user', error as Error);
    throw handleError(error);
  }
}

/**
 * 根据用户名获取用户
 * 
 * @param username 用户名
 * @returns 用户对象，如果不存在返回 null
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    if (!username || username.trim().length === 0) {
      throw new AppError(
        'Username is required',
        ErrorCodes.VALIDATION_ERROR,
        '用户名不能为空',
        false
      );
    }

    logger.info('Getting user by username', { username });

    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username.trim())
          .maybeSingle();

        if (error) throw error;
        return data as User | null;
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
      }
    );

    if (result) {
      logger.info('User found', { userId: result.id, username: result.username });
    } else {
      logger.info('User not found', { username });
    }

    return result;

  } catch (error) {
    logger.error('Failed to get user by username', error as Error);
    throw handleError(error);
  }
}

/**
 * 根据 ID 获取用户
 * 
 * @param userId 用户 ID
 * @returns 用户对象，如果不存在返回 null
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    if (!userId || userId.trim().length === 0) {
      throw new AppError(
        'User ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '用户 ID 不能为空',
        false
      );
    }

    logger.info('Getting user by ID', { userId });

    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;
        return data as User | null;
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
      }
    );

    if (result) {
      logger.info('User found', { userId: result.id, username: result.username });
    } else {
      logger.info('User not found', { userId });
    }

    return result;

  } catch (error) {
    logger.error('Failed to get user by ID', error as Error);
    throw handleError(error);
  }
}

/**
 * 更新用户信息
 * 
 * @param userId 用户 ID
 * @param input 要更新的字段
 * @returns 更新后的用户对象
 */
export async function updateUser(userId: string, input: UpdateUserInput): Promise<User> {
  try {
    if (!userId || userId.trim().length === 0) {
      throw new AppError(
        'User ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '用户 ID 不能为空',
        false
      );
    }

    logger.info('Updating user', { userId, fields: Object.keys(input) });

    const result = await withTimeoutAndRetry(
      async () => {
        const { data, error } = await supabase
          .from('users')
          .update({
            email: input.email !== undefined ? input.email : undefined,
            avatar_url: input.avatar_url !== undefined ? input.avatar_url : undefined,
          })
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;
        return data as User;
      },
      {
        timeoutMs: 10000,
        maxRetries: 3,
      }
    );

    logger.info('User updated successfully', { userId: result.id });
    return result;

  } catch (error) {
    logger.error('Failed to update user', error as Error);
    throw handleError(error);
  }
}

/**
 * 获取或创建用户
 * 
 * 如果用户名存在则返回该用户，否则创建新用户
 * 这个函数用于简化登录流程
 * 
 * @param username 用户名
 * @returns 用户对象
 */
export async function getOrCreateUser(username: string): Promise<User> {
  try {
    logger.info('Getting or creating user', { username });

    // 先尝试获取
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      logger.info('User already exists, returning existing user', { userId: existingUser.id });
      return existingUser;
    }

    // 不存在则创建
    logger.info('User does not exist, creating new user', { username });
    const newUser = await createUser({ username });
    return newUser;

  } catch (error) {
    logger.error('Failed to get or create user', error as Error);
    throw handleError(error);
  }
}

/**
 * 删除用户（慎用）
 * 
 * 注意：这会级联删除用户的所有项目和创意任务
 * 
 * @param userId 用户 ID
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    if (!userId || userId.trim().length === 0) {
      throw new AppError(
        'User ID is required',
        ErrorCodes.VALIDATION_ERROR,
        '用户 ID 不能为空',
        false
      );
    }

    logger.warn('Deleting user', { userId });

    await withTimeoutAndRetry(
      async () => {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) throw error;
      },
      {
        timeoutMs: 10000,
        maxRetries: 2,
      }
    );

    logger.info('User deleted successfully', { userId });

  } catch (error) {
    logger.error('Failed to delete user', error as Error);
    throw handleError(error);
  }
}
