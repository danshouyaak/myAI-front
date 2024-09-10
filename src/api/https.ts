// 统一封装get post请求

import requests from '../utils/request.ts';

// get请求
export function httpGet({ url, meth, params = {} }) {
  return new Promise((resolve, reject) => {
    requests({
      url,
      meth,
      params
    })
      .then((reslut) => {
        console.log(reslut);
        resolve(reslut);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

export function httpPost({ url, method, data = {} }) {
  return new Promise((resolve, reject) => {
    requests({ url, method, data })
      .then((reslut) => {
        resolve(reslut);
      })
      .catch((err) => {
        reject(err);
      });
  });
}