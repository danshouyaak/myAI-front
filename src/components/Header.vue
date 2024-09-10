<template>
  <el-page-header icon="">
    <template #content>
      <div class="flex items-center">
        <el-avatar
          :size="32"
          class="mr-3"
          src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
        />
        <span class="text-large font-600 mr-3"> Title </span>
        <span class="text-sm mr-2" style="color: var(--el-text-color-regular)">
          Sub title
        </span>
        <el-tag>Default</el-tag>
      </div>
    </template>
    <template #extra>
      <div class="flex items-center">
        <el-button @click="async ()=> { // 这里可以添加登录逻辑，比如调用接口验证用户名和密码
  await requests.post('/user/login', {userAccount:'test1',userPassword:'12345678'}).then((res) => {
    setUser(res);
    ElMessage.success('登录成功');
  }).catch((err) => {
    console.log(err);
  });
        }">续费登录
        </el-button>
        <el-button class="ml-2" type="primary" @click=" async ()=>{
           await requests.get('user/get/login', ).then((res) => {
             console.log('res',res);
    ElMessage.success('获取成功');
  }).catch((err) => {
    console.log(err);
  });
        }">获取登录状态
        </el-button>
      </div>
    </template>
  </el-page-header>

</template>
<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import requests from '@/utils/request.ts';
import { setUser } from '@/global/UserStatue.ts';

const router = useRouter();
</script>
<style scoped>

</style>
