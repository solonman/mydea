import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, logger } from '../utils/errors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件
 * 用于捕获组件树中的 JavaScript 错误，并显示友好的错误界面
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 更新状态以便下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误信息
    logger.error('Error caught by ErrorBoundary', error);
    console.error('Error details:', errorInfo);

    // 更新状态
    this.setState({
      error,
      errorInfo,
    });

    // 在生产环境中，这里可以发送到错误监控服务（如 Sentry）
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error } = this.state;
      const appError = error instanceof AppError ? error : null;

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 animate-fade-in">
            {/* 错误图标 */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* 错误标题 */}
            <h1 className="text-3xl font-bold text-center text-white mb-4">
              抱歉，出现了一些问题
            </h1>

            {/* 错误描述 */}
            <div className="bg-gray-900/70 rounded-lg p-4 mb-6">
              <p className="text-gray-300 text-center">
                {appError ? appError.userMessage : '应用遇到了意外错误，请尝试刷新页面'}
              </p>
            </div>

            {/* 开发环境下显示详细错误信息 */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mb-6">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-white mb-2">
                  查看错误详情（仅开发环境）
                </summary>
                <div className="bg-gray-950 rounded-lg p-4 overflow-auto max-h-60">
                  <p className="text-red-400 text-sm font-mono mb-2">
                    {error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-gray-500 overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                刷新页面
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-300"
              >
                返回主页
              </button>
            </div>

            {/* 提示信息 */}
            <p className="text-center text-gray-500 text-sm mt-6">
              如果问题持续出现，请联系技术支持
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
