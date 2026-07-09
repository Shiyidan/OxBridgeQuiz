import { randomInt } from 'node:crypto'

export function createNumericId(): string {
  return `${Date.now()}${randomInt(100000, 1000000)}`
}

export function createQuestionUniqueCode(paperId: string, questionNumber: number): string {
  return `${paperId}${String(questionNumber).padStart(4, '0')}`
}
