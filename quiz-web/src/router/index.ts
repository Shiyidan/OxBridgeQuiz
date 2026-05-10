import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ExamView from '../views/ExamView.vue'
import LoginView from '../views/LoginView.vue'
import QuestionBankView from '../views/QuestionBankView.vue'
import PracticeView from '../views/PracticeView.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/exam', name: 'exam', component: ExamView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/question-bank', name: 'question-bank', component: QuestionBankView },
    { path: '/practice', name: 'practice', component: PracticeView },
    {
      path: '/admin',
      component: AdminLayout,
      children: [
        { path: 'papers', name: 'paper-list', component: () => import('../views/admin/PaperList.vue') },
        { path: 'papers/upload', name: 'paper-upload', component: () => import('../views/admin/PaperUpload.vue') },
        { path: 'papers/:id', name: 'paper-preview', component: () => import('../views/admin/PaperPreview.vue') },
        { path: 'papers/:id/edit', name: 'paper-edit', component: () => import('../views/admin/PaperEdit.vue') },
      ]
    },
  ],
})

export default router
