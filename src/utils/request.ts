//对于axios进行二次封装
import axios from 'axios';
//1.利用axios对象的方法create，去创建一个axios实例
//2.request就是axios

const requests = axios.create({
  // 配置axios对象
  //   基础路径
  baseURL: 'http://localhost:8024',
  //   请求超出的时间
  timeout: 3000
});

//请求拦截器：再发请求之前，请求拦截器可以检测的到，可以在请求发送出去之前做一些事情
requests.interceptors.request.use(
  (config) => {
    return config;
  },
  (err) => {
    console.log(err);
    return Promise.reject(new Error('file'));
  }
);

// 响应拦截器
requests.interceptors.response.use(
  (res) => {
    return res.data;
  },
  (err) => {
    console.log(err);
    return Promise.reject(err);
  }
);

export default requests;
