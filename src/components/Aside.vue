<template>
  <div class="aside-container">
    <div class="new-chat-section">
      <el-button
        :icon="isCollapsed ? 'Plus' : ''"
        class="new-chat-button"
        type="primary"
        @click="handleNewMessage"
      >
        <template v-if="!isCollapsed">
          <img alt="" class="button-icon" src="@/assets/NewMessage.svg" />
          新建消息
          <div class="shortcut-tags">
            <el-tag size="small">Ctrl</el-tag>
            <el-tag size="small">K</el-tag>
          </div>
        </template>
      </el-button>
    </div>

    <div class="conversations-section">
      <div v-show="!isCollapsed" class="section-title">
        <span>历史会话</span>
      </div>

      <el-scrollbar height="calc(100vh - 180px)">
        <div v-for="item in transformedConversations" :key="item.id" class="conversation-item">
          <div :class="{ 'selected': item.selected }" class="conversation-content">
            <div class="conversation-main" @click="handleConversationSelect(item)">
              <span class="conversation-label">{{ item.label }}</span>
            </div>
            <div class="conversation-actions">
              <el-dropdown trigger="click" @command="handleCommand">
                <el-button class="more-button" text>
                  <el-icon>
                    <MoreFilled />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      command="delete"
                      @click="handleDeleteConversation(item.id)"
                    >
                      <el-icon>
                        <Delete />
                      </el-icon>
                      <span>删除</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <div class="user-section">
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar
            :size="32"
            :src="userAvatar || defaultAvatar"
          />
          <span v-if="!isCollapsed" class="username">{{ username }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="settings">
              <el-icon>
                <Setting />
              </el-icon>
              设置
            </el-dropdown-item>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { watchEffect, ref, computed, onMounted } from 'vue';
import { ChatDotRound, Plus, Setting, Delete, MoreFilled } from '@element-plus/icons-vue';
import { Conversations } from 'vue-element-plus-x';
import type { ConversationItem } from 'vue-element-plus-x/types/Conversations';
import requests from '@/utils/request.ts';
import {
  conversationId,
  isShowMessage,
  newConversationId,
  newConversationMessage,
  setMessageList
} from '@/global/MessageCommon.ts';
import { removeUser } from '@/global/UserStatue.ts';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import defaultAvatar from '@/assets/userAvatar.png';

interface Conversation {
  conversationId: string;
  description: string;
  createTime: string;
}

const router = useRouter();
const isCollapsed = ref(false);
const activeConversationId = ref('');
const conversationList = ref<Conversation[]>([]);
const username = ref('用户');
const userAvatar = ref('');

// 计算会话列表的高度
const conversationsHeight = computed(() => {
  // 视口高度减去其他固定高度部分（新建消息按钮、标题、用户信息）
  return 'calc(100vh - 180px)';
});

// 监听父组件传来的收起状态
watchEffect(() => {
  const aside = document.querySelector('.aside') as HTMLElement;
  if (aside) {
    isCollapsed.value = aside.classList.contains('is-collapse');
  }
});

// 转换会话列表为 Conversations 组件所需格式
const transformedConversations = computed<ConversationItem[]>(() => {
  if (!conversationList.value || !Array.isArray(conversationList.value)) {
    return [];
  }

  const today = dayjs().startOf('day');
  const yesterday = today.subtract(1, 'day');
  const lastWeek = today.subtract(7, 'days');
  const lastMonth = today.subtract(1, 'month');

  return conversationList.value.map(item => {
    const createTime = dayjs(item.createTime);
    let group = 'older';

    if (createTime.isAfter(today)) {
      group = 'today';
    } else if (createTime.isAfter(yesterday)) {
      group = 'yesterday';
    } else if (createTime.isAfter(lastWeek)) {
      group = 'lastWeek';
    } else if (createTime.isAfter(lastMonth)) {
      group = 'lastMonth';
    }

    const isSelected = item.conversationId === activeConversationId.value;

    return {
      id: item.conversationId,
      label: item.description || '新对话',
      group,
      createTime: item.createTime,
      tooltip: `创建时间: ${dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss')}`,
      selected: isSelected,
      disabled: false
    };
  });
});

// 获取会话列表
const getConversationList = async () => {
  try {
    const response = await requests.get('/conversation/getConversation/list');
    if (response.data && Array.isArray(response.data)) {
      console.log('获取到的会话列表:', response.data);
      conversationList.value = response.data;
    } else {
      console.warn('会话列表数据格式不正确:', response.data);
      conversationList.value = [];
    }
  } catch (error) {
    console.error('获取会话列表失败:', error);
    ElMessage.error('获取会话列表失败');
    conversationList.value = [];
  }
};

// 处理新建消息
const handleNewMessage = () => {
  console.log('🆕 点击新建消息，清空会话状态');

  // 清空所有会话相关的状态
  newConversationId.value = '';
  newConversationMessage.value = '';
  activeConversationId.value = '';

  // 清空消息列表
  setMessageList([]);
  isShowMessage.value = false;

  // 跳转到新建消息页面
  router.push('/new-message');
};

// 处理会话选择
const handleConversationSelect = async (conversation: ConversationItem) => {
  if (!conversation || !conversation.id) return;

  // 更新选中状态
  activeConversationId.value = conversation.id as string;

  // 路由跳转
  router.push(`/main/${conversation.id}`);
  newConversationId.value = conversation.id as string;

  // 获取消息列表
  try {
    const response = await requests.get('/message/getMessage/list', {
      params: { conversationId: conversation.id }
    });

    console.log('📨 获取消息列表响应:', response);

    // 由于响应拦截器已经返回了 res.data，所以 response 就是后端的响应体
    if (response) {
      if (response.code === 0) {
        // 成功响应，提取实际数据
        const messageList = response.data || [];
        console.log('📋 提取的消息列表:', messageList);
        console.log('📋 消息列表类型:', typeof messageList, '是否为数组:', Array.isArray(messageList));
        setMessageList(messageList);
        ElMessage.success(`成功加载 ${messageList.length} 条消息`);
      } else {
        console.error('❌ 后端返回错误:', response.message);
        ElMessage.error(response.message || '获取消息列表失败');
        setMessageList([]); // 设置空列表
      }
    } else {
      console.error('❌ 响应格式错误:', response);
      ElMessage.error('响应格式错误');
      setMessageList([]); // 设置空列表
    }
  } catch (error) {
    console.error('获取消息列表失败:', error);
    ElMessage.error('获取消息列表失败');
    setMessageList([]); // 设置空列表
  }
};

// 处理会话删除
const handleDeleteConversation = async (conversationId: string) => {
  try {
    // 显示确认对话框
    await ElMessageBox.confirm(
      '确定要删除这个会话吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const response = await requests.get('/conversation/deleteConversation', {
      params: { conversationId }
    });

    if (response.code === 0) {
      ElMessage.success('删除成功');
      // 重新获取会话列表
      await getConversationList();
      // 如果删除的是当前选中的会话，则跳转到新建消息页面
      if (activeConversationId.value === conversationId) {
        router.push('/new-message');
      }
    } else {
      ElMessage.error(response.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除会话失败:', error);
      ElMessage.error('删除会话失败');
    }
  }
};

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  if (command === 'settings') {
    router.push('/settings');
  } else if (command === 'logout') {
    handleLogout();
  }
};

// 退出登录
const handleLogout = async () => {
  try {
    const res = await requests.post('/user/logout');
    if (res.code === 40000) {
      ElMessage.error(res.message);
      return;
    }
    removeUser();
    router.push('/login');
    ElMessage.success(res.message);
  } catch (err) {
    console.error(err);
  }
};

// 获取用户信息
const getUserInfo = async () => {
  try {
    const res = await requests.get('/user/get/login');
    if (res.code === 0) {
      username.value = res.data.userName || '用户';
      userAvatar.value = res.data.userAvatar || '';
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

onMounted(() => {
  getConversationList();
  getUserInfo();  // 添加获取用户信息
});
</script>

<style scoped>
.aside-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px); /* 减去顶部导航栏的高度 */
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s;
  width: 100%; /* 使用100%宽度，父元素会控制实际宽度 */
}

.new-chat-section {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.new-chat-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
}

.button-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.shortcut-tags {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.conversations-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.section-title {
  padding: 16px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.user-section {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  background-color: var(--el-bg-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.user-info:hover {
  background-color: var(--el-fill-color-light);
}

.username {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

:deep(.el-tag) {
  margin: 0;
  padding: 0 4px;
  height: 20px;
  line-height: 20px;
  background-color: var(--el-color-primary-light-8);
  border-color: var(--el-color-primary-light-8);
}

/* 添加CSS变量 */
:root {
  --aside-width: 260px;
  --aside-collapsed-width: 64px;
}

.conversation-item {
  margin: 4px 8px;
}

.conversation-content {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  transition: all 0.3s;
  background-color: var(--el-bg-color);
}

.conversation-content:hover {
  background-color: var(--el-fill-color-light);
}

.conversation-content.selected {
  background-color: var(--el-color-primary-light-9);
}

.conversation-main {
  flex: 1;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 12px;
}

.conversation-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}

.conversation-actions {
  display: flex;
  align-items: center;
}

.more-button {
  padding: 2px;
}

.more-button :deep(.el-icon) {
  font-size: 16px;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-color-danger);
}

:deep(.el-dropdown-menu__item .el-icon) {
  margin-right: 0;
}
</style>

