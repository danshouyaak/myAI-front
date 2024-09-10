// 测试接口
import { httpGet } from './https.ts';

export const checkTest = () => httpGet({ url: '/Hello/test', method: 'get' });