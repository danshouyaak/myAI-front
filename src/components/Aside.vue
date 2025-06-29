<template>
  <div class="aside-container">
    <el-card
      @Click="()=>{ newConversationId = '';router.push('/newMessage')}"
      shadow="hover"
      :class="{ 'collapsed': isCollapsed }"
      class="new-message-card">
      <div class="new-message-content">
        <el-tag disabled style="background-color: transparent;border: none" type="primary">
          <img alt="" src="@/assets/messgeLog.svg" />
          <el-text v-show="!isCollapsed" style="font-size: 16px">
            新建消息
          </el-text>
        </el-tag>
        <div v-show="!isCollapsed">
          <el-tag disabled style="margin: 0 0 0 2px;padding: 0 4px" type="primary">
            <el-text style="font-size: 14px">
              Ctrl
            </el-text>
          </el-tag>
          <el-tag disabled style="margin: 0 0 0 2px;padding: 0 4px" type="primary">
            <el-text style="font-size: 14px">
              K
            </el-text>
          </el-tag>
        </div>
      </div>
    </el-card>
    <el-card :class="{ 'collapsed': isCollapsed }" class="history-card">
      <span v-show="!isCollapsed">历史会话</span>
      <el-icon v-show="isCollapsed">
        <ChatLineRound />
      </el-icon>
    </el-card>
    <el-scrollbar :class="{ 'collapsed-scrollbar': isCollapsed }" height="50vh">
      <el-card
        v-for="item in conversationList" :key="item.id"
        :class="{ 'collapsed': isCollapsed }"
        class="conversation-card"
        shadow="hover"
        @click="getMessageByConversationId(item.conversationId)"
      >
        <el-tooltip
          v-if="isCollapsed"
          :content="item.description"
          effect="light"
          placement="right"
        >
          <el-icon>
            <ChatDotRound />
          </el-icon>
        </el-tooltip>
        <span v-else>{{ item.description }}</span>
      </el-card>
    </el-scrollbar>
    <el-card
      shadow="always"
      :class="{ 'collapsed': isCollapsed }"
      class="user-card">
      <el-avatar
        size="default"
        src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
      />
      <el-button v-show="!isCollapsed" size="default" type="primary" @click="handleLogout()">退出登录</el-button>
      <el-tooltip v-show="isCollapsed" content="退出登录" effect="light" placement="right">
        <el-icon @click="handleLogout()">
          <SwitchButton />
        </el-icon>
      </el-tooltip>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { watchEffect, ref, reactive, onMounted } from 'vue';
import requests from '@/utils/request.ts';
import {
  conversationId,
  isShowMessage,
  newConversationId,
  setMessageList
} from '@/global/MessageCommon.ts';
import request from '@/utils/request.ts';
import { ElMessage } from 'element-plus';
import { removeUser } from '@/global/UserStatue.ts';
import { useRouter } from 'vue-router';
import { ChatDotRound, ChatLineRound, SwitchButton } from '@element-plus/icons-vue';

const router = useRouter();
let conversationList: any = ref([]);
const isCollapsed = ref(false);

// 监听父组件传来的收起状态
watchEffect(() => {
  const aside = document.querySelector('.aside') as HTMLElement;
  if (aside) {
    isCollapsed.value = aside.classList.contains('is-collapse');
  }
});

const getConversationList = async () => {
  try {
    const response = await requests.get('/conversation/getConversation/list');
    conversationList.value = response.data;
    console.log('getConversationList', response.data);
  } catch (error) {
    console.error('Error fetching conversation list:', error);
  }
};

const getMessageByConversationId = async (conversationId: string) => {
  router.push(`/main/${conversationId}`);
  newConversationId.value = conversationId;
  console.log('getMessageByConversationId', conversationId);
  const response = await request.get('/message/getMessage/list', { params: { conversationId } });
  setMessageList(response.data);
};

watchEffect(getConversationList);

const handleLogout = async () => {
  await requests.post('/user/logout').then((res) => {
    console.log('====', res);
    if (res.code === 40000) {
      ElMessage.error(res.message);
      return;
    }
    removeUser();
    router.push('/login');
    ElMessage.success(res.message);
  }).catch((err) => {
    console.log(err);
  });
};
</script>

<style scoped>
.aside-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.new-message-card {
  width: 224px;
  height: 45px;
  margin-top: 5%;
  border-radius: 15px;
  background-color: #ffffff;
  transition: all 0.3s;
}

.new-message-card.collapsed {
  width: 30px;
  padding: 4px;
}

.new-message-content {
  display: flex;
  align-items: center;
}

.history-card {
  width: 224px;
  margin-top: 5%;
  height: 45px;
  border: none;
  background-color: #ffffff;
  transition: all 0.3s;
}

.history-card.collapsed {
  width: 30px;
  padding: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.conversation-card {
  width: 220px;
  height: 45px;
  margin-top: 5%;
  border-radius: 15px;
  background-color: #ffffff;
  transition: all 0.3s;
  cursor: pointer;
}

.conversation-card.collapsed {
  width: 30px;
  padding: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.user-card {
  position: absolute;
  bottom: 0;
  width: 240px;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.user-card.collapsed {
  width: 30px;
  padding: 4px;
}

:deep(.el-card__body) {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 8px;
}

.collapsed-scrollbar {
  width: 30px !important;
}

.el-scrollbar {
  width: 224px;
  transition: all 0.3s;
}

:deep(.el-card.collapsed) {
  border: none;
  box-shadow: none !important;
}

:deep(.el-card.collapsed .el-card__body) {
  padding: 4px;
}

.el-icon {
  font-size: 16px;
}
</style>

