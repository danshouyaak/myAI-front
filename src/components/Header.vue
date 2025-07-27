<template>
  <div class="header-container">
    <!-- 移动端菜单按钮 -->
    <div v-if="isMobile" class="menu-button" @click="toggleAside">
      <el-icon size="24">
        <Menu />
      </el-icon>
    </div>

    <!-- Logo区域 -->
    <div class="logo-section">
      <el-text style="font-weight: bold" type="primary">
        AI
      </el-text>
      <img
        alt="Element logo"
        src="@/assets/MyAIlogin.svg"
        class="logo-image"
      />
    </div>

    <!-- 导航菜单区域 -->
    <div class="nav-section">
      <el-menu
        :default-active="activeIndex"
        :ellipsis="false"
        class="nav-menu"
        mode="horizontal"
      >
        <el-menu-item index="model-square" @click="$router.push('/model-square')">
          <el-icon>
            <Grid />
          </el-icon>
          模型广场
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧区域（如果需要的话） -->
    <div class="right-section">
      <!-- 这里可以放置其他按钮或功能 -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Menu, Grid } from '@element-plus/icons-vue';

const activeIndex = ref('0');

const props = defineProps<{
  isMobile: boolean
}>();

const emit = defineEmits<{
  (e: 'toggleAside'): void
}>();

const toggleAside = () => {
  emit('toggleAside');
};
</script>

<style scoped>
.header-container {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.logo-section {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.logo-image {
  height: 32px;
  margin-left: 8px;
}

.nav-section {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  margin-left: 32px;
}

.nav-menu {
  background-color: transparent;
  border-bottom: none;
}

.nav-menu :deep(.el-menu-item) {
  font-size: 15px;
  padding: 0 20px;
}

.nav-menu :deep(.el-menu-item.is-active) {
  font-weight: 600;
}

.right-section {
  min-width: 200px;
  display: flex;
  justify-content: flex-end;
}

/* 移动端菜单按钮样式 */
.menu-button {
  margin-right: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.menu-button:hover {
  background-color: var(--el-fill-color-light);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-container {
    padding: 0 12px;
  }

  .logo-section {
    min-width: auto;
  }

  .nav-section {
    justify-content: flex-start;
    margin-left: 16px;
  }

  .right-section {
    min-width: auto;
  }

  .menu-button {
    margin-right: 8px;
  }

  .nav-menu :deep(.el-menu-item) {
    padding: 0 12px;
  }
}
</style>
