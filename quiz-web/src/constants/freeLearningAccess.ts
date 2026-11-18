// ESAT 各科前两个叶子知识点免费学习与练习，章节入口仅展示免费子节点。
export const FREE_LEARNING_SECTION_CODES = [
  '110101',
  '110102',
  '120101',
  '120102',
  '130101',
  '130102',
  '140101',
  '140102',
  '150101',
  '150102',
] as const

// 免费练习只接受精确知识点，不能通过父章节扩大选题范围。
export function isFreePracticeScope(examType: string, code: string): boolean {
  return examType === 'ESAT' && FREE_LEARNING_SECTION_CODES.some((item) => item === code)
}

// 学习章节入口会裁剪为免费叶子，其他知识点继续校验会员。
export function isFreeLearningScope(examType: string, code: string): boolean {
  return (
    isFreePracticeScope(examType, code) ||
    (examType === 'ESAT' &&
      FREE_LEARNING_SECTION_CODES.some((item) => item.slice(0, 4) + '00' === code))
  )
}
