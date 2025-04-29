<template>
  <el-watermark :content="[user?.id, user?.userRole]" :font="font">
    <div class="common-layout">
      <el-container class="container">
        <el-header>
          <Header />
        </el-header>
        <el-container>
          <el-aside class="aside" width="250px">
            <Aside />
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
import Header from '@/components/Header.vue';
import { reactive, watchEffect } from 'vue';
import { getUser } from '@/global/UserStatue.ts';
import { useRouter } from 'vue-router';

const router = useRouter();
import { UserModel } from '@/models/UserModels';
import Aside from '@/components/Aside.vue';


const font = reactive({
  color: 'rgba(0, 0, 0, .15)'
});

let user = reactive({} as UserModel);
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

/* 定义手机尺寸的断点，这里以768px以下为手机大小 */
@media (max-width: 768px) {
  .aside {
    display: none; /* 隐藏元素 */
  }
}
</style>
