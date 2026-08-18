// TMUA 完整诊断报告行为测试：验证两卷分组、综合评分、高级分析模块和模型不可用时的完整降级。
import assert from 'node:assert/strict'
import { buildDiagnosticReportSummary, type ReportQuestionInput } from '../src/services/diagnosticReport.js'

const difficulties = ['low', 'medium', 'high'] as const

// 固定样本覆盖两卷、多个主题和三档难度，使能力矩阵与优先级具有可验证数据。
function buildQuestions(): ReportQuestionInput[] {
  return Array.from({ length: 40 }, (_, index) => {
    const isPaper2 = index >= 20
    const localIndex = index % 20
    const topicIndex = Math.floor(localIndex / 10)
    const topicCode = isPaper2 ? `TMUA-P2-T${topicIndex + 1}` : `TMUA-P1-T${topicIndex + 1}`
    const correct = isPaper2 ? localIndex % 4 === 0 : localIndex % 3 !== 0
    return {
      number: index + 1,
      moduleCode: isPaper2 ? 'paper2' : 'paper1',
      moduleOrder: isPaper2 ? 2 : 1,
      moduleQuestionNumber: localIndex + 1,
      subject: isPaper2 ? 'Mathematical Reasoning' : 'Applications of Mathematical Knowledge',
      subjectCode: isPaper2 ? 'TMUA-P2' : 'TMUA-P1',
      topic: `主题 ${topicIndex + 1}`,
      topicCode,
      knowledgePoints: [{ code: `${topicCode}-K1`, label: `知识点 ${topicIndex + 1}` }],
      difficulty: difficulties[localIndex % difficulties.length],
      isCorrect: correct,
      isAnswered: true,
      answerState: 'answered',
      durationSeconds: 150 + (localIndex % 5) * 30,
      learningAnalysis: correct
        ? undefined
        : {
            examFocus: '先识别条件与结论之间的约束关系',
            reviewGuidance: ['重做时写出每一步所使用的条件'],
            commonErrorCauses: ['可能忽略隐含条件'],
          },
    }
  })
}

async function main(): Promise<void> {
  // 行为测试主动阻断真实模型请求，专门验证完整规则降级而不消耗外部额度。
  globalThis.fetch = async () => {
    throw new Error('DeepSeek disabled by TMUA diagnostic behavior test')
  }
  const stages: string[] = []
  const report = await buildDiagnosticReportSummary({
    examType: 'TMUA',
    paper: {
      title: '2024 Diagnostic Paper',
      code: 'TMUA-2024-DIAG',
      year: 2024,
      duration: 150,
    },
    questions: buildQuestions(),
    elapsedDurationSeconds: 8_000,
    syllabusNodes: Array.from({ length: 4 }, (_, index) => ({
      code: `TMUA-${index < 2 ? 'P1' : 'P2'}-T${(index % 2) + 1}`,
      label: `考纲主题 ${(index % 2) + 1}`,
    })),
    learnerProfile: {
      subjects: ['数学'],
      targetUniversities: [],
      targetMajor: 'Mathematics',
      targetScore: 7,
      examDate: null,
      weeklyHours: 5,
    },
    onStage: (stage) => {
      stages.push(stage)
    },
  })

  assert.equal(report.reportKind, 'tmua')
  assert.equal(report.header.examType, 'TMUA')
  assert.deepEqual(report.assessment.modules.map((module) => module.id), ['paper1', 'paper2'])
  assert.ok(report.assessment.score !== null)
  assert.equal(report.assessment.basedOnQuestions, 40)
  assert.equal(report.assessment.positioning?.percentileValue, null)
  assert.equal(report.assessment.positioning?.percentileLabel, '官方未公布精确排名')
  assert.equal(report.assessment.referenceVersion, 'tmua-uat-uk-2025-26-anchor-v1')
  assert.ok(report.assessment.modules.every((module) => module.diagnosticAnalysis))
  assert.ok(report.assessment.modules.every((module) => module.positioning?.percentileValue === null))
  assert.deepEqual(report.overview?.timing.modules.map((module) => module.id), ['paper1', 'paper2'])
  assert.deepEqual(report.knowledgeMastery?.modules.map((module) => module.id), ['paper1', 'paper2'])
  assert.ok(report.aiImprovementPlan)
  assert.ok(report.aiImprovementPlan.matrix.some((row) => row.moduleId === 'paper1'))
  assert.ok(report.aiImprovementPlan.matrix.some((row) => row.moduleId === 'paper2'))
  assert.ok(report.aiImprovementPlan.highRoiGaps.length > 0)
  assert.ok(report.nextAction)
  assert.equal(report.learningPath?.summary.planningScope, 'full')
  assert.equal(report.learningPath?.phases.length, 3)
  assert.deepEqual(stages, ['module_analyzing', 'roi_analyzing', 'path_analyzing'])

  console.log(JSON.stringify({
    reportKind: report.reportKind,
    score: report.assessment.score,
    modules: report.assessment.modules.map((module) => ({
      id: module.id,
      score: module.score,
      correct: module.correct,
      total: module.total,
      analysisSource: module.diagnosticAnalysis?.source,
    })),
    overviewModules: report.overview?.timing.modules.length,
    knowledgeModules: report.knowledgeMastery?.modules.length,
    matrixRows: report.aiImprovementPlan.matrix.length,
    highRoiGaps: report.aiImprovementPlan.highRoiGaps.length,
    planningPhases: report.learningPath?.phases.length,
    stages,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
