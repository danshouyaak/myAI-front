<template>
  <div class="main-container">
    <!--    <div class="message-container">我是聊天界面</div>-->
    <el-scrollbar ref="messageContainer" class="message-container">
      <el-main class="message-container">
        <el-watermark :content="['blog', 'https://danshouyaak.github.io/']" font="16">
          <div class="div1">

            <!-- 先循环找到你想要聊天的那个人 -->
            <div v-for="(list, index) in msgList" :key="index">
              <!-- 有聊天记录：循环聊天记录 -->
              <div>
                <!-- 再循环显示聊天记录 -->
                <p v-for="(msg, index) in list.list" :key="index" :class="{'right':msg.type=='my' }"
                   style="  display: inline-table;">
                  <el-text class="mx-1" size="small" tag="div">{{ msg.time }}</el-text>
                  <el-avatar v-if="msg.type=='user'"
                             shape="circle"
                             :src="getAIModel().avatar"
                             style="background-color: white;    display: block;"></el-avatar>
                  <el-avatar v-if="msg.type=='my'" shape="circle"
                             src="src/assets/userAvatar.png" style="float:right;display: block;"></el-avatar>
                  <el-text class="mx-1"
                           style="padding:0 10px; border-radius: 10px; display: inline-block;background-color: #D2F9D1;text-align: left"
                           tag="span"
                           v-html="marked.parse(msg.msg)"></el-text>
                </p>
              </div>
            </div>
          </div>

        </el-watermark>

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
        <el-button :disabled=!input.trim() :loading=loading type="success" @click="handleSSESubmit">
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
import { ElMessage } from 'element-plus';
import { Marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/foundation.css';
import 'highlight.js/styles/atom-one-dark.css';
import { markedHighlight } from 'marked-highlight';
import { aiModel, getAIModel } from '../../../global/aiCommon.ts';
import { useRouter } from 'vue-router';
import { getUser } from '@/global/UserStatue.ts';
//复制组件引用


const router = useRouter();

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
const articleDetails = ref();
articleDetails.value = marked.parse(value.value);


// 是否在回答中
const isAnswering = ref(false);

// 格式化时间
function formatDate(date) {
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


  // console.log('触发sse');
  const aiModelInstance: aiModel = getAIModel();
  const eventSource = new EventSource(
    // todo 手动填写完整的后端地址
    'http://localhost:8024/Hello/GetHello/sse' +
    `?content=${input.value}&modelId=${aiModelInstance.id}`
  );
  isAnswering.value = true;
  const newProblem = {
    type: 'my',
    time: formatDate(new Date),
    msg: input.value
  };
  msgList.value[0].list.push(newProblem);
  input.value = '';
  loading.value = true;
  const newAnswer = {
    type: 'user',
    time: formatDate(new Date),
    msg: ''
  };
  msgList.value[0].list.push(newAnswer);
  eventSource.onmessage = function(event) {
    console.log('event:', JSON.parse(event.data));
    console.log('eventData:', JSON.parse(event.data).choices[0].delta.content);
    msgList.value[0].list[msgList.value[0].list.length - 1].msg = msgList.value[0].list[msgList.value[0].list.length - 1].msg + JSON.parse(event.data).choices[0].delta.content;
    nextTick(() => {
      let messageContainerVal = messageContainer.value;
      messageContainerVal.wrapRef.scrollTop = messageContainerVal.wrapRef.scrollHeight;
      messageContainerVal.scrollTo({ top: messageContainerVal.scrollHeight, behavior: 'smooth' });
    });
  };

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


const msgList = ref([
  {
    username: '王小虎',
    list: []
  }
]);
const input = ref('');
</script>
<style scoped>


.main-container {
  display: flex;
  flex-direction: column;
  height: 100%;
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
