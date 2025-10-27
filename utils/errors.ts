/**
 * 统一错误处理系统
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  API_KEY_INVALID: 'API_KEY_INVALID',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AI_TIMEOUT: 'AI_TIMEOUT',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_ERROR: 'AI_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * 处理各种类型的错误，返回统一的 AppError
 */
export function handleError(error: unknown): AppError {
  // 已经是 AppError，直接返回
  if (error instanceof AppError) {
    return error;
  }
  
  // 网络错误 - 包括 fetch 失败和离线状态
  if (error instanceof TypeError && (
    error.message.includes('fetch') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError') ||
    error.message.includes('Network request failed')
  )) {
    return new AppError(
      'Network error',
      ErrorCodes.NETWORK_ERROR,
      '网络连接失败，请检查您的网络设置',
      true
    );
  }
  
  // 检查是否是网络离线
  if (!navigator.onLine) {
    return new AppError(
      'Offline',
      ErrorCodes.NETWORK_ERROR,
      '您当前处于离线状态，请检查网络连接',
      true
    );
  }
  
  // API Key 错误
  if (error instanceof Error && error.message.includes('API_KEY')) {
    return new AppError(
      'API Key error',
      ErrorCodes.API_KEY_INVALID,
      'API 配置错误，请联系管理员',
      false
    );
  }
  
  // 超时错误
  if (error instanceof Error && error.message.includes('timeout')) {
    return new AppError(
      'Request timeout',
      ErrorCodes.AI_TIMEOUT,
      'AI 响应超时，请稍后重试',
      true
    );
  }
  
  // 限流错误
  if (error instanceof Error && error.message.toLowerCase().includes('rate limit')) {
    return new AppError(
      'Rate limit exceeded',
      ErrorCodes.AI_RATE_LIMIT,
      '请求过于频繁，请稍后再试',
      true
    );
  }
  
  // AI 服务错误
  if (error instanceof Error && (
    error.message.includes('Gemini') || 
    error.message.includes('AI') ||
    error.message.includes('generate')
  )) {
    return new AppError(
      'AI service error',
      ErrorCodes.AI_ERROR,
      'AI 服务暂时不可用，请稍后重试',
      true
    );
  }
  
  // 数据库错误
  if (error instanceof Error && (
    error.message.includes('not found') ||
    error.message.includes('database') ||
    error.message.includes('storage')
  )) {
    return new AppError(
      'Database error',
      ErrorCodes.DATABASE_ERROR,
      '数据操作失败，请重试',
      true
    );
  }
  
  // 默认未知错误
  const errorMessage = error instanceof Error ? error.message : String(error);
  return new AppError(
    errorMessage,
    ErrorCodes.UNKNOWN_ERROR,
    '发生了未知错误，请稍后重试',
    true
  );
}

/**
 * 验证输入的辅助函数
 */
export function validateBrief(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new AppError(
      'Brief text is empty',
      ErrorCodes.VALIDATION_ERROR,
      '需求描述不能为空',
      false
    );
  }
  
  if (text.length > 5000) {
    throw new AppError(
      'Brief text too long',
      ErrorCodes.VALIDATION_ERROR,
      '需求描述过长，请控制在 5000 字以内',
      false
    );
  }
}

/**
 * 日志记录函数
 */
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, data || '');
    }
  },
  
  error: (message: string, error?: Error | AppError) => {
    console.error(`[ERROR] ${message}`, error);
    // 在生产环境中，这里可以发送到 Sentry 等监控服务
    if (process.env.NODE_ENV === 'production') {
      // TODO: 集成 Sentry
      // Sentry.captureException(error);
    }
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
};
