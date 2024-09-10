<template>
  <div class="main-container">
    <!--    <div class="message-container">我是聊天界面</div>-->
    <el-scrollbar ref="scrollbarRef" class="message-container">
      <el-main ref="innerRef" class="message-container">
        <div ref="messageContainer" class="div1">
          <!-- 先循环找到你想要聊天的那个人 -->
          <div v-for="(list, index) in msgList" :key="index">
            <!-- 有聊天记录：循环聊天记录 -->
            <div>
              <!-- 再循环显示聊天记录 -->
              <p v-for="(msg, index) in list.list" :key="index" :class="{'right':msg.messageType=='user' }"
                 style="  display: inline-table;">
                <el-text class="mx-1" size="small" tag="div">{{ msg.sendTime }}</el-text>
                <el-avatar v-if="msg.messageType=='ai'"
                           :src="getAIModel().avatar"
                           shape="circle"
                           style="background-color: white;    display: block;"></el-avatar>
                <el-avatar v-if="msg.messageType=='user'" shape="circle"
                           src="src/assets/userAvatar.png" style="float:right;display: block;"></el-avatar>
                <el-text class="mx-1"
                         style="padding:0 10px; border-radius: 10px; display: inline-block;background-color: #D2F9D1;text-align: left"
                         tag="span"
                         v-html="marked.parse(msg.messageContent)"></el-text>
              </p>
            </div>
          </div>
        </div>
      </el-main>
    </el-scrollbar>
    <div class="sendMeg-container">
      <div class="sendMeg-container-content">
        <el-input
          v-model="input"
          :prefix-icon="Search"
          clearable
          placeholder="Please input"
          style="width: 80%"
          @keyup.enter="handleSSESubmit"
        />
        <el-button :disabled=!input.trim() :loading=loading type="success" @click="handleSSESubmit()">
          <el-icon v-if="!loading">
            <Position />
          </el-icon>
        </el-button>
      </div>
    </div>

  </div>

</template>
<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue';
import { Position, Search } from '@element-plus/icons-vue';
import { ElMessage, ScrollbarInstance } from 'element-plus';
import { Marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/foundation.css';
import 'highlight.js/styles/atom-one-dark.css';
import { markedHighlight } from 'marked-highlight';
import { aiModel, getAIModel } from '@/global/aiCommon.ts';
import { getUser } from '@/global/UserStatue.ts';
import requests from '@/utils/request.ts';

const scrollbarRef = ref<ScrollbarInstance>();
const innerRef = ref<HTMLDivElement>();
const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'shell';
      return hljs.highlight(code, { language }).value;
    }
  })
);

const messageContainer = ref(null);
const input = ref('');
const loading = ref(false);
const isAnswering = ref(false);
const msgList = ref([
  {
    username: '王小虎',
    list: []
  }
]);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

const getMessage = async () => {
  await requests.get('/message/getMessage/list').then((res) => {
    msgList.value[0].list = res.data;
  }).catch((err) => {
    console.log(err);
  });
};

const handleSSESubmit = async () => {
  if (isAnswering.value) {
    ElMessage.error('在回答中请稍等！！！');
    return;
  }
  if (input.value.trim() === '') {
    ElMessage.error('输入内容不能为空！！！');
    return;
  }

  if (getUser() === null) {
    ElMessage.error('请先登录！！！');
    return;
  }

  const aiModelInstance = getAIModel();
  const eventSource = new EventSource(
    `http://localhost:8024/Hello/GetHello/sse?content=${input.value}&modelId=${aiModelInstance.id}`,
    { withCredentials: true }
  );
  isAnswering.value = true;

  const newProblem = {
    messageType: 'user',
    messageTime: formatDate(new Date()),
    messageContent: input.value
  };
  msgList.value[0].list.push(newProblem);
  input.value = '';
  loading.value = true;

  const newAnswer = {
    messageType: 'ai',
    messageTime: formatDate(new Date()),
    messageContent: ''
  };
  msgList.value[0].list.push(newAnswer);

  eventSource.onmessage = (event) => {
    msgList.value[0].list[msgList.value[0].list.length - 1].messageContent += JSON.parse(event.data).choices[0].delta.content;

    scrollbarRef.value!.setScrollTop(messageContainer.value.offsetHeight);
  };

  eventSource.onerror = (event) => {
    if (event.eventPhase === EventSource.CLOSED) {
      loading.value = false;
      isAnswering.value = false;
      eventSource.close();
    }
  };
};



onMounted(() => {
  getMessage();

});
</script>
<style scoped>


.main-container {
  display: flex;
  flex-direction: column;
  height: 85vh;
  overflow-y: auto;
}

.message-container {
  flex: 7;
}

.sendMeg-container {
  align-items: center;
  display: flex;
  flex: 1;
  border: #e5e7eb 1px solid;
}

.sendMeg-container-content {
  width: 100%;
  display: flex;
}


.div1 {
  width: 100%;
}

.div1 P {
  width: 100%;
  height: 50px;
}

.content {
  background-color: antiquewhite;
  padding: 10px;
  border-radius: 10px;
  font-weight: 12;
}

.left {
  display: inline-table;
  text-align: left;
}

.right {
  text-align: right;
}
</style>
