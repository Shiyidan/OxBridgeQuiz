<!-- 访客首页桌面首屏及下一屏考试入口：学习轨迹独占首屏，复用现有认证与导航。 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Position, Right, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import waveUrl from '@/assets/home/hero-learning-wave.webp'

const emit = defineEmits<{
  register: [targetPath: string]
  navigate: [targetPath: string]
}>()

const sectionRef = ref<HTMLElement | null>(null)
const motionPaused = ref(false)
const motionVisible = ref(true)
let observer: IntersectionObserver | null = null
let inView = true

// 离开首屏或切换到后台标签页时暂停装饰动效，避免不可见内容持续渲染。
function syncMotionVisibility(): void {
  motionVisible.value = inView && document.visibilityState === 'visible'
}

// 用户可独立暂停背景动效，不影响诊断和学习入口。
function toggleMotion(): void {
  motionPaused.value = !motionPaused.value
}

onMounted(() => {
  document.addEventListener('visibilitychange', syncMotionVisibility)
  syncMotionVisibility()
  if (!sectionRef.value || !('IntersectionObserver' in window)) return
  observer = new IntersectionObserver(([entry]) => {
    inView = Boolean(entry?.isIntersecting)
    syncMotionVisibility()
  })
  observer.observe(sectionRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('visibilitychange', syncMotionVisibility)
})
</script>

<template>
  <section
    id="home-marketing-hero"
    ref="sectionRef"
    class="desktop-hero"
    :class="{ 'is-paused': motionPaused || !motionVisible }"
    aria-labelledby="desktop-hero-title"
  >
    <header class="desktop-hero__copy">
      <h1 id="desktop-hero-title">看清潜力，精准进阶。</h1>
      <p>先诊断，再学懂，让每一次练习更有方向。</p>
    </header>

    <div class="desktop-hero__journey" aria-label="备考流程：诊断、学习、练习、复盘">
      <div class="desktop-hero__wave">
        <img :src="waveUrl" width="2172" height="724" alt="" fetchpriority="high" />
        <ol class="desktop-hero__steps">
          <li>诊断</li>
          <li>学习</li>
          <li>练习</li>
          <li>复盘</li>
        </ol>
      </div>
      <AppButton
        class="desktop-hero__motion"
        type="text"
        size="mini"
        :icon="motionPaused ? VideoPlay : VideoPause"
        icon-only
        :aria-label="motionPaused ? '播放背景动效' : '暂停背景动效'"
        :aria-pressed="motionPaused"
        @click="toggleMotion"
      />
    </div>

    <div class="desktop-hero__actions">
      <AppButton
        class="desktop-hero__primary"
        size="large"
        :icon="Position"
        icon-position="right"
        @click="emit('register', '/assessment')"
      >
        开始免费诊断
      </AppButton>
      <AppButton
        class="desktop-hero__secondary"
        type="text"
        size="large"
        :icon="Right"
        icon-position="right"
        @click="emit('navigate', '/question-bank?mode=learning')"
      >
        探索学习内容
      </AppButton>
    </div>
  </section>

  <section class="desktop-exam-section" aria-labelledby="desktop-exam-title">
    <div class="desktop-hero__exams">
      <h2 id="desktop-exam-title">选择你的下一场考试。</h2>
      <RouterLink class="desktop-hero__exam" to="/exam-intro/esat">
        <div>
          <h3>ESAT</h3>
          <p>数学 · 科学</p>
          <small>Mathematics 1 必选，再选两科</small>
        </div>
        <el-icon aria-hidden="true"><Right /></el-icon>
      </RouterLink>
      <RouterLink class="desktop-hero__exam" to="/exam-intro/tmua">
        <div>
          <h3>TMUA</h3>
          <p>数学 · 推理</p>
          <small>Paper 1 · Paper 2</small>
        </div>
        <el-icon aria-hidden="true"><Right /></el-icon>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.desktop-hero,
.desktop-exam-section {
  --hero-ink: #142129;
  --hero-muted: #6d7d91;
  --hero-accent: #d1f55b;
  background: #fff;
  color: var(--hero-ink);
}

.desktop-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: max(590px, calc(100svh - var(--home-header-height, 72px)));
  overflow: hidden;
  padding: clamp(32px, 4vh, 56px) 0 30px;
}

.desktop-hero__copy {
  position: relative;
  z-index: 1;
  text-align: center;
  padding-inline: 32px;
}

.desktop-hero__copy h1 {
  margin: 0;
  font-size: clamp(42px, 3.65vw, 56px);
  font-weight: 750;
  line-height: 1.3;
  letter-spacing: 0.025em;
}

.desktop-hero__copy > p {
  margin: 12px 0 0;
  color: var(--hero-muted);
  font-size: clamp(17px, 1.4vw, 21px);
  line-height: 1.7;
  letter-spacing: 0.045em;
}

.desktop-hero__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  margin-top: 24px;
}

.desktop-hero__primary.app-button {
  --app-button-bg: #142129;
  --app-button-border: #142129;
  --app-button-color: #fff;
  --app-button-hover-bg: #263b49;
  --app-button-hover-border: #263b49;
  min-width: 196px;
}

.desktop-hero__primary :deep(.el-icon) {
  color: var(--hero-accent);
}

.desktop-hero__secondary.app-button {
  --app-button-color: #142129;
}

.desktop-hero :focus-visible,
.desktop-exam-section :focus-visible {
  outline: 2px solid #387ed5;
  outline-offset: 5px;
}

.desktop-hero__journey {
  position: relative;
  width: min(1440px, 100%);
  height: clamp(190px, 17vw, 250px);
  flex: none;
  overflow: hidden;
  margin: 8px auto 0;
}

.desktop-hero__wave {
  position: absolute;
  top: 50%;
  width: 100%;
  transform: translateY(-50%);
  animation: hero-wave-drift 12s ease-in-out infinite;
}

.desktop-hero__wave img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 1;
  object-fit: contain;
}

.desktop-hero__steps {
  margin: 0;
  padding: 0;
  list-style: none;
}

.desktop-hero__steps li {
  position: absolute;
  transform: translate(-50%, -100%);
  padding-bottom: 24px;
  color: var(--hero-ink);
  font-size: clamp(15px, 1.3vw, 19px);
  font-weight: 650;
  letter-spacing: 0.08em;
}

.desktop-hero__steps li:nth-child(1) {
  left: 19.38%;
  top: 54.42%;
}
.desktop-hero__steps li:nth-child(2) {
  left: 39.78%;
  top: 61.33%;
}
.desktop-hero__steps li:nth-child(3) {
  left: 59.81%;
  top: 55.52%;
}
.desktop-hero__steps li:nth-child(4) {
  left: 79.1%;
  top: 40.61%;
}

.desktop-hero__motion.app-button {
  position: absolute;
  right: 32px;
  bottom: 24px;
  color: var(--hero-muted);
}

.desktop-hero.is-paused .desktop-hero__wave,
.desktop-hero__journey:hover .desktop-hero__wave,
.desktop-hero__journey:focus-within .desktop-hero__wave {
  animation-play-state: paused;
}

/* 考试选择从首屏流式排版中移出，滚动到下一屏才出现。 */
.desktop-exam-section {
  padding-block: 48px;
  border-top: 1px solid #edf2f8;
}

.desktop-hero__exams {
  position: relative;
  display: grid;
  grid-template-columns: 0.9fr 1fr 1fr;
  align-items: center;
  width: min(1180px, calc(100% - 112px));
  margin: 0 auto;
}

.desktop-hero__exams > h2 {
  margin: 0;
  padding-right: 24px;
  font-size: clamp(18px, 1.6vw, 23px);
  font-weight: 650;
}

.desktop-hero__exam {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 10px 34px;
  border-radius: 5px;
  transition: background-color 180ms ease;
}

.desktop-hero__exam + .desktop-hero__exam {
  border-left: 1px solid #dce5f0;
  border-radius: 0 5px 5px 0;
}

.desktop-hero__exam:hover {
  background-color: #f5f8fc;
}

.desktop-hero__exam h3 {
  margin: 0;
  font-size: clamp(30px, 3vw, 42px);
  font-weight: 750;
  line-height: 1.15;
  letter-spacing: -0.015em;
}

.desktop-hero__exam p {
  margin: 8px 0 4px;
  font-size: 14px;
  font-weight: 550;
}

.desktop-hero__exam small {
  color: var(--hero-muted);
  font-size: 12px;
  line-height: 1.6;
}

.desktop-hero__exam > .el-icon {
  flex: none;
  padding: 6px;
  border: 1px solid #cad6e6;
  border-radius: 50%;
  color: #7187a4;
  font-size: 28px;
  transition: transform 180ms ease;
}

.desktop-hero__exam:hover > .el-icon {
  transform: translateX(3px);
}

@keyframes hero-wave-drift {
  0%,
  100% {
    transform: translateY(-50%);
  }
  50% {
    transform: translateY(calc(-50% - 8px));
  }
}

@media (max-width: 1100px) {
  .desktop-hero__exams {
    width: calc(100% - 64px);
  }
  .desktop-hero__exam {
    padding-inline: 22px;
  }
}

@media (max-width: 860px) {
  .desktop-hero,
  .desktop-exam-section {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .desktop-hero__wave {
    animation: none;
  }
  .desktop-hero__motion.app-button {
    display: none;
  }
  .desktop-hero__exam,
  .desktop-hero__exam > .el-icon {
    transition: none;
  }
}
</style>
