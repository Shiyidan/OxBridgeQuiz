// 银联商务生产参数预检：无交易副作用地校验环境隔离、商户归属、通知地址和请求签名格式。
import { config } from '../src/config.js'
import { createChinaumsAuthorizationHeader } from '../src/services/chinaumsSignature.js'

// 预检日志只显示标识末四位，禁止把生产参数完整写入部署日志。
function maskIdentifier(value: string, visible = 4): string {
  if (value.length <= visible) return '*'.repeat(value.length)
  return `${'*'.repeat(value.length - visible)}${value.slice(-visible)}`
}

// 预检只生成本地认证头并读取配置，不向银联发起下单、查询或退款请求。
function main(): void {
  if (config.runtimeEnv !== 'prod') throw new Error('API_RUNTIME_ENV must be prod')
  if (!config.chinaums.enabled) throw new Error('CHINAUMS_ENABLED must be true')
  if (config.chinaums.environment !== 'prod') throw new Error('CHINAUMS_ENV must be prod')
  if (config.chinaums.expectedMid !== config.chinaums.mid) {
    throw new Error('The configured merchant ID does not match the approved production merchant')
  }

  const authorization = createChinaumsAuthorizationHeader({
    appId: config.chinaums.appId,
    appKey: config.chinaums.appKey,
    body: '{}',
    timestamp: '20260729000000',
    nonce: 'production-readiness-check',
  })
  if (!authorization.startsWith('OPEN-BODY-SIG AppId="') || !authorization.includes('Signature="')) {
    throw new Error('Unable to generate a valid OPEN-BODY-SIG authorization header')
  }

  console.log(JSON.stringify({
    paymentProvider: 'chinaums',
    environment: config.chinaums.environment,
    baseHost: new URL(config.chinaums.baseUrl).host,
    merchantId: maskIdentifier(config.chinaums.mid),
    terminalId: maskIdentifier(config.chinaums.tid),
    notificationHost: new URL(config.chinaums.notifyUrl).host,
    requestAuthentication: 'OPEN-BODY-SIG ready',
    notificationAuthentication: 'communication key configured',
  }))
}

main()
