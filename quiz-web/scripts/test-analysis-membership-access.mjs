// 在内存中替换网络与组件生命周期，验证真实解析入口逻辑的续费和异步边界。
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/composables/useAnalysisMembershipAccess.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

// 每个场景使用独立页面和请求队列，不加载数据库或写入测试数据。
function setup() {
  const route = { fullPath: '/report/original' }
  const requests = []
  let dispose
  const exports = {}
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'vue') return { ref: (value) => ({ value }), onBeforeUnmount: (callback) => { dispose = callback } }
      if (name === 'vue-router') return { useRoute: () => route }
      if (name === '@/api/exam') return {
        getExamReviewAccess: (id) => new Promise((resolve, reject) => requests.push({ id, resolve, reject })),
      }
      throw new Error(`Unexpected import: ${name}`)
    },
  })
  return { gate: exports.useAnalysisMembershipAccess(), route, requests, dispose: () => dispose() }
}

const { gate, requests } = setup()
const opened = []
const target = { moduleId: 'maths1', questionNumber: 7, wrongOnly: true }
const first = gate.checkAnalysisAccess('original-record', () => opened.push(target))
await gate.checkAnalysisAccess('other-record', () => opened.push('unexpected'))
assert.equal(requests.length, 1)
requests[0].resolve({ allowed: false, examType: 'ESAT' })
await first
assert.equal(gate.analysisMembershipOpen.value, true)
assert.equal(gate.analysisExamType.value, 'ESAT')
assert.equal(opened.length, 0)

// 续费后仍无原考试权益时保持拦截，成功后保留原答卷与题号/错题定位。
const wrongExam = gate.resumeAnalysis()
requests[1].resolve({ allowed: false, examType: 'ESAT' })
await wrongExam
assert.equal(opened.length, 0)
const renewed = gate.resumeAnalysis()
assert.equal(requests[2].id, 'original-record')
requests[2].resolve({ allowed: true, examType: 'ESAT' })
await renewed
assert.deepEqual(opened, [target])
assert.equal(gate.analysisMembershipOpen.value, false)
await gate.resumeAnalysis()
assert.equal(requests.length, 3)

for (const changed of ['route', 'unmount', 'network']) {
  const state = setup()
  let navigated = false
  const checking = state.gate.checkAnalysisAccess('record', () => { navigated = true })
  if (changed === 'route') state.route.fullPath = '/elsewhere'
  if (changed === 'unmount') state.dispose()
  if (changed === 'network') state.requests[0].reject(new Error('offline'))
  else state.requests[0].resolve({ allowed: true, examType: 'ESAT' })
  await checking
  assert.equal(navigated, false)
  assert.equal(state.gate.analysisMembershipOpen.value, false)
  assert.equal(state.gate.analysisChecking.value, false)
}

// 提示后离开原页面再收到支付通知，不能自动跳回旧答卷。
const stale = setup()
const expired = stale.gate.checkAnalysisAccess('old-record', () => assert.fail('stale navigation'))
stale.requests[0].resolve({ allowed: false, examType: 'TMUA' })
await expired
stale.route.fullPath = '/practice-notebook'
await stale.gate.resumeAnalysis()
assert.equal(stale.requests.length, 1)
console.log('PASS: expired access, original target after renewal, wrong exam, duplicate click, stale page and network failure')
