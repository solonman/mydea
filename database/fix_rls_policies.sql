-- 修复 RLS 策略
-- 这个脚本更新了 RLS 策略，使其与匿名访问兼容

-- ============================================
-- 删除旧的策略
-- ============================================

-- 用户表策略
DROP POLICY IF EXISTS "允许所有用户查看" ON users;
DROP POLICY IF EXISTS "允许用户创建" ON users;
DROP POLICY IF EXISTS "允许用户更新自己的信息" ON users;

-- 项目表策略
DROP POLICY IF EXISTS "用户可查看自己的项目" ON projects;
DROP POLICY IF EXISTS "用户可创建项目" ON projects;
DROP POLICY IF EXISTS "用户可更新自己的项目" ON projects;
DROP POLICY IF EXISTS "用户可删除自己的项目" ON projects;

-- 创意任务表策略
DROP POLICY IF EXISTS "用户可查看自己项目的任务" ON briefs;
DROP POLICY IF EXISTS "用户可创建任务" ON briefs;
DROP POLICY IF EXISTS "用户可更新自己项目的任务" ON briefs;
DROP POLICY IF EXISTS "用户可删除自己项目的任务" ON briefs;

-- ============================================
-- 创建新的宽松策略（开发/测试环境使用）
-- ============================================

-- 用户表 - 允许所有操作（使用 anon key）
CREATE POLICY "允许匿名查看用户" ON users
    FOR SELECT 
    USING (true);

CREATE POLICY "允许匿名创建用户" ON users
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "允许匿名更新用户" ON users
    FOR UPDATE 
    USING (true);

CREATE POLICY "允许匿名删除用户" ON users
    FOR DELETE 
    USING (true);

-- 项目表 - 允许所有操作
CREATE POLICY "允许匿名查看项目" ON projects
    FOR SELECT 
    USING (true);

CREATE POLICY "允许匿名创建项目" ON projects
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "允许匿名更新项目" ON projects
    FOR UPDATE 
    USING (true);

CREATE POLICY "允许匿名删除项目" ON projects
    FOR DELETE 
    USING (true);

-- 创意任务表 - 允许所有操作
CREATE POLICY "允许匿名查看任务" ON briefs
    FOR SELECT 
    USING (true);

CREATE POLICY "允许匿名创建任务" ON briefs
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "允许匿名更新任务" ON briefs
    FOR UPDATE 
    USING (true);

CREATE POLICY "允许匿名删除任务" ON briefs
    FOR DELETE 
    USING (true);

-- ============================================
-- 验证策略
-- ============================================

-- 查看所有策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 注意事项
-- ============================================

-- 这些是宽松的策略，适合开发和测试环境
-- 在生产环境中，你应该：
-- 1. 启用 Supabase Auth
-- 2. 使用 auth.uid() 而不是 true
-- 3. 确保用户只能访问自己的数据

-- 生产环境示例策略：
-- CREATE POLICY "用户只能查看自己的项目" ON projects
--     FOR SELECT 
--     USING (user_id = auth.uid());
