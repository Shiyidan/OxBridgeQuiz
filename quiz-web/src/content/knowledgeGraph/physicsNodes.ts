// 物理图谱轻量考纲：节点与中英文名称对应 ESAT 物理，不加载整套讲义。
import type { KnowledgeGraphChapter, KnowledgeGraphNode } from './types'

export const physicsGraphChapters: readonly KnowledgeGraphChapter[] = [
  {
    code: '130100',
    title: '电学',
    titleEn: 'Electricity',
  },
  {
    code: '130200',
    title: '磁学',
    titleEn: 'Magnetism',
  },
  {
    code: '130300',
    title: '力学',
    titleEn: 'Mechanics',
  },
  {
    code: '130400',
    title: '热学',
    titleEn: 'Thermal physics',
  },
  {
    code: '130500',
    title: '物质',
    titleEn: 'Matter',
  },
  {
    code: '130600',
    title: '波',
    titleEn: 'Waves',
  },
  {
    code: '130700',
    title: '放射性',
    titleEn: 'Radioactivity',
  },
]

export const physicsGraphNodes: readonly KnowledgeGraphNode[] = [
  {
    code: '130101',
    title: '静电',
    titleEn: 'Electrostatics',
    chapterCode: '130100',
  },
  {
    code: '130102',
    title: '电路',
    titleEn: 'Electric circuits',
    chapterCode: '130100',
  },
  {
    code: '130201',
    title: '磁体性质',
    titleEn: 'Properties of magnets',
    chapterCode: '130200',
  },
  {
    code: '130202',
    title: '电流产生的磁场',
    titleEn: 'Magnetic field due to current',
    chapterCode: '130200',
  },
  {
    code: '130203',
    title: '电动机效应',
    titleEn: 'Motor effect',
    chapterCode: '130200',
  },
  {
    code: '130204',
    title: '电磁感应',
    titleEn: 'Electromagnetic induction',
    chapterCode: '130200',
  },
  {
    code: '130205',
    title: '变压器',
    titleEn: 'Transformers',
    chapterCode: '130200',
  },
  {
    code: '130301',
    title: '运动学',
    titleEn: 'Kinematics',
    chapterCode: '130300',
  },
  {
    code: '130302',
    title: '力',
    titleEn: 'Forces',
    chapterCode: '130300',
  },
  {
    code: '130303',
    title: '力与伸长',
    titleEn: 'Force and extension',
    chapterCode: '130300',
  },
  {
    code: '130304',
    title: '牛顿定律',
    titleEn: "Newton's laws",
    chapterCode: '130300',
  },
  {
    code: '130305',
    title: '质量与重量',
    titleEn: 'Mass and weight',
    chapterCode: '130300',
  },
  {
    code: '130306',
    title: '动量',
    titleEn: 'Momentum',
    chapterCode: '130300',
  },
  {
    code: '130307',
    title: '能量',
    titleEn: 'Energy',
    chapterCode: '130300',
  },
  {
    code: '130401',
    title: '传导',
    titleEn: 'Conduction',
    chapterCode: '130400',
  },
  {
    code: '130402',
    title: '对流',
    titleEn: 'Convection',
    chapterCode: '130400',
  },
  {
    code: '130403',
    title: '热辐射',
    titleEn: 'Thermal radiation',
    chapterCode: '130400',
  },
  {
    code: '130404',
    title: '热容',
    titleEn: 'Heat capacity',
    chapterCode: '130400',
  },
  {
    code: '130501',
    title: '物态',
    titleEn: 'States of matter',
    chapterCode: '130500',
  },
  {
    code: '130502',
    title: '理想气体',
    titleEn: 'Ideal gases',
    chapterCode: '130500',
  },
  {
    code: '130503',
    title: '状态变化',
    titleEn: 'State changes',
    chapterCode: '130500',
  },
  {
    code: '130504',
    title: '密度',
    titleEn: 'Density',
    chapterCode: '130500',
  },
  {
    code: '130505',
    title: '压强',
    titleEn: 'Pressure',
    chapterCode: '130500',
  },
  {
    code: '130601',
    title: '波的性质',
    titleEn: 'Wave properties',
    chapterCode: '130600',
  },
  {
    code: '130602',
    title: '波的行为',
    titleEn: 'Wave behaviour',
    chapterCode: '130600',
  },
  {
    code: '130603',
    title: '光学',
    titleEn: 'Optics',
    chapterCode: '130600',
  },
  {
    code: '130604',
    title: '声波',
    titleEn: 'Sound waves',
    chapterCode: '130600',
  },
  {
    code: '130605',
    title: '电磁波谱',
    titleEn: 'Electromagnetic spectrum',
    chapterCode: '130600',
  },
  {
    code: '130701',
    title: '原子结构',
    titleEn: 'Atomic structure',
    chapterCode: '130700',
  },
  {
    code: '130702',
    title: '放射性衰变',
    titleEn: 'Radioactive decay',
    chapterCode: '130700',
  },
  {
    code: '130703',
    title: '电离辐射',
    titleEn: 'Ionising radiation',
    chapterCode: '130700',
  },
  {
    code: '130704',
    title: '半衰期',
    titleEn: 'Half-life',
    chapterCode: '130700',
  },
]
