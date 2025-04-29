<template>
  <el-menu
    :default-active="activeIndex"
    :ellipsis="false"
    class="el-menu-demo"
    mode="horizontal"
  >
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
const activeIndex = ref('1');
const handleSelect = (model: aiModel) => {
  console.log('handleSelect', model);
  setAIModel(model);
};


</script>

<style scoped>
.el-menu--horizontal > .el-menu-item:nth-child(1) {
  margin-right: auto;
}
</style>
