<template>
  <div
    style="
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    "
  >
    <div class="container">
      <div class="aside">
        <div class="flex flex-wrap gap-4">
          <el-card v-for="model in aiModel " :key="model.id" :class="{ 'isSelectMode': model.id === selectModelId }" shadow="hover"
                   @click="f(model)">
            <template #header>
              <el-avatar :src="model.avatar" size="large" />
              <el-text class="mx-1" size="large" tag="b">{{ model.name }}</el-text>
            </template>
            <template #default>
              <el-text class="mx-1" size="large" tag="b">{{ model.description }}</el-text>
            </template>
          </el-card>
        </div>
      </div>
      <div class="main">
        <MainPage />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import MainPage from './components/MainPage.vue';
import { setAIModel } from '../../global/aiCommon.ts';

const aiModel = ref([
  {
    id: 1,
    name: 'AI. 张医生',
    avatar: 'src/assets/doctor.png',
    description: '当医生已经30年了'
  },
  {
    id: 2,
    name: 'AI. 数学家',
    avatar: 'src/assets/Mathematician.png',
    description: '具有多年的数学经验'
  }
]);

const selectModelId = ref(1);

function f(model) {
  selectModelId.value = model.id;
  setAIModel(model);
}
</script>
<style scoped>
.container {
  display: flex;
  width: 98%;
  height: 95%;
  border: #e5e7eb 1px solid;
  box-shadow: 3px 3px 3px rgba(229, 231, 235, 1); /* 添加阴影 */
}

.aside {
  min-width: 260px;
  overflow: auto;
  border-right: #dfdfdf 1px solid;
  //background-color: darkkhaki;
}

.main {
  flex: 5;
}

.isSelectMode {
  background-color: rgba(0, 255, 196, 0.49);
}
</style>
