<template>
  <div class="aside-container">
    <div class="new-chat-section">
      <el-button
        :icon="isCollapsed ? 'Plus' : ''"
        class="new-chat-button"
        type="primary"
        @click="()=>{ newConversationId = '';router.push('/newMessage')}"
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

      <Conversations
        v-model:active="activeConversationId"
        :height="conversationsHeight"
        :items="transformedConversations"
        :label-max-width="200"
        :show-tooltip="true"
        row-key="conversationId"
        @change="handleConversationSelect"
      />
    </div>

    <div class="user-section">
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar
            :size="32"
            src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
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
import { ChatDotRound, Plus, Setting } from '@element-plus/icons-vue';
import { Conversations } from 'vue-element-plus-x';
import type { ConversationItem } from 'vue-element-plus-x/types/Conversations';
import requests from '@/utils/request.ts';
import {
  conversationId,
  isShowMessage,
  newConversationId,
  setMessageList
} from '@/global/MessageCommon.ts';
import { removeUser } from '@/global/UserStatue.ts';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';

interface Conversation {
  conversationId: string;
  description: string;
  createTime: string;
}

const router = useRouter();
const isCollapsed = ref(false);
const activeConversationId = ref('');
const conversationList = ref<Conversation[]>([]);
const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png';
const username = ref('用户');

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

    return {
      id: item.conversationId,
      label: item.description || '新对话',
      group,
      createTime: item.createTime,
      tooltip: `创建时间: ${dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss')}`
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

// 处理会话选择
const handleConversationSelect = async (conversation: ConversationItem) => {
  activeConversationId.value = conversation.id as string;
  router.push(`/main/${conversation.id}`);
  newConversationId.value = conversation.id as string;
  const response = await requests.get('/message/getMessage/list', {
    params: { conversationId: conversation.id }
  });
  setMessageList(response.data);
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

onMounted(() => {
  getConversationList();
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
</style>

