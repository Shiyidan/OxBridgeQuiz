// 免费讲义目录仅装载单位与数的导学内容，返回的章节严格裁剪为四个开放知识点。
import { esatUnits } from './esatUnits'
import { esatNumber } from './esatNumber'
import type { KnowledgeLesson } from './types'
import { FREE_LEARNING_SECTION_CODES, isFreeLearningScope } from '../../constants/freeLearningAccess'

// 章级导航仅包含免费叶子，避免通过下一节或本节目录绕过后续知识点的会员校验。
export function findKnowledgeLesson(examType: string, code: string): KnowledgeLesson | null {
  if (!isFreeLearningScope(examType, code)) return null
  const lesson = code.startsWith('1101') ? esatUnits : esatNumber
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
