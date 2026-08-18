// 应用路由：集中处理页面访问权限与异步页面资源加载失败。
import { createRouter, createWebHistory } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import HomeView from '../views/home/HomeView.vue'
import LoginView from '../views/auth/LoginView.vue'
import { useAuthStore } from '../stores/auth'
import { createLoginRequiredRouteLocation, getSafeAuthRedirect } from '../utils/authRedirect'
import { applyRouteSeo } from './seo'

class RouteResourceLoadError extends Error {
  constructor(public readonly cause: unknown) {
    super('页面资源加载失败，请刷新页面后重试。')
    this.name = 'RouteResourceLoadError'
  }
}

// 异步页面加载失败时转换为稳定的业务错误类型，避免依赖不同浏览器的错误文本。
function lazyRoute<T>(loader: () => Promise<T>): () => Promise<T> {
  return async () => {
    try {
      return await loader()
    } catch (error: unknown) {
      throw new RouteResourceLoadError(error)
    }
  }
}

const learningWorkspaceRoute = lazyRoute(
  () => import('../views/questionBank/LearningWorkspaceView.vue'),
)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 首页
    { path: '/', name: 'home', component: HomeView },
    // 登录页
    { path: '/login', name: 'login', component: LoginView },
    // 注册页
    {
      path: '/register',
      name: 'register',
      component: lazyRoute(() => import('../views/auth/RegisterView.vue')),
    },
    // 协议与政策
    {
      path: '/legal',
      redirect: '/legal/user-agreement',
    },
    {
      path: '/legal/:documentType(user-agreement|privacy-policy|membership-service-agreement|membership-purchase-notice)',
      name: 'legal-document',
      component: lazyRoute(() => import('../views/legal/LegalDocumentView.vue')),
    },
    // 个人中心
    {
      path: '/profile',
      name: 'profile',
      component: lazyRoute(() => import('../views/profile/ProfileView.vue')),
    },
    // 试题库
    {
      path: '/question-bank',
      name: 'question-bank',
      component: learningWorkspaceRoute,
    },
    // 练习本占位页
    {
      path: '/practice-notebook',
      name: 'practice-notebook',
      component: learningWorkspaceRoute,
    },
    // 试题库临时练习记录
    {
      path: '/practice-records',
      name: 'practice-records',
      component: learningWorkspaceRoute,
    },
    // 新建练习本
    {
      path: '/practice-notebook/new',
      name: 'practice-notebook-new',
      component: learningWorkspaceRoute,
    },
    // 编辑练习本
    {
      path: '/practice-notebook/:id/edit',
      name: 'practice-notebook-edit',
      component: learningWorkspaceRoute,
    },
    // 诊断测试
    {
      path: '/assessment',
      name: 'assessment',
      component: lazyRoute(() => import('../views/assessment/AssessmentHomeView.vue')),
    },
    // 无限模考
    {
      path: '/mock-exams',
      name: 'mock-exams',
      component: lazyRoute(() => import('../views/mockExam/MockExamHomeView.vue')),
    },
    // 无限模考答题复用诊断测试作答页，答卷身份由独立模考接口创建。
    {
      path: '/mock-exams/exam/:paperId',
      name: 'mock-exam-session',
      component: lazyRoute(() => import('../views/assessment/DiagnosticExamView.vue')),
    },
    // 模块化诊断测试
    {
      path: '/assessment/exam/:paperId',
      name: 'diagnostic-exam',
      component: lazyRoute(() => import('../views/assessment/DiagnosticExamView.vue')),
    },
    // 在线答题
    {
      path: '/practice',
      name: 'practice',
      component: lazyRoute(() => import('../views/questionBank/PracticeView.vue')),
    },
    // 错题本
    {
      path: '/mistake-notebook',
      name: 'mistake-notebook',
      component: lazyRoute(() => import('../views/mistakeNotebook/MistakeNotebookView.vue')),
    },
    // 考试介绍
    {
      path: '/exam-intro',
      redirect: '/exam-intro/tmua',
    },
    {
      path: '/exam-intro/:examType(tmua|esat|step)',
      name: 'exam-intro',
      component: lazyRoute(() => import('../views/examIntro/ExamIntroView.vue')),
    },
    // 资料下载
    {
      path: '/study-resources',
      name: 'study-resources',
      component: lazyRoute(() => import('../views/studyResources/StudyResourcesView.vue')),
    },
    // 答题结果
    {
      path: '/exam-result',
      name: 'exam-result',
      component: lazyRoute(() => import('../views/questionBank/ExamResultView.vue')),
    },
    {
      path: '/exam-result/:id',
      name: 'exam-result-detail',
      component: lazyRoute(() => import('../views/assessment/ExamResultDetail.vue')),
    },
    // 诊断报告中的逐题解析
    {
      path: '/exam-result/:id/questions',
      name: 'exam-question-review',
      component: lazyRoute(() => import('../views/assessment/ExamResultDetail.vue')),
    },
    // ESAT 诊断报告
    {
      path: '/exam-result/:id/esat',
      name: 'esat-diagnostic-report',
      component: lazyRoute(() => import('../views/assessment/EsatDiagnosticReportView/index.vue')),
    },
    // TMUA 诊断报告
    {
      path: '/exam-result/:id/tmua',
      name: 'tmua-diagnostic-report',
      component: lazyRoute(() => import('../views/assessment/TmuaDiagnosticReportView.vue')),
    },

    // 管理后台
    {
      path: '/admin',
      redirect: '/admin/core-library',
      component: lazyRoute(() => import('../views/admin/AdminLayout.vue')),
      children: [
        // 营收与数据
        {
          path: 'revenue',
          name: 'admin-revenue',
          component: lazyRoute(() => import('../views/admin/RevenueView.vue')),
        },
        // 员工管理
        {
          path: 'staff',
          name: 'admin-staff',
          component: lazyRoute(() => import('../views/admin/StaffView.vue')),
        },
        // 用户管理
        {
          path: 'users',
          name: 'admin-users',
          component: lazyRoute(() => import('../views/admin/userManagement/UserManageView.vue')),
        },
        // 付费策略与订阅
        {
          path: 'payment',
          name: 'admin-payment',
          component: lazyRoute(() => import('../views/admin/PaymentView.vue')),
        },
        // 用户行为分析
        {
          path: 'behavior-analytics',
          name: 'admin-behavior-analytics',
          component: lazyRoute(
            () => import('../views/admin/behaviorAnalysis/BehaviorAnalyticsView.vue'),
          ),
        },
        // 操作日志
        {
          path: 'operation-logs',
          name: 'admin-operation-logs',
          component: lazyRoute(() => import('../views/admin/operationLogs/OperationLogsView.vue')),
        },

        // 核心资料库
        {
          path: 'core-library',
          component: lazyRoute(() => import('../views/admin/coreLibrary/CoreLibraryLayout.vue')),
          children: [
            // 首页
            {
              path: '',
              name: 'admin-core-library',
              component: lazyRoute(() => import('../views/admin/coreLibrary/CoreLibraryView.vue')),
            },
            // 试题库
            {
              path: 'questions',
              name: 'admin-questions',
              component: lazyRoute(
                () => import('../views/admin/coreLibrary/QuestionBankAdmin.vue'),
              ),
            },
            // 试题库 standard2 批量导入
            {
              path: 'questions/import',
              name: 'admin-questions-import',
              component: lazyRoute(
                () => import('../views/admin/coreLibrary/QuestionBankImport.vue'),
              ),
            },
            // 试题库上传包详情
            {
              path: 'questions/batches/:batchId',
              name: 'admin-question-batch-detail',
              component: lazyRoute(
                () => import('../views/admin/coreLibrary/QuestionBankBatchDetail.vue'),
              ),
            },
            // 教材库
            {
              path: 'textbooks',
              name: 'admin-textbooks',
              component: lazyRoute(() => import('../views/admin/coreLibrary/TextbookAdmin.vue')),
            },
            // 大纲库
            {
              path: 'syllabus',
              name: 'admin-syllabus',
              component: lazyRoute(() => import('../views/admin/coreLibrary/SyllabusAdmin.vue')),
            },

            // 模考试卷库
            {
              path: 'mock-exams',
              name: 'admin-mock-exams',
              component: lazyRoute(
                () => import('../views/admin/coreLibrary/MockPaperLibrary.vue'),
              ),
            },

            // 真题库
            {
              path: 'exams',
              component: lazyRoute(() => import('../views/admin/coreLibrary/ExamBankLayout.vue')),
              children: [
                // 列表
                {
                  path: '',
                  name: 'admin-exams',
                  component: lazyRoute(
                    () => import('../views/admin/coreLibrary/ExamBankAdmin.vue'),
                  ),
                },
                // 上传解析
                {
                  path: 'upload',
                  name: 'admin-exams-upload',
                  component: lazyRoute(() => import('../views/admin/coreLibrary/PaperUpload.vue')),
                },
                // 试卷预览
                {
                  path: ':id',
                  name: 'admin-exams-detail',
                  component: lazyRoute(() => import('../views/admin/coreLibrary/PaperPreview.vue')),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

let routeResourceDialogOpen = false

// 路由资源错误由包装器提供稳定类型；弹窗不展示浏览器原始报错文本。
router.onError((error) => {
  if (!(error instanceof RouteResourceLoadError) || routeResourceDialogOpen) return
  routeResourceDialogOpen = true
  void ElMessageBox.alert(error.message, '页面加载失败', {
    type: 'error',
    confirmButtonText: '刷新页面',
    closeOnClickModal: false,
    closeOnPressEscape: false,
    showClose: false,
  })
    .then(() => window.location.reload())
    .finally(() => {
      routeResourceDialogOpen = false
    })
})

// 导航完成后统一同步页面标题、摘要、规范网址与索引策略。
router.afterEach((to) => {
  applyRouteSeo(to)
})

// 浏览型首页允许游客查看；开始作答、个人数据和管理页面统一要求登录并保留回跳地址。
router.beforeEach((to, _from) => {
  const auth = useAuthStore()
  const isLoggedIn = auth.isLoggedIn

  const requiresAuth =
    to.path.startsWith('/profile') ||
    to.path.startsWith('/practice-notebook/') ||
    to.path === '/practice-records' ||
    to.path === '/practice' ||
    to.path.startsWith('/practice/') ||
    to.path.startsWith('/assessment/exam/') ||
    to.path.startsWith('/mock-exams/exam/') ||
    to.path.startsWith('/exam-result') ||
    to.path.startsWith('/mistake-notebook')

  const requiresAdmin = to.path.startsWith('/admin')

  if (requiresAuth && !isLoggedIn) {
    return createLoginRequiredRouteLocation(to.fullPath)
  }

  if (requiresAdmin) {
    if (!isLoggedIn) return createLoginRequiredRouteLocation(to.fullPath)
    if (!auth.isAdmin) return '/'
  }

  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    return getSafeAuthRedirect(to.query.redirect)
  }
})

export default router
