<template>
  <div style="display: flex;flex-direction: column;align-items: center;justify-items: center">
    <el-card
      @Click="()=>{ newConversationId = '';router.push('/newMessage')}"
      shadow="hover"
      style="display: flex;align-items: center; margin-top: 5%;background-color: #ffffff;width: 224px; height: 45px; border-radius: 15px;">
      <div style="display: flex;">
        <el-tag disabled style="background-color: transparent;border: none" type="primary">
          <img alt="" src="@/assets/messgeLog.svg" />
          <el-text style="font-size: 16px">
            新建消息
          </el-text>
        </el-tag>
        <div style="">
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
    <el-card style="width: 224px;margin-top: 5%; height: 45px;border: none;background-color: #ffffff">
      <span style="">历史会话</span>
    </el-card>
    <el-scrollbar height="50vh" style="width: 224px">
      <el-card
        v-for="item in conversationList" :key="item.id"
        shadow="hover" style="margin-top: 5%;background-color: #ffffff;width: 220px; height: 45px; border-radius: 15px;"
        @click="getMessageByConversationId(item.conversationId)"
      >{{ item.description }}
      </el-card>
    </el-scrollbar>
    <!-- 其他内容保持不变 -->
    <el-card
      shadow="always"
      style=" position: absolute;bottom: 0;width: 240px; margin-bottom: 10px;justify-content: space-between; align-items: center;">
      <el-avatar
        size="default"
        src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
      />
      <el-button size="default" type="primary" @click="handleLogout()">退出登录</el-button>
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
  setConversationId,
  setMessageList
} from '@/global/MessageCommon.ts';
import request from '@/utils/request.ts';
import { ElMessage } from 'element-plus';
import { removeUser, setUser } from '@/global/UserStatue.ts';
import { useRouter } from 'vue-router';

const router = useRouter();
let conversationList: any = ref([]);

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
// logout
const handleLogout = async () => {
  // 这里可以添加登录逻辑，比如调用接口验证用户名和密码
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
.scrollbar-demo-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  margin: 10px;
  text-align: center;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

:deep(.el-card__body) {
  align-items: center;
  display: flex;
  justify-content: space-between;
}
</style>

