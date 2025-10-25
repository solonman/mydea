# Mydea 部署指南

本文档详细说明了 Mydea 应用的部署流程和最佳实践。

## 📋 目录

- [部署前准备](#部署前准备)
- [本地构建](#本地构建)
- [云平台部署](#云平台部署)
  - [Vercel 部署](#vercel-部署)
  - [Netlify 部署](#netlify-部署)
  - [Railway 部署](#railway-部署)
- [Docker 部署](#docker-部署)
- [环境变量配置](#环境变量配置)
- [生产优化](#生产优化)
- [监控与日志](#监控与日志)
- [故障排查](#故障排查)

---

## 部署前准备

### 必需条件

- ✅ Node.js >= 18.0.0
- ✅ npm >= 9.0.0
- ✅ Google Gemini API Key
- ✅ Git 版本控制

### 获取 Gemini API Key

1. 访问 [Google AI Studio](https://ai.google.dev/)
2. 登录 Google 账号
3. 创建新的 API Key
4. 复制并妥善保存

### 检查构建

```bash
# 安装依赖
npm install

# 运行开发服务器测试
npm run dev

# 执行生产构建
npm run build

# 预览构建结果
npm run preview
```

---

## 本地构建

### 构建步骤

```bash
# 1. 清理旧的构建文件
rm -rf dist

# 2. 执行构建
npm run build

# 3. 查看构建输出
ls -lh dist/
```

### 构建输出说明

```
dist/
├── assets/
│   ├── index-[hash].js      # 主应用 JS
│   ├── index-[hash].css     # 样式文件（如果有）
│   └── ...
├── index.html               # 入口 HTML
└── vite.svg                 # 静态资源
```

### 本地测试构建

```bash
# 启动预览服务器
npm run preview

# 访问 http://localhost:4173
```

---

## 云平台部署

### Vercel 部署

#### 方法 1: 通过 CLI

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署项目
vercel

# 4. 跟随提示配置:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? mydea
# - Directory? ./
# - Want to override settings? No

# 5. 部署到生产环境
vercel --prod
```

#### 方法 2: 通过 GitHub 自动部署

1. **推送代码到 GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/mydea.git
git push -u origin main
```

2. **连接 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "Import Project"
   - 选择你的 GitHub 仓库
   - 配置构建设置（自动检测）

3. **配置环境变量**
   - 在 Vercel Dashboard 中
   - Settings → Environment Variables
   - 添加: `GEMINI_API_KEY` = `your_key`
   - 环境: Production, Preview, Development

4. **触发部署**
   - 每次推送到 main 分支自动部署
   - 或手动触发重新部署

#### Vercel 配置文件 (可选)

创建 `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "regions": ["hkg1"],
  "env": {
    "GEMINI_API_KEY": "@gemini-api-key"
  }
}
```

---

### Netlify 部署

#### 方法 1: 通过拖拽部署

```bash
# 1. 构建项目
npm run build

# 2. 访问 Netlify
# https://app.netlify.com/drop

# 3. 拖拽 dist 文件夹到页面
```

#### 方法 2: 通过 CLI

```bash
# 1. 安装 Netlify CLI
npm install -g netlify-cli

# 2. 登录
netlify login

# 3. 初始化项目
netlify init

# 4. 部署
netlify deploy --prod
```

#### 方法 3: 通过 Git 集成

1. **推送代码到 GitHub**

2. **连接 Netlify**
   - 访问 [netlify.com](https://www.netlify.com)
   - New site from Git
   - 选择仓库

3. **构建设置**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

4. **环境变量**
   - Site settings → Environment variables
   - 添加: `GEMINI_API_KEY`

#### Netlify 配置文件

创建 `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

---

### Railway 部署

Railway 适合需要后端的场景。

#### 部署步骤

1. **访问 [Railway](https://railway.app)**

2. **创建新项目**
   - New Project → Deploy from GitHub repo

3. **配置**
   ```
   Build Command: npm run build
   Start Command: npm run preview
   ```

4. **环境变量**
   - Variables → Add Variable
   - `GEMINI_API_KEY`

5. **自定义域名** (可选)
   - Settings → Domains
   - Generate Domain 或添加自定义域名

---

## Docker 部署

### Dockerfile

创建 `Dockerfile`:

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

# 安装 serve 用于提供静态文件
RUN npm install -g serve

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mydea:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped
    networks:
      - mydea-network

networks:
  mydea-network:
    driver: bridge
```

### 构建和运行

```bash
# 构建镜像
docker build -t mydea:latest .

# 运行容器
docker run -d \
  --name mydea \
  -p 3000:3000 \
  -e GEMINI_API_KEY=your_api_key \
  mydea:latest

# 或使用 docker-compose
docker-compose up -d

# 查看日志
docker logs -f mydea

# 停止容器
docker stop mydea

# 删除容器
docker rm mydea
```

### 推送到 Docker Hub

```bash
# 登录
docker login

# 标记镜像
docker tag mydea:latest your-username/mydea:latest

# 推送
docker push your-username/mydea:latest
```

---

## 环境变量配置

### 开发环境

创建 `.env.local`:

```env
GEMINI_API_KEY=your_development_api_key
```

### 生产环境

**不同平台的配置方式**:

| 平台 | 配置位置 |
|------|---------|
| Vercel | Dashboard → Settings → Environment Variables |
| Netlify | Site settings → Build & deploy → Environment |
| Railway | Project → Variables |
| Docker | `-e` 参数或 `.env` 文件 |

### 必需的环境变量

```env
# Google Gemini API Key (必需)
GEMINI_API_KEY=your_api_key_here

# 可选配置
NODE_ENV=production
```

### 环境变量验证

在 `vite.config.ts` 中添加验证:

```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required');
  }
  
  return {
    // ... 其他配置
  };
});
```

---

## 生产优化

### 1. 代码优化

#### 启用代码分割

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

const ResultsView = lazy(() => import('./components/ResultsView'));
const ProjectDashboard = lazy(() => import('./components/ProjectDashboard'));

// 使用时
<Suspense fallback={<LoadingSpinner />}>
  <ResultsView {...props} />
</Suspense>
```

#### Tree Shaking

```typescript
// ✅ 好 - 只导入需要的
import { useState, useEffect } from 'react';

// ❌ 不好 - 导入整个库
import * as React from 'react';
```

### 2. 资源优化

#### 图片优化

```typescript
// 使用 WebP 格式
// 添加懒加载
<img 
  loading="lazy" 
  src={imageUrl} 
  alt={title}
  width={600}
  height={400}
/>
```

#### 字体优化

在 `index.html` 中:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link 
  rel="preload" 
  as="style"
  href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap"
>
```

### 3. Vite 配置优化

更新 `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip' })
  ],
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ai-vendor': ['@google/genai']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### 4. 缓存策略

添加 `_headers` 文件 (Netlify):

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: no-cache
```

### 5. CDN 配置

使用 CDN 加速静态资源：

```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.CDN_URL || '/',
  build: {
    assetsDir: 'static'
  }
});
```

---

## 监控与日志

### 1. 错误监控 - Sentry

```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// index.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your_sentry_dsn",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// 错误边界
import { ErrorBoundary } from "@sentry/react";

<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### 2. 性能监控 - Web Vitals

```bash
npm install web-vitals
```

```typescript
// index.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics({ name, delta, value, id }) {
  console.log({ name, delta, value, id });
  // 发送到分析服务
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 3. 分析工具 - Google Analytics

```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 4. 日志系统

```typescript
// utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, data);
    }
  },
  
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // 发送到监控服务
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  }
};
```

---

## 故障排查

### 常见问题

#### 1. 构建失败

**错误**: `Cannot find module`

**解决**:
```bash
# 清理依赖
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 清理缓存
npm cache clean --force
```

#### 2. API Key 无效

**错误**: `API_KEY environment variable not set`

**检查**:
```bash
# 确认环境变量已设置
echo $GEMINI_API_KEY

# 在部署平台检查环境变量配置
# Vercel: Settings → Environment Variables
# Netlify: Site settings → Environment
```

#### 3. 空白页面

**可能原因**:
- 路由配置问题
- JavaScript 错误

**解决**:
```bash
# 检查浏览器控制台错误
# 检查 Network 标签页

# 确认 base 路径配置
# vite.config.ts
export default defineConfig({
  base: '/' // 或你的子路径
});
```

#### 4. CORS 错误

**错误**: `Access to fetch has been blocked by CORS policy`

**解决**:
需要使用后端代理，不要在前端直接调用 Gemini API

#### 5. 性能问题

**检查项**:
```bash
# 构建大小分析
npm run build -- --report

# 使用 Lighthouse 检测
# Chrome DevTools → Lighthouse → Generate report
```

### 调试模式

```typescript
// 启用调试日志
if (process.env.NODE_ENV === 'development') {
  window.__MYDEA_DEBUG__ = true;
}

// 使用
if (window.__MYDEA_DEBUG__) {
  console.log('Debug info:', data);
}
```

---

## 部署检查清单

### 部署前

- [ ] 代码已提交到 Git
- [ ] 所有测试通过
- [ ] 环境变量已配置
- [ ] API Key 有效
- [ ] 构建成功 (`npm run build`)
- [ ] 本地预览正常 (`npm run preview`)

### 部署后

- [ ] 网站可访问
- [ ] 所有页面正常加载
- [ ] AI 功能正常工作
- [ ] 数据持久化正常
- [ ] 移动端显示正常
- [ ] 性能指标达标 (Lighthouse > 80)
- [ ] 错误监控已启用
- [ ] 备份策略已设置

---

## 回滚策略

### Vercel 回滚

```bash
# 查看部署历史
vercel ls

# 回滚到特定版本
vercel rollback <deployment-url>
```

### Git 回滚

```bash
# 查看提交历史
git log --oneline

# 回滚到特定提交
git revert <commit-hash>

# 强制回滚（慎用）
git reset --hard <commit-hash>
git push -f origin main
```

---

## 安全建议

### 1. 环境变量安全

- ❌ 不要将 API Key 提交到 Git
- ✅ 使用 `.env.local` (已在 `.gitignore` 中)
- ✅ 在部署平台单独配置

### 2. HTTPS 强制

所有主流平台默认启用 HTTPS：
- Vercel: 自动
- Netlify: 自动
- Railway: 自动

### 3. 请求限流

考虑在后端添加限流：

```typescript
// 伪代码
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100 // 最多 100 个请求
});

app.use('/api/', limiter);
```

### 4. 内容安全策略 (CSP)

添加到 `index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://aistudiocdn.com;
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src https://fonts.gstatic.com;">
```

---

## 成本优化

### 免费额度

| 平台 | 免费额度 | 限制 |
|------|---------|------|
| Vercel | 100 GB 带宽/月 | Hobby 计划 |
| Netlify | 100 GB 带宽/月 | 免费计划 |
| Railway | $5 免费额度/月 | 需绑卡 |

### Gemini API 定价

- 免费层: 每分钟 15 个请求
- 付费层: 按使用量计费

**优化建议**:
- 实现结果缓存
- 添加请求去重
- 使用更快的模型（flash vs pro）

---

## 更新维护

### 定期更新

```bash
# 检查过时的依赖
npm outdated

# 更新依赖
npm update

# 重大版本更新
npm install package@latest
```

### 自动化部署

使用 GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

**文档版本**: v1.0.0  
**最后更新**: 2025-10-25
