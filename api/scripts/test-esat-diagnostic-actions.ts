// ESAT 报告行动回归测试：锁定实际科目覆盖、低样本校准与题库学习分析的安全复用。
import assert from 'node:assert/strict'
import type {
  AssessmentModule,
  ReportAiImprovementPlan,
  ReportQuestionInput,
} from '../src/services/diagnosticReport.js'
import {
  allocateStarterMinutes,
  buildEsatNextAction,
  buildFallbackModulePositioningInsight,
  buildFallbackStarterPlan,
  mergeModuleDiagnosticAnalysis,
  resolveEsatPlanningSubjects,
  validateModulePositioningInsight,
} from '../src/services/esatDiagnosticReport.js'

const matrix: ReportAiImprovementPlan['matrix'] = [{
  code: 'BIO.1',
  label: 'Cell structure',
  moduleId: 'biology',
  moduleLabel: 'Biology',
  cells: [
    { difficulty: 'low', label: '低难度', correct: 0, total: 0, accuracy: null, status: 'insufficient' },
    { difficulty: 'medium', label: '中难度', correct: 1, total: 4, accuracy: 0.25, status: 'weak' },
    { difficulty: 'high', label: '高难度', correct: 0, total: 0, accuracy: null, status: 'insufficient' },
  ],
}]

const questions: ReportQuestionInput[] = [{
  number: 4,
  subject: 'Biology',
  subjectCode: null,
  moduleCode: 'biology',
  topic: 'Cell structure',
  topicCode: 'BIO.1',
  difficulty: 'medium',
  isCorrect: false,
  learningAnalysis: {
    examFocus: 'Distinguish organelle functions.',
    reviewGuidance: ['先按结构—功能关系整理细胞器。'],
    commonErrorCauses: ['混淆线粒体与核糖体的功能。'],
  },
}]

// 高样本缺口必须生成可执行专项，并携带与本次错题匹配的受控学习提示。
const targetedPlan: ReportAiImprovementPlan = {
  matrix,
  highRoiGaps: [{
    rank: 1,
    topicCode: 'BIO.1',
    topicLabel: 'Cell structure',
    moduleId: 'biology',
    moduleLabel: 'Biology',
    difficulty: 'medium',
    difficultyLabel: '中难度',
    correct: 1,
    total: 4,
    accuracy: 0.25,
    priorityReason: '样本充分且正确率偏低。',
    suggestedHours: '2 小时',
    prerequisiteCheck: '核对基础术语。',
    examFocus: ['Distinguish organelle functions.'],
    questionNumbers: [4],
    reviewGuidance: ['先按结构—功能关系整理细胞器。'],
    possibleErrorPatterns: ['混淆线粒体与核糖体的功能。'],
    analysisSource: 'fallback',
  }],
  analysisStatus: 'fallback',
}
const targetedAction = buildEsatNextAction(targetedPlan, questions)
assert.equal(targetedAction?.actionType, 'targeted_practice')
assert.deepEqual(targetedAction?.evidence.questionNumbers, [4])
assert.deepEqual(targetedAction?.reviewGuidance, ['先按结构—功能关系整理细胞器。'])
assert.deepEqual(targetedAction?.possibleErrorPatterns, ['混淆线粒体与核糖体的功能。'])

// 少于三题的观察格不能被判成薄弱项，只能生成待校准任务。
const calibrationPlan: ReportAiImprovementPlan = {
  matrix: [{
    ...matrix[0],
    cells: matrix[0].cells.map((cell) => cell.difficulty === 'medium'
      ? { ...cell, correct: 0, total: 2, accuracy: 0, status: 'insufficient' as const }
      : cell),
  }],
  highRoiGaps: [],
  analysisStatus: 'not-needed',
}
const calibrationAction = buildEsatNextAction(calibrationPlan, questions)
assert.equal(calibrationAction?.actionType, 'calibration_test')
assert.equal(calibrationAction?.evidence.confidence, 'low')

// 个人资料即使只声明数学，本次实际作答的生物与化学仍须完整进入规划。
const planningSubjects = resolveEsatPlanningSubjects([
  { moduleId: 'biology', moduleLabel: 'Biology' },
  { moduleId: 'chemistry', moduleLabel: 'Chemistry' },
], ['Mathematics 1'])
assert.deepEqual(planningSubjects.subjects, ['Biology', 'Chemistry'])
assert.equal(planningSubjects.subjectMismatch, true)

// 七日分钟数必须精确等于周预算，不能重新出现多个投入区间叠加超配。
const starterMinutes = allocateStarterMinutes(300)
assert.equal(starterMinutes.length, 7)
assert.equal(starterMinutes.reduce((sum, value) => sum + value, 0), 300)

// 规则兜底也必须生成七种不同职能，模型不可用时不能退回知识点替换式模板。
const fallbackStarter = buildFallbackStarterPlan({
  plan: targetedPlan,
  nextAction: targetedAction,
  weeklyHours: 5,
  budgetSource: 'default',
  timing: {
    totalDurationSeconds: null,
    plannedDurationSeconds: null,
    detailedTimingReliable: false,
    analysisLevel: 'unavailable',
    pacingStatus: 'unavailable',
    attemptedQuestionCount: 0,
    timedQuestionCount: 0,
    timingCoverage: 0,
    efficiencySampleCount: 0,
    targetDurationSeconds: null,
    averageDurationSeconds: null,
    overtimeQuestionCount: null,
    quadrants: [],
    modules: [],
  },
}).starterPlan
assert.equal(fallbackStarter.days.length, 7)
assert.equal(new Set(fallbackStarter.days.map((day) => day.role)).size, 7)
assert.equal(new Set(fallbackStarter.days.map((day) => day.title)).size, 7)
assert.equal(fallbackStarter.totalPlannedMinutes, 300)
assert.ok(fallbackStarter.days.every((day) => day.steps.length >= 2))
assert.ok(fallbackStarter.days.every((day) => !/专项投入|完成本格复盘/.test(JSON.stringify(day))))

// 三个优先项必须分别进入第 1、4、5 天，不能退化成只换标题的三条相同周任务。
const firstGap = targetedPlan.highRoiGaps[0]
const multiGapStarter = buildFallbackStarterPlan({
  plan: {
    ...targetedPlan,
    highRoiGaps: [
      { ...firstGap, topicCode: 'GEO', topicLabel: 'Geometry' },
      { ...firstGap, rank: 2, topicCode: 'ALG', topicLabel: 'Algebra' },
      { ...firstGap, rank: 3, topicCode: 'NUM', topicLabel: 'Number' },
    ],
  },
  nextAction: targetedAction,
  weeklyHours: 5,
  budgetSource: 'default',
  timing: {
    totalDurationSeconds: null,
    plannedDurationSeconds: null,
    detailedTimingReliable: false,
    analysisLevel: 'unavailable',
    pacingStatus: 'unavailable',
    attemptedQuestionCount: 0,
    timedQuestionCount: 0,
    timingCoverage: 0,
    efficiencySampleCount: 0,
    targetDurationSeconds: null,
    averageDurationSeconds: null,
    overtimeQuestionCount: null,
    quadrants: [],
    modules: [],
  },
}).starterPlan
assert.equal(multiGapStarter.days[0].focus[0]?.topicLabel, 'Geometry')
assert.equal(multiGapStarter.days[3].focus[0]?.topicLabel, 'Algebra')
assert.equal(multiGapStarter.days[4].focus[0]?.topicLabel, 'Number')
assert.notEqual(multiGapStarter.days[3].deliverable, multiGapStarter.days[4].deliverable)

const moduleFixture: AssessmentModule = {
  id: 'maths1',
  label: '数学 1',
  correct: 2,
  total: 19,
  score: 1.7,
  scoreRange: [1.3, 2.5],
  scaleLabel: '/ 9.0',
  summary: 'ESAT 模块独立评分。',
  positioning: {
    percentileValue: 1,
    percentileLabel: '约第 1 百分位',
    performanceLevel: 'Below Average',
    competitiveness: '旧版固定结论',
    analysisSource: 'fallback',
    cohortReference: '测试参考',
    limitedData: false,
  },
  difficultyMastery: [
    { level: 'low', label: '低难度', correct: 0, total: 0, accuracy: null },
    { level: 'medium', label: '中难度', correct: 1, total: 16, accuracy: 0.1 },
    { level: 'high', label: '高难度', correct: 1, total: 3, accuracy: 0.3 },
  ],
  scoringBasis: 'normalized',
  equivalentRawScore: 2.8,
}

// 整体评价必须拒绝固定套话，并接受同时包含定位与真实证据的模型结果。
assert.equal(validateModulePositioningInsight(moduleFixture, '该模块仍有提升空间'), null)
const valuablePositioning = '数学1预估分1.7且本次仅答对2/19题；中难度1/16是限制整体分数的核心，应优先提高中难度基础得分率。'
assert.equal(validateModulePositioningInsight(moduleFixture, valuablePositioning), valuablePositioning)
assert.equal(
  validateModulePositioningInsight(
    moduleFixture,
    '数学1预估分1.7且答对2/19题，核心瓶颈在高难度题，但应优先提升中难度题得分率。',
  ),
  null,
)
assert.equal(
  validateModulePositioningInsight(
    moduleFixture,
    '数学1预估分1.7且答对2/19题，当前整体表现极弱，应优先提升中难度题得分率。',
  ),
  null,
)

// 模型不可用时的整体评价也必须包含分数、正确率、主体难度层与小样本边界。
const fallbackPositioning = buildFallbackModulePositioningInsight(moduleFixture)
assert.match(fallbackPositioning, /预估分1\.7/)
assert.match(fallbackPositioning, /2\/19/)
assert.match(fallbackPositioning, /中难度仅答对1\/16/)
assert.match(fallbackPositioning, /高难度1\/3因样本较少/)
assert.doesNotMatch(fallbackPositioning, /^该模块仍有较大提升空间$/)

// 单个 AI 字段无效时只补齐该字段，其他有效字段必须保留并标记为 mixed。
const mixedDiagnostic = mergeModuleDiagnosticAnalysis(moduleFixture, {
  summary: 'AI 总结：数学1预估分1.7，本次答对2/19题。',
  keyIssue: 'AI 关键问题：中难度仅答对1/16题。',
})
assert.equal(mixedDiagnostic.diagnosticAnalysis.source, 'mixed')
assert.match(mixedDiagnostic.diagnosticAnalysis.summary, /^AI 总结/)
assert.match(mixedDiagnostic.diagnosticAnalysis.keyIssue, /^AI 关键问题/)
assert.ok(mixedDiagnostic.diagnosticAnalysis.strength)
assert.ok(mixedDiagnostic.diagnosticAnalysis.focusSuggestion)
assert.ok(mixedDiagnostic.riskSignal)

// 模型整次不可用时全部使用动态规则结果，页面仍不能留空。
const fallbackDiagnostic = mergeModuleDiagnosticAnalysis(moduleFixture, undefined)
assert.equal(fallbackDiagnostic.diagnosticAnalysis.source, 'fallback')
assert.ok(fallbackDiagnostic.riskSignal)
assert.ok(fallbackDiagnostic.diagnosticAnalysis.summary)

console.info('ESAT diagnostic action tests passed')
