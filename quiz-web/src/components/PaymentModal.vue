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
              <div class="option-section">
                <div class="option-heading">
                  <span class="option-step">1</span>
                  <div class="option-heading__content">
                    <h3>选择备考类型</h3>
                    <p>不同考试类型的题库、解析与学习建议将有所区别</p>
                  </div>
                </div>
                <div class="exam-options">
                  <label
                    v-for="exam in examOptions"
                    :key="exam.value"
                    class="exam-option"
                    :class="{ 'exam-option--active': selectedExam === exam.value }"
                  >
                    <input
                      v-model="selectedExam"
                      type="radio"
                      name="payment-exam-type"
                      :value="exam.value"
                      :disabled="resumedExistingOrder"
                    />
                    <span
                      class="exam-option__icon"
                      :class="`exam-option__icon--${exam.value.toLowerCase()}`"
                      aria-hidden="true"
                    >
                      <svg v-if="exam.value === 'ESAT'" viewBox="0 0 32 32">
                        <path d="M9 22L16.5 9M15.5 25L23 12" />
                      </svg>
                      <svg v-else viewBox="0 0 32 32">
                        <path d="M16 5L27 25H5L16 5Z" />
                        <path d="M10.5 15H21.5M10.5 15L16 25M21.5 15L16 25" />
                      </svg>
                    </span>
                    <strong>{{ exam.label }}</strong>
                    <span class="radio-control" aria-hidden="true">
                      <svg v-if="selectedExam === exam.value" viewBox="0 0 16 16">
                        <path d="M3.5 8.2l2.7 2.7 6.3-6.1" />
                      </svg>
                    </span>
                  </label>
                </div>
              </div>

              <div class="option-section plan-section">
                <div class="option-heading">
                  <span class="option-step">2</span>
                  <div class="option-heading__content">
                    <h3>选择订阅计划</h3>
                    <p>按需选择，随时开启高效备考</p>
                  </div>
                </div>
                <button
                  v-for="plan in plans"
                  :key="plan.id"
                  class="plan-option"
                  :class="{ 'plan-option--active': selectedPlanId === plan.id }"
                  type="button"
                  :disabled="resumedExistingOrder"
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
                    <small>/{{ plan.period }}</small>
                    <span
                      v-if="plan.originalPrice"
                      class="plan-original-group"
                      :aria-label="`原价${plan.originalPrice}元`"
                    >
                      <del class="plan-original-price">¥{{ plan.originalPrice }}</del>
                    </span>
                  </span>
                  <span
                    class="plan-selected"
                    :class="{ 'plan-selected--active': selectedPlanId === plan.id }"
                    aria-hidden="true"
                  >
                    <svg v-if="selectedPlanId === plan.id" viewBox="0 0 16 16">
                      <path d="M3.5 8.2l2.7 2.7 6.3-6.1" />
                    </svg>
                  </span>
                </button>
              </div>

              <div class="member-benefits">
                <h3>会员权益</h3>
                <ul>
                  <li v-for="benefit in benefits" :key="benefit.title">
                    <span class="benefit-icon" aria-hidden="true">
                      <svg v-if="benefit.icon === 'document'" viewBox="0 0 24 24">
                        <path d="M6 3.5h10l2 2v15H6zM9 9h6M9 13h6M9 17h4" />
                      </svg>
                      <svg v-else-if="benefit.icon === 'report'" viewBox="0 0 24 24">
                        <path d="M5 20V11h3v9M10.5 20V5h3v15M16 20v-7h3v7" />
                      </svg>
                      <svg v-else-if="benefit.icon === 'library'" viewBox="0 0 24 24">
                        <path d="M4 7l8-4 8 4-8 4zM4 12l8 4 8-4M4 16l8 4 8-4" />
                      </svg>
                      <svg v-else viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="8.5" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    </span>
                    <span class="benefit-copy">
                      <strong>{{ benefit.title }}</strong>
                      <span>{{ benefit.description }}</span>
                    </span>
                  </li>
                </ul>
              </div>
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
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'
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
  defaultPlanId?: 'monthly' | 'quarterly'
  resumeOrderNo?: string
}

interface PaymentPlan {
  id: string
  name: string
  price: string
  period: '30天' | '90天'
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
const priceConfig = ref({
  monthlyPriceCents: 19800,
  quarterlyOriginalPriceCents: 59400,
  quarterlyPriceCents: 35600,
})

const plans = computed<PaymentPlan[]>(() => [
  {
    id: 'monthly',
    name: '月卡',
    price: formatPrice(priceConfig.value.monthlyPriceCents),
    period: '30天',
    recommended: false,
  },
  {
    id: 'quarterly',
    name: '季卡',
    price: formatPrice(priceConfig.value.quarterlyPriceCents),
    period: '90天',
    promo: formatDiscountLabel(
      priceConfig.value.quarterlyPriceCents,
      priceConfig.value.quarterlyOriginalPriceCents,
    ),
    originalPrice: formatPrice(priceConfig.value.quarterlyOriginalPriceCents),
    recommended: true,
  },
])

const benefits = [
  { icon: 'document', title: '解锁全部', description: '会员诊断卷' },
  { icon: 'report', title: '不限次数', description: '生成能力诊断报告' },
  { icon: 'library', title: '不限题量', description: '专项题库与练习本' },
  { icon: 'history', title: '查看完整解析', description: '与历史学习数据' },
] as const

// 聚合码支持的扫码工具只作静态提示，不参与订单创建或二维码切换。
const channels = [
  { id: 'alipay', name: '支付宝', mark: '支' },
  { id: 'wechat', name: '微信支付', mark: '微' },
  { id: 'unionpay', name: '云闪付 App', mark: '云' },
] as const

const displayAmount = computed(() =>
  formatPrice(
    orderAmountCents.value ??
      (selectedPlanId.value === 'monthly'
        ? priceConfig.value.monthlyPriceCents
        : priceConfig.value.quarterlyPriceCents),
  ),
)

// 付款摘要展示当前订单对应的考试名称。
const selectedExamLabel = computed(
  () => examOptions.find((item) => item.value === selectedExam.value)?.label || selectedExam.value,
)

// 付款摘要使用当前套餐名称与固定服务期限，避免用户只看到金额。
const selectedPlanLabel = computed(() => {
  const selectedPlan = plans.value.find((item) => item.id === selectedPlanId.value)
  return selectedPlan ? `${selectedPlan.name}（${selectedPlan.period}）` : ''
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

// 季卡优惠文案随后台价格同步计算，避免价格调整后仍展示失真的固定折扣。
function formatDiscountLabel(priceCents: number, originalPriceCents: number): string | undefined {
  if (priceCents >= originalPriceCents) return undefined
  const discount = Number(((priceCents / originalPriceCents) * 10).toFixed(1))
  return `限时 ${discount} 折`
}

async function loadPaymentConfig(): Promise<boolean> {
  try {
    const config = await getPaymentConfig()
    priceConfig.value = {
      monthlyPriceCents: config.monthlyPriceCents,
      quarterlyOriginalPriceCents: config.quarterlyOriginalPriceCents,
      quarterlyPriceCents: config.quarterlyPriceCents,
    }
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
      plan: selectedPlanId.value as 'monthly' | 'quarterly',
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
  selectedPlanId.value = props.defaultPlanId || 'monthly'
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
  width: min(970px, 100%);
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
  min-height: 78px;
  padding: 15px 30px 12px;
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
  grid-template-columns: minmax(0, 62%) minmax(340px, 38%);
  min-height: 490px;
}

.payment-options {
  padding: 14px 30px 20px;
  border-right: 1px solid #e8eef7;
}

.option-section + .option-section {
  margin-top: 20px;
}

.option-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.option-step {
  display: grid;
  flex: 0 0 27px;
  width: 27px;
  height: 27px;
  place-items: center;
  color: #2874ff;
  font-size: 14px;
  font-weight: 800;
  background: #e7f0ff;
  border-radius: 50%;
}

.option-heading__content {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.option-heading__content h3 {
  flex: 0 0 auto;
  margin: 0;
  padding-right: 10px;
  color: #172033;
  font-size: 16px;
  font-weight: 760;
  border-right: 1px solid #d7dfeb;
}

.option-heading__content p {
  margin: 0;
  overflow: hidden;
  color: #8792a5;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exam-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.exam-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 68px;
  padding: 10px 14px;
  color: #1c2639;
  font-size: 16px;
  background: #fff;
  border: 1px solid #d9e1ec;
  border-radius: 5px;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.exam-option input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.exam-option__icon {
  display: grid;
  place-items: center;
  flex: 0 0 45px;
  width: 45px;
  height: 45px;
  border-radius: 50%;
}

.exam-option__icon svg {
  width: 27px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.4;
}

.exam-option__icon--esat {
  color: #ef3f74;
  background: linear-gradient(145deg, #ffe9f0, #fff3f6);
}

.exam-option__icon--tmua {
  color: #e47613;
  background: linear-gradient(145deg, #fff0df, #fff8ee);
}

.exam-option strong {
  font-size: 16px;
  font-weight: 750;
}

.radio-control {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  color: #fff;
  background: #fff;
  border: 1.5px solid #cbd5e2;
  border-radius: 50%;
}

.radio-control svg {
  width: 13px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.exam-option input:focus-visible ~ .radio-control {
  outline: 2px solid #1a1a1a;
  outline-offset: 2px;
}

.exam-option--active {
  background: linear-gradient(145deg, #fff, #f7faff);
  border-color: #3478ff;
  box-shadow: 0 8px 22px rgb(47 115 255 / 8%);
}

.exam-option--active .radio-control {
  background: #2f73ff;
  border-color: #2f73ff;
}

.exam-option:has(input:disabled),
.plan-option:disabled {
  cursor: default;
}

.plan-section {
  display: block;
}

.plan-option + .plan-option {
  margin-top: 20px;
}

.plan-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 62px;
  padding: 0 17px;
  color: #172033;
  text-align: left;
  background: #fff;
  border: 1px solid #d8e0eb;
  border-radius: 5px;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.plan-option--active {
  background: linear-gradient(145deg, #fff, #f7faff);
  border: 1.5px solid #3478ff;
  box-shadow: 0 8px 22px rgb(47 115 255 / 7%);
}

.plan-option:disabled {
  opacity: 1;
}

.plan-name {
  font-size: 16px;
  font-weight: 750;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-left: auto;
  padding-right: 25px;
}

.plan-price strong {
  color: #2672ff;
  font-size: 23px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.plan-price > small {
  color: #77849a;
  font-size: 12px;
}

.plan-promo {
  margin-right: 4px;
  color: #f2a20c;
  font-size: 13px;
  font-weight: 700;
}

.plan-original-group {
  display: inline-flex;
  align-items: baseline;
  color: #8792a5;
  font-size: 12px;
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
  left: 18px;
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
  top: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 21px;
  height: 21px;
  color: #fff;
  background: #fff;
  border: 1.5px solid #cbd5e2;
  border-radius: 50%;
}

.plan-selected--active {
  background: #2f73ff;
  border-color: #2f73ff;
}

.plan-selected svg {
  width: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.member-benefits {
  margin-top: 18px;
}

.member-benefits h3 {
  margin: 0 0 9px;
  color: #172033;
  font-size: 15px;
  font-weight: 760;
}

.member-benefits ul {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.member-benefits li {
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  flex-direction: column;
  gap: 5px;
  padding: 0 8px;
  color: #637087;
  font-size: 12px;
  line-height: 1.35;
  text-align: center;
}

.member-benefits li + li::before {
  position: absolute;
  top: 18px;
  bottom: 2px;
  left: 0;
  width: 1px;
  background: #e2e8f1;
  content: '';
}

.benefit-icon {
  display: grid;
  width: 37px;
  height: 37px;
  place-items: center;
  color: #637087;
  background: linear-gradient(145deg, #f1f3f6, #f8f9fb);
  border-radius: 50%;
}

.benefit-icon svg {
  width: 21px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.benefit-copy {
  display: grid;
  gap: 2px;
}

.benefit-copy strong {
  color: #536078;
  font-size: 12px;
  font-weight: 650;
}

.payment-checkout {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 20px 28px 18px;
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
  color: #68758b;
  font-size: 12px;
  font-weight: 600;
}

.qr-frame {
  position: relative;
  padding: 8px;
}

.qr-card {
  position: relative;
  width: 202px;
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
  padding: 12px 24px 14px;
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

@media (max-width: 900px) {
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
    min-height: 74px;
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
    padding: 18px 20px 24px;
    border-right: 0;
  }
  .exam-options {
    gap: 12px;
  }
  .plan-option {
    min-height: 68px;
    padding: 12px 18px;
  }
  .plan-price {
    flex-wrap: wrap;
    justify-content: flex-end;
    max-width: 66%;
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
  .option-heading__content p {
    display: none;
  }
  .exam-options {
    grid-template-columns: 1fr;
  }
  .exam-option {
    min-height: 70px;
  }
  .member-benefits ul {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 22px;
  }
  .member-benefits li:nth-child(3)::before {
    display: none;
  }
  .plan-price {
    max-width: 70%;
    padding-right: 25px;
  }
}
</style>
