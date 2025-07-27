import { ref } from 'vue';

const MessageList = ref<any[]>([]);

export const setMessageList = (List: any) => {
  // 检查输入数据是否有效
  if (!List) {
    console.warn('⚠️ 消息列表为空或null，使用空数组');
    List = [];
  }

  if (!Array.isArray(List)) {
    console.warn('⚠️ 消息列表不是数组，尝试转换:', List);
    List = [];
  }

  // 确保每条消息都有唯一的 key 和专用的思考步骤
  const processedList = List.map((msg: any, index: number) => {
    console.log('🔍 处理消息:', msg);

    // 解析思考过程
    let thinkingSteps = [];
    if (msg.thinkingProcess) {
      try {
        thinkingSteps = JSON.parse(msg.thinkingProcess);
        console.log('📝 解析思考过程:', thinkingSteps);

        // 后端已经按照前端格式生成数据，直接使用
        // 只需要确保时间戳格式正确
        thinkingSteps = thinkingSteps.map((step: any) => ({
          ...step,
          timestamp: step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : new Date(msg.sendTime).toLocaleTimeString()
        }));

        console.log('📝 处理后的思考过程:', thinkingSteps);
      } catch (e) {
        console.warn('⚠️ 解析思考过程失败:', e);
        thinkingSteps = [];
      }
    }

    // 处理消息内容 - 提取最终答案
    let finalContent = msg.messageContent;
    if (msg.messageType === 'ai' && thinkingSteps.length > 0) {
      // 查找最终答案步骤
      const finalStep = thinkingSteps.find((step: any) => step.type === 'final');
      if (finalStep && finalStep.content) {
        finalContent = finalStep.content;
      } else {
        // 如果没有找到最终答案步骤，清理原始消息内容
        finalContent = finalContent.replace(/^.*Action:\s*TERMINATE\s*Action\s*Input:\s*/i, '');
        finalContent = finalContent.replace(/^工具来结束思考过程并给出回应。\s*Action:\s*TERMINATE\s*Action\s*Input:\s*/i, '');
        finalContent = finalContent.trim();
      }
    }

    // 统一字段名
    const processedMsg = {
      ...msg,
      key: msg.messageId || Date.now() + index, // 使用 messageId 作为 key
      content: finalContent, // 使用处理后的消息内容
      type: msg.messageType || msg.type, // 统一消息类型字段
      time: msg.sendTime || msg.time, // 统一时间字段
      thinkingSteps: thinkingSteps, // 思考步骤
      _messageThinkingSteps: JSON.parse(JSON.stringify(thinkingSteps)), // 消息专用的思考步骤
      _isMessageCompleted: true, // 历史消息都标记为已完成
      _hasThinkingProcess: thinkingSteps.length > 0 // 标记是否有思考过程
    };

    console.log('✅ 处理后的消息:', processedMsg);
    console.log('📋 思考步骤数量:', thinkingSteps.length);
    console.log('🔍 思考步骤详情:', thinkingSteps);
    console.log('📝 最终内容:', finalContent);
    console.log('🏷️ 消息类型:', processedMsg.type);

    return processedMsg;
  });

  MessageList.value = processedList;
  msgList.value[0].list = processedList;
  isShowMessage.value = true;
  console.log('📋 设置消息列表，处理了', processedList.length, '条消息');
};


export const isShowMessage = ref(false);

export const conversationId = ref<string | null>('');

export const setConversationId = (id: any) => {
  conversationId.value = id;
};
export const getConversationId = () => {
  return conversationId.value;
};

export const newConversationId = ref<string | null>('');
export const newConversationMessage = ref<string | null>('');


export const msgList = ref([
  {
    username: '王小虎',
    list: []
  }
]);

export const getMsgList = () => {
  return msgList;
};

export const getMessageList = () => {
  return MessageList.value;
};

