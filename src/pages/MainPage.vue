<template>
  <div class="main-container">
    <div class="message-container">
      <BubbleList
        :list="transformedList"
        :max-height="'calc(85vh - 80px)'"
        class="bubble-list"
      />
    </div>
    <div class="sendMeg-container">
      <Sender
        v-model="input"
        :loading="loading"
        placeholder="请输入消息..."
        @click="startStream1()"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref, watchEffect, computed, onUnmounted } from 'vue';
import { Position, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';
import { aiModel, getAIModel } from '@/global/aiCommon.ts';
import { getUser } from '@/global/UserStatue.ts';
import {
  conversationId,
  getMsgList,
  isShowMessage,
  msgList,
  newConversationId,
  newConversationMessage,
  setMessageList
} from '@/global/MessageCommon.ts';
import { getAssetsFile } from '@/utils/pub-use.ts';
import { aiModels } from '@/models/AIModel.d.ts';
import request from '@/utils/request.ts';
import { BubbleList, useSend, XRequest } from 'vue-element-plus-x';
import type { BubbleListItemProps } from 'vue-element-plus-x';

type MessageType = BubbleListItemProps & {
  key: number;
  role: 'user' | 'ai';
};

const route = useRoute();
const input = ref('');
const loading = ref(false);
const isAnswering = ref(false);
const requestUrl = ref(import.meta.env.MODE === 'development' ? 'http://localhost:8024' : 'http://47.119.128.91:8024');

const transformedList = computed(() => {
  if (!msgList.value || !msgList.value[0] || !msgList.value[0].list) return [];
  return msgList.value[0].list.map((msg, index) => {
    const isLatestMessage = index === msgList.value[0].list.length - 1;
    const isNewAIMessage = msg.messageType === 'ai' && isLatestMessage && loading.value;

    return {
      key: index,
      role: msg.messageType as 'user' | 'ai',
      placement: msg.messageType === 'ai' ? 'start' : 'end',
      content: msg.messageContent,
      loading: false,
      shape: 'corner',
      variant: msg.messageType === 'ai' ? 'filled' : 'outlined',
      isMarkdown: true,
      typing: isNewAIMessage, // 只在最新的 AI 消息且正在加载时启用打字机效果
      isFog: msg.messageType === 'ai',
      avatar: msg.messageType === 'ai' ? getAssetsFile(msg.aiUrl) : getAssetsFile('userAvatar.png'),
      avatarSize: '24px',
      avatarGap: '12px',
      time: msg.sendTime
    };
  }) as MessageType[];
});

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

let finish = () => {
};

// 创建一个controller用于中止请求
const abortController = ref(null);

const abortRequest = () => {
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
  }
};

const startStream1 = async () => {
  if (isAnswering.value) {
    ElMessage.error('在回答中请稍等！！！');
    return;
  }

  if (!input.value || input.value.trim() === '') {
    ElMessage.error('输入内容不能为空！！！');
    return;
  }

  if (getUser() === null) {
    ElMessage.error('请先登录！！！');
    return;
  }

  if (!newConversationId.value) {
    ElMessage.error('请先创建新的对话！！！');
    return;
  }

  const aiModelInstance = await getAIModel();
  if (!aiModelInstance) {
    ElMessage.error('获取AI模型失败');
    return;
  }

  let reader;
  try {
    isAnswering.value = true;
    loading.value = true;  // 开始加载
    const currentInput = input.value;  // 保存当前输入
    input.value = '';  // 立即清空输入框

    const newProblem = {
      messageType: 'user',
      messageTime: formatDate(new Date()),
      messageContent: currentInput  // 使用保存的输入
    };

    if (msgList.value.length === 0) {
      msgList.value.push({
        list: []
      });
    }
    msgList.value[0].list.push(newProblem);

    const newAnswer = {
      messageType: 'ai',
      messageTime: formatDate(new Date()),
      messageContent: ''
    };
    msgList.value[0].list.push(newAnswer);

    const response = await fetch(`${requestUrl.value}/Hello/stream?content=${currentInput}&modelId=${aiModelInstance.id}&conversationId=${newConversationId.value}`, {
      credentials: 'include',
      timeout: 3000
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log('Stream completed');
        loading.value = false;  // 在流完成时关闭 loading
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lastMessage = msgList.value[0].list[msgList.value[0].list.length - 1];
      if (lastMessage.messageType === 'ai') {
        lastMessage.messageContent += chunk;
      }

      // 滚动到底部
      await nextTick();
      const container = document.querySelector('.message-list');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  } catch (error) {
    console.error('Stream error:', error);
    ElMessage.error('请求失败，请稍后重试');
    loading.value = false;  // 出错时关闭 loading
  } finally {
    if (reader) {
      reader.releaseLock(); // 只在 reader 存在时释放锁定
    }
    isAnswering.value = false;
  }
};

const { send, loading: sendLoading, abort, finish: _finish } = useSend({
  sendHandler: startStream1,
  abortHandler: abortRequest  // 使用新的abort函数
});

// 给顶层变量赋值
finish = _finish;

// 在组件卸载时取消流
onUnmounted(() => {
  abortRequest();  // 使用新的abort函数
});

// 添加调试代码
onMounted(() => {
  requestUrl.value = import.meta.env.MODE === 'development' ? 'http://localhost:8024' : 'http://47.119.128.91:8024';
  console.log('API URL:', requestUrl.value);
  console.log('当前cookie:', document.cookie);

  // 测试请求
  fetch(`${requestUrl.value}/user/get/login`, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('测试请求响应头:', response.headers);
    console.log('测试请求状态:', response.status);
    return response.json();
  }).then(data => {
    console.log('测试请求响应:', data);
  }).catch(err => {
    console.error('测试请求失败:', err);
  });

  if (newConversationId.value && newConversationMessage.value) {
    input.value = newConversationMessage.value;
    conversationId.value = newConversationId.value;
    newConversationMessage.value = '';
    getMessageByConversationId(newConversationId.value);
  }
});

const getMessageByConversationId = async (conversationId: string) => {
  newConversationId.value = conversationId;
  console.log('getMessageByConversationId', conversationId);
  const response = await request.get('/message/getMessage/list', { params: { conversationId } });
  setMessageList(response.data);
  await startStream1();
};
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  height: 85vh;
  overflow: hidden;
}

.message-container {
  flex: 1;
  overflow: hidden;
}

.bubble-list {
  height: 100%;
  padding: 20px;
}

.sendMeg-container {
  padding: 20px;
  border-top: #e5e7eb 1px solid;
  background: white;
}
</style>
