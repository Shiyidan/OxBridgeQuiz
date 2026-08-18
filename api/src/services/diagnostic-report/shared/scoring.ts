// 诊断报告公共评分边界：V1/V2 统一复用全站评分引擎，不在版本目录复制换算标准。
export {
  quickEsatScore,
  quickTmuaPaperScore,
  resolveEsatModule,
} from '../../scoring.js'

export type { EsatModule, TmuaPaper } from '../../scoring.js'
