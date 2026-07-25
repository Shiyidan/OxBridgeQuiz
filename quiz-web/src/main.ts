// 顺序很重要：先加载 Element Plus 默认样式，再让 main.css 里的覆盖生效
import 'element-plus/dist/index.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { configureRequestAuth } from './utils/request'

const app = createApp(App)

app.use(createPinia())
app.use(ElementPlus)

// 页面启动时通过HttpOnly刷新Cookie恢复服务端会话，再执行路由守卫。
const auth = useAuthStore()
configureRequestAuth({
  getAccessToken: () => auth.token,
  setAccessToken: auth.setAccessToken,
  clearSession: auth.clearLocalSession,
})
await auth.restoreSession()

app.use(router)
app.mount('#app')
