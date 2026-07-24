<template>
  <div class="landing">
    <NavBar />

    <!-- ============ Hero ============ -->
    <section id="home" class="hero">
      <div class="container hero-inner">
        <div class="hero-text">
          <h1 class="hero-title">直通英国G5高校</h1>
          <p class="hero-sub-title">ESAT &amp; TMUA 专项备考</p>
          <div class="eyebrow">
            <span class="eyebrow-dot"></span>
            <span>精准诊断，让备考的每一步都算数</span>
          </div>
          <!-- <p class="hero-sub">免费诊断 · AI 精准分析 · 科学提分路径</p> -->
          <p class="hero-desc">
            基于真实试卷和考纲知识点的智能备考系统，一次评估看清能力分布。
          </p>
          <ul class="hero-features">
            <li v-for="f in heroFeatures" :key="f">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 8l3 3 7-7"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>{{ f }}</span>
            </li>
          </ul>
          <div class="hero-actions">
            <router-link to="/assessment" class="btn btn-primary">
              免费能力诊断
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 8h10M8 3l5 5-5 5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </router-link>
            <router-link to="/assessment" class="btn btn-secondary">我该考哪个？先匹配</router-link>
          </div>
          <p class="hero-note">无需注册 · 2 个模块约 30 分钟 · 即刻获取专属备考报告</p>
        </div>

        <!-- 右侧产品能力轮播图 -->
        <div class="hero-visual">
          <div class="banner-carousel hero-banner-carousel" aria-label="诊断报告与答题界面示例轮播">
            <img
              v-for="(banner, index) in heroBannerSlides"
              :key="banner.title"
              class="banner-image"
              :class="[
                `banner-image--${banner.variant}`,
                {
                  'banner-image--active': index === activeHeroBannerIndex,
                  'banner-image--previous':
                    index === previousHeroBannerIndex && index !== activeHeroBannerIndex,
                },
              ]"
              :src="banner.src"
              :alt="index === activeHeroBannerIndex ? banner.alt : ''"
              :aria-hidden="index !== activeHeroBannerIndex"
            />
            <div class="banner-dots" aria-hidden="true">
              <span
                v-for="(banner, index) in heroBannerSlides"
                :key="banner.title"
                class="banner-dot"
                :class="{ 'banner-dot--active': index === activeHeroBannerIndex }"
              ></span>
            </div>
          </div>

          <!-- <div class="path-card">
            <div class="path-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M8 3l5 5-5 5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="path-body">
              <div class="path-title">14 天路径</div>
              <div class="path-dots">
                <span v-for="n in 14" :key="n" class="path-dot" :class="{ done: n <= 4 }"></span>
              </div>
              <div class="path-label">Day 4 / 14</div>
            </div> -->
          <!-- </div> -->
        </div>
      </div>
    </section>

    <!-- ============ Features ============ -->
    <section class="section features" id="diagnosis">
      <div class="container">
        <header class="section-head">
          <div class="section-eyebrow"><span></span><span>Core Tools</span></div>
          <h2>你的智能备考核心工具</h2>
          <p class="section-desc">
            从诊断到提升，三个核心模块覆盖备考全流程，每一步都有数据支撑，每一题都精准高效。
          </p>
        </header>

        <div class="features-grid">
          <article class="feature-card">
            <div class="feature-tag">01 / 模考评估</div>
            <h3>模考评估与错题分析</h3>
            <p>
              每次模考自动生成模考报告与错题分析，错题自动关联知识点，支持错题重刷和复盘练习。
            </p>
            <div class="feature-visual">
              <div class="feature-stat">
                <span class="feature-val">7.2</span>
                <span class="feature-unit">/ 9.0</span>
              </div>
              <div class="feature-stat-label">模考成绩 · 模考 3 次 · 错题 2 题 · 进步 1 题</div>
            </div>
            <router-link to="/assessment" class="feature-cta"
              >免费诊断 1 套模考报告 →</router-link
            >
          </article>

          <article class="feature-card">
            <div class="feature-tag">02 / 知识体系</div>
            <h3>考纲知识点浏览器</h3>
            <p>完整 TMUA / ESAT 考纲结构图，按模块分类，每个知识点都有详细解析。</p>
            <div class="feature-list">
              <div v-for="n in kpNodes" :key="n" class="feature-list-item">
                <span>{{ n }}</span>
                <span class="arrow">→</span>
              </div>
            </div>
            <router-link to="/question-bank" class="feature-cta">浏览完整考纲 →</router-link>
          </article>

          <article class="feature-card">
            <div class="feature-tag">03 / AI 建议</div>
            <div class="feature-badge">Pro 用户解锁完整建议</div>
            <h3>AI 学习优先级建议</h3>
            <p>基于你的诊断结果，AI 推算薄弱知识点的学习优先级，生成 14 天动态学习路径。</p>
            <div class="feature-priority">
              <div v-for="item in priorityItems" :key="item.key" class="feature-priority-item">
                <div class="feature-priority-head">
                  <span class="rank">{{ item.rank }}</span>
                  <span class="name">{{ item.name }}</span>
                </div>
                <div class="bar"><div class="fill" :style="{ width: item.pct + '%' }"></div></div>
              </div>
            </div>
            <router-link to="/assessment" class="feature-cta">解锁完整建议 →</router-link>
          </article>
        </div>
      </div>
    </section>

    <!-- ============ Stats ============ -->
    <section class="section stats">
      <div class="container stats-inner">
        <div class="stats-left">
          <div class="section-eyebrow"><span></span><span>By the Numbers</span></div>
          <h2>数据驱动的<br />备考效率</h2>
          <p>每一个数字背后都是真实的备考轨迹。用数据证明，精准诊断比盲目刷题更有效。</p>
        </div>
        <div class="stats-grid">
          <div v-for="s in stats" :key="s.label" class="stat-card">
            <div class="stat-val">
              <span class="num">{{ s.num }}</span>
              <span class="unit">{{ s.unit }}</span>
            </div>
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-desc">{{ s.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ Process ============ -->
    <section class="section process">
      <div class="container">
        <header class="section-head">
          <div class="section-eyebrow"><span></span><span>How it Works</span></div>
          <h2>30 分钟完成一次完整诊断</h2>
          <p class="section-desc">
            三步走，从诊断到提升路径，全程自动化。无需等待人工批阅，无需自己整理错题。
          </p>
        </header>
        <div class="process-grid">
          <div v-for="p in processSteps" :key="p.no" class="process-step">
            <div class="process-step-head">
              <span class="process-step-no">{{ p.no }}</span>
            </div>
            <h3>{{ p.title }}</h3>
            <p>{{ p.desc }}</p>
            <div class="process-step-foot">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2" />
                <path
                  d="M7 4v3l2 1.5"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
              </svg>
              <span>{{ p.foot }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ Report ============ -->
    <section class="section report">
      <div class="container report-grid">
        <div class="report-visual-block">
          <div class="banner-carousel report-visual-carousel" aria-label="诊断报告类型示例轮播">
            <img
              v-for="(banner, index) in reportBannerSlides"
              :key="banner.title"
              class="banner-image"
              :class="{
                'banner-image--active': index === activeReportBannerIndex,
                'banner-image--previous':
                  index === previousReportBannerIndex && index !== activeReportBannerIndex,
              }"
              :src="banner.src"
              :alt="index === activeReportBannerIndex ? banner.alt : ''"
              :aria-hidden="index !== activeReportBannerIndex"
            />
            <div class="banner-dots" aria-hidden="true">
              <span
                v-for="(banner, index) in reportBannerSlides"
                :key="banner.title"
                class="banner-dot"
                :class="{ 'banner-dot--active': index === activeReportBannerIndex }"
              ></span>
            </div>
          </div>
        </div>
        <div class="report-content">
          <div class="section-eyebrow"><span></span><span>Diagnostic Report</span></div>
          <h2>一份报告，看清你的强弱项</h2>
          <p>
            诊断报告不只是分数。它把每一道错题映射到具体知识点，把每一次进步量化成可追踪的指标。
          </p>
          <ul class="report-list">
            <li v-for="r in reportBullets" :key="r">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.2" />
                <path
                  d="M5.5 9l2.5 2.5L12.5 7"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>{{ r }}</span>
            </li>
          </ul>
          <router-link to="/assessment" class="report-link">查看完整报告示例 →</router-link>
        </div>
      </div>
    </section>

    <!-- ============ Pricing ============ -->
    <PricingSection />

    <!-- ============ CTA ============ -->
    <section class="section cta">
      <div class="cta-deco"></div>
      <div class="container">
        <div class="cta-content">
          <div class="cta-eyebrow"><span></span><span>Get Started</span></div>
          <h2>开始你的第一次<br />免费能力诊断</h2>
          <p>无需注册即可体验，2 个模块约 30 分钟，即刻获取专属备考报告与 14 天学习路径。</p>
          <div class="cta-actions">
            <router-link to="/assessment" class="btn-cta-primary">
              免费能力诊断
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 8h10M8 3l5 5-5 5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </router-link>
            <router-link to="/assessment" class="btn-cta-secondary">我该考哪个？先匹配</router-link>
          </div>
          <div class="cta-trust">
            <div v-for="t in ctaTrust" :key="t" class="cta-trust-item">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M3 7l3 3 5-6"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>{{ t }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ Footer ============ -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-grid">
          <div class="footer-brand">
            <router-link to="/" class="logo">
              <span class="logo-mark" aria-hidden="true">
                <img :src="brandIconUrl" alt="" class="logo-mark-image" />
              </span>
              <span>云舟备考</span>
            </router-link>
            <p>基于真实机考形式和考纲知识点的智能备考系统。精准诊断，让备考的每一步都算数。</p>
          </div>
          <div>
            <h4 class="footer-col-title">产品</h4>
            <ul class="footer-col-list">
              <li><router-link to="/assessment">诊断测试</router-link></li>
              <li><router-link to="/question-bank">试题库</router-link></li>
              <li><router-link to="/mistake-notebook">错题本</router-link></li>
              <li><router-link to="/profile">个人中心</router-link></li>
            </ul>
          </div>
          <div>
            <h4 class="footer-col-title">考试</h4>
            <ul class="footer-col-list">
              <li><a>ESAT 介绍</a></li>
              <li><a>TMUA 介绍</a></li>
              <li><a>考纲下载</a></li>
              <li><a>常见问题</a></li>
            </ul>
          </div>
          <div>
            <h4 class="footer-col-title">关于</h4>
            <ul class="footer-col-list">
              <li><a>关于我们</a></li>
              <li><a>联系方式</a></li>
              <li><a>用户协议</a></li>
              <li><a>隐私政策</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-copy">
            <span>© 2026 云舟备考 SmartKey. All Rights Reserved.</span>
            <a
              class="footer-icp"
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
            >
              沪ICP备2026034877号
            </a>
          </div>
          <div class="footer-legal">
            <a>用户协议</a>
            <a>隐私政策</a>
            <a>联系我们</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// 首页（落地页）：Hero + Features + Stats + Process + Report + Pricing + CTA + Footer
// 极简黑白灰风格，所有样式取自全局 tokens，不再声明局部 CSS 变量。
import { onBeforeUnmount, onMounted, ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import PricingSection from '@/components/PricingSection.vue'
import esatBannerUrl from '@/assets/banner/esat_banner.png'
import questionCardBannerUrl from '@/assets/banner/question_card_banner.png'
import stepBannerUrl from '@/assets/banner/step_banner.png'
import tmuaBannerUrl from '@/assets/banner/tmua_banner.png'
import brandIconUrl from '@/assets/brand/acemock-icon.png'

const heroFeatures = ['免费诊断', '精准分析', '科学提分路径']

const heroBannerSlides = [
  {
    title: 'TMUA 学习诊断报告',
    src: tmuaBannerUrl,
    variant: 'report',
    alt: 'TMUA 学习诊断报告示例，展示综合得分、AI 学习优先级建议和近期模考趋势。',
  },
  {
    title: '在线答题卡界面',
    src: questionCardBannerUrl,
    variant: 'practice',
    alt: '在线答题卡界面示例，展示题目导航、题干、选项和答题进度。',
  },
] as const

const reportBannerSlides = [
  {
    title: 'ESAT 诊断测试报告',
    src: esatBannerUrl,
    alt: 'ESAT 诊断测试报告示例，展示综合得分、得分趋势、知识点掌握度与学习建议。',
  },
  {
    title: 'STEP 学习诊断看板',
    src: stepBannerUrl,
    alt: 'STEP 学习诊断看板示例，展示学习表现、模块表现、练习趋势和薄弱点。',
  },
  {
    title: 'TMUA 学习诊断报告',
    src: tmuaBannerUrl,
    alt: 'TMUA 学习诊断报告示例，展示综合得分、AI 学习优先级建议和近期模考趋势。',
  },
] as const

const activeHeroBannerIndex = ref(0)
const previousHeroBannerIndex = ref(0)
const activeReportBannerIndex = ref(0)
const previousReportBannerIndex = ref(0)
let bannerTimer: number | null = null

function nextCarouselSlide(
  activeIndex: typeof activeHeroBannerIndex,
  previousIndex: typeof previousHeroBannerIndex,
  total: number,
): void {
  previousIndex.value = activeIndex.value
  activeIndex.value = (activeIndex.value + 1) % total
}

// 首页轮播统一 5 秒切换一次，避免首屏和报告区动效节奏割裂。
onMounted(() => {
  bannerTimer = window.setInterval(() => {
    nextCarouselSlide(activeHeroBannerIndex, previousHeroBannerIndex, heroBannerSlides.length)
    nextCarouselSlide(activeReportBannerIndex, previousReportBannerIndex, reportBannerSlides.length)
  }, 5000)
})

onBeforeUnmount(() => {
  if (bannerTimer !== null) {
    window.clearInterval(bannerTimer)
  }
})

const kpNodes = ['代数与函数', '微积分', '逻辑与证明', '数论与组合']

const priorityItems = [
  { key: 'p0', rank: 'P0', name: '数论与组合', pct: 92 },
  { key: 'p1', rank: 'P1', name: '逻辑与证明', pct: 68 },
  { key: 'p2', rank: 'P2', name: '微积分', pct: 44 },
]

const stats = [
  { num: '30', unit: '分钟', label: '完成一次完整诊断', desc: '2 个模块，覆盖核心节点' },
  { num: '14', unit: '天', label: '动态学习路径', desc: 'AI 根据诊断结果生成' },
  { num: '63', unit: '%', label: '知识点覆盖率', desc: '完整 TMUA / ESAT 考纲' },
  { num: '+1.2', unit: '分', label: '平均预期提分', desc: '基于历史诊断数据' },
]

const processSteps = [
  {
    no: '01',
    title: '免费能力诊断',
    desc: '完成 2 个模块约 30 分钟的机考模拟，覆盖 TMUA / ESAT 核心节点。',
    foot: '约 30 分钟',
  },
  {
    no: '02',
    title: 'AI 自动生成报告',
    desc: '系统自动批阅并关联错题知识点，生成含强弱项分析的完整诊断报告。',
    foot: '即刻生成',
  },
  {
    no: '03',
    title: '14 天动态学习路径',
    desc: '基于诊断结果，AI 推算学习优先级，生成可执行的 14 天提升路径。',
    foot: '持续更新',
  },
]

const reportBullets = [
  '模块化图表，定位薄弱环节',
  '错题自动归因到知识点',
  '历史成绩趋势对比',
  'AI 生成可执行提升建议',
]

const ctaTrust = ['无需注册', '2 个模块约 30 分钟', '即刻获取专属备考报告']
</script>

<style scoped>
/* ============ 通用容器 & section ============ */
.landing {
  min-width: var(--fluid-page-min-width);
  overflow-x: clip;
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-ink);
}
/* 前台流体外壳：默认 1200px，缩窄浏览器时卡片随外壳收缩到紧凑下限。 */
.container {
  width: var(--fluid-shell-width);
  margin: 0 auto;
}
.section {
  padding: var(--section-py-mobile) 0;
}

  .section {
    padding: var(--section-py-desktop) 0;
  }


.section-head {
  max-width: 640px;
  margin-bottom: 4rem;
}

  .section-head {
    margin-bottom: 5rem;
  }

.section-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}
.section-eyebrow span:first-child {
  width: 24px;
  height: 1px;
  background: var(--color-ink);
}
.section-eyebrow span:last-child {
  font-size: 12px;
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  color: var(--color-ink);
  text-transform: uppercase;
}
.section-head h2,
.section h2 {
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
  color: var(--color-ink);
  margin: 0 0 20px;
}

  .section-head h2,
  .section h2 {
    font-size: var(--text-5xl);
  }

.section-desc {
  font-size: var(--text-base);
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
  max-width: 560px;
}

/* ============ Hero ============ */
.hero {
  /* padding-top: calc(var(--nav-height) + 64px); */
  padding-bottom: 64px;
  background: var(--color-bg);
}
.hero-inner {
  display: grid;
  gap: 48px;
  align-items: center;
}

  .hero-inner {
    grid-template-columns: 1.1fr 1fr;
    gap: 32px;
    min-height: calc(100vh - var(--nav-height) - 64px * 2);
    padding: 64px 0;
  }

.hero-text {
  max-width: 560px;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  background: var(--color-hover);
  border-radius: var(--radius-pill);
  margin-bottom: 28px;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  color: var(--color-ink-soft);
}
.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-ink);
}
.hero-title {
  font-size: clamp(58px, 3.6vw, 72px);
  font-weight: var(--weight-bold);
  line-height: 1;
  letter-spacing: 0;
  color: var(--color-ink);
  margin: 0 0 20px;
}

.hero-sub-title {
  margin: 0 0 22px;
  color: var(--color-ink);
  font-size: clamp(36px, 2.8vw, 48px);
  font-weight: var(--weight-medium);
  line-height: 1.12;
  letter-spacing: 0;
}

.hero-sub {
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  color: var(--color-ink);
  margin: 0 0 16px;
}
.hero-desc {
  font-size: var(--text-lg);
  color: var(--color-ink-soft);
  line-height: 1.75;
  margin: 0 0 28px;
  max-width: 560px;
}
.hero-features {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 24px;
  margin: 0 0 42px;
  padding: 0;
  list-style: none;
}
.hero-features li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: var(--weight-semi);
  color: var(--color-ink);
}
.hero-features svg {
  color: var(--color-ink);
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 28px;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 58px;
  padding: 0 34px;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
  transition: all var(--duration-base) ease;
  border: 1px solid transparent;
  cursor: pointer;
}
.btn-primary {
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  border-color: var(--color-ink);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}
.btn-primary:hover {
  background: var(--color-charcoal);
  border-color: var(--color-charcoal);
  color: var(--color-ink-inverse);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}
.btn-secondary {
  background: var(--color-surface);
  color: var(--color-ink);
  border-color: var(--color-line);
  padding: 0 30px;
}
.btn-secondary:hover {
  color: var(--color-ink);
  border-color: var(--color-ink);
}
.hero-note {
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
  margin: 0;
}
.hero-visual {
  position: relative;
  min-height: 420px;
  display: flex;
  align-items: center;
}

.banner-carousel {
  position: relative;
  width: min(100%, 560px);
  aspect-ratio: 4 / 3;
  margin-left: auto;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-2xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  isolation: isolate;
}
.hero-banner-carousel {
  width: min(100%, 620px);
  aspect-ratio: 16 / 9;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.98)),
    var(--color-surface);
}
.report-visual-carousel {
  width: min(100%, 620px);
  aspect-ratio: 4 / 3;
  margin: 0 auto;
  box-shadow: var(--shadow-lg);
}
.banner-image {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  filter: blur(5px) saturate(0.9);
  transform: translate3d(34px, 18px, 0) scale(0.975);
  transform-origin: center;
  transition:
    opacity 1s var(--ease-out),
    transform 1s var(--ease-out),
    filter 1s var(--ease-out);
  will-change: opacity, transform, filter;
  z-index: 1;
}
.hero-banner-carousel .banner-image {
  object-fit: cover;
}
.hero-banner-carousel .banner-image--report {
  object-position: 50% 50%;
}
.hero-banner-carousel .banner-image--practice {
  object-position: 50% 42%;
}
.report-visual-carousel .banner-image {
  object-fit: cover;
  object-position: center;
}
.banner-image--active {
  opacity: 1;
  filter: blur(0) saturate(1);
  transform: translate3d(0, 0, 0) scale(1);
  z-index: 2;
}
.banner-image--previous {
  opacity: 0;
  filter: blur(4px) saturate(0.96);
  transform: translate3d(-28px, -14px, 0) scale(1.018);
  z-index: 1;
}
.banner-dots {
  position: absolute;
  left: 50%;
  bottom: 18px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid color-mix(in srgb, var(--color-line) 76%, transparent);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-surface) 84%, transparent);
  box-shadow: var(--shadow-sm);
  transform: translateX(-50%);
}
.banner-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-line);
  transition:
    width var(--duration-slow) var(--ease-out),
    background var(--duration-slow) var(--ease-out);
}
.banner-dot--active {
  width: 22px;
  border-radius: var(--radius-pill);
  background: var(--color-ink);
}

/* ============ 视觉轮播 & 路径卡片 ============ */
.path-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  max-width: 260px;
  margin-top: 24px;
  margin-left: auto;
}

  .path-card {
    position: absolute;
    right: 0;
    bottom: -20px;
    margin: 0;
  }

.path-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  flex-shrink: 0;
}
.path-title {
  font-size: 13px;
  font-weight: var(--weight-semi);
  color: var(--color-ink);
  margin-bottom: 6px;
}
.path-dots {
  display: flex;
  gap: 3px;
  margin-bottom: 4px;
}
.path-dot {
  width: 8px;
  height: 4px;
  background: var(--color-line);
  border-radius: 2px;
}
.path-dot.done {
  background: var(--color-ink);
}
.path-label {
  font-size: 11px;
  color: var(--color-ink-muted);
}

/* ============ Features ============ */
.features {
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}
.features-grid {
  display: grid;
  gap: 24px;
}

  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }

.feature-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  padding: 32px;
  transition: all var(--duration-slow) ease;
  overflow: hidden;
}
.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-ink);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-slow) ease;
}
.feature-card:hover {
  border-color: var(--color-ink);
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}
.feature-card:hover::before {
  transform: scaleX(1);
}
.feature-tag {
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: var(--weight-bold);
  color: var(--color-ink-muted);
  margin-bottom: 16px;
  letter-spacing: 0.02em;
}
.feature-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: var(--weight-semi);
  padding: 3px 10px;
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  border-radius: var(--radius-pill);
  margin-bottom: 16px;
}
.feature-card h3 {
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
  margin: 0 0 12px;
  line-height: var(--leading-snug);
}
.feature-card p {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
  margin: 0 0 24px;
}
.feature-visual {
  padding: 20px;
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
}
.feature-stat {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}
.feature-val {
  font-size: 36px;
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--color-ink);
  line-height: 1;
}
.feature-unit {
  font-size: var(--text-base);
  color: var(--color-ink-muted);
}
.feature-stat-label {
  font-size: 12px;
  color: var(--color-ink-muted);
}
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}
.feature-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: var(--weight-medium);
  color: var(--color-ink);
}
.feature-list-item .arrow {
  color: var(--color-ink);
}
.feature-priority {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}
.feature-priority-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.feature-priority-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.feature-priority-head .rank {
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: var(--weight-bold);
  padding: 2px 6px;
  background: var(--color-hover);
  color: var(--color-ink);
  border-radius: 4px;
}
.feature-priority-head .name {
  font-size: 13px;
  font-weight: var(--weight-medium);
  color: var(--color-ink);
}
.feature-priority-item .bar {
  height: 6px;
  background: var(--color-line-soft);
  border-radius: 3px;
  overflow: hidden;
}
.feature-priority-item .fill {
  height: 100%;
  background: var(--color-ink);
  border-radius: 3px;
}
.feature-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  color: var(--color-ink);
  padding-top: 12px;
  border-top: 1px solid var(--color-line-soft);
}
.feature-cta:hover {
  color: var(--color-charcoal);
}

/* ============ Stats ============ */
.stats {
  background: var(--color-bg);
}
.stats-inner {
  display: grid;
  gap: 48px;
  align-items: start;
}

  .stats-inner {
    grid-template-columns: 1fr 1.4fr;
    gap: 80px;
  }

.stats-left h2 {
  margin-bottom: 20px;
}
.stats-left p {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--color-ink-soft);
  max-width: 420px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: var(--color-line);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  overflow: hidden;
}
.stat-card {
  background: var(--color-surface);
  padding: 40px;
  transition: background var(--duration-base) ease;
}
.stat-card:hover {
  background: var(--color-hover);
}
.stat-val {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 12px;
}
.stat-val .num {
  font-size: 48px;
  font-weight: var(--weight-bold);
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--color-ink);
}

  .stat-val .num {
    font-size: 56px;
  }

.stat-val .unit {
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  color: var(--color-ink-muted);
}
.stat-label {
  font-size: 15px;
  font-weight: var(--weight-semi);
  color: var(--color-ink);
  margin-bottom: 4px;
}
.stat-desc {
  font-size: 13px;
  color: var(--color-ink-muted);
  line-height: var(--leading-normal);
}

/* ============ Process ============ */
.process {
  background: var(--color-bg);
}
.process-grid {
  display: grid;
  gap: 1px;
  background: var(--color-line);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-2xl);
  overflow: hidden;
}

  .process-grid {
    grid-template-columns: repeat(3, 1fr);
  }

.process-step {
  background: var(--color-surface);
  padding: 40px;
  transition: background var(--duration-base) ease;
}
.process-step:hover {
  background: var(--color-hover);
}
.process-step-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.process-step-no {
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
}
.process-step h3 {
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
  margin: 0 0 12px;
  line-height: var(--leading-snug);
}
.process-step p {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
  margin: 0 0 24px;
}
.process-step-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 20px;
  border-top: 1px solid var(--color-line-soft);
  color: var(--color-ink-muted);
}
.process-step-foot span {
  font-size: 12px;
  font-weight: var(--weight-medium);
}

/* ============ Report ============ */
.report {
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}
.report-grid {
  display: grid;
  gap: 48px;
  align-items: center;
}

  .report-grid {
    grid-template-columns: 1fr 1fr;
    gap: 80px;
  }

.report-visual-block {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.report-content h2 {
  margin-bottom: 20px;
}
.report-content p {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--color-ink-soft);
  margin: 0 0 32px;
  max-width: 480px;
}
.report-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0 0 40px;
  padding: 0;
  list-style: none;
}
.report-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 15px;
  color: var(--color-ink);
  line-height: var(--leading-snug);
}
.report-list svg {
  color: var(--color-ink);
  flex-shrink: 0;
  margin-top: 2px;
}
.report-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: var(--weight-semi);
  color: var(--color-ink);
}
.report-link:hover {
  color: var(--color-charcoal);
}

/* ============ CTA ============ */
.cta {
  background: var(--color-charcoal);
  position: relative;
  overflow: hidden;
  color: var(--color-ink-inverse);
}
.cta-deco {
  position: absolute;
  inset: 0;
  opacity: 0.06;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px);
  background-size: 48px 48px;
}
.cta-content {
  position: relative;
  max-width: 760px;
}
.cta-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}
.cta-eyebrow span:first-child {
  width: 24px;
  height: 1px;
  background: var(--color-ink-inverse);
}
.cta-eyebrow span:last-child {
  font-size: 12px;
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  color: var(--color-ink-inverse);
  text-transform: uppercase;
}
.cta h2 {
  font-size: 40px;
  font-weight: var(--weight-bold);
  line-height: 1.05;
  letter-spacing: var(--tracking-tight);
  color: var(--color-ink-inverse);
  margin: 0 0 24px;
}

  .cta h2 {
    font-size: 56px;
  }

.cta p {
  font-size: 17px;
  line-height: var(--leading-relaxed);
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 40px;
  max-width: 520px;
}
.cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 40px;
}
.btn-cta-primary,
.btn-cta-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: var(--weight-semi);
  transition: all var(--duration-base) ease;
}
.btn-cta-primary {
  background: var(--color-ink-inverse);
  color: var(--color-ink);
}
.btn-cta-primary:hover {
  background: var(--color-hover);
  color: var(--color-ink);
  transform: translateY(-2px);
}
.btn-cta-secondary {
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--color-ink-inverse);
}
.btn-cta-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--color-ink-inverse);
  color: var(--color-ink-inverse);
}
.cta-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}
.cta-trust-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}
.cta-trust-item svg {
  color: var(--color-ink-inverse);
}

/* ============ Footer ============ */
.footer {
  background: var(--color-bg);
  border-top: 1px solid var(--color-line);
}
.footer-inner {
  padding: 64px var(--container-px-mobile);
}

  .footer-inner {
    padding: 80px var(--container-px-desktop);
  }

.footer-grid {
  display: grid;
  gap: 40px;
  margin-bottom: 64px;
}

  .footer-grid {
    grid-template-columns: 1.4fr 1fr 1fr 1fr;
    gap: 48px;
  }

.footer-brand .logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-ink);
  font-weight: var(--weight-bold);
  font-size: 17px;
  margin-bottom: 20px;
}
.footer-brand .logo-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  overflow: hidden;
}
.footer-brand .logo-mark-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scale(1.45);
}
.footer-brand p {
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--color-ink-soft);
  max-width: 300px;
  margin: 0;
}
.footer-col-title {
  font-size: 13px;
  font-weight: var(--weight-semi);
  color: var(--color-ink);
  margin: 0 0 16px;
}
.footer-col-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  list-style: none;
}
.footer-col-list a {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
  cursor: pointer;
}
.footer-col-list a:hover {
  color: var(--color-ink);
}
.footer-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 32px;
  border-top: 1px solid var(--color-line);
}

  .footer-bottom {
    flex-direction: row;
  }

.footer-copy {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 16px;
  font-size: 12px;
  color: var(--color-ink-muted);
}
.footer-icp {
  color: inherit;
}
.footer-icp:hover {
  color: var(--color-ink);
}
.footer-legal {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
}
.footer-legal a {
  font-size: 12px;
  color: var(--color-ink-muted);
  cursor: pointer;
}
.footer-legal a:hover {
  color: var(--color-ink);
}
</style>
