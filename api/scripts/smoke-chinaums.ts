// 银联商务连接冒烟：创建1分钱一次性二维码、查询状态并立即关闭，生产环境需显式确认商户号。
import { config } from '../src/config.js'
import {
  closeChinaumsQr,
  createChinaumsOrderNo,
  createChinaumsQr,
  formatChinaumsBillDate,
  queryChinaumsBill,
} from '../src/services/chinaums.js'

// 响应未单独返回二维码ID时，从官方二维码地址的 id 参数提取。
function resolveQrCodeId(qrCodeId: string | undefined, billQRCode: string | undefined): string {
  if (qrCodeId) return qrCodeId
  if (!billQRCode) return ''
  try {
    return new URL(billQRCode).searchParams.get('id') || ''
  } catch {
    return ''
  }
}

// 冒烟请求只记录非密钥结果，并在生成二维码后尽力完成关单。
async function main(): Promise<void> {
  if (!config.chinaums.enabled) {
    throw new Error('Set CHINAUMS_ENABLED=true before running the ChinaUMS smoke test.')
  }
  if (
    config.chinaums.environment === 'prod'
    && process.env.CHINAUMS_PRODUCTION_SMOKE_ACK !== config.chinaums.expectedMid
  ) {
    throw new Error('Production smoke test requires CHINAUMS_PRODUCTION_SMOKE_ACK to match the approved merchant ID.')
  }

  const createdAt = new Date()
  const orderNo = createChinaumsOrderNo(createdAt)
  const billDate = formatChinaumsBillDate(createdAt)
  const expiresAt = new Date(createdAt.getTime() + 5 * 60 * 1000)
  let qrCodeId = ''
  let systemId = ''

  try {
    const created = await createChinaumsQr({
      orderNo,
      amountCents: 1,
      expiresAt,
      description: 'AceMock会员支付接口测试',
    })
    qrCodeId = resolveQrCodeId(created.qrCodeId, created.billQRCode)
    systemId = created.systemId || ''
    console.log(JSON.stringify({ step: 'create', errCode: created.errCode, orderNo, billDate, qrCodeCreated: Boolean(created.billQRCode), qrCodeId }, null, 2))

    const queried = await queryChinaumsBill(orderNo, billDate)
    console.log(JSON.stringify({ step: 'query', errCode: queried.errCode, billStatus: queried.billStatus, totalAmount: queried.totalAmount }, null, 2))
  } finally {
    if (qrCodeId) {
      const closed = await closeChinaumsQr(qrCodeId, systemId || undefined)
      console.log(JSON.stringify({ step: 'close', errCode: closed.errCode, billStatus: closed.billStatus, qrCodeId: closed.qrCodeId }, null, 2))
    } else {
      console.warn(`ChinaUMS QR could not be closed automatically. orderNo=${orderNo}, expiresAt=${expiresAt.toISOString()}`)
    }
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
