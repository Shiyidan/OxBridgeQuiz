<!-- 访客营销首页：按 PRD 展示公开演示内容，并把注册、登录与功能跳转交给首页容器处理。 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Connection, DocumentChecked, MagicStick } from '@element-plus/icons-vue'
import tmuaDiagnosticQuestion03Url from '@/assets/home/tmua-diagnostic-question-03.png'
import tmuaDiagnosticQuestion05Url from '@/assets/home/tmua-diagnostic-question-05.png'
import tmuaDiagnosticQuestion07Url from '@/assets/home/tmua-diagnostic-question-07.png'
import HomeFooter from './HomeFooter.vue'

interface MarketingHomeProps {
  memberPriceLabel?: string
  memberPriceAvailable?: boolean
  includeHero?: boolean
  authenticated?: boolean
}

// 会员价格与购买可用性由首页容器根据真实权益上下文传入，组件不自行推断。
const props = withDefaults(defineProps<MarketingHomeProps>(), {
  memberPriceLabel: '¥79/月',
  memberPriceAvailable: true,
  includeHero: true,
  authenticated: false,
})

const diagnosticGalleryRef = ref<HTMLElement | null>(null)
const diagnosticGalleryActive = ref(false)
let diagnosticGalleryObserver: IntersectionObserver | null = null
let diagnosticGalleryInView = false

// 轮播仅在模块可见且页面处于前台时运行，避免后台持续消耗渲染资源。
function syncDiagnosticGalleryMotion(): void {
  diagnosticGalleryActive.value = diagnosticGalleryInView && document.visibilityState === 'visible'
}

// 营销页只表达用户意图，登录态分流、路由与支付流程由父级统一处理。
const emit = defineEmits<{
  register: [targetPath: string]
  login: [targetPath: string]
  navigate: [targetPath: string]
  'open-report-demo': []
  'open-payment': []
  'scroll-top': []
}>()

// 注册入口携带完成注册后的目标页，确保主转化路径能继续到诊断中心。
function requestRegistration(targetPath: string) {
  if (props.authenticated) {
    emit('navigate', targetPath)
    return
  }
  emit('register', targetPath)
}

// 受保护功能入口携带登录后的回跳地址，不在演示组件内判断会话状态。
function requestLogin(targetPath: string) {
  if (props.authenticated) {
    emit('navigate', targetPath)
    return
  }
  emit('login', targetPath)
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

// 页脚产品入口回到营销首页顶部，由父级兼容滚动容器实现。
function requestScrollTop() {
  emit('scroll-top')
}

onMounted(() => {
  const gallery = diagnosticGalleryRef.value
  if (!gallery) return

  document.addEventListener('visibilitychange', syncDiagnosticGalleryMotion)
  if (!('IntersectionObserver' in window)) {
    diagnosticGalleryInView = true
    syncDiagnosticGalleryMotion()
    return
  }

  diagnosticGalleryObserver = new IntersectionObserver(
    ([entry]) => {
      diagnosticGalleryInView = Boolean(entry?.isIntersecting)
      syncDiagnosticGalleryMotion()
    },
    { threshold: 0.25 },
  )
  diagnosticGalleryObserver.observe(gallery)
})

onBeforeUnmount(() => {
  diagnosticGalleryObserver?.disconnect()
  document.removeEventListener('visibilitychange', syncDiagnosticGalleryMotion)
})
</script>

<template>
  <div class="home-marketing">
    <!--
      THESIS: 用可追溯的真题诊断证明“测清楚再练”，拒绝以空泛功能卡堆砌价值。
      OWN-WORLD: 黑白高对比编辑式页面、编号叙事、数据台账与深色报告面板。
      STORY: 访客先理解真题命题模型，再看诊断、报告、训练与错题如何形成闭环，最后选择注册或会员。
      FIRST VIEWPORT: 左侧一句主张和双行动，右侧放大一张标注为演示数据的诊断报告。
      FORM: 绑定参考 HTML 的纵向分屏叙事；营销说服模式；视觉结构由用户给定参考确定。
    -->
    <section
      v-if="props.includeHero"
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
      id="home-question-model"
      class="home-section home-snap-screen home-story-screen home-model-screen"
      aria-labelledby="home-model-title"
    >
      <div class="home-model-backdrop" aria-hidden="true">
        <div class="home-model-backdrop-track">
          <span class="home-model-backdrop-image home-model-backdrop-image--campus"></span>
          <span class="home-model-backdrop-image home-model-backdrop-image--chapel"></span>
          <span class="home-model-backdrop-image home-model-backdrop-image--campus"></span>
          <span class="home-model-backdrop-image home-model-backdrop-image--chapel"></span>
        </div>
      </div>
      <div class="home-page home-story-layout home-story-layout--reverse home-motion-content">
        <div class="home-story-copy">
          <div class="home-story-index">01 · 真题命题模型</div>
          <h2 id="home-model-title">
            <span class="home-story-title-line">真题做完以后，</span>
            <span class="home-story-title-line">还有同路数的新题可练</span>
          </h2>
          <p>系统整理真题中的考点、题型、推理方式和难度，再把这些边界用于专项练习。</p>
          <ul class="home-story-points">
            <li>不跨出当前 ESAT 考纲</li>
            <li>按科目、知识点与难度组合</li>
            <li>练习结果继续回到个人记录</li>
          </ul>
        </div>

        <div class="home-story-visual home-model-visual" aria-label="从真题到专项练习">
          <article>
            <span class="home-model-step">01</span>
            <el-icon class="home-model-stage-icon" aria-hidden="true">
              <DocumentChecked />
            </el-icon>
            <strong class="home-model-stage-title">真题拆解</strong>
            <span class="home-model-stage-subtitle">ENGAA / NSAA 可用历史题</span>
            <p>提取：知识点 · 题型 · 推理路径 · 难度</p>
          </article>
          <i class="home-flow-arrow" aria-hidden="true">→</i>
          <article class="home-model-stage--emphasis">
            <span class="home-model-step">02</span>
            <el-icon class="home-model-stage-icon" aria-hidden="true">
              <Connection />
            </el-icon>
            <strong class="home-model-stage-title">规律建模</strong>
            <span class="home-model-stage-subtitle">建立四维命题画像</span>
            <p>考点权重 · 任务类型 · 干扰项 · 难度梯度</p>
          </article>
          <i class="home-flow-arrow" aria-hidden="true">→</i>
          <article>
            <span class="home-model-step">03</span>
            <el-icon class="home-model-stage-icon" aria-hidden="true">
              <MagicStick />
            </el-icon>
            <strong class="home-model-stage-title">同源生成</strong>
            <span class="home-model-stage-subtitle">ESAT 专项练习</span>
            <p>按考纲、知识点与难度生成同路数新题</p>
          </article>
        </div>
      </div>
    </section>

    <section
      id="home-learning-loop"
      class="home-section home-snap-screen home-loop-screen home-marketing-loop-screen"
      aria-labelledby="home-loop-title"
    >
      <div class="home-page home-loop-layout home-motion-content">
        <header class="home-loop-heading">
          <p class="home-story-index">02 · 完整学习闭环</p>
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
          <p class="home-public-index">03 · 真题诊断</p>
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

        <div
          ref="diagnosticGalleryRef"
          class="home-public-visual home-diagnostic-gallery"
          :class="{ 'home-diagnostic-gallery--active': diagnosticGalleryActive }"
          role="img"
          aria-label="TMUA Paper 1 第 3 题、第 5 题和第 7 题真实作答界面轮播演示"
        >
          <figure class="home-diagnostic-shot home-diagnostic-shot--question-03" aria-hidden="true">
            <img
              :src="tmuaDiagnosticQuestion03Url"
              alt=""
              width="1375"
              height="880"
              loading="lazy"
              decoding="async"
            />
          </figure>
          <figure class="home-diagnostic-shot home-diagnostic-shot--question-05" aria-hidden="true">
            <img
              :src="tmuaDiagnosticQuestion05Url"
              alt=""
              width="1440"
              height="800"
              loading="lazy"
              decoding="async"
            />
          </figure>
          <figure class="home-diagnostic-shot home-diagnostic-shot--question-07" aria-hidden="true">
            <img
              :src="tmuaDiagnosticQuestion07Url"
              alt=""
              width="1375"
              height="880"
              loading="lazy"
              decoding="async"
            />
          </figure>
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
          <p class="home-public-index">04 · 专属诊断报告</p>
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
          <p class="home-public-index">05 · 专项练习</p>
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
          <p class="home-public-index">06 · 个人错题库</p>
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

    <HomeFooter @scroll-top="requestScrollTop" />
  </div>
</template>
