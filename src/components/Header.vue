<template>
  <el-menu
    :default-active="activeIndex"
    :ellipsis="false"
    class="el-menu-demo"
    mode="horizontal"
  >
    <!-- 移动端菜单按钮 -->
    <div v-if="isMobile" class="menu-button" @click="toggleAside">
      <el-icon size="24">
        <Menu />
      </el-icon>
    </div>

    <el-menu-item index="0">
      <el-text style="font-weight: bold" type="primary">
        AI
      </el-text>
      <img
        alt="Element logo"
        src="@/assets/MyAIlogin.svg"
        style="width: 100%"
      />
    </el-menu-item>
    <el-menu-item v-for="item in aiModels" :index="String(item.id)" @click="handleSelect(item)">
      <el-text style="font-weight: bold" type="primary">
        {{ item.name }}
      </el-text>
      <img
        :src="getAssetsFile(item.avatar)"
        alt="Element logo"
        style="width: 100%"
      />
    </el-menu-item>
  </el-menu>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue';
import { aiModels } from '@/models/AIModel.d.ts';
import { aiModel, setAIModel } from '@/global/aiCommon.ts';
import requests from '@/utils/request.ts';
import { getAssetsFile } from '@/utils/pub-use.ts';
import { Menu } from '@element-plus/icons-vue';

const activeIndex = ref('1');

const props = defineProps<{
  isMobile: boolean
}>();

const emit = defineEmits<{
  (e: 'toggleAside'): void
}>();

const handleSelect = (model: aiModel) => {
  console.log('handleSelect', model);
  setAIModel(model);
};

const toggleAside = () => {
  emit('toggleAside');
};
</script>

<style scoped>
.el-menu--horizontal > .el-menu-item:nth-child(1) {
  margin-right: auto;
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

@media (max-width: 768px) {
  .menu-button {
    margin-right: 8px;
  }
}
</style>
