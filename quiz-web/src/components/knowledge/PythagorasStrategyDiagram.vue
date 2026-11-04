<!-- 勾股策略图：通过共享直角边展示平方差消元，供数学1几何讲义使用。 -->
<template>
  <figure class="pythagoras-strategy">
    <figcaption>
      <span class="pythagoras-strategy__eyebrow">共享边 · 平方差</span>
      <strong>两条斜边已知，如何绕开公共边？</strong>
      <p><KnowledgeText text="设 $PT=a$、$PR=b$，调整 $QR:QT$，比较两条方程。图形为方法示意。" /></p>
    </figcaption>
    <div class="pythagoras-strategy__controls" role="group" aria-label="选择底边比例">
      <AppButton
        v-for="ratio in ratios"
        :key="ratio"
        :type="selectedRatio === ratio ? 'primary' : 'secondary'"
        size="small"
        :aria-pressed="selectedRatio === ratio"
        @click="selectedRatio = ratio"
      >{{ ratio }} : 1</AppButton>
    </div>
    <div class="pythagoras-strategy__canvas">
      <svg viewBox="0 0 420 275" role="img" :aria-label="diagramLabel">
        <path :d="outerPath" class="pythagoras-strategy__outer" />
        <path :d="innerPath" class="pythagoras-strategy__inner" />
        <path :d="rightAnglePath" class="pythagoras-strategy__right-angle" />
        <circle :cx="q.x" :cy="q.y" r="3" />
        <circle :cx="p.x" :cy="p.y" r="3" />
        <circle :cx="t.x" :cy="t.y" r="3" />
        <circle :cx="r.x" :cy="r.y" r="3" />
        <text :x="p.x - 19" :y="p.y + 3">P</text>
        <text :x="q.x - 20" :y="q.y + 20">Q</text>
        <text :x="t.x" :y="t.y + 20">T</text>
        <text :x="r.x + 6" :y="r.y + 20">R</text>
        <text class="pythagoras-strategy__shared-label" :x="q.x - 29" :y="(p.y + q.y) / 2">h</text>
        <text class="pythagoras-strategy__short-label" :x="(p.x + t.x) / 2 + 10" :y="(p.y + t.y) / 2 + 5">a</text>
        <text class="pythagoras-strategy__long-label" :x="(p.x + r.x) / 2 + 8" :y="(p.y + r.y) / 2 - 10">b</text>
        <text class="pythagoras-strategy__short-label" :x="(q.x + t.x) / 2" :y="q.y + 19">t</text>
        <text class="pythagoras-strategy__ratio-label" :x="(t.x + r.x) / 2" :y="q.y + 37">{{ selectedRatio }}t − t</text>
      </svg>
    </div>
    <div class="pythagoras-strategy__equations">
      <p><KnowledgeText text="$h^2+t^2=a^2$" /></p>
      <p><KnowledgeText :text="largeEquation" /></p>
      <div class="pythagoras-strategy__result">
        <span>两式相减</span>
        <strong><KnowledgeText :text="differenceEquation" /></strong>
      </div>
    </div>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'

const ratios = [2, 3, 5]
const selectedRatio = ref(3)
const q = { x: 58, y: 220 }
const scale = 26

// 示意图内部固定斜边比例 5:9；所选底边比例均满足非退化条件。
const geometry = computed(() => {
  const tLength = Math.sqrt(56 / (selectedRatio.value ** 2 - 1))
  const height = Math.sqrt(25 - tLength ** 2)
  return {
    p: { x: q.x, y: q.y - height * scale },
    t: { x: q.x + tLength * scale, y: q.y },
    r: { x: q.x + selectedRatio.value * tLength * scale, y: q.y },
  }
})
// 三个可变顶点均来自相同的几何约束。
const p = computed(() => geometry.value.p)
// T 始终落在 QR 上，供图形和标签使用。
const t = computed(() => geometry.value.t)
// R 随底边比例移动，确保 PR 的长度保持不变。
const r = computed(() => geometry.value.r)
// 图形路径和代数共用同一组参数，避免交互后图文不一致。
const outerPath = computed(() => 'M ' + p.value.x + ' ' + p.value.y + ' L ' + q.x + ' ' + q.y + ' L ' + r.value.x + ' ' + r.value.y + ' Z')
// 蓝色区域突出短斜边对应的直角三角形。
const innerPath = computed(() => 'M ' + p.value.x + ' ' + p.value.y + ' L ' + q.x + ' ' + q.y + ' L ' + t.value.x + ' ' + t.value.y + ' Z')
// 方框固定在两条直角边的交点。
const rightAnglePath = computed(() => 'M ' + q.x + ' ' + (q.y - 14) + ' h 14 v 14')
// 无障碍说明同步给出当前选择的比例与已知边长。
const diagramLabel = computed(() => '两个直角三角形共用直角边 PQ，斜边 PT 和 PR 分别为 a 和 b，QR 与 QT 的比例为 ' + selectedRatio.value + ' 比 1。图形仅作方法示意。')
// 方程展示当前比例下的大三角形。
const largeEquation = computed(() => '$h^2+(' + selectedRatio.value + 't)^2=b^2$')
// 消元结果随比例变化，保留平方关系而不提前估算根式。
const differenceEquation = computed(() => '$' + (selectedRatio.value ** 2 - 1) + 't^2=b^2-a^2$')
</script>

<style scoped>
.pythagoras-strategy {
  min-width: 0;
  margin: 0;
  padding: clamp(16px, 2vw, 24px);
  border: 1px solid #c8dedc;
  border-radius: 12px;
  background: #f3faf8;
  color: var(--color-ink);
}
.pythagoras-strategy figcaption { display: grid; gap: 7px; }
.pythagoras-strategy__eyebrow { color: #11786f; font-size: 12px; font-weight: 700; letter-spacing: .06em; }
.pythagoras-strategy figcaption strong { font-size: 18px; line-height: 1.5; }
.pythagoras-strategy figcaption p { margin: 0; color: var(--color-ink-soft); font-size: 14px; line-height: 1.6; }
.pythagoras-strategy__controls { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
.pythagoras-strategy__controls :deep(.app-button--primary) {
  --app-button-bg: #2451d1;
  --app-button-border: #2451d1;
  --app-button-hover-bg: #1c45bb;
  --app-button-hover-border: #1c45bb;
  --app-button-active-bg: #1c45bb;
  --app-button-active-border: #1c45bb;
}
.pythagoras-strategy__canvas { overflow: hidden; border: 1px solid #d9e9e5; border-radius: 8px; background: white; }
.pythagoras-strategy svg { display: block; width: 100%; max-height: 270px; }
.pythagoras-strategy svg path { stroke-linejoin: round; }
.pythagoras-strategy__outer { fill: #e6f3ee; stroke: #12776e; stroke-width: 2.5; }
.pythagoras-strategy__inner { fill: #e8efff; stroke: #315cc6; stroke-width: 2.5; }
.pythagoras-strategy__right-angle { fill: none; stroke: #34445b; stroke-width: 2; }
.pythagoras-strategy svg circle { fill: #25334a; }
.pythagoras-strategy svg text { fill: #25334a; font-size: 15px; font-weight: 600; }
.pythagoras-strategy svg .pythagoras-strategy__short-label { fill: #315cc6; }
.pythagoras-strategy svg .pythagoras-strategy__long-label { fill: #12776e; }
.pythagoras-strategy svg .pythagoras-strategy__ratio-label { font-size: 13px; fill: #536475; text-anchor: middle; }
.pythagoras-strategy__equations { display: grid; gap: 4px; margin-top: 16px; font-size: 14px; }
.pythagoras-strategy__equations p { margin: 0; }
.pythagoras-strategy__result { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 14px; margin-top: 8px; padding-top: 10px; border-top: 1px solid #c8dedc; }
.pythagoras-strategy__result span { color: #11786f; font-size: 13px; font-weight: 700; }
@media (max-width: 600px) {
  .pythagoras-strategy { padding: 14px; }
  .pythagoras-strategy figcaption strong { font-size: 16px; }
}
</style>
