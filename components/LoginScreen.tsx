import React, { useState } from 'react';

interface LoginScreenProps {
  onEmailSignUp: (email: string, password: string, username: string) => void;
  onEmailSignIn: (email: string, password: string) => void;
  onWeChatLogin: () => void;
  isLoading?: boolean;
}

type AuthMode = 'signin' | 'signup';

const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onEmailSignUp, 
  onEmailSignIn, 
  onWeChatLogin,
  isLoading = false 
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup') {
      if (email.trim() && password.trim() && username.trim()) {
        onEmailSignUp(email.trim(), password, username.trim());
      }
    } else {
      if (email.trim() && password.trim()) {
        onEmailSignIn(email.trim(), password);
      }
    }
  };

  const isFormValid = authMode === 'signup' 
    ? email.trim() && password.length >= 6 && username.trim()
    : email.trim() && password.length >= 6;

  return (
    <div className="w-full max-w-md mx-auto" style={{ marginTop: '8vh' }}>
      <div className="card-glass p-8 animate-fade-in">
        {/* Logo 区域 */}
        <div className="text-center mb-8">
          <div className="inline-block p-3" style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
            borderRadius: '16px',
            marginBottom: '16px'
          }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M24 24L42 14" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M24 24L6 14" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M24 24V44" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="heading-gradient" style={{ fontSize: '32px', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {authMode === 'signup' ? '创建账户' : 'Mydea'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>
            {authMode === 'signup' ? '开启您的 AI 创意之旅' : '您的专属 AI 广告创意伙伴'}
          </p>
        </div>

        {/* 邮箱登录/注册表单 */}
        <form onSubmit={handleSubmit} className="animate-fade-in animate-delay-100">
          {/* 用户名（仅注册时显示） */}
          {authMode === 'signup' && (
            <div style={{ marginBottom: '16px' }}>
              <label 
                htmlFor="username" 
                style={{ 
                  display: 'block',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  letterSpacing: '0.01em'
                }}
              >
                用户名 <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-modern"
                placeholder="请输入您的用户名"
                autoComplete="username"
                disabled={isLoading}
                minLength={2}
                maxLength={50}
              />
            </div>
          )}

          {/* 邮箱 */}
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="email" 
              style={{ 
                display: 'block',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px',
                letterSpacing: '0.01em'
              }}
            >
              邮箱地址 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-modern"
              placeholder="请输入您的邮箱"
              autoComplete="email"
              disabled={isLoading}
              required
            />
          </div>

          {/* 密码 */}
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="password" 
              style={{ 
                display: 'block',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px',
                letterSpacing: '0.01em'
              }}
            >
              密码 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-modern"
                placeholder="请输入密码（至少6位）"
                autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                disabled={isLoading}
                minLength={6}
                required
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.73 4.00001C13.1549 3.93666 12.5788 3.90453 12 3.90001C6 3.90001 2 12 2 12C2.87103 13.733 4.04916 15.2878 5.47 16.59M9.88 9.88001C9.58384 10.1762 9.34936 10.5276 9.18987 10.9141C9.03038 11.3006 8.94912 11.7147 8.95083 12.1325C8.9525 12.5503 9.03711 12.9637 9.19996 13.3489C9.36281 13.7341 9.60051 14.0837 9.89943 14.3776C10.1984 14.6716 10.553 14.9043 10.9409 15.0619C11.3288 15.2195 11.7428 15.2991 12.1605 15.2959C12.5783 15.2927 12.9911 15.2069 13.3765 15.0433C13.7618 14.8798 14.1122 14.6418 14.407 14.342M17.36 17.36C15.9116 18.5584 14.1329 19.2431 12.28 19.32C6.28 19.32 2.28 12 2.28 12C3.67907 9.56481 5.52091 7.43056 7.71 5.71001L17.36 17.36ZM12 6.60001C13.0736 6.59979 14.1249 6.91171 15.0307 7.50151C15.9365 8.09132 16.6607 8.93507 17.12 9.93001M12 12V12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5C8.24 5 5.09 7.37 4 10.75C5.09 14.13 8.24 16.5 12 16.5C15.76 16.5 18.91 14.13 20 10.75C18.91 7.37 15.76 5 12 5ZM12 14.5C10.07 14.5 8.5 12.93 8.5 11C8.5 9.07 10.07 7.5 12 7.5C13.93 7.5 15.5 9.07 15.5 11C15.5 12.93 13.93 14.5 12 14.5ZM12 9C10.9 9 10 9.9 10 11C10 12.1 10.9 13 12 13C13.1 13 14 12.1 14 11C14 9.9 13.1 9 12 9Z" fill="currentColor" />
                  </svg>
                )}
              </button>
            </div>
            {authMode === 'signup' && password.length > 0 && password.length < 6 && (
              <p style={{ fontSize: '12px', color: '#F59E0B', marginTop: '4px', marginBottom: 0 }}>
                密码至少需要 6 个字符
              </p>
            )}
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="btn-primary w-full"
            style={{ marginTop: '8px' }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75"></path>
                </svg>
                <span>{authMode === 'signup' ? '正在注册...' : '正在登录...'}</span>
              </span>
            ) : (
              <span>{authMode === 'signup' ? '注册并开始' : '登录'}</span>
            )}
          </button>
        </form>

        {/* 分隔线 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          margin: '24px 0' 
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>或</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
        </div>

        {/* 微信登录按钮 */}
        <button
          onClick={onWeChatLogin}
          disabled={isLoading}
          className="btn-secondary w-full"
          style={{
            border: '1.5px solid rgba(7, 193, 96, 0.3)',
            background: 'rgba(7, 193, 96, 0.05)',
            color: '#07C160'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.5 11.5C9.32843 11.5 10 10.8284 10 10C10 9.17157 9.32843 8.5 8.5 8.5C7.67157 8.5 7 9.17157 7 10C7 10.8284 7.67157 11.5 8.5 11.5Z" />
              <path d="M15.5 11.5C16.3284 11.5 17 10.8284 17 10C17 9.17157 16.3284 8.5 15.5 8.5C14.6716 8.5 14 9.17157 14 10C14 10.8284 14.6716 11.5 15.5 11.5Z" />
              <path d="M12 2C6.48 2 2 5.83 2 10.5C2 12.76 3.04 14.8 4.73 16.28C4.54 17.58 3.89 18.77 3.88 18.79C3.84 18.87 3.82 18.96 3.84 19.04C3.87 19.2 4.01 19.32 4.18 19.35H4.28C6.08 19.35 7.62 18.69 8.71 17.92C9.77 18.22 10.87 18.38 12 18.38C17.52 18.38 22 14.55 22 9.88C22 5.21 17.52 2 12 2Z" />
            </svg>
            <span>微信扫码登录</span>
          </span>
        </button>

        {/* 切换登录/注册 */}
        <div className="text-center animate-fade-in animate-delay-200" style={{ marginTop: '20px' }}>
          <button 
            onClick={() => {
              setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
              setPassword('');
              setUsername('');
            }}
            disabled={isLoading}
            className="btn-secondary"
            style={{ 
              border: 'none',
              background: 'transparent',
              color: 'var(--text-tertiary)',
              fontSize: '14px',
              padding: '8px 16px'
            }}
          >
            {authMode === 'signin' ? '没有账户？立即注册' : '已有账户？立即登录'}
          </button>
        </div>

        {/* 邮箱验证提示 */}
        {authMode === 'signup' && (
          <div className="card-glass" style={{
            marginTop: '20px',
            padding: '12px 16px',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                注册后，我们会向您的邮箱发送验证邮件。请点击邮件中的链接完成验证。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="text-center animate-fade-in animate-delay-300" style={{ marginTop: '24px' }}>
        <p style={{ 
          color: 'var(--text-muted)',
          fontSize: '12px',
          margin: 0
        }}>
          由 Gemini AI 驱动 • 您的创意数据安全加密
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
