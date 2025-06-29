<template>
  <div class="new-message-container">
    <div class="welcome-section">
      <el-empty
        :image="getAssetsFile('NewMessage.svg')"
        :image-size="isMobile ? 200 : 300"
        class="welcome-empty"
      >
        <template #description>
          <h2 class="welcome-title">欢迎使用AI小助手</h2>
          <p class="welcome-subtitle">请输入你的问题，帮你深度解答</p>
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
          placeholder="输入你的问题..."
          type="textarea"
        />
        <div class="button-group">
          <el-tag class="model-tag" size="small">
            <el-icon>
              <ChatRound />
            </el-icon>
            长思考 (k1.5)
          </el-tag>
          <el-button
            :disabled="!input.trim()"
            class="send-button"
            type="primary"
            @click="handleNewMessages()"
          >
            <el-icon>
              <Position />
            </el-icon>
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getAssetsFile } from '@/utils/pub-use.ts';
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAIModel } from '@/global/aiCommon.ts';
import request from '@/utils/request.ts';
import {
  conversationId,
  newConversationId,
  newConversationMessage,
  setConversationId, setMessageList
} from '@/global/MessageCommon.ts';
import { Position, ChatRound } from '@element-plus/icons-vue';

const router = useRouter();
const input = ref('');
const isMobile = ref(false);

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 监听窗口大小变化
onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const handleNewMessages = async () => {
  if (!input.value.trim()) return;

  try {
    const model: any = getAIModel();
    const result = await request.post('/conversation/addConversation', {
      aiId: model.id
    });

    newConversationId.value = result.data;
    newConversationMessage.value = input.value;
    router.push(`/main/${newConversationId.value}`);
  } catch (error) {
    console.error('创建会话失败:', error);
  }
};
// const getMessageByConversationId = async (conversationId: string) => {
//   newConversationId.value = conversationId;
//   console.log('getMessageByConversationId', conversationId);
//   const response = await request.get('/message/getMessage/list', { params: { conversationId } });
//   setMessageList(response.data);
// };

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

/* 输入区域容器样式 */
.input-section {
  width: 100%; /* 确保容器占满父元素宽度 */
  padding: 20px; /* 设置内边距，给内容留出空间 */
  background-color: #fff; /* 白色背景 */
  border-top: 1px solid #f0f0f0; /* 顶部边框分隔线 */
  position: sticky; /* 粘性定位，滚动时保持在底部 */
  bottom: 0;
}

/* 输入框包装器样式 */
.input-wrapper {
  width: 100%; /* 确保包装器占满容器宽度 */
  max-width: 800px; /* 限制最大宽度，保持良好的阅读体验 */
  margin: 0 auto; /* 水平居中 */
  box-sizing: border-box; /* 确保padding和border计入宽度计算 */
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

.model-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background-color: #f5f7fa;
  border: none;
  color: #666;
}

.model-tag :deep(.el-icon) {
  margin-right: 4px;
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

/* 响应式设计 - 移动端样式（屏幕宽度 ≤ 768px） */
@media (max-width: 768px) {
  .welcome-section {
    padding: 16px; /* 减小欢迎区域的内边距 */
  }

  .welcome-title {
    font-size: 20px;
  }

  .welcome-subtitle {
    font-size: 14px;
  }

  .input-section {
    padding: 12px; /* 减小输入区域的内边距 */
    position: fixed; /* 固定定位，确保始终在底部 */
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%; /* 确保占满屏幕宽度 */
    box-sizing: border-box; /* 将padding计入宽度计算 */
    background-color: #fff;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05); /* 添加顶部阴影，提升层次感 */
  }

  /* 移动端输入框包装器样式调整 */
  .input-wrapper {
    padding: 0; /* 移除内边距 */
    max-width: 100%; /* 允许占满父容器宽度 */
  }

  /* 移动端消息输入框样式 */
  .message-input {
    margin-bottom: 8px; /* 减小底部间距 */
    width: 100%; /* 确保输入框占满容器宽度 */
  }

  /* 移动端文本域样式调整 */
  .message-input :deep(.el-textarea__inner) {
    width: 100%; /* 确保文本域占满容器宽度 */
    min-height: 45px !important; /* 设置最小高度 */
    padding: 12px; /* 设置内边距 */
    font-size: 14px; /* 调整字体大小 */
    border-radius: 8px; /* 圆角边框 */
    box-sizing: border-box; /* 确保padding计入宽度计算 */
  }

  .model-tag {
    padding: 4px 8px;
    font-size: 12px;
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

/* 适配超小屏幕设备（屏幕宽度 ≤ 320px） */
@media (max-width: 320px) {
  .welcome-section {
    padding: 12px;
  }

  .input-section {
    padding: 8px; /* 进一步减小内边距 */
    width: 100%; /* 确保占满屏幕宽度 */
    box-sizing: border-box; /* 将padding计入宽度计算 */
  }

  .input-wrapper {
    padding: 0; /* 移除内边距 */
    width: 100%; /* 确保占满容器宽度 */
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

  .model-tag {
    padding: 3px 6px;
    font-size: 11px;
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
