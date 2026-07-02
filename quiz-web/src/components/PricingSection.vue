<template>
  <section id="pricing" class="pricing">
    <div class="container">
      <header class="section-head">
        <div class="section-eyebrow"><span></span><span>Pricing</span></div>
        <h2>选择适合你的备考方案</h2>
        <p class="section-desc">从免费体验到全维度冲刺，覆盖备考每一阶段的需求。</p>
      </header>

      <div class="plan-grid">
        <article
          v-for="plan in plans"
          :key="plan.id"
          class="plan-card"
          :class="{ 'plan-card--pro': plan.featured }"
        >
          <span v-if="plan.featured" class="plan-badge">推荐</span>

          <header class="plan-header">
            <h3 class="plan-title">{{ plan.title }}</h3>
            <p class="plan-tagline">{{ plan.tagline }}</p>
          </header>

          <div class="plan-price">
            <span class="plan-price-amount">¥&nbsp;{{ plan.price }}</span>
            <span class="plan-price-suffix">/ 月</span>
          </div>

          <ul class="plan-features">
            <li
              v-for="(feature, idx) in plan.features"
              :key="idx"
              class="plan-feature"
              :class="{
                'plan-feature--disabled': !feature.included,
                'plan-feature--highlight': feature.highlight,
              }"
            >
              <span class="plan-feature-icon" aria-hidden="true">
                <svg
                  v-if="feature.included"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <svg
                  v-else
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
              <span class="plan-feature-text">{{ feature.text }}</span>
            </li>
          </ul>

          <button
            class="plan-cta"
            :class="plan.featured ? 'plan-cta--pro' : 'plan-cta--free'"
            :disabled="plan.ctaDisabled"
            @click="handleSelectPlan(plan)"
          >
            {{ plan.ctaText }}
          </button>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// 定价方案卡片区（首页 HomeView 使用，Free / Pro 双卡对比，Pro 卡走深色反色）
import { reactive } from 'vue'

interface PlanFeature {
  text: string
  included: boolean
  highlight?: boolean
}

interface Plan {
  id: string
  title: string
  tagline: string
  price: string
  features: PlanFeature[]
  ctaText: string
  ctaDisabled: boolean
  featured: boolean
}

const emit = defineEmits<{
  (e: 'select', plan: Plan): void
}>()

const plans = reactive<Plan[]>([
  {
    id: 'free',
    title: '免费用户',
    tagline: '多种功能，任你体验',
    price: '0',
    features: [
      { text: '100 道练习题（任意知识点、难度）', included: true },
      { text: '1 套真题测试', included: true },
      { text: '1 次真题能力诊断', included: true },
      { text: '1 次模考试用', included: true },
      { text: '错题本基础收录', included: true },
    ],
    ctaText: '继续试用',
    ctaDisabled: false,
    featured: false,
  },
  {
    id: 'member',
    title: '会员用户',
    tagline: 'AI 全流程引导提升',
    price: '499',
    features: [
      { text: '5000+ 练习题任意刷（覆盖全部知识点）', included: true, highlight: true },
      { text: '全部历史真题测试', included: true, highlight: true },
      { text: '不限次数真题能力诊断', included: true, highlight: true },
      { text: '600+ 模拟卷任意考', included: true },
      { text: '错题智能收录 + 知识点标注 + 攻克', included: true },
    ],
    ctaText: '升级会员',
    ctaDisabled: false,
    featured: true,
  },
])

const handleSelectPlan = (plan: Plan): void => {
  emit('select', plan)
}
</script>

<style scoped>
.pricing {
  padding: var(--section-py-mobile) 0;
  background: var(--color-bg);
}

  .pricing {
    padding: var(--section-py-desktop) 0;
  }

/* 前台流体外壳，与首页 HomeView 共用规范。 */
.container {
  width: clamp(var(--fluid-shell-min), var(--fluid-shell-fluid), var(--fluid-shell-max));
  margin: 0 auto;
}

.section-head {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 64px;
}
.section-eyebrow {
  display: inline-flex;
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
.section-head h2 {
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
  margin: 0 0 16px;
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
}

  .section-head h2 {
    font-size: var(--text-5xl);
  }

.section-desc {
  font-size: var(--text-base);
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
  margin: 0;
}

/* ========== 方案卡网格 ========== */
.plan-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: stretch;
  max-width: 960px;
  margin: 0 auto;
}

  .plan-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }


/* ========== 通用方案卡 ========== */
.plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-2xl);
  padding: 40px;
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-slow) ease;
}
.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-ink);
}

/* ========== Pro 卡：深色反色 ========== */
.plan-card--pro {
  background: var(--color-charcoal);
  border-color: var(--color-charcoal);
  color: var(--color-ink-inverse);
}
.plan-card--pro:hover {
  border-color: var(--color-black);
  background: var(--color-black);
}

/* ========== 推荐标签 ========== */
.plan-badge {
  position: absolute;
  top: 24px;
  right: 24px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: var(--weight-semi);
  letter-spacing: 0.05em;
  color: var(--color-ink-inverse);
}

/* ========== 头部 ========== */
.plan-header {
  margin-bottom: 32px;
}
.plan-title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  margin: 0 0 8px;
  letter-spacing: -0.01em;
  color: inherit;
}
.plan-tagline {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  margin: 0;
  color: var(--color-ink-muted);
}
.plan-card--pro .plan-tagline {
  color: rgba(255, 255, 255, 0.7);
}

/* ========== 价格 ========== */
.plan-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-line-soft);
}
.plan-card--pro .plan-price {
  border-bottom-color: rgba(255, 255, 255, 0.15);
}
.plan-price-amount {
  font-size: 48px;
  font-weight: var(--weight-bold);
  line-height: 1;
  letter-spacing: -0.03em;
  color: inherit;
}
.plan-price-suffix {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--color-ink-muted);
}
.plan-card--pro .plan-price-suffix {
  color: rgba(255, 255, 255, 0.6);
}

/* ========== 功能列表 ========== */
.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}
.plan-feature {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--color-ink);
}
.plan-card--pro .plan-feature {
  color: rgba(255, 255, 255, 0.92);
}
.plan-feature--highlight {
  font-weight: var(--weight-semi);
}
.plan-feature--disabled {
  color: var(--color-ink-muted);
}
.plan-feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  margin-top: 1px;
  border-radius: var(--radius-sm);
  background: var(--color-hover);
  color: var(--color-ink);
}
.plan-card--pro .plan-feature-icon {
  background: rgba(255, 255, 255, 0.12);
  color: var(--color-ink-inverse);
}
.plan-feature--disabled .plan-feature-icon {
  background: transparent;
  color: var(--color-ink-muted);
}

/* ========== CTA 按钮 ========== */
.plan-cta {
  width: 100%;
  padding: 14px 24px;
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--duration-base) ease;
}
.plan-cta:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.plan-cta--free {
  background: var(--color-surface);
  color: var(--color-ink);
}
.plan-cta--free:hover:not(:disabled) {
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}
.plan-cta--pro {
  background: var(--color-ink-inverse);
  color: var(--color-ink);
  border-color: var(--color-ink-inverse);
}
.plan-cta--pro:hover:not(:disabled) {
  background: var(--color-hover);
  transform: translateY(-2px);
}

/* ========== 响应式 ========== */

  .plan-card {
    padding: 32px;
  }
  .plan-price-amount {
    font-size: 40px;
  }

</style>
