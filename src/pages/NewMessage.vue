<template>
  <el-empty :image="getAssetsFile('NewMessage.svg')" description="欢迎使用ai小助手 请输入你需要的问题吧"
            image-size="300" />
  <el-input v-model="input" placeholder="Please input" style="width: 240px" />
  <el-button @click="handleNewMessages()">Default</el-button>
</template>
<script lang="ts" setup>
import { getAssetsFile } from '@/utils/pub-use.ts';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAIModel } from '@/global/aiCommon.ts';
import request from '@/utils/request.ts';
import {
  conversationId,
  newConversationId,
  newConversationMessage,
  setConversationId, setMessageList
} from '@/global/MessageCommon.ts';

const router = useRouter();
const input = ref('');
const handleNewMessages = async () => {
  console.log('newConversationId', newConversationId.value);
  const model: any = getAIModel();
  const result = await request.post('/conversation/addConversation', {
    aiId: model.id
  });
  newConversationId.value = result.data;
  newConversationMessage.value = input.value;
  console.log(result);
  console.log('newConversationId', result.data);
  router.push(`/main/${newConversationId.value}`);
  // getMessageByConversationId(newConversationMessage.value)
};
// const getMessageByConversationId = async (conversationId: string) => {
//   newConversationId.value = conversationId;
//   console.log('getMessageByConversationId', conversationId);
//   const response = await request.get('/message/getMessage/list', { params: { conversationId } });
//   setMessageList(response.data);
// };

</script>

<style scoped>

</style>
