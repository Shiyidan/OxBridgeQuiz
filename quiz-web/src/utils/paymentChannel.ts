// 后台订单与营收明细共用的支付渠道展示文案。
const PAYMENT_CHANNEL_LABELS: Record<string, string> = {
  aggregate: '聚合支付',
  alipay: '支付宝',
  wechat: '微信支付',
  unionpay: '云闪付',
  admin_gift: '管理员赠送',
  invitation_reward: '邀请奖励',
}

// 按订单记录的渠道展示，未知历史值保留原文，缺失值显示占位符。
export function paymentChannelLabel(channel?: string | null): string {
  return channel ? PAYMENT_CHANNEL_LABELS[channel] || channel : '—'
}
