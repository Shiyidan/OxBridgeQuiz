# 在线试卷解析与答题系统

## 项目概述

面向 G5 入学考试的在线试卷解析与答题 Web 应用。支持 PDF 试卷自动解析（Qwen 大模型识别题目、公式、图形）、在线答题、诊断测评和后台管理。

**核心功能**：

1. **PDF 解析** — 上传 PDF 试卷，自动识别题目、选项、公式，结构化入库
2. **在线答题** — 加载结构化试卷，渲染公式/图片，支持答题和评分
3. **诊断测评** — 随机出题 → 提交 → 智能批改 → 生成知识分析报告
4. **用户系统** — 注册/登录（JWT），角色管理（学生/管理员）
5. **管理后台** — 试卷管理、用户管理、解析任务监控

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Express（Node.js + TypeScript） |
| 数据库 ORM | Prisma（MySQL） |
| 认证 | JWT（bcryptjs 密码加密） |
| AI 识别 | Qwen-VL-Max（阿里云 DashScope） |
| PDF 处理 | pdf.js（浏览器端渲染） |
| 前端框架 | Vue 3（Composition API + TypeScript） |
| 状态管理 | Pinia |
| HTTP 客户端 | Axios |
| 公式渲染 | KaTeX |
| 样式 | SCSS |

## 项目结构

```text
QuizTestDemo/
├── api/                          # 后端 API
│   ├── src/
│   │   ├── index.ts              # 服务入口（Express, 端口 3001）
│   │   ├── config.ts             # 环境变量读取
│   │   ├── routes/               # 路由（auth / papers / upload / parse / diagnostic / admin）
│   │   ├── middleware/           # 中间件（JWT 认证 / 管理员权限）
│   │   ├── services/             # 业务层（Prisma / JWT / Qwen / 诊断评分）
│   │   └── utils/response.ts     # 统一响应格式工具
│   ├── prisma/schema.prisma      # 数据模型（Paper / User / DiagnosticSession 等 6 表）
│   └── package.json
│
├── quiz-web/                     # 前端
│   ├── src/
│   │   ├── router/index.ts       # 路由配置 + 导航守卫
│   │   ├── stores/               # Pinia 状态（auth / exam）
│   │   ├── utils/                # Axios 实例 + 表单校验
│   │   ├── components/           # 共享组件（NavBar / QuestionCard / FormulaBlock 等）
│   │   └── views/                # 页面（home / auth / student / profile / admin）
│   ├── public/data/              # 静态数据
│   └── package.json
│
├── 开发规范.md                    # 注释 / 数据库 / API 响应规范
├── 样式规范.md                    # 设计 token 与组件样式规范
├── 技术方案.md                    # PDF→Qwen 解析方案
├── 数据库构建.md                  # 数据模型详细文档
├── 登录模块技术方案.md             # 登录注册技术方案
├── 部署方案.md                    # 部署说明
├── 项目架构.md                    # 项目架构总览
└── README.md                     # 本文件
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm

### 1. 后端 API

```bash
cd api

# 安装依赖
npm install

# 初始化数据库（生成 Prisma Client + 执行迁移）
npx prisma migrate dev

# 配置环境变量（复制 .env 并根据需要修改）
# JWT_SECRET、EMAIL_CODE_SECRET、VISITOR_IP_HASH_SECRET、API_PORT、DATABASE_URL 等

# 启动开发服务器（http://localhost:3001）
npm run dev
```

### 2. 前端

```bash
cd quiz-web

# 安装依赖
npm install

# 启动开发服务器（http://localhost:5173）
npm run dev
```

## 文档索引

- [项目架构.md](项目架构.md) — 完整架构说明（目录、路由层级、数据模型、解析流程）
- [开发规范.md](开发规范.md) — 注释规范、数据库规范、API 响应规范
- [样式规范.md](样式规范.md) — CSS 变量、组件样式规范
- [技术方案.md](技术方案.md) — PDF 解析技术方案详解
- [数据库构建.md](数据库构建.md) — 数据模型字段说明
- [登录模块技术方案.md](登录模块技术方案.md) — 认证模块详细设计
- [部署方案.md](部署方案.md) — 部署流程与配置
