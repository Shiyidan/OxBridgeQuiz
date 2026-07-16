// 支付前台接口：提供价格、银联商务聚合码下单、查询、关单和异步通知处理。
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { config } from '../config.js'
import { requireAuth } from '../middleware/auth.js'
import {
  ChinaumsRequestError,
  chinaumsResponseSnapshot,
  createChinaumsOrderNo,
  createChinaumsQr,
  normalizeChinaumsNotification,
  verifyChinaumsNotification,
} from '../services/chinaums.js'
import { PaymentFulfillmentError } from '../services/paymentFulfillment.js'
import { closePaymentOrder, syncPaymentOrderFromChinaums } from '../services/paymentOrder.js'
import { refreshPaymentRefund } from '../services/paymentRefund.js'
import { prisma } from '../services/prisma.js'
import { fail, success } from '../utils/response.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import {
  EXAM_TYPES,
  MEMBERSHIP_PLAN,
  PAYMENT_CHANNELS,
  PAYMENT_CONFIG_STATUS,
  PAYMENT_NOTIFICATION_STATUS,
  PAYMENT_ORDER_STATUS,
  PAYMENT_PRICE_TYPE,
  PAYMENT_REFUND_STATUS,
  isMembershipPlan,
  isStudentExamTypeAvailable,
} from '../constants/domain.js'

export const paymentRouter = createAsyncRouter()

const DEFAULT_CONFIG = {
  firstMonthlyPriceCents: 7800,
  monthlyPriceCents: 7900,
  yearlyPriceCents: 39800,
}

function formatConfig(paymentConfig: {
  firstMonthlyPriceCents: number
  monthlyPriceCents: number
  yearlyPriceCents: number
  status: string
  updatedAt: Date
}) {
  return {
    firstMonthlyPriceCents: paymentConfig.firstMonthlyPriceCents,
    monthlyPriceCents: paymentConfig.monthlyPriceCents,
    yearlyPriceCents: paymentConfig.yearlyPriceCents,
    status: paymentConfig.status,
    providerReady: config.chinaums.enabled,
    updatedAt: paymentConfig.updatedAt.toISOString(),
  }
}

function formatOrder<T extends {
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
  paidAt: Date | null
  closedAt: Date | null
}>(order: T) {
  const { providerPayload: _providerPayload, ...safeOrder } = order as T & { providerPayload?: unknown }
  return {
    ...safeOrder,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    expiresAt: order.expiresAt.toISOString(),
    paidAt: order.paidAt?.toISOString() || null,
    closedAt: order.closedAt?.toISOString() || null,
  }
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function sanitizeNotification(payload: Record<string, string>): Prisma.InputJsonValue {
  const sensitive = /(^sign$|buyer|bankCard|mobile|certNo|extraBuyerInfo)/i
  const nestedPayload = new Set(['billPayment', 'refundBillPayment'])
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (sensitive.test(key)) return [key, '[REDACTED]']
      if (!nestedPayload.has(key)) return [key, value]
      try {
        const parsed = JSON.parse(value) as Record<string, unknown>
        return [
          key,
          Object.fromEntries(
            Object.entries(parsed).map(([nestedKey, nestedValue]) => [
              nestedKey,
              sensitive.test(nestedKey) ? '[REDACTED]' : nestedValue,
            ]),
          ),
        ]
      } catch {
        return [key, '[UNPARSEABLE_PAYMENT_DETAIL]']
      }
    }),
  ) as Prisma.InputJsonValue
}

function notificationId(payload: Record<string, string>): string {
  if (payload.notifyId) return payload.notifyId.slice(0, 128)
  const canonical = Object.keys(payload).sort().map((key) => `${key}=${payload[key]}`).join('&')
  return crypto.createHash('sha256').update(canonical).digest('hex')
}

function requestErrorDetails(error: unknown) {
  if (error instanceof ChinaumsRequestError) {
    return { code: error.code, message: error.message, response: error.response }
  }
  return {
    code: 'PAYMENT_PROVIDER_ERROR',
    message: error instanceof Error ? error.message : '银联商务请求失败',
    response: undefined,
  }
}

export async function getOrCreatePaymentConfig() {
  return prisma.paymentConfig.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...DEFAULT_CONFIG },
    update: {},
  })
}

// 当前生效的支付价格策略
paymentRouter.get('/config', async (_req, res) => {
  try {
    const paymentConfig = await getOrCreatePaymentConfig()
    res.json(success(formatConfig(paymentConfig)))
  } catch (error) {
    console.error('[payment] config error:', error)
    res.status(500).json(fail('获取支付策略失败'))
  }
})

// 银联商务异步通知不依赖用户登录；验签和主动查询均成功后才发放权益。
paymentRouter.post('/notifications/chinaums', async (req, res) => {
  const payload = normalizeChinaumsNotification(req.body as Record<string, unknown>)
  const notifyId = notificationId(payload)
  const orderNo = payload.billNo || null
  const signatureValid = verifyChinaumsNotification(payload)
  let notificationRecord: { id: string } | null = null
  try {
    notificationRecord = await prisma.paymentNotification.upsert({
      where: { provider_notificationId: { provider: 'chinaums', notificationId: notifyId } },
      create: {
        provider: 'chinaums',
        notificationId: notifyId,
        orderNo,
        signatureValid,
        rawPayload: sanitizeNotification(payload),
      },
      update: {
        orderNo,
        signatureValid,
        rawPayload: sanitizeNotification(payload),
      },
      select: { id: true },
    })

    if (!config.chinaums.enabled || !signatureValid) {
      throw new PaymentFulfillmentError('银联商务通知验签失败或支付通道未启用', 'PAYMENT_NOTIFICATION_INVALID')
    }
    if (payload.mid !== config.chinaums.mid || payload.tid !== config.chinaums.tid || payload.instMid !== config.chinaums.instMid) {
      throw new PaymentFulfillmentError('银联商务通知的商户信息不匹配', 'PAYMENT_MERCHANT_MISMATCH')
    }
    if (!orderNo) throw new PaymentFulfillmentError('银联商务通知缺少账单号', 'PAYMENT_ORDER_NO_MISSING')

    const order = await prisma.paymentOrder.findUnique({ where: { orderNo } })
    if (!order) throw new PaymentFulfillmentError('本地支付订单不存在', 'PAYMENT_ORDER_NOT_FOUND')
    const refundOrderNo = payload.refundOrderId
      || (order.status === PAYMENT_ORDER_STATUS.REFUNDING
        ? (await prisma.paymentRefund.findFirst({
            where: { paymentOrderId: order.id, status: PAYMENT_REFUND_STATUS.PROCESSING },
            orderBy: { createdAt: 'desc' },
            select: { refundOrderNo: true },
          }))?.refundOrderNo
        : undefined)
    if (refundOrderNo) {
      await refreshPaymentRefund(refundOrderNo)
    } else if (order.status !== PAYMENT_ORDER_STATUS.PAID) {
      await syncPaymentOrderFromChinaums(order)
    }
    await prisma.paymentNotification.update({
      where: { id: notificationRecord.id },
      data: {
        processStatus: PAYMENT_NOTIFICATION_STATUS.PROCESSED,
        processedAt: new Date(),
        errorMessage: null,
      },
    })
    res.type('text/plain').send('SUCCESS')
  } catch (error) {
    console.error('[payment] ChinaUMS notification error:', error)
    if (notificationRecord) {
      await prisma.paymentNotification.update({
        where: { id: notificationRecord.id },
        data: {
          processStatus: PAYMENT_NOTIFICATION_STATUS.FAILED,
          errorMessage: error instanceof Error ? error.message.slice(0, 500) : '通知处理失败',
        },
      }).catch((updateError) => console.error('[payment] notification audit update error:', updateError))
    }
    res.status(400).type('text/plain').send('FAILED')
  }
})

// 创建一次性银联商务聚合支付二维码，金额始终由服务端价格策略计算。
paymentRouter.post('/orders', requireAuth, async (req, res) => {
  let createdOrderId = ''
  try {
    if (!config.chinaums.enabled) {
      res.status(503).json(fail('银联商务参数尚未配置完成', 'PAYMENT_PROVIDER_NOT_CONFIGURED'))
      return
    }
    const { examTypes, plan, channel } = req.body as {
      examTypes?: unknown
      plan?: unknown
      channel?: unknown
    }
    const normalizedExamTypes = Array.isArray(examTypes)
      ? [...new Set(examTypes.filter((item): item is string => typeof item === 'string'))]
      : []

    if (
      normalizedExamTypes.length === 0 ||
      normalizedExamTypes.some((item) => !EXAM_TYPES.includes(item as (typeof EXAM_TYPES)[number]))
    ) {
      res.status(422).json(fail('请选择有效的备考类型'))
      return
    }
    if (normalizedExamTypes.some((item) => !isStudentExamTypeAvailable(item))) {
      res.status(422).json(fail('STEP 考试相关功能正在推进中，暂不支持购买', 'EXAM_NOT_AVAILABLE'))
      return
    }
    if (!isMembershipPlan(plan)) {
      res.status(422).json(fail('请选择有效的订阅计划'))
      return
    }
    if (typeof channel !== 'string' || !PAYMENT_CHANNELS.includes(channel as (typeof PAYMENT_CHANNELS)[number])) {
      res.status(422).json(fail('请选择有效的支付方式'))
      return
    }

    const paymentConfig = await getOrCreatePaymentConfig()
    if (paymentConfig.status !== PAYMENT_CONFIG_STATUS.ACTIVE) {
      res.status(409).json(fail('支付功能暂未开放', 'PAYMENT_DISABLED'))
      return
    }

    let priceType: string = PAYMENT_PRICE_TYPE.YEARLY
    let amountCents = paymentConfig.yearlyPriceCents
    if (plan === MEMBERSHIP_PLAN.MONTHLY) {
      const hasPaidMonthlyOrder = await prisma.paymentOrder.findFirst({
        where: {
          userId: req.user!.userId,
          plan: MEMBERSHIP_PLAN.MONTHLY,
          status: { in: [PAYMENT_ORDER_STATUS.PAID, PAYMENT_ORDER_STATUS.REFUNDING] },
        },
        select: { id: true },
      })
      priceType = hasPaidMonthlyOrder ? PAYMENT_PRICE_TYPE.MONTHLY : PAYMENT_PRICE_TYPE.FIRST_MONTHLY
      amountCents = hasPaidMonthlyOrder ? paymentConfig.monthlyPriceCents : paymentConfig.firstMonthlyPriceCents
    }

    const expiresAt = new Date(Date.now() + config.chinaums.orderExpireMinutes * 60 * 1000)
    const order = await prisma.paymentOrder.create({
      data: {
        orderNo: createChinaumsOrderNo(),
        userId: req.user!.userId,
        examTypes: normalizedExamTypes,
        plan,
        priceType,
        amountCents,
        channel,
        status: PAYMENT_ORDER_STATUS.PENDING,
        expiresAt,
      },
    })
    createdOrderId = order.id

    const qrResponse = await createChinaumsQr({
      orderNo: order.orderNo,
      amountCents,
      expiresAt,
      description: `${config.chinaums.orderDescription}-${plan === MEMBERSHIP_PLAN.YEARLY ? '年度' : '月度'}`,
    })
    if (!qrResponse.billQRCode || !qrResponse.billDate) {
      throw new ChinaumsRequestError('银联商务未返回有效二维码', 'CHINAUMS_QR_MISSING', qrResponse)
    }
    const updatedOrder = await prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        providerPayload: jsonValue({
          qrCode: {
            billDate: qrResponse.billDate,
            billQRCode: qrResponse.billQRCode,
            qrCodeId: qrResponse.qrCodeId || null,
            systemId: qrResponse.systemId || null,
            receivedAt: new Date().toISOString(),
          },
        }),
      },
    })

    res.status(201).json(success({
      order: formatOrder(updatedOrder),
      paymentReady: true,
      qrCodeUrl: qrResponse.billQRCode,
      message: '支付二维码已生成，请在有效期内扫码支付',
    }))
  } catch (error) {
    const detail = requestErrorDetails(error)
    console.error('[payment] create order error:', error)
    if (createdOrderId) {
      await prisma.paymentOrder.update({
        where: { id: createdOrderId },
        data: {
          status: PAYMENT_ORDER_STATUS.FAILED,
          failureCode: detail.code.slice(0, 64),
          failureMessage: detail.message.slice(0, 500),
          ...(detail.response
            ? { providerPayload: jsonValue({ createError: chinaumsResponseSnapshot(detail.response) }) }
            : {}),
        },
      }).catch((updateError) => console.error('[payment] failed order update error:', updateError))
    }
    const status = error instanceof ChinaumsRequestError ? 502 : 500
    res.status(status).json(fail(detail.message, detail.code))
  }
})

// 当前用户支付订单列表
paymentRouter.get('/orders', requireAuth, async (req, res) => {
  try {
    const orders = await prisma.paymentOrder.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json(success(orders.map(formatOrder)))
  } catch (error) {
    console.error('[payment] orders error:', error)
    res.status(500).json(fail('获取支付订单失败'))
  }
})

// 当前用户主动向银联商务查询订单，作为异步通知之外的支付确认兜底。
paymentRouter.post('/orders/:orderNo/query', requireAuth, async (req, res) => {
  try {
    const order = await prisma.paymentOrder.findFirst({
      where: { orderNo: req.params.orderNo, userId: req.user!.userId },
    })
    if (!order) {
      res.status(404).json(fail('支付订单不存在'))
      return
    }
    const synced = await syncPaymentOrderFromChinaums(order)
    if (!synced) {
      res.status(404).json(fail('支付订单不存在'))
      return
    }
    res.json(success(formatOrder(synced)))
  } catch (error) {
    const detail = requestErrorDetails(error)
    console.error('[payment] query order error:', error)
    const status = error instanceof ChinaumsRequestError ? 502 : 500
    res.status(status).json(fail(detail.message, detail.code))
  }
})

// 用户取消支付时关闭尚未使用的一次性二维码。
paymentRouter.post('/orders/:orderNo/close', requireAuth, async (req, res) => {
  try {
    const order = await prisma.paymentOrder.findFirst({
      where: { orderNo: req.params.orderNo, userId: req.user!.userId },
    })
    if (!order) {
      res.status(404).json(fail('支付订单不存在'))
      return
    }
    if ([
      PAYMENT_ORDER_STATUS.PAID,
      PAYMENT_ORDER_STATUS.REFUNDING,
      PAYMENT_ORDER_STATUS.REFUNDED,
    ].includes(order.status as any)) {
      res.status(409).json(fail('已支付订单不能关闭', 'PAYMENT_ALREADY_PAID'))
      return
    }
    if (order.status === PAYMENT_ORDER_STATUS.CLOSED) {
      res.json(success(formatOrder(order)))
      return
    }
    const updated = await closePaymentOrder(order, 'user')
    if (!updated) {
      res.status(404).json(fail('支付订单不存在'))
      return
    }
    res.json(success(formatOrder(updated)))
  } catch (error) {
    const detail = requestErrorDetails(error)
    console.error('[payment] close order error:', error)
    const status = error instanceof ChinaumsRequestError ? 502 : 500
    res.status(status).json(fail(detail.message, detail.code))
  }
})

// 当前用户查询本地单笔支付订单
paymentRouter.get('/orders/:orderNo', requireAuth, async (req, res) => {
  try {
    const order = await prisma.paymentOrder.findFirst({
      where: { orderNo: req.params.orderNo, userId: req.user!.userId },
    })
    if (!order) {
      res.status(404).json(fail('支付订单不存在'))
      return
    }
    res.json(success(formatOrder(order)))
  } catch (error) {
    console.error('[payment] order detail error:', error)
    res.status(500).json(fail('获取支付订单失败'))
  }
})
