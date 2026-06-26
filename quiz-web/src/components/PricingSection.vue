<template>
  <section id="pricing" class="pricing">
    <div class="pricing-layout">
      <div class="section-head">
        <span class="section-kicker">Membership</span>
        <h2>先试一次诊断，再决定要不要进入完整训练。</h2>
        <p class="section-sub">付费策略保持清晰：免费用户可体验核心流程，会员用户解锁长期冲刺所需的题量、真题和错题攻克。</p>
      </div>

      <div class="pricing-aside">
        <span class="aside-label">推荐路径</span>
        <strong>诊断 → 练习 → 真题 → 错题攻克</strong>
        <p>适合正在准备 TMUA、ESAT 或其他英本高强度入学笔试的学生。</p>
      </div>
    </div>

    <div class="plan-grid">
      <article
        v-for="plan in plans"
        :key="plan.id"
        class="plan-card"
        :class="{ 'plan-card--pro': plan.featured }"
      >
        <span v-if="plan.featured" class="plan-badge">
          <svg
            class="badge-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6 7 18.2l1.9-5.8L4 8.8h6.1z" />
          </svg>
          推荐
        </span>
        <span v-else class="plan-badge plan-badge--quiet">体验</span>

        <template v-if="plan.featured">
          <span class="plan-glow plan-glow--top"></span>
          <span class="plan-glow plan-glow--bottom"></span>
        </template>

        <header class="plan-header">
          <span class="plan-kicker">{{ plan.featured ? 'Full Preparation' : 'Trial Access' }}</span>
          <h3 class="plan-title">{{ plan.title }}</h3>
          <p class="plan-tagline">{{ plan.tagline }}</p>
        </header>

        <div class="plan-price">
          <span class="plan-price-amount">¥&nbsp;{{ plan.price }}</span>
          <span class="plan-price-suffix">/&nbsp;月</span>
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
            <span class="plan-feature-icon">
              <svg
                v-if="feature.included"
                width="20"
                height="20"
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
                width="20"
                height="20"
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
  </section>
</template>

<script setup lang="ts">
// 定价方案卡片区（首页 HomeView 使用，Free / Pro 双卡对比）
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
      { text: '100道练习题（任意知识点、难度）', included: true },
      { text: '1套真题测试', included: true },
      { text: '1次真题能力诊断', included: true },
      { text: '1次模考试用', included: true },
      { text: '错题本基础收录', included: true },
    ],
    ctaText: '继续试用',
    ctaDisabled: false,
    featured: false,
  },
  {
    id: 'member',
    title: '会员用户',
    tagline: 'AI全流程引导提升',
    price: '499',
    features: [
      { text: '5000+练习题任意刷（覆盖全部知识点）', included: true, highlight: true },
      { text: '全部历史真题测试', included: true, highlight: true },
      { text: '不限次数真题能力诊断', included: true, highlight: true },
      { text: '600+模拟卷任意考', included: true },
      { text: '错题智能收录 + 知识点标注 + 错题攻克', included: true },
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

<style scoped lang="scss">
/* 设计令牌（与 样式开发规范.md 对齐） */
.pricing {
  --color-primary: #53624b;
  --color-primary-light: #7d875f;
  --color-primary-dark: #10150f;
  --color-primary-bg: rgba(83, 98, 75, 0.1);

  --color-bg: #eef1ea;
  --color-surface: rgba(247, 244, 236, 0.84);
  --color-border: rgba(37, 42, 34, 0.16);
  --color-border-light: rgba(255, 255, 255, 0.54);

  --color-text: #171a16;
  --color-text-secondary: #52584e;
  --color-text-muted: #848a80;
  --color-text-inverse: #ffffff;
  --color-gold: #c9aa68;

  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-20: 5rem;

  --radius-md: 0.5rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.5rem;
  --radius-2xl: 0.5rem;
  --radius-pill: 999px;

  --shadow-sm: 0 18px 60px rgba(24, 28, 20, 0.08);
  --shadow-md: 0 22px 70px rgba(24, 28, 20, 0.11);
  --shadow-lg: 0 30px 80px rgba(24, 28, 20, 0.16);
  --shadow-pro: 0 30px 92px rgba(16, 21, 15, 0.32);

  position: relative;
  z-index: 6;
  max-width: 1280px;
  margin: 1rem auto 0;
  padding: 5rem var(--space-8) 5.5rem;
  background: rgba(238, 241, 234, 0.74);
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: var(--radius-2xl);
  box-shadow: 0 28px 80px rgba(7, 11, 7, 0.28);
  backdrop-filter: blur(20px);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Roboto,
    sans-serif;
}

@media (min-width: 900px) {
  .pricing {
    position: sticky;
    top: 5.75rem;
  }
}

@supports (animation-timeline: view()) {
  .pricing-layout,
  .plan-card {
    animation: pricingRise linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 64%;
  }

  .plan-card--pro {
    animation-range: entry 8% entry 72%;
  }
}

@keyframes pricingRise {
  from {
    opacity: 0.2;
    transform: translateY(36px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pricing-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 340px);
  gap: 3rem;
  align-items: end;
  margin-bottom: 3rem;
}

.section-head {
  max-width: 720px;

  h2 {
    font-family: Georgia, 'Times New Roman', 'Songti SC', serif;
    font-size: clamp(2rem, 3.4vw, 3.35rem);
    font-weight: 500;
    line-height: 1.24;
    color: var(--color-text);
    margin: 0 0 var(--space-4);
    letter-spacing: 0;
  }
}

.section-kicker,
.aside-label,
.plan-kicker {
  display: block;
  color: var(--color-gold);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.section-kicker {
  margin-bottom: 1rem;
}

.section-sub {
  font-size: 1rem;
  line-height: 1.85;
  color: var(--color-text-secondary);
  margin: 0;
}

.pricing-aside {
  padding: 1.5rem;
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.34);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
}

.pricing-aside strong {
  display: block;
  margin-top: 1.1rem;
  font-family: Georgia, 'Times New Roman', 'Songti SC', serif;
  font-size: 1.35rem;
  font-weight: 500;
  line-height: 1.35;
}

.pricing-aside p {
  margin: 1rem 0 0;
  color: var(--color-text-secondary);
  line-height: 1.75;
}

/* ========== 方案卡网格 ========== */
.plan-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  align-items: stretch;
  max-width: none;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  box-shadow: 0 18px 60px rgba(24, 28, 20, 0.12);
}

/* ========== 通用方案卡 ========== */
.plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: rgba(247, 244, 236, 0.68);
  border: 0;
  border-radius: 0;
  min-height: 560px;
  padding: clamp(1.75rem, 3vw, 2.6rem);
  box-shadow: none;
  transition:
    transform 0.3s ease,
    background 0.3s ease;
  overflow: hidden;
  isolation: isolate;
  backdrop-filter: blur(18px);
}

.plan-card:hover {
  background: rgba(255, 255, 255, 0.56);
  transform: translateY(-3px);
}

/* ========== Pro 卡：深色学院背景 ========== */
.plan-card--pro {
  background:
    linear-gradient(155deg, rgba(16, 21, 15, 0.94), rgba(48, 58, 42, 0.92)),
    linear-gradient(90deg, rgba(201, 170, 104, 0.2), transparent);
  border-color: transparent;
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-pro);
}

.plan-card--pro:hover {
  background:
    linear-gradient(155deg, rgba(16, 21, 15, 0.98), rgba(56, 68, 48, 0.96)),
    linear-gradient(90deg, rgba(201, 170, 104, 0.26), transparent);
  transform: translateY(-3px);
}

/* Pro 卡装饰光晕 */
.plan-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.36;
  pointer-events: none;
  z-index: -1;
}

.plan-glow--top {
  top: -80px;
  right: -80px;
  width: 280px;
  height: 280px;
  background: rgba(244, 226, 178, 0.38);
}

.plan-glow--bottom {
  bottom: -120px;
  left: -60px;
  width: 240px;
  height: 240px;
  background: rgba(83, 98, 75, 0.55);
}

/* ========== 推荐标签 ========== */
.plan-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(244, 226, 178, 0.34);
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--color-text-inverse);
  margin-bottom: var(--space-5);
  backdrop-filter: blur(8px);
}

.plan-badge--quiet {
  color: var(--color-text-secondary);
  background: rgba(16, 21, 15, 0.04);
  border-color: var(--color-border);
}

.badge-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ========== 头部 ========== */
.plan-header {
  margin-bottom: var(--space-6);
}

.plan-kicker {
  margin-bottom: 0.8rem;
}

.plan-title {
  font-family: Georgia, 'Times New Roman', 'Songti SC', serif;
  font-size: clamp(1.65rem, 2.2vw, 2.25rem);
  font-weight: 500;
  margin: 0 0 var(--space-3);
  letter-spacing: 0;
  color: inherit;
}

.plan-card--pro .plan-title {
  color: var(--color-text-inverse);
}

.plan-tagline {
  font-size: 0.938rem;
  line-height: 1.6;
  margin: 0;
  color: var(--color-text-secondary);
}

.plan-card--pro .plan-tagline {
  color: rgba(255, 255, 255, 0.75);
}

/* ========== 价格 ========== */
.plan-price {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding-bottom: var(--space-6);
  margin-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.plan-price-amount {
  font-size: clamp(2.6rem, 4.2vw, 3.8rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0;
  color: var(--color-text);
}

.plan-card--pro .plan-price-amount {
  color: var(--color-text-inverse);
}

.plan-price-suffix {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.plan-card--pro .plan-price-suffix {
  color: rgba(255, 255, 255, 0.7);
}

/* ========== 功能列表 ========== */
.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  flex: 1;
}

.plan-feature {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  font-size: 0.94rem;
  line-height: 1.65;
  color: var(--color-text);
}

.plan-card--pro .plan-feature {
  color: rgba(255, 255, 255, 0.92);
}

.plan-feature--highlight {
  font-weight: 700;
}

.plan-feature--disabled {
  color: var(--color-text-muted);
}

.plan-feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px !important;
  height: 20px !important;
  min-width: 20px;
  max-width: 20px;
  flex: 0 0 20px;
  margin-top: 2px;
  color: var(--color-primary);
  overflow: hidden;
}

.plan-card--pro .plan-feature-icon {
  color: var(--color-gold);
}

.plan-feature--disabled .plan-feature-icon {
  color: var(--color-text-muted);
}

.plan-feature-icon svg {
  display: block;
  width: 20px !important;
  height: 20px !important;
  max-width: 20px !important;
  max-height: 20px !important;
}

/* ========== CTA 按钮 ========== */
.plan-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 52px;
  padding: 14px 24px;
  border: none;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.plan-cta:disabled {
  cursor: not-allowed;
}

/* 免费方案 CTA：浅灰底 */
.plan-cta--free {
  background: rgba(16, 21, 15, 0.06);
  color: var(--color-text);
  border-color: var(--color-border);
}

.plan-cta--free:hover {
  background: rgba(16, 21, 15, 0.1);
  color: var(--color-text);
}

/* Pro 方案 CTA：白色半透明（已订阅状态） */
.plan-cta--pro {
  background: rgba(255, 255, 255, 0.12);
  color: var(--color-text-inverse);
  border-color: rgba(244, 226, 178, 0.34);
  backdrop-filter: blur(12px);
}

.plan-cta--pro:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
}

.plan-cta--pro:disabled {
  opacity: 0.85;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .pricing {
    margin: 1rem;
    padding: 2.75rem 1.25rem;
  }

  .pricing-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .section-head {
    h2 {
      font-size: 2rem;
    }
  }

  .section-sub {
    font-size: 1rem;
  }

  .plan-grid {
    grid-template-columns: 1fr;
  }

  .plan-card {
    min-height: auto;
    padding: var(--space-6);
  }

  .plan-price-amount {
    font-size: 2.35rem;
  }
}
</style>
