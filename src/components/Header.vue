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
        :src="item.avatar"
        alt="Element logo"
        style="width: 100%"
      />
    </el-menu-item>
    <!--    <el-menu-item index="2">-->
    <!--      <el-text type="primary" style="font-weight: bold">-->
    <!--        AI数学家-->
    <!--      </el-text>-->
    <!--      <img-->
    <!--        style="width: 100%"-->
    <!--        src="@/assets/Mathematician.png"-->
    <!--        alt="Element logo"-->
    <!--      />-->
    <!--    </el-menu-item>-->
  </el-menu>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { aiModels } from '@/models/AIModel.d.ts';
import { aiModel, setAIModel } from '@/global/aiCommon.ts';

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
