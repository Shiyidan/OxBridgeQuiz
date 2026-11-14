<!-- 未解锁学习区的装饰底图：纯 CSS 色块，不读取、渲染或请求任何课程资源。 -->
<template>
  <div class="locked-learning-placeholder" aria-hidden="true" inert>
    <div class="placeholder-tabs"><i></i><i></i><i></i></div>
    <div class="placeholder-title"></div>
    <div class="placeholder-summary"></div>
    <div class="placeholder-columns">
      <div class="placeholder-lines">
        <i v-for="index in 9" :key="index"></i>
      </div>
      <div class="placeholder-figure">
        <div class="placeholder-axis"></div>
        <div class="placeholder-curve"></div>
      </div>
    </div>
    <div class="placeholder-lines placeholder-lines--bottom"><i></i><i></i><i></i></div>
  </div>
</template>

<style scoped>
.locked-learning-placeholder {
  height: 100%;
  padding: 28px;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  background: var(--color-surface);
}
.placeholder-tabs {
  display: flex;
  gap: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-line);
}
.placeholder-tabs i,
.placeholder-title,
.placeholder-summary,
.placeholder-lines i {
  display: block;
  height: 12px;
  border-radius: 4px;
  background: #a9b8cb;
}
.placeholder-tabs i {
  width: 84px;
}
.placeholder-title {
  width: 32%;
  height: 24px;
  margin: 32px 0 20px;
}
.placeholder-summary {
  width: 68%;
  background: #c5d1df;
}
.placeholder-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 40px;
  margin-top: 36px;
}
.placeholder-lines {
  display: grid;
  gap: 22px;
  align-content: start;
}
.placeholder-lines i {
  background: #c5d1df;
}
.placeholder-lines i:nth-child(3n) {
  width: 65%;
}
.placeholder-figure {
  position: relative;
  min-height: 240px;
  overflow: hidden;
  border-radius: 12px;
  background: #edf3fb;
}
.placeholder-axis {
  position: absolute;
  inset: 18% 15%;
  border-left: 2px solid #a9b8cb;
  border-bottom: 2px solid #a9b8cb;
}
.placeholder-curve {
  position: absolute;
  inset: 15% 25% 30%;
  border-bottom: 4px solid #7b9fd1;
  border-radius: 0 0 50% 50%;
  transform: rotate(-15deg);
}
.placeholder-lines--bottom {
  margin-top: 40px;
}
</style>
