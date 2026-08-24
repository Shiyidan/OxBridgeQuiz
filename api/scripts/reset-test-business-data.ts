// 清理测试库业务数据，仅保留可重新登录的用户身份信息，供受控测试环境重置使用。
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'

const CONFIRM_TOKEN = 'RESET_TEST_BUSINESS_DATA'

type DataCounts = Record<string, number>

/** 统计会被清理的业务数据，并单独保留用户身份数量供执行前核对。 */
async function collectDataCounts(): Promise<DataCounts> {
  const [
    users,
    authSessions,
    emailChallenges,
    legalAcceptances,
    operationLogs,
    memberships,
    diagnosticSessions,
    practiceNotebooks,
    examRecords,
    answerRecords,
    wrongQuestionSummaries,
    wrongQuestionAttempts,
    diagnosticReportTasks,
    diagnosticReports,
    papers,
    questions,
    questionImportBatches,
    questionKnowledgePoints,
    parseTasks,
    syllabusNodes,
    syllabuses,
    revenueCosts,
    paymentOrders,
    paymentRefunds,
    paymentNotifications,
    paymentReconciliationRuns,
    paymentReconciliationItems,
    backgroundJobLeases,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.authSession.count(),
    prisma.emailVerificationChallenge.count(),
    prisma.userLegalAcceptance.count(),
    prisma.operationLog.count(),
    prisma.userMembership.count(),
    prisma.diagnosticSession.count(),
    prisma.practiceNotebook.count(),
    prisma.examRecord.count(),
    prisma.answerRecord.count(),
    prisma.wrongQuestionSummary.count(),
    prisma.wrongQuestionAttempt.count(),
    prisma.diagnosticReportTask.count(),
    prisma.diagnosticReport.count(),
    prisma.paper.count(),
    prisma.question.count(),
    prisma.questionImportBatch.count(),
    prisma.questionKnowledgePoint.count(),
    prisma.parseTask.count(),
    prisma.syllabusNode.count(),
    prisma.syllabus.count(),
    prisma.revenueCost.count(),
    prisma.paymentOrder.count(),
    prisma.paymentRefund.count(),
    prisma.paymentNotification.count(),
    prisma.paymentReconciliationRun.count(),
    prisma.paymentReconciliationItem.count(),
    prisma.backgroundJobLease.count(),
  ])

  return {
    users,
    authSessions,
    emailChallenges,
    legalAcceptances,
    operationLogs,
    memberships,
    diagnosticSessions,
    practiceNotebooks,
    examRecords,
    answerRecords,
    wrongQuestionSummaries,
    wrongQuestionAttempts,
    diagnosticReportTasks,
    diagnosticReports,
    papers,
    questions,
    questionImportBatches,
    questionKnowledgePoints,
    parseTasks,
    syllabusNodes,
    syllabuses,
    revenueCosts,
    paymentOrders,
    paymentRefunds,
    paymentNotifications,
    paymentReconciliationRuns,
    paymentReconciliationItems,
    backgroundJobLeases,
  }
}

/** 在单个事务内删除所有业务实体，并将每个保留用户恢复为无偏好的初始状态。 */
async function clearBusinessData(): Promise<DataCounts> {
  const result = await prisma.$transaction(async (tx) => {
    const paymentReconciliationItems = await tx.paymentReconciliationItem.deleteMany()
    const paymentRefunds = await tx.paymentRefund.deleteMany()
    const paymentOrders = await tx.paymentOrder.deleteMany()
    const paymentReconciliationRuns = await tx.paymentReconciliationRun.deleteMany()
    const paymentNotifications = await tx.paymentNotification.deleteMany()
    const revenueCosts = await tx.revenueCost.deleteMany()

    const wrongQuestionAttempts = await tx.wrongQuestionAttempt.deleteMany()
    const wrongQuestionSummaries = await tx.wrongQuestionSummary.deleteMany()
    const answerRecords = await tx.answerRecord.deleteMany()
    const diagnosticReports = await tx.diagnosticReport.deleteMany()
    const diagnosticReportTasks = await tx.diagnosticReportTask.deleteMany()
    const examRecords = await tx.examRecord.deleteMany()
    const practiceNotebooks = await tx.practiceNotebook.deleteMany()
    const diagnosticSessions = await tx.diagnosticSession.deleteMany()

    const questionKnowledgePoints = await tx.questionKnowledgePoint.deleteMany()
    const questions = await tx.question.deleteMany()
    const questionImportBatches = await tx.questionImportBatch.deleteMany()
    const parseTasks = await tx.parseTask.deleteMany()
    const papers = await tx.paper.deleteMany()
    const syllabusNodes = await tx.syllabusNode.deleteMany()
    const syllabuses = await tx.syllabus.deleteMany()

    const memberships = await tx.userMembership.deleteMany()
    const authSessions = await tx.authSession.deleteMany()
    const emailChallenges = await tx.emailVerificationChallenge.deleteMany()
    const legalAcceptances = await tx.userLegalAcceptance.deleteMany()
    const operationLogs = await tx.operationLog.deleteMany()
    const backgroundJobLeases = await tx.backgroundJobLease.deleteMany()
    const usersReset = await tx.user.updateMany({
      data: {
        diagnosticUsed: false,
        examPreferences: null,
      },
    })

    return {
      usersRetained: usersReset.count,
      authSessions: authSessions.count,
      emailChallenges: emailChallenges.count,
      legalAcceptances: legalAcceptances.count,
      operationLogs: operationLogs.count,
      memberships: memberships.count,
      diagnosticSessions: diagnosticSessions.count,
      practiceNotebooks: practiceNotebooks.count,
      examRecords: examRecords.count,
      answerRecords: answerRecords.count,
      wrongQuestionSummaries: wrongQuestionSummaries.count,
      wrongQuestionAttempts: wrongQuestionAttempts.count,
      diagnosticReportTasks: diagnosticReportTasks.count,
      diagnosticReports: diagnosticReports.count,
      papers: papers.count,
      questions: questions.count,
      questionImportBatches: questionImportBatches.count,
      questionKnowledgePoints: questionKnowledgePoints.count,
      parseTasks: parseTasks.count,
      syllabusNodes: syllabusNodes.count,
      syllabuses: syllabuses.count,
      revenueCosts: revenueCosts.count,
      paymentOrders: paymentOrders.count,
      paymentRefunds: paymentRefunds.count,
      paymentNotifications: paymentNotifications.count,
      paymentReconciliationRuns: paymentReconciliationRuns.count,
      paymentReconciliationItems: paymentReconciliationItems.count,
      backgroundJobLeases: backgroundJobLeases.count,
    }
  })

  return result
}

/** 校验脚本仅能在显式确认的测试环境中运行，防止误清理其他数据库。 */
function assertTestResetIsAllowed(): void {
  if (config.runtimeEnv !== 'test') {
    throw new Error('Refusing to clear business data outside the test runtime environment.')
  }
  if (process.argv.includes('--confirm') === false || process.env.QUIZ_RESET_TEST_DATA_CONFIRM !== CONFIRM_TOKEN) {
    throw new Error('Set QUIZ_RESET_TEST_DATA_CONFIRM=RESET_TEST_BUSINESS_DATA and pass --confirm to execute the reset.')
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')
  if (config.runtimeEnv !== 'test') {
    throw new Error('Refusing to inspect or clear business data outside the test runtime environment.')
  }

  const before = await collectDataCounts()
  if (dryRun) {
    console.log(JSON.stringify({ mode: 'dry-run', preserved: ['User.id', 'User.username', 'User.email', 'User.password', 'User.role', 'email verification state'], toClear: before }, null, 2))
    return
  }

  assertTestResetIsAllowed()
  const deleted = await clearBusinessData()
  const after = await collectDataCounts()
  console.log(JSON.stringify({ mode: 'confirmed', deleted, remaining: after }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
