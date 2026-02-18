import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据概览', icon: 'DataAnalysis' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'bills',
        name: 'Bills',
        component: () => import('@/views/Bills.vue'),
        meta: { title: '账单管理', icon: 'Tickets' }
      },
      {
        path: 'feedback',
        name: 'Feedback',
        component: () => import('@/views/Feedback.vue'),
        meta: { title: '意见反馈', icon: 'ChatDotRound' }
      },
      {
        path: 'app-version',
        name: 'AppVersion',
        component: () => import('@/views/AppVersion.vue'),
        meta: { title: '版本管理', icon: 'Upload' }
      },
      {
        path: 'app-config',
        name: 'AppConfig',
        component: () => import('@/views/AppConfig.vue'),
        meta: { title: '配置管理', icon: 'Setting' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  
  if (to.path === '/login') {
    next()
  } else {
    if (token) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router
