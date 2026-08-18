// 诊断短板画像行为测试：覆盖 ESAT 动态题量、TMUA 标准等题量与三种诊断模式。
import assert from 'node:assert/strict'
import {
  buildWeaknessProfileForQuestions,
} from '../src/services/diagnostic-report/v2/reportBuilder.js'
import type { ReportQuestionInput } from '../src/services/diagnosticReport.js'

type QuestionOverride = Partial<ReportQuestionInput>

// 构造指定模块的稳定题目快照，测试只改变正确数和必要的知识点分布。
function moduleQuestions(
  moduleId: string,
  total: number,
  correct: number,
  startNumber: number,
  overrides: Record<number, QuestionOverride> = {},
): ReportQuestionInput[] {
  return Array.from({ length: total }, (_, index) => ({
    number: startNumber + index,
    subject: moduleId,
    subjectCode: moduleId,
    moduleCode: moduleId,
    topic: `${moduleId} 默认知识点 ${Math.floor(index / 2) + 1}`,
    topicCode: `${moduleId}-T${Math.floor(index / 2) + 1}`,
    knowledgePoints: [],
    difficulty: 'medium',
    isCorrect: index < correct,
    isAnswered: true,
    answerState: 'answered',
    ...overrides[index],
  }))
}

// 画像计算不依赖考纲标签，空考纲即可验证确定性等级、置信度与排序。
function profile(examType: 'ESAT' | 'TMUA', questions: ReportQuestionInput[]) {
  return buildWeaknessProfileForQuestions(questions, [], examType)
}

// 当前 ESAT 测试答卷应形成化学模块与化学中难度明确短板，小样本知识点只校准。
function verifyEsatCurrentRecord(): void {
  const maths = moduleQuestions('maths1', 18, 16, 1)
  const chemistryOverrides: Record<number, QuestionOverride> = {
    0: { topic: 'Atomic structure', topicCode: '140100', isCorrect: false },
    1: { topic: 'Atomic structure', topicCode: '140100', isCorrect: false },
  }
  const chemistry = moduleQuestions('chemistry', 18, 9, 19, chemistryOverrides)
  chemistry.forEach((question, index) => {
    question.difficulty = index < 10 ? 'medium' : 'low'
    question.isCorrect = (index >= 2 && index < 5) || (index >= 10 && index < 16)
  })
  const biology = moduleQuestions('biology', 18, 13, 37)
  const result = profile('ESAT', [...maths, ...chemistry, ...biology])
  assert.equal(result.primaryModule?.moduleId, 'chemistry')
  assert.equal(result.primaryModule?.level, 'clear')
  assert.equal(result.difficultySignals[0]?.moduleId, 'chemistry')
  assert.equal(result.difficultySignals[0]?.difficulty, 'medium')
  assert.equal(result.calibrationSignals.find((signal) => signal.topicCode === '140100')?.confidence, 'low')
}

// ESAT 均高、相对短板、集中知识点、单题和不均衡题量分别验证防误判与召回边界。
function verifyEsatBoundaryCases(): void {
  const allHigh = profile('ESAT', [
    ...moduleQuestions('maths1', 18, 17, 1),
    ...moduleQuestions('chemistry', 18, 16, 19),
    ...moduleQuestions('biology', 18, 16, 37),
  ])
  assert.equal(allHigh.moduleSignals.length, 0)

  const relative = profile('ESAT', [
    ...moduleQuestions('maths1', 18, 12, 1),
    ...moduleQuestions('chemistry', 18, 16, 19),
    ...moduleQuestions('biology', 18, 17, 37),
  ])
  assert.equal(relative.primaryModule?.moduleId, 'maths1')
  assert.equal(relative.primaryModule?.level, 'relative')

  const concentrated = moduleQuestions('chemistry', 10, 7, 1, {
    0: { topic: '集中知识点', topicCode: 'C-FOCUS', isCorrect: true },
    1: { topic: '集中知识点', topicCode: 'C-FOCUS', isCorrect: false },
    2: { topic: '集中知识点', topicCode: 'C-FOCUS', isCorrect: false },
    3: { topic: '集中知识点', topicCode: 'C-FOCUS', isCorrect: false },
  })
  assert.equal(profile('ESAT', concentrated).topicSignals.find(
    (signal) => signal.topicCode === 'C-FOCUS',
  )?.confidence, 'medium')

  const singleWrong = moduleQuestions('chemistry', 10, 9, 1, {
    9: { topic: '单题知识点', topicCode: 'C-ONE', isCorrect: false },
  })
  const singleProfile = profile('ESAT', singleWrong)
  assert.equal(singleProfile.topicSignals.some((signal) => signal.topicCode === 'C-ONE'), false)
  assert.equal(singleProfile.calibrationSignals.find((signal) => signal.topicCode === 'C-ONE')?.confidence, 'low')

  const uneven = profile('ESAT', [
    ...moduleQuestions('maths1', 18, 16, 1),
    ...moduleQuestions('chemistry', 10, 5, 19),
    ...moduleQuestions('biology', 10, 8, 29),
  ])
  assert.equal(uneven.primaryModule?.moduleId, 'chemistry')
  assert.equal(uneven.primaryModule?.level, 'clear')
  assert.notEqual(uneven.primaryModule?.confidence, 'low')
}

// TMUA 完整两卷使用标准等题量策略，并覆盖均高、单卷低、双卷低和知识点边界。
function verifyTmuaCases(): void {
  const allHigh = profile('TMUA', [
    ...moduleQuestions('paper1', 20, 18, 1),
    ...moduleQuestions('paper2', 20, 17, 21),
  ])
  assert.equal(allHigh.examPolicy, 'TMUA_STANDARD_EQUAL')
  assert.equal(allHigh.moduleSignals.length, 0)
  assert.equal(allHigh.diagnosisMode, 'balanced_improvement')

  const oneWeak = profile('TMUA', [
    ...moduleQuestions('paper1', 20, 18, 1),
    ...moduleQuestions('paper2', 20, 12, 21),
  ])
  assert.equal(oneWeak.primaryModule?.moduleId, 'paper2')
  assert.equal(oneWeak.primaryModule?.level, 'clear')
  assert.equal(oneWeak.primaryModule?.confidence, 'high')
  assert.equal(oneWeak.diagnosisMode, 'weakness_attack')

  const bothWeak = profile('TMUA', [
    ...moduleQuestions('paper1', 20, 10, 1),
    ...moduleQuestions('paper2', 20, 11, 21),
  ])
  assert.deepEqual(bothWeak.moduleSignals.map((signal) => signal.moduleId), ['paper1', 'paper2'])
  assert.ok(bothWeak.moduleSignals.every((signal) => signal.level === 'clear' && signal.confidence === 'high'))
  assert.equal(bothWeak.diagnosisMode, 'weakness_attack')

  const paper2 = moduleQuestions('paper2', 20, 15, 21)
  paper2.forEach((question, index) => {
    if (index < 4) {
      question.topic = '集中推理知识点'
      question.topicCode = 'P2-FOCUS'
      question.isCorrect = index === 0
    } else {
      question.isCorrect = index < 18
    }
  })
  const concentrated = profile('TMUA', [
    ...moduleQuestions('paper1', 20, 15, 1),
    ...paper2,
  ])
  assert.equal(concentrated.moduleSignals.length, 0)
  assert.equal(concentrated.topicSignals.find(
    (signal) => signal.topicCode === 'P2-FOCUS',
  )?.confidence, 'medium')
  assert.equal(concentrated.diagnosisMode, 'weakness_attack')

  const paper1Single = moduleQuestions('paper1', 20, 19, 1, {
    19: { topic: '单题知识点', topicCode: 'P1-ONE', isCorrect: false },
  })
  const single = profile('TMUA', [
    ...paper1Single,
    ...moduleQuestions('paper2', 20, 19, 21),
  ])
  assert.equal(single.topicSignals.some((signal) => signal.topicCode === 'P1-ONE'), false)
  assert.equal(single.calibrationSignals.find((signal) => signal.topicCode === 'P1-ONE')?.confidence, 'low')
  assert.equal(single.examPolicy, 'TMUA_STANDARD_EQUAL')
  assert.equal(single.diagnosisMode, 'balanced_improvement')

  const lateDropSeventy = profile('TMUA', [
    ...moduleQuestions('paper1', 20, 14, 1),
    ...moduleQuestions('paper2', 20, 14, 21),
  ])
  assert.equal(lateDropSeventy.moduleSignals.length, 0)
  assert.equal(lateDropSeventy.sequenceSignals.length, 2)
  assert.ok(lateDropSeventy.sequenceSignals.every((signal) => (
    signal.earlyCorrect === 14
    && signal.earlyTotal === 14
    && signal.lateCorrect === 0
    && signal.lateTotal === 6
    && signal.confidence === 'high'
  )))
  assert.equal(lateDropSeventy.diagnosisMode, 'weakness_attack')

  const distributedPaper1 = moduleQuestions('paper1', 20, 20, 1)
  const distributedPaper2 = moduleQuestions('paper2', 20, 20, 21)
  const distributedWrongIndexes = new Set([2, 5, 8, 11, 14, 17])
  distributedPaper1.forEach((question, index) => { question.isCorrect = !distributedWrongIndexes.has(index) })
  distributedPaper2.forEach((question, index) => { question.isCorrect = !distributedWrongIndexes.has(index) })
  const distributedSeventy = profile('TMUA', [...distributedPaper1, ...distributedPaper2])
  assert.equal(distributedSeventy.moduleSignals.length, 0)
  assert.equal(distributedSeventy.sequenceSignals.length, 0)
  assert.equal(distributedSeventy.diagnosisMode, 'balanced_improvement')

  const perfect = profile('TMUA', [
    ...moduleQuestions('paper1', 20, 20, 1),
    ...moduleQuestions('paper2', 20, 20, 21),
  ])
  assert.equal(perfect.diagnosisMode, 'stable_progress')
}

verifyEsatCurrentRecord()
verifyEsatBoundaryCases()
verifyTmuaCases()
console.log('Diagnostic weakness profile checks passed (15 scenarios).')
