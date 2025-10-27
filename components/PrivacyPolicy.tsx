import React from 'react';
import ReactMarkdown from 'react-markdown';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  // 从文件中读取的原始Markdown内容
  const markdownContent = `# Mydea 隐私政策

Mydea 重视您的隐私。本隐私政策说明我们如何收集、使用和保护您的个人信息。

## 1. 信息收集

### 1.1 账户信息
当您注册 Mydea 账户时，我们收集：
- 用户名
- 邮箱地址（如提供）

### 1.2 使用数据
我们可能收集：
- 项目和创意数据
- 使用偏好设置
- 设备信息和浏览器类型

### 1.3 Cookie 和追踪技术
我们使用 Cookie 来改善用户体验。

## 2. 信息使用

我们使用您的信息用于：
- 提供和改进服务
- 个性化用户体验
- 发送重要通知
- 分析服务使用情况

## 3. 信息共享

我们不会出售、交易或出租您的个人信息给第三方，除非：
- 获得您的明确同意
- 法律要求
- 保护 Mydea 的权利和财产

## 4. 数据安全

我们采取合理措施保护您的信息，包括：
- 加密传输
- 访问控制
- 定期安全审查

## 5. 数据保留

我们会在您使用服务期间保留您的信息，并在不再需要时删除。

## 6. 您的权利

您有权：
- 访问您的个人信息
- 更正不准确的信息
- 删除您的账户和数据
- 撤回同意

## 7. 儿童隐私

Mydea 不面向 13 岁以下儿童，我们不会故意收集儿童信息。

## 8. 政策变更

我们可能更新本政策，变更会在此页面发布。

## 9. 联系我们

如有隐私相关问题，请联系：
- 邮箱：privacy@mydea.example.com

*最后更新：2025年10月27日*`;

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

        <div className="card-glass p-6 prose prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-6 mb-3" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-4 mb-2" {...props} />,
              p: ({node, ...props}) => <p className="mb-3" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4" {...props} />,
              li: ({node, ...props}) => <li className="mb-1" {...props} />,
              em: ({node, ...props}) => <em className="text-gray-400" {...props} />
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;