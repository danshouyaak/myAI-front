<template>
  <div class="main-container">
    <!-- 聊天头部 - 显示当前AI角色 -->
    <div class="chat-header">
      <h3 class="chat-title">和{{ currentAiInfo.aiName || 'MyAI助手' }}的会话</h3>
    </div>

    <div class="message-container">
      <BubbleList
        :list="transformedList"
        :max-height="'calc(100vh - 200px)'"
        class="bubble-list"
      >
        <template #content="{ item }">
          <!-- 调试信息 -->
          <div v-if="item.role === 'ai'" style="font-size: 12px; color: #999; margin-bottom: 8px;">
            状态: 思考中={{ item.isThinking }}, 步骤数={{ (item.thinkingSteps || []).length }}, 有内容={{ !!item.content
            }}
          </div>

          <!-- AI 消息的自定义渲染 -->
          <div v-if="item.role === 'ai'" class="ai-message-content">
            <!-- 思考过程展示 -->
            <div v-if="item.isThinking || (item.thinkingSteps && item.thinkingSteps.length > 0)"
                 class="thinking-container">
              <!-- 思考过程头部 - 可点击展开/收起 -->
              <div
                :class="{ 'collapsed': !getThinkingExpanded(item.key) }"
                class="thinking-header"
                @click="toggleThinkingExpanded(item.key)"
              >
                <div class="thinking-header-content">
                  <span class="thinking-icon">🧠</span>
                  <span class="thinking-title">AI 思考过程</span>
                  <span class="thinking-count">({{ (item.thinkingSteps || []).length }} 个步骤)</span>
                  <span class="expand-icon">
                    <el-icon>
                      <ArrowDown v-if="getThinkingExpanded(item.key)" />
                      <ArrowRight v-else />
                    </el-icon>
                  </span>
                </div>
                <div v-if="!getThinkingExpanded(item.key) && (item.thinkingSteps || []).length > 0"
                     class="thinking-summary">
                  {{ getThinkingSummary(item.thinkingSteps) }}
                </div>
              </div>

              <!-- 思考步骤内容 - 可展开/收起 -->
              <el-collapse-transition>
                <div v-show="getThinkingExpanded(item.key)" class="thinking-steps">
                  <div v-for="step in (item.thinkingSteps || [])" :key="`${item.key}-${step.id}`" :class="step.status"
                       class="thinking-step">
                    <div class="thinking-step-header">
                      <span class="thinking-step-icon">{{ getStepIcon(step.type) }}</span>
                      <span class="thinking-step-title">{{ step.title }}</span>
                      <span v-if="step.timestamp" class="thinking-step-time">{{ step.timestamp }}</span>
                      <span v-if="step.isTyping" class="typing-indicator">⏳ 正在输入...</span>
                      <span v-else-if="step.status === 'loading'" class="typing-indicator">⏳</span>
                    </div>
                    <div class="thinking-step-content">
                      <!-- 打字机效果显示内容 -->
                      <div :class="{ 'typing': step.isTyping }" class="streaming-content">
                        <span v-html="formatDisplayContent(step.displayContent || '')"></span>
                        <span v-if="step.isTyping" class="cursor">|</span>
                      </div>
                    </div>
                  </div>
                </div>
              </el-collapse-transition>
            </div>

            <!-- 最终答案 -->
            <div v-if="item.content || item.isTypingAnswer" class="final-answer">
              <div class="answer-header">✅ 最终答案</div>
              <div :class="{ 'typing': item.isTypingAnswer }" class="streaming-content">
                <span v-html="formatDisplayContent(item.content || '')"></span>
                <span v-if="item.isTypingAnswer" class="cursor">|</span>
              </div>
            </div>

            <!-- 加载状态 -->
            <div v-if="item.loading && !item.isThinking" class="loading-indicator">
              <el-icon class="is-loading">
                <Loading />
              </el-icon>
              正在思考中...
            </div>
          </div>

          <!-- 用户消息的默认渲染 -->
          <div v-else v-html="item.content"></div>
        </template>
      </BubbleList>
    </div>

    <!-- 输入区域 -->
    <div class="sendMeg-container">
      <Sender
        v-model="input"
        :loading="loading"
        :placeholder="'输入问题，AI将通过思考和工具使用为您解答...'"
        @click="startStream1"
      >
        <template #suffix>
          <el-button
            v-if="isAnswering"
            :icon="isPaused ? 'el-icon-video-play' : 'el-icon-video-pause'"
            class="pause-button"
            type="text"
            @click="togglePause"
          >
            {{ isPaused ? '继续' : '暂停' }}
          </el-button>
        </template>
      </Sender>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref, watchEffect, computed, onUnmounted } from 'vue';
import { Loading, ArrowDown, ArrowRight } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';

import { getUser } from '@/global/UserStatue';
import {
  conversationId,
  getMsgList,
  isShowMessage,
  msgList,
  newConversationId,
  newConversationMessage,
  setMessageList
} from '@/global/MessageCommon';
import { getAssetsFile } from '@/utils/pub-use';
import { BubbleList, useSend, Thinking } from 'vue-element-plus-x';
import type { BubbleListItemProps } from 'vue-element-plus-x';
import defaultAvatar from '@/assets/userAvatar.png';
import aiLogo from '@/assets/MyAIlogin.svg';
import request from '@/utils/request.ts';

// AI信息类型定义
type AiInfo = {
  aiName: string;
  aiIcon: string;
  description?: string;
};

type MessageType = BubbleListItemProps & {
  key: number;
  role: 'user' | 'ai';
  // ReAct 思考相关字段
  isThinking?: boolean;
  thinkingSteps?: ThinkingStep[];
  finalAnswer?: string;
  isTypingAnswer?: boolean; // 最终答案是否正在打字
};

// 思考步骤类型
type ThinkingStep = {
  id: string;
  type: 'thinking' | 'action' | 'observation' | 'final';
  title: string;
  content: string;
  status: 'loading' | 'success' | 'error';
  timestamp?: string;
  isTyping?: boolean;
  displayContent?: string; // 当前显示的内容（用于打字机效果）
};

const route = useRoute();
const router = useRouter();
const input = ref('');
const loading = ref(false);
const isAnswering = ref(false);
const requestUrl = ref(import.meta.env.MODE === 'development' ? 'http://localhost:8024' : 'http://47.119.128.91:8024');

const userAvatar = ref('');
const currentUser = ref(null);

// AI信息状态
const currentAiInfo = ref<AiInfo>({
  aiName: 'MyAI助手',
  aiIcon: 'MyAIlogin.svg',
  description: ''
});

// 获取用户信息
const getUserInfo = async () => {
  try {
    // 首先尝试从本地存储获取用户信息
    const localUser = getUser();
    if (localUser) {
      console.log('📱 从本地存储获取用户信息:', localUser);
      currentUser.value = localUser;
      userAvatar.value = localUser.userAvatar || '';

      // 如果本地有用户信息，直接使用，不需要再请求API
      if (userAvatar.value) {
        console.log('✅ 使用本地存储的用户头像:', userAvatar.value);
        return;
      }
    }

    // 如果本地没有或者头像为空，则从API获取
    console.log('🌐 从API获取用户信息...');
    const res = await request.get('/user/get/login');
    if (res.code === 0) {
      console.log('📡 API返回用户信息:', res.data);
      currentUser.value = res.data;
      userAvatar.value = res.data.userAvatar || '';

      // 更新本地存储
      if (res.data) {
        localStorage.setItem('user', JSON.stringify({ data: res.data }));
        console.log('💾 已更新本地存储的用户信息');
      }
    }
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error);

    // API失败时，尝试使用本地存储的信息
    const localUser = getUser();
    if (localUser) {
      console.log('🔄 API失败，使用本地存储的用户信息');
      currentUser.value = localUser;
      userAvatar.value = localUser.userAvatar || '';
    }
  }
};

// 获取会话AI信息
const getConversationAiInfo = async (conversationId: string) => {
  if (!conversationId) {
    console.log('⚠️ 会话ID为空，使用默认AI信息');
    return;
  }

  try {
    console.log('🔍 获取会话AI信息:', conversationId);
    const response = await request.get(`/conversation/detail/${conversationId}`);

    console.log('📡 API响应:', response);

    if (response.code === 0 && response.data) {
      const conversationData = response.data;
      console.log('✅ 获取会话信息成功:', conversationData);

      // 更新AI信息
      const newAiInfo = {
        aiName: conversationData.aiName || 'MyAI助手',
        aiIcon: conversationData.aiIcon || 'MyAIlogin.svg',
        description: conversationData.description || ''
      };

      currentAiInfo.value = newAiInfo;
      console.log('🤖 更新AI信息:', currentAiInfo.value);
      console.log('🎯 当前显示的AI名称:', currentAiInfo.value.aiName);
    } else {
      console.warn('⚠️ 获取会话信息失败:', response.message);
      console.warn('📊 响应详情:', response);
    }
  } catch (error) {
    console.error('❌ 获取会话AI信息失败:', error);
    // 保持默认值
  }
};

// 添加打字机状态
const typingBuffer = ref('');
const displayedContent = ref('');
const typingSpeed = 50; // 打字速度（毫秒/字符）

// 打字机效果函数
const typeWriter = (text: string) => {
  return new Promise<void>((resolve) => {
    let index = 0;
    displayedContent.value = '';

    const type = () => {
      if (index < text.length) {
        displayedContent.value += text[index];
        index++;
        setTimeout(type, typingSpeed);
      } else {
        resolve();
      }
    };

    type();
  });
};

// 修改 transformedList 计算属性
const transformedList = computed(() => {
  if (!msgList.value || !msgList.value[0] || !msgList.value[0].list) return [];
  return msgList.value[0].list.map((msg, index) => {
    const isLatestMessage = index === msgList.value[0].list.length - 1;
    const isNewAIMessage = msg.messageType === 'ai' && isLatestMessage && loading.value;

    // 处理消息内容，支持换行
    let content = msg.messageContent || '';
    if (content) {
      content = content.split('\n').join('<br/>');
    }

    return {
      key: msg.key || index, // 使用消息的真实key，而不是index
      role: msg.messageType as 'user' | 'ai',
      placement: msg.messageType === 'ai' ? 'start' : 'end',
      content: content,
      finalAnswer: msg.finalAnswer,
      thoughts: msg.thoughts || [],
      loading: isNewAIMessage,
      avatar: msg.messageType === 'ai' ? getAiAvatar() : getUserAvatar(),
      time: msg.messageTime,
      // ReAct 思考相关
      isThinking: isNewAIMessage && currentThinking.value.isThinking,
      thinkingSteps: (() => {
        // 如果消息已完成，使用消息自己的思考步骤
        if (msg._isMessageCompleted) {
          const steps = msg._messageThinkingSteps || msg.thinkingSteps || [];
          console.log(`🔍 消息${msg.key}已完成，使用专用步骤:`, steps.length);
          return steps;
        }
        // 如果是当前正在处理的消息，使用全局的当前步骤
        if (isLatestMessage && msg.key === currentThinking.value.currentMessageKey) {
          console.log(`🔍 消息${msg.key}正在处理，使用全局步骤:`, currentThinkingSteps.value.length);
          return currentThinkingSteps.value;
        }
        // 其他情况使用消息自己的步骤
        const steps = msg._messageThinkingSteps || msg.thinkingSteps || [];
        console.log(`🔍 消息${msg.key}其他情况，使用消息步骤:`, steps.length);
        return steps;
      })(),
      isTypingAnswer: isLatestMessage && msg.isTypingAnswer
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

let eventSource: EventSource | null = null;

// 创建支持 credentials 的 EventSource
const createEventSourceWithCredentials = (url: string) => {
  if (EventSource.prototype.withCredentials !== undefined) {
    // 原生支持 withCredentials 的浏览器
    return new EventSource(url, { withCredentials: true });
  } else {
    // 使用 fetch polyfill
    const es = new EventSource(url);
    const originalOpen = es.open;

    es.open = function() {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      return originalOpen.apply(this, arguments);
    };

    return es;
  }
};

// 添加暂停状态
const isPaused = ref(false);

// 保存当前的对话参数
const currentChatParams = ref({
  input: '',
  conversationId: '',
  lastContent: ''
});

// 修改暂停/继续对话函数
const togglePause = (event: Event) => {
  // 阻止事件冒泡
  event.stopPropagation();

  isPaused.value = !isPaused.value;
  if (isPaused.value) {
    // 如果暂停，保存当前状态并关闭连接
    const lastMessage = msgList.value[0]?.list[msgList.value[0].list.length - 1];
    if (lastMessage?.messageType === 'ai') {
      currentChatParams.value.lastContent = lastMessage.messageContent;
    }
    currentChatParams.value.conversationId = newConversationId.value;

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    loading.value = false;
    isAnswering.value = false;
    ElMessage.success('已暂停对话');
  } else {
    // 如果继续，恢复之前的对话
    resumeChat();
  }
};

// 恢复对话的函数
const resumeChat = async () => {
  if (!currentChatParams.value.conversationId) {
    ElMessage.error('无法恢复对话');
    return;
  }

  try {
    isAnswering.value = true;
    loading.value = true;

    // 使用保存的参数继续对话
    const apiUrl = `${requestUrl.value}/react/process/stream`;
    const fullUrl = `${apiUrl}?input=继续&sessionId=${encodeURIComponent(currentChatParams.value.conversationId)}`;

    // 创建新的 EventSource 连接
    if (eventSource) {
      eventSource.close();
    }
    eventSource = new EventSource(fullUrl, { withCredentials: true });

    // 处理消息
    eventSource.addEventListener('message', (event) => {
      try {
        const rawData = event.data;

        // 检查是否是自定义事件格式
        if (rawData.startsWith('event:')) {
          const lines = rawData.split('\n');
          const eventType = lines[0].replace('event:', '').trim();
          const eventData = lines[1] ? lines[1].replace('data:', '').trim() : '';

          const lastMessage = msgList.value[0].list[msgList.value[0].list.length - 1];
          if (lastMessage.messageType === 'ai') {
            // 恢复对话时的事件处理
            lastMessage.messageContent = currentChatParams.value.lastContent + '\n' + eventData;
          }
          return;
        }

        // 尝试解析为 JSON
        const data = JSON.parse(rawData);
        const lastMessage = msgList.value[0].list[msgList.value[0].list.length - 1];

        if (lastMessage.messageType === 'ai') {
          // 处理 ReAct 恢复对话
          let newContent = '';
          if (data.finalAnswer) {
            newContent = data.finalAnswer;
          } else if (data.messageContent) {
            newContent = data.messageContent;
          } else if (data.thought) {
            newContent = '🤔 思考中: ' + data.thought;
          }

          // 从上次暂停的内容继续
          if (newContent) {
            lastMessage.messageContent = currentChatParams.value.lastContent + '\n' + newContent;
          }

          // 如果完成，关闭连接
          if (data.done) {
            eventSource?.close();
            eventSource = null;
            loading.value = false;
            isAnswering.value = false;
            isPaused.value = false;
            // 清除保存的参数
            currentChatParams.value = {
              input: '',
              conversationId: '',
              lastContent: ''
            };
          }
        }
      } catch (error) {
        console.error('解析ReAct恢复消息失败:', error);
        // 如果解析失败，直接显示原始数据
        const lastMessage = msgList.value[0].list[msgList.value[0].list.length - 1];
        if (lastMessage && lastMessage.messageType === 'ai') {
          lastMessage.messageContent = currentChatParams.value.lastContent + '\n' + event.data;
        }
      }
    });

    // 处理错误
    eventSource.addEventListener('error', (event) => {
      console.error('Error:', event);
      const lastMessage = msgList.value[0].list[msgList.value[0].list.length - 1];
      if (lastMessage.messageType === 'ai') {
        lastMessage.messageContent += '\n[出错了，请重试]';
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      loading.value = false;
      isAnswering.value = false;
      isPaused.value = false;
      ElMessage.error('恢复对话失败，请重试');
    });

    ElMessage.success('正在继续对话');

  } catch (error) {
    console.error('Resume chat error:', error);
    loading.value = false;
    isAnswering.value = false;
    isPaused.value = false;
    ElMessage.error('恢复对话失败，请重试');
  }
};

// 添加思考历史记录
const thoughtHistory = ref([]);

// 思考过程展开/收起状态管理
const thinkingExpandedState = ref<Record<number, boolean>>({});

// 获取思考过程展开状态
const getThinkingExpanded = (messageKey: number): boolean => {
  // 检查是否是当前正在思考的消息
  const isCurrentThinking = currentThinking.value.currentMessageKey === messageKey;

  // 正在思考的消息强制展开
  if (isCurrentThinking) {
    return true;
  }

  // 其他消息检查用户设置，默认收起
  if (thinkingExpandedState.value[messageKey] === undefined) {
    return false; // 历史消息默认收起
  }
  return thinkingExpandedState.value[messageKey];
};

// 切换思考过程展开状态
const toggleThinkingExpanded = (messageKey: number) => {
  thinkingExpandedState.value[messageKey] = !getThinkingExpanded(messageKey);
  console.log(`🔄 切换思考过程展开状态，消息${messageKey}: ${thinkingExpandedState.value[messageKey]}`);
};

// 获取思考过程摘要（收起时显示）
const getThinkingSummary = (thinkingSteps: any[]): string => {
  if (!thinkingSteps || thinkingSteps.length === 0) return '';

  // 查找最终答案步骤
  const finalStep = thinkingSteps.find(step => step.type === 'final');
  if (finalStep && finalStep.content) {
    const summary = finalStep.content.substring(0, 50);
    return summary.length < finalStep.content.length ? summary + '...' : summary;
  }

  // 如果没有最终答案，显示第一个思考步骤的摘要
  const firstStep = thinkingSteps[0];
  if (firstStep && firstStep.content) {
    const summary = firstStep.content.substring(0, 50);
    return summary.length < firstStep.content.length ? summary + '...' : summary;
  }

  return '点击查看详细思考过程';
};

// AI头像设置 - 使用当前AI的头像
const getAiAvatar = () => {
  if (currentAiInfo.value.aiIcon) {
    return getAssetsFile(currentAiInfo.value.aiIcon);
  }
  return aiLogo; // 默认头像
};

// 获取用户头像
const getUserAvatar = () => {
  console.log('🔍 获取用户头像...');
  console.log('📊 当前状态:', {
    'userAvatar.value': userAvatar.value,
    'currentUser.value': currentUser.value
  });

  // 优先使用当前获取的用户头像
  if (userAvatar.value) {
    console.log('✅ 使用当前用户头像:', userAvatar.value);
    return userAvatar.value;
  }

  // 尝试从本地存储获取
  const localUser = getUser();
  console.log('📱 本地存储用户信息:', localUser);

  if (localUser && localUser.userAvatar) {
    console.log('✅ 使用本地存储的用户头像:', localUser.userAvatar);
    // 同时更新当前状态
    userAvatar.value = localUser.userAvatar;
    return localUser.userAvatar;
  }

  // 最后使用默认头像
  console.log('⚠️ 使用默认用户头像');
  return defaultAvatar;
};


// ReAct 思考过程状态
const currentThinking = ref({
  thought: '',
  action: '',
  actionInput: '',
  observation: '',
  isThinking: false,
  currentMessageKey: null as number | null // 当前处理的消息key
});

// 当前消息的思考步骤
const currentThinkingSteps = ref<ThinkingStep[]>([]);
const thinkingStepCounter = ref(0);

// 流式数据处理状态
const streamingState = ref<{ [key: string]: string }>({});

// 思考步骤管理函数
const addThinkingStep = (type: ThinkingStep['type'], title: string, content: string, status: ThinkingStep['status'] = 'loading', enableTyping = true) => {
  const step: ThinkingStep = {
    id: `step-${++thinkingStepCounter.value}`,
    type,
    title,
    content,
    status,
    timestamp: new Date().toLocaleTimeString(),
    isTyping: enableTyping && status === 'loading',
    displayContent: enableTyping ? '' : content
  };
  currentThinkingSteps.value.push(step);

  // 如果启用打字机效果，开始打字动画
  if (enableTyping && status === 'loading') {
    startTypingEffect(step);
  }

  return step;
};

const updateThinkingStep = (stepId: string, updates: Partial<ThinkingStep>) => {
  const step = currentThinkingSteps.value.find(s => s.id === stepId);
  if (step) {
    Object.assign(step, updates);
  }
};

const clearThinkingSteps = () => {
  // 清理所有打字机定时器
  Object.values(typingTimers.value).forEach(timer => {
    if (timer) clearTimeout(timer);
  });
  typingTimers.value = {};

  if (messageTypingTimer.value) {
    clearTimeout(messageTypingTimer.value);
    messageTypingTimer.value = null;
  }

  currentThinkingSteps.value = [];
  thinkingStepCounter.value = 0;
  streamingState.value = {};

  // 重置当前处理的消息标识
  currentThinking.value.currentMessageKey = null;
};

// 测试打字机效果的函数 (可在控制台调用 window.testTyping())
const testTypingEffect = () => {
  console.log('🧪 测试打字机效果');

  // 确保有AI消息
  if (msgList.value[0].list.length === 0 || msgList.value[0].list[msgList.value[0].list.length - 1].role !== 'ai') {
    // 添加一个AI消息占位符
    const aiMessage: MessageType = {
      key: Date.now(),
      role: 'ai',
      messageType: 'ai',
      messageContent: '',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      isThinking: true,
      thinkingSteps: []
    };
    msgList.value[0].list.push(aiMessage);
  }

  // 清理之前的步骤
  clearThinkingSteps();
  currentThinking.value.isThinking = true;

  const testStep = getOrCreateStep('thinking', '测试思考');
  updateStepContent(testStep, '这是一个测试打字机效果的内容，应该逐字符显示。每个字符间隔50毫秒。', true, 50);

  // 强制更新
  nextTick(() => {
    scrollToBottom();
  });
};

// 暴露测试函数到全局
if (typeof window !== 'undefined') {
  (window as any).testTyping = testTypingEffect;
}

// 处理 SSE 消息的统一函数
const handleSSEMessage = (rawData: string) => {
  try {
    console.log('📨 处理SSE消息:', rawData);

    // 检查是否是纯文本消息（兼容旧格式）
    if (!rawData.trim().startsWith('{')) {
      console.log('📝 收到纯文本消息:', rawData);

      // 创建一个简单的思考步骤来显示纯文本消息
      const textStep = getOrCreateStep('thinking', '系统消息');
      updateStepContent(textStep, rawData, true, 30);

      // 滚动到底部
      nextTick(() => {
        scrollToBottom();
      });
      return;
    }

    // 尝试解析为 JSON (ReactThought 对象)
    const data = JSON.parse(rawData);
    console.log('📊 解析的JSON数据:', data);

    const lastMessage = msgList.value[0].list[msgList.value[0].list.length - 1];
    console.log('📝 当前最后一条消息:', lastMessage);

    // 检查是否是当前正在处理的消息
    if (!lastMessage || lastMessage.key !== currentThinking.value.currentMessageKey) {
      console.log('⚠️ 消息不匹配，跳过处理:', {
        lastMessageKey: lastMessage?.key,
        currentMessageKey: currentThinking.value.currentMessageKey,
        messageType: data.messageType
      });
      return;
    }

    console.log('✅ 消息匹配，开始处理:', {
      messageKey: lastMessage.key,
      messageType: data.messageType,
      currentStepsCount: currentThinkingSteps.value.length
    });

    // 简化条件判断，只要有最后一条消息就处理
    if (lastMessage && (lastMessage.messageType === 'ai' || lastMessage.role === 'ai')) {
      console.log('✅ 条件满足，开始处理数据');

      console.log('📊 收到数据:', {
        messageType: data.messageType,
        hasThought: !!data.thought,
        hasAction: !!data.action,
        hasObservation: !!data.observation,
        hasFinalAnswer: !!data.finalAnswer,
        hasMessageContent: !!data.messageContent,
        thought: data.thought?.substring(0, 50) + (data.thought?.length > 50 ? '...' : ''),
        action: data.action,
        observation: data.observation?.substring(0, 50) + (data.observation?.length > 50 ? '...' : ''),
        finalAnswer: data.finalAnswer?.substring(0, 50) + (data.finalAnswer?.length > 50 ? '...' : ''),
        messageContent: data.messageContent?.substring(0, 50) + (data.messageContent?.length > 50 ? '...' : '')
      });

      // 处理思考内容 - 无论 messageType 是什么，只要有 thought 就渲染
      if (data.thought) {
        console.log('🧠 收到思考内容，立即开始打字机渲染:', data.thought);

        const thinkingStep = getOrCreateStep('thinking', '思考分析');
        // 启用打字机效果，速度为25ms/字符
        updateStepContent(thinkingStep, data.thought, true, 25);
        currentThinking.value.isThinking = true;

        // 强制触发 Vue 更新
        nextTick(() => {
          scrollToBottom();
        });

        console.log('🎬 思考过程打字机效果已启动');
      }

      // 处理行动信息
      if (data.action && data.actionInput) {
        console.log('🔧 收到行动信息，立即开始打字机渲染:', data.action);

        // 完成思考步骤的打字机效果
        currentThinkingSteps.value.forEach(step => {
          if (step.type === 'thinking') {
            stopTypingEffect(step);
          }
        });

        const actionStep = getOrCreateStep('action', '执行行动');
        // 行动步骤使用打字机效果，速度稍快
        updateStepContent(actionStep, `🔧 工具: ${data.action}\n📝 参数: ${data.actionInput}`, true, 20);

        // 强制触发 Vue 更新
        nextTick(() => {
          scrollToBottom();
        });

        console.log('🎬 行动步骤打字机效果已启动');
      }

      // 处理观察结果
      if (data.observation) {
        console.log('👀 收到观察结果，立即开始打字机渲染:', data.observation);

        // 完成行动步骤的打字机效果
        currentThinkingSteps.value.forEach(step => {
          if (step.type === 'action') {
            stopTypingEffect(step);
          }
        });

        const observationStep = getOrCreateStep('observation', '观察结果');
        // 观察结果使用打字机效果
        updateStepContent(observationStep, data.observation, true, 25);

        // 强制触发 Vue 更新
        nextTick(() => {
          scrollToBottom();
        });

        console.log('🎬 观察结果打字机效果已启动');
      }

      // 处理最终答案
      if (data.finalAnswer) {
        console.log('✅ 收到最终答案，立即开始打字机渲染:', data.finalAnswer);

        // 完成所有其他步骤的打字机效果
        currentThinkingSteps.value.forEach(step => {
          if (step.type !== 'final') {
            stopTypingEffect(step);
          }
        });

        const finalStep = getOrCreateStep('final', '最终答案');
        // 最终答案使用打字机效果，速度适中
        updateStepContent(finalStep, data.finalAnswer, true, 20);

        // 同时启动消息内容的打字机效果
        startMessageTyping(lastMessage, data.finalAnswer, 20);
        currentThinking.value.isThinking = false;

        // 强制触发 Vue 更新
        nextTick(() => {
          scrollToBottom();
        });

        console.log('🎬 最终答案打字机效果已启动');
      }

      // 更新思考步骤到消息专用字段（深拷贝并冻结）
      const copiedSteps = deepCopyThinkingSteps(currentThinkingSteps.value);
      copiedSteps.forEach(step => Object.freeze(step));
      Object.freeze(copiedSteps);

      lastMessage._messageThinkingSteps = copiedSteps;
      lastMessage.thinkingSteps = copiedSteps;
      console.log('📋 保存并冻结思考步骤到消息:', lastMessage.key, copiedSteps.length);

      // 如果有消息内容但没有在上面处理，则更新
      if (data.messageContent && !data.finalAnswer) {
        lastMessage.messageContent = data.messageContent;
        console.log('📝 更新消息内容:', data.messageContent);
      }

      // 处理完成标记
      if (data.done) {
        console.log('🏁 收到完成标记');

        // 完成所有步骤
        currentThinkingSteps.value.forEach(step => {
          if (step.status === 'loading') {
            step.status = 'success';
          }
        });

        loading.value = false;
        isAnswering.value = false;
        currentThinking.value.isThinking = false;

        // 保存思考步骤到消息专用字段（深拷贝并冻结）
        const copiedSteps = deepCopyThinkingSteps(currentThinkingSteps.value);
        copiedSteps.forEach(step => Object.freeze(step));
        Object.freeze(copiedSteps);

        // 同时保存到两个字段，确保兼容性
        lastMessage._messageThinkingSteps = copiedSteps;
        lastMessage.thinkingSteps = copiedSteps;
        lastMessage._isMessageCompleted = true; // 标记消息已完成

        console.log('📋 最终保存并冻结思考步骤到消息:', lastMessage.key, copiedSteps.length);

        // 立即重置当前消息标识，防止后续数据影响已完成的消息
        currentThinking.value.currentMessageKey = null;
        console.log('🔒 重置当前消息标识，锁定已完成消息');

        console.log('✅ 对话完成');
      }

      console.log('🔄 消息处理完成，当前状态:');
      console.log('  - 思考步骤数量:', currentThinkingSteps.value.length);
      console.log('  - 是否思考中:', currentThinking.value.isThinking);
      console.log('  - 最后消息内容:', lastMessage.messageContent?.substring(0, 50) + '...');
    } else {
      console.log('❌ 条件不满足，无法处理数据:', {
        hasLastMessage: !!lastMessage,
        messageType: lastMessage?.messageType,
        role: lastMessage?.role,
        data: data
      });

      // 备用处理逻辑：如果有思考内容，直接处理
      if (data.thought) {
        console.log('🔄 使用备用逻辑处理思考内容');
        const thinkingStep = getOrCreateStep('thinking', '思考分析');
        updateStepContent(thinkingStep, data.thought, true, 25);
        currentThinking.value.isThinking = true;

        // 强制触发更新
        nextTick(() => {
          scrollToBottom();
        });
      }
    }
  } catch (error) {
    console.error('❌ 处理SSE消息失败:', error, '原始数据:', rawData);

    // 如果 JSON 解析失败，尝试作为纯文本处理
    if (error instanceof SyntaxError && rawData.trim()) {
      console.log('🔄 JSON解析失败，作为纯文本处理:', rawData);

      // 创建一个思考步骤来显示原始文本
      const errorStep = getOrCreateStep('thinking', '系统消息');
      updateStepContent(errorStep, rawData, true, 30);

      // 滚动到底部
      nextTick(() => {
        scrollToBottom();
      });
    }
  }
};

// 获取或创建指定类型的步骤
const getOrCreateStep = (type: ThinkingStep['type'], title: string): ThinkingStep => {
  // 查找是否已存在该类型的步骤
  let step = currentThinkingSteps.value.find(s => s.type === type);

  if (!step) {
    // 创建新步骤
    step = {
      id: `step-${++thinkingStepCounter.value}`,
      type,
      title,
      content: '',
      status: 'loading',
      timestamp: new Date().toLocaleTimeString(),
      isTyping: false,
      displayContent: ''
    };
    currentThinkingSteps.value.push(step);

    console.log(`🆕 创建新步骤 [${title}]:`, {
      id: step.id,
      type: step.type,
      title: step.title,
      totalSteps: currentThinkingSteps.value.length
    });
  } else {
    console.log(`🔄 复用现有步骤 [${title}]:`, {
      id: step.id,
      type: step.type,
      title: step.title,
      currentStatus: step.status
    });
  }

  return step;
};

// 打字机效果管理
const typingTimers = ref<{ [key: string]: NodeJS.Timeout }>({});
const messageTypingTimer = ref<NodeJS.Timeout | null>(null);

// 启动打字机效果
const startTypingEffect = (step: ThinkingStep, content: string, speed = 30) => {
  if (!content) {
    console.log(`⚠️ 打字机效果跳过 [${step.title}]: 内容为空`);
    return;
  }

  // 清除之前的打字机效果
  if (typingTimers.value[step.id]) {
    clearTimeout(typingTimers.value[step.id]);
    delete typingTimers.value[step.id];
  }

  // 重置步骤状态
  step.content = content;
  step.displayContent = '';
  step.isTyping = true;
  step.status = 'loading';

  let index = 0;

  const typeNextChar = () => {
    if (index < content.length && step.isTyping) {
      step.displayContent = content.substring(0, index + 1);
      index++;

      // 每10个字符输出一次调试信息
      if (index % 10 === 0) {
        console.log(`🎬 打字进度 [${step.title}]: ${index}/${content.length} - "${step.displayContent.substring(0, 20)}..."`);
      }

      typingTimers.value[step.id] = setTimeout(typeNextChar, speed);
    } else {
      // 打字完成
      step.isTyping = false;
      step.status = 'success';
      step.displayContent = content;

      // 清理定时器
      if (typingTimers.value[step.id]) {
        clearTimeout(typingTimers.value[step.id]);
        delete typingTimers.value[step.id];
      }

      console.log(`✅ 打字机效果完成 [${step.title}]:`, {
        finalContent: step.displayContent,
        stepId: step.id,
        stepType: step.type,
        stepStatus: step.status,
        isTyping: step.isTyping
      });
    }
  };

  console.log(`🎬 开始打字机效果 [${step.title}]:`, {
    content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
    speed: speed,
    length: content.length
  });

  // 立即开始第一个字符
  typeNextChar();
};

// 停止打字机效果
const stopTypingEffect = (step: ThinkingStep) => {
  if (typingTimers.value[step.id]) {
    clearTimeout(typingTimers.value[step.id]);
    delete typingTimers.value[step.id];
  }

  step.isTyping = false;
  step.status = 'success';
  step.displayContent = step.content;
};

// 消息内容打字机效果
const startMessageTyping = (message: any, content: string, speed = 30) => {
  if (messageTypingTimer.value) {
    clearTimeout(messageTypingTimer.value);
  }

  message.messageContent = '';
  message.isTypingAnswer = true;

  let index = 0;

  const typeNextChar = () => {
    if (index < content.length) {
      message.messageContent = content.substring(0, index + 1);
      index++;

      messageTypingTimer.value = setTimeout(typeNextChar, speed);
    } else {
      // 打字完成
      message.isTypingAnswer = false;
      message.messageContent = content;

      if (messageTypingTimer.value) {
        clearTimeout(messageTypingTimer.value);
        messageTypingTimer.value = null;
      }

      console.log('✅ 消息内容打字机效果完成');
    }
  };

  console.log('🎬 开始消息内容打字机效果:', content.substring(0, 50) + '...');
  typeNextChar();
};

// 实时更新步骤内容（带打字机效果）
const updateStepContent = (step: ThinkingStep, newContent: string, useTyping = true, speed = 30) => {
  if (!newContent) {
    console.log(`⚠️ updateStepContent 跳过 [${step.title}]: 内容为空`);
    return;
  }

  console.log(`📝 updateStepContent [${step.title}]:`, {
    useTyping,
    speed,
    contentLength: newContent.length,
    content: newContent.substring(0, 100) + (newContent.length > 100 ? '...' : '')
  });

  if (useTyping) {
    // 使用打字机效果
    const formattedContent = formatThoughtContent(newContent);
    startTypingEffect(step, formattedContent, speed);
  } else {
    // 直接设置内容
    const formattedContent = formatThoughtContent(newContent);
    step.content = formattedContent;
    step.displayContent = formattedContent;
    step.isTyping = false;
    step.status = 'success';

    console.log(`📝 直接更新步骤 [${step.title}]:`, formattedContent.substring(0, 50) + '...');
  }
};


// 获取步骤图标
const getStepIcon = (type: ThinkingStep['type']) => {
  switch (type) {
    case 'thinking':
      return '🤔';
    case 'action':
      return '🔧';
    case 'observation':
      return '👀';
    case 'final':
      return '✅';
    default:
      return '📝';
  }
};

// 格式化思考内容（用于存储）
const formatThoughtContent = (content: string) => {
  if (!content) return '';

  // 对于简单的状态消息，直接返回
  if (content.includes('正在分析问题') || content.includes('正在选择行动') || content.includes('正在执行')) {
    return content;
  }

  // 移除一些 markdown 标记但保留基本格式
  return content
    .replace(/###\s*/g, '') // 移除 ### 标记
    .replace(/---\s*/g, '') // 移除分隔线
    .replace(/^\*\*最终答案\*\*[:：]\s*/g, '') // 移除最终答案标记
    .trim();
};

// 格式化显示内容（用于渲染）
const formatDisplayContent = (content: string) => {
  if (!content) return '';

  return content
    // 处理加粗文本
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 处理表格
    .replace(/\|(.+?)\|/g, (match, p1) => {
      const cells = p1.split('|').map(cell => cell.trim());
      return '<tr>' + cells.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
    })
    // 处理换行
    .replace(/\n/g, '<br>')
    // 处理列表项
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // 包装表格
    .replace(/(<tr>.*<\/tr>)/s, '<table class="weather-table">$1</table>')
    // 包装列表
    .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
};

const startStream1 = async () => {
  if (isAnswering.value) {
    ElMessage.warning('AI正在回答中，请等待完成...');
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

  try {
    isAnswering.value = true;
    loading.value = true;
    const currentInput = input.value;
    input.value = '';

    // 添加用户消息
    const newProblem = {
      key: Date.now(), // 添加唯一标识
      role: 'user',
      messageType: 'user',
      messageTime: formatDate(new Date()),
      messageContent: currentInput,
      content: currentInput,
      timestamp: new Date().toLocaleTimeString()
    };
    console.log('🆕 创建新用户消息:', newProblem.key);

    if (msgList.value.length === 0) {
      msgList.value.push({
        list: []
      });
    }
    msgList.value[0].list.push(newProblem);

    // 添加AI消息占位
    const messageKey = Date.now() + 1;
    const newAnswer = {
      key: messageKey, // 添加唯一标识
      role: 'ai',
      messageType: 'ai',
      messageTime: formatDate(new Date()),
      messageContent: '',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      aiUrl: 'ai-avatar.png',
      isThinking: true,
      thinkingSteps: [], // 初始化为空数组
      // 添加消息专用的思考步骤管理
      _messageThinkingSteps: [] as ThinkingStep[], // 消息专用的思考步骤
      _isMessageCompleted: false // 标记消息是否已完成
    };
    console.log('🆕 创建新AI消息:', messageKey);
    msgList.value[0].list.push(newAnswer);

    // 清空之前的思考步骤，并记录当前处理的消息
    clearThinkingSteps();
    currentThinking.value.isThinking = true;
    currentThinking.value.currentMessageKey = newAnswer.key; // 记录当前处理的消息

    // 使用 ReAct 流式处理接口
    const apiUrl = `${requestUrl.value}/react/process/stream`;

    // 验证请求参数
    if (!newConversationId.value) {
      throw new Error('会话ID为空');
    }

    if (!currentInput.trim()) {
      throw new Error('输入内容为空');
    }

    console.log('🚀 发起ReAct请求:', apiUrl, {
      input: currentInput,
      conversationId: newConversationId.value
    });

    console.log('📊 当前状态:', {
      newConversationId: newConversationId.value,
      routeParams: route.params,
      inputLength: currentInput.length
    });

    // 关闭已有的连接
    if (eventSource) {
      eventSource.close();
    }

    // 使用 POST 请求创建 SSE 连接
    console.log('🔗 准备建立SSE连接 (POST)');

    const response = await fetch(`${apiUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      credentials: 'include',
      body: JSON.stringify({
        input: currentInput,
        conversationId: newConversationId.value
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ SSE连接建立成功');

    // 处理流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    // 创建一个模拟的 EventSource 对象来兼容现有代码
    eventSource = {
      readyState: 1, // OPEN
      url: apiUrl,
      close: () => {
        reader.cancel();
        console.log('📡 SSE连接已关闭');
      },
      addEventListener: () => {
      }, // 占位符，实际处理在下面
      removeEventListener: () => {
      },
      dispatchEvent: () => false,
      onopen: null,
      onmessage: null,
      onerror: null,
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2
    } as EventSource;

    // 开始读取流数据
    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('📡 SSE流结束');
          break;
        }

        // 解码数据
        const chunk = decoder.decode(value, { stream: true });
        console.log('📨 收到数据块:', chunk);
        buffer += chunk;

        // 处理完整的SSE事件
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留不完整的行
        console.log('📨 分割后的行数:', lines.length, '缓冲区剩余:', buffer);

        // 处理 SSE 事件
        for (const line of lines) {
          console.log('📨 处理SSE行:', line);

          if (line.startsWith('event:')) {
            const eventType = line.substring(6).trim();
            console.log('📨 设置事件类型:', eventType);
          } else if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            console.log('📨 提取的数据:', data);

            // 当收到数据行时，立即处理
            if (data && data !== '[DONE]') {
              console.log('📨 调用 handleSSEMessage:', data);
              handleSSEMessage(data);
            } else {
              console.log('📨 跳过空数据或结束标记:', data);
            }
          } else if (line.trim() === '') {
            // 空行表示一个完整的 SSE 事件结束
            console.log('📨 事件结束');
          } else if (line.trim()) {
            console.log('📨 收到其他行:', line);
          }
        }
      }
    } catch (streamError) {
      console.error('❌ 流读取错误:', streamError);
      throw streamError;
    } finally {
      // 清理连接
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      loading.value = false;
      isAnswering.value = false;
      console.log('📡 SSE连接已关闭');
    }

  } catch (error) {
    console.error('Stream error:', error);
    loading.value = false;
    isAnswering.value = false;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    ElMessage.error('请求失败，请稍后重试');
  }
};

// 深拷贝思考步骤 - 使用 JSON 方式确保完全独立
const deepCopyThinkingSteps = (steps: ThinkingStep[]): ThinkingStep[] => {
  try {
    // 使用 JSON 深拷贝，确保完全独立
    return JSON.parse(JSON.stringify(steps));
  } catch (error) {
    console.error('深拷贝思考步骤失败:', error);
    // 降级到手动拷贝
    return steps.map(step => ({
      id: step.id,
      type: step.type,
      title: step.title,
      content: step.content,
      status: step.status,
      timestamp: step.timestamp,
      isTyping: false, // 重置打字状态
      displayContent: step.displayContent
    }));
  }
};

// 处理思维链展开事件
const handleExpand = (value: string[]) => {
  console.log('展开的项:', value);
};

// 修改消息展示组件

// 处理新会话消息发送
const handleNewConversation = async () => {
  console.log('🔍 检查新会话消息:', {
    newConversationId: newConversationId.value,
    newConversationMessage: newConversationMessage.value,
    routeParams: route.params
  });

  // 如果有新会话ID，获取AI信息
  if (newConversationId.value) {
    console.log('🤖 获取新会话的AI信息:', newConversationId.value);
    await getConversationAiInfo(newConversationId.value);
  }

  // 检查是否有新会话消息需要发送
  if (newConversationMessage.value && newConversationMessage.value.trim()) {
    console.log('📝 发现新会话消息，准备发送:', newConversationMessage.value);

    // 保存消息内容
    const messageToSend = newConversationMessage.value;

    // 设置输入框内容
    input.value = messageToSend;

    // 清空新会话消息，避免重复发送
    newConversationMessage.value = '';

    // 等待界面更新和组件完全加载
    await nextTick();

    // 额外延迟确保所有状态都已更新
    setTimeout(async () => {
      console.log('🚀 自动发送新会话消息:', messageToSend);
      try {
        await startStream1();
      } catch (error) {
        console.error('❌ 自动发送消息失败:', error);
        ElMessage.error('发送消息失败，请手动重试');
      }
    }, 500);
  }
};

// 初始化会话ID
const initializeConversation = async () => {
  const routeConversationId = route.params.conversationId as string;

  console.log('🔍 初始化会话:', {
    routeConversationId,
    newConversationId: newConversationId.value,
    currentRoute: route.path
  });

  if (routeConversationId) {
    // 如果路由中有会话ID，使用路由中的ID
    newConversationId.value = routeConversationId;
    console.log('✅ 使用路由会话ID:', routeConversationId);

    // 获取会话AI信息
    await getConversationAiInfo(routeConversationId);
  } else {
    // 如果路由中没有会话ID，说明是新建消息页面跳转过来的
    // 检查是否有有效的新会话ID
    if (newConversationId.value && route.path.includes('/main/')) {
      console.log('🔄 更新路由到新会话ID:', newConversationId.value);
      router.replace(`/main/${newConversationId.value}`);

      // 获取会话AI信息
      await getConversationAiInfo(newConversationId.value);
    } else {
      console.log('⚠️ 没有有效的会话ID，可能需要创建新会话');
      // 如果没有有效的会话ID，清空状态
      newConversationId.value = '';
    }
  }
};

// 组件挂载时的初始化
onMounted(async () => {
  console.log('🚀 组件挂载，开始初始化...');

  // 获取用户信息
  await getUserInfo();

  // 初始化会话ID（包含获取AI信息）
  await initializeConversation();

  // 处理新会话消息
  await handleNewConversation();
});

// 监听路由变化
watchEffect(async () => {
  const routeConversationId = route.params.conversationId as string;

  console.log('👀 路由变化监听:', {
    routeConversationId,
    currentNewConversationId: newConversationId.value,
    routePath: route.path
  });

  if (routeConversationId && routeConversationId !== newConversationId.value) {
    console.log('🔄 路由会话ID变化:', routeConversationId);

    // 清空旧的消息状态
    setMessageList([]);
    isShowMessage.value = false;

    // 设置新的会话ID
    newConversationId.value = routeConversationId;

    // 获取新会话的AI信息
    await getConversationAiInfo(routeConversationId);
  }
});

// 监听用户信息变化
watchEffect(() => {
  const localUser = getUser();
  if (localUser && localUser.userAvatar && localUser.userAvatar !== userAvatar.value) {
    console.log('👤 检测到用户头像变化:', localUser.userAvatar);
    userAvatar.value = localUser.userAvatar;
    currentUser.value = localUser;
  }
});
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  height: 85vh;
  overflow: hidden;
}

/* 聊天头部样式 */
.chat-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(228, 231, 237, 0.6);
  padding: 12px 20px;
  z-index: 10;
  flex-shrink: 0;
  text-align: center;
}

.chat-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  line-height: 1.2;
  opacity: 0.8;
}

.message-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 确保flex子元素可以收缩 */
}

.bubble-list {
  height: 100%;
  padding: 20px;
  padding-bottom: 40px; /* 增加底部内边距，防止被输入框遮挡 */
  box-sizing: border-box;
}

/* 调整聊天头像大小 */
:deep(.bubble-list .avatar) {
  width: 40px !important;
  height: 40px !important;
  border-radius: 20px !important;
  flex-shrink: 0;
}

:deep(.bubble-list .avatar img) {
  width: 40px !important;
  height: 40px !important;
  border-radius: 20px !important;
  object-fit: cover;
}

/* 针对不同的头像容器类名 */
:deep(.el-avatar) {
  width: 40px !important;
  height: 40px !important;
}

:deep(.el-avatar img) {
  width: 40px !important;
  height: 40px !important;
  object-fit: cover;
}

/* 确保消息气泡与头像的间距合适 */
:deep(.bubble-list .bubble-item) {
  margin-bottom: 16px;
}

:deep(.bubble-list .bubble-content) {
  margin-left: 12px;
  margin-right: 12px;
}

/* ReAct 思考过程样式 */
:deep(.bubble-list .bubble-content) {
  line-height: 1.6;
}

/* 思考过程中的表情符号和标题样式 */
:deep(.bubble-list .bubble-content strong) {
  color: #409eff;
  font-weight: 600;
}

/* 思考过程的不同阶段颜色 */
:deep(.bubble-list .bubble-content) {
  white-space: pre-wrap; /* 保持换行格式 */
}

/* 加载状态的思考提示 */
.thinking-indicator {
  color: #909399;
  font-style: italic;
  animation: pulse 1.5s ease-in-out infinite alternate;
}

@keyframes pulse {
  from {
    opacity: 0.6;
  }
  to {
    opacity: 1;
  }
}

/* AI 消息内容样式 */
.ai-message-content {
  width: 100%;
}

.thinking-container {
  margin-bottom: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.thinking-header {
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  border-radius: 6px;
  padding: 8px 12px;
  margin: -8px -12px 12px -12px;
}

.thinking-header:hover {
  background: rgba(64, 158, 255, 0.1);
}

.thinking-header.collapsed {
  margin-bottom: 0;
}

.thinking-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.thinking-icon {
  font-size: 16px;
}

.thinking-title {
  flex: 1;
}

.thinking-count {
  color: #909399;
  font-weight: normal;
  font-size: 12px;
}

.expand-icon {
  color: #909399;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
}

.thinking-summary {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 4px;
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
  border-left: 3px solid #409eff;
}

.thinking-steps {
  margin-top: 12px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .thinking-header-content {
    font-size: 13px;
  }

  .thinking-count {
    font-size: 11px;
  }

  .thinking-summary {
    font-size: 12px;
    padding: 6px 10px;
  }

  .thinking-container {
    padding: 12px;
  }
}

/* 动画效果 */
.el-collapse-transition {
  transition: all 0.3s ease;
}

/* 思考过程收起时的样式 */
.thinking-header.collapsed .thinking-summary {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.answer-header {
  font-weight: 600;
  color: #67c23a;
  margin-bottom: 8px;
  font-size: 14px;
}

.final-answer {
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  margin-top: 12px;
  line-height: 1.6;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-style: italic;
  padding: 12px 0;
}

.loading-indicator .el-icon {
  font-size: 16px;
}

/* Thinking 组件自定义样式 */
.thinking-step {
  margin-bottom: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.thinking-step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.thinking-step-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.thinking-step-title {
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.thinking-step-time {
  font-size: 12px;
  color: #909399;
}

.typing-indicator {
  font-size: 12px;
  color: #409eff;
  margin-left: 8px;
  animation: pulse 1.5s ease-in-out infinite alternate;
}

.thinking-step-content {
  color: #606266;
  line-height: 1.5;
  margin-left: 28px;
}

.thinking-step-content strong {
  color: #303133;
  font-weight: 600;
}

.weather-table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 13px;
}

.weather-table td {
  border: 1px solid #e4e7ed;
  padding: 6px 8px;
  text-align: center;
}

.weather-table tr:first-child td {
  background: #f5f7fa;
  font-weight: 600;
}

.thinking-step-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.thinking-step-content li {
  margin: 4px 0;
}

/* 打字机效果样式 */
.streaming-content {
  color: #606266;
  line-height: 1.5;
  position: relative;
}

.final-answer .streaming-content {
  color: #303133;
  line-height: 1.6;
  font-size: 14px;
}

/* 打字机光标 */
.cursor {
  color: #409eff;
  font-weight: bold;
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* 正在打字时的样式 */
.streaming-content.typing {
  border-left: 2px solid #409eff;
  padding-left: 8px;
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.05) 0%, transparent 100%);
}

.thinking-step.loading {
  border-color: #409eff;
  background: #ecf5ff;
  animation: pulse 1.5s ease-in-out infinite alternate;
}

.thinking-step.success {
  border-color: #67c23a;
  background: #f0f9ff;
}

.thinking-step.error {
  border-color: #f56c6c;
  background: #fef0f0;
}

/* 思考步骤动画 */
.thinking-step {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sendMeg-container {
  padding: 20px;
  border-top: #e5e7eb 1px solid;
  background: white;
}

.input-status {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.rotating {
  animation: rotate 1s linear infinite;
  margin-right: 5px;
}

.input-avatar {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  margin-right: 8px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pause-button {
  flex-shrink: 0;
  height: 32px;
  padding: 0 12px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.el-button {
  margin-left: 8px;
  padding: 0 12px;
}

:deep(.el-icon-video-pause),
:deep(.el-icon-video-play) {
  margin-right: 4px;
}

/* 添加必要的样式 */
.message-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  display: flex;
  margin-bottom: 20px;
  gap: 12px;
}

.ai-message {
  flex-direction: row;
}

.user-message {
  flex-direction: row-reverse;
}

.content {
  max-width: 80%;
}

.text {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--el-bg-color);
  margin-bottom: 4px;
}

.time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 添加 ThoughtChain 相关样式 */
:deep(.el-thought-chain) {
  margin-bottom: 12px;
}

.thoughts-container {
  margin-bottom: 12px;
}

:deep(.el-thought-chain) {
  width: 100%;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  padding: 12px;
}

:deep(.el-thought-chain .thought-item) {
  margin-bottom: 8px;
}

:deep(.is-loading) {
  animation: spin 1s infinite linear;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
