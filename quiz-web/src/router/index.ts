import { createRouter, createWebHistory } from 'vue-router'
import ExamView from '../views/ExamView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'exam',
      component: ExamView,
    },
  ],
})

export default router
