# Mydea - AI 创意助手开发文档

> 你的专属 AI 广告创意伙伴

## 📋 目录

- [项目概述](#项目概述)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [核心模块](#核心模块)
- [开发指南](#开发指南)
- [API 文档](#api-文档)
- [状态管理](#状态管理)
- [样式规范](#样式规范)
- [测试指南](#测试指南)
- [部署说明](#部署说明)
- [常见问题](#常见问题)

---

## 项目概述

### 功能特性

Mydea 是一个基于 Google Gemini AI 的智能广告创意生成平台，主要功能包括：

- 🎯 **智能需求分析**：AI 自动分析用户的创意需求并提出针对性问题
- 🌍 **全球灵感搜索**：通过 Google Search 获取最新的创意案例参考
- 💡 **多方案生成**：一次性生成 3 个不同风格的创意方案
- 🔄 **迭代优化**：支持无限次方案优化和版本管理
- 📋 **项目管理**：多项目组织，历史记录追溯
- 🚀 **执行计划**：自动生成详细的落地执行方案

### 支持的创意类型

- Slogan（品牌口号）
- 社交媒体文案
- 平面设计
- 视频创意
- 公关活动
- 品牌命名

---

## 技术架构

### 技术栈

#### 前端框架
- **React 19.2.0** - UI 框架
- **TypeScript 5.8.2** - 类型安全
- **Vite 6.2.0** - 构建工具

#### AI 服务
- **@google/genai 1.27.0** - Google Gemini API

#### 样式方案
- **Tailwind CSS** (CDN) - 原子化 CSS

#### 数据存储
- **localStorage** - 客户端存储（临时方案）

### 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    用户界面层 (UI)                       │
│  Components: LoginScreen, HomeScreen, ResultsView...   │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                  状态管理层 (State)                      │
│        App.tsx - Stage based State Machine              │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                  服务层 (Services)                       │
│  ├─ geminiService: AI 调用与数据处理                    │
│  └─ databaseService: 本地数据持久化                     │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                  外部服务 (External)                     │
│  ├─ Google Gemini API (2.5-flash, 2.5-pro)             │
│  └─ Google Search (Grounding)                           │
└─────────────────────────────────────────────────────────┘
```

---

## 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Gemini API Key** (需要 Google AI Studio 账号)

### 安装步骤

1. **克隆项目**
```bash
cd /path/to/mydea
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

在项目根目录创建 `.env.local` 文件：

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> 获取 API Key: https://ai.google.dev/

4. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

---

## 项目结构

```
mydea/
├── components/                 # React 组件
│   ├── BriefRefinement.tsx    # 需求精炼组件
│   ├── CreativeBriefInput.tsx # 创意需求输入
│   ├── GeneratingView.tsx     # 生成过程展示
│   ├── Header.tsx             # 页面头部
│   ├── HomeScreen.tsx         # 主页
│   ├── LoadingSpinner.tsx     # 加载动画
│   ├── LoginScreen.tsx        # 登录页
│   ├── ProjectDashboard.tsx   # 项目仪表板
│   ├── ProjectDetails.tsx     # 项目详情
│   └── ResultsView.tsx        # 结果展示
│
├── services/                   # 业务逻辑服务
│   ├── databaseService.ts     # 数据存储服务
│   └── geminiService.ts       # AI 服务调用
│
├── App.tsx                     # 应用主入口
├── types.ts                    # TypeScript 类型定义
├── index.tsx                   # 渲染入口
├── index.html                  # HTML 模板
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
├── package.json               # 项目依赖
└── .env.local                 # 环境变量（需创建）
```

---

## 核心模块

### 1. 状态管理 (App.tsx)

应用采用基于 Stage 的状态机模式：

```typescript
enum Stage {
  LOGIN,              // 登录页
  HOME,               // 主页
  PROJECT_DASHBOARD,  // 项目管理
  PROJECT_DETAILS,    // 项目详情
  BRIEF_INPUT,        // 需求输入
  BRIEF_REFINEMENT,   // 需求精炼
  GENERATING,         // 生成中
  RESULTS,            // 结果展示
}
```

**核心状态**：
- `currentUser`: 当前登录用户
- `activeProjectId`: 活动项目 ID
- `activeBriefId`: 活动创意任务 ID
- `currentRun`: 当前生成任务的完整数据
- `refinementData`: AI 分析的精炼数据
- `generatingStatus`: 生成进度状态

### 2. AI 服务 (geminiService.ts)

#### 核心函数

##### `refineBrief(briefText, creativeType)`
分析用户需求并提出澄清问题

**输入**：
- `briefText`: 用户的初始需求描述
- `creativeType`: 创意类型

**输出**：
```typescript
{
  summary: string;      // AI 对需求的理解
  questions: string[];  // 澄清问题列表
}
```

**使用模型**: `gemini-2.5-flash`

##### `generateCreativePackage(refinedBrief, projectContext, onStatusUpdate)`
生成完整的创意包（灵感 + 方案）

**流程**：
1. 调用 `getInspirations()` - 搜索全球案例
2. 调用 `generateProposals()` - 生成 3 个创意方案
3. 通过回调更新进度状态

**使用模型**: 
- 灵感搜索: `gemini-2.5-flash` + Google Search
- 方案生成: `gemini-2.5-pro`

##### `optimizeProposal(originalProposal, feedback, contextBrief)`
根据反馈优化创意方案

**输入**：
- `originalProposal`: 原方案对象
- `feedback`: 用户反馈
- `contextBrief`: 原始需求上下文

**输出**: 优化后的新版本方案

**使用模型**: `gemini-2.5-pro`

##### `generateExecutionPlan(finalProposal, creativeType, contextBrief)`
生成执行落地方案

**根据创意类型生成不同内容**：
- 公关活动 → 活动执行计划（时间线、资源、风险）
- 视频创意 → 完整视频脚本（场景、对白、镜头）
- 社交媒体文案 → 一周内容日历（3平台）
- 其他 → 通用执行计划

**使用模型**: `gemini-2.5-pro`

### 3. 数据服务 (databaseService.ts)

#### 数据模型

```typescript
interface User {
  username: string;
  projects: Project[];
}

interface Project {
  id: string;
  name: string;
  briefs: BriefHistoryItem[];
}

interface BriefHistoryItem {
  id: string;
  createdAt: string;
  initialBrief: Brief;
  refinedBriefText: string;
  inspirations: InspirationCase[];
  proposals: CreativeProposal[];
}

interface CreativeProposal {
  id: string;
  conceptTitle: string;
  coreIdea: string;
  detailedDescription: string;
  example: string;
  whyItWorks: string;
  version: number;
  history?: Omit<CreativeProposal, 'history' | 'isFinalized' | 'executionDetails'>[];
  isFinalized: boolean;
  executionDetails: ExecutionDetails | null;
}
```

#### 核心 API

```typescript
// 用户管理
getUser(username: string): User | null
createUser(username: string): User

// 会话管理
setSessionUser(user: User): void
getSessionUser(): User | null
clearSession(): void

// 项目管理
addProject(username: string, projectName: string): { updatedUser: User, newProject: Project }

// 创意任务管理
addOrUpdateBrief(username: string, projectId: string, brief: BriefHistoryItem): User
deleteBrief(username: string, projectId: string, briefId: string): User
```

---

## 开发指南

### 组件开发规范

#### 1. 组件结构模板

```typescript
import React, { useState } from 'react';
import type { YourType } from '../types';

interface YourComponentProps {
  // Props 定义
  data: YourType;
  onAction: (param: string) => void;
}

const YourComponent: React.FC<YourComponentProps> = ({ data, onAction }) => {
  // 状态管理
  const [localState, setLocalState] = useState('');

  // 事件处理
  const handleEvent = () => {
    // 逻辑处理
    onAction(localState);
  };

  // 渲染
  return (
    <div className="container-styles">
      {/* JSX */}
    </div>
  );
};

export default YourComponent;
```

#### 2. 类型定义规范

所有类型定义统一在 `types.ts` 中维护：

```typescript
// 使用 interface 定义对象类型
export interface NewType {
  id: string;
  name: string;
  optional?: number;
}

// 使用 type 定义联合类型或别名
export type Status = "pending" | "processing" | "completed";
```

#### 3. 异步操作规范

```typescript
const handleAsyncAction = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const result = await someAsyncFunction();
    // 处理结果
  } catch (error) {
    console.error('Error:', error);
    setError('用户友好的错误消息');
  } finally {
    setIsLoading(false);
  }
};
```

### 添加新的创意类型

1. **更新类型定义** (`types.ts`)
```typescript
export type CreativeType = 
  | "Slogan" 
  | "社交媒体文案" 
  | "平面设计" 
  | "视频创意" 
  | "公关活动" 
  | "品牌命名"
  | "新类型"; // 添加新类型
```

2. **更新组件** (`CreativeBriefInput.tsx`)
```typescript
const CREATIVE_TYPES: CreativeType[] = [
  "Slogan", 
  "社交媒体文案", 
  "平面设计", 
  "视频创意", 
  "公关活动", 
  "品牌命名",
  "新类型" // 添加到列表
];
```

3. **更新 AI 提示词** (`geminiService.ts`)
```typescript
// 在 refineBrief 函数中添加针对新类型的问题逻辑
// 在 generateExecutionPlan 函数中添加新类型的执行计划模板
switch (creativeType) {
  case '新类型':
    action = '针对新类型的执行计划描述';
    break;
  // ...
}
```

### 自定义 Hook 示例

```typescript
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
```

---

## API 文档

### Gemini API 配置

#### 模型选择

- **gemini-2.5-flash**: 快速响应，用于需求分析、灵感搜索
- **gemini-2.5-pro**: 高质量输出，用于创意方案生成、优化

#### 结构化输出配置

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        field1: { type: Type.STRING },
        field2: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["field1", "field2"]
    }
  }
});
```

#### Google Search 集成

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt,
  config: {
    tools: [{ googleSearch: {} }] // 启用搜索
  }
});

// 获取来源链接
const sourceUrl = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.[0]?.web?.uri;
```

---

## 状态管理

### 应用流程图

```
登录 (LOGIN)
    ↓
主页 (HOME) ←──────────────────┐
    ↓                          │
需求精炼 (BRIEF_REFINEMENT)    │
    ↓                          │
生成中 (GENERATING)             │
    ↓                          │
结果展示 (RESULTS) ─────────────┘
    │
    ├─ 优化方案 (原地更新)
    ├─ 定稿执行 (原地更新)
    └─ 完成保存 → 返回主页
```

### 关键状态转换

```typescript
// 提交创意需求
handleBriefSubmit() {
  setStage(Stage.BRIEF_REFINEMENT);
  // 调用 AI 分析
}

// 提交精炼信息
handleRefinementSubmit() {
  setStage(Stage.GENERATING);
  // 生成创意包
  // 完成后 → setStage(Stage.RESULTS)
}

// 优化方案 (不改变 Stage)
handleOptimizeProposal() {
  // 更新 currentRun.proposals
}

// 完成并保存
handleFinish() {
  // 保存到数据库
  setStage(Stage.HOME);
  // 重置所有临时状态
}
```

---

## 样式规范

### Tailwind CSS 使用

项目通过 CDN 引入 Tailwind CSS：

```html
<script src="https://cdn.tailwindcss.com"></script>
```

### 设计系统

#### 颜色方案

```css
/* 主色调 */
背景: bg-gray-900, bg-gray-800
文字: text-white, text-gray-200, text-gray-300, text-gray-400
边框: border-gray-700, border-gray-600

/* 品牌色 */
主要: bg-purple-500, bg-purple-600 (CTA 按钮)
次要: bg-pink-500 (渐变效果)
强调: bg-blue-600 (信息按钮)
成功: bg-green-600 (定稿状态)
错误: bg-red-600 (错误提示)
```

#### 常用组件样式

**卡片**：
```tsx
className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8"
```

**主要按钮**：
```tsx
className="px-12 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
```

**输入框**：
```tsx
className="w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-purple-500"
```

### 动画效果

定义在全局 CSS 中（通过 Tailwind）：

```css
.animate-fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 测试指南

### 单元测试（推荐添加）

```bash
# 安装测试依赖
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**测试示例**：

```typescript
// services/__tests__/databaseService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import * as db from '../databaseService';

describe('databaseService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create a new user', () => {
    const user = db.createUser('testuser');
    expect(user.username).toBe('testuser');
    expect(user.projects).toEqual([]);
  });

  it('should add a project to user', () => {
    db.createUser('testuser');
    const { newProject } = db.addProject('testuser', 'Test Project');
    expect(newProject.name).toBe('Test Project');
  });
});
```

### 手动测试清单

#### 登录流程
- [ ] 新用户注册
- [ ] 已有用户登录
- [ ] 会话持久化（刷新页面保持登录）
- [ ] 登出功能

#### 创意生成流程
- [ ] 输入创意需求
- [ ] AI 分析并提问
- [ ] 提交补充信息
- [ ] 生成灵感案例（含来源链接）
- [ ] 生成 3 个创意方案

#### 方案优化
- [ ] 提交优化反馈
- [ ] 查看版本历史
- [ ] 从历史版本恢复

#### 方案执行
- [ ] 定稿并生成执行计划
- [ ] 不同创意类型生成不同执行计划

#### 项目管理
- [ ] 创建项目
- [ ] 查看项目列表
- [ ] 查看项目详情
- [ ] 删除创意任务

---

## 部署说明

### 环境变量配置

生产环境需要配置：

```env
GEMINI_API_KEY=your_production_api_key
```

### Vercel 部署

1. **安装 Vercel CLI**
```bash
npm install -g vercel
```

2. **部署**
```bash
vercel
```

3. **配置环境变量**
在 Vercel Dashboard 中添加 `GEMINI_API_KEY`

### Netlify 部署

1. **构建设置**
```
Build command: npm run build
Publish directory: dist
```

2. **环境变量**
在 Netlify Dashboard 设置环境变量

### Docker 部署（可选）

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

---

## 常见问题

### Q1: API Key 错误

**问题**: `API_KEY environment variable not set`

**解决**:
1. 确认 `.env.local` 文件存在
2. 确认文件中有 `GEMINI_API_KEY=your_key`
3. 重启开发服务器

### Q2: 数据丢失

**问题**: 刷新页面后数据丢失

**原因**: localStorage 被清除或浏览器隐私模式

**解决**:
- 检查浏览器设置
- 考虑升级到真实数据库

### Q3: AI 响应慢

**问题**: 生成创意方案等待时间长

**原因**: 
- Gemini API 网络延迟
- 使用了较慢的模型

**优化**:
- 添加超时控制
- 显示更详细的进度信息
- 考虑使用 streaming 模式

### Q4: 样式不生效

**问题**: Tailwind CSS 类名不生效

**检查**:
1. CDN 链接是否正常加载
2. 浏览器网络连接
3. 类名拼写是否正确

### Q5: TypeScript 类型错误

**解决**:
```bash
# 重新生成类型声明
npx tsc --noEmit

# 重启 VS Code TypeScript 服务
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

---

## 性能优化建议

### 1. 代码分割
```typescript
// 使用 React.lazy 延迟加载组件
const ResultsView = React.lazy(() => import('./components/ResultsView'));
```

### 2. 图片优化
```typescript
// 添加懒加载
<img loading="lazy" src={imageUrl} alt={title} />
```

### 3. 防抖优化
```typescript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useMemo(
  () => debounce((value) => search(value), 300),
  []
);
```

### 4. 缓存策略
```typescript
// 缓存 AI 响应（添加到 databaseService）
const cacheKey = `cache_${briefText}_${creativeType}`;
const cached = localStorage.getItem(cacheKey);
if (cached) {
  return JSON.parse(cached);
}
```

---

## 贡献指南

### Git 工作流

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 提交代码
git add .
git commit -m "feat: add new feature"

# 推送分支
git push origin feature/your-feature-name
```

### Commit 规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
test: 测试相关
chore: 构建/工具链相关
```

---

## 路线图

### v1.1 计划
- [ ] 添加真实数据库（Supabase）
- [ ] 实现后端 API 代理
- [ ] 添加单元测试覆盖
- [ ] 支持导出 PDF

### v1.2 计划
- [ ] 多语言支持（i18n）
- [ ] 主题切换（明/暗）
- [ ] 团队协作功能
- [ ] 移动端优化

### v2.0 计划
- [ ] AI 模型自定义
- [ ] 行业模板库
- [ ] 数据分析仪表板
- [ ] API 开放平台

---

## 联系方式

- 项目地址: https://ai.studio/apps/drive/1RyR4dxBnotzWHpt5iv7Nuw2qHecMW1hZ
- 问题反馈: 创建 GitHub Issue
- 技术支持: 参考 [常见问题](#常见问题)

---

**最后更新**: 2025-10-25  
**文档版本**: v1.0.0
