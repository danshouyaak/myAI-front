<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { FormRules } from 'element-plus';
import requests from '@/utils/request.ts';
import { useRouter } from 'vue-router';
import { getUser, setUser } from '@/global/UserStatue.ts';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';

const router = useRouter();
const loading = ref(false);

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
  loading.value = true;
  try {
    const res = await requests.post('/user/login', formData);
    if (res.code === 40000) {
      ElMessage.error(res.message);
      return;
    }
    console.log(res);
    ElMessage.success(res.message);
    setUser(res);
    router.push('/NewMessage');
  } catch (err) {
    console.log(err);
  } finally {
    loading.value = false;
  }
};

</script>

<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-header">
        <img alt="Logo" class="logo" src="@/assets/MyAIlogin.svg" />
        <h2>欢迎回来</h2>
        <p class="subtitle">登录您的账号以继续使用</p>
      </div>
      <el-form
        :model="formData"
        :rules="rules"
        class="login-form"
        label-position="top"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="userAccount">
          <el-input
            v-model="formData.userAccount"
            :prefix-icon="User"
            placeholder="请输入用户名"
          />
        </el-form-item>
        <el-form-item label="密码" prop="userPassword">
          <el-input
            v-model="formData.userPassword"
            :prefix-icon="Lock"
            placeholder="请输入密码"
            show-password
            type="password"
          />
        </el-form-item>
        <div class="form-actions">
          <el-button
            :loading="loading"
            class="login-button"
            type="primary"
            @click="handleLogin()"
          >
            登录
          </el-button>
          <el-link
            class="register-link"
            href="/register"
            type="primary"
          >
            还没有账号？立即注册
          </el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-content {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 120px;
  height: auto;
  margin-bottom: 20px;
}

.login-header h2 {
  font-size: 24px;
  color: #333;
  margin: 0 0 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.login-form {
  width: 100%;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid #dcdfe6;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #409eff;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 30px;
}

.login-button {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  font-size: 16px;
}

.register-link {
  text-align: center;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-content {
    padding: 30px 20px;
    margin: 20px;
  }

  .logo {
    width: 100px;
  }

  .login-header h2 {
    font-size: 20px;
  }
}
</style>
