// 配置前端开发服务器，并为本地联调测试环境提供同源 API 代理。
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const useTestApi = command === 'serve' && env.VITE_API_ENV === 'test'
  const testApiOrigin = env.VITE_TEST_API_ORIGIN

  if (useTestApi && !testApiOrigin) {
    throw new Error('VITE_TEST_API_ORIGIN is required in quiz-web/.env.test.local for dev:test')
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      open: false,
      proxy: useTestApi
        ? {
            '/api': {
              target: testApiOrigin,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  }
})
