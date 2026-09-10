import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

// Exported so tests can mount the real route table against a memory history.
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
  },
  {
    path: '/practice',
    name: 'practice',
    component: () => import('../views/RoundView.vue'),
    props: { mode: 'practice' },
  },
  {
    path: '/sprint',
    name: 'sprint',
    component: () => import('../views/RoundView.vue'),
    props: { mode: 'sprint' },
  },
  {
    path: '/review',
    name: 'review',
    component: () => import('../views/RoundView.vue'),
    props: { mode: 'review' },
  },
  {
    path: '/exam',
    name: 'exam',
    component: () => import('../views/ExamView.vue'),
  },
  {
    path: '/results/:sessionId',
    name: 'results',
    component: () => import('../views/ResultsView.vue'),
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes,
})

export default router
