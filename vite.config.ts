import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import path from 'path'; // 导入path模块

// https://vitejs.dev/config/
export default defineConfig({
  base: './',  // 修改为相对路径
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    }),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // 配置 '@' 指向 'src' 目录
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8024',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('代理请求:', {
              path: proxyReq.path,
              headers: proxyReq.getHeaders()
            });
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('代理响应头:', proxyRes.headers);
          });
        }
      },
      '/stream': {
        target: 'http://localhost:8024',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('流式请求:', {
              path: proxyReq.path,
              headers: proxyReq.getHeaders()
            });
          });
        }
      },
      '/user': {
        target: 'http://localhost:8024',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('用户请求:', {
              path: proxyReq.path,
              headers: proxyReq.getHeaders()
            });
          });
        }
      }
    }
  }
});
