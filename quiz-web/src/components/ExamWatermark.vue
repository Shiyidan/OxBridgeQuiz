<!-- 在线答题页水印：以品牌与用户名生成低密度多行斜向覆盖层。 -->
<template>
  <div class="exam-watermark" aria-hidden="true">
    <div class="exam-watermark__grid">
      <span v-for="index in 48" :key="index" class="exam-watermark__item">
        <strong>{{ watermarkText }}</strong>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    username?: string
  }>(),
  {
    username: '',
  },
)

const watermarkText = computed(() => `AceMock · ${props.username.trim() || '在线答题'}`)
</script>

<style scoped lang="scss">
.exam-watermark {
  position: fixed;
  z-index: 40;
  top: 64px;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

.exam-watermark__grid {
  position: absolute;
  inset: -180px -160px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  grid-auto-rows: 180px;
  align-items: center;
  transform: rotate(-18deg) scale(1.08);
  transform-origin: center;
}

.exam-watermark__item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: rgba(51, 65, 85, 0.1);
  line-height: 1;
  text-align: center;
  white-space: nowrap;
}

.exam-watermark__item strong {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

@media (max-width: 768px) {
  .exam-watermark__grid {
    inset: -140px -120px;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    grid-auto-rows: 156px;
  }
}
</style>
