// 应用路由：集中处理页面访问权限与异步页面资源加载失败。
import { createRouter, createWebHistory } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import HomeView from '../views/home/HomeView.vue'
import LoginView from '../views/auth/LoginView.vue'
import { useAuthStore } from '../stores/auth'

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
      component: lazyRoute(() => import('../views/questionBank/QuestionBankView.vue')),
    },
    // 诊断测试
    {
      path: '/assessment',
      name: 'assessment',
      component: lazyRoute(() => import('../views/assessment/AssessmentHomeView.vue')),
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
          component: lazyRoute(() => import('../views/admin/UserManageView.vue')),
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
          component: lazyRoute(() => import('../views/admin/BehaviorAnalyticsView.vue')),
        },
        // 操作日志
        {
          path: 'operation-logs',
          name: 'admin-operation-logs',
          component: lazyRoute(() => import('../views/admin/OperationLogsView.vue')),
        },

        // 核心资料库
        {
          path: 'core-library',
          component: lazyRoute(() => import('../views/admin/CoreLibraryLayout.vue')),
          children: [
            // 首页
            {
              path: '',
              name: 'admin-core-library',
              component: lazyRoute(() => import('../views/admin/CoreLibraryView.vue')),
            },
            // 试题库
            {
              path: 'questions',
              name: 'admin-questions',
              component: lazyRoute(() => import('../views/admin/QuestionBankAdmin.vue')),
            },
            // 试题库 standard2 批量导入
            {
              path: 'questions/import',
              name: 'admin-questions-import',
              component: lazyRoute(() => import('../views/admin/QuestionBankImport.vue')),
            },
            // 试题库上传包详情
            {
              path: 'questions/batches/:batchId',
              name: 'admin-question-batch-detail',
              component: lazyRoute(() => import('../views/admin/QuestionBankBatchDetail.vue')),
            },
            // 试题库内容预览
            {
              path: 'questions/:id',
              name: 'admin-questions-detail',
              component: lazyRoute(() => import('../views/admin/QuestionBankQuestionDetail.vue')),
            },
            // 教材库
            {
              path: 'textbooks',
              name: 'admin-textbooks',
              component: lazyRoute(() => import('../views/admin/TextbookAdmin.vue')),
            },
            // 大纲库
            {
              path: 'syllabus',
              name: 'admin-syllabus',
              component: lazyRoute(() => import('../views/admin/SyllabusAdmin.vue')),
            },

            // 真题库
            {
              path: 'exams',
              component: lazyRoute(() => import('../views/admin/ExamBankLayout.vue')),
              children: [
                // 列表
                {
                  path: '',
                  name: 'admin-exams',
                  component: lazyRoute(() => import('../views/admin/ExamBankAdmin.vue')),
                },
                // 上传解析
                {
                  path: 'upload',
                  name: 'admin-exams-upload',
                  component: lazyRoute(() => import('../views/admin/PaperUpload.vue')),
                },
                // 试卷预览
                {
                  path: ':id',
                  name: 'admin-exams-detail',
                  component: lazyRoute(() => import('../views/admin/PaperPreview.vue')),
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

// 受保护页面统一先进入登录流程，并携带原地址供认证成功后返回。
router.beforeEach((to, _from) => {
  const auth = useAuthStore()
  const isLoggedIn = auth.isLoggedIn

  const requiresAuth =
    to.path.startsWith('/profile') ||
    to.path.startsWith('/question-bank') ||
    to.path.startsWith('/practice') ||
    to.path.startsWith('/assessment') ||
    to.path.startsWith('/exam-result') ||
    to.path.startsWith('/mistake-notebook')

  const requiresAdmin = to.path.startsWith('/admin')

  if (requiresAuth && !isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (requiresAdmin) {
    if (!isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
    if (!auth.isAdmin) return '/'
  }

  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    return '/'
  }
})

export default router
