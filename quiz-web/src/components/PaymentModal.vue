<!-- 会员支付弹窗：选择已开放考试、套餐与支付渠道并完成订单支付。 -->
<template>
  <Teleport to="body">
    <Transition name="payment-fade">
      <div
        v-if="modelValue"
        class="payment-overlay"
        role="presentation"
        @mousedown.self="closeModal"
      >
        <section
          class="payment-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
        >
          <header class="payment-header">
            <h2 id="payment-modal-title">选择会员套餐</h2>
            <button
              class="payment-close"
              type="button"
              aria-label="关闭支付弹窗"
              @click="closeModal"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          <div class="payment-body">
            <div class="payment-options">
              <div class="option-section">
                <p class="option-label">请选择您的备考类型：</p>
                <div class="exam-options">
                  <label v-for="exam in examOptions" :key="exam.value" class="exam-option">
                    <input
                      v-model="selectedExam"
                      type="radio"
                      name="payment-exam-type"
                      :value="exam.value"
                    />
                    <span class="radio-control" aria-hidden="true"></span>
                    <span>{{ exam.label }}</span>
                  </label>
                </div>
              </div>

              <div class="option-section plan-section">
                <p class="option-label">请选择合适的订阅计划：</p>
                <button
                  v-for="plan in plans"
                  :key="plan.id"
                  class="plan-option"
                  :class="{ 'plan-option--active': selectedPlanId === plan.id }"
                  type="button"
                  @click="selectedPlanId = plan.id"
                >
                  <span v-if="plan.recommended" class="recommend-badge">
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path
                        d="M8 1.6l1.7 3.1 3.5.7-2.4 2.7.4 3.6L8 10.2l-3.2 1.5.4-3.6-2.4-2.7 3.5-.7L8 1.6z"
                      />
                    </svg>
                    最受欢迎
                  </span>
                  <span class="plan-name">{{ plan.name }}</span>
                  <span class="plan-price">
                    <span v-if="plan.promo" class="plan-promo">{{ plan.promo }}</span>
                    <strong>¥{{ plan.price }}</strong>
                    <small v-if="!plan.originalPrice">/{{ plan.period }}</small>
                    <span
                      v-if="plan.originalPrice"
                      class="plan-original-group"
                      :aria-label="`原价${plan.originalPrice}元每月`"
                    >
                      <del class="plan-original-price">¥{{ plan.originalPrice }}</del
                      ><small>/月</small>
                    </span>
                  </span>
                  <span v-if="selectedPlanId === plan.id" class="plan-selected" aria-hidden="true">
                    <svg viewBox="0 0 16 16"><path d="M3.5 8.2l2.7 2.7 6.3-6.1" /></svg>
                  </span>
                </button>
              </div>

              <div class="member-benefits">
                <h3>会员尊享权</h3>
                <ul>
                  <li v-for="benefit in benefits" :key="benefit">
                    <svg viewBox="0 0 18 18" aria-hidden="true">
                      <circle cx="9" cy="9" r="8" />
                      <path d="M5.3 9.1l2.4 2.4 5-5" />
                    </svg>
                    <span>{{ benefit }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="payment-checkout">
              <div class="amount-line">
                <span>待支付：</span><strong>¥{{ displayAmount }}</strong>
              </div>

              <div class="qr-card" aria-label="银联商务聚合支付二维码">
                <img
                  v-if="qrCodeImageUrl"
                  class="qr-image"
                  :src="qrCodeImageUrl"
                  alt="支付二维码"
                />
                <a
                  v-else-if="paymentPageUrl"
                  class="qr-fallback"
                  :href="paymentPageUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  二维码生成失败<br />点击打开银联收银台
                </a>
                <svg v-else viewBox="0 0 21 21" role="img" aria-hidden="true">
                  <rect width="21" height="21" fill="#fff" />
                  <g fill="#101010">
                    <path d="M1 1h7v7H1zm1 1v5h5V2zM3 3h3v3H3z" fill-rule="evenodd" />
                    <path d="M13 1h7v7h-7zm1 1v5h5V2zM15 3h3v3h-3z" fill-rule="evenodd" />
                    <path d="M1 13h7v7H1zm1 1v5h5v-5zM3 15h3v3H3z" fill-rule="evenodd" />
                    <path
                      d="M10 1h2v2h-1v2H9V3h1zm-1 5h2v2h2v2h-2V9H9zm3-1h1v2h-1zM8 10h2v2H8zM1 10h2v1h2v2H3v-1H1zm5-1h2v2H6zm-1 3h3v2H6v-1H5zm4 1h2v1h1v2h-2v-1H9zm3-2h2v2h-1v2h-1zm3-2h2v2h3v3h-2v-1h-3v-2h-1V9zm3 6h2v2h-1v3h-2v-2h-2v-2h1v1h2zm-5 1h2v2h2v2h-4v-1h-2v-2h2zM9 18h2v2H9zm1-2h1v1h-1z"
                    />
                  </g>
                </svg>
                <button
                  v-if="!createdOrderNo"
                  class="qr-demo qr-action"
                  type="button"
                  :disabled="creatingOrder || configStatus !== 'active' || !providerReady"
                  @click="handleCreateOrder"
                >
                  {{
                    creatingOrder
                      ? '正在创建订单…'
                      : providerReady
                        ? '生成支付订单'
                        : '待配置支付参数'
                  }}
                </button>
                <span v-else-if="orderStatus === 'paid'" class="qr-demo qr-success"
                  >支付成功</span
                >
              </div>

              <p class="scan-tip">
                <template v-if="createdOrderNo && orderStatus !== 'paid'">
                  请使用 <strong>{{ activeChannel.name }}</strong> 扫码支付
                </template>
                <template v-else-if="orderStatus === 'paid'">支付成功，会员权益已生效</template>
                <template v-else>生成订单后显示支付二维码</template>
              </p>

              <div class="channel-tabs" role="tablist" aria-label="支付方式">
                <button
                  v-for="channel in channels"
                  :key="channel.id"
                  class="channel-tab"
                  :class="{ 'channel-tab--active': selectedChannelId === channel.id }"
                  type="button"
                  role="tab"
                  :aria-selected="selectedChannelId === channel.id"
                  @click="selectedChannelId = channel.id"
                >
                  <span class="channel-logo" :class="`channel-logo--${channel.id}`">{{
                    channel.mark
                  }}</span>
                  <span>{{ channel.label }}</span>
                </button>
              </div>

              <div class="safe-tip">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 2l6 2.3v4.5c0 4-2.5 7-6 8.8-3.5-1.8-6-4.8-6-8.8V4.3L10 2z" />
                  <path d="M7 9.7l2 2 4-4" />
                </svg>
                扫码支付，安全快捷
              </div>
            </div>
          </div>

          <footer class="payment-footer">
            支付代表即为同意
            <router-link
              to="/legal/membership-service-agreement"
              target="_blank"
              rel="noopener noreferrer"
              >《会员服务协议》</router-link
            >
            与
            <router-link
              to="/legal/membership-purchase-notice"
              target="_blank"
              rel="noopener noreferrer"
              >《会员购买须知与权益说明》</router-link
            >
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'
import { MEMBERSHIP_LEGAL_VERSIONS } from '@/constants/legal'
import {
  closePaymentOrder,
  createPaymentOrder,
  getPaymentConfig,
  queryPaymentOrder,
} from '@/api/payment'

interface Props {
  modelValue: boolean
  defaultExamType?: string
}

interface PaymentPlan {
  id: string
  name: string
  price: string
  period: '月' | '年'
  promo?: string
  originalPrice?: string
  recommended: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'paid', orderNo: string): void
}>()

const examOptions = EXAM_TYPE_OPTIONS.filter((item) => item.available)
const selectedExam = ref('TMUA')
const selectedPlanId = ref('monthly')
const selectedChannelId = ref('alipay')
const creatingOrder = ref(false)
const createdOrderNo = ref('')
const qrCodeImageUrl = ref('')
const paymentPageUrl = ref('')
const orderAmountCents = ref<number | null>(null)
const orderStatus = ref('')
let pollingTimer: ReturnType<typeof setInterval> | null = null
const configStatus = ref<'active' | 'inactive'>('active')
const providerReady = ref(false)
const priceConfig = ref({
  firstMonthlyPriceCents: 7800,
  monthlyPriceCents: 7900,
  yearlyPriceCents: 39800,
})

const plans = computed<PaymentPlan[]>(() => [
  {
    id: 'monthly',
    name: '按月订阅',
    price: formatPrice(priceConfig.value.firstMonthlyPriceCents),
    period: '月',
    promo: '首次订阅',
    originalPrice: formatPrice(priceConfig.value.monthlyPriceCents),
    recommended: false,
  },
  {
    id: 'yearly',
    name: '按年订阅',
    price: formatPrice(priceConfig.value.yearlyPriceCents),
    period: '年',
    recommended: true,
  },
])

const benefits = [
  '解锁 5000+ 练习题，覆盖全部知识点',
  '解锁历年真题、成绩报告、真题详细解析与 AI 能力诊断',
  '解锁 1000 套模拟卷、试题详细解析与知识点掌握分',
]

// 云闪付尚在正式通道审核中，前台暂不提供入口；后端 unionpay 能力保留以便获批后恢复。
const channels = [
  { id: 'alipay', name: '支付宝', label: '支付宝', mark: '支' },
  { id: 'wechat', name: '微信', label: '微信支付', mark: '微' },
] as const

const activeChannel = computed(
  () => channels.find((item) => item.id === selectedChannelId.value) || channels[0],
)
const displayAmount = computed(() =>
  formatPrice(
    orderAmountCents.value ??
      (selectedPlanId.value === 'monthly'
        ? priceConfig.value.firstMonthlyPriceCents
        : priceConfig.value.yearlyPriceCents),
  ),
)

function closeModal(): void {
  void cancelCurrentOrder()
  emit('update:modelValue', false)
}

function formatPrice(valueCents: number): string {
  return Number.isInteger(valueCents / 100)
    ? String(valueCents / 100)
    : (valueCents / 100).toFixed(2)
}

async function loadPaymentConfig(): Promise<void> {
  try {
    const config = await getPaymentConfig()
    priceConfig.value = {
      firstMonthlyPriceCents: config.firstMonthlyPriceCents,
      monthlyPriceCents: config.monthlyPriceCents,
      yearlyPriceCents: config.yearlyPriceCents,
    }
    configStatus.value = config.status
    providerReady.value = config.providerReady
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  }
}

function stopPaymentPolling(): void {
  if (!pollingTimer) return
  clearInterval(pollingTimer)
  pollingTimer = null
}

// 支付弹窗轮询服务端订单，最终状态仍由后端查询银联商务并幂等确认。
async function refreshPaymentStatus(): Promise<void> {
  if (!createdOrderNo.value || orderStatus.value === 'paid') return
  try {
    const order = await queryPaymentOrder(createdOrderNo.value)
    orderStatus.value = order.status
    if (order.status === 'paid') {
      stopPaymentPolling()
      ElMessage.success('支付成功，会员权益已生效')
      emit('paid', order.orderNo)
    } else if (['closed', 'failed', 'refunded'].includes(order.status)) {
      stopPaymentPolling()
      ElMessage.warning('当前支付订单已结束，请重新生成订单')
    }
  } catch (error) {
    console.warn('[PaymentModal] 支付状态查询暂时失败', error)
  }
}

function startPaymentPolling(): void {
  stopPaymentPolling()
  pollingTimer = setInterval(() => void refreshPaymentStatus(), 3000)
}

async function cancelCurrentOrder(): Promise<void> {
  stopPaymentPolling()
  if (!createdOrderNo.value || orderStatus.value !== 'pending') return
  const orderNo = createdOrderNo.value
  orderStatus.value = 'closing'
  try {
    await closePaymentOrder(orderNo)
  } catch (error) {
    console.warn('[PaymentModal] 关闭未支付订单失败，等待后端过期处理', error)
  }
}

function resetPaymentOrder(): void {
  stopPaymentPolling()
  createdOrderNo.value = ''
  qrCodeImageUrl.value = ''
  paymentPageUrl.value = ''
  orderAmountCents.value = null
  orderStatus.value = ''
}

// 银联返回的是收银台网页地址，需要在浏览器端编码为可扫码的二维码图片。
async function createPaymentQrImage(checkoutUrl: string): Promise<string> {
  return QRCode.toDataURL(checkoutUrl, {
    width: 240,
    margin: 1,
    errorCorrectionLevel: 'M',
  })
}

// 用户确认当前套餐和渠道后创建支付订单，金额始终由后端重新计算。
async function handleCreateOrder(): Promise<void> {
  if (!selectedExam.value) {
    ElMessage.warning('请选择一个备考类型')
    return
  }
  creatingOrder.value = true
  try {
    const result = await createPaymentOrder({
      examTypes: [selectedExam.value],
      plan: selectedPlanId.value as 'monthly' | 'yearly',
      channel: selectedChannelId.value as 'alipay' | 'wechat' | 'unionpay',
      legalVersions: { ...MEMBERSHIP_LEGAL_VERSIONS },
    })
    createdOrderNo.value = result.order.orderNo
    paymentPageUrl.value = result.qrCodeUrl
    orderAmountCents.value = result.order.amountCents
    orderStatus.value = result.order.status
    startPaymentPolling()
    try {
      qrCodeImageUrl.value = await createPaymentQrImage(result.qrCodeUrl)
    } catch (error) {
      console.error('[PaymentModal] 支付二维码生成失败', error)
      ElMessage.error('支付二维码生成失败，请点击卡片打开银联收银台')
      return
    }
    ElMessage.success(result.message)
  } finally {
    creatingOrder.value = false
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.modelValue) closeModal()
}

watch(
  () => props.modelValue,
  (visible) => {
    document.body.style.overflow = visible ? 'hidden' : ''
    if (visible) {
      const defaultExam = examOptions.find((item) => item.value === props.defaultExamType)
      selectedExam.value = defaultExam?.value || 'TMUA'
      resetPaymentOrder()
      void loadPaymentConfig()
    } else {
      stopPaymentPolling()
    }
  },
)

watch(
  [selectedExam, selectedPlanId, selectedChannelId],
  () => {
    if (createdOrderNo.value) void cancelCurrentOrder()
    resetPaymentOrder()
  },
)

window.addEventListener('keydown', handleKeydown)
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  stopPaymentPolling()
  document.body.style.overflow = ''
})
</script>

<style scoped>
.payment-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(21 25 32 / 45%);
  backdrop-filter: blur(3px);
}

.payment-modal {
  width: min(970px, 100%);
  overflow: hidden;
  color: #30343b;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 24px 70px rgb(15 23 42 / 24%);
}

.payment-header {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 70px;
  padding: 0 30px;
  border-bottom: 1px solid #e8ebef;
}

.payment-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.payment-close {
  position: absolute;
  top: 18px;
  right: 23px;
  display: grid;
  width: 34px;
  height: 34px;
  padding: 7px;
  color: #777d86;
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.18s ease;
}

.payment-close:hover {
  color: #1f2937;
  background: #f3f4f6;
}

.payment-close svg {
  width: 100%;
  stroke: currentColor;
  stroke-width: 1.8;
}

.payment-body {
  display: grid;
  grid-template-columns: minmax(0, 56%) minmax(340px, 44%);
  min-height: 490px;
}

.payment-options {
  padding: 27px 30px 24px;
  border-right: 1px solid #edf0f3;
}

.option-section + .option-section {
  margin-top: 29px;
}

.option-label {
  margin: 0 0 17px;
  color: #555b65;
  font-size: 15px;
}

.exam-options {
  display: flex;
  flex-wrap: wrap;
  gap: 28px 50px;
}

.exam-option {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #606670;
  font-size: 15px;
  cursor: pointer;
}

.exam-option input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.radio-control {
  display: grid;
  place-items: center;
  width: 17px;
  height: 17px;
  background: #fff;
  border: 1px solid #ccd2da;
  border-radius: 50%;
}

.radio-control::after {
  width: 9px;
  height: 9px;
  background: #2f73ff;
  border-radius: 50%;
  content: '';
  transform: scale(0);
  transition: transform 0.15s ease;
}

.exam-option input:checked + .radio-control {
  background: #fff;
  border-color: #2f73ff;
}

.exam-option input:checked + .radio-control::after {
  transform: scale(1);
}

.exam-option input:focus-visible + .radio-control {
  outline: 2px solid #1a1a1a;
  outline-offset: 2px;
}

.exam-option:has(input:checked) {
  color: #2f73ff;
}

.plan-section {
  display: grid;
  gap: 14px;
}

.plan-section .option-label {
  margin-bottom: 3px;
}

.plan-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 66px;
  padding: 0 18px;
  color: #30343b;
  text-align: left;
  background: #fff;
  border: 1px solid #cbd0d7;
  border-radius: 10px;
  cursor: pointer;
}

.plan-option--active {
  background: #f7faff;
  border: 1.5px solid #3478ff;
  box-shadow: 0 0 0 1px rgb(52 120 255 / 4%);
}

.plan-name {
  font-size: 17px;
  font-weight: 700;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-left: auto;
}

.plan-price strong {
  color: #2672ff;
  font-size: 26px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.plan-price > small {
  color: #7b818a;
  font-size: 13px;
}

.plan-promo {
  margin-right: 5px;
  color: #2672ff;
  font-size: 15px;
  font-weight: 700;
}

.plan-original-group {
  display: inline-flex;
  align-items: baseline;
  color: #7b818a;
  font-size: 15px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.plan-original-price {
  position: relative;
  display: inline-block;
  text-decoration: none;
}

.plan-original-group small {
  font-size: 11px;
}

.plan-original-price::after {
  position: absolute;
  top: 50%;
  right: -2px;
  left: -2px;
  height: 1.5px;
  background: #4f5662;
  border-radius: 999px;
  content: '';
  transform: translateY(-50%);
}

.recommend-badge {
  position: absolute;
  top: -12px;
  left: 20px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  color: #fff;
  font-size: 11px;
  background: linear-gradient(135deg, #ffbd21, #ff7a00);
  border-radius: 999px;
  box-shadow: 0 3px 8px rgb(255 138 0 / 25%);
}

.recommend-badge svg {
  width: 12px;
  fill: currentColor;
}

.plan-selected {
  position: absolute;
  top: -10px;
  right: -10px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  color: #fff;
  background: #2f73ff;
  border: 2px solid #fff;
  border-radius: 50%;
}

.plan-selected svg {
  width: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.member-benefits {
  margin-top: 32px;
}

.member-benefits h3 {
  margin: 0 0 16px;
  color: #353a42;
  font-size: 17px;
}

.member-benefits ul {
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.member-benefits li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #59606a;
  font-size: 14px;
  line-height: 1.45;
}

.member-benefits li svg {
  flex: 0 0 16px;
  width: 16px;
  margin-top: 2px;
  fill: #4e8cad;
}

.member-benefits li svg path {
  fill: none;
  stroke: #fff;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.payment-checkout {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 28px 34px 22px;
  background: #fdfdfd;
}

.amount-line {
  display: flex;
  align-items: baseline;
  margin-bottom: 16px;
  font-size: 17px;
  font-weight: 700;
}

.amount-line strong {
  color: #2873ff;
  font-size: 31px;
  letter-spacing: -0.03em;
}

.qr-card {
  position: relative;
  width: 216px;
  padding: 13px;
  background: #fff;
  border: 1px solid #e4e7eb;
  border-radius: 3px;
}

.qr-card > svg {
  display: block;
  width: 100%;
  image-rendering: pixelated;
}

.qr-image {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
}

.qr-fallback {
  display: grid;
  width: 100%;
  aspect-ratio: 1;
  place-items: center;
  color: #2672ff;
  font-size: 13px;
  line-height: 1.8;
  text-align: center;
  text-decoration: none;
  background: #f7f9fc;
}

.qr-demo {
  position: absolute;
  right: 12px;
  bottom: 12px;
  left: 12px;
  padding: 5px;
  color: #667085;
  font-size: 10px;
  text-align: center;
  background: rgb(255 255 255 / 94%);
  border-radius: 3px;
}

.qr-action {
  width: auto;
  color: #fff;
  font-weight: 700;
  background: #2672ff;
  border: 0;
  cursor: pointer;
}

.qr-action:disabled {
  color: #8a9099;
  background: #eef1f5;
  cursor: not-allowed;
}

.qr-success {
  color: #178a43;
  font-weight: 700;
  background: rgb(237 252 243 / 96%);
}

.scan-tip {
  margin: 13px 0 18px;
  color: #4c535d;
  font-size: 14px;
}

.scan-tip strong {
  color: #1677ff;
}

.channel-tabs {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 30px;
  width: 100%;
  border-bottom: 1px solid #e9ecef;
}

.channel-tab {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 7px;
  min-width: 58px;
  padding: 0 0 10px;
  color: #7b8189;
  font-size: 12px;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.channel-tab--active {
  color: #2672ff;
}

.channel-tab--active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: #2672ff;
  content: '';
}

.channel-logo {
  display: grid;
  place-items: center;
  width: 27px;
  height: 27px;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  border-radius: 6px;
}

.channel-logo--alipay {
  background: #1677ff;
}
.channel-logo--wechat {
  background: #16b83e;
}
.channel-logo--unionpay {
  background: linear-gradient(135deg, #e51c35 0 46%, #087a9d 47% 100%);
}

.safe-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  color: #7b8189;
  font-size: 12px;
}

.safe-tip svg {
  width: 16px;
  fill: #35b55d;
}

.safe-tip svg path:last-child {
  fill: none;
  stroke: #fff;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.payment-footer {
  padding: 13px 24px 15px;
  color: #8a9099;
  font-size: 12px;
  text-align: center;
  border-top: 1px solid #eef0f2;
}

.payment-footer a {
  color: #4c7f9d;
  text-decoration: none;
}

.payment-fade-enter-active,
.payment-fade-leave-active {
  transition: opacity 0.2s ease;
}
.payment-fade-enter-active .payment-modal,
.payment-fade-leave-active .payment-modal {
  transition: transform 0.2s ease;
}
.payment-fade-enter-from,
.payment-fade-leave-to {
  opacity: 0;
}
.payment-fade-enter-from .payment-modal,
.payment-fade-leave-to .payment-modal {
  transform: translateY(12px) scale(0.985);
}

@media (max-width: 760px) {
  .payment-overlay {
    padding: 0;
  }
  .payment-modal {
    width: 100%;
    min-height: 100vh;
    overflow: hidden;
    border-radius: 0;
  }
  .payment-header {
    min-height: 64px;
    padding: 0 20px;
  }
  .payment-header h2 {
    font-size: 19px;
  }
  .payment-close {
    top: 15px;
    right: 14px;
  }
  .payment-body {
    display: block;
  }
  .payment-options {
    padding: 28px 20px;
    border-right: 0;
  }
  .exam-options {
    gap: 20px 28px;
  }
  .plan-option {
    min-height: 82px;
    padding: 12px 15px;
  }
  .plan-price {
    flex-wrap: wrap;
    justify-content: flex-end;
    max-width: 66%;
  }
  .payment-checkout {
    padding: 30px 20px;
    border-top: 1px solid #edf0f3;
  }
  .qr-card {
    width: min(242px, 76vw);
  }
}
</style>
