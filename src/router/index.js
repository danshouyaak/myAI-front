import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import layout from '@/layout/index.vue';
import requests from '@/utils/request.ts';
import { getUserLoginStatus } from '@/api/index.ts';

const routes = [
  {
    path: '/',
    component: layout,
    redirect: '/new-message',
    meta: { requiresAuth: true }, // 表示该路由需要认证
    children: [
      {
        name: 'main',
        path: '/main/:conversationId',
        component: () => import('@/pages/MainPage.vue')
      },
      {
        name: 'NewMessage',
        path: '/new-message',
        component: () => import('@/pages/NewMessage.vue')
      },
      {
        name: 'ModelSquare',
        path: '/model-square',
        component: () => import('@/pages/ModelSquare.vue')
      },
      {
        name: 'settings',
        path: '/settings',
        component: () => import('@/pages/settings.vue')
      },
      {
        path: '/chat-preview',
        name: 'ChatPreview',
        component: () => import('../pages/ChatPreview.vue')
      },
      {
        name: 'user-statistics',
        path: '/user-statistics',
        component: () => import('@/pages/UserStatistics.vue')
      }
    ]
  },
  {
    name: 'login',
    path: '/login',
    component: () => import('@/pages/login.vue'),
    meta: { guest: true } // 游客页面
  },
  {
    name: 'register',
    path: '/register',
    component: () => import('@/pages/register.vue'),
    meta: { guest: true } // 游客页面
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/404.vue')
  }
];

const router = createRouter({
  // 开发环境使用hash模式避免刷新404问题，生产环境使用history模式
  history: import.meta.env.DEV ? createWebHashHistory() : createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  // 获取用户登录状态
  const user = await getUserLoginStatus();
  console.log('to.meta', to.meta);
  // 已登录用户不能访问登录和注册页面
  console.log('user', user);
  if (user && to.meta.guest) {
    console.log('已登录用户不能访问登录和注册页面');
    next('/');
    return;
  }
  // 需要认证的页面，但用户未登录
  if (to.meta.requiresAuth && !user) {
    next('/login');
    return;
  }

  next();
});

export default router;
