// 首页各科的单节学习预览：复用学习平台讲义，目录仅用于展示章节位置。
import type { KnowledgeSection } from '@/content/knowledge/types'
import type { ActiveExamType } from '@/stores/auth'
import { esatGeometry } from '@/content/knowledge/esatGeometry'
import { esatMath2Integration } from '@/content/knowledge/esatMath2Integration'
import { esatInheritance } from '@/content/knowledge/esatInheritance'
import { esatReactionRates } from '@/content/knowledge/esatReactionRates'
import { esatElectricity } from '@/content/knowledge/esatElectricity'
import { tmuaFunctions } from '@/content/knowledge/tmuaFunctions'

export interface HomeSyllabusChapter {
  label: string
  code: string
  children?: Array<{ label: string; code: string }>
}

export interface HomeLearningSubject {
  id: string
  label: string
  exam: ActiveExamType
  lesson: { sections: Array<Pick<KnowledgeSection, 'code' | 'title'>> }
  previewSectionCode?: string
  chapters: HomeSyllabusChapter[]
}

// 从已启用考纲摘取二级章节；仅演示章节保留少量三级节点，不加载完整考纲。
export const homeLearningSubjects: HomeLearningSubject[] = [
  {
    id: 'mathematics1',
    label: '数学 1',
    exam: 'ESAT',
    lesson: esatGeometry,
    previewSectionCode: '110519',
    chapters: [
      {
        label: '几何',
        code: '110500',
        children: [
          { label: '勾股定理', code: '110507' },
          { label: '圆定理', code: '110509' },
          { label: '坐标几何问题', code: '110510' },
          { label: '全等、相似与比例关系', code: '110517' },
          { label: '直角三角形三角比', code: '110518' },
          { label: '向量与几何论证', code: '110519' },
        ],
      },
      { label: '统计', code: '110600' },
      { label: '概率', code: '110700' },
    ],
  },
  {
    id: 'mathematics2',
    label: '数学 2',
    exam: 'ESAT',
    lesson: esatMath2Integration,
    previewSectionCode: '120701',
    chapters: [
      { label: '微分', code: '120600' },
      {
        label: '积分',
        code: '120700',
        children: esatMath2Integration.sections.map((section) => ({
          label: section.title,
          code: section.code,
        })),
      },
      { label: '坐标几何', code: '120300' },
    ],
  },
  {
    id: 'biology',
    label: '生物',
    exam: 'ESAT',
    lesson: esatInheritance,
    previewSectionCode: '150403',
    chapters: [
      { label: '细胞', code: '150100' },
      { label: '跨膜运输', code: '150200' },
      { label: '细胞分裂与性别决定', code: '150300' },
      {
        label: '遗传',
        code: '150400',
        children: esatInheritance.sections.map((section) => ({
          label: section.title,
          code: section.code,
        })),
      },
    ],
  },
  {
    id: 'chemistry',
    label: '化学',
    exam: 'ESAT',
    lesson: esatReactionRates,
    previewSectionCode: '141005',
    chapters: [
      { label: '反应、式与方程', code: '140300' },
      {
        label: '反应速率',
        code: '141000',
        children: esatReactionRates.sections.map((section) => ({
          label: section.title,
          code: section.code,
        })),
      },
      { label: '定量化学', code: '140400' },
    ],
  },
  {
    id: 'physics',
    label: '物理',
    exam: 'ESAT',
    lesson: esatElectricity,
    previewSectionCode: '130102',
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
      { label: '波', code: '130600' },
    ],
  },
  {
    id: 'tmua-math1',
    label: '数学 1',
    exam: 'TMUA',
    lesson: {
      sections: esatGeometry.sections.map((section) => ({
        code: `2150${section.code.slice(-2)}`,
        title: section.title,
      })),
    },
    previewSectionCode: '215019',
    chapters: [
      {
        label: '几何',
        code: '215000',
        children: [
          { label: '勾股定理', code: '215007' },
          { label: '圆定理', code: '215009' },
          { label: '坐标几何问题', code: '215010' },
          { label: '全等、相似与比例关系', code: '215017' },
          { label: '直角三角形三角比', code: '215018' },
          { label: '向量与几何论证', code: '215019' },
        ],
      },
      { label: '统计', code: '216000' },
      { label: '概率', code: '217000' },
    ],
  },
  {
    id: 'tmua-math2',
    label: '数学 2',
    exam: 'TMUA',
    lesson: tmuaFunctions,
    previewSectionCode: '221007',
    chapters: [
      {
        label: '代数与函数',
        code: '221000',
        children: [
          { label: '根式', code: '221002' },
          { label: '二次函数与方程', code: '221003' },
          { label: '代入法解联立方程', code: '221004' },
          { label: '一次与二次不等式', code: '221005' },
          { label: '多项式操作与定理', code: '221006' },
          { label: '函数与常见函数性质', code: '221007' },
        ],
      },
      { label: '数列与级数', code: '222000' },
      { label: '坐标几何', code: '223000' },
      { label: '三角', code: '224000' },
    ],
  },
  {
    id: 'tmua-logic',
    label: '逻辑证明',
    exam: 'TMUA',
    lesson: { sections: [{ code: '231002', title: '必要条件与充分条件' }] },
    previewSectionCode: '231002',
    chapters: [
      {
        label: '论证逻辑',
        code: '231000',
        children: [
          { label: '数学逻辑基础', code: '231001' },
          { label: '必要条件与充分条件', code: '231002' },
          { label: '量词', code: '231003' },
          { label: '命题否定', code: '231004' },
        ],
      },
      { label: '数学证明', code: '232000' },
      { label: '证明错误识别', code: '233000' },
    ],
  },
]
