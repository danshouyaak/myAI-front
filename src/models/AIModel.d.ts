import { ref } from 'vue';

export interface aiModels {
  id: number;
  name: string;
  url: string;
  description: string;
  useReact?: boolean;    // 是否使用 ReAct 模式
  useStream?: boolean;   // 是否使用流式输出
  temperature?: number;  // 温度参数
  maxTokens?: number;    // 最大token数
  status?: number;      // 模型状态
  createTime?: string;  // 创建时间
  updateTime?: string;  // 更新时间
  isDelete?: number;    // 是否删除
}

export const aiModels: aiModels[] = [
  {
    id: 1,
    name: '申清 Kimi',
    avatar: 'kimi-logo.svg',
    description: '深度研究内测'
  },
  {
    id: 2,
    name: '教案设计助手',
    avatar: 'doctor.png',
    description: '专业的教案设计助手'
  },
  {
    id: 3,
    name: '数学专家',
    avatar: 'Mathematician.png',
    description: '专业的数学解答助手'
  },
  {
    id: 4,
    name: '小说创作助手',
    avatar: 'userAvatar.png',
    description: '帮助你创作小说'
  },
  {
    id: 5,
    name: '游戏设计师',
    avatar: 'userAvata.png',
    description: '帮助你设计游戏'
  }
];
