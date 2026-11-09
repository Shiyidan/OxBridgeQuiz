<!-- 会员支付弹窗：选择考试与套餐，并通过支付宝、微信或云闪付共用的聚合码完成支付。 -->
<template>
  <Teleport to="body">
    <Transition name="payment-fade">
      <div
        v-if="modelValue && MEMBERSHIP_PURCHASE_ENABLED"
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
            <div>
              <h2 id="payment-modal-title">
                {{ resumeOrderNo ? '继续支付订单' : '选择会员套餐' }}
              </h2>
              <p>开启高效备考，从一份合适的计划开始</p>
            </div>
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
              <div class="purchase-exam-row">
                <div class="purchase-exam-copy">
                  <h3>备考考试</h3>
                  <p>权益按考试独立开通</p>
                </div>
                <div class="purchase-exam-switch" role="group" aria-label="选择备考考试">
                  <label
                    v-for="exam in examOptions"
                    :key="exam.value"
                    class="purchase-exam"
                    :class="{ 'is-selected': selectedExam === exam.value }"
                  >
                    <input
                      v-model="selectedExam"
                      type="radio"
                      name="payment-exam-type"
                      :value="exam.value"
                      :disabled="resumedExistingOrder"
                    />
                    <span>{{ exam.label }}</span>
                  </label>
                </div>
              </div>
              <div class="purchase-plan-heading">
                <h3>选择适合你的年卡</h3>
                <span>一次购买 · 365 天</span>
              </div>
              <div class="purchase-plans" role="group" aria-label="选择年卡套餐">
                <button
                  v-for="plan in plans"
                  :key="plan.id"
                  class="purchase-plan"
                  :class="{ 'is-selected': selectedPlanId === plan.id }"
                  type="button"
                  :aria-pressed="selectedPlanId === plan.id"
                  :disabled="resumedExistingOrder"
                  @click="selectedPlanId = plan.id"
                >
                  <span class="purchase-plan-check" aria-hidden="true"
                    ><svg v-if="selectedPlanId === plan.id" viewBox="0 0 16 16">
                      <path d="M3.5 8.2l2.7 2.7 6.3-6.1" /></svg
                  ></span>
                  <span class="purchase-plan-copy">
                    <span class="purchase-plan-title"
                      >{{ plan.name.replace('做题', '题库')
                      }}<span v-if="plan.recommended" class="purchase-recommendation"
                        >推荐组合</span
                      ></span
                    >
                    <span class="purchase-plan-description">{{ plan.description }}</span>
                  </span>
                  <span class="purchase-plan-price">
                    <span class="purchase-price-value"><small>¥</small>{{ plan.price }}</span>
                    <span class="purchase-price-offer"
                      ><del>¥{{ plan.originalPrice }}</del
                      ><span>{{ plan.promo }}</span></span
                    >
                  </span>
                </button>
              </div>
              <p class="purchase-note">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 2l6 2.3v4.5c0 4-2.5 7-6 8.8-3.5-1.8-6-4.8-6-8.8V4.3L10 2z" />
                  <path d="m7 9.7 2 2 4-4" /></svg
                >仅开通所选考试 · 不自动续费
              </p>
            </div>

            <div class="payment-checkout">
              <div class="amount-summary" aria-live="polite">
                <span>待支付</span>
                <strong><small>¥</small>{{ displayAmount }}</strong>
                <p>{{ selectedExamLabel }} · {{ selectedPlanLabel }}</p>
              </div>

              <div class="qr-frame">
                <i class="qr-corner qr-corner--top-left" aria-hidden="true"></i>
                <i class="qr-corner qr-corner--top-right" aria-hidden="true"></i>
                <i class="qr-corner qr-corner--bottom-left" aria-hidden="true"></i>
                <i class="qr-corner qr-corner--bottom-right" aria-hidden="true"></i>
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
                    v-if="orderCreationFailed && providerReady && configStatus === 'active'"
                    class="qr-demo qr-action"
                    type="button"
                    :disabled="creatingOrder"
                    @click="handleCreateOrder"
                  >
                    {{ creatingOrder ? '正在重新生成…' : '重新生成二维码' }}
                  </button>
                  <span v-else-if="creatingOrder" class="qr-demo qr-loading">正在生成二维码…</span>
                  <span
                    v-else-if="!providerReady || configStatus !== 'active'"
                    class="qr-demo qr-unavailable"
                    >支付暂不可用</span
                  >
                  <span v-else-if="orderStatus === 'paid'" class="qr-demo qr-success"
                    >支付成功</span
                  >
                </div>
              </div>

              <p class="scan-tip">
                <template v-if="creatingOrder">正在为您生成支付二维码，请稍候</template>
                <template v-else-if="orderCreationFailed"
                  >二维码生成失败，请点击上方按钮重试</template
                >
                <template v-else-if="createdOrderNo && orderStatus !== 'paid'">
                  请使用
                  <span class="scan-wallets" aria-label="支付宝、微信和云闪付">
                    <span
                      v-for="channel in channels"
                      :key="channel.id"
                      class="scan-wallet-icon"
                      :class="`scan-wallet-icon--${channel.id}`"
                      role="img"
                      :aria-label="channel.name"
                      :title="channel.name"
                      >{{ channel.mark }}</span
                    >
                  </span>
                  扫码支付
                </template>
                <template v-else-if="orderStatus === 'paid'">支付成功，会员权益已生效</template>
                <template v-else>正在准备支付服务</template>
              </p>

              <div class="safe-tip">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 2l6 2.3v4.5c0 4-2.5 7-6 8.8-3.5-1.8-6-4.8-6-8.8V4.3L10 2z" />
                  <path d="M7 9.7l2 2 4-4" />
                </svg>
                三种支付工具共用当前二维码
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
import {
  ANNUAL_PLAN,
  ANNUAL_PLAN_LABELS,
  DEFAULT_ANNUAL_PRICING,
  type AnnualPlan,
} from '@/constants/annualMembership'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'
import { useOralPromotionStore } from '@/stores/oralPromotion'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'
import { MEMBERSHIP_LEGAL_VERSIONS } from '@/constants/legal'
import {
  MEMBERSHIP_PURCHASE_ENABLED,
  MEMBERSHIP_PURCHASE_PENDING_MESSAGE,
} from '@/constants/membershipPurchase'
import {
  closePaymentOrder,
  createPaymentOrder,
  getPaymentConfig,
  queryPaymentOrder,
  resumePaymentOrder,
} from '@/api/payment'

interface Props {
  modelValue: boolean
  defaultExamType?: string
  defaultPlanId?: AnnualPlan | 'monthly' | 'quarterly'
  resumeOrderNo?: string
}

interface PaymentPlan {
  id: string
  name: string
  price: string
  description: string
  period: '365天'
  promo?: string
  originalPrice?: string
  recommended: boolean
}

const props = defineProps<Props>()
const oralPromotion = useOralPromotionStore()
const promotionPaymentOwner = Symbol('payment-modal')
// 支付打开后隐藏推广；即时监听兼容父页面首次挂载时已处于打开状态。
watch(
  () => props.modelValue,
  (visible) => {
    oralPromotion.setPaymentOpen(promotionPaymentOwner, visible && MEMBERSHIP_PURCHASE_ENABLED)
  },
  { immediate: true, flush: 'sync' },
)
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'paid', orderNo: string): void
}>()

const examOptions = EXAM_TYPE_OPTIONS.filter((item) => item.available)
const selectedExam = ref('TMUA')
const selectedPlanId = ref<string>(ANNUAL_PLAN.PRACTICE)
const creatingOrder = ref(false)
const orderCreationFailed = ref(false)
const createdOrderNo = ref('')
const qrCodeImageUrl = ref('')
const paymentPageUrl = ref('')
const orderAmountCents = ref<number | null>(null)
const orderStatus = ref('')
const resumedExistingOrder = ref(false)
let pollingTimer: ReturnType<typeof setInterval> | null = null
let orderGeneration = 0
let initializingPayment = false
let paymentStatusQueryInFlight = false
let paidEmittedOrderNo = ''
const configStatus = ref<'active' | 'inactive'>('active')
const providerReady = ref(false)
const priceConfig = ref({ ...DEFAULT_ANNUAL_PRICING })

// 套餐仅按功能区分，服务期限统一为 365 天。
const plans = computed<PaymentPlan[]>(() => [
  {
    id: ANNUAL_PLAN.PRACTICE,
    name: '做题年卡',
    description: '诊断、模考、专项练习与答卷解析',
    price: formatPrice(priceConfig.value.practicePriceCents),
    period: '365天',
    promo: formatDiscountLabel(
      priceConfig.value.practicePriceCents,
      priceConfig.value.practiceOriginalPriceCents,
    ),
    originalPrice: formatPrice(priceConfig.value.practiceOriginalPriceCents),
    recommended: false,
  },
  {
    id: ANNUAL_PLAN.LEARNING,
    name: '学习平台年卡',
    description: '知识点讲解、教学例题与自测',
    price: formatPrice(priceConfig.value.learningPriceCents),
    period: '365天',
    promo: formatDiscountLabel(
      priceConfig.value.learningPriceCents,
      priceConfig.value.learningOriginalPriceCents,
    ),
    originalPrice: formatPrice(priceConfig.value.learningOriginalPriceCents),
    recommended: false,
  },
  {
    id: ANNUAL_PLAN.BUNDLE,
    name: '做题＋学习平台年卡',
    description: '包含两项年卡全部权益，学习练习一步到位',
    price: formatPrice(priceConfig.value.bundlePriceCents),
    period: '365天',
    promo: formatDiscountLabel(
      priceConfig.value.bundlePriceCents,
      priceConfig.value.practiceOriginalPriceCents + priceConfig.value.learningOriginalPriceCents,
    ),
    originalPrice: formatPrice(
      priceConfig.value.practiceOriginalPriceCents + priceConfig.value.learningOriginalPriceCents,
    ),
    recommended: true,
  },
])

// 聚合码支持的扫码工具只作静态提示，不参与订单创建或二维码切换。
const channels = [
  { id: 'alipay', name: '支付宝', mark: '支' },
  { id: 'wechat', name: '微信支付', mark: '微' },
  { id: 'unionpay', name: '云闪付 App', mark: '云' },
] as const

const displayAmount = computed(() =>
  orderAmountCents.value !== null
    ? formatPrice(orderAmountCents.value)
    : plans.value.find((plan) => plan.id === selectedPlanId.value)?.price || '—',
)

// 付款摘要展示当前订单对应的考试名称。
const selectedExamLabel = computed(
  () => examOptions.find((item) => item.value === selectedExam.value)?.label || selectedExam.value,
)

// 付款摘要使用当前套餐名称与固定服务期限，避免用户只看到金额。
const selectedPlanLabel = computed(() => {
  const selectedPlan = plans.value.find((item) => item.id === selectedPlanId.value)
  return selectedPlan
    ? `${selectedPlan.name}（${selectedPlan.period}）`
    : { monthly: '历史月卡（30天）', quarterly: '历史季卡（90天）', yearly: '历史年卡' }[
        selectedPlanId.value
      ] || '历史订单'
})

function closeModal(): void {
  void cancelCurrentOrder()
  emit('update:modelValue', false)
}

function formatPrice(valueCents: number): string {
  return Number.isInteger(valueCents / 100)
    ? String(valueCents / 100)
    : (valueCents / 100).toFixed(2)
}

// 折扣按划线原价计算并展示到一位小数，实付采用后台设置的固定金额。
function formatDiscountLabel(priceCents: number, originalPriceCents: number): string | undefined {
  if (priceCents >= originalPriceCents) return undefined
  const discount = Number(((priceCents / originalPriceCents) * 10).toFixed(1))
  return `限时 ${discount} 折`
}

async function loadPaymentConfig(): Promise<boolean> {
  try {
    const config = await getPaymentConfig()
    priceConfig.value = config.annualPricing
    configStatus.value = config.status
    providerReady.value = config.providerReady
    return config.status === 'active' && config.providerReady
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
    return false
  }
}

function stopPaymentPolling(): void {
  if (!pollingTimer) return
  clearInterval(pollingTimer)
  pollingTimer = null
}

// 支付弹窗轮询服务端订单，最终状态仍由后端查询银联商务并幂等确认。
async function refreshPaymentStatus(): Promise<void> {
  const orderNo = createdOrderNo.value
  if (!orderNo || orderStatus.value === 'paid' || paymentStatusQueryInFlight) return
  const currentGeneration = orderGeneration
  paymentStatusQueryInFlight = true
  try {
    const order = await queryPaymentOrder(orderNo)
    if (
      currentGeneration !== orderGeneration ||
      createdOrderNo.value !== orderNo ||
      !props.modelValue
    ) {
      return
    }
    orderStatus.value = order.status
    if (order.status === 'paid') {
      stopPaymentPolling()
      if (paidEmittedOrderNo !== order.orderNo) {
        paidEmittedOrderNo = order.orderNo
        ElMessage.success('支付成功，会员权益已生效')
        emit('paid', order.orderNo)
      }
    } else if (['closed', 'failed', 'refunded'].includes(order.status)) {
      stopPaymentPolling()
      resumedExistingOrder.value = false
      orderCreationFailed.value = true
      ElMessage.warning('当前支付订单已结束，请重新生成订单')
    }
  } catch (error) {
    console.warn('[PaymentModal] 支付状态查询暂时失败', error)
  } finally {
    if (currentGeneration === orderGeneration) paymentStatusQueryInFlight = false
  }
}

function startPaymentPolling(): void {
  stopPaymentPolling()
  pollingTimer = setInterval(() => void refreshPaymentStatus(), 3000)
}

async function cancelCurrentOrder(): Promise<void> {
  stopPaymentPolling()
  if (resumedExistingOrder.value) return
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
  orderGeneration += 1
  stopPaymentPolling()
  paymentStatusQueryInFlight = false
  paidEmittedOrderNo = ''
  creatingOrder.value = false
  orderCreationFailed.value = false
  createdOrderNo.value = ''
  qrCodeImageUrl.value = ''
  paymentPageUrl.value = ''
  orderAmountCents.value = null
  orderStatus.value = ''
  resumedExistingOrder.value = false
}

// 银联返回的是收银台网页地址，需要在浏览器端编码为可扫码的二维码图片。
async function createPaymentQrImage(checkoutUrl: string): Promise<string> {
  return QRCode.toDataURL(checkoutUrl, {
    width: 240,
    margin: 1,
    errorCorrectionLevel: 'M',
  })
}

// 弹窗打开或购买内容变化后自动创建聚合订单，金额始终由后端重新计算。
async function handleCreateOrder(): Promise<void> {
  if (!selectedExam.value) {
    ElMessage.warning('请选择一个备考类型')
    return
  }
  const currentGeneration = ++orderGeneration
  resumedExistingOrder.value = false
  creatingOrder.value = true
  orderCreationFailed.value = false
  try {
    const result = await createPaymentOrder({
      examTypes: [selectedExam.value],
      plan: selectedPlanId.value as AnnualPlan,
      legalVersions: { ...MEMBERSHIP_LEGAL_VERSIONS },
    })
    if (currentGeneration !== orderGeneration || !props.modelValue) {
      void closePaymentOrder(result.order.orderNo).catch((error) => {
        console.warn('[PaymentModal] 关闭已失效的新建订单失败', error)
      })
      return
    }
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
  } catch {
    if (currentGeneration === orderGeneration) orderCreationFailed.value = true
  } finally {
    if (currentGeneration === orderGeneration) creatingOrder.value = false
  }
}

// 历史待支付订单恢复原二维码、金额和选项，不重新创建或关闭订单。
async function resumeExistingPaymentOrder(orderNo: string): Promise<void> {
  const currentGeneration = orderGeneration
  creatingOrder.value = true
  orderCreationFailed.value = false
  try {
    const result = await resumePaymentOrder(orderNo)
    if (currentGeneration !== orderGeneration || !props.modelValue) return
    const order = result.order
    selectedExam.value = order.examTypes[0] || props.defaultExamType || 'TMUA'
    selectedPlanId.value = order.plan
    createdOrderNo.value = order.orderNo
    paymentPageUrl.value = result.qrCodeUrl
    orderAmountCents.value = order.amountCents
    orderStatus.value = order.status
    resumedExistingOrder.value = order.status === 'pending'
    if (order.status === 'paid') {
      if (paidEmittedOrderNo !== order.orderNo) {
        paidEmittedOrderNo = order.orderNo
        ElMessage.success(result.message)
        emit('paid', order.orderNo)
      }
      return
    }
    qrCodeImageUrl.value = await createPaymentQrImage(result.qrCodeUrl)
    startPaymentPolling()
    ElMessage.success(result.message)
  } catch {
    if (currentGeneration === orderGeneration) orderCreationFailed.value = true
  } finally {
    if (currentGeneration === orderGeneration) creatingOrder.value = false
  }
}

// 打开弹窗时先同步实时价格和支付可用状态，再直接生成首个可扫码订单。
async function initializePaymentModal(): Promise<void> {
  initializingPayment = true
  const defaultExam = examOptions.find((item) => item.value === props.defaultExamType)
  selectedExam.value = defaultExam?.value || 'TMUA'
  selectedPlanId.value =
    props.defaultPlanId && props.defaultPlanId in ANNUAL_PLAN_LABELS
      ? props.defaultPlanId
      : ANNUAL_PLAN.PRACTICE
  resetPaymentOrder()
  const currentInitialization = orderGeneration
  creatingOrder.value = true
  const ready = await loadPaymentConfig()
  if (currentInitialization !== orderGeneration || !props.modelValue) return
  initializingPayment = false
  if (!ready) {
    creatingOrder.value = false
    orderCreationFailed.value = true
    return
  }
  if (props.resumeOrderNo) {
    await resumeExistingPaymentOrder(props.resumeOrderNo)
    return
  }
  await handleCreateOrder()
}

// 用户切换考试或套餐时关闭旧订单，并自动生成与新购买内容一致的二维码。
async function regeneratePaymentOrder(): Promise<void> {
  if (!props.modelValue || initializingPayment || resumedExistingOrder.value) return
  const previousOrderNo = createdOrderNo.value
  const shouldClosePreviousOrder = previousOrderNo && orderStatus.value === 'pending'
  resetPaymentOrder()
  if (shouldClosePreviousOrder) {
    try {
      await closePaymentOrder(previousOrderNo)
    } catch (error) {
      console.warn('[PaymentModal] 关闭已切换选项的订单失败，等待后端过期处理', error)
    }
  }
  if (!props.modelValue) return
  if (configStatus.value === 'active' && providerReady.value) await handleCreateOrder()
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.modelValue) closeModal()
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible && !MEMBERSHIP_PURCHASE_ENABLED) {
      document.body.style.overflow = ''
      ElMessage.info(MEMBERSHIP_PURCHASE_PENDING_MESSAGE)
      emit('update:modelValue', false)
      return
    }
    document.body.style.overflow = visible ? 'hidden' : ''
    if (visible) {
      void initializePaymentModal()
    } else {
      initializingPayment = false
      resetPaymentOrder()
    }
  },
)

watch([selectedExam, selectedPlanId], () => {
  void regeneratePaymentOrder()
})

window.addEventListener('keydown', handleKeydown)
onBeforeUnmount(() => {
  oralPromotion.setPaymentOpen(promotionPaymentOwner, false)
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
  padding: 16px;
  background: rgb(21 31 47 / 38%);
  backdrop-filter: blur(7px);
}

.payment-modal {
  display: flex;
  flex-direction: column;
  width: min(1040px, 100%);
  max-height: calc(100dvh - 32px);
  min-height: 0;
  overflow: hidden;
  color: #172033;
  background: #fff;
  border: 1px solid rgb(255 255 255 / 72%);
  border-radius: 18px;
  box-shadow: 0 28px 80px rgb(15 23 42 / 22%);
}

.payment-header {
  position: relative;
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-height: 68px;
  padding: 12px 26px;
  padding-right: 64px;
  border-bottom: 0;
}

.payment-header h2 {
  margin: 0;
  color: #111b2f;
  font-size: 23px;
  font-weight: 760;
  letter-spacing: -0.035em;
}

.payment-header p {
  margin: 4px 0 0;
  color: #77849a;
  font-size: 13px;
}

.payment-close {
  position: absolute;
  top: 17px;
  right: 20px;
  display: grid;
  width: 34px;
  height: 34px;
  padding: 7px;
  color: #7c8798;
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.18s ease;
}

.payment-close:hover {
  color: #1f2937;
  background: #f0f4fa;
}

.payment-close svg {
  width: 100%;
  stroke: currentColor;
  stroke-width: 1.8;
}

.payment-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.payment-options {
  min-width: 0;
  padding: 12px 26px 22px;
  border-right: 1px solid #e8eef7;
}
.purchase-exam-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e8edf3;
}
.purchase-exam-copy h3,
.purchase-plan-heading h3 {
  margin: 0;
  color: #233248;
  font-size: 14px;
  font-weight: 650;
}
.purchase-exam-copy p {
  margin: 5px 0 0;
  color: #7b8797;
  font-size: 12px;
}
.purchase-exam-switch {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  padding: 4px;
  background: #f0f3f7;
  border-radius: 9px;
}
.purchase-exam {
  position: relative;
  display: grid;
  min-width: 84px;
  min-height: 38px;
  place-items: center;
  color: #69778b;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
}
.purchase-exam.is-selected {
  color: #2265d9;
  background: #fff;
  border-color: #e1e7ef;
  box-shadow: 0 2px 5px rgb(34 55 81 / 6%);
}
.purchase-exam input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.purchase-exam:has(input:focus-visible) {
  outline: 2px solid #2873ff;
  outline-offset: 2px;
}
.purchase-exam:has(input:disabled) {
  cursor: default;
}
.purchase-plan-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 20px 0 12px;
}
.purchase-plan-heading > span {
  font-size: 11px;
  color: #7b8797;
}
.purchase-plans {
  display: grid;
  gap: 10px;
}
.purchase-plan {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 92px;
  width: 100%;
  padding: 15px 16px;
  color: #233248;
  text-align: left;
  font-family: inherit;
  background: #fff;
  border: 1px solid #dfe6ef;
  border-radius: 10px;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease;
}
.purchase-plan:not(:disabled):hover {
  border-color: #91b5f0;
  background: #fafcff;
}
.purchase-plan.is-selected {
  border-color: #3478ff;
  background: #f5f9ff;
  box-shadow: inset 0 0 0 1px #3478ff;
}
.purchase-plan:focus-visible {
  outline: 2px solid #2873ff;
  outline-offset: 3px;
}
.purchase-plan:disabled {
  cursor: default;
}
.purchase-plan-check {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 1px solid #cbd5e2;
  border-radius: 50%;
  background: #fff;
}
.is-selected > .purchase-plan-check {
  color: #fff;
  background: #3478ff;
  border-color: #3478ff;
}
.purchase-plan-check svg {
  width: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}
.purchase-plan-copy {
  display: grid;
  gap: 7px;
  min-width: 0;
}
.purchase-plan-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  font-size: 15px;
  font-weight: 650;
  line-height: 1.5;
}
.purchase-recommendation {
  padding: 2px 6px;
  color: #57722b;
  background: #edf5d8;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}
.purchase-plan-description {
  color: #718096;
  font-size: 11px;
  line-height: 1.6;
}
.purchase-plan-price {
  display: grid;
  justify-items: end;
  gap: 6px;
  font-variant-numeric: tabular-nums;
}
.purchase-price-value {
  color: #233248;
  font-size: 27px;
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
}
.is-selected .purchase-price-value {
  color: #2873ff;
}
.purchase-price-value small {
  margin-right: 2px;
  font-size: 15px;
  font-weight: 500;
}
.purchase-price-offer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
  font-size: 10px;
  line-height: 1.5;
}
.purchase-price-offer del {
  color: #8490a0;
}
.purchase-price-offer > span {
  color: #986620;
}
.purchase-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 16px 0 0;
  color: #7b8797;
  font-size: 11px;
}
.purchase-note svg {
  width: 15px;
  height: 15px;
  flex: 0 0 15px;
  fill: none;
  stroke: #7e9a68;
  stroke-width: 1.4;
}

.payment-checkout {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 20px 18px;
  overflow: hidden;
  background:
    radial-gradient(circle at 112% 25%, rgb(203 226 255 / 65%) 0 24%, transparent 24.2%),
    radial-gradient(circle at 109% 72%, rgb(220 235 255 / 78%) 0 30%, transparent 30.2%),
    linear-gradient(145deg, #fbfdff 4%, #f5f9ff 62%, #edf5ff 100%);
}

.payment-checkout::after {
  position: absolute;
  z-index: -1;
  right: -120px;
  bottom: -180px;
  width: 420px;
  height: 420px;
  border: 64px solid rgb(255 255 255 / 48%);
  border-radius: 50%;
  content: '';
}

.amount-summary {
  display: grid;
  justify-items: center;
  margin-bottom: 12px;
  color: #647086;
  font-size: 13px;
}

.amount-summary > span {
  margin-bottom: 2px;
}

.amount-summary strong {
  color: #2873ff;
  font-size: 39px;
  font-weight: 540;
  line-height: 1.12;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.amount-summary strong small {
  margin-right: 3px;
  font-size: 0.72em;
  font-weight: inherit;
}

.amount-summary p {
  margin: 4px 0 0;
  color: #000;
  font-family: 'SimHei', 'Heiti SC', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  font-weight: 600;
}

.qr-frame {
  position: relative;
  padding: 8px;
}

.qr-card {
  position: relative;
  width: 184px;
  padding: 10px;
  background: #fff;
  border: 1px solid #e4eaf2;
  border-radius: 5px;
  box-shadow: 0 16px 38px rgb(74 112 164 / 12%);
}

.qr-corner {
  position: absolute;
  z-index: 1;
  width: 19px;
  height: 19px;
  border-color: #fff;
  border-style: solid;
  pointer-events: none;
}

.qr-corner--top-left {
  top: 0;
  left: 0;
  border-width: 4px 0 0 4px;
  border-radius: 8px 0 0;
}

.qr-corner--top-right {
  top: 0;
  right: 0;
  border-width: 4px 4px 0 0;
  border-radius: 0 8px 0 0;
}

.qr-corner--bottom-left {
  bottom: 0;
  left: 0;
  border-width: 0 0 4px 4px;
  border-radius: 0 0 0 8px;
}

.qr-corner--bottom-right {
  right: 0;
  bottom: 0;
  border-width: 0 4px 4px 0;
  border-radius: 0 0 8px;
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

.qr-loading {
  color: #2672ff;
  font-weight: 700;
  background: rgb(239 245 255 / 96%);
}

.qr-unavailable {
  color: #8a9099;
  background: rgb(245 246 248 / 96%);
}

.qr-success {
  color: #178a43;
  font-weight: 700;
  background: rgb(237 252 243 / 96%);
}

.scan-tip {
  display: flex;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  margin: 8px 0 11px;
  color: #59667b;
  font-size: 12px;
}

.scan-tip strong {
  color: #1677ff;
}

.scan-wallets {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0 6px;
  vertical-align: middle;
}

.scan-wallet-icon {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  border-radius: 5px;
}

.scan-wallet-icon--alipay {
  background: #1677ff;
}

.scan-wallet-icon--wechat {
  background: #16b83e;
}

.scan-wallet-icon--unionpay {
  background: linear-gradient(135deg, #e51c35 0 46%, #087a9d 47% 100%);
}

.safe-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  justify-content: center;
  gap: 7px;
  margin-top: 0;
  color: #718097;
  font-size: 11px;
}

.safe-tip::before,
.safe-tip::after {
  width: 34px;
  height: 1px;
  margin: 0 7px;
  background: linear-gradient(90deg, transparent, #dce5f1);
  content: '';
}

.safe-tip::after {
  background: linear-gradient(90deg, #dce5f1, transparent);
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
  flex: 0 0 auto;
  padding: 10px 24px;
  color: #8792a5;
  font-size: 12px;
  text-align: center;
  border-top: 1px solid #eef0f2;
}

.payment-footer a {
  color: #2672ff;
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

@media (max-width: 820px) {
  .payment-overlay {
    padding: 0;
  }
  .payment-modal {
    display: flex;
    width: 100%;
    height: 100dvh;
    min-height: 0;
    max-height: 100dvh;
    flex-direction: column;
    overflow: hidden;
    border-radius: 0;
  }
  .payment-header {
    flex: 0 0 auto;
    min-height: 64px;
    padding: 12px 20px 10px;
  }
  .payment-header h2 {
    font-size: 20px;
  }
  .payment-header p {
    margin-top: 4px;
    font-size: 12px;
  }
  .payment-close {
    top: 12px;
    right: 14px;
  }
  .payment-body {
    display: block;
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }
  .payment-options {
    padding: 12px 20px 18px;
    border-right: 0;
  }
  .payment-checkout {
    padding: 24px 20px 28px;
    border-top: 1px solid #edf0f3;
  }
  .qr-card {
    width: min(210px, 76vw);
  }
  .payment-footer {
    flex: 0 0 auto;
    padding: 9px 14px 11px;
    font-size: 10px;
    line-height: 1.5;
  }
}

@media (max-width: 560px) {
  .payment-options {
    padding: 10px 16px 18px;
  }
  .purchase-exam-row {
    gap: 10px;
    padding-bottom: 16px;
  }
  .purchase-exam {
    min-width: 66px;
  }
  .purchase-plan {
    grid-template-columns: 18px minmax(0, 1fr) auto;
    gap: 9px;
    padding: 13px 11px;
  }
  .purchase-plan-title {
    font-size: 13px;
  }
  .purchase-plan-check {
    width: 18px;
    height: 18px;
  }
  .purchase-price-value {
    font-size: 24px;
  }
  .purchase-price-offer {
    flex-direction: column;
    align-items: flex-end;
    gap: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .purchase-plan {
    transition: none;
  }
}
</style>
