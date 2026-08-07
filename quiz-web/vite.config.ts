// 配置前端开发服务器，并为本地联调测试环境提供同源 API 代理。
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { seoPrerenderPlugin } from './build/seoPrerender.ts'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const useTestApi = command === 'serve' && env.VITE_API_ENV === 'test'
  const useOnlineApi = command === 'serve' && env.VITE_API_ENV === 'prod'
  const testApiOrigin = env.VITE_TEST_API_ORIGIN
  const onlineApiOrigin = env.VITE_ONLINE_API_ORIGIN
  const remoteApiOrigin = useTestApi ? testApiOrigin : useOnlineApi ? onlineApiOrigin : ''

  if (useTestApi && !testApiOrigin) {
    throw new Error('VITE_TEST_API_ORIGIN is required in quiz-web/.env.test.local for dev:test')
  }
  if (useOnlineApi && !onlineApiOrigin) {
    throw new Error(
      'VITE_ONLINE_API_ORIGIN is required in quiz-web/.env.online.local for dev:online',
    )
  }

  return {
    plugins: [vue(), seoPrerenderPlugin()],
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
      proxy: remoteApiOrigin
        ? {
            '/api': {
              target: remoteApiOrigin,
              changeOrigin: true,
              secure: true,
              cookieDomainRewrite: '',
              configure(proxy) {
                if (!useOnlineApi) return
                proxy.on('proxyReq', (proxyRequest) => {
                  proxyRequest.setHeader('origin', onlineApiOrigin)
                  proxyRequest.setHeader('referer', `${onlineApiOrigin}/`)
                })
                proxy.on('proxyRes', (proxyResponse) => {
                  const cookies = proxyResponse.headers['set-cookie']
                  if (!cookies) return
                  proxyResponse.headers['set-cookie'] = cookies.map((cookie) =>
                    cookie.replace(/;\s*Secure/gi, ''),
                  )
                })
              },
            },
          }
        : undefined,
    },
  }
})
