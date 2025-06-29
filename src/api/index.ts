// 测试接口
import { httpGet } from './https.ts';
import requests from '../utils/request.ts';

export const checkTest = () => httpGet({ url: '/Hello/test', method: 'get' });

// 获取用户登录状态
export const getUserLoginStatus = async () => {
  try {
    const res = await requests.get('/user/get/login');
    return res.code !== 40100 && res.data !== null ? res.data : null;
  } catch (error) {
    console.error('获取登录状态失败:', error);
    return null;
  }
};
