<template>
  <el-watermark :content="[user?.id, user?.userRole]" :font="font">
    <div class="common-layout">
      <el-container class="container">
        <el-header>
          <Header />
        </el-header>
        <el-container>
          <!-- 遮罩层 - 仅在移动端且侧边栏展开时显示 -->
          <transition name="fade">
            <div
              v-show="!isCollapse && isMobile"
              class="aside-mask"
              @click="handleMaskClick"
            ></div>
          </transition>
          <!-- 侧边栏 -->
          <el-aside
            :class="{ 'is-collapse': isCollapse }"
            :width="isCollapse ? '0' : '300px'"
            class="aside"
          >
            <Aside />
          </el-aside>
          <!-- 侧边栏切换按钮 -->
          <div class="aside-toggle" @click="toggleAside">
            <el-icon>
              <component :is="isCollapse ? 'Expand' : 'Fold'" />
            </el-icon>
          </div>
          <el-container>
            <el-main>
              <RouterView />
            </el-main>
          </el-container>
        </el-container>
      </el-container>
    </div>
  </el-watermark>
</template>

<script lang="ts" setup>
import Header from '@/components/Header.vue';
import { reactive, ref, watchEffect, onMounted, onUnmounted } from 'vue';
import { getUser } from '@/global/UserStatue.ts';
import { useRouter, useRoute } from 'vue-router';
import { Expand, Fold } from '@element-plus/icons-vue';
import { UserModel } from '@/models/UserModels';
import Aside from '@/components/Aside.vue';

const router = useRouter();
const route = useRoute();

// 控制侧边栏的展开/收起状态
const isCollapse = ref(false);
// 是否为移动设备
const isMobile = ref(false);

// 处理遮罩层点击事件 - 收起侧边栏
const handleMaskClick = () => {
  isCollapse.value = true;
};

// 切换侧边栏的展开/收起
const toggleAside = () => {
  isCollapse.value = !isCollapse.value;
};

// 检查是否是移动设备（根据屏幕宽度判断）并设置默认状态
const checkMobile = () => {
  // 当屏幕宽度小于等于1200px时，认为是移动设备
  const newIsMobile = window.innerWidth <= 1200;

  // 只有当设备类型发生变化时才更新状态
  if (isMobile.value !== newIsMobile) {
    isMobile.value = newIsMobile;
    // 根据设备类型设置侧边栏默认状态
    isCollapse.value = newIsMobile;
  }
};

// 监听路由变化，在移动端下自动收起侧边栏
watchEffect(() => {
  if (isMobile.value && route.path) {
    isCollapse.value = true;
  }
});

// 组件挂载时的初始化操作
onMounted(() => {
  // 初始检查设备类型并设置默认状态
  checkMobile();
  // 监听窗口大小变化，动态调整侧边栏状态
  window.addEventListener('resize', checkMobile);
});

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

// 水印字体样式配置
const font = reactive({
  color: 'rgba(0, 0, 0, .15)'
});

// 用户信息状态
let user = reactive({} as UserModel);

// 监听用户登录状态
watchEffect(() => {
  // 获取用户信息
  user = getUser();
});
</script>

<style scoped>
/* 容器样式 */
.container {
  height: 100vh;
  border: #e5e7eb 1px solid;
  box-shadow: 3px 3px 3px rgba(229, 231, 235, 1);
  position: relative;
}

/* 侧边栏基础样式 */
.aside {
  /* 统一的动画效果，适用于所有状态 */
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  background-color: white;
  overflow: hidden;
  will-change: transform;
}

/* 侧边栏切换按钮样式 */
.aside-toggle {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 40px;
  background-color: white;
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 3px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 999;
  transition: left 0.3s ease;
}

/* 收起状态样式 */
.is-collapse {
  padding: 0;
}

/* 遮罩层样式 */
.aside-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); /* 增加遮罩层透明度 */
  z-index: 997;
}

/* 遮罩层动画 - 与侧边栏保持一致的动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端样式（屏幕宽度 ≤ 1200px） */
@media (max-width: 1200px) {
  /* 移动端侧边栏样式 */
  .aside {
    position: fixed;
    left: 0;
    top: 60px;
    bottom: 0;
    z-index: 998;
    background-color: white;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    transform: translateX(0);
    /* 保持与基础样式相同的动画效果 */
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* 移动端侧边栏收起状态 */
  .is-collapse {
    transform: translateX(-100%);
    /* 不需要重复定义transition，会继承父级的动画效果 */
  }

  /* 移动端切换按钮位置 */
  .aside-toggle {
    left: 0;
  }

  /* 收起状态下切换按钮位置 */
  .is-collapse + .aside-toggle {
    left: 0;
  }
}
</style>
