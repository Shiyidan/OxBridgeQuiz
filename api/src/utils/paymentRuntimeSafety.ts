// 支付运行时安全规则：阻止生产支付通道在缺少生命周期兜底时启动。

export type PaymentRuntimeSafetyInput = {
  runtimeEnv: string
  chinaumsEnabled: boolean
  lifecycleEnabled: boolean
}

// 生产支付必须同时启用生命周期任务，避免未支付、退款中和到期权益永久滞留。
export function assertPaymentRuntimeSafety(input: PaymentRuntimeSafetyInput): void {
  if (input.runtimeEnv === 'prod' && input.chinaumsEnabled && !input.lifecycleEnabled) {
    throw new Error(
      '[config] Production ChinaUMS payments require PAYMENT_LIFECYCLE_ENABLED=true',
    )
  }
}
