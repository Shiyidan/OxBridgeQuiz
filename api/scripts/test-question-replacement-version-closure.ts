// 题目替换换版闭包回归测试：覆盖组合卷来源单项未直接命中替换题的场景。
import assert from 'node:assert/strict'

import {
  expandMockPaperVersionClosure,
  type MockPaperVersionClosureSet,
} from '../src/utils/mockPaperVersionClosure.js'

const sourceLeaf: MockPaperVersionClosureSet = {
  id: 'source-leaf-set',
  modules: [{ id: 'source-leaf-module', sourceModuleId: null }],
}
const sourceParent: MockPaperVersionClosureSet = {
  id: 'source-parent-set',
  modules: [{ id: 'source-parent-module', sourceModuleId: 'source-leaf-module' }],
}
const publishedComposition: MockPaperVersionClosureSet = {
  id: 'published-composition-set',
  modules: [
    { id: 'composition-maths1', sourceModuleId: 'source-parent-module' },
    { id: 'composition-physics', sourceModuleId: null },
  ],
}

// 来源所属套卷按请求模块返回，模拟 Prisma 的分批递归加载。
async function loadSourceOwners(sourceModuleIds: string[]) {
  return [sourceParent, sourceLeaf].filter((set) => (
    set.modules.some((module) => sourceModuleIds.includes(module.id))
  ))
}

// 未直接命中替换题的来源单项及其上游来源也必须进入同一换版闭包。
async function testRecursiveClosure() {
  const result = await expandMockPaperVersionClosure(
    [publishedComposition],
    loadSourceOwners,
  )
  assert.deepEqual(
    result.sets.map((set) => set.id),
    ['published-composition-set', 'source-parent-set', 'source-leaf-set'],
  )
  assert.deepEqual(result.missingSourceModuleIds, [])
}

// 数据库中不存在来源模块时必须返回缺失项，发布服务据此停止事务。
async function testMissingSource() {
  const result = await expandMockPaperVersionClosure(
    [{
      id: 'broken-composition-set',
      modules: [{ id: 'copy-module', sourceModuleId: 'missing-source-module' }],
    }],
    async () => [],
  )
  assert.deepEqual(result.missingSourceModuleIds, ['missing-source-module'])
}

await testRecursiveClosure()
await testMissingSource()
console.log('question replacement version closure tests passed')
