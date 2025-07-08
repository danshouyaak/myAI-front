<template>
  <el-watermark :content="[user?.id, user?.userRole]" :font="font">
    <div class="layout-container">
      <el-container>
        <el-header>
          <Header :is-mobile="isMobile" @toggle-aside="toggleAside" />
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

          <Aside :class="{ 'is-collapse': isCollapse, 'is-mobile': isMobile }" class="aside" />

          <!-- 侧边栏切换按钮 -->
          <div :class="{ 'is-mobile': isMobile }" class="aside-toggle" @click="toggleAside">
            <el-icon>
              <component :is="isCollapse ? 'Expand' : 'Fold'" />
            </el-icon>
          </div>

          <el-main :class="{ 'is-mobile': isMobile }" :style="{ marginLeft: isCollapse || isMobile ? '0' : '260px' }"
                   class="main-content">
            <router-view></router-view>
          </el-main>
        </el-container>
      </el-container>
    </div>
  </el-watermark>
</template>

<script lang="ts" setup>
import { ref, reactive, watchEffect, onMounted, onUnmounted } from 'vue';
import Aside from '@/components/Aside.vue';
import Header from '@/components/Header.vue';
import { getUser } from '@/global/UserStatue.ts';
import type { UserModel } from '@/models/UserModel';
import { Expand, Fold } from '@element-plus/icons-vue';

const isCollapse = ref(false);
const isMobile = ref(false);

// 水印字体样式配置
const font = reactive({
  color: 'rgba(0, 0, 0, .15)'
});

// 用户信息状态
let user = reactive({} as UserModel);

// 监听用户登录状态
watchEffect(() => {
  user = getUser();
});

// 处理遮罩层点击事件 - 收起侧边栏
const handleMaskClick = () => {
  isCollapse.value = true;
}

// 切换侧边栏的展开/收起
const toggleAside = () => {
  isCollapse.value = !isCollapse.value;
}

// 检查是否是移动设备（根据屏幕宽度判断）并设置默认状态
const checkMobile = () => {
  const newIsMobile = window.innerWidth <= 768; // 修改断点为更合适的移动端尺寸
  if (isMobile.value !== newIsMobile) {
    isMobile.value = newIsMobile;
    isCollapse.value = newIsMobile;
  }
}

// 组件挂载时的初始化操作
onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
})
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  background-color: var(--el-bg-color);
}

.el-header {
  padding: 0;
  height: 60px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
}

.el-container {
  min-height: 100vh;
}

.main-content {
  transition: margin-left 0.3s;
  margin-top: 60px;
  min-height: calc(100vh - 60px);
  padding: 20px;
}

.main-content.is-mobile {
  padding: 12px;
  margin-left: 0 !important;
}

.aside {
  transition: all 0.3s;
  width: 260px;
  position: fixed;
  left: 0;
  top: 60px;
  bottom: 0;
  z-index: 999;
  background-color: var(--el-bg-color);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.aside.is-collapse {
  width: 0;
  transform: translateX(-100%);
}

.aside.is-mobile {
  width: 80%;
  max-width: 300px;
  transform: translateX(-100%);
}

.aside.is-mobile:not(.is-collapse) {
  transform: translateX(0);
}

/* 侧边栏切换按钮样式 */
.aside-toggle {
  position: fixed;
  left: 260px;
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
  transition: left 0.3s;
}

.aside-toggle.is-mobile {
  width: 24px;
  height: 48px;
  background-color: var(--el-color-primary);
  color: white;
}

.aside.is-collapse + .aside-toggle {
  left: 0;
}

/* 遮罩层样式 */
.aside-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

/* 遮罩层动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
