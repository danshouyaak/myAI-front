<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { ElMessage, FormRules } from 'element-plus';
import requests from '@/utils/request.ts';
import { useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';

const router = useRouter();
const loading = ref(false);

interface FormData {
  userAccount: string;
  userPassword: string;
  checkPassword: string;
}

const formData = reactive<FormData>({
  userAccount: '',
  userPassword: '',
  checkPassword: ''
});

const rules = reactive<FormRules<FormData>>({
  userAccount: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  userPassword: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  checkPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== formData.userPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
});

const handleRegister = async () => {
  loading.value = true;
  try {
    const res = await requests.post('/user/register', formData);
    if (res.code === 40000) {
      ElMessage.error(res.message);
      return;
    }
    router.push('/login');
    ElMessage.success(res.message);
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
        <h2>创建账号</h2>
        <p class="subtitle">注册一个新账号开始使用</p>
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
        <el-form-item label="确认密码" prop="checkPassword">
          <el-input
            v-model="formData.checkPassword"
            :prefix-icon="Lock"
            placeholder="请再次输入密码"
            show-password
            type="password"
          />
        </el-form-item>
        <div class="form-actions">
          <el-button
            :loading="loading"
            class="register-button"
            type="primary"
            @click="handleRegister"
          >
            注册
          </el-button>
          <el-link
            class="login-link"
            href="/login"
            type="primary"
          >
            已有账号？返回登录
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

.register-button {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  font-size: 16px;
}

.login-link {
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
