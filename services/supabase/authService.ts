/**
 * 认证服务
 * 
 * 提供邮箱验证注册和第三方登录功能
 */

import { supabase } from './client';
import { handleError, logger, AppError, ErrorCodes } from '../../utils/errors';
import type { User } from './userService';

/**
 * 邮箱注册输入类型
 */
export interface EmailSignUpInput {
  email: string;
  password: string;
  username: string;
}

/**
 * 邮箱登录输入类型
 */
export interface EmailSignInInput {
  email: string;
  password: string;
}

/**
 * 认证用户类型（包含 Supabase Auth 信息）
 */
export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  user_metadata: {
    username?: string;
    avatar_url?: string;
  };
}

/**
 * 微信登录配置
 */
export interface WeChatConfig {
  appId: string;
  redirectUri: string;
  state?: string;
}

/**
 * 使用邮箱注册
 * 
 * @param input 注册信息
 * @returns 认证用户信息
 */
export async function signUpWithEmail(input: EmailSignUpInput): Promise<AuthUser> {
  try {
    // 验证输入
    if (!input.email || !input.email.includes('@')) {
      throw new AppError(
        'Invalid email',
        ErrorCodes.VALIDATION_ERROR,
        '请输入有效的邮箱地址',
        false
      );
    }

    if (!input.password || input.password.length < 6) {
      throw new AppError(
        'Password too short',
        ErrorCodes.VALIDATION_ERROR,
        '密码长度至少为 6 个字符',
        false
      );
    }

    if (!input.username || input.username.trim().length < 2) {
      throw new AppError(
        'Invalid username',
        ErrorCodes.VALIDATION_ERROR,
        '用户名长度至少为 2 个字符',
        false
      );
    }

    logger.info('Starting email signup', { email: input.email, username: input.username });

    // 使用 Supabase Auth 注册
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          username: input.username.trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      // 处理常见错误
      if (error.message.includes('already registered')) {
        throw new AppError(
          'Email already exists',
          ErrorCodes.VALIDATION_ERROR,
          '该邮箱已被注册，请直接登录或使用其他邮箱',
          false
        );
      }
      throw error;
    }

    if (!data.user) {
      throw new AppError(
        'Signup failed',
        ErrorCodes.NETWORK_ERROR,
        '注册失败，请稍后重试',
        true
      );
    }

    logger.info('Email signup successful', { 
      userId: data.user.id, 
      email: data.user.email,
      emailConfirmed: !!data.user.email_confirmed_at
    });

    // 返回认证用户信息
    return {
      id: data.user.id,
      email: data.user.email!,
      email_confirmed_at: data.user.email_confirmed_at,
      user_metadata: data.user.user_metadata,
    };

  } catch (error) {
    logger.error('Email signup failed', error as Error);
    throw handleError(error);
  }
}

/**
 * 使用邮箱登录
 * 
 * @param input 登录信息
 * @returns 认证用户信息
 */
export async function signInWithEmail(input: EmailSignInInput): Promise<AuthUser> {
  try {
    // 验证输入
    if (!input.email || !input.email.includes('@')) {
      throw new AppError(
        'Invalid email',
        ErrorCodes.VALIDATION_ERROR,
        '请输入有效的邮箱地址',
        false
      );
    }

    if (!input.password || input.password.length < 6) {
      throw new AppError(
        'Invalid password',
        ErrorCodes.VALIDATION_ERROR,
        '请输入正确的密码',
        false
      );
    }

    logger.info('Starting email signin', { email: input.email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      // 处理常见错误
      if (error.message.includes('Invalid login credentials')) {
        throw new AppError(
          'Invalid credentials',
          ErrorCodes.VALIDATION_ERROR,
          '邮箱或密码错误，请重试',
          false
        );
      }
      throw error;
    }

    if (!data.user) {
      throw new AppError(
        'Signin failed',
        ErrorCodes.NETWORK_ERROR,
        '登录失败，请稍后重试',
        true
      );
    }

    logger.info('Email signin successful', { 
      userId: data.user.id, 
      email: data.user.email 
    });

    return {
      id: data.user.id,
      email: data.user.email!,
      email_confirmed_at: data.user.email_confirmed_at,
      user_metadata: data.user.user_metadata,
    };

  } catch (error) {
    logger.error('Email signin failed', error as Error);
    throw handleError(error);
  }
}

/**
 * 重新发送验证邮件
 * 
 * @param email 邮箱地址
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  try {
    if (!email || !email.includes('@')) {
      throw new AppError(
        'Invalid email',
        ErrorCodes.VALIDATION_ERROR,
        '请输入有效的邮箱地址',
        false
      );
    }

    logger.info('Resending verification email', { email });

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    logger.info('Verification email resent successfully', { email });

  } catch (error) {
    logger.error('Failed to resend verification email', error as Error);
    throw handleError(error);
  }
}

/**
 * 获取微信登录 URL
 * 
 * @param config 微信配置
 * @returns 微信登录授权 URL
 */
export function getWeChatLoginUrl(config: WeChatConfig): string {
  const { appId, redirectUri, state = 'STATE' } = config;
  
  const params = new URLSearchParams({
    appid: appId,
    redirect_uri: encodeURIComponent(redirectUri),
    response_type: 'code',
    scope: 'snsapi_login',
    state,
  });

  return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
}

/**
 * 处理微信登录回调
 * 
 * @param code 微信返回的授权码
 * @returns 认证用户信息
 */
export async function handleWeChatCallback(code: string): Promise<AuthUser> {
  try {
    if (!code) {
      throw new AppError(
        'Missing code',
        ErrorCodes.VALIDATION_ERROR,
        '微信授权失败，请重试',
        false
      );
    }

    logger.info('Handling WeChat callback', { code: code.substring(0, 10) + '...' });

    // 注意：这里需要后端 API 来处理微信登录
    // 因为需要使用 appSecret，不能在前端暴露
    const response = await fetch('/api/auth/wechat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new AppError(
        'WeChat login failed',
        ErrorCodes.NETWORK_ERROR,
        '微信登录失败，请重试',
        true
      );
    }

    const data = await response.json();
    
    logger.info('WeChat login successful', { userId: data.user.id });

    return data.user;

  } catch (error) {
    logger.error('WeChat login failed', error as Error);
    throw handleError(error);
  }
}

/**
 * 登出
 */
export async function signOut(): Promise<void> {
  try {
    logger.info('Signing out');

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    logger.info('Signed out successfully');

  } catch (error) {
    logger.error('Signout failed', error as Error);
    throw handleError(error);
  }
}

/**
 * 获取当前认证用户
 * 
 * @returns 当前用户信息，未登录返回 null
 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // 如果是 session not found 错误，返回 null（用户未登录）
      if (error.message.includes('session_not_found')) {
        return null;
      }
      throw error;
    }

    if (!user) return null;

    return {
      id: user.id,
      email: user.email!,
      email_confirmed_at: user.email_confirmed_at,
      user_metadata: user.user_metadata,
    };

  } catch (error) {
    logger.error('Failed to get current user', error as Error);
    throw handleError(error);
  }
}

/**
 * 监听认证状态变化
 * 
 * @param callback 状态变化回调
 * @returns 取消监听的函数
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      logger.info('Auth state changed', { event, userId: session?.user?.id });

      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email!,
          email_confirmed_at: session.user.email_confirmed_at,
          user_metadata: session.user.user_metadata,
        });
      } else {
        callback(null);
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}
