//对于axios进行二次封装
import axios from 'axios';
import router from '../router';
//1.利用axios对象的方法create，去创建一个axios实例
//2.request就是axios

axios.defaults.withCredentials = true;

const requests = axios.create({
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  },
  // 配置axios对象
  //   基础路径
  // baseURL: 'http://localhost:8024',  http://47.119.128.91/

  baseURL: import.meta.env.MODE === 'development' ? 'http://localhost:8024' : ' http://47.119.128.91:8024',
  //   请求超出的时间
  timeout: 5000,

  withCredentials: true // 允许携带cookie

});


//请求拦截器：再发请求之前，请求拦截器可以检测的到，可以在请求发送出去之前做一些事情
requests.interceptors.request.use(
  (config) => {
    config.headers['Content-Type'] = 'application/json;charset=utf-8';

    // config.headers['token'] = user.token;  // 设置请求头
    //取出sessionStorage里面缓存的用户信息
    // let userJson = sessionStorage.getItem('user');
    // if (!userJson) {
    //   router.push('/login');
    // }
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
