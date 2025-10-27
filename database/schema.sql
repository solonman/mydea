-- Mydea Database Schema for Supabase
-- 创建日期: 2025-10-25
-- 数据库: PostgreSQL (Supabase)

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 用户表 (Users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT username_length CHECK (char_length(username) >= 2 AND char_length(username) <= 50),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL)
);

-- 用户表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- 用户表注释
COMMENT ON TABLE users IS '用户表 - 存储应用用户信息';
COMMENT ON COLUMN users.id IS '用户唯一标识';
COMMENT ON COLUMN users.username IS '用户名（唯一）';
COMMENT ON COLUMN users.email IS '邮箱地址（可选）';
COMMENT ON COLUMN users.avatar_url IS '头像 URL';

-- ============================================
-- 项目表 (Projects)
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT project_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 200)
);

-- 项目表索引
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_user_status ON projects(user_id, status);

-- 项目表注释
COMMENT ON TABLE projects IS '项目表 - 存储用户的创意项目';
COMMENT ON COLUMN projects.id IS '项目唯一标识';
COMMENT ON COLUMN projects.user_id IS '所属用户 ID';
COMMENT ON COLUMN projects.name IS '项目名称';
COMMENT ON COLUMN projects.description IS '项目描述';
COMMENT ON COLUMN projects.status IS '项目状态: active-活跃, archived-归档, deleted-删除';

-- ============================================
-- 创意任务表 (Briefs)
-- ============================================
CREATE TABLE IF NOT EXISTS briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- 初始需求
    initial_brief JSONB NOT NULL,
    -- initial_brief 结构: { text: string, type: CreativeType }
    
    -- 精炼后的需求
    refined_brief_text TEXT,
    
    -- 灵感案例
    inspirations JSONB,
    -- inspirations 结构: [{ title, highlight, imageUrl, sourceUrl? }]
    
    -- 创意方案
    proposals JSONB,
    -- proposals 结构: [{ id, conceptTitle, coreIdea, detailedDescription, example, whyItWorks, version, history?, isFinalized, executionDetails? }]
    
    -- 状态和标签
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
    tags TEXT[],
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT initial_brief_required CHECK (initial_brief IS NOT NULL AND initial_brief != '{}'::jsonb)
);

-- 创意任务表索引
CREATE INDEX idx_briefs_project_id ON briefs(project_id);
CREATE INDEX idx_briefs_status ON briefs(status);
CREATE INDEX idx_briefs_created_at ON briefs(created_at DESC);
CREATE INDEX idx_briefs_project_status ON briefs(project_id, status);

-- JSONB 字段 GIN 索引（加速 JSON 查询）
CREATE INDEX idx_briefs_initial_brief ON briefs USING GIN (initial_brief);
CREATE INDEX idx_briefs_inspirations ON briefs USING GIN (inspirations);
CREATE INDEX idx_briefs_proposals ON briefs USING GIN (proposals);

-- 创意任务表注释
COMMENT ON TABLE briefs IS '创意任务表 - 存储用户的创意生成任务';
COMMENT ON COLUMN briefs.id IS '任务唯一标识';
COMMENT ON COLUMN briefs.project_id IS '所属项目 ID';
COMMENT ON COLUMN briefs.initial_brief IS '初始创意需求 (JSONB)';
COMMENT ON COLUMN briefs.refined_brief_text IS '精炼后的需求文本';
COMMENT ON COLUMN briefs.inspirations IS '灵感案例列表 (JSONB)';
COMMENT ON COLUMN briefs.proposals IS '创意方案列表 (JSONB)';
COMMENT ON COLUMN briefs.status IS '任务状态: draft-草稿, in_progress-进行中, completed-已完成, archived-已归档';
COMMENT ON COLUMN briefs.tags IS '标签列表';

-- ============================================
-- 触发器: 自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表创建更新触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefs_updated_at
    BEFORE UPDATE ON briefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

-- 用户表策略（暂时允许所有操作，后续可根据需求调整）
CREATE POLICY "允许所有用户查看" ON users FOR SELECT USING (true);
CREATE POLICY "允许用户创建" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "允许用户更新自己的信息" ON users FOR UPDATE USING (true);

-- 项目表策略
CREATE POLICY "用户可查看自己的项目" ON projects 
    FOR SELECT USING (user_id = (SELECT id FROM users WHERE username = current_user));

CREATE POLICY "用户可创建项目" ON projects 
    FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE username = current_user));

CREATE POLICY "用户可更新自己的项目" ON projects 
    FOR UPDATE USING (user_id = (SELECT id FROM users WHERE username = current_user));

CREATE POLICY "用户可删除自己的项目" ON projects 
    FOR DELETE USING (user_id = (SELECT id FROM users WHERE username = current_user));

-- 创意任务表策略（通过项目关联）
CREATE POLICY "用户可查看自己项目的任务" ON briefs 
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = (SELECT id FROM users WHERE username = current_user)
        )
    );

CREATE POLICY "用户可创建任务" ON briefs 
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = (SELECT id FROM users WHERE username = current_user)
        )
    );

CREATE POLICY "用户可更新自己项目的任务" ON briefs 
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = (SELECT id FROM users WHERE username = current_user)
        )
    );

CREATE POLICY "用户可删除自己项目的任务" ON briefs 
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = (SELECT id FROM users WHERE username = current_user)
        )
    );

-- ============================================
-- 测试数据（开发环境使用）
-- ============================================

-- 插入测试用户
-- INSERT INTO users (username, email) VALUES 
--     ('testuser', 'test@example.com'),
--     ('demo', 'demo@example.com');

-- 插入测试项目
-- INSERT INTO projects (user_id, name, description) VALUES 
--     ((SELECT id FROM users WHERE username = 'testuser'), '春季营销活动', '2025年春季产品推广'),
--     ((SELECT id FROM users WHERE username = 'testuser'), '品牌焕新', '品牌形象升级项目');

-- ============================================
-- 数据库性能优化
-- ============================================

-- 定期清理归档数据的函数（可选）
CREATE OR REPLACE FUNCTION archive_old_briefs()
RETURNS void AS $$
BEGIN
    UPDATE briefs
    SET status = 'archived'
    WHERE status = 'completed'
    AND updated_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 可以设置定时任务执行: SELECT archive_old_briefs();

-- ============================================
-- 查询示例（供参考）
-- ============================================

-- 1. 查询用户的所有项目
-- SELECT p.* FROM projects p
-- JOIN users u ON p.user_id = u.id
-- WHERE u.username = 'testuser'
-- ORDER BY p.created_at DESC;

-- 2. 查询项目的所有创意任务
-- SELECT b.* FROM briefs b
-- WHERE b.project_id = 'project_uuid_here'
-- ORDER BY b.created_at DESC;

-- 3. 查询用户最近的创意任务
-- SELECT b.*, p.name as project_name
-- FROM briefs b
-- JOIN projects p ON b.project_id = p.id
-- JOIN users u ON p.user_id = u.id
-- WHERE u.username = 'testuser'
-- ORDER BY b.created_at DESC
-- LIMIT 10;

-- 4. 统计用户的项目和任务数量
-- SELECT 
--     u.username,
--     COUNT(DISTINCT p.id) as project_count,
--     COUNT(b.id) as brief_count
-- FROM users u
-- LEFT JOIN projects p ON u.id = p.user_id
-- LEFT JOIN briefs b ON p.id = b.project_id
-- WHERE u.username = 'testuser'
-- GROUP BY u.username;

-- ============================================
-- 备份和恢复建议
-- ============================================

-- 1. 导出数据
-- pg_dump -h your_host -U your_user -d your_db -F c -b -v -f backup.dump

-- 2. 恢复数据
-- pg_restore -h your_host -U your_user -d your_db -v backup.dump

-- ============================================
-- Schema 版本信息
-- ============================================
CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES
    ('1.0.0', '初始数据库 schema');

-- ============================================
-- 完成
-- ============================================
-- Schema 创建完成
-- 下一步: 在 Supabase 控制台运行此 SQL 脚本
