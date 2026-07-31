---
name: 云舟社区小程序
description: 面向国际生备考讨论的克制型移动界面系统
colors:
  primary: "#0066cc"
  primary-deep: "#004f9f"
  ink: "#1d1d1f"
  text-secondary: "#5f5f64"
  text-tertiary: "#85858b"
  canvas: "#ececef"
  surface: "#ffffff"
  surface-soft: "#f5f5f7"
  divider: "#d9d9de"
  danger: "#c9342e"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Helvetica Neue, Microsoft YaHei, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 730
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Helvetica Neue, Microsoft YaHei, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 680
    lineHeight: 1.44
    letterSpacing: "-0.012em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Helvetica Neue, Microsoft YaHei, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.58
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Helvetica Neue, Microsoft YaHei, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  micro: "2px"
  small: "3px"
  control: "4px"
  maximum: "5px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "0 18px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "42px"
    padding: "0 18px"
  filter-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.small}"
    height: "27px"
    padding: "0 8px"
  tag:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.micro}"
    padding: "3px 5px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "38px"
    padding: "0 10px"
---

# Design System: 云舟社区小程序

## Overview

**Creative North Star: "安静的学习讨论台"**

界面服务于学生在复习间隙快速定位问题、判断回答质量并继续讨论。视觉保持低噪声、高信息密度：内容直接落在白色工作面上，以字号、字重、色阶和细分隔线建立秩序，不依赖大面积卡片或装饰。

它借用 Apple 系统界面的排版克制与状态清晰度，但保留微信小程序的顶部系统区和底部目的地。每个写入动作都应明确，浏览则保持开放。

**Key Characteristics:**

- 系统浅灰画布与白色内容面。
- 石墨文字加单一系统蓝动作色。
- 扁平列表、细分隔线和紧凑标签。
- 所有 CSS 圆角不超过 5px。

## Colors

配色采用“中性色承担结构，单一蓝色表达动作”的受限策略。

### Primary

- **系统蓝：** 用于主要按钮、可操作文本、选中导航和反馈状态。
- **深系统蓝：** 只用于主要按钮悬停和需要更高对比度的蓝色文字。

### Neutral

- **石墨：** 主要文字、选中筛选和品牌标记。
- **次级石墨：** 正文辅助信息和未选中控件。
- **雾灰：** 时间、计数、占位和低优先级状态。
- **系统浅灰与白色：** 分别承担应用画布、工作面和输入面。
- **细分隔线：** 组织列表、工具栏和任务边界。

**The Single Accent Rule.** 蓝色只表达操作、选中和可信质量信号，不作为装饰背景到处散布。

## Typography

**Display Font:** 系统 UI 字体栈  
**Body Font:** 系统 UI 字体栈

**Character:** 同一套系统字体通过字重与紧凑的负字距区分层级，保持中文、英文考试名和数字混排稳定。

### Hierarchy

- **Headline：** 页面级标题，24px、730 字重，字距 -0.03em。
- **Title：** 帖子与讨论标题，15px、680 字重，行高 1.44。
- **Body：** 摘要与回答，12px，常用行高 1.58–1.72。
- **Label：** 标签、时间、排序提示与底部导航，9–11px、650 左右字重。

**The Quiet Hierarchy Rule.** 不使用全大写眉题或夸张展示字体；层级来自真实阅读优先级。

## Layout

主交互画布以 390px 移动视口为基准；桌面预览居中呈现同一设备宽度。页面由状态栏、小程序栏、上下文筛选、可滚动内容和固定底部导航组成。横向筛选允许滚动，正文列表始终保持单列。

间距以 6、8、12、16 和 24px 为主要节奏。内容项通常使用 15–16px 外边距，紧密元数据使用 3–9px 间距。600px 以下设备填满视口并移除设备外框。

## Elevation & Depth

应用内部默认扁平，以白色/浅灰色阶和 1px 分隔线表达层级。阴影只用于桌面设备预览、授权遮罩和搜索浮层等真正脱离文档流的结构。

**The Divider Before Elevation Rule.** 静态列表与内容面优先使用分隔线；没有空间层级变化时不得添加阴影。

## Shapes

形状以方正面板和短半径控件为主。标签使用 2px，头像和小型选项使用 3px，输入与按钮使用 4px，设备边框与系统胶囊最多使用 5px。圆形系统图标使用 SVG 几何，不通过扩大 CSS 圆角制造。

**The Five Pixel Ceiling Rule.** 任何 CSS `border-radius` 都不得超过 5px，头像也保持方形识别块。

## Components

### Buttons

- **Shape:** 主要与次要按钮使用 4px 圆角，常用高度 42px。
- **Primary:** 系统蓝底、白字；悬停切换为深系统蓝。
- **Secondary:** 白底、细分隔线描边、石墨文字。
- **Focus:** 使用半透明系统蓝 3px 外轮廓，偏移 2px。

### Chips

- **Style:** 信息标签为浅灰底、细描边和 2px 圆角。
- **State:** 可操作筛选使用 3px 圆角；选中后变为石墨底白字。

### Cards / Containers

讨论内容不使用浮起卡片。每一项直接位于白色工作面，以细分隔线区隔；内边距通常为 15–16px。质量信号使用小型描边标签，不抢占标题层级。

### Inputs / Fields

输入面使用白色或系统浅灰背景、细描边和 0–4px 圆角。错误文案使用危险色，并明确指出恢复方式；正文编辑区不额外包裹卡片。

### Navigation

顶部上下文筛选通过 2px 底线表示当前考试；学科筛选使用紧凑方形 chip。底部四个目的地保持固定位置，选中项使用系统蓝，其余使用雾灰。

## Do's and Don'ts

### Do:

- **Do** 让考试、学科、可信度与具体卡点先于社交热度出现。
- **Do** 用分隔线、色阶、字号与字重组织高密度内容。
- **Do** 让浏览保持开放，只在回复、收藏和发帖时请求身份。

### Don't:

- **Don't** 使用超过 5px 的 CSS 圆角、胶囊标签或大面积圆角卡片。
- **Don't** 用渐变、玻璃、装饰阴影或多种强调色制造氛围。
- **Don't** 把回复数、收藏数或浏览数当作唯一的内容质量信号。
