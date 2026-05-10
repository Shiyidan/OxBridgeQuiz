import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface UserInfo {
  name: string
  major: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => user.value !== null)

  function login(): void {
    user.value = {
      name: '张同学',
      major: '帝国理工工程',
    }
  }

  function logout(): void {
    user.value = null
  }

  return { user, isLoggedIn, login, logout }
})
