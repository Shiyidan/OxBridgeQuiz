<template>
  <section id="pricing" class="pricing">
    <div class="section-head">
      <h2>选择适合您的备考方案</h2>
      <p class="section-sub">从免费体验到全维度冲刺，覆盖每一阶段的需求</p>
    </div>

    <div class="plan-grid">
      <!-- ========== 免费基础版 ========== -->
      <article
        v-for="plan in plans"
        :key="plan.id"
        class="plan-card"
        :class="{ 'plan-card--pro': plan.featured }"
      >
        <!-- 推荐标签 -->
        <span v-if="plan.featured" class="plan-badge">
          <svg
            class="badge-icon"
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

        <!-- 装饰光晕（仅 Pro 卡） -->
        <template v-if="plan.featured">
          <span class="plan-glow plan-glow--top"></span>
          <span class="plan-glow plan-glow--bottom"></span>
        </template>

        <header class="plan-header">
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
              <!-- ✓ 已包含 -->
              <svg
                v-if="feature.included"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <!-- ✗ 未包含 -->
              <svg
                v-else
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
    title: '免费基础版',
    tagline: '体验核心功能，了解您的学术现状。',
    price: '0',
    features: [
      { text: '1 次 AI 初始能力评估', included: true },
      { text: '浏览历年公开的考试大纲', included: true },
      { text: '无试题库访问权限', included: false },
      { text: '无智能错题本', included: false },
      { text: '无导师在线答疑', included: false },
    ],
    ctaText: '降级至免费版',
    ctaDisabled: false,
    featured: false,
  },
  {
    id: 'pro',
    title: 'Pro 旗舰版',
    tagline: '冲击 G5 名校的最强辅助体系。',
    price: '299',
    features: [
      { text: '无限次考前模拟及全真诊断', included: true },
      { text: '完全解锁所有笔试真题及解析(TMUA/ESAT等)', included: true, highlight: true },
      { text: 'AI 动态生成相似题库重点突破', included: true, highlight: true },
      { text: '智能错题本归档与分析', included: true, highlight: true },
      { text: '优先获得面试真题及题库更新', included: true },
    ],
    ctaText: '您已订阅 Pro',
    ctaDisabled: true,
    featured: true,
  },
])

const handleSelectPlan = (plan: Plan): void => {
  console.log('[PricingSection] select plan:', plan.id)
  emit('select', plan)
}
</script>

<style scoped lang="scss">
/* 设计令牌（与 样式开发规范.md 对齐） */
.pricing {
  --color-primary: #4f46e5;
  --color-primary-light: #6366f1;
  --color-primary-dark: #4338ca;
  --color-primary-bg: #eef2ff;

  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-border-light: #f1f5f9;

  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;

  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-20: 5rem;

  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --shadow-pro: 0 24px 48px -12px rgba(79, 70, 229, 0.45);

  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-20) var(--space-8);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Roboto,
    sans-serif;
}

/* ========== 标题区 ========== */
.section-head {
  text-align: center;
  margin-bottom: 4rem;

  h2 {
    font-size: 2rem; /* text-3xl 30px → 用项目惯例 32px */
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-3);
    letter-spacing: -0.02em;
  }
}

.section-sub {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* ========== 方案卡网格 ========== */
.plan-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-6);
  align-items: stretch;
  max-width: 960px;
  margin: 0 auto;
}

/* ========== 通用方案卡 ========== */
.plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-10);
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
  overflow: hidden;
  isolation: isolate;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-light);
}

/* ========== Pro 卡：紫色实心背景 ========== */
.plan-card--pro {
  background: linear-gradient(160deg, #5b52ec 0%, #4f46e5 60%, #4338ca 100%);
  border-color: transparent;
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-pro);
}

.plan-card--pro:hover {
  transform: translateY(-6px);
  box-shadow: 0 32px 56px -12px rgba(79, 70, 229, 0.55);
  border-color: transparent;
}

/* Pro 卡装饰光晕 */
.plan-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.45;
  pointer-events: none;
  z-index: -1;
}

.plan-glow--top {
  top: -80px;
  right: -80px;
  width: 280px;
  height: 280px;
  background: rgba(255, 255, 255, 0.18);
}

.plan-glow--bottom {
  bottom: -120px;
  left: -60px;
  width: 240px;
  height: 240px;
  background: rgba(99, 102, 241, 0.6);
}

/* ========== 推荐标签 ========== */
.plan-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--color-text-inverse);
  margin-bottom: var(--space-6);
  backdrop-filter: blur(8px);
}

.badge-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ========== 头部 ========== */
.plan-header {
  margin-bottom: var(--space-8);
}

.plan-title {
  font-size: 1.5rem; /* text-2xl 24px */
  font-weight: 700;
  margin: 0 0 var(--space-3);
  letter-spacing: -0.01em;
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
  margin-bottom: var(--space-8);
}

.plan-price-amount {
  font-size: 3rem; /* text-5xl 48px */
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
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
  margin: 0 0 var(--space-10);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  flex: 1;
}

.plan-feature {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  font-size: 0.938rem;
  line-height: 1.5;
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
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--color-primary);
}

.plan-card--pro .plan-feature-icon {
  color: #a5f3d0; /* 浅绿色对比，提高识别度 */
}

.plan-feature--disabled .plan-feature-icon {
  color: var(--color-text-muted);
}

.plan-feature-icon svg {
  width: 100%;
  height: 100%;
}

/* ========== CTA 按钮 ========== */
.plan-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: var(--radius-lg);
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
  background: var(--color-border-light);
  color: var(--color-text-secondary);
}

.plan-cta--free:hover {
  background: #e7ecf2;
  color: var(--color-text);
}

/* Pro 方案 CTA：白色半透明（已订阅状态） */
.plan-cta--pro {
  background: rgba(255, 255, 255, 0.18);
  color: var(--color-text-inverse);
  border: 1px solid rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(8px);
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
    padding: 3rem 1.25rem;
  }

  .section-head {
    margin-bottom: 2.5rem;

    h2 {
      font-size: 1.5rem;
    }
  }

  .section-sub {
    font-size: 1rem;
  }

  .plan-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .plan-card {
    padding: var(--space-8);
  }

  .plan-price-amount {
    font-size: 2.5rem;
  }
}
</style>
