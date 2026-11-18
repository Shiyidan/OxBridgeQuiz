// 免费讲义只展示各科前两个知识点，章节入口与下一节均限定在开放范围内。
import { esatUnits } from './esatUnits'
import { esatMath2Algebra } from './esatMath2Algebra'
import { esatElectricity } from './esatElectricity'
import { esatAtomicStructure } from './esatAtomicStructure'
import { esatCells } from './esatCells'
import type { KnowledgeLesson } from './types'
import {
  FREE_LEARNING_SECTION_CODES,
  isFreeLearningScope,
} from '../../constants/freeLearningAccess'

const freeLessons: KnowledgeLesson[] = [
  esatUnits,
  esatMath2Algebra,
  esatElectricity,
  esatAtomicStructure,
  esatCells,
]

// 在所属章节中精确匹配，再裁剪免费叶子，避免整章导航绕过会员校验。
export function findKnowledgeLesson(examType: string, code: string): KnowledgeLesson | null {
  if (!isFreeLearningScope(examType, code)) return null
  const lesson = freeLessons.find(
    (item) => item.code === code || item.sections.some((section) => section.code === code),
  )
  if (!lesson) return null
  const sections = lesson.sections.filter((section) =>
    FREE_LEARNING_SECTION_CODES.some((item) => item === section.code),
  )
  return {
    ...lesson,
    partial: true,
    intro: sections[0]?.summary || '',
    memory: sections.flatMap((section) => section.memory || []),
    sections,
  }
}
