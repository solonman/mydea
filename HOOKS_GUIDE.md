# React Hooks 使用指南

本指南介绍如何使用 Mydea 项目的 React Hooks 来管理 Supabase 数据。

---

## 📚 可用的 Hooks

### 1. useSupabase - Supabase 基础 Hook

**用途**: 访问 Supabase 客户端和连接状态

**特性**:
- ✅ 自动测试数据库连接
- ✅ 提供连接状态
- ✅ 错误处理

**使用示例**:
```typescript
import { useSupabase } from './hooks';

function MyComponent() {
  const { supabase, status, isConnected, hasError, error } = useSupabase();

  if (status === 'connecting') {
    return <div>连接中...</div>;
  }

  if (hasError) {
    return <div>连接失败: {error?.message}</div>;
  }

  if (isConnected) {
    return <div>已连接到 Supabase</div>;
  }

  return null;
}
```

**返回值**:
```typescript
{
  supabase: SupabaseClient,      // Supabase 客户端实例
  status: ConnectionStatus,       // 连接状态
  error: Error | null,           // 错误信息
  isConnected: boolean,          // 是否已连接
  isConnecting: boolean,         // 是否正在连接
  hasError: boolean,             // 是否有错误
}
```

---

### 2. useProjects - 项目管理 Hook

**用途**: 管理用户的项目列表

**参数**:
- `userId: string | null` - 用户 ID
- `includeArchived?: boolean` - 是否包含已归档的项目（默认 false）

**使用示例**:
```typescript
import { useProjects } from './hooks';

function ProjectList({ userId }: { userId: string }) {
  const {
    projects,
    loading,
    error,
    stats,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    refresh,
  } = useProjects(userId);

  // 创建新项目
  const handleCreate = async () => {
    try {
      const newProject = await createProject({
        name: '新项目',
        description: '项目描述',
      });
      console.log('项目已创建:', newProject);
    } catch (error) {
      console.error('创建失败:', error);
    }
  };

  // 更新项目
  const handleUpdate = async (projectId: string) => {
    try {
      await updateProject(projectId, {
        name: '更新后的名称',
      });
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  // 归档项目
  const handleArchive = async (projectId: string) => {
    try {
      await archiveProject(projectId);
    } catch (error) {
      console.error('归档失败:', error);
    }
  };

  // 删除项目
  const handleDelete = async (projectId: string) => {
    if (confirm('确定删除这个项目吗？')) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <h2>我的项目 ({stats.active} 个活跃)</h2>
      <button onClick={handleCreate}>创建项目</button>
      <button onClick={refresh}>刷新</button>

      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
          <button onClick={() => handleUpdate(project.id)}>编辑</button>
          <button onClick={() => handleArchive(project.id)}>归档</button>
          <button onClick={() => handleDelete(project.id)}>删除</button>
        </div>
      ))}
    </div>
  );
}
```

**返回值**:
```typescript
{
  projects: Project[],                    // 项目列表
  loading: boolean,                       // 加载状态
  error: Error | null,                    // 错误信息
  stats: {                                // 统计信息
    total: number,
    active: number,
    archived: number,
  },
  createProject: (input) => Promise<Project>,      // 创建项目
  updateProject: (id, input) => Promise<Project>,  // 更新项目
  archiveProject: (id) => Promise<void>,           // 归档项目
  deleteProject: (id) => Promise<void>,            // 删除项目
  refresh: () => void,                             // 刷新列表
}
```

---

### 3. useSingleProject - 单个项目 Hook

**用途**: 获取单个项目的详情

**使用示例**:
```typescript
import { useSingleProject } from './hooks';

function ProjectDetails({ projectId }: { projectId: string }) {
  const { project, loading, error } = useSingleProject(projectId);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!project) return <div>项目不存在</div>;

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <p>状态: {project.status}</p>
      <p>创建时间: {new Date(project.created_at).toLocaleDateString()}</p>
    </div>
  );
}
```

---

### 4. useBriefs - 创意任务管理 Hook

**用途**: 管理项目的创意任务列表

**参数**:
- `projectId: string | null` - 项目 ID
- `includeArchived?: boolean` - 是否包含已归档的任务（默认 false）

**使用示例**:
```typescript
import { useBriefs } from './hooks';

function BriefList({ projectId }: { projectId: string }) {
  const {
    briefs,
    loading,
    error,
    createBrief,
    updateBrief,
    updateProposals,
    archiveBrief,
    deleteBrief,
    refresh,
  } = useBriefs(projectId);

  // 创建新任务
  const handleCreate = async () => {
    try {
      const newBrief = await createBrief({
        initial_brief: {
          text: '为咖啡品牌创作 Slogan',
          type: 'Slogan',
        },
        status: 'draft',
      });
      console.log('任务已创建:', newBrief);
    } catch (error) {
      console.error('创建失败:', error);
    }
  };

  // 更新任务
  const handleUpdate = async (briefId: string) => {
    try {
      await updateBrief(briefId, {
        refined_brief_text: '精炼后的需求文本',
        status: 'in_progress',
      });
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  // 更新创意方案
  const handleUpdateProposals = async (briefId: string) => {
    try {
      await updateProposals(briefId, [
        {
          id: '1',
          conceptTitle: '唤醒每一天',
          coreIdea: '强调咖啡的提神功能',
          detailedDescription: '...',
          example: '...',
          whyItWorks: '...',
          version: 1,
          isFinalized: false,
          executionDetails: null,
        },
      ]);
    } catch (error) {
      console.error('更新方案失败:', error);
    }
  };

  // 删除任务
  const handleDelete = async (briefId: string) => {
    if (confirm('确定删除这个任务吗？')) {
      try {
        await deleteBrief(briefId);
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <h2>创意任务 ({briefs.length} 个)</h2>
      <button onClick={handleCreate}>创建任务</button>
      <button onClick={refresh}>刷新</button>

      {briefs.map(brief => (
        <div key={brief.id}>
          <h3>{brief.initialBrief.text}</h3>
          <p>类型: {brief.initialBrief.type}</p>
          <p>方案数: {brief.proposals.length}</p>
          <button onClick={() => handleUpdate(brief.id)}>更新</button>
          <button onClick={() => handleUpdateProposals(brief.id)}>更新方案</button>
          <button onClick={() => handleDelete(brief.id)}>删除</button>
        </div>
      ))}
    </div>
  );
}
```

**返回值**:
```typescript
{
  briefs: BriefHistoryItem[],                     // 任务列表
  loading: boolean,                               // 加载状态
  error: Error | null,                            // 错误信息
  createBrief: (input) => Promise<BriefHistoryItem>,      // 创建任务
  updateBrief: (id, input) => Promise<BriefHistoryItem>,  // 更新任务
  updateProposals: (id, proposals) => Promise<BriefHistoryItem>, // 更新方案
  archiveBrief: (id) => Promise<void>,                    // 归档任务
  deleteBrief: (id) => Promise<void>,                     // 删除任务
  refresh: () => void,                                    // 刷新列表
}
```

---

### 5. useSingleBrief - 单个创意任务 Hook

**用途**: 获取单个创意任务的详情

**使用示例**:
```typescript
import { useSingleBrief } from './hooks';

function BriefDetails({ briefId }: { briefId: string }) {
  const { brief, loading, error, updateProposals } = useSingleBrief(briefId);

  // 更新当前任务的方案
  const handleUpdateProposals = async () => {
    try {
      await updateProposals([
        // ... 新的方案列表
      ]);
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!brief) return <div>任务不存在</div>;

  return (
    <div>
      <h1>{brief.initialBrief.text}</h1>
      <p>类型: {brief.initialBrief.type}</p>
      <p>精炼需求: {brief.refinedBriefText}</p>

      <h2>灵感案例 ({brief.inspirations.length})</h2>
      {brief.inspirations.map((inspiration, index) => (
        <div key={index}>
          <h3>{inspiration.title}</h3>
          <p>{inspiration.highlight}</p>
        </div>
      ))}

      <h2>创意方案 ({brief.proposals.length})</h2>
      {brief.proposals.map(proposal => (
        <div key={proposal.id}>
          <h3>{proposal.conceptTitle}</h3>
          <p>{proposal.coreIdea}</p>
        </div>
      ))}

      <button onClick={handleUpdateProposals}>更新方案</button>
    </div>
  );
}
```

---

## 🎯 最佳实践

### 1. 组合多个 Hooks

```typescript
function Dashboard({ userId }: { userId: string }) {
  // 获取用户的项目列表
  const { projects, loading: projectsLoading } = useProjects(userId);
  
  // 获取第一个项目的创意任务
  const firstProjectId = projects[0]?.id || null;
  const { briefs, loading: briefsLoading } = useBriefs(firstProjectId);

  const loading = projectsLoading || briefsLoading;

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <h2>项目: {projects.length}</h2>
      <h2>创意任务: {briefs.length}</h2>
    </div>
  );
}
```

### 2. 错误处理

```typescript
function MyComponent({ userId }: { userId: string }) {
  const { projects, error, refresh } = useProjects(userId);

  if (error) {
    return (
      <div>
        <p>加载失败: {error.message}</p>
        <button onClick={refresh}>重试</button>
      </div>
    );
  }

  return <div>...</div>;
}
```

### 3. 条件加载

```typescript
function ConditionalLoad({ userId, showArchived }: { userId: string; showArchived: boolean }) {
  // includeArchived 参数会触发重新加载
  const { projects } = useProjects(userId, showArchived);

  return <div>...</div>;
}
```

### 4. 手动刷新

```typescript
function ProjectListWithRefresh({ userId }: { userId: string }) {
  const { projects, refresh } = useProjects(userId);

  // 每 30 秒自动刷新
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div>
      <button onClick={refresh}>立即刷新</button>
      {/* ... */}
    </div>
  );
}
```

---

## 🔧 TypeScript 类型

所有 Hooks 都有完整的 TypeScript 类型定义：

```typescript
import type { Project, BriefHistoryItem, CreativeProposal } from './types';
import type { CreateProjectInput, UpdateProjectInput } from './services/supabase';

// 使用类型
const project: Project = { ... };
const brief: BriefHistoryItem = { ... };
```

---

## ⚡ 性能优化

### 1. 避免不必要的重新渲染

```typescript
// 使用 useMemo 缓存过滤结果
const activeProjects = useMemo(
  () => projects.filter(p => p.status === 'active'),
  [projects]
);
```

### 2. 使用 useCallback 缓存回调

```typescript
const handleCreate = useCallback(async () => {
  await createProject({ name: 'New Project' });
}, [createProject]);
```

### 3. 分页加载（未来实现）

```typescript
// 未来可以扩展支持分页
const { projects, loadMore, hasMore } = useProjects(userId, {
  pageSize: 10,
});
```

---

## 🐛 常见问题

### Q1: Hook 返回的数据为空？

**A**: 检查：
1. `userId` 或 `projectId` 是否正确
2. 是否已登录
3. Supabase 连接是否正常
4. 数据库中是否有数据

### Q2: 更新后列表没有刷新？

**A**: Hook 会自动更新列表。如果没有更新：
1. 检查是否有错误
2. 手动调用 `refresh()`
3. 检查网络连接

### Q3: 如何获取实时更新？

**A**: 目前 Hooks 不支持实时订阅。可以：
1. 使用 `refresh()` 手动刷新
2. 设置定时刷新
3. 未来版本将支持 Supabase Realtime

---

## 📚 相关文档

- [Supabase 服务文档](./SUPABASE_SERVICES_SUMMARY.md)
- [第二阶段进度](./PHASE_2_PROGRESS.md)
- [类型定义](./types.ts)

---

**创建日期**: 2025-10-25  
**版本**: v1.0.0  
**状态**: ✅ 已完成，可以使用
