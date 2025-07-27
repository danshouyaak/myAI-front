import { ref } from 'vue';

// AI模型接口定义
export interface AIModel {
  id: number;
  name: string;
  url: string;
  description: string;
  useReact?: boolean;    // 是否使用 ReAct 模式
  useStream?: boolean;   // 是否使用流式输出
}

// 默认AI模型列表
export const defaultAiModels: AIModel[] = [
  {
    id: 1,
    name: 'GPT-3.5',
    url: 'gpt3.5.png',
    description: '通用AI助手',
    useStream: true
  },
  {
    id: 2,
    name: 'ReAct助手',
    url: 'react.png',
    description: '具有思考和行动能力的AI助手',
    useReact: true
  },
  {
    id: 3,
    name: 'Auto助手',
    url: 'auto.png',
    description: '自动选择最佳模式的AI助手',
    useStream: true
  }
];

// 当前选中的AI模型
export const aiModel = ref<AIModel>(defaultAiModels[0]);

// 获取当前选中的AI模型
export const getAIModel = async () => {
  return aiModel.value;
};

// 设置当前AI模型
export const setAIModel = async (model: AIModel) => {
  aiModel.value = model;
  return true;
};


