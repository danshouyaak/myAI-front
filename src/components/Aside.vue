<template>
  <div style="display: flex;flex-direction: column;align-items: center;justify-items: center">
    <el-card
      shadow="hover"
      style="display: flex;align-items: center; margin-top: 5%;background-color: #ffffff;width: 224px; height: 45px; border-radius: 15px;">
      <div style="display: flex;">
        <el-tag disabled style="background-color: transparent;border: none" type="primary">
          <img alt="" src="../assets/messgeLog.svg" />
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
      >{{ item.conversationId }}
      </el-card>
    </el-scrollbar>

  </div>
</template>

<script lang="ts" setup>
import { watchEffect, ref, reactive, onMounted } from 'vue';
import requests from '@/utils/request.ts';


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

watchEffect(getConversationList);

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
</style>

