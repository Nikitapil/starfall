import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/styles/main.css';

import App from './App.vue';
import router from './router';
import { validation } from './plugins/validation.ts';
import { i18n } from '@/plugins/i18n.ts';

const app = createApp(App);

app.use(i18n);
app.use(createPinia());
app.use(router);
app.use(validation);

app.mount('#app');
