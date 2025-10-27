/**
 * Supabase 基础 Hook
 * 
 * 提供访问 Supabase 客户端和基础功能的 Hook
 */

import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import { AppError } from '../utils/errors';
import { logger } from '../utils/errors';

/**
 * 连接状态
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * useSupabase Hook
 * 
 * 提供 Supabase 客户端和连接状态
 */
export function useSupabase() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    // 测试 Supabase 连接
    async function testConnection() {
      try {
        logger.info('Testing Supabase connection');
        
        // 尝试查询 schema_version 表来验证连接
        const { error: queryError } = await supabase
          .from('schema_version')
          .select('version')
          .limit(1);

        if (queryError) {
          logger.error('Supabase connection test failed', queryError);
          setStatus('error');
          setError(queryError);
        } else {
          logger.info('Supabase connection successful');
          setStatus('connected');
          setError(null);
        }
      } catch (err) {
        logger.error('Supabase connection error', err as Error);
        setStatus('error');
        setError(err as Error);
      }
    }

    testConnection();
  }, []);

  return {
    supabase,
    status,
    error,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    hasError: status === 'error',
  };
}
