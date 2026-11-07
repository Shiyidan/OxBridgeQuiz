<!-- 桌面首页错题复习介绍：真实页面节选与答案、考察点、历次作答的交互说明。 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Right, CircleCheck, Close, Document } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import mistakePreview from '@/assets/home/mistake-notebook-preview.png'

const section = ref<HTMLElement | null>(null)
const activeTab = ref('knowledge')
const tabs = [
  { id: 'answer', label: '原题与选择' },
  { id: 'knowledge', label: '考察点' },
  { id: 'history', label: '作答轨迹' },
]
let timer: ReturnType<typeof setInterval> | null = null
let observer: IntersectionObserver | null = null
let visible = false
let motionPreference: MediaQueryList | null = null

// 每两秒依次展示原题、考察点与作答轨迹；离屏或后台时停止计时。
function syncRotation() {
  if (timer !== null) clearInterval(timer)
  timer = null
  if (!visible || document.visibilityState !== 'visible' || motionPreference?.matches) return
  timer = setInterval(() => {
    const index = tabs.findIndex((tab) => tab.id === activeTab.value)
    activeTab.value = tabs[(index + 1) % tabs.length]!.id
  }, 2000)
}

// 手动选择后重新计时，让选中的内容完整展示两秒。
function selectTab(id: string) {
  activeTab.value = id
  syncRotation()
}

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', syncRotation)
  document.addEventListener('visibilitychange', syncRotation)
  observer = new IntersectionObserver(
    ([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      syncRotation()
    },
    { threshold: 0.15 },
  )
  if (section.value) observer.observe(section.value)
})

onBeforeUnmount(() => {
  if (timer !== null) clearInterval(timer)
  observer?.disconnect()
  motionPreference?.removeEventListener('change', syncRotation)
  document.removeEventListener('visibilitychange', syncRotation)
})
// 沿用公开演示截图中的三次作答记录，不作为访问者的个人学习数据。
const history = [
  { order: '最近一次', date: '2026/08/18 14:06', answer: 'A', time: '1分36秒' },
  { order: '第 2 次', date: '2026/08/18 00:04', answer: 'A', time: '2秒' },
  { order: '第 1 次', date: '2026/08/17 17:35', answer: null, time: null },
]
</script>

<template>
  <section
    id="home-mistake-intro"
    ref="section"
    class="mistake-intro"
    aria-labelledby="mistake-intro-title"
  >
    <div class="mistake-container">
      <header class="mistake-heading">
        <div>
          <h2 id="mistake-intro-title">一道错题，不止一个答案。</h2>
          <p>从知识点出发，理解错误原因，举一反三。</p>
        </div>
        <div class="mistake-tabs" role="group" aria-label="切换错题介绍">
          <AppButton
            v-for="tab in tabs"
            :key="tab.id"
            type="text"
            size="small"
            :aria-pressed="activeTab === tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="selectTab(tab.id)"
            >{{ tab.label }}</AppButton
          >
        </div>
      </header>
      <div class="mistake-layout">
        <figure class="mistake-shot">
          <div class="shot-heading">
            <span><Document />原题与答案对照</span><small>真实页面节选 · 示例</small>
          </div>
          <div class="shot-viewport">
            <img
              :src="mistakePreview"
              width="1456"
              height="834"
              loading="lazy"
              alt="错题本真实页面节选：原选择 A none of them，正确答案 F 1 and 3 only"
            />
          </div>
          <figcaption>保留原题与作答，让每次复习都有依据。</figcaption>
        </figure>
        <div class="mistake-detail">
          <div :key="activeTab" class="detail-content">
            <template v-if="activeTab === 'knowledge'">
              <span class="detail-eyebrow">找到知识上的连接</span>
              <h3>避难所策略与<br />隐性抗性进化</h3>
              <p>从这道题的考察点重新梳理概念，把一次错误，转化为下一次解题的依据。</p>
              <div class="knowledge-tags">
                <span>遗传变异</span><span>自然选择</span><span>抗性进化</span>
              </div>
              <div class="review-route">
                <span>回看原题</span><Right /><span>理解考察点</span><Right /><span>再次练习</span>
              </div>
            </template>
            <template v-else-if="activeTab === 'answer'">
              <span class="detail-eyebrow">把选择和答案放在一起</span>
              <h3>不只记住 F，<br />更要回看为什么选了 A。</h3>
              <div class="answer-comparison">
                <div><Close /><span>原选择</span><strong>A · none of them</strong></div>
                <div><CircleCheck /><span>正确答案</span><strong>F · 1 and 3 only</strong></div>
              </div>
              <p>对照原题的三个判断，逐项核实条件，再查看完整解析。</p>
            </template>
            <template v-else>
              <span class="detail-eyebrow">每一次作答，都可以回看</span>
              <h3>看见反复出错的地方。</h3>
              <ol class="attempt-history">
                <li v-for="item in history" :key="item.order">
                  <div>
                    <span>{{ item.order }}</span
                    ><time>{{ item.date }}</time>
                  </div>
                  <p>
                    <span class="attempt-source">诊断测试</span
                    ><strong>{{ item.answer ? `回答：${item.answer}` : '本次未作答' }}</strong
                    ><small v-if="item.time">{{ item.time }}</small>
                  </p>
                </li>
              </ol>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mistake-intro {
  padding: 60px 48px;
  background: #fff;
  color: #17252e;
}
.mistake-container {
  max-width: 1370px;
  margin: auto;
}
.mistake-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  padding-right: 78px;
  margin-bottom: 26px;
}
.mistake-heading h2 {
  font-size: clamp(27px, 2.5vw, 36px);
  letter-spacing: -0.03em;
  line-height: 1.4;
  font-weight: 700;
  margin: 0;
}
.mistake-heading p {
  font-size: 14px;
  color: #7d8fa1;
  margin: 10px 0 0;
}
.mistake-tabs {
  display: flex;
  gap: 21px;
  flex-shrink: 0;
}
.mistake-tabs :deep(.app-button.el-button) {
  height: 40px;
  padding: 0 3px;
  font-size: 12px;
  border-radius: 0;
  --app-button-color: #76899e;
}
.mistake-tabs :deep(.app-button.el-button.active) {
  --app-button-color: #17252e;
  border-bottom: 2px solid #cdef58;
}
.mistake-layout {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 30px;
  align-items: stretch;
}
.mistake-shot {
  margin: 0;
  border: 1px solid #e2eaf2;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}
.shot-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 14px 20px;
  border-bottom: 1px solid #edf2f7;
  font-size: 12px;
  color: #536f88;
}
.shot-heading > span {
  display: flex;
  align-items: center;
  gap: 8px;
}
.shot-heading svg {
  width: 14px;
  height: 14px;
  color: #6b9bd3;
}
.shot-heading small {
  font-size: 10px;
  color: #95a4b3;
}
.shot-viewport {
  aspect-ratio: 1.8;
  overflow: hidden;
  margin: 15px 18px 0;
}
.shot-viewport img {
  display: block;
  width: 137%;
  max-width: none;
  height: auto;
}
.mistake-shot figcaption {
  font-size: 11px;
  color: #8a9bad;
  padding: 12px 20px 18px;
}
.mistake-detail {
  border: 1px solid #e2eaf2;
  border-radius: 14px;
  padding: 28px 32px 20px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(140deg, #fff 65%, #f8fbff);
}
.detail-content {
  flex: 1;
  animation: detail-in 0.25s ease-out;
}
.detail-eyebrow {
  color: #8598ab;
  font-size: 11px;
}
.detail-content h3 {
  font-size: clamp(21px, 2vw, 28px);
  line-height: 1.5;
  font-weight: 650;
  margin: 20px 0 16px;
}
.detail-content > p {
  font-size: 13px;
  line-height: 1.9;
  color: #7d8fa1;
  max-width: 410px;
}
.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0 24px;
}
.knowledge-tags span {
  font-size: 11px;
  color: #5684b1;
  background: #f1f7ff;
  border-radius: 4px;
  padding: 5px 9px;
}
.review-route {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #8a9bad;
  font-size: 11px;
}
.review-route svg {
  width: 13px;
  height: 13px;
}
.answer-comparison {
  display: grid;
  gap: 10px;
  margin: 20px 0;
}
.answer-comparison > div {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 6px;
  background: #fff5f3;
  color: #a7746c;
  font-size: 11px;
}
.answer-comparison > div:last-child {
  background: #eef8f5;
  color: #4b8f7b;
}
.answer-comparison svg {
  width: 15px;
  height: 15px;
}
.answer-comparison strong {
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
}
.attempt-history {
  margin: 15px 0 0;
  padding: 0 0 0 15px;
  list-style: none;
  border-left: 1px solid #e2eaf1;
}
.attempt-history li {
  position: relative;
  padding: 0 0 16px;
}
.attempt-history li::before {
  content: '';
  position: absolute;
  left: -19px;
  top: 4px;
  width: 7px;
  height: 7px;
  background: #9dbef0;
  border-radius: 50%;
  box-shadow: 0 0 0 3px white;
}
.attempt-history li:first-child::before {
  background: #c5df69;
}
.attempt-history li > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #8699ac;
  font-size: 10px;
}
.attempt-history p {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 0;
  font-size: 11px;
}
.attempt-source {
  color: #5594d7;
  background: #f1f7ff;
  padding: 3px 7px;
  border-radius: 4px;
}
.attempt-history strong {
  color: #ae8b54;
  font-weight: 500;
}
.attempt-history small {
  margin-left: auto;
  color: #8b9caf;
}
@keyframes detail-in {
  from {
    opacity: 0.3;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (max-width: 1100px) {
  .mistake-intro {
    padding: 46px 32px;
  }
  .mistake-layout {
    gap: 20px;
  }
  .mistake-detail {
    padding: 23px;
  }
  .mistake-tabs {
    gap: 12px;
  }
  .detail-content h3 {
    font-size: 22px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .detail-content {
    animation: none;
  }
}
</style>
