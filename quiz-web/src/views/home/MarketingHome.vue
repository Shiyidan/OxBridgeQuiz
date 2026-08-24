<!-- 访客营销首页：按 PRD 展示公开演示内容，并把注册、登录与功能跳转交给首页容器处理。 -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Connection, DocumentChecked, MagicStick } from '@element-plus/icons-vue'
import diagnosticScoreDistributionUrl from '@/assets/home/diagnostic-score-distribution.png'
import esatDiagnosticReportOverviewUrl from '@/assets/home/esat-diagnostic-report-overview.png'
import mistakeNotebookPreviewUrl from '@/assets/home/mistake-notebook-preview.png'
import mockExamCenterPreviewUrl from '@/assets/home/mock-exam-center-preview.png'
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

type MarketingHeroId = 'diagnostic' | 'mock-exam'

interface MarketingHeroSlide {
  id: MarketingHeroId
  kicker: string
  title: string
  actionLabel: string
  action: 'register' | 'navigate'
  targetPath: string
  imageUrl: string
  imageAlt: string
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

const diagnosticHeroSlide: MarketingHeroSlide = {
  id: 'diagnostic',
  kicker: 'ESAT · TMUA 真题诊断与智能训练',
  title: '真题诊断，练得更准',
  actionLabel: '免费开始诊断',
  action: 'register',
  targetPath: '/assessment',
  imageUrl: diagnosticScoreDistributionUrl,
  imageAlt: '诊断报告中的数学 2 平台估分分布与提升建议',
}

const heroSlides: readonly MarketingHeroSlide[] = [
  diagnosticHeroSlide,
  {
    id: 'mock-exam',
    kicker: 'ESAT · TMUA 全真模考与成绩追踪',
    title: '全真模考，考得更稳',
    actionLabel: '进入模考中心',
    action: 'navigate',
    targetPath: '/mock-exams',
    imageUrl: mockExamCenterPreviewUrl,
    imageAlt: '模考中心中的试卷搜索、状态筛选与 TMUA 模拟卷列表',
  },
]
const HERO_TRANSITION_DELAY_MS = 5000
const activeHeroId = ref<MarketingHeroId>('diagnostic')
const activeHero = computed<MarketingHeroSlide>(
  () => heroSlides.find((slide) => slide.id === activeHeroId.value) ?? diagnosticHeroSlide,
)

interface MarketingStatsCounts {
  diagnostic: number
  mockExam: number
  practice: number
  coverage: number
}

const STATS_ANIMATION_DURATION_MS = 900
const statsTargets: Readonly<MarketingStatsCounts> = {
  diagnostic: 15,
  mockExam: 11,
  practice: 2000,
  coverage: 100,
}
const statsSectionRef = ref<HTMLElement | null>(null)
const statsCounts = ref<MarketingStatsCounts>({
  diagnostic: 0,
  mockExam: 0,
  practice: 0,
  coverage: 0,
})
const diagnosticGalleryRef = ref<HTMLElement | null>(null)
const diagnosticGalleryActive = ref(false)
const practiceGalleryRef = ref<HTMLElement | null>(null)
const practiceGalleryActive = ref(false)
let diagnosticGalleryObserver: IntersectionObserver | null = null
let practiceGalleryObserver: IntersectionObserver | null = null
let diagnosticGalleryInView = false
let practiceGalleryInView = false
let statsObserver: IntersectionObserver | null = null
let statsAnimationFrame: number | null = null
let statsAnimationStarted = false
let heroTransitionTimer: number | null = null
let heroMotionPreference: MediaQueryList | null = null
let heroPrefersReducedMotion = false
const heroImagePreloads: HTMLImageElement[] = []
let heroGlowAnimationFrame: number | null = null
let heroGlowTarget: HTMLElement | null = null
let heroGlowClientX = 0
let heroGlowClientY = 0

// 统计数字离开视口或组件销毁时停止当前帧，避免后台继续计算。
function cancelStatsAnimation(): void {
  if (statsAnimationFrame !== null) {
    window.cancelAnimationFrame(statsAnimationFrame)
    statsAnimationFrame = null
  }
}

// 统计数字结束动画或减少动效时一次写入最终值，避免逐项更新造成不同步。
function finishStatsAnimation(): void {
  cancelStatsAnimation()
  statsCounts.value = { ...statsTargets }
}

// 模块完全离开视口后归零，使用户下一次进入时可以重新看到增长过程。
function resetStatsAnimation(): void {
  cancelStatsAnimation()
  statsAnimationStarted = false
  statsCounts.value = {
    diagnostic: 0,
    mockExam: 0,
    practice: 0,
    coverage: 0,
  }
}

// 数据模块进入视口时快速从零增长到目标值，同一次可见期间只触发一遍。
function startStatsAnimation(): void {
  if (statsAnimationStarted) return
  statsAnimationStarted = true

  if (heroPrefersReducedMotion) {
    finishStatsAnimation()
    return
  }

  const startedAt = performance.now()
  const updateCounts = (now: number): void => {
    const progress = Math.min((now - startedAt) / STATS_ANIMATION_DURATION_MS, 1)
    const easedProgress = 1 - Math.pow(1 - progress, 3)
    statsCounts.value = {
      diagnostic: Math.round(statsTargets.diagnostic * easedProgress),
      mockExam: Math.round(statsTargets.mockExam * easedProgress),
      practice: Math.round(statsTargets.practice * easedProgress),
      coverage: Math.round(statsTargets.coverage * easedProgress),
    }

    if (progress < 1) {
      statsAnimationFrame = window.requestAnimationFrame(updateCounts)
      return
    }
    statsAnimationFrame = null
    finishStatsAnimation()
  }
  statsAnimationFrame = window.requestAnimationFrame(updateCounts)
}

// 统计模块采用独立可见性观察器，只在用户真正看到该区域时播放数字动画。
function observeStatsSection(): void {
  const statsSection = statsSectionRef.value
  if (!statsSection) return
  if (!('IntersectionObserver' in window)) {
    startStatsAnimation()
    return
  }
  statsObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) {
        resetStatsAnimation()
        return
      }
      if (entry.intersectionRatio >= 0.35) startStatsAnimation()
    },
    { threshold: [0, 0.35] },
  )
  statsObserver.observe(statsSection)
}

// 首屏在诊断与模考之间循环切换，按钮悬停或聚焦时由交互事件暂时停表。
function clearHeroTransition(): void {
  if (heroTransitionTimer === null) return
  window.clearTimeout(heroTransitionTimer)
  heroTransitionTimer = null
}

// 模考截图在切换前预载，避免内容浮现时出现空白或图片跳动。
function preloadHeroImages(): void {
  for (const slide of heroSlides.slice(1)) {
    const image = new Image()
    image.decoding = 'async'
    image.src = slide.imageUrl
    heroImagePreloads.push(image)
  }
}

// 首屏仅在可见、启用且用户允许动效时安排下一次切换；减少动效模式固定展示模考内容。
function syncHeroTransition(): void {
  clearHeroTransition()
  if (!props.includeHero || document.visibilityState !== 'visible') return
  if (heroPrefersReducedMotion) {
    activeHeroId.value = 'mock-exam'
    return
  }
  heroTransitionTimer = window.setTimeout(() => {
    activeHeroId.value = activeHeroId.value === 'diagnostic' ? 'mock-exam' : 'diagnostic'
    heroTransitionTimer = null
    syncHeroTransition()
  }, HERO_TRANSITION_DELAY_MS)
}

// 系统动效偏好变化后立即同步首屏状态，避免继续执行不符合用户设置的过渡。
function handleHeroMotionPreferenceChange(event: MediaQueryListEvent): void {
  heroPrefersReducedMotion = event.matches
  if (event.matches && statsAnimationStarted) finishStatsAnimation()
  if (!event.matches) activeHeroId.value = 'diagnostic'
  syncHeroTransition()
}

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

// 当前首屏动作按内容语义进入注册流程或直接打开公开的模考中心。
function handleHeroAction(): void {
  const slide = activeHero.value
  if (slide.action === 'navigate') {
    emit('navigate', slide.targetPath)
    return
  }
  requestRegistration(slide.targetPath)
}

// 鼠标光晕按动画帧写入局部坐标，避免高频 pointermove 触发 Vue 响应式渲染。
function flushHeroGlowPosition(): void {
  heroGlowAnimationFrame = null
  if (!heroGlowTarget) return
  const bounds = heroGlowTarget.getBoundingClientRect()
  heroGlowTarget.style.setProperty('--home-hero-glow-x', `${heroGlowClientX - bounds.left}px`)
  heroGlowTarget.style.setProperty('--home-hero-glow-y', `${heroGlowClientY - bounds.top}px`)
}

// 桌面鼠标进入首屏后显示并移动光晕，触屏和手写笔不启用该装饰效果。
function handleHeroPointerMove(event: PointerEvent): void {
  if (event.pointerType !== 'mouse') return
  heroGlowTarget = event.currentTarget as HTMLElement
  heroGlowClientX = event.clientX
  heroGlowClientY = event.clientY
  heroGlowTarget.style.setProperty('--home-hero-glow-opacity', '1')
  if (heroGlowAnimationFrame === null) {
    heroGlowAnimationFrame = window.requestAnimationFrame(flushHeroGlowPosition)
  }
}

// 鼠标离开首屏后平滑隐藏光晕，避免光斑停留在页面边缘。
function handleHeroPointerLeave(event: PointerEvent): void {
  if (event.pointerType !== 'mouse') return
  ;(event.currentTarget as HTMLElement).style.setProperty('--home-hero-glow-opacity', '0')
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
  if (props.includeHero) preloadHeroImages()
  heroMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  heroPrefersReducedMotion = heroMotionPreference.matches
  heroMotionPreference.addEventListener('change', handleHeroMotionPreferenceChange)
  document.addEventListener('visibilitychange', syncHeroTransition)
  syncHeroTransition()
  observeStatsSection()

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
  clearHeroTransition()
  cancelStatsAnimation()
  if (heroGlowAnimationFrame !== null) window.cancelAnimationFrame(heroGlowAnimationFrame)
  heroGlowAnimationFrame = null
  heroGlowTarget = null
  statsObserver?.disconnect()
  heroImagePreloads.length = 0
  heroMotionPreference?.removeEventListener('change', handleHeroMotionPreferenceChange)
  diagnosticGalleryObserver?.disconnect()
  practiceGalleryObserver?.disconnect()
  document.removeEventListener('visibilitychange', syncHeroTransition)
  document.removeEventListener('visibilitychange', syncGalleryMotion)
})

watch(
  () => props.includeHero,
  (includeHero) => {
    if (!includeHero) {
      clearHeroTransition()
      activeHeroId.value = 'diagnostic'
      return
    }
    if (heroImagePreloads.length === 0) preloadHeroImages()
    syncHeroTransition()
  },
)
</script>

<template>
  <div class="home-marketing">
    <!--
      THESIS: 用可追溯的真题诊断证明“测清楚再练”，拒绝以空泛功能卡堆砌价值。
      OWN-WORLD: 黑白高对比编辑式页面、编号叙事、数据台账与深色报告面板。
      STORY: 访客先理解真题命题模型，再看诊断、报告、训练与错题如何形成闭环，最后选择注册或会员。
      FIRST VIEWPORT: 深色首屏以循环淡出切换串联真题诊断与全真模考，右侧只保留对应的真实产品证据。
      FORM: 绑定参考 HTML 的纵向分屏叙事；营销说服模式；视觉结构由用户给定参考确定。
    -->
    <section
      v-if="props.includeHero"
      id="home-marketing-hero"
      class="home-section home-snap-screen home-hero-screen"
      aria-labelledby="home-hero-title"
      @pointermove="handleHeroPointerMove"
      @pointerleave="handleHeroPointerLeave"
    >
      <div class="home-hero-cursor-glow" aria-hidden="true"></div>

      <Transition name="home-hero-switch" mode="out-in">
        <div
          :key="activeHero.id"
          class="home-page home-hero-layout home-motion-content"
        >
          <div class="home-hero-copy">
            <p class="home-hero-kicker">
              <span class="home-hero-kicker-text">
                <strong>AceMock</strong>
                <span aria-hidden="true"> — </span>
                {{ activeHero.kicker }}
              </span>
            </p>
            <h1 id="home-hero-title" class="home-hero-title">{{ activeHero.title }}</h1>

            <div class="home-hero-actions">
              <button
                class="home-btn home-btn-primary"
                type="button"
                @click="handleHeroAction"
                @mouseenter="clearHeroTransition()"
                @mouseleave="syncHeroTransition()"
                @focus="clearHeroTransition()"
                @blur="syncHeroTransition()"
              >
                {{ activeHero.actionLabel }}
                <span class="home-arrow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          <figure :class="['home-hero-report-shot', `home-hero-report-shot--${activeHero.id}`]">
            <div class="home-hero-report-shot-window">
              <img
                :class="[
                  'home-hero-report-shot-image',
                  `home-hero-report-shot-image--${activeHero.id}`,
                ]"
                :src="activeHero.imageUrl"
                :alt="activeHero.imageAlt"
                decoding="async"
                fetchpriority="high"
              />
            </div>
          </figure>
        </div>
      </Transition>
    </section>

    <section
      ref="statsSectionRef"
      class="home-section home-stats-section"
      aria-labelledby="home-stats-title"
    >
      <div class="home-page home-stats-inner">
        <header class="home-stats-heading">
          <p class="home-stats-kicker">为什么选择AceMock</p>
          <h2 id="home-stats-title">从诊断到模考，每一道题都有解答</h2>
        </header>

        <dl class="home-stats-grid">
          <div class="home-stat-item">
            <dd><strong>{{ statsCounts.diagnostic }}</strong><span>套</span></dd>
            <dt>诊断测试卷</dt>
          </div>
          <div class="home-stat-item">
            <dd><strong>{{ statsCounts.mockExam }}</strong><span>套</span></dd>
            <dt>全真模考卷</dt>
          </div>
          <div class="home-stat-item">
            <dd><strong>{{ statsCounts.practice }}</strong><span>+</span></dd>
            <dt>原生练习题</dt>
          </div>
          <div class="home-stat-item">
            <dd><strong>{{ statsCounts.coverage }}</strong><span>%</span></dd>
            <dt>题目与模拟题解答覆盖</dt>
          </div>
        </dl>

        <p class="home-stats-note"><i aria-hidden="true"></i>内容数量仍在持续更新中</p>
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
              width="1519"
              height="795"
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

        <figure class="home-mistake-preview">
          <img
            :src="mistakeNotebookPreviewUrl"
            alt="个人错题库中的原题、答案对照、考察点与历次作答轨迹"
            width="1456"
            height="834"
            loading="lazy"
            decoding="async"
          />
        </figure>
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
                  <strong>{{ props.memberPriceLabel }} </strong>
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
