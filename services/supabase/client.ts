/**
 * Supabase 客户端配置
 * 
 * 这个文件创建并导出 Supabase 客户端实例
 * 用于访问 Supabase 数据库和其他服务
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/errors';

// 从环境变量获取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 验证配置
if (!supabaseUrl) {
  const error = new Error('缺少 Supabase URL 配置');
  logger.error('Supabase configuration error', error);
  throw error;
}

if (!supabaseAnonKey) {
  const error = new Error('缺少 Supabase Anon Key 配置');
  logger.error('Supabase configuration error', error);
  throw error;
}

/**
 * Supabase 客户端实例
 * 
 * 配置选项:
 * - auth.persistSession: 持久化会话（如需要认证功能）
 * - db.schema: 数据库 schema（默认 public）
 * - global.headers: 全局请求头
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 启用认证会话持久化，支持邮箱注册和第三方登录
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'mydea-auth',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'Mydea',
    },
  },
});

/**
 * 数据库类型定义（将从 Supabase 自动生成）
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: 'active' | 'archived' | 'deleted';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: 'active' | 'archived' | 'deleted';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          status?: 'active' | 'archived' | 'deleted';
          created_at?: string;
          updated_at?: string;
        };
      };
      briefs: {
        Row: {
          id: string;
          project_id: string;
          initial_brief: any; // JSONB
          refined_brief_text: string | null;
          inspirations: any | null; // JSONB
          proposals: any | null; // JSONB
          status: 'draft' | 'in_progress' | 'completed' | 'archived';
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          initial_brief: any;
          refined_brief_text?: string | null;
          inspirations?: any | null;
          proposals?: any | null;
          status?: 'draft' | 'in_progress' | 'completed' | 'archived';
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          initial_brief?: any;
          refined_brief_text?: string | null;
          inspirations?: any | null;
          proposals?: any | null;
          status?: 'draft' | 'in_progress' | 'completed' | 'archived';
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// 导出类型化的 Supabase 客户端
export type TypedSupabaseClient = ReturnType<typeof createClient<Database>>;

logger.info('Supabase client initialized', { 
  url: supabaseUrl.substring(0, 30) + '...' 
});
