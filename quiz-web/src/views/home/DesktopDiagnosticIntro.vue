<!-- 桌面营销首页诊断介绍：真实页面三卡片缓慢循环，展示流程而不打开预览弹窗。 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import questionUrl from '@/assets/home/tmua-diagnostic-question-03.png'
import reportUrl from '@/assets/home/diagnostic-score-distribution.png'
import learningPathUrl from '@/assets/home/esat-diagnostic-report-overview.png'

const cards = [
  {
    label: '01 / DIAGNOSE',
    title: '用真题，找到起点。',
    description: '在真实题目中检验知识与推理，留下可回看的作答记录。',
    stage: '真题诊断',
    image: questionUrl,
    alt: 'TMUA Paper 1 第 3 题的真实作答页面，包含题号导航、题干与选项',
    kind: 'question',
  },
  {
    label: '02 / UNDERSTAND',
    title: '不止看分数，更看原因。',
    description: '结合估分区间、知识点表现和题目分析，理解这次作答。',
    stage: '诊断报告',
    image: reportUrl,
    alt: '诊断报告的数学 2 估分分布、证据范围与下一步建议',
    kind: 'report',
  },
  {
    label: '03 / IMPROVE',
    title: '让下一步，有据可循。',
    description: '从报告中的提升建议出发，找到接下来要学、要练的内容。',
    stage: '提升路径',
    image: learningPathUrl,
    alt: '真实诊断报告中的三阶段学习路径、备考信息与模块时间效率',
    kind: 'path',
  },
] as const

const sectionRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
const groupRef = ref<HTMLElement | null>(null)
const activeSlide = ref(0)
const reducedMotion = ref(false)
let frame: number | null = null
let lastTime: number | null = null
let distance = 0
let offset = 0
let visible = false
let hovered = false
let focused = false
let visibilityObserver: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let motionPreference: MediaQueryList | null = null

// 位移限制在一组卡片的宽度内，副本接续首尾，循环时不会跳回空白区域。
function renderPosition(): void {
  if (!distance || !trackRef.value) return
  offset = ((offset % distance) + distance) % distance
  trackRef.value.style.transform = `translate3d(${-offset}px, 0, 0)`
  activeSlide.value = Math.floor((offset + 1) / (distance / cards.length)) % cards.length
}

// 以每秒 18px 的恒定速度缓慢左移；装饰位移直接写样式，不逐帧更新 Vue 状态。
function advanceFrame(time: number): void {
  if (lastTime !== null) offset += (Math.min(time - lastTime, 80) / 1000) * 18
  lastTime = time
  renderPosition()
  frame = window.requestAnimationFrame(advanceFrame)
}

// 用户操作、系统偏好与页面可见性共同决定播放，后台及阅读期间不执行动画帧。
function syncPlayback(): void {
  if (frame !== null) window.cancelAnimationFrame(frame)
  frame = null
  lastTime = null
  if (
    reducedMotion.value ||
    hovered ||
    focused ||
    !visible ||
    !distance ||
    document.visibilityState !== 'visible'
  )
    return
  frame = window.requestAnimationFrame(advanceFrame)
}

// 容器缩放时保留当前相对进度，重新测量真实卡片间距。
function measureTrack(): void {
  const nextDistance = groupRef.value?.getBoundingClientRect().width ?? 0
  offset = distance ? (offset / distance) * nextDistance : 0
  distance = nextDistance
  renderPosition()
  syncPlayback()
}

// 手动切换按整张卡片定位，减少动效模式下也能查看全部三个阶段。
function moveSlide(direction: number): void {
  if (!distance) return
  const step = distance / cards.length
  offset = (Math.round(offset / step) + direction) * step
  renderPosition()
}

// 悬停期间停在原位，便于阅读截图和介绍文字。
function setHovered(value: boolean): void {
  hovered = value
  syncPlayback()
}

// 键盘焦点进入诊断区时暂停，便于逐张阅读内容。
function handleFocusIn(): void {
  focused = true
  syncPlayback()
}

// 只有焦点真正离开该区块才恢复自动播放。
function handleFocusOut(event: FocusEvent): void {
  if (event.relatedTarget instanceof Node && sectionRef.value?.contains(event.relatedTarget)) return
  focused = false
  syncPlayback()
}

// 系统启用减少动态效果时立即停止自动播放，手动切换仍可使用。
function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion.value = event.matches
  syncPlayback()
}

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionPreference.matches
  motionPreference.addEventListener('change', handleMotionChange)
  document.addEventListener('visibilitychange', syncPlayback)
  resizeObserver = new ResizeObserver(measureTrack)
  if (groupRef.value) resizeObserver.observe(groupRef.value)
  visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      syncPlayback()
    },
    { threshold: 0.1 },
  )
  if (sectionRef.value) visibilityObserver.observe(sectionRef.value)
  measureTrack()
})

onBeforeUnmount(() => {
  if (frame !== null) window.cancelAnimationFrame(frame)
  visibilityObserver?.disconnect()
  resizeObserver?.disconnect()
  motionPreference?.removeEventListener('change', handleMotionChange)
  document.removeEventListener('visibilitychange', syncPlayback)
})
</script>

<template>
  <section
    id="home-diagnostic-intro"
    ref="sectionRef"
    class="diagnostic-intro"
    aria-labelledby="diagnostic-intro-title"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <header class="diagnostic-intro__header">
      <div>
        <p class="diagnostic-intro__eyebrow">01 / DIAGNOSTIC TEST</p>
        <h2 id="diagnostic-intro-title">一次诊断，看清下一步。</h2>
        <p class="diagnostic-intro__description">
          从真实作答，到读懂报告，再找到适合自己的提升方向。
        </p>
      </div>
    </header>

    <div
      class="diagnostic-intro__viewport"
      tabindex="0"
      aria-label="诊断流程卡片，聚焦后暂停，可使用左右方向键浏览"
      @keydown.left.prevent="moveSlide(-1)"
      @keydown.right.prevent="moveSlide(1)"
      @mouseenter="setHovered(true)"
      @mouseleave="setHovered(false)"
    >
      <div ref="trackRef" class="diagnostic-intro__track">
        <div ref="groupRef" class="diagnostic-intro__group">
          <article v-for="card in cards" :key="card.kind" class="diagnostic-intro__card">
            <figure
              class="diagnostic-intro__image"
              :class="`diagnostic-intro__image--${card.kind}`"
            >
              <img :src="card.image" :alt="card.alt" loading="lazy" decoding="async" />
              <figcaption>页面演示</figcaption>
            </figure>
            <div class="diagnostic-intro__body">
              <p class="diagnostic-intro__label">{{ card.label }}</p>
              <h3>{{ card.title }}</h3>
              <p>{{ card.description }}</p>
            </div>
          </article>
        </div>
        <!-- 仅作为无缝移动的视觉副本，不重复进入辅助技术阅读顺序。 -->
        <div class="diagnostic-intro__group" aria-hidden="true" inert>
          <article v-for="card in cards" :key="card.kind" class="diagnostic-intro__card">
            <div class="diagnostic-intro__image" :class="`diagnostic-intro__image--${card.kind}`">
              <img :src="card.image" alt="" loading="lazy" decoding="async" />
              <span class="diagnostic-intro__demo">页面演示</span>
            </div>
            <div class="diagnostic-intro__body">
              <p class="diagnostic-intro__label">{{ card.label }}</p>
              <h3>{{ card.title }}</h3>
              <p>{{ card.description }}</p>
            </div>
          </article>
        </div>
      </div>
    </div>

    <footer class="diagnostic-intro__footer">
      <div class="diagnostic-intro__stages" aria-label="诊断的三个阶段">
        <span
          v-for="(card, index) in cards"
          :key="card.kind"
          :class="{ 'is-current': activeSlide === index }"
          :aria-current="activeSlide === index ? 'step' : undefined"
        >
          <small>0{{ index + 1 }}</small
          >{{ card.stage }}
        </span>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.diagnostic-intro {
  --diagnostic-gap: 22px;
  --diagnostic-card: clamp(350px, 33vw, 490px);
  --diagnostic-inset: max(48px, calc((100% - 1370px) / 2));
  padding: 58px 0 44px;
  scroll-margin-top: var(--home-header-height, 72px);
  overflow: hidden;
  background: #eaf2fc;
  color: #142129;
}

.diagnostic-intro__header,
.diagnostic-intro__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  margin-inline: var(--diagnostic-inset);
}

.diagnostic-intro__eyebrow {
  margin: 0 0 12px;
  color: #607d9d;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.12em;
}

.diagnostic-intro__header h2 {
  margin: 0;
  font-size: clamp(30px, 2.6vw, 40px);
  font-weight: 720;
  line-height: 1.35;
}

.diagnostic-intro__description {
  margin: 14px 0 0;
  color: #62758b;
  font-size: 16px;
  line-height: 1.7;
}

.diagnostic-intro :focus-visible {
  outline: 2px solid #387ed5;
  outline-offset: 4px;
}

.diagnostic-intro__viewport {
  margin: 32px 0 0 var(--diagnostic-inset);
  overflow: hidden;
}
.diagnostic-intro__track {
  display: flex;
  width: max-content;
  will-change: transform;
}
.diagnostic-intro__group {
  display: flex;
  gap: var(--diagnostic-gap);
  padding-right: var(--diagnostic-gap);
  flex: none;
}
.diagnostic-intro__card {
  width: var(--diagnostic-card);
  flex: none;
  padding: 12px;
  border: 1px solid #dce6f2;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 5px 14px rgb(31 65 104 / 4%);
}

.diagnostic-intro__image {
  position: relative;
  aspect-ratio: 1.65;
  margin: 0;
  overflow: hidden;
  border: 1px solid #edf1f6;
  border-radius: 12px;
  background: #fafbfd;
}

.diagnostic-intro__image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}
.diagnostic-intro__image--report img {
  object-fit: contain;
  background: #fff;
}
/* 长报告只呈现底部的学习路径区域，保留原页面内容及真实数据。 */
.diagnostic-intro__image--path img {
  height: auto;
  transform: translateY(-76%);
}
.diagnostic-intro__image figcaption,
.diagnostic-intro__demo {
  position: absolute;
  top: 9px;
  right: 9px;
  padding: 4px 9px;
  border: 1px solid #dfe7f2;
  border-radius: 20px;
  background: #f7faff;
  color: #72849a;
  font-size: 10px;
  line-height: 1.4;
}

.diagnostic-intro__body {
  padding: 22px 12px 16px;
}
.diagnostic-intro__body .diagnostic-intro__label {
  margin: 0 0 10px;
  color: #397dcc;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.06em;
}
.diagnostic-intro__body h3 {
  margin: 0;
  font-size: clamp(21px, 1.7vw, 26px);
  font-weight: 700;
  line-height: 1.4;
}
.diagnostic-intro__body > p:last-child {
  min-height: 3.4em;
  margin: 12px 0 0;
  color: #66778a;
  font-size: 14px;
  line-height: 1.7;
}
.diagnostic-intro__footer {
  margin-top: 30px;
}
.diagnostic-intro__stages {
  display: flex;
  gap: 30px;
}
.diagnostic-intro__stages > span {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #75879a;
  font-size: 13px;
  white-space: nowrap;
}
.diagnostic-intro__stages small {
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 10px;
}
.diagnostic-intro__stages .is-current {
  color: #142129;
}
.diagnostic-intro__stages .is-current small {
  background: #d1f55b;
}
@media (max-width: 1100px) {
  .diagnostic-intro {
    --diagnostic-inset: 32px;
  }
  .diagnostic-intro__stages {
    gap: 18px;
  }
}

@media (max-width: 860px) {
  .diagnostic-intro {
    display: none;
  }
}

/* 常见笔记本高度下收紧截图和段落间距，保留完整标题与卡片内容。 */
@media (min-width: 861px) and (max-height: 800px) {
  .diagnostic-intro {
    padding-block: 40px 32px;
  }
  .diagnostic-intro__eyebrow {
    display: none;
  }
  .diagnostic-intro__header h2 {
    font-size: 34px;
  }
  .diagnostic-intro__viewport {
    margin-top: 24px;
  }
  .diagnostic-intro__image {
    aspect-ratio: 2.05;
  }
  .diagnostic-intro__body {
    padding-block: 16px 10px;
  }
  .diagnostic-intro__body h3 {
    font-size: 24px;
  }
  .diagnostic-intro__body > p:last-child {
    margin-top: 8px;
  }
  .diagnostic-intro__footer {
    margin-top: 24px;
  }
}
/* 减少动态效果时直接展示全部三张卡片，无须依赖已移除的切换控件。 */
@media (prefers-reduced-motion: reduce) {
  .diagnostic-intro__viewport {
    margin-right: var(--diagnostic-inset);
  }
  .diagnostic-intro__track {
    width: 100%;
    transform: none !important;
    will-change: auto;
  }
  .diagnostic-intro__group {
    width: 100%;
    padding-right: 0;
  }
  .diagnostic-intro__group[aria-hidden] {
    display: none;
  }
  .diagnostic-intro__card {
    width: calc((100% - 2 * var(--diagnostic-gap)) / 3);
  }
}
</style>
