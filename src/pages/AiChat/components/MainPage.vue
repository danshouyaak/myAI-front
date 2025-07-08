<template>
  <div class="main-container">
    <epx-layout class="chat-layout">
      <epx-header class="chat-header">
        <epx-space>
          <epx-avatar :size="40" :src="getAIModel().avatar" />
          <epx-text size="large">{{ getAIModel().name }}</epx-text>
        </epx-space>
      </epx-header>

      <epx-main class="chat-main">
        <epx-scrollbar ref="messageContainer" class="message-container">
          <epx-watermark
            :content="['blog', 'https://danshouyaak.github.io/']"
            :font="{fontSize: 16}"
            class="watermark-container"
          >
            <div class="messages-wrapper">
              <div v-for="(list, index) in msgList" :key="index">
                <div class="message-list">
                  <epx-chat
                    v-for="(msg, msgIndex) in list.list"
                    :key="msgIndex"
                    :avatar="msg.type === 'user' ? getAIModel().avatar : 'src/assets/userAvatar.png'"
                    :content="marked.parse(msg.msg)"
                    :position="msg.type === 'my' ? 'right' : 'left'"
                    :timestamp="msg.time"
                  >
                    <template #username>
                      {{ msg.type === 'user' ? 'AI助手' : '我' }}
                    </template>
                  </epx-chat>
                </div>
              </div>
            </div>
          </epx-watermark>
        </epx-scrollbar>
      </epx-main>

      <epx-footer class="chat-footer">
        <epx-card class="input-card" shadow="never">
          <epx-input
            v-model="input"
            :autosize="{ minRows: 1, maxRows: 4 }"
            :rows="3"
            clearable
            placeholder="输入您的问题，按Enter发送"
            type="textarea"
            @keyup.enter.prevent="handleSSESubmit"
          >
            <template #prefix>
              <epx-icon>
                <Search />
              </epx-icon>
            </template>
          </epx-input>

          <epx-space alignment="end" class="button-group">
            <epx-button
              :disabled="!input.trim()"
              :icon="Position"
              :loading="loading"
              round
              type="primary"
              @click="handleSSESubmit"
            >
              发送
            </epx-button>
          </epx-space>
        </epx-card>
      </epx-footer>
    </epx-layout>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue';
import { Position, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { Marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/foundation.css';
import 'highlight.js/styles/atom-one-dark.css';
import { markedHighlight } from 'marked-highlight';
import { aiModel, getAIModel } from '../../../global/aiCommon';
import { useRouter } from 'vue-router';
import { getUser } from '../../../global/UserStatue';
import {
  EpxLayout,
  EpxHeader,
  EpxMain,
  EpxFooter,
  EpxCard,
  EpxInput,
  EpxButton,
  EpxSpace,
  EpxScrollbar,
  EpxWatermark,
  EpxChat,
  EpxAvatar,
  EpxText,
  EpxIcon
} from 'vue-element-plus-x';

interface Message {
  type: 'my' | 'user';
  time: string;
  msg: string;
}

interface ChatList {
  username: string;
  list: Message[];
}

interface MessageContainer {
  wrapRef: HTMLElement;
  scrollHeight: number;
  scrollTo: (options: ScrollToOptions) => void;
}

const router = useRouter();

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      const language = hljs.getLanguage(lang) ? lang : 'shell';
      return hljs.highlight(code, { language }).value;
    }
  })
);

const messageContainer = ref<MessageContainer | null>(null);
const value = ref('### 自定义redis序列化器\n' +
  '\n' +
  '```java\n' +
  '/**\n' +
  ' * 自定义redis序列化器\n' +
  ' */\n' +
  '@Configuration\n' +
  'public class RedisTemplateConfig {\n' +
  '    @Bean\n' +
  '    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory redisConnectionFactory) {\n' +
  '//        指定k:v键值对\n' +
  '        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();\n' +
  '//        设置连接工厂\n' +
  '        redisTemplate.setConnectionFactory(redisConnectionFactory);\n' +
  '//        设置序列化器\n' +
  '        redisTemplate.setKeySerializer(new StringRedisSerializer());\n' +
  '        return redisTemplate;\n' +
  '    }\n' +
  '}\n' +
  '```');
const articleDetails = ref<string>();
articleDetails.value = marked.parse(value.value) as string;

// 是否在回答中
const isAnswering = ref(false);

// 格式化时间
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 月份从0开始
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// 发送信息的bottom loading
const loading = ref(false);

onMounted(async () => {
  // await checkTest();
});

const handleSSESubmit = async () => {
  if (isAnswering.value) {
    ElMessage.error('在回答中请稍等！！！');
    return;
  }
  if (input.value.trim() == '') {
    ElMessage.error('输入内容不能为空！！！');
    return;
  }

  if (getUser() == null) {
    ElMessage.error('请先登录！！！');
    router.push('/login');
    return;
  }

  console.log('getUser()', getUser());

  const aiModelInstance: aiModel = getAIModel();
  const eventSource = new EventSource(
    'http://localhost:8024/Hello/GetHello/sse' +
    `?content=${input.value}&modelId=${aiModelInstance.id}`
  );
  isAnswering.value = true;

  const newProblem: Message = {
    type: 'my',
    time: formatDate(new Date()),
    msg: input.value
  };

  const currentChat = msgList.value[0];
  if (currentChat && Array.isArray(currentChat.list)) {
    currentChat.list.push(newProblem);

    input.value = '';
    loading.value = true;

    const newAnswer: Message = {
      type: 'user',
      time: formatDate(new Date()),
      msg: ''
    };
    currentChat.list.push(newAnswer);

    eventSource.onmessage = function(event) {
      const data = JSON.parse(event.data);
      console.log('event:', data);
      console.log('eventData:', data.choices[0].delta.content);

      const messageContainerVal = messageContainer.value;
      if (messageContainerVal && currentChat.list.length > 0) {
        const lastMessage = currentChat.list[currentChat.list.length - 1];
        lastMessage.msg += data.choices[0].delta.content;

        nextTick(() => {
          messageContainerVal.scrollTo({
            top: messageContainerVal.scrollHeight,
            behavior: 'smooth'
          });
        });
      }
    };
  }

  console.log('msgList', msgList);
  eventSource.onerror = function(event) {
    console.log('error:', event);
    if (event.eventPhase === EventSource.CLOSED) {
      console.log('关闭连接');
      loading.value = false;
      isAnswering.value = false;
      eventSource.close();
    }
  };
};

const msgList = ref<ChatList[]>([
  {
    username: '王小虎',
    list: []
  }
]);
const input = ref('');
</script>

<style scoped>
.main-container {
  height: 100%;
  background-color: var(--epx-bg-color);
}

.chat-layout {
  height: 100%;
}

.chat-header {
  padding: 12px 24px;
  border-bottom: 1px solid var(--epx-border-color);
  background-color: var(--epx-bg-color);
}

.chat-main {
  padding: 0;
  height: calc(100vh - 180px);
  overflow: hidden;
}

.message-container {
  height: 100%;
  padding: 20px;
}

.watermark-container {
  min-height: 100%;
}

.messages-wrapper {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

:deep(.epx-chat) {
  max-width: 80%;
}

:deep(.epx-chat-message) {
  background-color: var(--epx-bg-color-overlay);
  border-radius: 12px;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

:deep(.epx-chat-message:hover) {
  transform: translateY(-2px);
}

:deep(.markdown-content) {
  line-height: 1.6;
}

:deep(.markdown-content pre) {
  margin: 8px 0;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--epx-color-info-light-9);
  overflow-x: auto;
  font-family: Monaco, Consolas, Courier New, monospace;
}

.chat-footer {
  border-top: 1px solid var(--epx-border-color);
  padding: 16px;
  background-color: var(--epx-bg-color);
}

.input-card {
  max-width: 900px;
  margin: 0 auto;
  background-color: var(--epx-bg-color-overlay);
  border: 1px solid var(--epx-border-color-light);
}

.button-group {
  margin-top: 12px;
}

:deep(.epx-textarea__inner) {
  min-height: 40px !important;
  resize: none;
  border-radius: 8px;
}

/* 暗色主题适配 */
:deep(.dark) {
  .epx-chat-message {
    background-color: var(--epx-bg-color-overlay);
  }

  .input-card {
    background-color: var(--epx-bg-color);
  }

  .markdown-content pre {
    background-color: var(--epx-bg-color);
  }
}
</style>
