// 安全清理本地开发库中的指定用户业务数据、试卷题库及其作答链路，同时保留账号凭据与登录会话。
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'

const TARGET_USERNAME = '22'
const CONFIRM_TOKEN = 'CLEAR_LOCAL_USER_22_AND_CONTENT'

type DataCounts = Record<string, number>

/** 汇总目标账号和全局学习内容数量，供正式删除前后核验清理边界。 */
async function collectDataCounts(userId: string): Promise<DataCounts> {
  const [
    users,
    targetAuthSessions,
    targetEmailChallenges,
    targetLegalAcceptances,
    targetOperationLogs,
    targetMemberships,
    targetPaymentOrders,
    targetDiagnosticSessions,
    targetPracticeNotebooks,
    targetExamRecords,
    targetWrongQuestionSummaries,
    papers,
    questions,
    questionImportBatches,
    questionKnowledgePoints,
    parseTasks,
    diagnosticSessions,
    practiceNotebooks,
    examRecords,
    answerRecords,
    wrongQuestionSummaries,
    wrongQuestionAttempts,
    diagnosticReportTasks,
    diagnosticReports,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.authSession.count({ where: { userId } }),
    prisma.emailVerificationChallenge.count({ where: { userId } }),
    prisma.userLegalAcceptance.count({ where: { userId } }),
    prisma.operationLog.count({ where: { actorUserId: userId } }),
    prisma.userMembership.count({ where: { userId } }),
    prisma.paymentOrder.count({ where: { userId } }),
    prisma.diagnosticSession.count({ where: { userId } }),
    prisma.practiceNotebook.count({ where: { userId } }),
    prisma.examRecord.count({ where: { userId } }),
    prisma.wrongQuestionSummary.count({ where: { userId } }),
    prisma.paper.count(),
    prisma.question.count(),
    prisma.questionImportBatch.count(),
    prisma.questionKnowledgePoint.count(),
    prisma.parseTask.count(),
    prisma.diagnosticSession.count(),
    prisma.practiceNotebook.count(),
    prisma.examRecord.count(),
    prisma.answerRecord.count(),
    prisma.wrongQuestionSummary.count(),
    prisma.wrongQuestionAttempt.count(),
    prisma.diagnosticReportTask.count(),
    prisma.diagnosticReport.count(),
  ])

  return {
    users,
    targetAuthSessions,
    targetEmailChallenges,
    targetLegalAcceptances,
    targetOperationLogs,
    targetMemberships,
    targetPaymentOrders,
    targetDiagnosticSessions,
    targetPracticeNotebooks,
    targetExamRecords,
    targetWrongQuestionSummaries,
    papers,
    questions,
    questionImportBatches,
    questionKnowledgePoints,
    parseTasks,
    diagnosticSessions,
    practiceNotebooks,
    examRecords,
    answerRecords,
    wrongQuestionSummaries,
    wrongQuestionAttempts,
    diagnosticReportTasks,
    diagnosticReports,
  }
}

/** 只允许本地运行时连接本机数据库，避免环境变量误配后触碰远端数据。 */
function assertLocalDatabase(): void {
  if (config.runtimeEnv !== 'local') {
    throw new Error('Refusing to inspect or clear data outside the local runtime environment.')
  }

  const databaseUrl = new URL(config.databaseUrl)
  const localHosts = new Set(['localhost', '127.0.0.1', '::1'])
  if (!localHosts.has(databaseUrl.hostname)) {
    throw new Error(`Refusing to clear a non-local database host: ${databaseUrl.hostname}`)
  }
}

/** 正式执行前同时校验命令参数和一次性确认令牌。 */
function assertConfirmed(): void {
  if (!process.argv.includes('--confirm')) {
    throw new Error('Pass --confirm to execute this destructive cleanup.')
  }
  if (process.env.QUIZ_CLEAR_LOCAL_DATA_CONFIRM !== CONFIRM_TOKEN) {
    throw new Error(`Set QUIZ_CLEAR_LOCAL_DATA_CONFIRM=${CONFIRM_TOKEN} before execution.`)
  }
}

/** 在单个事务中清理指定账号业务数据以及全局试卷、题库和做题链路。 */
async function clearData(userId: string): Promise<DataCounts> {
  return prisma.$transaction(async (tx) => {
    const targetOrders = await tx.paymentOrder.findMany({
      where: { userId },
      select: { id: true, orderNo: true },
    })
    const targetOrderIds = targetOrders.map((order) => order.id)
    const targetOrderNos = targetOrders.map((order) => order.orderNo)

    const paymentReconciliationItems = targetOrderIds.length
      ? await tx.paymentReconciliationItem.deleteMany({
          where: { paymentOrderId: { in: targetOrderIds } },
        })
      : { count: 0 }
    const paymentRefunds = targetOrderIds.length
      ? await tx.paymentRefund.deleteMany({ where: { paymentOrderId: { in: targetOrderIds } } })
      : { count: 0 }
    const paymentNotifications = targetOrderNos.length
      ? await tx.paymentNotification.deleteMany({ where: { orderNo: { in: targetOrderNos } } })
      : { count: 0 }
    const paymentOrders = await tx.paymentOrder.deleteMany({ where: { userId } })

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

    const memberships = await tx.userMembership.deleteMany({ where: { userId } })
    const emailChallenges = await tx.emailVerificationChallenge.deleteMany({ where: { userId } })
    const legalAcceptances = await tx.userLegalAcceptance.deleteMany({ where: { userId } })
    const operationLogs = await tx.operationLog.deleteMany({ where: { actorUserId: userId } })
    const usersReset = await tx.user.updateMany({
      where: { id: userId },
      data: {
        diagnosticUsed: false,
        examPreferences: null,
      },
    })

    return {
      usersReset: usersReset.count,
      authSessionsPreserved: await tx.authSession.count({ where: { userId } }),
      emailChallenges: emailChallenges.count,
      legalAcceptances: legalAcceptances.count,
      operationLogs: operationLogs.count,
      memberships: memberships.count,
      paymentOrders: paymentOrders.count,
      paymentRefunds: paymentRefunds.count,
      paymentNotifications: paymentNotifications.count,
      paymentReconciliationItems: paymentReconciliationItems.count,
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
    }
  }, { maxWait: 10_000, timeout: 60_000 })
}

async function main(): Promise<void> {
  assertLocalDatabase()

  const matchingUsers = await prisma.user.findMany({
    where: { username: TARGET_USERNAME },
    select: {
      id: true,
      username: true,
      email: true,
      password: true,
      role: true,
      emailVerifiedAt: true,
      passwordChangedAt: true,
      createdAt: true,
    },
  })
  if (matchingUsers.length !== 1) {
    throw new Error(`Expected exactly one user named ${TARGET_USERNAME}, found ${matchingUsers.length}.`)
  }

  const targetUser = matchingUsers[0]
  const identitySnapshot = JSON.stringify(targetUser)
  const before = await collectDataCounts(targetUser.id)
  const paperGroups = await prisma.paper.groupBy({
    by: ['paperType', 'examType'],
    _count: { _all: true },
  })

  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      runtimeEnv: config.runtimeEnv,
      databaseHost: new URL(config.databaseUrl).hostname,
      targetUser: { username: targetUser.username, role: targetUser.role },
      preserved: ['User identity and credentials', 'AuthSession rows'],
      paperGroups,
      toClear: before,
    }, null, 2))
    return
  }

  assertConfirmed()
  const deleted = await clearData(targetUser.id)
  const retainedUser = await prisma.user.findUnique({
    where: { id: targetUser.id },
    select: {
      id: true,
      username: true,
      email: true,
      password: true,
      role: true,
      emailVerifiedAt: true,
      passwordChangedAt: true,
      createdAt: true,
    },
  })
  if (!retainedUser || JSON.stringify(retainedUser) !== identitySnapshot) {
    throw new Error('Cleanup completed, but the retained account identity no longer matches its pre-cleanup snapshot.')
  }

  const remaining = await collectDataCounts(targetUser.id)
  console.log(JSON.stringify({
    mode: 'confirmed',
    runtimeEnv: config.runtimeEnv,
    targetUser: targetUser.username,
    identityPreserved: true,
    deleted,
    remaining,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
