<!-- 访客营销首页：按 PRD 展示公开演示内容，并把注册、登录与功能跳转交给首页容器处理。 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Connection, DocumentChecked, MagicStick } from '@element-plus/icons-vue'
import esatDiagnosticReportOverviewUrl from '@/assets/home/esat-diagnostic-report-overview.png'
import practiceNotebookPreviewUrl from '@/assets/home/practice-notebook-preview.png'
import questionBankPracticePreviewUrl from '@/assets/home/question-bank-practice-preview.png'
import tmuaDiagnosticQuestion03Url from '@/assets/home/tmua-diagnostic-question-03.png'
import tmuaDiagnosticQuestion05Url from '@/assets/home/tmua-diagnostic-question-05.png'
import tmuaDiagnosticQuestion07Url from '@/assets/home/tmua-diagnostic-question-07.png'
import HomeFooter from './HomeFooter.vue'

interface MarketingHomeProps {
  memberPriceLabel?: string
  quarterlyPriceLabel?: string
  quarterlyOriginalPriceLabel?: string
  quarterlyDiscountLabel?: string
  includeHero?: boolean
  authenticated?: boolean
}

// 会员价格由首页容器根据公开支付配置传入，购买入口始终交给父级完成认证分流。
const props = withDefaults(defineProps<MarketingHomeProps>(), {
  memberPriceLabel: '¥198',
  quarterlyPriceLabel: '¥356',
  quarterlyOriginalPriceLabel: '594',
  quarterlyDiscountLabel: '6折',
  includeHero: true,
  authenticated: false,
})

const diagnosticGalleryRef = ref<HTMLElement | null>(null)
const diagnosticGalleryActive = ref(false)
const practiceGalleryRef = ref<HTMLElement | null>(null)
const practiceGalleryActive = ref(false)
let diagnosticGalleryObserver: IntersectionObserver | null = null
let practiceGalleryObserver: IntersectionObserver | null = null
let diagnosticGalleryInView = false
let practiceGalleryInView = false

// 两组轮播仅在各自模块可见且页面处于前台时运行，避免后台持续消耗渲染资源。
function syncGalleryMotion(): void {
  diagnosticGalleryActive.value = diagnosticGalleryInView && document.visibilityState === 'visible'
  practiceGalleryActive.value = practiceGalleryInView && document.visibilityState === 'visible'
}

// 营销页只表达用户意图，登录态分流、路由与支付流程由父级统一处理。
const emit = defineEmits<{
  register: [targetPath: string]
  login: [targetPath: string]
  navigate: [targetPath: string]
  'open-payment': [planId: 'monthly' | 'quarterly']
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

// 购买入口由父级处理登录分流、考试类型选择与支付结果回写。
function requestPayment(planId: 'monthly' | 'quarterly') {
  emit('open-payment', planId)
}

// 页脚产品入口回到营销首页顶部，由父级兼容滚动容器实现。
function requestScrollTop() {
  emit('scroll-top')
}

onMounted(() => {
  const diagnosticGallery = diagnosticGalleryRef.value
  const practiceGallery = practiceGalleryRef.value
  if (!diagnosticGallery && !practiceGallery) return

  document.addEventListener('visibilitychange', syncGalleryMotion)
  if (!('IntersectionObserver' in window)) {
    diagnosticGalleryInView = Boolean(diagnosticGallery)
    practiceGalleryInView = Boolean(practiceGallery)
    syncGalleryMotion()
    return
  }

  if (diagnosticGallery) {
    diagnosticGalleryObserver = new IntersectionObserver(
      ([entry]) => {
        diagnosticGalleryInView = Boolean(entry?.isIntersecting)
        syncGalleryMotion()
      },
      { threshold: 0.25 },
    )
    diagnosticGalleryObserver.observe(diagnosticGallery)
  }

  if (practiceGallery) {
    practiceGalleryObserver = new IntersectionObserver(
      ([entry]) => {
        practiceGalleryInView = Boolean(entry?.isIntersecting)
        syncGalleryMotion()
      },
      { threshold: 0.25 },
    )
    practiceGalleryObserver.observe(practiceGallery)
  }
})

onBeforeUnmount(() => {
  diagnosticGalleryObserver?.disconnect()
  practiceGalleryObserver?.disconnect()
  document.removeEventListener('visibilitychange', syncGalleryMotion)
})
</script>

<template>
  <div class="home-marketing">
    <!--
      THESIS: 用可追溯的真题诊断证明“测清楚再练”，拒绝以空泛功能卡堆砌价值。
      OWN-WORLD: 黑白高对比编辑式页面、编号叙事、数据台账与深色报告面板。
      STORY: 访客先理解真题命题模型，再看诊断、报告、训练与错题如何形成闭环，最后选择注册或会员。
      FIRST VIEWPORT: 左侧一句主张和双行动，右侧放大一张诊断报告预览。
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
          <p class="home-hello">AceMock 云舟备考 · ESAT &amp; TMUA 智能备考系统</p>
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

        <aside class="home-report-preview" aria-label="ESAT Mathematics 1 诊断报告预览">
          <div class="home-report-preview-head">
            <div class="home-report-preview-heading">
              <strong>ESAT Mathematics 1</strong>
            </div>
            <span class="home-report-preview-type">诊断报告</span>
          </div>

          <div class="home-report-score">
            <span class="home-report-score-label">综合得分</span>
            <strong class="home-report-score-value">78</strong>
          </div>

          <div class="home-mastery-list" aria-label="知识点掌握度">
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

    <div class="home-marketing-story-background">
      <section
        id="home-question-model"
        class="home-section home-snap-screen home-story-screen home-model-screen"
        aria-labelledby="home-model-title"
      >
        <div class="home-page home-story-layout home-story-layout--reverse home-motion-content">
          <div class="home-story-copy">
            <div class="home-story-index">01 · 命题模型</div>
            <h2 id="home-model-title" class="home-section-title">
              <span class="home-story-title-line home-section-title">不只整理真题，</span>
              <span class="home-story-title-line home-section-title">我们把命题规律做成了模型</span>
            </h2>
            <p class="home-section-desc">
              从历年真题中提炼命题规律，通过自研模型生成贴合 ESAT 考纲的专项新题。
            </p>
            <ul class="home-story-points">
              <li>从真题中提炼命题规律，不是简单改写题面</li>
              <li>按科目、知识点与难度精准生成专项练习</li>
              <li>保留真实考试所要求的推理路径与能力结构</li>
            </ul>
          </div>

          <div class="home-story-visual home-model-visual" aria-label="从真题到专项练习">
            <article>
              <span class="home-model-step">01</span>
              <el-icon class="home-model-stage-icon" aria-hidden="true">
                <DocumentChecked />
              </el-icon>
              <strong class="home-model-stage-title">真题拆解</strong>
              <span class="home-model-stage-subtitle">提取考点、题型与推理路径</span>
              <p>知识点 · 题型 · 推理链路 · 难度</p>
            </article>
            <i class="home-flow-arrow" aria-hidden="true">→</i>
            <article class="home-model-stage--emphasis">
              <span class="home-model-step">02</span>
              <el-icon class="home-model-stage-icon" aria-hidden="true">
                <Connection />
              </el-icon>
              <strong class="home-model-stage-title">命题建模</strong>
              <span class="home-model-stage-subtitle">沉淀难度、干扰项与能力结构</span>
              <p>考点权重 · 任务类型 · 干扰项 · 难度梯度</p>
            </article>
            <i class="home-flow-arrow" aria-hidden="true">→</i>
            <article>
              <span class="home-model-step">03</span>
              <el-icon class="home-model-stage-icon" aria-hidden="true">
                <MagicStick />
              </el-icon>
              <strong class="home-model-stage-title">同构生成</strong>
              <span class="home-model-stage-subtitle">生成同考纲、同能力要求的新题</span>
              <p>按科目 · 知识点 · 能力结构 · 难度</p>
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
            <h2 id="home-loop-title" class="home-story-title-line home-section-title">
              做完一套题
            </h2>
            <h2 id="home-loop-title" class="home-story-title-line home-section-title">
              下一步练什么就清楚了
            </h2>
            <p class="home-section-desc">
              每一步都承接上一阶段的真实作答记录，从定位问题到验证是否掌握，形成可回看的备考闭环。
            </p>
          </header>

          <div class="home-story-visual home-loop-visual" aria-label="诊断、练习和错题流程">
            <article>
              <span>01</span>
              <div>
                <small>真题诊断</small><strong>用历年真题看清当前成绩、知识点和用时</strong>
              </div>
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
    </div>

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
          <h2 id="home-growth-title" class="home-story-title-line home-section-title">
            不只告诉你得了多少分
          </h2>
          <h2 id="home-growth-title" class="home-story-title-line home-section-title">
            还进行诊断分析
          </h2>
          <p class="home-section-desc">
            每一道题都与知识点和能力要求关联，帮助你发现持续失分的原因。
          </p>
        </header>

        <figure class="home-report-showcase" aria-label="ESAT 专属诊断报告长图演示">
          <div class="home-report-showcase-viewport">
            <img
              class="home-report-showcase-image"
              :src="esatDiagnosticReportOverviewUrl"
              alt="ESAT 诊断报告演示，包含等效评估分、水平定位、知识点掌握度与学习路径"
              loading="lazy"
            />
          </div>
        </figure>
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

        <div
          ref="practiceGalleryRef"
          class="home-practice-preview"
          :class="{ 'home-practice-preview--active': practiceGalleryActive }"
          role="img"
          aria-label="试题库与练习本页面自动轮换演示"
        >
          <figure
            class="home-practice-preview-shot home-practice-preview-shot--question-bank"
            aria-hidden="true"
          >
            <img
              :src="questionBankPracticePreviewUrl"
              alt=""
              width="1514"
              height="845"
              loading="lazy"
              decoding="async"
            />
          </figure>
          <figure
            class="home-practice-preview-shot home-practice-preview-shot--notebook"
            aria-hidden="true"
          >
            <img
              :src="practiceNotebookPreviewUrl"
              alt=""
              width="1539"
              height="734"
              loading="lazy"
              decoding="async"
            />
          </figure>
        </div>
      </div>
    </section>

    <div class="home-school-view-gap" aria-hidden="true"></div>

    <section
      id="home-mistake-preview"
      class="home-section home-snap-screen home-public-screen home-mistake-screen"
      aria-labelledby="home-mistake-title"
    >
      <div class="home-page home-mistake-layout home-motion-content">
        <header class="home-mistake-heading">
          <p class="home-public-index">06 · 个人错题库</p>
          <h2 id="home-mistake-title" class="home-story-title-line home-section-title">
            每一道错题
          </h2>
          <h2 id="home-mistake-title" class="home-story-title-line home-section-title">
            都成为下一次提分的依据
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
            升级套餐，专心备考
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
              <p>注册即可体验免费诊断与练习，学习过程持续为你保留。</p>
            </div>
            <ul class="home-benefit-list">
              <li class="home-benefit-item">1套诊断测试卷随做随出报告</li>
              <li class="home-benefit-item">每个考试享 25 道免费练习额度</li>
              <li class="home-benefit-item">诊断报告与历史学习记录持续保留</li>
              <li class="home-benefit-item">已完成内容的错题与解析随时回看</li>
            </ul>
            <button
              class="home-btn home-btn-secondary home-btn-block"
              type="button"
              @click="requestRegistration('/assessment')"
            >
              开始诊断
            </button>
          </article>

          <article class="home-price-card home-price-card-monthly">
            <div class="home-price-card-head">
              <div class="home-price-card-heading">
                <span>月度会员</span>
                <div class="home-price-main-line home-price-main-line-light">
                  <strong>{{ props.memberPriceLabel }}</strong>
                  <span class="home-price-unit">元</span>
                </div>
              </div>
              <p>适合单月集中备考，会员权益按所选 ESAT 或 TMUA 独立生效。</p>
            </div>
            <ul class="home-benefit-list">
              <li class="home-benefit-item">解锁全部会员诊断卷</li>
              <li class="home-benefit-item">不限次生成能力诊断报告</li>
              <li class="home-benefit-item">完整专项练习题库</li>
              <li class="home-benefit-item">30 天错题攻克与学习建议</li>
            </ul>
            <button
              class="home-btn home-btn-secondary home-btn-block"
              type="button"
              @click="requestPayment('monthly')"
            >
              开通月卡
            </button>
          </article>

          <article class="home-price-card home-price-card-member">
            <div class="home-price-recommended">推荐</div>
            <div class="home-price-card-head">
              <div class="home-price-card-heading">
                <span>季度会员</span>
                <div class="home-price-main-line">
                  <strong>{{ props.quarterlyPriceLabel }}</strong>
                  <del
                    >/{{ props.quarterlyOriginalPriceLabel
                    }}<span class="home-price-unit">元</span></del
                  >
                  <b>{{ props.quarterlyDiscountLabel }}</b>
                </div>
              </div>
              <p>适合完整备考周期，会员权益按所选 ESAT 或 TMUA 独立生效。</p>
            </div>
            <ul class="home-benefit-list">
              <li class="home-benefit-item">解锁全部会员诊断卷</li>
              <li class="home-benefit-item">不限次生成能力诊断报告</li>
              <li class="home-benefit-item">完整专项练习题库</li>
              <li class="home-benefit-item">90 天错题攻克与学习建议</li>
            </ul>
            <button
              class="home-btn home-btn-primary home-btn-block"
              type="button"
              @click="requestPayment('quarterly')"
            >
              开通季卡
            </button>
          </article>
        </div>

        <p class="home-pricing-note">会员权益以实际产品说明为准</p>
      </div>
    </section>

    <HomeFooter @scroll-top="requestScrollTop" />
  </div>
</template>
