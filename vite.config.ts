import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import path from 'path'; // 导入path模块
// 使用ES6模块语法来设置路径别名
const pathResolve = (dir) => path.resolve(__dirname, dir);
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // 配置 '@' 指向 'src' 目录
    },
    server: {
      // port: 4000, //启动端口
      proxy: {
        '/api': {
          // 后台地址
          target: 'http://localhost:8024/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }

});
