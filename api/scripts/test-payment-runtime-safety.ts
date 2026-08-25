// 支付运行时安全门禁回归：覆盖生产支付、生命周期开关和非生产环境组合。
import assert from 'node:assert/strict'
import { assertPaymentRuntimeSafety } from '../src/utils/paymentRuntimeSafety.js'

assert.throws(
  () => assertPaymentRuntimeSafety({
    runtimeEnv: 'prod',
    chinaumsEnabled: true,
    lifecycleEnabled: false,
  }),
  /Production ChinaUMS payments require PAYMENT_LIFECYCLE_ENABLED=true/,
)

assert.doesNotThrow(() => assertPaymentRuntimeSafety({
  runtimeEnv: 'prod',
  chinaumsEnabled: true,
  lifecycleEnabled: true,
}))

assert.doesNotThrow(() => assertPaymentRuntimeSafety({
  runtimeEnv: 'prod',
  chinaumsEnabled: false,
  lifecycleEnabled: false,
}))

assert.doesNotThrow(() => assertPaymentRuntimeSafety({
  runtimeEnv: 'test',
  chinaumsEnabled: true,
  lifecycleEnabled: false,
}))

console.log('Payment runtime safety regression passed')
