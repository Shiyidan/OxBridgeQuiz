// 真实支付营收口径测试：确保零元日卡与奖励订单被排除，并验证退款后的净收入。
import assert from 'node:assert/strict'
import {
  PAYMENT_ORDER_STATUS,
  PAYMENT_PRICE_TYPE,
} from '../src/constants/domain.js'
import {
  calculateNetRevenueCents,
  costExcludingReimbursedWhere,
  realPaymentOrderWhere,
  revenueDetailOrderWhere,
  yuanAmountToCents,
} from '../src/services/revenuePayments.js'

function main(): void {
  assert.deepEqual(realPaymentOrderWhere(), {
    priceType: {
      in: [PAYMENT_PRICE_TYPE.MONTHLY, PAYMENT_PRICE_TYPE.QUARTERLY],
    },
    status: {
      in: [
        PAYMENT_ORDER_STATUS.PAID,
        PAYMENT_ORDER_STATUS.REFUNDING,
        PAYMENT_ORDER_STATUS.REFUNDED,
      ],
    },
    amountCents: { gt: 0 },
  })
  assert.deepEqual(revenueDetailOrderWhere(), {
    priceType: {
      in: [PAYMENT_PRICE_TYPE.MONTHLY, PAYMENT_PRICE_TYPE.QUARTERLY],
    },
    status: {
      in: [PAYMENT_ORDER_STATUS.PAID, PAYMENT_ORDER_STATUS.REFUNDING],
    },
    amountCents: { gt: 0 },
  })
  assert.deepEqual(costExcludingReimbursedWhere(), {
    reimbursementStatus: { not: 'reimbursed' },
  })
  assert.equal(calculateNetRevenueCents(55_400, 19_800), 35_600)
  assert.equal(calculateNetRevenueCents(19_800, 35_600), 0)
  assert.equal(yuanAmountToCents(123.45), 12_345)

  console.log('Revenue payment statistics tests passed')
}

main()
