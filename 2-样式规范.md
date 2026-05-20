# 样式开发规范

> 基于原型设计提取，适用于 Vue 3 + TypeScript 项目，使用 CSS 自定义属性（CSS Variables）实现，不依赖 Tailwind CSS。

---

## 一、色彩系统

所有颜色通过 CSS 变量定义在 `:root` 或组件根元素上，禁止硬编码色值。

### 1.1 基础色板

```css
:root {
  /* 主色 - Indigo */
  --color-primary: #4f46e5;
  --color-primary-light: #6366f1;
  --color-primary-dark: #4338ca;
  --color-primary-bg: #eef2ff;      /* 浅紫背景 */

  /* 中性色 - Slate */
  --color-bg: #f8fafc;              /* 页面底色 */
  --color-surface: #ffffff;         /* 卡片/容器背景 */
  --color-border: #e2e8f0;          /* 边框 */
  --color-border-light: #f1f5f9;    /* 浅边框 */
  --color-hover: #f1f5f9;           /* hover 背景 */

  /* 文字色 */
  --color-text: #0f172a;            /* 主文字 */
  --color-text-secondary: #475569;  /* 次要文字 */
  --color-text-muted: #94a3b8;      /* 辅助/禁用文字 */
  --color-text-inverse: #ffffff;    /* 深色背景上的文字 */

  /* 功能色 */
  --color-success: #10b981;
  --color-success-bg: #ecfdf5;
  --color-warning: #f59e0b;
  --color-warning-bg: #fffbeb;
  --color-error: #ef4444;
  --color-error-bg: #fef2f2;
}
```

### 1.2 使用方式

```css
/* ✅ 正确：使用变量 */
.button { background: var(--color-primary); color: var(--color-text-inverse); }

/* ❌ 错误：硬编码色值 */
.button { background: #4f46e5; color: white; }
```

---

## 二、排版系统

### 2.1 字体

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-serif: 'Georgia', 'Times New Roman', serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

body { font-family: var(--font-sans); }
```

### 2.2 字号与行高

```css
:root {
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */
  --text-4xl:  2.25rem;    /* 36px */
  --text-5xl:  3rem;       /* 48px */

  --leading-tight:   1.25;
  --leading-normal:  1.5;
  --leading-relaxed: 1.625;
}
```

**规则**：
- 标题（h1-h3）统一用 `font-weight: 700`，`letter-spacing: -0.02em`
- Hero 标题可用 `--font-serif`
- 正文用 `--text-base`，`--leading-relaxed`

---

## 三、间距系统

基于 4px 基准（`0.25rem` 为最小单位）。

```css
:root {
  --space-1:  0.25rem;   /* 4px  */
  --space-2:  0.5rem;    /* 8px  */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */

  /* 页面容器最大宽度 */
  --container-max: 1280px;
  /* 页面容器内边距 */
  --container-px: 2rem;
}
```

**规则**：
- 页面容器使用 `max-width: var(--container-max); margin: 0 auto; padding: 0 var(--container-px)`
- 卡片内边距统一 `padding: var(--space-8)`（32px）
- 章节间距统一 `padding: var(--space-20) 0`（80px）、移动端 `var(--space-12)`（48px）
- Flex/Grid 间隙用 `var(--space-6)`（24px）

---

## 四、圆角与阴影

```css
:root {
  /* 圆角 */
  --radius-sm:   0.375rem;   /* 6px  - 小标签/tag */
  --radius-md:   0.5rem;     /* 8px  - 按钮/输入框 */
  --radius-lg:   0.75rem;    /* 12px - 卡片 */
  --radius-xl:   1rem;       /* 16px - 大卡片 */
  --radius-2xl:  1.5rem;     /* 24px - Hero/Modal */

  /* 阴影 */
  --shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --shadow-xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
}
```

**规则**：
| 组件 | 圆角 | 阴影 |
|------|------|------|
| 按钮/输入框 | `--radius-md` | - |
| 卡片 | `--radius-xl` 或 `--radius-2xl` | `--shadow-sm` |
| Hero区 | `--radius-2xl` 或 `--radius-3xl` | `--shadow-xl` |
| 弹窗/Modal | `--radius-2xl` | `--shadow-xl` |
| 标签/Tag | `--radius-sm` | - |

---

## 五、按钮规范

### 5.1 三种变体

| 变体 | 用途 | 样式特征 |
|------|------|----------|
| **primary** | 主要操作（提交/跳转/CTA） | 主色背景 + 白色文字 |
| **secondary** | 次要操作（取消/返回） | 白色背景 + 边框 |
| **ghost** | 无背景操作（导航链接类） | 透明背景 + hover 变色 |

### 5.2 尺寸

| 尺寸 | padding | 字号 | 用途 |
|------|---------|------|------|
| **sm** | `6px 14px` | `--text-sm` | 表格内操作、标签 |
| **md**（默认） | `10px 24px` | `--text-sm` | 导航栏按钮、卡片操作 |
| **lg** | `14px 36px` | `--text-base` | Hero CTA、提交按钮 |

### 5.3 示例

```css
.btn-primary {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: 10px 24px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}
.btn-primary:hover {
  background: var(--color-primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-secondary {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: 10px 24px;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}
.btn-secondary:hover {
  background: var(--color-hover);
  border-color: var(--color-text-muted);
}
```

---

## 六、卡片组件

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s;
}
.card:hover {
  border-color: var(--color-primary-light);
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}
```

**规则**：
- 卡片默认白色背景 + 1px 边框
- hover 时边框变为主色 + 阴影加深 + 上移 4px
- 功能卡片内图标用 56x56px 圆角方形底色块

---

## 七、导航栏

```css
.navbar {
  position: sticky;    /* 或 fixed */
  top: 0;
  z-index: 1000;
  height: 64px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border-light);
}

.nav-link {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.2s;
}
.nav-link:hover,
.nav-link.active {
  color: var(--color-text);
  background: var(--color-hover);
}
```

---

## 八、Hero 区域

```css
.hero {
  background: var(--color-text);           /* 深色背景 */
  color: var(--color-text-inverse);        /* 白色文字 */
  border-radius: var(--radius-2xl);
  padding: var(--space-20) var(--space-8);
  text-align: center;
  position: relative;
  overflow: hidden;
}

/* 背景装饰光晕 */
.hero::before {
  content: '';
  position: absolute;
  width: 50%; height: 50%;
  background: var(--color-primary);
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.2;
}
```

---

## 九、响应式断点

```css
/* 使用媒体查询，不引入第三方库 */
@media (max-width: 640px)  { /* sm - 手机 */ }
@media (max-width: 768px)  { /* md - 平板竖屏 */ }
@media (max-width: 1024px) { /* lg - 平板横屏 */ }
@media (min-width: 1280px) { /* xl - 桌面 */ }
```

**适配规则**：
- 导航栏：<768px 隐藏文字链接，只保留 Logo + 按钮
- 卡片网格：桌面 3-4 列 → 平板 2 列 → 手机 1 列
- Hero：文字大小递减（48px → 36px → 28px）
- 页面内边距：桌面 2rem → 手机 1rem

---

## 十、禁用事项

| 禁止 | 替代方案 |
|------|----------|
| 使用 `!important` | 通过选择器优先级控制 |
| 硬编码色值（`#xxx`） | 使用 CSS 变量 |
| 行内样式 `style="color: red"` | 使用 class |
| 固定宽高（`width: 400px`） | 使用 `max-width` + 百分比 |
| 深层嵌套选择器（>3层） | 使用 scoped 或 BEM 命名 |

---

## 十一、组件命名规范

采用 **PascalCase** 文件名 + **kebab-case** class 名：

```
components/
├── NavBar.vue          ← 导航栏组件
├── HeroSection.vue     ← Hero 区域
├── FeatureCard.vue     ← 功能卡片
├── BaseButton.vue      ← 基础按钮
├── BaseCard.vue        ← 基础卡片
└── PageContainer.vue   ← 页面容器
```

```vue
<!-- PageContainer.vue -->
<template>
  <div class="page-container">
    <slot />
  </div>
</template>
<style scoped>
.page-container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--container-px);
}
</style>
```

---

## 十二、过渡动画

所有可交互元素必须有不低于 0.2s 的过渡：

```css
/* hover 过渡 */
transition: all 0.2s ease;

/* 弹窗/折叠过渡 */
transition: opacity 0.2s, transform 0.3s;
```

---

*最后更新：2026-05-08*
