<!-- 访客营销首页：按 PRD 展示公开演示内容，并把注册、登录与功能跳转交给首页容器处理。 -->
<script setup lang="ts">
interface MarketingHomeProps {
  memberPriceLabel?: string
  memberPriceAvailable?: boolean
}

// 会员价格与购买可用性由首页容器根据真实权益上下文传入，组件不自行推断。
const props = withDefaults(defineProps<MarketingHomeProps>(), {
  memberPriceLabel: '¥79/月',
  memberPriceAvailable: true,
})

// 营销页只表达用户意图，登录态分流、路由与支付流程由父级统一处理。
const emit = defineEmits<{
  register: [targetPath: string]
  login: [targetPath: string]
  navigate: [path: string]
  'open-report-demo': []
  'open-payment': []
  unsupported: [label: string]
  'scroll-top': []
}>()

// 注册入口携带完成注册后的目标页，确保主转化路径能继续到诊断中心。
function requestRegistration(targetPath: string) {
  emit('register', targetPath)
}

// 受保护功能入口携带登录后的回跳地址，不在演示组件内判断会话状态。
function requestLogin(targetPath: string) {
  emit('login', targetPath)
}

// 公开页面交由父级导航，避免营销组件直接依赖路由实例。
function requestNavigation(path: string) {
  emit('navigate', path)
}

// 两处报告示例入口共享同一公开演示，避免出现不同版本的示例内容。
function requestReportDemo() {
  emit('open-report-demo')
}

// 购买入口由父级处理登录分流、考试类型选择与支付结果回写。
function requestPayment() {
  if (!props.memberPriceAvailable) return
  emit('open-payment')
}

// 尚未提供正式静态页的公开链接使用统一提示，不伪造不存在的页面。
function requestUnsupported(label: string) {
  emit('unsupported', label)
}

// 页脚产品入口回到营销首页顶部，由父级兼容滚动容器实现。
function requestScrollTop() {
  emit('scroll-top')
}
</script>

<template>
  <main class="home-marketing" aria-label="云舟备考产品介绍">
    <!--
      THESIS: 用可追溯的真题诊断证明“测清楚再练”，拒绝以空泛功能卡堆砌价值。
      OWN-WORLD: 黑白高对比编辑式页面、编号叙事、数据台账与深色报告面板。
      STORY: 访客先理解真题来源，再看诊断、报告、训练与错题如何形成闭环，最后选择注册或会员。
      FIRST VIEWPORT: 左侧一句主张和双行动，右侧放大一张标注为演示数据的诊断报告。
      FORM: 绑定参考 HTML 的纵向分屏叙事；营销说服模式；视觉结构由用户给定参考确定。
    -->
    <section
      id="home-marketing-hero"
      class="home-section home-snap-screen home-hero-screen"
      aria-labelledby="home-hero-title"
    >
      <div class="home-page home-hero-layout home-motion-content">
        <div class="home-hero-copy">
          <p class="home-hello">ESAT &amp; TMUA 智能备考系统</p>
          <p class="home-hero-kicker">免费真题诊断</p>
          <h1 id="home-hero-title" class="home-hero-title">
            用一套真题，看清你的 ESAT / TMUA 真实水平
          </h1>
          <p class="home-hero-desc">
            注册即可选择历年真题进行诊断，获得按知识点和能力维度生成的专属报告，再根据薄弱项开始训练。
          </p>

          <div class="home-hero-actions">
            <button
              class="home-btn home-btn-primary"
              type="button"
              @click="requestRegistration('/assessment')"
            >
              免费注册并开始诊断
              <span class="home-arrow" aria-hidden="true">→</span>
            </button>
            <button class="home-btn home-btn-secondary" type="button" @click="requestReportDemo">
              查看诊断报告示例
            </button>
          </div>

          <ul class="home-capability-list" aria-label="核心能力">
            <li class="home-capability-item">
              <span class="home-capability-mark" aria-hidden="true">✓</span>
              历年真题自由练习
            </li>
            <li class="home-capability-item">
              <span class="home-capability-mark" aria-hidden="true">✓</span>
              专属诊断报告
            </li>
            <li class="home-capability-item">
              <span class="home-capability-mark" aria-hidden="true">✓</span>
              薄弱知识点训练
            </li>
          </ul>
        </div>

        <aside class="home-report-preview" aria-label="ESAT Mathematics 1 诊断报告演示">
          <div class="home-report-preview-head">
            <div class="home-report-preview-heading">
              <span class="home-demo-badge">演示数据</span>
              <strong>ESAT Mathematics 1</strong>
            </div>
            <span class="home-report-preview-type">诊断报告</span>
          </div>

          <div class="home-report-score">
            <span class="home-report-score-label">综合得分</span>
            <strong class="home-report-score-value">78</strong>
            <span class="home-report-score-note">示例结果，不对应真实学生</span>
          </div>

          <div class="home-mastery-list" aria-label="知识点掌握度演示">
            <div class="home-mastery-item">
              <div class="home-mastery-head"><span>代数与函数</span><b>82%</b></div>
              <div
                class="home-progress home-progress-strong"
                role="progressbar"
                aria-label="代数与函数演示掌握度"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="82"
              >
                <i class="home-progress-fill"></i>
              </div>
            </div>
            <div class="home-mastery-item">
              <div class="home-mastery-head"><span>数论与组合</span><b>64%</b></div>
              <div
                class="home-progress home-progress-medium"
                role="progressbar"
                aria-label="数论与组合演示掌握度"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="64"
              >
                <i class="home-progress-fill"></i>
              </div>
            </div>
            <div class="home-mastery-item">
              <div class="home-mastery-head"><span>几何与测量</span><b>71%</b></div>
              <div
                class="home-progress home-progress-steady"
                role="progressbar"
                aria-label="几何与测量演示掌握度"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="71"
              >
                <i class="home-progress-fill"></i>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section
      id="home-esat-library"
      class="home-section home-snap-screen home-story-screen home-source-screen"
      aria-labelledby="home-source-title"
    >
      <div class="home-page home-story-layout home-motion-content">
        <div class="home-story-copy">
          <p class="home-story-index">01 · ESAT 专属题库工程</p>
          <h2 id="home-source-title" class="home-section-title">
            ESAT 真题有限，我们把可用的历史试题按学科重新整理好了
          </h2>
          <p class="home-section-desc">
            将 ENGAA 与 NSAA 历年试题逐题对照现行 ESAT
            考纲，剔除超纲内容，再按五个考试模块重新分类组卷。
          </p>

          <ul class="home-trust-list" aria-label="题库整理标准">
            <li class="home-trust-item">历史来源可追溯</li>
            <li class="home-trust-item">逐题对照现行考纲</li>
            <li class="home-trust-item">超纲内容已剔除</li>
          </ul>

          <button
            class="home-btn home-btn-primary"
            type="button"
            @click="requestRegistration('/assessment')"
          >
            注册免费试做历史试题
            <span class="home-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <div class="home-story-visual home-source-visual" aria-label="ESAT 历史试题重组流程">
          <article class="home-source-stage">
            <span class="home-source-stage-no">01</span>
            <strong>ENGAA / NSAA</strong>
            <p>历史题源</p>
          </article>
          <span class="home-flow-arrow" aria-hidden="true">→</span>
          <article class="home-source-stage home-source-stage-focus">
            <span class="home-source-stage-no">02</span>
            <strong>逐题对照考纲</strong>
            <p>筛选与剔除超纲内容</p>
          </article>
          <span class="home-flow-arrow" aria-hidden="true">→</span>
          <article class="home-source-stage">
            <span class="home-source-stage-no">03</span>
            <strong>ESAT 五个模块</strong>
            <p>按学科重新分类组卷</p>
          </article>

          <div class="home-subject-list" aria-label="ESAT 五个考试模块">
            <span class="home-subject-item">Mathematics 1</span>
            <span class="home-subject-item">Mathematics 2</span>
            <span class="home-subject-item">Physics</span>
            <span class="home-subject-item">Chemistry</span>
            <span class="home-subject-item">Biology</span>
          </div>
        </div>
      </div>
    </section>

    <section
      id="home-question-model"
      class="home-section home-snap-screen home-story-screen home-model-screen"
      aria-labelledby="home-model-title"
    >
      <div class="home-page home-model-layout home-motion-content">
        <header class="home-model-heading">
          <p class="home-story-index">02 · 真题命题模型</p>
          <h2 id="home-model-title" class="home-section-title">
            不是随机生成，而是复用真题的考点边界、推理方式与难度逻辑
          </h2>
          <p class="home-section-desc">
            从官方真题样本中拆出可核验的命题结构，再生成同知识点、同任务类型且分难度的专项练习。
          </p>
        </header>

        <div class="home-model-grid" aria-label="从真题到专项练习的演示流程">
          <article class="home-model-card">
            <div class="home-model-card-head">
              <span class="home-model-card-no">01</span>
              <span class="home-demo-badge">演示内容</span>
            </div>
            <p class="home-model-card-kicker">真题样本</p>
            <h3>TMUA 2023 · Paper 1</h3>
            <div class="home-model-question">
              <span>Functions &amp; Graphs</span>
              <p>保留原题的考点范围、任务要求、选项结构与完整答案。</p>
              <div class="home-model-options" aria-hidden="true">
                <i class="home-model-option">A</i>
                <i class="home-model-option">B</i>
                <i class="home-model-option">C</i>
                <i class="home-model-option">D</i>
              </div>
            </div>
          </article>

          <article class="home-model-card home-model-card-focus">
            <div class="home-model-card-head">
              <span class="home-model-card-no">02</span>
              <span class="home-demo-badge">结构化示例</span>
            </div>
            <p class="home-model-card-kicker">结构化分析</p>
            <h3>把“为什么难”拆清楚</h3>
            <dl class="home-analysis-list">
              <div class="home-analysis-item">
                <dt>考纲范围</dt>
                <dd>Functions</dd>
              </div>
              <div class="home-analysis-item">
                <dt>知识点</dt>
                <dd>图像与参数</dd>
              </div>
              <div class="home-analysis-item">
                <dt>任务类型</dt>
                <dd>条件推断</dd>
              </div>
              <div class="home-analysis-item">
                <dt>推理结构</dt>
                <dd>分区间判断</dd>
              </div>
              <div class="home-analysis-item">
                <dt>难度来源</dt>
                <dd>临界值遗漏</dd>
              </div>
              <div class="home-analysis-item">
                <dt>干扰项设计</dt>
                <dd>端点条件</dd>
              </div>
              <div class="home-analysis-item">
                <dt>题型结构</dt>
                <dd>单项选择</dd>
              </div>
            </dl>
          </article>

          <article class="home-model-card">
            <div class="home-model-card-head">
              <span class="home-model-card-no">03</span>
              <span class="home-demo-badge">演示内容</span>
            </div>
            <p class="home-model-card-kicker">专项练习输出</p>
            <h3>同考点、同任务类型</h3>
            <p class="home-model-output-copy">
              围绕函数图像与参数范围，按相近推理结构生成分层练习，并逐题校验答案与选项。
            </p>
            <ul class="home-validation-list">
              <li class="home-validation-item">符合现行考纲</li>
              <li class="home-validation-item">相近推理结构</li>
              <li class="home-validation-item">难度分层生成</li>
              <li class="home-validation-item">答案与选项已校验</li>
            </ul>
          </article>
        </div>

        <div class="home-model-linkage">
          <div class="home-model-linkage-item">
            <span>学生诊断结果 · 演示</span>
            <strong>Functions &amp; Graphs 正确率 48%</strong>
          </div>
          <span class="home-model-linkage-arrow" aria-hidden="true">→</span>
          <div class="home-model-linkage-item">
            <span>推荐专项练习 · 演示</span>
            <strong>15 道 · 分难度训练</strong>
          </div>
          <button
            class="home-btn home-btn-primary"
            type="button"
            @click="requestLogin('/question-bank')"
          >
            注册免费试用专项练习
            <span class="home-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <blockquote class="home-model-quote">
          不是随机生成题目，而是复用真题的考点边界、推理方式与难度逻辑。
        </blockquote>
      </div>
    </section>

    <section
      id="home-learning-loop"
      class="home-section home-snap-screen home-loop-screen home-marketing-loop-screen"
      aria-labelledby="home-loop-title"
    >
      <div class="home-page home-loop-layout home-motion-content">
        <header class="home-loop-heading">
          <p class="home-story-index">03 · 完整学习闭环</p>
          <h2 id="home-loop-title" class="home-section-title">做完一套题，下一步练什么就清楚了</h2>
          <p class="home-section-desc">
            每一步都承接上一阶段的真实作答记录，从定位问题到验证是否掌握，形成可回看的备考闭环。
          </p>
        </header>

        <div class="home-story-visual home-loop-visual" aria-label="诊断、练习和错题流程">
          <article>
            <span>01</span>
            <div><small>真题诊断</small><strong>用历年真题看清当前成绩、知识点和用时</strong></div>
          </article>
          <article>
            <span>02</span>
            <div><small>专项练习</small><strong>围绕薄弱知识点练习同路数新题</strong></div>
          </article>
          <article>
            <span>03</span>
            <div><small>错题本</small><strong>保存真实错题、解析与知识点</strong></div>
          </article>
        </div>
      </div>
    </section>

    <section
      id="home-diagnostic-preview"
      class="home-section home-snap-screen home-public-screen home-diagnostic-screen"
      aria-labelledby="home-diagnostic-title"
    >
      <div class="home-page home-public-layout home-motion-content">
        <div class="home-public-copy">
          <p class="home-public-index">04 · 真题诊断</p>
          <h2 id="home-diagnostic-title" class="home-section-title">从任意一套真实试卷开始</h2>
          <p class="home-section-desc">
            选择考试、年份与试卷，按照正式机考方式完成测试。系统自动保存进度并生成专属报告。
          </p>
          <ul class="home-public-points">
            <li class="home-public-point">ESAT 按学生选择的三个科目分别诊断</li>
            <li class="home-public-point">TMUA 保留 Paper 1 与 Paper 2 的考试结构</li>
            <li class="home-public-point">中途退出自动保存已完成的进度</li>
          </ul>
          <button
            class="home-btn home-btn-primary"
            type="button"
            @click="requestLogin('/assessment')"
          >
            选择一套真题
            <span class="home-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <div class="home-public-visual home-diagnostic-console" aria-label="静态真题作答界面演示">
          <div class="home-console-head">
            <div class="home-console-heading">
              <b>ESAT Mathematics 1 · 2024 Practice</b>
              <span>静态答题界面演示</span>
            </div>
            <span class="home-demo-badge">演示数据</span>
          </div>

          <div class="home-console-meta">
            <span>Question 8 / 27</span>
            <strong aria-label="演示倒计时 42 分 18 秒，计时不会走动">42:18</strong>
          </div>
          <div class="home-console-progress" aria-hidden="true">
            <i class="home-console-progress-fill"></i>
          </div>

          <div class="home-paper-question">
            <small>QUESTION 8 · SINGLE CHOICE</small>
            <h3>
              If the graph of y = f(x) satisfies the conditions shown, which statement must be true?
            </h3>
            <div class="home-answer-grid" role="list" aria-label="演示选项，不可作答">
              <span class="home-answer-option" role="listitem"><b>A</b> Statement one</span>
              <span class="home-answer-option" role="listitem"><b>B</b> Statement two</span>
              <span class="home-answer-option" role="listitem"><b>C</b> Statement three</span>
              <span class="home-answer-option" role="listitem"><b>D</b> Statement four</span>
            </div>
          </div>

          <div class="home-paper-footer">
            <button class="home-paper-nav" type="button" disabled>上一题</button>
            <span class="home-paper-static-note">选项不可作答 · 计时不会走动</span>
            <button class="home-paper-nav" type="button" disabled>下一题</button>
          </div>
        </div>
      </div>
    </section>

    <section
      id="home-report-preview"
      class="home-section home-snap-screen home-growth-screen"
      aria-labelledby="home-growth-title"
    >
      <div class="home-page home-growth-layout home-motion-content">
        <header class="home-growth-copy">
          <p class="home-public-index">05 · 专属诊断报告</p>
          <h2 id="home-growth-title" class="home-section-title">
            不只告诉你得了多少分，还告诉你下一步练什么
          </h2>
          <p class="home-section-desc">
            每一道题都与知识点和能力要求关联，帮助你发现持续失分的原因。
          </p>
          <div class="home-growth-actions">
            <button class="home-btn home-btn-light" type="button" @click="requestReportDemo">
              查看诊断报告示例
              <span class="home-arrow" aria-hidden="true">→</span>
            </button>
            <span class="home-growth-note">首页仅展示演示数据，不读取真实学生记录</span>
          </div>
        </header>

        <div class="home-report-card-grid" aria-label="诊断报告核心内容演示">
          <article class="home-report-card home-report-card-score">
            <div class="home-report-card-head">
              <span>综合得分</span>
              <span class="home-demo-badge home-demo-badge-dark">演示</span>
            </div>
            <strong class="home-report-card-value">78</strong>
            <dl class="home-report-metrics">
              <div class="home-report-metric">
                <dt>正确率</dt>
                <dd>78%</dd>
              </div>
              <div class="home-report-metric">
                <dt>用时</dt>
                <dd>55:32</dd>
              </div>
            </dl>
          </article>

          <article class="home-report-card">
            <div class="home-report-card-head">
              <span>知识点掌握度</span>
              <span class="home-demo-badge home-demo-badge-dark">演示</span>
            </div>
            <div class="home-mastery-list home-mastery-list-dark">
              <div class="home-mastery-item">
                <div class="home-mastery-head"><span>Algebra</span><b>84%</b></div>
                <div class="home-progress home-progress-strong" aria-hidden="true">
                  <i class="home-progress-fill"></i>
                </div>
              </div>
              <div class="home-mastery-item">
                <div class="home-mastery-head"><span>Functions &amp; Graphs</span><b>48%</b></div>
                <div class="home-progress home-progress-weak" aria-hidden="true">
                  <i class="home-progress-fill"></i>
                </div>
              </div>
              <div class="home-mastery-item">
                <div class="home-mastery-head"><span>Number Theory</span><b>69%</b></div>
                <div class="home-progress home-progress-medium" aria-hidden="true">
                  <i class="home-progress-fill"></i>
                </div>
              </div>
            </div>
          </article>

          <article class="home-report-card home-report-card-next">
            <div class="home-report-card-head">
              <span>下一步建议</span>
              <span class="home-demo-badge home-demo-badge-dark">演示</span>
            </div>
            <ol class="home-next-list">
              <li class="home-next-item">
                <span>优先训练</span>
                <strong>Functions &amp; Graphs · 中等</strong>
              </li>
              <li class="home-next-item">
                <span>关联错题</span>
                <strong>先复习 4 道演示错题</strong>
              </li>
              <li class="home-next-item">
                <span>阶段诊断</span>
                <strong>做稳后再完成一次同范围诊断</strong>
              </li>
            </ol>
          </article>
        </div>
      </div>
    </section>

    <section
      id="home-practice-preview"
      class="home-section home-snap-screen home-public-screen home-practice-screen"
      aria-labelledby="home-practice-title"
    >
      <div class="home-page home-practice-layout home-motion-content">
        <header class="home-practice-heading">
          <p class="home-public-index">06 · 专项练习</p>
          <h2 id="home-practice-title" class="home-section-title">诊断以后，只练真正薄弱的部分</h2>
          <p class="home-section-desc">
            按考试、学科、知识点、任务类型和难度组合训练，也可以直接完成系统根据诊断结果推荐的练习。
          </p>
        </header>

        <div class="home-practice-workspace">
          <aside class="home-knowledge-tree" aria-label="ESAT Mathematics 1 知识点树演示">
            <div class="home-knowledge-head">
              <div class="home-knowledge-heading">
                <span class="home-demo-badge">演示数据</span>
                <strong>ESAT Mathematics 1</strong>
              </div>
              <span>知识点树</span>
            </div>
            <ul class="home-knowledge-list">
              <li class="home-knowledge-item home-knowledge-item-active">
                <span>代数与函数</span><b>当前关注</b>
              </li>
              <li class="home-knowledge-item home-knowledge-item-weak">
                <span>数论与组合</span><b>薄弱</b>
              </li>
              <li class="home-knowledge-item"><span>几何与测量</span><b>查看</b></li>
              <li class="home-knowledge-item"><span>统计与概率</span><b>查看</b></li>
              <li class="home-knowledge-item"><span>逻辑与证明</span><b>查看</b></li>
            </ul>
          </aside>

          <div class="home-practice-board" aria-label="根据诊断结果推荐的专项练习演示">
            <div class="home-practice-board-head">
              <div class="home-practice-board-heading">
                <span class="home-demo-badge">演示数据</span>
                <strong>根据诊断结果推荐</strong>
              </div>
              <span>入口不会携带演示参数</span>
            </div>

            <article class="home-practice-row home-practice-row-highlight">
              <div class="home-practice-name">
                <small>最近正确率 48%</small>
                <strong>Functions &amp; Graphs</strong>
              </div>
              <span class="home-practice-level">中等</span>
              <button
                class="home-practice-action"
                type="button"
                @click="requestLogin('/question-bank')"
              >
                开始练习
              </button>
            </article>
            <article class="home-practice-row">
              <div class="home-practice-name">
                <small>关联错题 4 道</small>
                <strong>Number Theory</strong>
              </div>
              <span class="home-practice-level">基础</span>
              <button
                class="home-practice-action"
                type="button"
                @click="requestLogin('/question-bank')"
              >
                加入计划
              </button>
            </article>
            <article class="home-practice-row">
              <div class="home-practice-name">
                <small>最近正确率 71%</small>
                <strong>Geometry &amp; Measure</strong>
              </div>
              <span class="home-practice-level">进阶</span>
              <button
                class="home-practice-action"
                type="button"
                @click="requestLogin('/question-bank')"
              >
                查看题组
              </button>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section
      id="home-mistake-preview"
      class="home-section home-snap-screen home-public-screen home-mistake-screen"
      aria-labelledby="home-mistake-title"
    >
      <div class="home-page home-mistake-layout home-motion-content">
        <header class="home-mistake-heading">
          <p class="home-public-index">07 · 个人错题库</p>
          <h2 id="home-mistake-title" class="home-section-title">
            每一道错题，都成为下一次提分的依据
          </h2>
          <p class="home-section-desc">
            保留原题、作答答案、正确答案、知识点和详细中文解析，支持重新练习并记录掌握状态。
          </p>
        </header>

        <div class="home-mistake-ledger" aria-label="个人错题库静态演示表格">
          <div class="home-mistake-toolbar">
            <div class="home-mistake-toolbar-heading">
              <span class="home-demo-badge">静态演示</span>
              <strong>个人错题库</strong>
            </div>
            <div class="home-mistake-filters" aria-label="演示筛选条件，不可操作">
              <span class="home-mistake-filter"><b>考试</b> ESAT</span>
              <span class="home-mistake-filter"><b>知识点</b> 全部</span>
              <span class="home-mistake-filter"><b>状态</b> 待攻克</span>
            </div>
          </div>

          <div class="home-table-wrap">
            <table class="home-mistake-table">
              <caption class="home-visually-hidden">
                演示错题记录，不支持筛选或行内操作
              </caption>
              <thead>
                <tr>
                  <th scope="col">题目与来源</th>
                  <th scope="col">你的答案</th>
                  <th scope="col">正确答案</th>
                  <th scope="col">知识点</th>
                  <th scope="col">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>函数图像与参数范围</strong>
                    <span>ESAT Mathematics 1 · 演示题目</span>
                  </td>
                  <td><span class="home-answer-wrong">B</span></td>
                  <td><span class="home-answer-correct">D</span></td>
                  <td>代数与函数</td>
                  <td><span class="home-status-text">查看解析</span></td>
                </tr>
                <tr>
                  <td>
                    <strong>组合计数中的限制条件</strong>
                    <span>ESAT Mathematics 1 · 演示题目</span>
                  </td>
                  <td><span class="home-answer-wrong">A</span></td>
                  <td><span class="home-answer-correct">C</span></td>
                  <td>数论与组合</td>
                  <td><span class="home-status-text">重新练习</span></td>
                </tr>
                <tr>
                  <td>
                    <strong>三角形中的长度关系</strong>
                    <span>ESAT Mathematics 1 · 演示题目</span>
                  </td>
                  <td><span class="home-answer-wrong">C</span></td>
                  <td><span class="home-answer-correct">B</span></td>
                  <td>几何与测量</td>
                  <td><span class="home-status-text">尚未掌握</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="home-mistake-note">
            筛选器、状态与表格内容均为静态演示，不会读取或修改真实错题记录。
          </p>
        </div>
      </div>
    </section>

    <section
      id="home-pricing"
      class="home-section home-snap-screen home-action-screen"
      aria-labelledby="home-pricing-title"
    >
      <div class="home-page home-pricing-layout home-motion-content">
        <header class="home-pricing-heading">
          <p class="home-action-kicker">注册与会员</p>
          <h2 id="home-pricing-title" class="home-section-title">
            先免费完成一次诊断，再决定如何继续提升
          </h2>
          <p class="home-section-desc">先体验诊断报告，再选择是否升级。</p>
        </header>

        <div class="home-pricing-grid">
          <article class="home-price-card home-price-card-free">
            <div class="home-price-card-head">
              <div class="home-price-card-heading">
                <span>免费注册</span>
                <strong>¥0</strong>
              </div>
              <p>先用真实试卷完成诊断，确认产品是否适合你。</p>
            </div>
            <ul class="home-benefit-list">
              <li class="home-benefit-item">每种考试 1 套免费诊断卷，不限次测试</li>
              <li class="home-benefit-item">诊断报告与学习记录</li>
              <li class="home-benefit-item">基础专项练习</li>
              <li class="home-benefit-item">基础错题收录</li>
            </ul>
            <button
              class="home-btn home-btn-secondary home-btn-block"
              type="button"
              @click="requestRegistration('/assessment')"
            >
              免费注册并开始诊断
            </button>
          </article>

          <article class="home-price-card home-price-card-member">
            <div class="home-price-recommended">推荐</div>
            <div class="home-price-card-head">
              <div class="home-price-card-heading">
                <span>会员备考</span>
                <strong>{{ props.memberPriceLabel }}</strong>
              </div>
              <p>会员按考试类型独立生效，购买时可明确选择 ESAT 或 TMUA。</p>
            </div>
            <ul class="home-benefit-list">
              <li class="home-benefit-item">全部可用历史真题</li>
              <li class="home-benefit-item">不限次数能力诊断</li>
              <li class="home-benefit-item">完整专项练习题库</li>
              <li class="home-benefit-item">错题攻克与学习建议</li>
            </ul>
            <button
              class="home-btn home-btn-primary home-btn-block"
              type="button"
              :disabled="!props.memberPriceAvailable"
              @click="requestPayment"
            >
              {{ props.memberPriceAvailable ? '开通会员' : '会员服务暂未开放' }}
            </button>
          </article>
        </div>

        <p class="home-pricing-note">
          随时查看学习记录与诊断报告 · 会员权益以实际产品说明为准 · ESAT 与 TMUA 会员权益互不通用
        </p>
      </div>
    </section>

    <footer class="home-marketing-footer" aria-label="网站页脚">
      <div class="home-page home-footer-layout">
        <div class="home-footer-brand">
          <button class="home-footer-brand-button" type="button" @click="requestScrollTop">
            <span class="home-footer-brand-mark" aria-hidden="true">YZ</span>
            <strong>云舟备考</strong>
          </button>
          <p>基于真题诊断与考纲知识点的智能备考系统。</p>
        </div>

        <nav class="home-footer-links" aria-label="页脚公开链接">
          <div class="home-footer-link-group">
            <strong>产品</strong>
            <button type="button" @click="requestScrollTop">产品首页</button>
            <button type="button" @click="requestNavigation('/exam-intro')">考试介绍</button>
          </div>
          <div class="home-footer-link-group">
            <strong>支持</strong>
            <button type="button" @click="requestUnsupported('帮助中心')">帮助中心</button>
            <button type="button" @click="requestUnsupported('关于我们')">关于我们</button>
          </div>
          <div class="home-footer-link-group">
            <strong>协议</strong>
            <button type="button" @click="requestNavigation('/legal/user-agreement')">
              用户协议
            </button>
            <button type="button" @click="requestNavigation('/legal/privacy-policy')">
              隐私政策
            </button>
          </div>
        </nav>
      </div>

      <div class="home-footer-bottom">
        <div class="home-page home-footer-bottom-inner">
          <span>© 2026 云舟备考 SmartKey</span>
          <span>公开预览使用演示数据，不展示任何真实学生记录。</span>
        </div>
      </div>
    </footer>
  </main>
</template>
