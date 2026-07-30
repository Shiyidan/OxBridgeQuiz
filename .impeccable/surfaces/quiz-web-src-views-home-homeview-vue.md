---
version: 1
slug: "quiz-web-src-views-home-homeview-vue"
primary_target: "quiz-web/src/views/home/HomeView.vue"
related_targets: ["quiz-web/src/views/home/MarketingHome.vue","quiz-web/src/views/home/StudentHome.vue","quiz-web/src/views/home/HomeHeader.vue","quiz-web/src/views/home/home.css"]
---

# Homepage Surface Brief

## Thesis

首页以“可追溯真题诊断 → 找到弱项 → 专项训练 → 错题复习”为唯一主线。访客先理解证据和方法，登录学生则直接回到当前考试最重要的一项真实任务。

## Visual authority

- 视觉构图、色彩、字体密度、编号叙事、深色报告板块和桌面纵向分屏以 `C:\Users\daguan\Desktop\logged-in-home(2).html` 为绑定参考。
- 内容、状态、权益和跳转冲突时，以 `C:\Users\daguan\Desktop\官网首页产品需求说明书-3.md` 为准。
- 采用冷白纸面、深墨文字、克制青绿主色和少量琥珀提示；界面应像经过编辑的备考档案，而不是通用 SaaS 仪表盘。

## Surface story

- 访客首页依次呈现主张、真题来源、命题模型、学习闭环、诊断预览、报告预览、练习预览、错题预览和价格转化；演示数据必须明确标识且不得读取学生记录。
- 登录后首页由真实记录驱动，只显示 ESAT 或 TMUA 一个考试上下文。首屏依状态呈现 `no-goal`、`new`、`progress`、`report`、`active`、`idle` 中的一种，其余四屏解释真题来源、专项练习、诊断闭环和继续备考。
- 正式页面不提供原型中的“切换演示状态”抽屉；状态只能来自服务端可证明的数据。

## First viewport

固定页头下先给出欢迎语或产品主张、一个明确主行动，以及两张解释“为什么现在做这件事”的状态信号。登录后的诊断、练习、错题三个入口属于同一首屏，不得被改造成独立统计卡片墙。

## Interaction and responsive behavior

- 桌面宽度不低于 861px 且高度不低于 700px 时，登录后五屏使用强制纵向吸附，并支持右侧定位点与 PageUp、PageDown、上下方向键。
- 菜单、输入、弹窗、移动端、低高度视口和系统减弱动态效果环境不得拦截普通键盘或滚动行为。
- 未选择目标时，受保护功能导航保留原跳转意图并先展开考试选择；保存目标后继续进入原功能页。
- 所有错题入口携带当前考试；ESAT 与 TMUA 的记录、会员和导航上下文不得混用。

## Non-negotiables

- 不伪造实时人数、提分数据、趋势、报告洞察、未读状态或待复习状态。
- 登录后加载失败显示失败与重试，不使用演示数据兜底。
- 会员按考试类型独立购买；免费诊断卷按正式功能规则表述为每考试一套、可不限次重复测试。
- 页面延续参考稿的编辑式层级、细分隔线、低圆角和低阴影，不回退到旧首页视觉。
