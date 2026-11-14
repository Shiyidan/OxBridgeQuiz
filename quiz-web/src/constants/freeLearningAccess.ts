// ESAT 数学1免费学习范围：仅四个叶子知识点及其章节入口，与后端免费资源白名单对应。
export const FREE_LEARNING_SECTION_CODES = ['110101', '110102', '110201', '110202'] as const

// 章节入口只展示免费子节点，不把整个“数”章节视作免费。
export function isFreeLearningScope(examType: string, code: string): boolean {
  return examType === 'ESAT' && (
    code === '110100' || code === '110200' ||
    FREE_LEARNING_SECTION_CODES.some((item) => item === code)
  )
}
