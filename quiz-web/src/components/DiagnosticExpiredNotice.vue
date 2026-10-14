<!-- 诊断历史失效提示：仅供已标记失效的历史详情与报告使用，引导返回年度目录。 -->
<template>
  <section role="status" class="diagnostic-expired">
    <p>当前试卷已失效，请查看最新版试卷</p>
    <AppButton type="primary" @click="router.push('/assessment')">查看最新版试卷</AppButton>
  </section>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppButton from '@/components/AppButton.vue'
const router = useRouter()
</script>
<style scoped>
.diagnostic-expired { padding: 48px 24px; text-align: center; }
.diagnostic-expired p { margin-bottom: 24px; }
</style>
