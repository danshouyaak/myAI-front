import { createRouter, createWebHistory } from 'vue-router';
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


export default router;
