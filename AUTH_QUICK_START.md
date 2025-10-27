# 认证功能快速开始 🚀

5 分钟快速配置邮箱验证注册功能。

---

## ✅ 第一步：配置 Supabase（2 分钟）

### 1. 启用邮箱认证

1. 打开 [Supabase Dashboard](https://supabase.com)
2. 选择你的项目
3. 进入 **Authentication** → **Providers**
4. 找到 **Email** provider
5. 确保以下选项已勾选：
   ```
   ✅ Enable Email provider
   ✅ Confirm email
   ```

### 2. 配置回调 URL

1. 进入 **Authentication** → **URL Configuration**
2. 在 **Redirect URLs** 中添加：
   ```
   http://localhost:5173/auth/callback
   ```
3. **Site URL** 设置为：
   ```
   http://localhost:5173
   ```

### 3. 执行数据库 SQL

在 **SQL Editor** 中运行：

```sql
-- 添加 auth_user_id 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- 创建自动关联触发器
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, auth_user_id, username, email)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
```

---

## ✅ 第二步：启动应用（1 分钟）

```bash
# 1. 确保环境变量已配置（应该已经有了）
cat .env.local

# 应该包含：
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# 2. 启动开发服务器
npm run dev
```

---

## ✅ 第三步：测试注册（2 分钟）

### 1. 打开应用

访问：http://localhost:5173

### 2. 注册新用户

1. 点击 **"没有账户？立即注册"**
2. 填写表单：
   - 用户名：`testuser`
   - 邮箱：使用你的真实邮箱（以便接收验证邮件）
   - 密码：`test123456`（至少 6 位）
3. 点击 **"注册并开始"**

### 3. 验证邮箱

1. 打开你的邮箱
2. 查找来自 Supabase 的验证邮件
3. 点击邮件中的 **"Confirm your mail"** 链接
4. 浏览器会跳转回应用

### 4. 登录

1. 返回登录页面
2. 填写：
   - 邮箱：刚才注册的邮箱
   - 密码：刚才设置的密码
3. 点击 **"登录"**
4. ✅ 成功进入应用！

---

## 🎉 完成！

现在你可以：
- ✅ 使用邮箱和密码注册
- ✅ 邮箱验证后登录
- ✅ 关闭浏览器后自动登录
- ✅ 安全退出登录

---

## 📝 常见问题

### Q: 没收到验证邮件？

**A**: 检查以下几点：
1. 查看垃圾邮件文件夹
2. 确认邮箱地址输入正确
3. 等待几分钟（可能有延迟）
4. Supabase 免费版每小时限制发送 4 封邮件

### Q: 提示"请先验证您的邮箱"？

**A**: 
1. 检查邮箱，点击验证链接
2. 如果没收到邮件，可以在登录页重新注册（会提示"邮箱已被注册"）
3. 或者在 Supabase Dashboard 手动标记为已验证：
   - Authentication → Users
   - 找到该用户
   - Email Confirmed → 设为 true

### Q: 提示"邮箱或密码错误"？

**A**: 
1. 确认密码正确
2. 确认使用的是注册时的邮箱
3. 检查邮箱是否已验证

---

## 🔜 下一步

想要添加微信登录？

查看：[`AUTH_SETUP_GUIDE.md`](./AUTH_SETUP_GUIDE.md) 的 Part 2

---

**配置时间**: 约 5 分钟  
**状态**: ✅ 可立即使用  
**版本**: v1.0.0
