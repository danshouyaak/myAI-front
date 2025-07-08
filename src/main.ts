import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'md-editor-v3/lib/style.css';
import router from './router/index.js';
import 'highlight.js/styles/default.css';
import App from './App.vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import VueElementPlusX from 'vue-element-plus-x';

const app = createApp(App);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(ElementPlus).use(VueElementPlusX).use(router).mount('#app');
