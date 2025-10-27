# Supabase 配置指南

本指南帮助你完成 Supabase 数据库的配置，实现数据持久化存储。

---

## 📋 准备工作

### 1. 注册 Supabase 账号

1. 访问 [Supabase 官网](https://supabase.com/)
2. 点击 "Start your project" 或 "Sign Up"
3. 使用 GitHub 账号或邮箱注册
4. 验证邮箱（如果使用邮箱注册）

---

## 🚀 创建 Supabase 项目

### 步骤 1: 新建项目

1. 登录后，点击 "New Project"
2. 选择组织（Organization）或创建新组织
3. 填写项目信息：
   - **Name**: `mydea-db`（或其他名称）
   - **Database Password**: 设置一个强密码（**务必保存**）
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或离你最近的区域
   - **Pricing Plan**: 选择 `Free` 免费版

4. 点击 "Create new project"
5. 等待 1-2 分钟，项目创建完成

---

### 步骤 2: 获取 API 密钥

项目创建完成后：

1. 在左侧菜单点击 **Settings** (齿轮图标)
2. 选择 **API**
3. 找到以下信息：

```
Project URL: https://your-project-id.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**重要**: 
- ✅ `anon public` key 可以在前端使用（安全）
- ❌ `service_role` key **不要**在前端使用（敏感）

---

## 🗄️ 创建数据库表

### 步骤 3: 运行 SQL Schema

1. 在左侧菜单点击 **SQL Editor**
2. 点击 **New Query**
3. 复制 `database/schema.sql` 文件的所有内容
4. 粘贴到 SQL 编辑器
5. 点击右下角的 **Run** 按钮（或按 `Ctrl/Cmd + Enter`）

**预期结果**:
```
Success. No rows returned
```

---

### 步骤 4: 验证表创建

1. 在左侧菜单点击 **Table Editor**
2. 应该看到三个表：
   - ✅ `users` - 用户表
   - ✅ `projects` - 项目表
   - ✅ `briefs` - 创意任务表

3. 点击每个表，查看列结构

---

## ⚙️ 配置应用环境变量

### 步骤 5: 更新 `.env.local`

打开项目根目录的 `.env.local` 文件，添加 Supabase 配置：

```env
# Gemini API Key (已有)
GEMINI_API_KEY=your_existing_gemini_key_here

# Supabase 配置 (新增)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**注意**:
- 替换 `your-project-id` 为你的实际项目 ID
- 替换 `eyJ...` 为你的实际 anon key
- 使用 `VITE_` 前缀是 Vite 的要求

---

### 步骤 6: 重启开发服务器

配置完成后，重启开发服务器使环境变量生效：

```bash
# 在终端中按 Ctrl+C 停止当前服务器
# 然后重新启动
npm run dev
```

---

## ✅ 测试数据库连接

### 步骤 7: 测试连接

开发服务器启动后：

1. 打开浏览器控制台（F12）
2. 查看控制台日志
3. 应该看到：
   ```
   [INFO] Supabase client initialized { url: "https://..." }
   ```

如果看到这条日志，说明连接成功！ 🎉

---

## 🔍 验证数据库功能

### 手动测试（可选）

在 Supabase SQL Editor 中运行以下测试：

```sql
-- 1. 创建测试用户
INSERT INTO users (username, email) 
VALUES ('testuser', 'test@example.com')
RETURNING *;

-- 2. 查询用户
SELECT * FROM users WHERE username = 'testuser';

-- 3. 创建测试项目
INSERT INTO projects (user_id, name, description)
VALUES (
  (SELECT id FROM users WHERE username = 'testuser'),
  '测试项目',
  '这是一个测试项目'
)
RETURNING *;

-- 4. 查询项目
SELECT p.*, u.username 
FROM projects p
JOIN users u ON p.user_id = u.id
WHERE u.username = 'testuser';
```

---

## 🔐 安全配置

### Row Level Security (RLS)

我们的 schema 已经启用了 RLS，确保：
- ✅ 用户只能访问自己的数据
- ✅ 不能查看或修改其他用户的数据

### 验证 RLS 策略

在 Supabase 控制台：

1. 点击 **Authentication** → **Policies**
2. 选择表（如 `projects`）
3. 查看已创建的策略

---

## 📊 数据库监控

### 查看数据

1. **Table Editor**: 直观查看和编辑数据
2. **SQL Editor**: 执行复杂查询
3. **Database** → **Reports**: 查看数据库统计

### 性能监控

1. 点击 **Database** → **Reports**
2. 查看：
   - 查询性能
   - 索引使用情况
   - 慢查询日志

---

## 🔄 数据迁移

### 从 localStorage 迁移到 Supabase

数据迁移工具将在下一步实现。目前可以：

**选项 1: 保留 localStorage 数据**
- 应用将同时支持 localStorage 和 Supabase
- 现有数据保留在 localStorage
- 新数据存储到 Supabase

**选项 2: 手动迁移**
1. 在应用中导出 localStorage 数据
2. 使用迁移工具导入到 Supabase

---

## 💰 免费额度说明

Supabase 免费版包含：

| 资源 | 免费额度 |
|------|---------|
| 数据库 | 500 MB |
| 文件存储 | 1 GB |
| 带宽 | 5 GB/月 |
| API 请求 | 无限制 |
| 行数 | 无限制 |
| 并发连接 | 60 个 |

**足够个人项目使用！** ✅

---

## ❓ 常见问题

### Q1: 忘记了数据库密码怎么办？

**A**: 可以重置密码：
1. Settings → Database
2. 点击 "Reset Database Password"
3. 设置新密码

### Q2: 如何备份数据？

**A**: 免费版不提供自动备份，建议：
1. 定期导出数据（SQL Editor）
2. 使用版本控制（Git）管理 schema
3. 升级到付费版获得自动备份

### Q3: 连接失败怎么办？

**A**: 检查：
1. ✅ URL 和 Key 是否正确
2. ✅ 是否使用了 `VITE_` 前缀
3. ✅ 是否重启了开发服务器
4. ✅ 网络连接是否正常

### Q4: RLS 策略导致查询失败？

**A**: 
1. 检查是否登录了正确的用户
2. 在 SQL Editor 中测试策略
3. 临时禁用 RLS 测试（仅开发环境）

---

## 📚 更多资源

- [Supabase 官方文档](https://supabase.com/docs)
- [JavaScript 客户端文档](https://supabase.com/docs/reference/javascript)
- [SQL 教程](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ 配置完成检查清单

完成以下检查，确认配置正确：

- [ ] Supabase 项目已创建
- [ ] 获取了 Project URL
- [ ] 获取了 anon public key
- [ ] 运行了 schema.sql
- [ ] 看到三个表（users, projects, briefs）
- [ ] 更新了 `.env.local`
- [ ] 重启了开发服务器
- [ ] 控制台显示 "Supabase client initialized"
- [ ] 测试查询成功

---

## 🎉 下一步

配置完成后，进行以下操作：

1. ✅ **实现数据服务** - 创建 CRUD 操作
2. ✅ **更新应用逻辑** - 集成 Supabase 到组件
3. ✅ **数据迁移工具** - 从 localStorage 迁移
4. ✅ **测试验证** - 完整功能测试

---

**配置日期**: 2025-10-25  
**版本**: v1.0.0  
**状态**: 准备就绪 🚀
