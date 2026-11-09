<!-- 桌面首页会员方案：承接现有公开价格，所选考试与套餐交给首页支付流程。 -->
<script setup lang="ts">
import { ref } from 'vue'
import AnnualMembershipPlans from '@/components/AnnualMembershipPlans.vue'
import type { AnnualPlan } from '@/constants/annualMembership'
import { Right, TopRight } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import type { ActiveExamType } from '@/stores/auth'

const emit = defineEmits<{
  register: [path: string]
  payment: [plan: AnnualPlan, exam: ActiveExamType]
}>()
const exam = ref<ActiveExamType>('ESAT')
const exams: ActiveExamType[] = ['ESAT', 'TMUA']
const pricing = ref<HTMLElement | null>(null)
// 收尾入口回到本页套餐选择，保留当前所选考试并尊重减少动效偏好。
function showMembershipPlans() {
  pricing.value?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}
</script>

<template>
  <section
    id="home-pricing"
    ref="pricing"
    class="membership-intro"
    aria-labelledby="membership-intro-title"
  >
    <div class="membership-container">
      <header class="membership-heading">
        <div>
          <span class="section-eyebrow">MEMBERSHIP / 会员方案</span>
          <h2 id="membership-intro-title">按你的节奏，选择备考方案。</h2>
        </div>
        <div class="membership-exams" role="group" aria-label="选择会员适用考试">
          <span>选择备考考试</span
          ><AppButton
            v-for="item in exams"
            :key="item"
            type="text"
            size="small"
            :class="{ active: exam === item }"
            :aria-pressed="exam === item"
            @click="exam = item"
            >{{ item }}</AppButton
          >
        </div>
      </header>
      <p class="membership-scope" aria-live="polite">
        当前选择 {{ exam }} · 会员权益按考试独立生效，ESAT 与 TMUA 不通用。
      </p>
      <AnnualMembershipPlans @select="emit('payment', $event, exam)" />
      <p class="pricing-note">价格与权益以开通时的实际说明为准。</p>
    </div>
  </section>
  <section class="closing-intro" aria-labelledby="closing-intro-title">
    <h2 id="closing-intro-title">下一步，从看清自己开始。</h2>
    <div>
      <AppButton :icon="TopRight" icon-position="right" @click="emit('register', '/assessment')"
        >开始免费诊断</AppButton
      ><AppButton type="secondary" :icon="Right" icon-position="right" @click="showMembershipPlans"
        >查看会员方案</AppButton
      >
    </div>
  </section>
</template>

<style scoped>
.membership-intro {
  padding: 52px 48px 32px;
  color: #17252e;
  background: linear-gradient(135deg, #edf5ff, #e7f1ff 60%, #f1f7fe);
  scroll-margin-top: 88px;
}
.membership-container {
  max-width: 1370px;
  margin: auto;
}
.membership-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding-right: 78px;
}
.section-eyebrow {
  font-size: 10px;
  font-weight: 650;
  color: #6d879e;
  letter-spacing: 0.08em;
}
.membership-heading h2 {
  font-size: clamp(27px, 2.4vw, 35px);
  line-height: 1.4;
  font-weight: 700;
  margin: 9px 0;
  letter-spacing: -0.035em;
}
.membership-heading p {
  font-size: 13px;
  color: #71889d;
  margin: 0;
}
.membership-exams {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}
.membership-exams > span {
  font-size: 11px;
  color: #8496a8;
  margin-right: 10px;
}
.membership-exams :deep(.app-button.el-button) {
  padding: 0 3px;
  border-radius: 0;
  --app-button-color: #71869a;
  font-size: 12px;
}
.membership-exams :deep(.app-button.el-button.active) {
  border-bottom: 2px solid #c7e84c;
  --app-button-color: #17252e;
}
.membership-scope {
  font-size: 11px;
  color: #8599ab;
  margin: 16px 0 22px;
}
.membership-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
.membership-card {
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 28px 28px 24px;
  border: 1px solid #e2ebf5;
  border-radius: 13px;
  background: #ffffffef;
  box-shadow: 0 5px 20px #7397ba05;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.membership-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px #6485a310;
}
.plan-name {
  font-size: 14px;
  font-weight: 650;
}
.plan-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 10px 0;
}
.plan-price strong {
  font-size: clamp(29px, 3vw, 40px);
  line-height: 1.2;
  font-weight: 750;
  letter-spacing: -0.04em;
}
.plan-price > span {
  font-size: 12px;
  color: #778b9e;
}
.plan-description {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 24px;
  margin: 0;
  font-size: 11px;
  color: #8296aa;
}
.plan-description b {
  font-size: 10px;
  font-weight: 600;
  background: #eef8c6;
  color: #67792d;
  padding: 2px 6px;
  border-radius: 3px;
}
.membership-card ul {
  list-style: none;
  margin: 24px 0 26px;
  padding: 0;
  flex: 1;
}
.membership-card li {
  display: flex;
  gap: 9px;
  font-size: 12px;
  line-height: 1.8;
  color: #556c7f;
  margin: 8px 0;
}
.membership-card li svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #abc344;
  margin-top: 3px;
}
.membership-card > :deep(.app-button.el-button) {
  width: 100%;
  --app-button-bg: #17252e;
  --app-button-border: #17252e;
}
.membership-card > :deep(.app-button .el-icon) {
  color: #d0ed75;
}
.free-card > :deep(.app-button.el-button) {
  --app-button-bg: #fff;
  --app-button-color: #243a4b;
  --app-button-border: #d5e1ec;
}
.free-card > :deep(.app-button .el-icon) {
  color: #6b879e;
}
.recommended-card {
  border-color: #d5e6ed;
}
.recommendation {
  position: absolute;
  right: 22px;
  top: 22px;
  font-size: 10px;
  font-weight: 650;
  background: #e8f9aa;
  color: #4d6524;
  padding: 4px 8px;
  border-radius: 4px;
}
.pricing-note {
  font-size: 10px;
  color: #91a3b5;
  text-align: center;
  margin: 21px 0 0;
}
.closing-intro {
  padding: 44px 32px 48px;
  background: #fff;
  text-align: center;
  color: #17252e;
}
.closing-intro h2 {
  margin: 0 0 24px;
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.03em;
}
.closing-intro > div {
  display: flex;
  justify-content: center;
  gap: 18px;
}
.closing-intro :deep(.app-button--primary) {
  --app-button-bg: #17252e;
  --app-button-border: #17252e;
}
.closing-intro :deep(.app-button--primary .el-icon) {
  color: #d3ef79;
}
@media (max-width: 1100px) {
  .membership-intro {
    padding: 42px 32px 30px;
  }
  .membership-grid {
    gap: 16px;
  }
  .membership-card {
    padding: 24px 20px 20px;
  }
  .membership-exams {
    gap: 14px;
  }
  .membership-exams > span {
    display: none;
  }
  .plan-price {
    gap: 5px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .membership-card {
    transition: none;
  }
  .membership-card:hover {
    transform: none;
  }
}
</style>
