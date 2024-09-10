import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';
import layout from '@/layout/index.vue';


const routes = [
  {
    path: '/',
    component: layout,
    redirect: '/main',
    meta: { requiresAuth: true }, // 表示该路由需要认证
    children: [
      {
        name: 'main',
        path: '/main',
        component: () => import('@/pages/MainPage.vue')
      }
    ]
  },
  {
    name: 'login',
    path: '/login',
    component: () => import('@/pages/login.vue')
  },
  {
    name: 'register',
    path: '/register',
    component: () => import('@/pages/register.vue')
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

// 全局前置守卫
// router.beforeEach(async (to, from, next) => {
//   // 如果目标路由不需要认证，直接放行
//   if (!to.meta.requiresAuth) {
//     return next();
//   }
//
//   try {
//     // 尝试获取用户信息
//     await fetchUserInfo();
//     // 如果获取用户信息成功，继续导航
//     next();
//   } catch (error) {
//     // 如果获取用户信息失败，重定向到登录页面
//     next({ name: 'login' });
//   }
// });

export default router;
