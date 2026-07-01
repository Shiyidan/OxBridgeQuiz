// 顺序很重要：先加载 Element Plus 默认样式，再让 main.css 里的覆盖生效
import 'element-plus/dist/index.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 从 localStorage 恢复登录态
const auth = useAuthStore()
auth.initFromStorage()

app.mount('#app')
