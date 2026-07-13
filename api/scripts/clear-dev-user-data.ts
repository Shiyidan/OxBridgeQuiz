// 清理本地开发环境全部账号及其业务数据，保留试卷、题库和公共配置。
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'

if (config.runtimeEnv === 'prod') {
  throw new Error('Refusing to clear user data in production')
}

async function main(): Promise<void> {
  const result = await prisma.$transaction(async (tx) => {
    const answerRecords = await tx.answerRecord.deleteMany()
    const diagnosticReports = await tx.diagnosticReport.deleteMany()
    const diagnosticReportTasks = await tx.diagnosticReportTask.deleteMany()
    const examRecords = await tx.examRecord.deleteMany()
    const diagnosticSessions = await tx.diagnosticSession.deleteMany()
    const memberships = await tx.userMembership.deleteMany()
    const authSessions = await tx.authSession.deleteMany()
    const emailChallenges = await tx.emailVerificationChallenge.deleteMany()
    const users = await tx.user.deleteMany()

    return {
      users: users.count,
      authSessions: authSessions.count,
      emailChallenges: emailChallenges.count,
      memberships: memberships.count,
      examRecords: examRecords.count,
      answerRecords: answerRecords.count,
      diagnosticSessions: diagnosticSessions.count,
      diagnosticReportTasks: diagnosticReportTasks.count,
      diagnosticReports: diagnosticReports.count,
    }
  })
  console.log(JSON.stringify(result, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
