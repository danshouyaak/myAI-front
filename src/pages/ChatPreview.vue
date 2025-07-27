<template>
  <div class="chat-preview-container">
    <!-- 头部信息 -->
    <div class="chat-header">
      <div class="model-info">
        <div class="model-avatar">
          <img :alt="modelInfo.name" :src="getAssetsFile(modelInfo.icon)" />
        </div>
        <div class="model-details">
          <h2 class="model-name">和{{ modelInfo.name }}的对话</h2>
          <p class="model-desc">{{ modelInfo.description }}</p>
        </div>
      </div>
    </div>

    <!-- 聊天内容区域 -->
    <div ref="chatContent" class="chat-content">
      <div class="message assistant">
        <div class="message-avatar">
          <img :alt="modelInfo.name" :src="getAssetsFile(modelInfo.icon)" />
        </div>
        <div class="message-content">
          <p>{{ welcomeMessage }}</p>
        </div>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="chat-footer">
      <!-- 提示词区域 -->
      <div class="prompts-section">
        <el-scrollbar>
          <div class="prompts-container">
            <el-tag
              v-for="prompt in prompts"
              :key="prompt.id"
              :effect="prompt.effect"
              :type="prompt.type"
              class="prompt-tag"
              @click="handlePromptClick(prompt)"
            >
              {{ prompt.title }}
            </el-tag>
          </div>
        </el-scrollbar>
      </div>

      <!-- 输入框区域 -->
      <div class="input-section">
        <el-input
          v-model="inputMessage"
          :autosize="{ minRows: 1, maxRows: 4 }"
          :rows="3"
          placeholder="输入你的问题..."
          type="textarea"
          @keyup.enter.native="handleSend"
        />
        <el-button :disabled="!inputMessage.trim()" :icon="Position" type="primary" @click="handleSend">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Position } from '@element-plus/icons-vue';
import { getAssetsFile } from '@/utils/pub-use';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();

// 从路由参数获取模型信息
const modelInfo = ref({
  id: route.query.modelId,
  name: route.query.modelName,
  icon: route.query.modelIcon,
  description: route.query.modelDesc,
  source: route.query.modelSource
});

// 根据模型类型设置欢迎语
const welcomeMessage = ref('');
onMounted(() => {
  switch (modelInfo.value.name) {
    case '医疗搜索':
      welcomeMessage.value = '你好！我是医疗搜索助手，我可以帮你搜索医疗文献、指南、教科书等，为医学类问题提供专业解答。';
      break;
    case '学术搜索':
      welcomeMessage.value = '你好！我是学术搜索助手，有什么学术问题我可以帮你解答吗？';
      break;
    default:
      welcomeMessage.value = `你好！我是${modelInfo.value.name}，很高兴为你服务。`;
  }
});

// 提示词列表
const prompts = ref([
  {
    id: 1,
    title: '帮我找一下高温热疗用来治疗癌症的文献',
    type: 'info',
    effect: 'light'
  },
  {
    id: 2,
    title: '70岁的邻居突然晕倒在地上，这种情况下我该怎么做？',
    type: 'warning',
    effect: 'light'
  },
  {
    id: 3,
    title: '二甲双胍最常见的副作用是什么？',
    type: 'success',
    effect: 'light'
  }
]);

const inputMessage = ref('');
const chatContent = ref<HTMLElement | null>(null);

// 处理提示词点击
const handlePromptClick = (prompt: any) => {
  inputMessage.value = prompt.title;
};

// 处理发送消息
const handleSend = async () => {
  if (!inputMessage.value.trim()) return;

  try {
    // 创建新会话
    const result = await request.post('/conversation/addConversation', {
      aiId: modelInfo.value.id,
      firstMessage: inputMessage.value
    });

    // 跳转到主聊天页面
    router.push(`/main/${result.data}`);
  } catch (error) {
    ElMessage.error('创建会话失败，请稍后重试');
    console.error('创建会话失败:', error);
  }
};
</script>

<style scoped>
.chat-preview-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.chat-header {
  padding: 16px 24px;
  background-color: #fff;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.model-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.model-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
}

.model-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-details {
  flex: 1;
}

.model-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.model-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.message.assistant {
  margin-right: auto;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  background: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 70%;
}

.message-content p {
  margin: 0;
  line-height: 1.5;
}

.chat-footer {
  background: #fff;
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 16px 24px;
}

.prompts-section {
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 16px;
}

.prompts-container {
  display: flex;
  gap: 8px;
  padding: 4px;
  flex-wrap: wrap;
}

.prompt-tag {
  cursor: pointer;
  white-space: normal;
  height: auto;
  padding: 6px 10px;
  margin: 4px;
}

.prompt-tag:hover {
  opacity: 0.8;
}

.input-section {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.input-section :deep(.el-textarea__inner) {
  border-radius: 8px;
  padding: 12px;
  min-height: 24px !important;
  resize: none;
}

.input-section .el-button {
  padding: 12px 24px;
  height: auto;
}

@media (max-width: 768px) {
  .chat-header {
    padding: 12px 16px;
  }

  .model-avatar {
    width: 40px;
    height: 40px;
  }

  .model-name {
    font-size: 16px;
  }

  .model-desc {
    font-size: 13px;
  }

  .chat-content {
    padding: 16px;
  }

  .message-content {
    max-width: 85%;
  }

  .chat-footer {
    padding: 12px 16px;
  }

  .input-section .el-button {
    padding: 8px 16px;
  }

  .prompt-tag {
    font-size: 12px;
    padding: 4px 8px;
  }
}
</style>
