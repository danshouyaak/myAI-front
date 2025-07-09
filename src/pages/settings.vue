<template>
  <div class="user-info-container">
    <el-card class="user-info-card">
      <template #header>
        <div class="card-header">
          <h2>个人信息</h2>
        </div>
      </template>

      <div class="user-profile">
        <!-- 用户头像 -->
        <div class="avatar-section">
          <el-avatar
            :size="100"
            :src="userInfo.userAvatar || defaultAvatar"
            @error="() => true"
            style="cursor: pointer"
            @click="handleAvatarClick"
          >
            {{ userInfo.userName?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <el-upload
            class="avatar-uploader"
            :action="`${baseURL}/file/uploadPhoto`"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <el-button type="primary" size="small" class="mt-2">更换头像</el-button>
          </el-upload>
        </div>

        <!-- 头像预览对话框 -->
        <el-dialog
          v-model="dialogVisible"
          :close-on-click-modal="true"
          :show-close="true"
          title="头像预览"
          width="400px"
        >
          <div style="text-align: center;">
            <img
              :src="userInfo.userAvatar || defaultAvatar"
              style="max-width: 100%; max-height: 400px; object-fit: contain;"
            />
          </div>
        </el-dialog>

        <!-- 用户基本信息 -->
        <el-form
          :model="userInfo"
          label-width="100px"
          class="user-form"
        >
          <el-form-item label="用户ID">
            <el-input v-model="userInfo.id" disabled />
          </el-form-item>

          <el-form-item label="用户名"
            :rules="[
              { required: true, message: '用户名不能为空', trigger: 'blur' },
              { min: 2, max: 16, message: '长度在 2 到 16 个字符', trigger: 'blur' }
            ]"
          >
            <el-input
              v-model="userInfo.userName"
              placeholder="请输入用户名"
              maxlength="16"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="用户角色">
            <el-tag :type="userInfo.userRole === 'admin' ? 'danger' : 'success'">
              {{ userInfo.userRole === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </el-form-item>

          <el-form-item label="注册时间">
            <span>{{ formatDate(userInfo.createTime) }}</span>
          </el-form-item>

          <el-form-item label="最近登录">
            <span>{{ formatDate(userInfo.updateTime) }}</span>
          </el-form-item>

          <!-- 可编辑信息 -->
          <el-form-item label="个人简介">
            <el-input
              v-model="userInfo.userProfile"
              type="textarea"
              :rows="3"
              :maxlength="200"
              show-word-limit
              resize="none"
              placeholder="请输入个人简介"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleUpdate">保存修改</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 使用统计 -->
      <div class="usage-statistics">
        <h3>使用统计</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>对话总数</template>
              <div class="statistic-value">{{ statistics.totalConversations || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>消息总数</template>
              <div class="statistic-value">{{ statistics.totalMessages || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>使用天数</template>
              <div class="statistic-value">{{ statistics.usageDays || 0 }}</div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import requests from '@/utils/request'
import defaultAvatar from '@/assets/userAvatar.png'

// 基础URL
const baseURL = import.meta.env.MODE === 'development' ? 'http://localhost:8024' : 'http://47.119.128.91:8024';

// 用户信息
const userInfo = ref({
  id: '',
  userName: '',
  userRole: '',
  userAvatar: '',
  createTime: '',
  updateTime: '',
  userProfile: ''
})

// 是否正在加载头像
const isAvatarLoading = ref(true);

// 预加载头像
const preloadAvatar = (url: string) => {
  if (!url) {
    isAvatarLoading.value = false;
    return;
  }
  const img = new Image();
  img.onload = () => {
    userInfo.value.userAvatar = url;
    isAvatarLoading.value = false;
  };
  img.onerror = () => {
    isAvatarLoading.value = false;
  };
  img.src = url;
};

// 使用统计
const statistics = ref({
  totalConversations: 0,
  totalMessages: 0,
  usageDays: 0
})

// 对话框显示状态
const dialogVisible = ref(false);

// 点击头像处理函数
const handleAvatarClick = () => {
  if (userInfo.value.userAvatar || defaultAvatar) {
    dialogVisible.value = true;
  }
};

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

// 获取用户信息
const getUserInfo = async () => {
  try {
    // 获取用户信息
    const res = await requests.get('/user/get/login')
    if (res.code === 0) {
      const userData = res.data;
      // 预加载头像
      preloadAvatar(userData.userAvatar);
      // 更新其他信息
      userInfo.value = {
        ...userData,
        userAvatar: '' // 先置空，等预加载完成后再设置
      };
    } else {
      ElMessage.error(res.message || '获取用户信息失败')
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || '获取用户信息失败'
    ElMessage.error(errorMsg)
  }
}

// 更新用户信息
const handleUpdate = async () => {
  const userName = userInfo.value.userName || '';
  if (!userName.trim()) {
    ElMessage.error('用户名不能为空')
    return
  }
  try {
    const res = await requests.post('/user/update', {
      userName: userName.trim(),
      userProfile: userInfo.value.userProfile || '',
      userAvatar: userInfo.value.userAvatar || null  // 添加头像URL
    })
    if (res.code === 0) {
      ElMessage.success('更新成功')
      // 刷新用户信息
      getUserInfo()
    } else {
      // 显示后端返回的错误信息
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error: any) {
    // 显示详细的错误信息
    const errorMsg = error.response?.data?.message || error.message || '更新失败'
    ElMessage.error(errorMsg)
  }
}

// 头像上传前的验证
const beforeAvatarUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJpgOrPng) {
    ElMessage.error('头像只能是 JPG 或 PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
  }
  return isJpgOrPng && isLt2M
}

// 头像上传成功的回调
const handleAvatarSuccess = (res: any) => {
  if (res.code === 0) {
    // 更新头像预览
    userInfo.value.userAvatar = res.data.url;
    ElMessage.success('头像上传成功，请点击保存修改以更新信息');
  } else {
    ElMessage.error(res.message || '头像上传失败');
  }
}

onMounted(() => {
  getUserInfo()
})
</script>

<style scoped>
.user-info-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.user-info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.user-profile {
  padding: 20px 0;
}

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.avatar-uploader {
  margin-top: 10px;
}

.user-form {
  max-width: 600px;
  margin: 0 auto;
}

.usage-statistics {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.usage-statistics h3 {
  margin-bottom: 20px;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.statistic-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-color-primary);
  text-align: center;
}

.mt-2 {
  margin-top: 8px;
}

.input-with-button {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.input-with-button .el-input {
  flex: 1;
}
</style>
