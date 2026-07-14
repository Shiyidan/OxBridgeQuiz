// 使用银联商务文档中的固定向量校验 OPEN-BODY-SIG 签名实现。
import { createChinaumsBodySignature } from '../src/services/chinaumsSignature.js'

const actual = createChinaumsBodySignature({
  appId: '12345678901234567890123456789012',
  appKey: '67890123456789012345678901234567',
  body: 'A',
  timestamp: '20170101120000',
  nonce: '09876543210987654321098765432109',
})
const expected = 'GINsCTyNKTpEI9KXO16KqZJ64fOyAytEKl8aaR/Dy08='

if (actual !== expected) {
  throw new Error(`ChinaUMS signature mismatch: expected ${expected}, received ${actual}`)
}

console.log('ChinaUMS OPEN-BODY-SIG verification passed.')
