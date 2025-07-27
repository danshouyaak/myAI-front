<template>
  <div class="new-message-container">
    <div class="welcome-section">
      <el-empty
        :image="getAssetsFile('NewMessage.svg')"
        :image-size="isMobile ? 200 : 300"
        class="welcome-empty"
      >
        <template #description>
          <h2 class="welcome-title">欢迎使用MyAI</h2>
          <p class="welcome-subtitle">输入你的问题，开始智能对话</p>
        </template>
      </el-empty>
    </div>


    <div class="input-section">
      <div class="input-wrapper">
        <el-input
          v-model="input"
          :autosize="{ minRows: 1, maxRows: 3 }"
          class="message-input"
          clearable
          placeholder="输入你的问题，按 Ctrl+Enter 发送..."
          type="textarea"
          @keydown="handleKeydown"
        />
        <div class="button-group">
          <div class="ai-info">
            <el-icon class="ai-icon">
              <ChatRound />
            </el-icon>
            <span class="ai-name">MyAI 智能助手</span>
          </div>
          <el-button
            :disabled="!input.trim()"
            class="send-button"
            type="primary"
            @click="handleNewMessages()"
            :loading="isCreating"
          >
            <el-icon>
              <Position />
            </el-icon>
            {{ isCreating ? '创建中...' : '发送' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request.ts';
import { getAssetsFile } from '@/utils/pub-use.ts';
import {
  newConversationId,
  newConversationMessage,
} from '@/global/MessageCommon.ts';
import { getUser } from '@/global/UserStatue';
import { Position, ChatRound } from '@element-plus/icons-vue';

const router = useRouter();
const input = ref('');
const isMobile = ref(false);
const isCreating = ref(false);

// 默认AI模型ID（可以设置为您的默认AI助手）
const DEFAULT_AI_ID = 1;

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 立即检查一次移动端状态
checkMobile();

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+Enter 或 Cmd+Enter 发送消息
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    handleNewMessages();
  }
};

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const handleNewMessages = async () => {
  if (!input.value.trim()) {
    ElMessage.warning('请输入您的问题');
    return;
  }

  // 检查用户是否已登录
  const user = getUser();
  if (!user) {
    ElMessage.error('请先登录');
    router.push('/login');
    return;
  }

  isCreating.value = true;

  try {
    console.log('🚀 创建新会话...');

    // 创建新会话，使用默认AI模型
    const result = await request.post('/conversation/addConversation', {
      aiId: DEFAULT_AI_ID
    });

    if (result.code === 0) {
      console.log('✅ 会话创建成功，ID:', result.data);

      // 设置新会话信息
      const conversationId = result.data;
      const messageContent = input.value;

      // 确保清空旧的状态，设置新的会话信息
      newConversationId.value = conversationId;
      newConversationMessage.value = messageContent;

      console.log('📝 设置新会话信息:', {
        conversationId,
        messageContent,
        newConversationId: newConversationId.value,
        newConversationMessage: newConversationMessage.value
      });

      // 清空输入框
      input.value = '';

      // 跳转到聊天页面
      console.log('🔄 跳转到聊天页面:', `/main/${conversationId}`);
      await router.push(`/main/${conversationId}`);

      ElMessage.success('会话创建成功');
    } else {
      throw new Error(result.message || '创建会话失败');
    }
  } catch (error) {
    console.error('❌ 创建会话失败:', error);
    ElMessage.error('创建会话失败，请重试');
  } finally {
    isCreating.value = false;
  }
};
</script>

<style scoped>
.new-message-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
  overflow: hidden;
}

.welcome-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.welcome-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

/* AI信息显示样式 */
.ai-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.ai-icon {
  color: #409eff;
  font-size: 16px;
}

.ai-name {
  font-weight: 500;
}

/* 输入区域容器样式 */
.input-section {
  width: 100%;
  padding: 20px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
  position: sticky;
  bottom: 0;
}

/* 输入框包装器样式 */
.input-wrapper {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  box-sizing: border-box;
}

.message-input {
  margin-bottom: 12px;
}

.message-input :deep(.el-textarea__inner) {
  min-height: 60px !important;
  padding: 16px;
  font-size: 16px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
  resize: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.message-input :deep(.el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.button-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
}



.send-button {
  padding: 8px 24px;
  font-size: 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.send-button :deep(.el-icon) {
  font-size: 16px;
}

/* 响应式设计 - 移动端样式 */
@media (max-width: 768px) {
  .welcome-section {
    padding: 15px;
  }

  .welcome-empty {
    padding: 15px 0;
  }

  .welcome-title {
    font-size: 18px;
  }

  .welcome-subtitle {
    font-size: 13px;
  }

  .ai-info {
    font-size: 13px;
  }

  .ai-icon {
    font-size: 14px;
  }

  .input-section {
    padding: 12px;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    box-sizing: border-box;
    background-color: #fff;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  }

  .input-wrapper {
    padding: 0;
    max-width: 100%;
  }

  .message-input {
    margin-bottom: 8px;
    width: 100%;
  }

  .message-input :deep(.el-textarea__inner) {
    width: 100%;
    min-height: 45px !important;
    padding: 12px;
    font-size: 14px;
    border-radius: 8px;
    box-sizing: border-box;
  }



  .send-button {
    padding: 6px 16px;
    font-size: 13px;
    height: 32px;
  }

  .send-button :deep(.el-icon) {
    font-size: 14px;
  }
}

/* 适配超小屏幕设备 */
@media (max-width: 320px) {
  .welcome-section {
    padding: 12px;
  }


  .input-section {
    padding: 8px;
  }

  .input-wrapper {
    padding: 0;
    width: 100%;
  }

  .welcome-title {
    font-size: 18px;
  }

  .welcome-subtitle {
    font-size: 13px;
  }

  .message-input :deep(.el-textarea__inner) {
    padding: 10px;
    font-size: 13px;
    min-height: 40px !important;
  }


  .send-button {
    padding: 4px 12px;
    font-size: 12px;
    height: 28px;
  }

  .button-group {
    gap: 8px;
  }
}

/* 处理键盘弹出时的布局 */
@media (max-height: 400px) {
  .welcome-section {
    display: none;
  }

  .input-section {
    position: fixed;
    bottom: 0;
  }
}
</style>
