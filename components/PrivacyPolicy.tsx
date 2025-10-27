import React from 'react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">隐私政策</h1>
          <button 
            onClick={onBack}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="card-glass p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Mydea 隐私政策</h2>
            <p className="text-gray-300 leading-relaxed">
              Mydea 重视您的隐私。本隐私政策说明我们如何收集、使用和保护您的个人信息。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">1. 信息收集</h3>
            <div className="space-y-3 text-gray-300">
              <div>
                <h4 className="font-medium text-white mb-2">1.1 账户信息</h4>
                <p className="ml-4">当您注册 Mydea 账户时，我们收集：</p>
                <ul className="list-disc ml-8 mt-2">
                  <li>用户名</li>
                  <li>邮箱地址（如提供）</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">1.2 使用数据</h4>
                <p className="ml-4">我们可能收集：</p>
                <ul className="list-disc ml-8 mt-2">
                  <li>项目和创意数据</li>
                  <li>使用偏好设置</li>
                  <li>设备信息和浏览器类型</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">1.3 Cookie 和追踪技术</h4>
                <p className="ml-4">我们使用 Cookie 来改善用户体验。</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">2. 信息使用</h3>
            <p className="text-gray-300 mb-2">我们使用您的信息用于：</p>
            <ul className="list-disc ml-8 text-gray-300 space-y-1">
              <li>提供和改进服务</li>
              <li>个性化用户体验</li>
              <li>发送重要通知</li>
              <li>分析服务使用情况</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">3. 信息共享</h3>
            <p className="text-gray-300">
              我们不会出售、交易或出租您的个人信息给第三方，除非：
            </p>
            <ul className="list-disc ml-8 text-gray-300 space-y-1 mt-2">
              <li>获得您的明确同意</li>
              <li>法律要求</li>
              <li>保护 Mydea 的权利和财产</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">4. 数据安全</h3>
            <p className="text-gray-300 mb-2">我们采取合理措施保护您的信息，包括：</p>
            <ul className="list-disc ml-8 text-gray-300 space-y-1">
              <li>加密传输</li>
              <li>访问控制</li>
              <li>定期安全审查</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">5. 数据保留</h3>
            <p className="text-gray-300">
              我们会在您使用服务期间保留您的信息，并在不再需要时删除。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">6. 您的权利</h3>
            <p className="text-gray-300 mb-2">您有权：</p>
            <ul className="list-disc ml-8 text-gray-300 space-y-1">
              <li>访问您的个人信息</li>
              <li>更正不准确的信息</li>
              <li>删除您的账户和数据</li>
              <li>撤回同意</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">7. 儿童隐私</h3>
            <p className="text-gray-300">
              Mydea 不面向 13 岁以下儿童，我们不会故意收集儿童信息。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">8. 政策变更</h3>
            <p className="text-gray-300">
              我们可能更新本政策，变更会在此页面发布。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">9. 联系我们</h3>
            <p className="text-gray-300">
              如有隐私相关问题，请联系：<br />
              邮箱：privacy@mydea.example.com
            </p>
          </section>

          <p className="text-gray-400 text-sm pt-4 border-t border-gray-700">
            最后更新：2025年10月27日
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;