// 学习图谱科目入口：沿用 ESAT 考纲编号，未提供关系数据的科目保留占位。
import type { KnowledgeGraphChapter } from './types'

export const knowledgeGraphSubjects: readonly KnowledgeGraphChapter[] = [
  { code: '110000', title: '数学1', titleEn: 'Mathematics 1' },
  { code: '150000', title: '生物', titleEn: 'Biology' },
  { code: '140000', title: '化学', titleEn: 'Chemistry' },
  { code: '130000', title: '物理', titleEn: 'Physics' },
  { code: '120000', title: '数学2', titleEn: 'Mathematics 2' },
]
