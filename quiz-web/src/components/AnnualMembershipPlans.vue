<!-- 首页年卡选择：读取后台最新价格，按做题、学习和组合展示三项商品。 -->
<template>
  <div v-if="loading" class="annual-state" role="status" aria-live="polite">正在读取会员价格…</div>
  <div v-else-if="error" class="annual-state" role="alert">
    <p>{{ error }}</p>
    <AppButton type="secondary" @click="load">重新加载</AppButton>
  </div>
  <div v-else class="annual-plans">
    <article
      v-for="plan in plans"
      :key="plan.id"
      class="annual-plan"
      :class="{ 'annual-plan--bundle': plan.id === 'annual_bundle' }"
    >
      <header class="annual-heading">
        <h3>{{ plan.name }}</h3>
        <span v-if="plan.id === 'annual_bundle'" class="annual-recommendation">推荐组合</span>
      </header>
      <p class="annual-subtitle">{{ plan.description }}</p>
      <div class="annual-price">
        <span class="annual-currency">¥</span><strong>{{ plan.price / 100 }}</strong
        ><span class="annual-period">/ 年</span>
      </div>
      <div class="annual-offer">
        <del>原价 ¥{{ plan.original / 100 }}</del>
        <span class="annual-discount"
          >{{ Number(((plan.price / plan.original) * 10).toFixed(1)) }} 折</span
        >
      </div>
      <ul class="annual-benefits" aria-label="套餐权益">
        <li v-for="benefit in plan.benefits" :key="benefit">
          <CircleCheck aria-hidden="true" /><span>{{ benefit }}</span>
        </li>
      </ul>
      <footer class="annual-footer">
        <p class="annual-scope">所选考试独立开通 · 有效期 365 天</p>
        <AppButton
          class="annual-action"
          :type="plan.id === 'annual_bundle' ? 'primary' : 'secondary'"
          :disabled="!available"
          :icon="Right"
          icon-position="right"
          :aria-label="available ? `开通${plan.name}` : '暂未开放购买'"
          @click="emit('select', plan.id)"
          >{{ available ? '开通年卡' : '暂未开放购买' }}</AppButton
        >
      </footer>
    </article>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppButton from './AppButton.vue'
import { CircleCheck, Right } from '@element-plus/icons-vue'
import { getPaymentConfig } from '@/api/payment'
import { DEFAULT_ANNUAL_PRICING, type AnnualPlan } from '@/constants/annualMembership'
import { getApiErrorMessage } from '@/utils/request'
const emit = defineEmits<{ select: [plan: AnnualPlan] }>()
const prices = ref({ ...DEFAULT_ANNUAL_PRICING })
const loading = ref(true)
const error = ref('')
const available = ref(false)
// 组合原价为两个单项原价之和，实付使用后台固定金额。
const plans = computed(() => [
  {
    id: 'annual_practice' as const,
    name: '做题年卡',
    price: prices.value.practicePriceCents,
    original: prices.value.practiceOriginalPriceCents,
    description: '真题练习与考前实战',
    benefits: ['会员诊断试卷与模拟考试', '专项题库与练习本', '答卷解析与错题回顾'],
  },
  {
    id: 'annual_learning' as const,
    name: '学习平台年卡',
    price: prices.value.learningPriceCents,
    original: prices.value.learningOriginalPriceCents,
    description: '理解知识点，掌握解题方法',
    benefits: ['知识点讲解与解题方法', '教学例题与详细解析', '知识点自测与巩固'],
  },
  {
    id: 'annual_bundle' as const,
    name: '做题＋学习平台',
    price: prices.value.bundlePriceCents,
    original: prices.value.practiceOriginalPriceCents + prices.value.learningOriginalPriceCents,
    description: '从知识学习到做题巩固',
    benefits: ['包含做题年卡全部权益', '包含学习平台年卡全部权益', '学习与练习同步使用'],
  },
])
// 价格读取失败时不使用默认价格诱导下单。
async function load() {
  loading.value = true
  error.value = ''
  try {
    const config = await getPaymentConfig()
    prices.value = config.annualPricing
    available.value = config.status === 'active'
  } catch (cause) {
    error.value = getApiErrorMessage(cause, '会员价格暂时无法读取')
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<style scoped>
.annual-plans {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  font-family: var(--font-sans, 'PingFang SC', 'Microsoft YaHei', sans-serif);
}
.annual-plan {
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 28px;
  color: #17252e;
  background: #fff;
  border: 1px solid #dce5ed;
  border-radius: 16px;
  box-shadow: 0 5px 20px rgb(55 80 104 / 3%);
}
.annual-plan--bundle {
  border-color: #bed67b;
  background: linear-gradient(155deg, #f6faeb, #fff 60%);
  box-shadow: 0 8px 28px rgb(85 110 41 / 7%);
}
.annual-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  min-height: 28px;
}
.annual-heading h3 {
  margin: 0;
  font-size: 18px;
  line-height: 1.5;
  font-weight: 650;
}
.annual-recommendation {
  margin-left: auto;
  padding: 4px 9px;
  border-radius: 5px;
  color: #41571d;
  background: #e7f4b9;
  font-size: 11px;
  line-height: 1.5;
  font-weight: 650;
  white-space: nowrap;
}
.annual-subtitle {
  margin: 8px 0 25px;
  color: #647587;
  font-size: 13px;
  line-height: 1.6;
}
.annual-price {
  display: flex;
  align-items: baseline;
  gap: 3px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.annual-currency {
  font-size: 23px;
  font-weight: 600;
}
.annual-price strong {
  font-size: 46px;
  font-weight: 700;
  letter-spacing: -1.5px;
}
.annual-period {
  margin-left: 7px;
  color: #647587;
  font-size: 13px;
}
.annual-offer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  min-height: 24px;
  font-size: 12px;
}
.annual-offer del {
  color: #718092;
}
.annual-discount {
  padding: 3px 8px;
  border-radius: 4px;
  color: #526a26;
  background: #f0f6df;
  font-size: 11px;
  font-weight: 650;
}
.annual-benefits {
  display: grid;
  gap: 14px;
  margin: 24px 0;
  padding: 23px 0 0;
  list-style: none;
  border-top: 1px solid #e7edf2;
}
.annual-benefits li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #42586b;
  font-size: 13px;
  line-height: 1.6;
}
.annual-benefits svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  color: #75953a;
}
.annual-footer {
  margin-top: auto;
  padding-top: 4px;
}
.annual-scope {
  margin: 0 0 15px;
  color: #647587;
  font-size: 11px;
  line-height: 1.6;
}
.annual-action.app-button.el-button {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  --app-button-border: #d5dfe7;
  --app-button-color: #243a4b;
  --app-button-bg: #fff;
}
.annual-plan--bundle .annual-action.app-button.el-button {
  --app-button-bg: #17252e;
  --app-button-border: #17252e;
  --app-button-color: #fff;
  --app-button-hover-bg: #2d414d;
  --app-button-hover-border: #2d414d;
}
.annual-action:focus-visible {
  outline: 3px solid #6e8d33;
  outline-offset: 3px;
}
.annual-state {
  display: flex;
  min-height: 360px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  color: #52677a;
  background: #fff;
  border: 1px solid #dce5ed;
  border-radius: 16px;
}
@media (hover: hover) and (pointer: fine) {
  .annual-plan:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgb(55 80 104 / 10%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .annual-plan {
    transition: none;
  }
  .annual-plan:hover {
    transform: none;
  }
}
@media (max-width: 1100px) and (min-width: 861px) {
  .annual-plan {
    padding: 22px 18px;
  }
  .annual-heading h3 {
    font-size: 16px;
  }
  .annual-recommendation {
    margin-left: 0;
  }
}
@media (max-width: 860px) {
  .annual-plans {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .annual-plan {
    padding: 24px;
  }
  .annual-state {
    min-height: 240px;
  }
}
</style>
