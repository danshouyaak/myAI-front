// 定义泛型接口
export interface aiModel {
  id: number;
  name: string;
  avatar: string;
  description: string;
}

// 全局 aiModel 对象
let aiModel: aiModel = {
  id: 1,
  name: 'AI. 张医生',
  avatar: 'src/assets/doctor.png',
  description: '当医生已经30年了'
};

export const getAIModel = (): aiModel => {
  return aiModel;
};
export const setAIModel = (model: aiModel) => {
  aiModel = model;
};


