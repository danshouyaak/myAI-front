import { createRouter, createWebHistory } from 'vue-router';
import layout from '@/layout/index.vue';
import requests from '@/utils/request.ts';
import { getUserLoginStatus } from '@/api/index.ts';

const routes = [
  {
    path: '/',
    component: layout,
    redirect: '/NewMessage',
    meta: { requiresAuth: true }, // 表示该路由需要认证
    children: [
      {
        name: 'main',
        path: '/main/:conversationId',
        component: () => import('@/pages/MainPage.vue')
      },
      {
        name: 'NewMessage',
        path: '/NewMessage',
        component: () => import('@/pages/NewMessage.vue')
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
  history: createWebHistory(),
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
