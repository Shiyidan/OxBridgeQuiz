<template>
  <div class="profile-page">
    <NavBar />
    <div class="page-body">
      <h1>个人中心</h1>
      <p class="page-desc">用户个人信息、学习记录、订阅管理等。</p>
      <div class="placeholder-card">功能开发中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 个人中心（学生端个人资料、学习数据、订阅管理）
import NavBar from '@/components/NavBar.vue'
</script>

<style scoped lang="scss">
.profile-page { min-height: 100vh; background: var(--color-bg, #f8fafc); }
.page-body {
  max-width: var(--container-max, 1280px); margin: 0 auto; padding: 48px 2rem;
}
h1 { font-size: var(--text-3xl, 1.875rem); font-weight: 800; color: var(--color-text, #0f172a); margin: 0 0 8px; }
.page-desc { font-size: var(--text-base, 1rem); color: var(--color-text-secondary, #475569); margin: 0 0 32px; }
.placeholder-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
  padding: 80px 40px; text-align: center; color: #94a3b8; font-size: 0.9rem;
}
</style>
