import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // server: {
  //   host: true,
  //   proxy: {
  //     // Все запросы, начинающиеся с /api, будут перенаправлены на NestJS
  //     '/api': {
  //       target: 'http://192.168.1.107:5000/', // Укажи свой локальный IP и порт бэкенда
  //       changeOrigin: true,
  //       secure: false
  //     }
  //   }
  // }
});
