<!-- 教材库管理（占位） -->
<template>
  <div class="sub-page">
    <div class="page-top-bar">
      <button class="back-btn" @click="$router.push('/admin/core-library')">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        返回类别列表
      </button>
    </div>
    <div class="page-body">
      <h2 class="page-title">教材库管理</h2>
      <p class="page-desc">核心参考书、官方指南、知识点总结讲义。</p>
      <div class="coming-soon">功能开发中...</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sub-page {
  min-height: 100%;
}
.page-top-bar {
  padding: 28px 40px 0;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s ease;
  svg {
    width: 16px;
    height: 16px;
  }
  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }
}
.page-body {
  padding: 24px 40px 48px;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
}
.page-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 32px;
}
.coming-soon {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 80px 40px;
  text-align: center;
  color: #94a3b8;
  font-size: 1rem;
}
</style>
