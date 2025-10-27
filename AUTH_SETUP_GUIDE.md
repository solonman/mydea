# 认证功能配置指南 🔐

本指南帮助你配置邮箱验证注册和微信扫码登录功能。

---

## 📋 功能概述

应用现在支持三种认证方式：
1. ✅ **邮箱验证注册** - 使用 Supabase Auth
2. ✅ **邮箱密码登录** - 安全的密码认证
3. ✅ **微信扫码登录** - 第三方 OAuth 登录

---

## 🚀 Part 1: 配置 Supabase 邮箱认证

### 步骤 1: 启用邮箱认证

1. 打开 Supabase Dashboard
2. 进入 **Authentication** → **Providers**
3. 找到 **Email** provider
4. 确保 **Enable Email provider** 已开启
5. 配置以下选项：

```
✅ Enable Email provider
✅ Confirm email (启用邮箱验证)
✅ Secure email change (安全的邮箱更改)
```

### 步骤 2: 配置邮件模板

1. 进入 **Authentication** → **Email Templates**
2. 选择 **Confirm signup** 模板
3. 自定义邮件内容（可选）：

```html
<h2>欢迎加入 Mydea！</h2>
<p>感谢您注册 Mydea，您的专属 AI 广告创意伙伴。</p>
<p>请点击下面的链接验证您的邮箱：</p>
<p><a href="{{ .ConfirmationURL }}">验证邮箱</a></p>
<p>此链接将在 24 小时后过期。</p>
```

### 步骤 3: 配置回调 URL

1. 进入 **Authentication** → **URL Configuration**
2. 添加 **Redirect URLs**：

```
开发环境：
http://localhost:5173/auth/callback
http://localhost:3001/auth/callback

生产环境：
https://yourdomain.com/auth/callback
```

3. **Site URL** 设置为：
```
开发环境: http://localhost:5173
生产环境: https://yourdomain.com
```

### 步骤 4: 更新环境变量

编辑 `.env.local` 文件（无需修改，Supabase 配置已经够用）：

```env
# 已有的配置
GEMINI_API_KEY=your_gemini_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 邮箱认证不需要额外配置
```

---

## 🔧 Part 2: 配置微信扫码登录

### 准备工作

1. **注册微信开放平台账号**
   - 访问：https://open.weixin.qq.com/
   - 需要企业认证（需营业执照）

2. **创建网站应用**
   - 开放平台控制台 → 网站应用 → 创建应用
   - 填写应用信息
   - 配置授权回调域（如：`yourdomain.com`）

3. **获取 AppID 和 AppSecret**
   - 应用创建成功后获得
   - **AppSecret 不要泄露！**

### 步骤 1: 配置环境变量

编辑 `.env.local` 文件，添加微信配置：

```env
# 微信开放平台配置
VITE_WECHAT_APP_ID=your_wechat_app_id

# AppSecret 不要放在前端！
# 应该配置在后端 API 中
```

### 步骤 2: 创建后端 API 接口

微信登录需要后端 API 处理，因为 `AppSecret` 不能暴露在前端。

创建 `/api/auth/wechat` 接口：

```typescript
// 示例：Next.js API Route
// pages/api/auth/wechat.ts
export default async function handler(req, res) {
  const { code } = req.body;
  
  // 1. 使用 code 换取 access_token
  const tokenResponse = await fetch(
    `https://api.weixin.qq.com/sns/oauth2/access_token?` +
    `appid=${process.env.WECHAT_APP_ID}&` +
    `secret=${process.env.WECHAT_APP_SECRET}&` +
    `code=${code}&` +
    `grant_type=authorization_code`
  );
  
  const tokenData = await tokenResponse.json();
  
  if (tokenData.errcode) {
    return res.status(400).json({ error: tokenData.errmsg });
  }
  
  // 2. 使用 access_token 获取用户信息
  const userResponse = await fetch(
    `https://api.weixin.qq.com/sns/userinfo?` +
    `access_token=${tokenData.access_token}&` +
    `openid=${tokenData.openid}`
  );
  
  const userData = await userResponse.json();
  
  // 3. 创建或更新 Supabase 用户
  // ... 你的业务逻辑
  
  res.json({ user: userData });
}
```

### 步骤 3: 配置回调路由

创建微信回调页面（可选，前端已处理）：

```typescript
// pages/auth/wechat/callback.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { handleWeChatCallback } from '@/services/supabase';

export default function WeChatCallback() {
  const router = useRouter();
  const { code, state } = router.query;
  
  useEffect(() => {
    if (code) {
      handleWeChatCallback(code as string)
        .then(() => router.push('/'))
        .catch(err => console.error(err));
    }
  }, [code, state]);
  
  return <div>正在登录...</div>;
}
```

---

## 📝 Part 3: 数据库配置（Supabase Auth 集成）

### Auth 用户与应用用户关联

Supabase Auth 用户存储在 `auth.users` 表中，我们需要在自己的 `users` 表中关联：

```sql
-- 添加 auth_user_id 字段（如果还没有）
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- 创建触发器：当 Auth 用户创建时，自动创建应用用户
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

-- 绑定触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
```

---

## 🧪 测试功能

### 测试邮箱注册

1. 打开应用登录页
2. 点击"没有账户？立即注册"
3. 填写：
   - 用户名：testuser
   - 邮箱：test@example.com
   - 密码：test123456
4. 点击"注册并开始"
5. 查看邮箱，点击验证链接
6. 返回应用，使用邮箱和密码登录

### 测试邮箱登录

1. 打开应用登录页
2. 填写已注册的邮箱和密码
3. 点击"登录"
4. 应该直接进入应用

### 测试微信登录（需要先配置后端）

1. 打开应用登录页
2. 点击"微信扫码登录"
3. 使用微信扫描二维码
4. 授权后自动登录

---

## 🔍 调试技巧

### 查看认证日志

浏览器控制台会显示详细日志：

```
[INFO] User attempting email signup { email: "...", username: "..." }
[INFO] Email signup successful { userId: "...", emailConfirmed: false }
```

### 查看 Supabase Auth 用户

1. Supabase Dashboard → Authentication → Users
2. 可以看到所有注册用户
3. 查看邮箱验证状态

### 常见错误

**错误 1: "邮箱已被注册"**
- 原因：该邮箱已经注册过
- 解决：直接登录或使用其他邮箱

**错误 2: "请先验证您的邮箱"**
- 原因：注册后未验证邮箱
- 解决：检查邮箱，点击验证链接

**错误 3: "微信登录失败"**
- 原因：后端 API 未配置或 AppID 错误
- 解决：检查环境变量和后端接口

---

## 🚀 生产环境注意事项

### 1. HTTPS 必须

微信登录要求网站必须使用 HTTPS。

### 2. 邮件发送配置

Supabase 免费版每小时限制发送 4 封邮件。生产环境建议：

1. 配置自定义 SMTP 服务器
2. 使用 SendGrid、Mailgun 等邮件服务
3. 在 Supabase Dashboard → Settings → Auth 中配置

### 3. 密码安全

- ✅ 最小长度：6 个字符
- ✅ Supabase 自动加密存储
- ✅ 支持密码重置功能

### 4. 会话管理

- ✅ 会话自动刷新（refreshToken）
- ✅ 持久化存储在 localStorage
- ✅ 支持多标签页同步

---

## 📚 API 文档

### signUpWithEmail()

```typescript
import { signUpWithEmail } from './services/supabase';

const authUser = await signUpWithEmail({
  email: 'user@example.com',
  password: 'password123',
  username: 'myusername',
});

// 返回：
// {
//   id: "uuid",
//   email: "user@example.com",
//   email_confirmed_at: null,  // 待验证
//   user_metadata: { username: "myusername" }
// }
```

### signInWithEmail()

```typescript
import { signInWithEmail } from './services/supabase';

const authUser = await signInWithEmail({
  email: 'user@example.com',
  password: 'password123',
});
```

### getCurrentAuthUser()

```typescript
import { getCurrentAuthUser } from './services/supabase';

const authUser = await getCurrentAuthUser();
if (authUser) {
  console.log('已登录:', authUser.email);
} else {
  console.log('未登录');
}
```

### onAuthStateChange()

```typescript
import { onAuthStateChange } from './services/supabase';

const unsubscribe = onAuthStateChange((user) => {
  if (user) {
    console.log('用户登录:', user.email);
  } else {
    console.log('用户登出');
  }
});

// 组件卸载时取消监听
return () => unsubscribe();
```

---

## ✅ 配置检查清单

### Supabase 配置
- [ ] Email provider 已启用
- [ ] Confirm email 已开启
- [ ] Redirect URLs 已配置
- [ ] Site URL 已配置
- [ ] 邮件模板已自定义（可选）

### 环境变量
- [ ] VITE_SUPABASE_URL 已配置
- [ ] VITE_SUPABASE_ANON_KEY 已配置
- [ ] VITE_WECHAT_APP_ID 已配置（如使用微信登录）

### 数据库
- [ ] users 表有 auth_user_id 字段
- [ ] 触发器已创建（自动关联用户）

### 代码
- [ ] LoginScreen 组件已更新
- [ ] App.tsx 认证逻辑已集成
- [ ] authService.ts 已创建

---

**配置完成时间**: 约 30 分钟  
**状态**: ✅ 邮箱认证可立即使用，微信登录需要后端支持  
**文档版本**: v1.0.0
