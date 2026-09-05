// 银联商务通知验签专项校验：使用接入指引附件中的 SHA256 完整样例防止生产算法回归。
import {
  createChinaumsNotificationSignature,
  verifyChinaumsNotificationSignature,
} from '../src/services/chinaumsNotificationSignature.js'
import { resolveChinaumsPaymentChannel } from '../src/services/chinaumsChannel.js'

const communicationKey = 'impARTxrQcfwmRijpDNCw6hPxaWCddKEpYxjaKXDhCaTCXJ6'
const expectedSignature = '68CFB169494DD0EA83DB11AA132A1C6EC46DED75F8E1DCAADDC0011D91B6B4FE'
const encodedNotification = 'buyerUsername=tj.***%40gmail.com&msgType=trade.notify&payTime=2022-11-16+09%3A48%3A41&buyerCashPayAmt=1&connectSys=UNIONPAY&sign=68CFB169494DD0EA83DB11AA132A1C6EC46DED75F8E1DCAADDC0011D91B6B4FE&merName=%E4%B8%AD%E4%BF%9D%E4%BB%98%E6%B5%8B%E8%AF%95%E5%95%86%E6%88%B7%28%E4%B8%AD%E4%BF%9D%E4%BB%98%E6%B5%8B%E8%AF%95%E5%95%86%E6%88%B7%29&mid=898201612345678&invoiceAmount=1&settleDate=2022-11-16&billFunds=%E6%94%AF%E4%BB%98%E5%AE%9D%E4%BD%99%E9%A2%9D%3A1&buyerId=2088202932263863&mchntUuid=6d47dc12a4c847eaba2eb456d201d5cd&tid=88880001&instMid=H5DEFAULT&receiptAmount=1&couponAmount=0&cardAttr=BALANCE&targetOrderId=2022111622001463861446080716&signType=SHA256&billFundsDesc=%E6%94%AF%E4%BB%98%E5%AE%9D%E4%BD%99%E9%A2%9D%E6%94%AF%E4%BB%980.01%E5%85%83%E3%80%82&freeSettlementAmt=0&orderDesc=%E4%B8%AD%E4%BF%9D%E4%BB%98%E6%B5%8B%E8%AF%95%E5%95%86%E6%88%B7%28%E4%B8%AD%E4%BF%9D%E4%BB%98%E6%B5%8B%E8%AF%95%E5%95%86%E6%88%B7%29&seqId=01193401135N&merOrderId=101720221116094809280000006&targetSys=Alipay+2.0&Ue=hobh&totalAmount=1&createTime=2022-11-16+09%3A48%3A12&buyerPayAmount=1&notifyId=2bbcfd87-6e93-4fc4-b38f-1c5d853ecbb8&subInst=100200&status=TRADE_SUCCESS'

const payload = Object.fromEntries(new URLSearchParams(encodedNotification))
const actual = createChinaumsNotificationSignature(payload, communicationKey)
if (actual !== expectedSignature || !verifyChinaumsNotificationSignature(payload, communicationKey)) {
  throw new Error(`ChinaUMS notification signature mismatch: expected ${expectedSignature}, received ${actual}`)
}
if (resolveChinaumsPaymentChannel(payload) !== 'alipay') {
  throw new Error('ChinaUMS targetSys must identify Alipay even when connectSys is UNIONPAY')
}
if (resolveChinaumsPaymentChannel({ targetSys: 'WXPay' }) !== 'wechat') {
  throw new Error('ChinaUMS targetSys must identify WeChat Pay')
}
if (resolveChinaumsPaymentChannel({ billPayment: { targetSys: 'UNIONPAY' } }) !== 'unionpay') {
  throw new Error('ChinaUMS billPayment.targetSys must identify Cloud QuickPass')
}
console.log('ChinaUMS notification signature fixture passed.')
