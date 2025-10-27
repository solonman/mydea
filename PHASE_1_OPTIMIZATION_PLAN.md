# Mydea 第一阶段优化计划

**制定日期**: 2025-10-27  
**规划周期**: 4 周  
**核心目标**: 5项创意功能优化与知识管理系统建设  
**完成度目标**: 100%

---

## 📋 需求总览

用户在创意生成流程中存在5个主要痛点，本计划通过渐进式优化来解决：

| 序号 | 优化项 | 当前状态 | 目标状态 | 优先级 |
|------|-------|--------|--------|------|
| 1 | 全球案例搜索相关性 | 提示不足，头图无相关性 | 高度相关的案例 + 详情页展示 | 🔴 高 |
| 2 | "细化此方案"功能 | 生成实施计划 | 生成最终创意表达 | 🔴 高 |
| 3 | 方案卡片交互优化 | 直接显示细化内容 | 展开/折叠 + 下载功能 | 🟡 中 |
| 4 | 项目知识库功能 | 无 | 支持上传项目相关文档 | 🟡 中 |
| 5 | 项目记忆功能 | 无 | 自动提炼偏好，用户可查看和编辑 | 🟡 中 |
| 6 | 案例源管理功能 | 无 | 用户可指定搜索源网站，优先搜索 | 🟡 中 |

---

## 🗓️ 分阶段计划

### 第 1 周：案例相关性优化 + 细化方案功能升级 + 案例源管理

#### 任务 1.1：优化全球案例搜索相关性
**目标**: 确保搜索到的案例与用户创意需求高度相关

**主要工作**:
1. 增强 `getInspirations()` 函数的 AI 提示词
   - 强调与创意类型和需求的**紧密对应**
   - 要求 AI 返回**相关性评分**（0-100）
   - 优先返回评分 > 80 的案例

2. 扩展 `InspirationCase` 数据结构
   ```typescript
   interface InspirationCase {
     // 现有字段
     title: string;
     highlight: string;
     imageUrl: string;
     
     // 新增字段
     relevanceScore: number;        // 0-100 相关性评分
     category: string;              // 案例分类
     detailedDescription: string;   // 案例详细说明
     keyInsights: string;           // 核心洞察
     targetAudience?: string;       // 目标人群
     industry?: string;             // 所属行业
     
     // 头图优化
     imageUrl: string;              // 使用关键词生成更相关的图片
     imageAlt: string;              // 图片描述
   }
   ```

3. 改进 AI 搜索提示词
   ```
   要求 AI：
   - 返回相关性评分最高的3个案例
   - 每个案例必须与用户的创意类型和需求 80% 以上相关
   - 提供详细的案例说明和核心启发点
   - 返回目标人群和行业信息便于理解
   ```

   4. 增加案例详情页，用户点击案例卡片，可展示完整的案例内容

   5. 改进案例头图规则：优先使用案例本身的原始图片，如果失败则使用关键词生成图片

**输出物**:
- 更新的 `getInspirations()` 函数
- 更新的 `InspirationCase` 类型定义
- 改进的 AI 提示词文档

**验证点**:
- ✅ 案例的 `relevanceScore` > 80
- ✅ 案例描述准确且有启发意义
- ✅ 返回的案例与创意需求高度相关

---

#### 任务 1.3：实现案例源管理功能
**目标**: 用户可指定优先搜索的案例源网站，AI 优先从这些网站搜索案例

**功能设计**:

1. 数据结构
   ```typescript
   interface CaseSource {
     id: string;
     userId: string;
     projectId?: string;           // 项目级别或全局级别
     name: string;                 // 源名称（如："Behance"、"Dribbble"）
     url: string;                  // 网站URL
     category: 'design' | 'advertising' | 'marketing' | 'social' | 'other';
     description?: string;         // 源描述
     isActive: boolean;            // 是否启用
     priority: number;             // 优先级（1-10，数字越大优先级越高）
     createdAt: Date;
     updatedAt: Date;
   }
   ```

2. 主要工作
   - 创建 `CaseSource` 数据表
   - 创建源管理服务 (`services/caseSourceService.ts`)
   - 创建源管理 UI 组件 (`components/CaseSourceManager.tsx`)
   - 集成到项目详情页
   - 更新 AI 搜索提示词，优先使用用户指定的源

3. 功能清单
   - [ ] 全局案例源库（内置推荐源列表）
   - [ ] 用户可添加自定义源
   - [ ] 源的启用/禁用切换
   - [ ] 源的优先级调整（拖拽排序）
   - [ ] 源的删除功能
   - [ ] 项目级别的源配置（继承全局 + 项目自定义）
   - [ ] AI 搜索时优先使用启用且优先级高的源
   - [ ] 如果源搜索结果不足，自动补充其他来源的案例

4. AI 集成
   ```
   改进的搜索流程：
   1. 获取用户启用的案例源列表（按优先级排序）
   2. 根据优先级，逐一搜索用户指定的源
   3. 如果找到足够的相关案例（≥3个），停止搜索
   4. 如果案例数不足，自动搜索通用来源补充
   5. 返回合并后的结果（用户源优先）
   ```

5. 内置推荐源示例
   ```typescript
   const DEFAULT_SOURCES: CaseSource[] = [
     {
       name: 'Behance',
       url: 'https://www.behance.net',
       category: 'design',
       priority: 8
     },
     {
       name: 'Dribbble',
       url: 'https://dribbble.com',
       category: 'design',
       priority: 8
     },
     {
       name: 'Ad Week',
       url: 'https://www.adweek.com',
       category: 'advertising',
       priority: 7
     },
     // ... 更多推荐源
   ];
   ```

**输出物**:
- `CaseSource` 数据结构定义
- `services/caseSourceService.ts` (~250 行)
- `components/CaseSourceManager.tsx` (~300 行)
- `hooks/useCaseSources.ts`
- 更新的 `getInspirations()` 函数
- 内置推荐源数据文件

**验证点**:
- ✅ 源可以被添加、编辑、删除
- ✅ 优先级调整生效
- ✅ AI 搜索优先使用用户源
- ✅ 源不足时自动补充
- ✅ 项目级源配置独立有效

---

#### 任务 1.2：重新设计"细化此方案"功能
**目标**: 从"实施计划"改为"最终创意表达"

**核心差异分析**:

| 维度 | 当前"定稿并执行" | 优化后"细化此方案" |
|------|-----------------|------------------|
| 主要目标 | 生成实施计划 | 精炼创意表达 |
| 输出内容 | 时间表、步骤、资源 | 创意的最终文案/视觉表达 |
| 适用阶段 | 方案确定后 | 创意优化中 |
| 用户诉求 | 如何执行 | 怎样表达更好 |

**主要工作**:
1. 创建新的 `refineCreativeExpression()` 函数
   ```typescript
   export async function refineCreativeExpression(
     proposal: CreativeProposal,
     creativeType: CreativeType,
     brief: string
   ): Promise<RefinedExpression>
   
   // 返回结构
   interface RefinedExpression {
     title: string;                 // 精炼后的概念标题
     refinedCoreIdea: string;       // 精炼后的核心创意
     refinedExample: string;        // 精炼后的最终表达示例
     alternatives: string[];        // 3个可选表达方式
     reasoning: string;             // 为什么这样表达更好
     visualGuidance?: string;       // 视觉指导（针对设计类）
     toneGuidance?: string;         // 表达语调指导
   }
   ```

2. 改写 AI 提示词
   - 强调目的：输出创意的**最终表达形式**
   - 不涉及：时间、步骤、资源等实施细节
   - 输出：更详尽、更精准的创意表达方案

3. 更新 UI 按钮和流程
   - 按钮文案：`finalizeAndExecute` → `refineCreativeExpression` (对应 `细化此方案`)
   - 移除"定稿"概念（不应该在优化阶段定稿）
   - 单纯展示创意表达方案

**输出物**:
- 新增 `refineCreativeExpression()` 函数
- 更新的 UI 按钮和流程
- 新的 AI 提示词文档

**验证点**:
- ✅ 功能仅输出创意相关的内容
- ✅ 不涉及实施细节（时间、步骤等）
- ✅ 用户感受到的是"创意细化"而非"执行规划"

---

### 第 2 周：UI 交互优化 + 下载功能

#### 任务 2.1：方案卡片展开/折叠交互优化
**目标**: 优化现在的方案展示和细化内容呈现方式

**当前问题**:
- 细化方案内容直接显示在卡片中，导致内容冗长
- 用户难以对比不同方案

**优化方案**:

1. 方案卡片改为分层展示
   ```
   ┌─────────────────────────────────┐
   │ 方案1：创意标题                    │ ← 基础信息
   ├─────────────────────────────────┤
   │ 💡 核心创意：...                  │
   │ 📝 应用示例：...                  │
   ├─────────────────────────────────┤
   │ ▼ 查看完整方案内容  [下载]        │ ← 折叠区
   └─────────────────────────────────┘
   
   展开后：
   ┌─────────────────────────────────┐
   │ ...                              │
   ├─────────────────────────────────┤
   │ ▲ 收起完整方案内容  [下载]        │
   │                                 │
   │ 📝 创意详述：...（完整内容）      │
   │ ✨ 为什么会奏效：...              │
   │                                 │
   │ 💬 细化此方案：                  │
   │ • 精炼后的核心创意                │
   │ • 可选表达方式1                  │
   │ • 可选表达方式2                  │
   │ • 可选表达方式3                  │
   │                                 │
   └─────────────────────────────────┘
   ```

2. 改进 ResultsView 组件
   - 添加 `isExpanded` 状态控制展开/折叠
   - 使用平滑的高度动画过渡
   - 优化内存占用（虚拟滚动考虑）

3. 优化视觉呈现
   - 使用图标表示展开/收起状态
   - 清晰的区块分隔
   - 合理的色彩和间距

**输出物**:
- 更新的 `ProposalCard` 组件
- 展开/折叠动画实现
- 更新的样式文件

**验证点**:
- ✅ 展开/折叠流畅无卡顿
- ✅ 内容完整显示
- ✅ 移动端也能正常使用

---

#### 任务 2.2：实现方案下载功能
**目标**: 用户可导出方案为 PDF 或 Markdown

**主要工作**:

1. 创建下载服务 (`utils/exportService.ts`)
   ```typescript
   // 支持格式
   export async function exportProposalPDF(
     proposal: CreativeProposal,
     format: 'pdf' | 'markdown' | 'txt'
   ): Promise<Blob>
   
   // 内容包含
   - 创意标题 + 核心创意
   - 详细描述 + 应用示例
   - 为什么会奏效 + 精炼表达
   - 时间戳 + 项目信息
   ```

2. 集成下载库
   - PDF: 使用 `html2pdf` 或 `jspdf`
   - Markdown: 原生支持
   - 配置合理的字体和布局

3. 添加下载按钮
   - 位置：方案卡片右侧
   - 样式：小按钮或下拉菜单
   - 反馈：显示下载进度

**输出物**:
- `utils/exportService.ts` (~200 行)
- 更新的 UI 组件
- 下载功能的 i18n 文案

**验证点**:
- ✅ PDF 格式化正确
- ✅ Markdown 内容完整
- ✅ 文件命名清晰（包含日期和项目名）

---

### 第 3 周：项目知识库功能

#### 任务 3.1：设计项目知识库功能
**目标**: 支持用户为每个项目上传相关文档

**功能设计**:

1. 数据结构
   ```typescript
   interface ProjectDocument {
     id: string;
     projectId: string;
     name: string;                 // 文件名
     type: 'brand-guide' | 'product' | 'market' | 'other'; // 文档类型
     description: string;          // 文档描述
     uploadedAt: Date;
     updatedAt: Date;
     fileSize: number;
     fileUrl: string;              // Supabase 存储路径
     summary?: string;             // AI 生成的摘要（可选）
     tags: string[];               // 用户标签
   }
   ```

2. 功能清单
   - [ ] 创建知识库管理页面（在项目详情页）
   - [ ] 支持上传多种文件格式（PDF、Word、图片等）
   - [ ] 文件列表展示 + 搜索/筛选
   - [ ] 文件预览功能
   - [ ] 文件删除功能
   - [ ] 文档分类管理

3. 与 AI 的集成
   - 用户在创意生成前，可选择参考的知识库文档，如果用户不选择，AI自动根据任务要求去检索项目知识库
   - AI 会根据选中的文档调整提示词
   - 提示词示例：`"根据附加的品牌指南文档，生成创意方案"`

**输出物**:
- UI 设计图 (Figma / 原型)
- 数据库表结构 SQL
- API 接口设计文档

**验证点**:
- ✅ 功能完整无遗漏
- ✅ 用户流程清晰
- ✅ 与 AI 流程的集成点明确

---

#### 任务 3.2：实现项目知识库
**主要工作**:

1. 后端服务 (Supabase)
   - 创建 `documents` 表
   - 配置 RLS 策略（用户只能访问自己项目的文档）
   - 配置文件存储桶

2. 前端组件
   - 创建 `ProjectKnowledgeBase.tsx` 组件
   - 集成文件上传器
   - 文件列表和操作界面
   - 文件预览器

3. 整合到项目流程
   - 在创意生成前添加"选择参考文档"步骤
   - 更新 AI 提示词以利用文档内容

**输出物**:
- `services/supabase/documentService.ts`
- `components/ProjectKnowledgeBase.tsx`
- `hooks/useProjectDocuments.ts`
- 更新的 `getInspirations()` 和其他 AI 函数

**验证点**:
- ✅ 文件上传成功
- ✅ 文件可正常预览
- ✅ AI 能够利用文档内容

---

### 第 4 周：项目记忆功能

#### 任务 4.1：设计项目记忆系统
**目标**: 自动提炼用户在每个项目上的创意偏好

**功能设计**:

1. 项目记忆数据结构
   ```typescript
   interface ProjectMemory {
     id: string;
     projectId: string;
     
     // 创意偏好
     preferredStyle: string[];      // 偏好的创意风格（理性/感性/幽默等）
     colorPreferences?: string[];   // 色彩偏好
     tonePreference?: string;       // 表达语调偏好
     targetAudienceInsight?: string; // 目标人群洞察
     
     // 优化方向
     frequentFeedback: {            // 常见的优化反馈
       keyword: string;
       frequency: number;
       examples: string[];          // 用户的具体反馈示例
     }[];
     
     // 统计数据
     totalProposals: number;        // 总方案数
     approvedProposals: number;     // 通过的方案数
     averageOptimizationRounds: number; // 平均优化轮数
     
     // 用户编辑信息
     userNotes: string;             // 用户自己的备注
     customRules: string[];         // 用户自定义的项目规则
     
     createdAt: Date;
     updatedAt: Date;
   }
   ```

2. 自动学习机制
   - 分析用户的优化反馈（feedback）
   - 识别高频关键词和模式
   - 学习用户的选择倾向
   - 定期总结并展示给用户

3. 用户交互界面
   - 项目记忆面板（在项目详情页）
   - 展示自动学习的偏好信息
   - 允许用户手动编辑和补充
   - 提供记忆使用情况统计

**输出物**:
- UI 设计图
- 数据库表结构 SQL
- 记忆分析算法文档

**验证点**:
- ✅ 分析逻辑准确
- ✅ 展示信息有价值
- ✅ 用户能理解和编辑

---

#### 任务 4.2：实现项目记忆功能
**主要工作**:

1. 后端服务
   - 创建 `project_memories` 表
   - 实现记忆更新逻辑
   - 创建分析算法服务

2. 分析引擎 (`services/memoryService.ts`)
   ```typescript
   // 分析用户的优化反馈
   export function analyzeOptimizationFeedback(
     feedback: string[],
     proposals: CreativeProposal[]
   ): ProjectMemory
   
   // 更新项目记忆
   export async function updateProjectMemory(
     projectId: string,
     newData: Partial<ProjectMemory>
   ): Promise<ProjectMemory>
   
   // 获取记忆建议
   export function getMemoryInsights(
     memory: ProjectMemory
   ): InsightSuggestion[]
   ```

3. 前端组件
   - 创建 `ProjectMemory.tsx` 展示组件
   - 创建 `MemoryEditor.tsx` 编辑组件
   - 集成到项目详情页

4. AI 集成
   - 在生成创意时，考虑项目记忆中的偏好
   - 在优化方案时，提示用户常见的优化方向

**输出物**:
- `services/memoryService.ts` (~300 行)
- `components/ProjectMemory.tsx`
- `components/MemoryEditor.tsx`
- `hooks/useProjectMemory.ts`

**验证点**:
- ✅ 记忆分析准确
- ✅ 展示清晰有用
- ✅ 用户可以编辑
- ✅ AI 能利用记忆信息

---

## 📊 工作量估算（更新）

| 任务 | 类型 | 工作量 | 需要配合的其他任务 |
|------|------|-------|-----------------|
| 1.1 | 算法优化 | 2 天 | 无 |
| 1.2 | 功能重设 | 3 天 | AI 提示词设计 |
| 1.3 | 源管理功能 | 3 天 | Supabase 数据表 |
| 2.1 | UI 优化 | 2 天 | 无 |
| 2.2 | 下载功能 | 2 天 | 第三方库集成 |
| 3.1 | 设计 + 规划 | 2 天 | 无 |
| 3.2 | 功能实现 | 4 天 | Supabase 文件存储 |
| 4.1 | 设计 + 算法 | 3 天 | 无 |
| 4.2 | 功能实现 | 4 天 | 无 |
| **总计** | | **25 天** | **~4-5 周** |

---

## 🔧 技术实现细节

### 前端技术栈
- React 19 + TypeScript
- Tailwind CSS (样式)
- 下载库: `html2pdf` 或 `jspdf`
- 文件上传: Supabase Storage 或 FormData
- 拖拽库: `react-beautiful-dnd` 或 `dnd-kit` (用于优先级排序)

### 后端/数据库
- Supabase (PostgreSQL)
- 新建表: `documents`, `project_memories`, `case_sources`
- 行级安全 (RLS) 配置
- 新增约束: `case_sources` 表的优先级唯一约束

### AI 集成
- Google Gemini 2.5 API
- 优化后的提示词（加入源优先级逻辑）
- 上下文注入（文档 + 记忆 + 案例源）

---

## 📋 风险与缓解策略

| 风险 | 影响 | 缓解策略 |
|------|------|--------|
| AI 提示词效果不佳 | 案例不相关 | 多轮测试 + 用户反馈迭代 |
| 文件上传性能问题 | 用户体验差 | 限制文件大小 + 异步处理 |
| 记忆分析算法准确度 | 建议不实用 | 从简单规则开始，逐步优化 |
| 案例源搜索失败 | 案例获取不足 | 建立降级机制自动补充通用源 |
| Supabase 配额限制 | 功能受限 | 评估成本 + 优化查询 |

---

## ✅ 验收标准

### 功能完整性
- ✅ 5 个优化项全部实现
- ✅ 所有新增功能无明显 bug
- ✅ 用户流程顺畅

### 代码质量
- ✅ TypeScript 类型完善
- ✅ 错误处理充分
- ✅ 代码注释清晰

### 文档
- ✅ 功能使用文档完整
- ✅ API 文档更新
- ✅ 架构设计文档

### 用户体验
- ✅ 界面响应流畅
- ✅ 功能易于发现和使用
- ✅ 错误提示友好

---

## 📅 里程碑

- **Week 1 结束**: 案例相关性优化 + 细化方案功能 + 案例源管理完成
- **Week 2 结束**: UI 交互优化 + 下载功能完成
- **Week 3 结束**: 项目知识库功能完成
- **Week 4-5 结束**: 项目记忆功能完成 + 整体测试验证

---

## 🚀 后续行动

### 立即执行
1. [ ] 确认设计方案和技术方案
2. [ ] 梳理优先级（如需调整）
3. [ ] 分配开发资源
4. [ ] 准备必要的第三方库

### 每周进行
1. [ ] 技术设计评审
2. [ ] 代码质量检查
3. [ ] 功能验证测试
4. [ ] 用户反馈收集

### 完成后
1. [ ] 编写更新日志
2. [ ] 更新用户文档
3. [ ] 进行发布前测试
4. [ ] 收集正式反馈

---

**文档版本**: v1.0  
**最后更新**: 2025-10-27  
**状态**: 待确认和开始执行
