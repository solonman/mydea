import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
  onRegister: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onRegister }) => {
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      if (isRegistering) {
        onRegister(username.trim());
      } else {
        onLogin(username.trim());
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-20 text-center">
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
          {isRegistering ? '创建您的 Mydea 账户' : 'Welcome to Mydea'}
        </h1>
        <p className="text-gray-400 mb-8">{isRegistering ? '开启您的创意之旅' : '请输入您的用户名以开始'}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-lg text-center text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="您的用户名"
            aria-label="Username"
          />
          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full mt-6 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegistering ? '注册并登录' : '登录'}
          </button>
        </form>
        <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-gray-400 hover:text-white mt-6"
        >
            {isRegistering ? '已有账户？点击登录' : '没有账户？点击注册'}
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;