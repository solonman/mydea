import React, { useState } from 'react';
import { User, Language } from '../types';
import { useLanguage } from '../i18n/useLanguage';

interface UserSettingsProps {
  user: User;
  onSave: (updatedUser: User) => Promise<User>;
  onCancel: () => void;
  onShowTermsOfService: () => void;
  onShowPrivacyPolicy: () => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ user, onSave, onCancel, onShowTermsOfService, onShowPrivacyPolicy }) => {
  const { t } = useLanguage();
  const [avatar, setAvatar] = useState<string>(user.avatar || '');
  const [language, setLanguage] = useState<Language>(user.language || 'zh');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 模拟文件上传，实际项目中应该上传到服务器
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // 验证密码修改
      if (newPassword || confirmPassword || currentPassword) {
        if (!currentPassword) {
          throw new Error(t('enterCurrentPasswordError'));
        }
        if (newPassword !== confirmPassword) {
          throw new Error(t('passwordMismatch'));
        }
        if (newPassword.length < 6) {
          throw new Error(t('passwordTooShort'));
        }
        // 在实际应用中，这里应该验证当前密码是否正确
        // 并调用后端API更新密码
      }
      
      // 更新用户信息
      const updatedUser: User = {
        ...user,
        avatar: avatar || undefined,
        language: language || undefined,
        // 注意：在实际应用中，密码不应该存储在User对象中
        // 这里只是为了演示目的
      };
      
      const savedUser = await onSave(updatedUser);
      setSuccess(t('settingsSaved'));
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || t('saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">{t('userSettings')}</h2>
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-500/50 text-green-300 rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-8">
        {/* 头像设置 */}
        <section className="card-glass p-6">
          <h3 className="text-lg font-semibold mb-4">{t('avatar')}</h3>
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={t('avatar')} 
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-600"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="#9CA3AF" strokeWidth="2"/>
                    <path d="M3 21C3 17.6863 5.68629 15 9 15H15C18.3137 15 21 17.6863 21 21V22H3V21Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input 
                  id="avatar-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div>
              <p className="text-gray-300 text-sm mb-2">{t('supportedFormats')}</p>
              {avatar && (
                <button 
                  onClick={() => setAvatar('')}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  {t('removeAvatar')}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 语言设置 */}
        <section className="card-glass p-6">
          <h3 className="text-lg font-semibold mb-4">{t('language')}</h3>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('interfaceLanguage')}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="input-modern w-full"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
            <p className="text-gray-400 text-sm mt-2">{t('selectLanguage')}</p>
          </div>
        </section>

        {/* 密码修改 */}
        <section className="card-glass p-6">
          <h3 className="text-lg font-semibold mb-4">{t('passwordSecurity')}</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('currentPassword')}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-modern w-full"
                placeholder={t('enterCurrentPassword')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-modern w-full"
                placeholder={t('atLeast6Characters')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('confirmNewPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-modern w-full"
                placeholder={t('confirmPasswordAgain')}
              />
            </div>
          </div>
        </section>

        {/* 服务条款和隐私政策 */}
        <section className="card-glass p-6">
          <h3 className="text-lg font-semibold mb-4">{t('legalInfo')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-300">{t('termsOfService')}</span>
              <button 
                className="text-blue-400 hover:text-blue-300 text-sm"
                onClick={onShowTermsOfService}
              >
                {t('view')}
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-300">{t('privacyPolicy')}</span>
              <button 
                className="text-blue-400 hover:text-blue-300 text-sm"
                onClick={onShowPrivacyPolicy}
              >
                {t('view')}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          disabled={isSaving}
        >
          {t('cancel')}
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          disabled={isSaving}
        >
          {isSaving && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {t('saveSettings')}
        </button>
      </div>
    </div>
  );
};

export default UserSettings;