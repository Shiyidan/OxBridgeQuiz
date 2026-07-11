<!-- ESAT 错题逐题分析占位模块：后续承载答题导航、题目解析和复习入口。 -->
<template>
  <section class="module-placeholder">
    <span aria-hidden="true">!</span>
    <div>
      <h2>错题逐题分析</h2>
      <p>模块占位，下一阶段单独开发</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.module-placeholder {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 104px;
  margin-bottom: 28px;
  padding: 24px;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.module-placeholder > span {
  font-size: var(--text-xl);
}

.module-placeholder h2,
.module-placeholder p {
  margin: 0;
}

.module-placeholder h2 {
  font-size: var(--text-lg);
}

.module-placeholder p {
  margin-top: 5px;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}
</style>
