<template>
  <el-watermark :content="[user?.id, user?.userRole]" :font="font">
    <div class="common-layout">
      <el-container class="container">
        <el-header>
          <Header />
        </el-header>
        <el-container>
          <el-aside width="200px">
            <div class="flex flex-wrap gap-4">
              <el-card v-for="model in aiModel " :key="model.id" :class="{ 'isSelectMode': model.id === selectModelId }"
                       shadow="hover"
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
          </el-aside>
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
import { ref } from 'vue';
import { setAIModel } from '@/global/aiCommon.ts';
import Header from '@/components/Header.vue';
import { reactive, watch, onMounted, watchEffect } from 'vue';
import { getUser } from '@/global/UserStatue.ts';
import { useRouter } from 'vue-router';

const router = useRouter();
import { UserModel } from '@/models/UserModel';

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

function f(model: any) {
  selectModelId.value = model.id;
  setAIModel(model);
}

const font = reactive({
  color: 'rgba(0, 0, 0, .15)'
});

let user = reactive({} as UserModel);

onMounted(() => {
});
watchEffect(() => {
  user = getUser();
  if (user == null) {
    router.push('/login');
  }
});
</script>
<style scoped>
.container {
  height: 100vh;
  border: #e5e7eb 1px solid;
  box-shadow: 3px 3px 3px rgba(229, 231, 235, 1); /* 添加阴影 */
}

.isSelectMode {
  background-color: rgba(0, 255, 196, 0.49);
}
</style>
