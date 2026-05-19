import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/home/HomeView.vue'
import LoginView from '../views/auth/LoginView.vue'

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
      component: () => import('../views/auth/RegisterView.vue'),
    },
    // 个人中心
    { path: '/profile', name: 'profile', component: () => import('../views/profile/ProfileView.vue') },
    // 试题库
    { path: '/question-bank', name: 'question-bank', component: () => import('../views/student/QuestionBankView.vue') },
    // 在线答题
    { path: '/practice', name: 'practice', component: () => import('../views/student/PracticeView.vue') },

    // 管理后台
    {
      path: '/admin',
      redirect: '/admin/core-library',
      component: () => import('../views/admin/AdminLayout.vue'),
      children: [
        // 营收与数据
        { path: 'revenue', name: 'admin-revenue', component: () => import('../views/admin/RevenueView.vue') },
        // 员工管理
        { path: 'staff', name: 'admin-staff', component: () => import('../views/admin/StaffView.vue') },
        // 用户管理
        { path: 'users', name: 'admin-users', component: () => import('../views/admin/UserManageView.vue') },
        // 付费策略与订阅
        { path: 'payment', name: 'admin-payment', component: () => import('../views/admin/PaymentView.vue') },

        // 核心资料库
        {
          path: 'core-library',
          component: () => import('../views/admin/CoreLibraryLayout.vue'),
          children: [
            // 首页
            { path: '', name: 'admin-core-library', component: () => import('../views/admin/CoreLibraryView.vue') },
            // 试题库
            { path: 'questions', name: 'admin-questions', component: () => import('../views/admin/QuestionBankAdmin.vue') },
            // 教材库
            { path: 'textbooks', name: 'admin-textbooks', component: () => import('../views/admin/TextbookAdmin.vue') },
            // 大纲库
            { path: 'syllabus', name: 'admin-syllabus', component: () => import('../views/admin/SyllabusAdmin.vue') },

            // 真题库
            {
              path: 'exams',
              component: () => import('../views/admin/ExamBankLayout.vue'),
              children: [
                // 列表
                { path: '', name: 'admin-exams', component: () => import('../views/admin/ExamBankAdmin.vue') },
                // 上传解析
                { path: 'upload', name: 'admin-exams-upload', component: () => import('../views/admin/PaperUpload.vue') },
                // 试卷预览
                { path: ':id', name: 'admin-exams-detail', component: () => import('../views/admin/PaperPreview.vue') },
              ],
            },
          ],
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const isLoggedIn = !!token && !!user

  // 需要登录的页面
  const requiresAuth =
    to.path.startsWith('/profile') || to.path.startsWith('/practice')

  // 仅管理员可访问
  const requiresAdmin = to.path.startsWith('/admin')

  if (requiresAuth && !isLoggedIn) {
    return next('/login')
  }

  if (requiresAdmin) {
    if (!isLoggedIn) return next('/login')
    if (user.role !== 'admin') return next('/')
  }

  // 已登录用户访问 /login 或 /register → 重定向首页
  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    return next('/')
  }

  next()
})

export default router
