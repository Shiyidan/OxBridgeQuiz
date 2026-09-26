<!-- 被封禁账号的公开说明页，无需登录即可查看说明和申请复核。 -->
<template>
  <main class="restricted-page">
    <el-card class="restricted-card" shadow="never">
      <h1>账号访问受限</h1>
      <AccountRestrictionNotice />
      <p class="restricted-help">复核通过后，请重新登录。原有学习记录会保留。</p>
      <el-button @click="router.replace('/')">返回首页</el-button>
      <el-button @click="router.replace('/login')">重新登录</el-button>
    </el-card>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import AccountRestrictionNotice from '@/components/AccountRestrictionNotice.vue'
const router = useRouter()
</script>

<style scoped>
.restricted-page {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: 24px;
  background: var(--color-bg);
}
.restricted-card {
  width: 100%;
  max-width: 560px;
  border-radius: 16px;
}
h1 {
  margin: 0 0 24px;
  font-size: 26px;
}
.restricted-help {
  margin: 24px 0;
  color: var(--color-ink-soft);
  line-height: 1.7;
}
</style>
