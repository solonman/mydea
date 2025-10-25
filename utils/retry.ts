/**
 * 请求重试和超时工具
 */

import { logger } from './errors';

/**
 * 带超时控制的 Promise 包装
 * @param fn 要执行的异步函数
 * @param timeoutMs 超时时间（毫秒）
 * @returns Promise
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

/**
 * 带重试机制的函数执行
 * @param fn 要执行的异步函数
 * @param maxRetries 最大重试次数
 * @param delayMs 重试延迟（毫秒），每次重试会递增
 * @param shouldRetry 可选的重试条件判断函数
 * @returns Promise
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  shouldRetry?: (error: Error) => boolean
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      logger.debug(`Attempt ${attempt + 1}/${maxRetries}`);
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // 检查是否应该重试
      if (shouldRetry && !shouldRetry(lastError)) {
        logger.warn('Error not retryable, stopping', lastError.message);
        throw lastError;
      }

      // 最后一次尝试失败，不再重试
      if (attempt === maxRetries - 1) {
        logger.error(`All ${maxRetries} attempts failed`, lastError);
        throw lastError;
      }

      // 计算延迟时间（指数退避）
      const delay = delayMs * Math.pow(2, attempt);
      logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, lastError.message);
      
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * 延迟函数
 * @param ms 延迟时间（毫秒）
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 组合使用超时和重试
 * @param fn 要执行的异步函数
 * @param options 配置选项
 * @returns Promise
 */
export async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  options: {
    timeoutMs?: number;
    maxRetries?: number;
    delayMs?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    timeoutMs = 30000,
    maxRetries = 3,
    delayMs = 1000,
    shouldRetry,
  } = options;

  return withRetry(
    () => withTimeout(fn, timeoutMs),
    maxRetries,
    delayMs,
    shouldRetry
  );
}

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delayMs 延迟时间
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}

/**
 * 节流函数
 * @param fn 要执行的函数
 * @param delayMs 延迟时间
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number = 300
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function (...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= delayMs) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * 判断错误是否可以重试
 * @param error 错误对象
 * @returns 是否可重试
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // 网络错误，可重试
  if (message.includes('network') || message.includes('fetch')) {
    return true;
  }
  
  // 超时错误，可重试
  if (message.includes('timeout')) {
    return true;
  }
  
  // 限流错误，可重试
  if (message.includes('rate limit')) {
    return true;
  }
  
  // 临时性 AI 错误，可重试
  if (message.includes('temporarily unavailable') || message.includes('service unavailable')) {
    return true;
  }
  
  // API Key 错误，不可重试
  if (message.includes('api_key') || message.includes('authentication')) {
    return false;
  }
  
  // 验证错误，不可重试
  if (message.includes('validation') || message.includes('invalid')) {
    return false;
  }
  
  // 默认可重试
  return true;
}
