<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { FormRules } from 'element-plus';
import requests from '@/utils/request.ts';
import { useRouter } from 'vue-router';
import { getUser, setUser } from '@/global/UserStatue.ts';

const router = useRouter();

interface FormData {
  userAccount: string;
  userPassword: string;
}

const formData = reactive<FormData>({
  userAccount: '',
  userPassword: ''
});

const rules = reactive<FormRules<FormData>>({
  userAccount: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  userPassword: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
});

const handleLogin = async () => {
  // 这里可以添加登录逻辑，比如调用接口验证用户名和密码
  await requests.post('/user/login', formData).then((res) => {
    console.log('====', res);
    setUser(res);
    router.push('/');
  }).catch((err) => {
    console.log(err);
  });
};

</script>

<template>
  <div class="login-container">
    <el-row align="middle" justify="center" style="height: 100vh">
      <el-col :span="8">
        <el-card>
          <el-form :model="formData" :rules="rules" class="login-form" label-position="top" label-width="80px">
            <el-form-item label="用户名" prop="userAccount">
              <el-input v-model="formData.userAccount" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="密码" prop="userPassword">
              <el-input v-model="formData.userPassword" placeholder="请输入密码" type="password" />
            </el-form-item>
            <el-form-item>
              <el-button style="width: 100%; margin-bottom: 10px" type="primary" @click="handleLogin()">登录</el-button>
              <el-link href="/register" style="width: 100%; text-align: center" type="primary">立即注册</el-link>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.login-container {
  background: url('@/assets/loginBackground.svg') no-repeat center center;
  background-size: cover; /* 这行确保图片铺满整个容器 */
  height: 100vh; /* 这行确保容器高度为视口高度 */
}


.login-form {
  width: 100%;
}

</style>
