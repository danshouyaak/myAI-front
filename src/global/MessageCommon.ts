import { ref } from 'vue';

const MessageList = ref<any[]>([]);

export const setMessageList = (List: any) => {
  MessageList.value = List;
  msgList.value[0].list = List;
  isShowMessage.value = true;
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

