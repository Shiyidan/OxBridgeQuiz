// 首页各科的单节学习预览：复用学习平台讲义，目录仅用于展示章节位置。
import type { KnowledgeLesson } from '@/content/knowledge/types'
import type { ActiveExamType } from '@/stores/auth'
import { esatUnits } from '@/content/knowledge/esatUnits'
import { esatMath2Coordinate } from '@/content/knowledge/esatMath2Coordinate'
import { esatCells } from '@/content/knowledge/esatCells'
import { esatAtomicStructure } from '@/content/knowledge/esatAtomicStructure'
import { esatElectricity } from '@/content/knowledge/esatElectricity'
import { tmuaQuadratic } from '@/content/knowledge/tmuaQuadratic'

export interface HomeSyllabusChapter {
  label: string
  code: string
  children?: Array<{ label: string; code: string }>
}

export interface HomeLearningSubject {
  id: string
  label: string
  exam: ActiveExamType
  lesson: KnowledgeLesson
  chapters: HomeSyllabusChapter[]
}

// 从已启用考纲摘取二级章节；仅演示章节保留少量三级节点，不加载完整考纲。
export const homeLearningSubjects: HomeLearningSubject[] = [
  {
    id: 'mathematics1',
    label: '数学 1',
    exam: 'ESAT',
    lesson: esatUnits,
    chapters: [
      {
        label: '单位',
        code: '110100',
        children: [
          { label: '标准单位与复合单位', code: '110101' },
          { label: '单位换算', code: '110102' },
        ],
      },
      { label: '数', code: '110200' },
      { label: '比与比例', code: '110300' },
      { label: '代数', code: '110400' },
    ],
  },
  {
    id: 'mathematics2',
    label: '数学 2',
    exam: 'ESAT',
    lesson: esatMath2Coordinate,
    chapters: [
      { label: '代数与函数', code: '120100' },
      { label: '数列与级数', code: '120200' },
      {
        label: '坐标几何',
        code: '120300',
        children: [
          { label: '直线', code: '120301' },
          { label: '圆的坐标几何', code: '120302' },
          { label: '圆性质', code: '120303' },
        ],
      },
      { label: '三角', code: '120400' },
    ],
  },
  {
    id: 'biology',
    label: '生物',
    exam: 'ESAT',
    lesson: esatCells,
    chapters: [
      {
        label: '细胞',
        code: '150100',
        children: [
          { label: '真核细胞结构与功能', code: '150101' },
          { label: '原核细胞结构与功能', code: '150102' },
          { label: '生物体层级', code: '150103' },
        ],
      },
      { label: '跨膜运输', code: '150200' },
      { label: '细胞分裂与性别决定', code: '150300' },
      { label: '遗传', code: '150400' },
    ],
  },
  {
    id: 'chemistry',
    label: '化学',
    exam: 'ESAT',
    lesson: esatAtomicStructure,
    chapters: [
      {
        label: '原子结构',
        code: '140100',
        children: [
          { label: '原子模型', code: '140101' },
          { label: '相对质量与电荷', code: '140102' },
          { label: '原子序数、质量数与记号', code: '140103' },
        ],
      },
      { label: '周期表', code: '140200' },
      { label: '反应、式与方程', code: '140300' },
      { label: '定量化学', code: '140400' },
    ],
  },
  {
    id: 'physics',
    label: '物理',
    exam: 'ESAT',
    lesson: esatElectricity,
    chapters: [
      {
        label: '电学',
        code: '130100',
        children: [
          { label: '静电', code: '130101' },
          { label: '电路', code: '130102' },
        ],
      },
      { label: '磁学', code: '130200' },
      { label: '力学', code: '130300' },
      { label: '热学', code: '130400' },
    ],
  },
  {
    id: 'tmua',
    label: 'TMUA',
    exam: 'TMUA',
    lesson: tmuaQuadratic,
    chapters: [
      {
        label: '代数与函数',
        code: '221000',
        children: [
          { label: '有理指数指数律', code: '221001' },
          { label: '根式', code: '221002' },
          { label: '二次函数与方程', code: '221003' },
        ],
      },
      { label: '数列与级数', code: '222000' },
      { label: '坐标几何', code: '223000' },
      { label: '三角', code: '224000' },
    ],
  },
]
