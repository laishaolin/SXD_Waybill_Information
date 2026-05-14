import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:5320/api',
            ws: true,
          },
          // 飞驼 API 代理
          '/freetower-api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/freetower-api/, ''),
            target: 'http://openapi.freightower.com',
            ws: true,
          },
        },
      },
    },
  };
});
