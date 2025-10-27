import React from 'react';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">服务条款</h1>
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
            <h2 className="text-xl font-semibold mb-4">Mydea 服务条款</h2>
            <p className="text-gray-300 leading-relaxed">
              欢迎使用 Mydea！本服务条款適用于您对 Mydea 的使用。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">1. 服务描述</h3>
            <p className="text-gray-300 mb-2">Mydea 是一款 AI 广告创意助手，旨在帮助用户：</p>
            <ul className="list-disc ml-8 text-gray-300 space-y-1">
              <li>智能分析创意需求</li>
              <li>获取全球创意灵感</li>
              <li>生成多种风格的创意方案</li>
              <li>迭代优化创意内容</li>
              <li>生成执行计划</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">2. 用户账户</h3>
            <div className="space-y-3 text-gray-300">
              <div>
                <h4 className="font-medium text-white mb-2">2.1 账户注册</h4>
                <ul className="list-disc ml-8 space-y-1">
                  <li>您需要注册账户才能使用 Mydea 的完整功能</li>
                  <li>您应提供真实、准确的信息</li>
                  <li>您负责维护账户安全</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">2.2 账户安全</h4>
                <ul className="list-disc ml-8 space-y-1">
                  <li>您应对账户密码保密</li>
                  <li>如发现账户异常，请立即联系我们</li>
                  <li>禁止与他人共享账户</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">3. 用户权利与义务</h3>
            <div className="space-y-3 text-gray-300">
              <div>
                <h4 className="font-medium text-white mb-2">3.1 您的权利</h4>
                <ul className="list-disc ml-8 space-y-1">
                  <li>使用 Mydea 生成创意内容</li>
                  <li>查看和管理您的项目</li>
                  <li>导出创意成果</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">3.2 您的义务</h4>
                <ul className="list-disc ml-8 space-y-1">
                  <li>遵守法律法规</li>
                  <li>不得用于非法用途</li>
                  <li>尊重他人知识产权</li>
                  <li>不得逼向工程或破解服务</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">4. 内容所有权</h3>
            <div className="space-y-3 text-gray-300">
              <div>
                <h4 className="font-medium text-white mb-2">4.1 用户内容</h4>
                <p>您保留对通过 Mydea 创建的内容的所有权。</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">4.2 服务内容</h4>
                <p>Mydea 的界面、功能、技术等知识产权归 Mydea 团队所有。</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">5. 服务变更与终止</h3>
            <p className="text-gray-300">
              我们保留在任何时候修改或终止服务的权利，但会提前通知用户。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">6. 免责声明</h3>
            <p className="text-gray-300">
              Mydea 按“现状”提供，不保证服务的連续性和准确性。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">7. 联系我们</h3>
            <p className="text-gray-300">
              如有疑问，请通过以下方式联系我们：<br />
              邮箱：support@mydea.example.com
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

export default TermsOfService;