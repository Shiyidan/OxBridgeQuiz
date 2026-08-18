// 银联商务订单号兼容校验：确保微信通道追加一位后仍不超过临时兼容上限。
import assert from 'node:assert/strict'

process.env.CHINAUMS_ENABLED = 'false'
process.env.CHINAUMS_MSG_SRC_ID = '3LQ8'

// 动态导入确保校验使用上述隔离配置，不读取真实支付商户凭据。
async function main(): Promise<void> {
  const { createChinaumsOrderNo } = await import('../src/services/chinaums.js')
  const fixedDate = new Date('2026-08-18T19:28:26.803Z')

  for (let index = 0; index < 100; index += 1) {
    const orderNo = createChinaumsOrderNo(fixedDate)
    assert.match(orderNo, /^3LQ8\d{23}$/)
    assert.equal(Buffer.byteLength(orderNo, 'utf8'), 27)
    assert.equal(Buffer.byteLength(`${orderNo}0`, 'utf8'), 28)
  }

  console.log('ChinaUMS order number compatibility verified: billNo=27 bytes, downstream merOrderId=28 bytes.')
}

void main()
