// 数学1总览分层：人工选择教学骨干，缩放只改变可见性，不增删正式知识关系。
export type GraphDetailLevel = 0 | 1 | 2

export const graphDetailLabels: Record<GraphDetailLevel, string> = {
  0: '核心网络',
  1: '方法展开',
  2: '完整细节',
}

// 核心覆盖七章，选择能串联具体方法的节点，不按连线数量机械排名。
export const maths1CoreCodes = [
  '110102', // 单位换算：连接量纲与几何测量。
  '110206',
  '110209', // 根与分数转换：连接勾股和概率尺度。
  '110304',
  '110309',
  '110310', // 分配、正反比例与长度/面积/体积比。
  '110404',
  '110407',
  '110410',
  '110411',
  '110415',
  '110416', // 代数变形、方程与图像。
  '110507',
  '110510',
  '110514',
  '110517',
  '110518', // 几何测量、相似和坐标方法。
  '110603',
  '110703',
  '110707', // 统计比较、频率与条件概率。
] as const

// 第二层补充常用方法和连接情境，基础记号与其余专题在第三层展开。
export const maths1MethodCodes = [
  '110203',
  '110207',
  '110210',
  '110212',
  '110301',
  '110308',
  '110311',
  '110405',
  '110412',
  '110413',
  '110419',
  '110502',
  '110509',
  '110516',
  '110519',
  '110601',
  '110602',
  '110702',
  '110706',
] as const

// 仅挑选原图中已有的直接关系作为总览骨干，不压缩路径或合成捷径。
export const maths1CorePairs: readonly (readonly [string, string])[] = [
  ['110102', '110514'],
  ['110206', '110507'],
  ['110209', '110703'],
  ['110304', '110415'],
  ['110309', '110410'],
  ['110310', '110517'],
  ['110310', '110102'],
  ['110404', '110407'],
  ['110407', '110415'],
  ['110407', '110309'],
  ['110411', '110416'],
  ['110410', '110415'],
  ['110415', '110603'],
  ['110416', '110510'],
  ['110507', '110510'],
  ['110410', '110510'],
  ['110507', '110518'],
  ['110517', '110518'],
  ['110517', '110507'],
  ['110518', '110514'],
  ['110603', '110703'],
  ['110703', '110707'],
]

const coreCodes = new Set<string>(maths1CoreCodes)
const methodCodes = new Set<string>(maths1MethodCodes)
const corePairs = new Set(maths1CorePairs.map((pair) => [...pair].sort().join(':')))

// 知识点层级只影响总览显示，权限、学习状态和搜索范围不受影响。
export function maths1NodeDetailLevel(code: string): GraphDetailLevel {
  return coreCodes.has(code) ? 0 : methodCodes.has(code) ? 1 : 2
}

// 骨干以外的关系至少在第二层出现，且不得早于任一端点。
export function maths1EdgeDetailLevel(source: string, target: string): GraphDetailLevel {
  if (corePairs.has([source, target].sort().join(':'))) return 0
  return Math.max(
    1,
    maths1NodeDetailLevel(source),
    maths1NodeDetailLevel(target),
  ) as GraphDetailLevel
}

// 展开与收起使用不同阈值，避免缩放临界处节点反复闪现；大幅缩放可直接跨层。
export function graphDetailLevelForZoom(
  zoom: number,
  previous: GraphDetailLevel,
): GraphDetailLevel {
  if (!Number.isFinite(zoom)) return previous
  if (zoom >= 2.5 || (previous === 2 && zoom >= 2.2)) return 2
  if (zoom >= 1.55 || (previous >= 1 && zoom >= 1.35)) return 1
  return 0
}
