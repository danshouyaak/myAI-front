import { createApp } from 'vue';
import './style.css';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'md-editor-v3/lib/style.css';

import 'highlight.js/styles/default.css';
import App from './App.vue';

const app = createApp(App);

app.use(ElementPlus).mount('#app');
