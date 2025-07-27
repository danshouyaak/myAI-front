<template>
  <div class="chat-container">
    <!-- 聊天内容区域 -->
    <div ref="messagesContainer" class="messages-container">
      <div v-for="message in messages" :key="message.id" :class="message.role" class="message">
        <div class="message-avatar">
          <img :alt="message.role" :src="getAssetsFile(message.avatar)" />
        </div>
        <div class="message-content">
          <p>{{ message.content }}</p>
        </div>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="input-area">
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
import { Position } from '@element-plus/icons-vue';
import { getAssetsFile } from '@/utils/pub-use';

// 消息列表
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    content: '你好！我是学术搜索助手，有什么学术问题我可以帮你解答吗？',
    avatar: 'Mathematician.png'
  }
]);

// 提示词列表
const prompts = ref([
  {
    id: 1,
    title: '2025年发表的使用CGSS数据的论文',
    type: 'info',
    effect: 'light'
  },
  {
    id: 2,
    title: '为什么实体癌是抗原受体-T细胞（CAR-T）疗法治疗的难点',
    type: 'warning',
    effect: 'light'
  },
  {
    id: 3,
    title: 'LLM+search，在HCI领域有什么最新的研究',
    type: 'success',
    effect: 'light'
  },
  {
    id: 4,
    title: '请解释一下量子计算的基本原理',
    type: 'info',
    effect: 'light'
  },
  {
    id: 5,
    title: '帮我找一下机器学习在医疗影像中的应用',
    type: 'warning',
    effect: 'light'
  }
]);

const inputMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

// 处理提示词点击
const handlePromptClick = (prompt: any) => {
  inputMessage.value = prompt.title;
};

// 处理发送消息
const handleSend = () => {
  if (!inputMessage.value.trim()) return;

  // 添加用户消息
  messages.value.push({
    id: messages.value.length + 1,
    role: 'user',
    content: inputMessage.value,
    avatar: 'userAvatar.png'
  });

  // 模拟AI回复
  setTimeout(() => {
    messages.value.push({
      id: messages.value.length + 1,
      role: 'assistant',
      content: '我正在分析这个问题，请稍等...',
      avatar: 'Mathematician.png'
    });
    scrollToBottom();
  }, 1000);

  // 清空输入
  inputMessage.value = '';
  scrollToBottom();
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    setTimeout(() => {
      messagesContainer.value!.scrollTop = messagesContainer.value!.scrollHeight;
    }, 100);
  }
};

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.messages-container {
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

.message.user {
  flex-direction: row-reverse;
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

.message.user .message-content {
  background: var(--el-color-primary);
  color: #fff;
}

.message-content p {
  margin: 0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.input-area {
  background: #fff;
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 16px 24px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
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
  .messages-container {
    padding: 16px;
  }

  .message-content {
    max-width: 85%;
  }

  .input-area {
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
