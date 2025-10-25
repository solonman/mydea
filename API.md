# Mydea API 接口文档

## 📚 目录

- [服务层概述](#服务层概述)
- [Gemini AI 服务](#gemini-ai-服务)
- [数据库服务](#数据库服务)
- [类型定义](#类型定义)
- [错误处理](#错误处理)
- [使用示例](#使用示例)

---

## 服务层概述

Mydea 应用包含两个核心服务模块：

1. **geminiService.ts** - Google Gemini AI 调用服务
2. **databaseService.ts** - 本地数据持久化服务

---

## Gemini AI 服务

位置: `services/geminiService.ts`

### 初始化配置

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.API_KEY 
});
```

### API 函数列表

---

### 1. refineBrief()

**功能**: 分析用户的创意需求并生成澄清问题

**签名**:
```typescript
async function refineBrief(
  briefText: string, 
  creativeType: string
): Promise<RefinementData>
```

**参数**:
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| briefText | string | 是 | 用户的初始创意需求描述 |
| creativeType | string | 是 | 创意类型（如 "Slogan", "视频创意" 等） |

**返回值**:
```typescript
{
  summary: string;      // AI 对需求的理解总结
  questions: string[];  // 2-3个澄清问题的数组
}
```

**使用的模型**: `gemini-2.5-flash`

**配置**:
```typescript
{
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      questions: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING } 
      }
    },
    required: ["summary", "questions"]
  }
}
```

**错误处理**:
- 抛出异常: `"Failed to get brief refinement from Gemini API."`

**示例**:
```typescript
try {
  const result = await refineBrief(
    "为咖啡品牌 WakeUp 写一个 Slogan",
    "Slogan"
  );
  
  console.log(result);
  // {
  //   summary: "您需要为一个名为 WakeUp 的咖啡品牌创作品牌口号...",
  //   questions: [
  //     "您的目标受众是谁？",
  //     "品牌的核心价值观是什么？",
  //     "希望传达什么情感？"
  //   ]
  // }
} catch (error) {
  console.error("需求分析失败:", error);
}
```

---

### 2. generateCreativePackage()

**功能**: 生成完整的创意包，包含灵感案例和创意方案

**签名**:
```typescript
async function generateCreativePackage(
  refinedBrief: string,
  projectContext: string,
  onStatusUpdate: (status: GeneratingStatus) => void
): Promise<{
  inspirations: InspirationCase[];
  proposals: Omit<CreativeProposal, 'id' | 'version' | 'history' | 'isFinalized' | 'executionDetails'>[];
}>
```

**参数**:
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| refinedBrief | string | 是 | 精炼后的完整需求描述 |
| projectContext | string | 否 | 项目上下文信息 |
| onStatusUpdate | function | 是 | 进度回调函数 |

**状态值**:
```typescript
type GeneratingStatus = 
  | "analyzing"   // 分析中
  | "inspiring"   // 搜索灵感
  | "creating"    // 生成方案
  | "finished";   // 完成
```

**返回值**:
```typescript
{
  inspirations: InspirationCase[];  // 3个全球灵感案例
  proposals: CreativeProposal[];    // 3个创意方案
}
```

**流程**:
1. 更新状态 → `inspiring`
2. 调用 `getInspirations()` - 搜索相关案例
3. 更新状态 → `creating`
4. 调用 `generateProposals()` - 生成创意方案
5. 更新状态 → `finished`

**示例**:
```typescript
const handleStatusChange = (status) => {
  console.log("当前状态:", status);
};

const result = await generateCreativePackage(
  "完整的需求描述...",
  "项目名称: 咖啡营销活动",
  handleStatusChange
);

console.log("灵感数量:", result.inspirations.length);
console.log("方案数量:", result.proposals.length);
```

---

### 3. getInspirations()

**功能**: 使用 Google Search 获取全球创意案例

**签名**:
```typescript
async function getInspirations(
  refinedBrief: string
): Promise<InspirationCase[]>
```

**参数**:
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| refinedBrief | string | 是 | 精炼后的创意需求 |

**返回值**:
```typescript
InspirationCase[] // 最多3个案例

interface InspirationCase {
  title: string;      // 案例标题（原语言）
  highlight: string;  // 创意亮点（中文）
  imageUrl: string;   // 配图URL
  sourceUrl?: string; // 来源链接（如果有）
}
```

**使用的模型**: `gemini-2.5-flash`

**特殊配置**:
```typescript
{
  tools: [{ googleSearch: {} }]  // 启用 Google Search
}
```

**Grounding 元数据**:
```typescript
const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
const sourceUrl = groundingChunks?.[index]?.web?.uri;
```

**降级策略**:
如果搜索失败，返回默认错误提示案例：
```typescript
[
  { 
    title: "案例获取失败", 
    highlight: "无法从网络获取灵感案例...", 
    imageUrl: "https://picsum.photos/seed/error1/600/400" 
  },
  // ...
]
```

---

### 4. generateProposals()

**功能**: 基于需求和灵感生成3个创意方案

**签名**:
```typescript
async function generateProposals(
  refinedBrief: string,
  inspirations: InspirationCase[],
  projectContext: string
): Promise<Omit<CreativeProposal, 'id' | 'version' | 'history' | 'isFinalized' | 'executionDetails'>[]>
```

**参数**:
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| refinedBrief | string | 是 | 完整的需求描述 |
| inspirations | InspirationCase[] | 是 | 灵感案例数组 |
| projectContext | string | 否 | 项目上下文 |

**返回值**:
```typescript
CreativeProposal[] // 3个创意方案

interface CreativeProposal {
  conceptTitle: string;        // 概念标题
  coreIdea: string;            // 核心创意（一句话）
  detailedDescription: string; // 详细描述
  example: string;             // 应用示例
  whyItWorks: string;          // 为什么有效
}
```

**使用的模型**: `gemini-2.5-pro` (高质量输出)

**Schema 定义**:
```typescript
const PROPOSAL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    conceptTitle: { type: Type.STRING },
    coreIdea: { type: Type.STRING },
    detailedDescription: { type: Type.STRING },
    example: { type: Type.STRING },
    whyItWorks: { type: Type.STRING },
  },
  required: ["conceptTitle", "coreIdea", "detailedDescription", "example", "whyItWorks"]
};
```

**Prompt 策略**:
- 身份: 奥美广告创意总监
- 要求: 基于 brief 和灵感创建原创创意
- 输出: 3个不同风格的方案

---

### 5. optimizeProposal()

**功能**: 根据用户反馈优化创意方案

**签名**:
```typescript
async function optimizeProposal(
  originalProposal: CreativeProposal,
  feedback: string,
  contextBrief: string
): Promise<Omit<CreativeProposal, 'id' | 'version' | 'history' | 'isFinalized' | 'executionDetails'>>
```

**参数**:
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| originalProposal | CreativeProposal | 是 | 原始方案对象 |
| feedback | string | 是 | 用户的优化意见 |
| contextBrief | string | 是 | 原始需求上下文 |

**返回值**:
```typescript
CreativeProposal // 优化后的新方案（不含 id, version, history 等）
```

**使用的模型**: `gemini-2.5-pro`

**Prompt 结构**:
```typescript
`You are an expert advertising creative director...

**Original Creative Brief:**
${contextBrief}

**Original Proposal:**
${JSON.stringify(originalProposal)}

**User's Feedback:**
"${feedback}"

Generate improved version...`
```

**示例**:
```typescript
const optimized = await optimizeProposal(
  originalProposal,
  "能让文案更幽默一点吗？",
  "咖啡品牌 Slogan 需求..."
);
```

---

### 6. generateExecutionPlan()

**功能**: 为定稿方案生成详细的执行计划

**签名**:
```typescript
async function generateExecutionPlan(
  finalProposal: CreativeProposal,
  creativeType: CreativeType,
  contextBrief: string
): Promise<ExecutionDetails>
```

**参数**:
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| finalProposal | CreativeProposal | 是 | 最终确定的方案 |
| creativeType | CreativeType | 是 | 创意类型 |
| contextBrief | string | 是 | 原始需求 |

**返回值**:
```typescript
interface ExecutionDetails {
  title: string;   // 计划标题
  content: string; // 详细内容（Markdown 格式）
}
```

**使用的模型**: `gemini-2.5-pro`

**不同类型的执行计划**:

| 创意类型 | 执行计划内容 |
|----------|-------------|
| 公关活动 | 活动执行计划（时间线、里程碑、资源、风险） |
| 视频创意 | 完整视频脚本（场景、对白、镜头、音效） |
| 社交媒体文案 | 一周内容日历（3平台、配图、标签） |
| 其他 | 通用实施计划 |

**示例输出**:
```typescript
{
  title: "咖啡品牌 Slogan 落地执行方案",
  content: `
## 第一阶段：品牌传播准备（第1-2周）
- 确定视觉识别系统
- 制作宣传物料
- ...

## 第二阶段：渠道投放（第3-4周）
- 社交媒体预热
- 线下门店布置
- ...
  `
}
```

---

## 数据库服务

位置: `services/databaseService.ts`

### 存储方案

使用 **localStorage** 进行客户端数据持久化

**键名定义**:
```typescript
const DB_KEY = 'mydea_db';        // 用户数据库
const SESSION_KEY = 'mydea_session'; // 当前会话
```

### API 函数列表

---

### 1. 用户管理

#### getUser()

```typescript
function getUser(username: string): User | null
```

**功能**: 获取指定用户的完整数据

**返回**: User 对象或 null（用户不存在）

---

#### createUser()

```typescript
function createUser(username: string): User
```

**功能**: 创建新用户

**抛出异常**: 如果用户已存在

**返回**: 新创建的 User 对象

**示例**:
```typescript
try {
  const newUser = createUser("john_doe");
  console.log("用户创建成功:", newUser);
} catch (error) {
  console.error("用户已存在");
}
```

---

### 2. 会话管理

#### setSessionUser()

```typescript
function setSessionUser(user: User): void
```

**功能**: 设置当前登录用户

**存储位置**: `localStorage[SESSION_KEY]`

---

#### getSessionUser()

```typescript
function getSessionUser(): User | null
```

**功能**: 获取当前登录用户

**返回**: User 对象或 null

---

#### clearSession()

```typescript
function clearSession(): void
```

**功能**: 清除会话（登出）

---

### 3. 项目管理

#### addProject()

```typescript
function addProject(
  username: string,
  projectName: string
): { updatedUser: User; newProject: Project }
```

**功能**: 为用户添加新项目

**参数**:
- `username`: 用户名
- `projectName`: 项目名称

**返回**:
```typescript
{
  updatedUser: User;      // 更新后的用户对象
  newProject: Project;    // 新创建的项目对象
}
```

**抛出异常**: 用户不存在

**示例**:
```typescript
const { updatedUser, newProject } = addProject("john_doe", "咖啡营销");
console.log("项目ID:", newProject.id);
```

---

### 4. 创意任务管理

#### addOrUpdateBrief()

```typescript
function addOrUpdateBrief(
  username: string,
  projectId: string,
  brief: BriefHistoryItem
): User
```

**功能**: 添加或更新创意任务

**逻辑**:
- 如果 `brief.id` 已存在 → 更新
- 如果不存在 → 添加新任务

**参数**:
- `username`: 用户名
- `projectId`: 项目 ID
- `brief`: 完整的创意任务对象

**返回**: 更新后的 User 对象

**抛出异常**: 用户或项目不存在

---

#### deleteBrief()

```typescript
function deleteBrief(
  username: string,
  projectId: string,
  briefId: string
): User
```

**功能**: 删除指定创意任务

**返回**: 更新后的 User 对象

**抛出异常**: 用户或项目不存在

---

### 内部函数

#### getDb()

```typescript
function getDb(): Record<string, User>
```

**功能**: 从 localStorage 读取完整数据库

**返回**: 用户字典对象

---

#### saveDb()

```typescript
function saveDb(db: Record<string, User>): void
```

**功能**: 保存数据库到 localStorage

**注意**: 自动调用，外部无需手动调用

---

## 类型定义

位置: `types.ts`

### 核心类型

```typescript
// 应用阶段
enum Stage {
  LOGIN,
  HOME,
  PROJECT_DASHBOARD,
  PROJECT_DETAILS,
  BRIEF_INPUT,
  BRIEF_REFINEMENT,
  GENERATING,
  RESULTS,
}

// 创意类型
type CreativeType = 
  | "Slogan" 
  | "社交媒体文案" 
  | "平面设计" 
  | "视频创意" 
  | "公关活动" 
  | "品牌命名";

// 生成状态
type GeneratingStatus = 
  | "analyzing" 
  | "inspiring" 
  | "creating" 
  | "finished";
```

### 数据模型

```typescript
// 用户
interface User {
  username: string;
  projects: Project[];
}

// 项目
interface Project {
  id: string;
  name: string;
  briefs: BriefHistoryItem[];
}

// 创意需求
interface Brief {
  text: string;
  type: CreativeType;
}

// 需求精炼数据
interface RefinementData {
  summary: string;
  questions: string[];
}

// 灵感案例
interface InspirationCase {
  title: string;
  highlight: string;
  imageUrl: string;
  sourceUrl?: string;
}

// 执行细节
interface ExecutionDetails {
  title: string;
  content: string;
}

// 创意方案（完整版）
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

// 创意任务历史记录
interface BriefHistoryItem {
  id: string;
  createdAt: string;
  initialBrief: Brief;
  refinedBriefText: string;
  inspirations: InspirationCase[];
  proposals: CreativeProposal[];
}
```

---

## 错误处理

### Gemini API 错误

```typescript
try {
  const result = await refineBrief(text, type);
} catch (error) {
  console.error("Error refining brief:", error);
  throw new Error("Failed to get brief refinement from Gemini API.");
}
```

### 数据库错误

```typescript
// 用户不存在
if (!user) throw new Error('User not found');

// 项目不存在
if (!project) throw new Error('Project not found');

// 用户已存在
if (db[username]) throw new Error('User already exists');
```

### 推荐的错误处理模式

```typescript
// 在组件中
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  setError(null);
  try {
    await someApiCall();
  } catch (e) {
    console.error(e);
    setError('用户友好的错误消息');
  }
};

// 显示错误
{error && (
  <div className="error-message">
    {error}
  </div>
)}
```

---

## 使用示例

### 完整的创意生成流程

```typescript
import { refineBrief, generateCreativePackage, optimizeProposal, generateExecutionPlan } from './services/geminiService';
import * as db from './services/databaseService';

// 1. 用户登录
const user = db.createUser("john_doe");
db.setSessionUser(user);

// 2. 创建项目
const { newProject } = db.addProject("john_doe", "咖啡营销活动");

// 3. 提交初始需求
const initialBrief = {
  text: "为咖啡品牌 WakeUp 创作 Slogan",
  type: "Slogan"
};

// 4. AI 分析需求
const refinementData = await refineBrief(
  initialBrief.text,
  initialBrief.type
);

console.log("AI 理解:", refinementData.summary);
console.log("问题:", refinementData.questions);

// 5. 用户回答问题
const answers = "目标人群是都市白领，希望传达活力与品质...";
const fullBrief = `${initialBrief.text}\n补充信息: ${answers}`;

// 6. 生成创意包
const { inspirations, proposals } = await generateCreativePackage(
  fullBrief,
  `项目: ${newProject.name}`,
  (status) => console.log("状态:", status)
);

console.log("灵感案例:", inspirations);
console.log("创意方案:", proposals);

// 7. 优化方案
const optimizedProposal = await optimizeProposal(
  proposals[0],
  "能更幽默一点吗？",
  fullBrief
);

// 8. 生成执行计划
const executionPlan = await generateExecutionPlan(
  optimizedProposal,
  "Slogan",
  fullBrief
);

console.log("执行计划:", executionPlan);

// 9. 保存到数据库
const briefHistory: BriefHistoryItem = {
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  initialBrief,
  refinedBriefText: fullBrief,
  inspirations,
  proposals: [
    {
      ...optimizedProposal,
      id: crypto.randomUUID(),
      version: 1,
      isFinalized: true,
      executionDetails: executionPlan
    }
  ]
};

db.addOrUpdateBrief("john_doe", newProject.id, briefHistory);
```

---

## 性能优化建议

### 1. 请求超时控制

```typescript
const timeout = (ms: number) => 
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), ms)
  );

try {
  const result = await Promise.race([
    refineBrief(text, type),
    timeout(30000) // 30秒超时
  ]);
} catch (error) {
  console.error("请求超时或失败");
}
```

### 2. 结果缓存

```typescript
const cacheKey = `brief_${briefText}_${creativeType}`;
const cached = sessionStorage.getItem(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await refineBrief(briefText, creativeType);
sessionStorage.setItem(cacheKey, JSON.stringify(result));
return result;
```

### 3. 批量操作优化

```typescript
// 避免循环调用 saveDb
// ❌ 不好
for (let i = 0; i < 10; i++) {
  addProject(username, `Project ${i}`);
}

// ✅ 更好 - 批量添加后一次保存
const db = getDb();
const user = db[username];
for (let i = 0; i < 10; i++) {
  user.projects.push(createProjectObject(`Project ${i}`));
}
saveDb(db);
```

---

## 安全建议

### 1. API Key 保护

**当前问题**: API Key 暴露在前端

**推荐方案**: 创建后端代理

```typescript
// 后端 (Node.js/Express)
app.post('/api/generate', async (req, res) => {
  const { briefText, creativeType } = req.body;
  
  // 在服务器端调用 Gemini
  const result = await callGeminiAPI(briefText, creativeType);
  
  res.json(result);
});

// 前端
const result = await fetch('/api/generate', {
  method: 'POST',
  body: JSON.stringify({ briefText, creativeType })
});
```

### 2. 输入验证

```typescript
function validateBrief(text: string): boolean {
  if (!text || text.trim().length === 0) {
    throw new Error("需求描述不能为空");
  }
  if (text.length > 5000) {
    throw new Error("需求描述过长");
  }
  return true;
}
```

### 3. 数据清理

```typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/<script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}
```

---

**文档版本**: v1.0.0  
**最后更新**: 2025-10-25
