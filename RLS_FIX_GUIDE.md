# RLS 策略修复指南

## 🔴 问题描述

错误信息：
```
new row violates row-level security policy for table "projects"
[ERROR] Failed to create project AppError: [object Object]
```

**原因**: Supabase 的 Row Level Security (RLS) 策略配置有问题。

---

## ✅ 解决方案（二选一）

### 方案 1: 更新 RLS 策略（推荐用于开发/测试）

#### 步骤：

1. **打开 Supabase Dashboard**
   - 访问: https://supabase.com
   - 进入你的项目

2. **打开 SQL Editor**
   - 左侧菜单 → SQL Editor
   - 点击 "New query"

3. **执行修复脚本**
   - 复制 `database/fix_rls_policies.sql` 的内容
   - 粘贴到 SQL Editor
   - 点击 "Run" 执行

4. **验证结果**
   ```sql
   -- 查看当前策略
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

   应该看到类似：
   ```
   users     | 允许匿名查看用户
   users     | 允许匿名创建用户
   projects  | 允许匿名查看项目
   projects  | 允许匿名创建项目
   ...
   ```

5. **刷新应用并重试**

---

### 方案 2: 临时禁用 RLS（快速测试）

⚠️ **仅用于开发测试，不适合生产环境**

#### 步骤：

1. **打开 Supabase Dashboard**
   - SQL Editor → New query

2. **禁用 RLS**
   ```sql
   -- 禁用所有表的 RLS
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
   ALTER TABLE briefs DISABLE ROW LEVEL SECURITY;
   ```

3. **测试完成后重新启用**
   ```sql
   -- 重新启用 RLS
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
   ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
   ```

---

## 🔍 验证修复

### 1. 刷新浏览器页面
```
按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
```

### 2. 重新测试创建项目
```
1. 登录应用
2. 选择 "+ 新建项目"
3. 输入项目名称
4. 点击"创建"
```

### 3. 检查控制台
应该看到：
```
[INFO] Creating project { userId: "...", name: "..." }
[INFO] Project created successfully { projectId: "..." }
```

### 4. 验证 Supabase 数据
```
1. Supabase Dashboard → Table Editor
2. 查看 projects 表
3. 应该有新记录
```

---

## 📝 为什么会出现这个问题？

### RLS 策略说明

Row Level Security (RLS) 是 PostgreSQL 的安全功能，用于控制谁可以访问哪些数据行。

**原来的策略**:
```sql
CREATE POLICY "用户可创建项目" ON projects
    FOR INSERT 
    WITH CHECK (user_id = current_user);
```

**问题**:
- `current_user` 是 PostgreSQL 用户，不是应用用户
- 使用 `anon` key 访问时，PostgreSQL 用户是 `anon`
- 但 `user_id` 字段存储的是应用用户 UUID
- 导致验证失败

**修复后的策略**:
```sql
CREATE POLICY "允许匿名创建项目" ON projects
    FOR INSERT 
    WITH CHECK (true);  -- 开发环境允许所有插入
```

---

## 🔐 生产环境建议

在生产环境中，应该：

### 1. 启用 Supabase Auth
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### 2. 使用正确的策略
```sql
-- 用户只能查看自己的项目
CREATE POLICY "用户只能查看自己的项目" ON projects
    FOR SELECT 
    USING (user_id = auth.uid());

-- 用户只能创建关联到自己的项目
CREATE POLICY "用户只能创建自己的项目" ON projects
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());
```

### 3. 在代码中使用认证
```typescript
// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// 获取当前用户
const { data: { user } } = await supabase.auth.getUser();

// 使用 user.id 作为 user_id
```

---

## 🚨 常见问题

### Q: 执行 SQL 后仍然报错？
A: 
1. 确认 SQL 执行成功（无错误提示）
2. 刷新浏览器（硬刷新 Ctrl+Shift+R）
3. 清除浏览器缓存
4. 重启开发服务器

### Q: 数据库中看不到策略？
A: 
```sql
-- 检查策略
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- 检查 RLS 是否启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Q: 生产环境如何迁移？
A: 
1. 先在开发环境测试 Auth 集成
2. 更新代码使用 Supabase Auth
3. 更新 RLS 策略使用 auth.uid()
4. 逐步迁移用户数据

---

## 📚 相关文档

- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS 文档](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)

---

**执行修复后，请重新测试并告诉我结果！** 🚀
