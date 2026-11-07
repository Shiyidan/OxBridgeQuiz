<!-- 概率前三节的固定示意：频数树、期望与实际次数对比、概率尺度，不复用后续真题。 -->
<template>
  <figure class="probability-figure">
    <template v-if="code === '110701'">
      <figcaption>40 次记录：先按颜色，再按编号奇偶分类</figcaption>
      <div class="probability-figure__layout">
        <div class="probability-figure__stage">
          <svg
            viewBox="0 0 600 200"
            role="img"
            aria-label="40次分为红16与蓝24；红色中奇数6偶数10，蓝色中奇数14偶数10"
          >
            <title>各分叉的子项频数相加等于父项</title>
            <path
              d="M110 100L230 50M110 100L230 150M310 50L455 24M310 50L455 77M310 150L455 126M310 150L455 179"
              class="frequency-branch"
            />
            <rect x="20" y="79" width="90" height="42" rx="6" class="frequency-root" />
            <text x="65" y="106" text-anchor="middle">总计 40</text>
            <rect x="230" y="31" width="80" height="38" rx="5" class="frequency-red" />
            <text x="270" y="56" text-anchor="middle">红 16</text>
            <rect x="230" y="131" width="80" height="38" rx="5" class="frequency-blue" />
            <text x="270" y="156" text-anchor="middle">蓝 24</text>
            <text x="470" y="30">奇数 6</text>
            <text x="470" y="83">偶数 10</text>
            <text x="470" y="132">奇数 14</text>
            <text x="470" y="185">偶数 10</text>
          </svg>
        </div>
        <div class="probability-figure__notes">
          <strong>同一批记录，两个核对方向</strong>
          <p>红色：6 + 10 = 16<br />蓝色：14 + 10 = 24</p>
          <p>奇数合计：6 + 14 = 20<br />偶数合计：10 + 10 = 20</p>
          <p class="figure-caption">
            16 + 24 = 20 + 20 = 40。示意次数来自同一批记录，不是分支概率。
          </p>
        </div>
      </div>
    </template>
    <template v-else-if="code === '110702'">
      <figcaption>同样做 20 次，每次成功概率为 0.3</figcaption>
      <div class="probability-figure__layout">
        <div class="probability-figure__stage">
          <p class="expected-label">期望成功次数：20 × 0.3 = <strong>6</strong></p>
          <div
            class="count-chart"
            role="img"
            aria-label="两批可能记录分别成功4次和8次；虚线均表示期望6次，横向尺度0至10次"
          >
            <div v-for="record in records" :key="record.label" class="count-row">
              <span>{{ record.label }}</span>
              <div class="count-track">
                <div class="count-fill" :style="{ width: `${record.count * 10}%` }"></div>
                <i aria-hidden="true"></i>
              </div>
              <strong>{{ record.count }} 次</strong>
            </div>
            <div class="count-row count-scale" aria-hidden="true">
              <span>次数</span>
              <div><span>0</span><span>5</span><span>10</span></div>
              <span></span>
            </div>
          </div>
          <p class="figure-caption">两批可能的结果，仅作示意；虚线为期望 6 次。</p>
        </div>
        <div class="probability-figure__notes">
          <strong>期望相同，实际记录可以不同</strong>
          <p>一批少于 6 次，另一批多于 6 次，都可能发生。实际结果还可能是其他次数。</p>
          <p>图中两批不需要“互相抵消”；展示 4 与 8，不代表下一批会补足前面的差额。</p>
        </div>
      </div>
    </template>
    <template v-else>
      <figcaption>同一位置可以用分数、小数或百分数表示</figcaption>
      <div class="probability-figure__layout">
        <div class="probability-figure__stage">
          <svg
            viewBox="0 0 600 142"
            role="img"
            aria-label="0到1的概率尺度，标记五分之二等于0.4等于40%，位于0.5左侧"
          >
            <title>2/5、0.4、40% 表示同一概率大小</title>
            <path d="M40 75H560" class="scale-line" />
            <g v-for="tick in [0, 0.25, 0.5, 0.75, 1]" :key="tick">
              <path :d="`M${40 + tick * 520} 69v12`" class="scale-tick" />
              <text :x="40 + tick * 520" y="105" text-anchor="middle">{{ tick }}</text>
            </g>
            <path d="M248 47V68" class="scale-marker" />
            <circle cx="248" cy="75" r="6" class="probability-dot" />
            <text x="248" y="32" text-anchor="middle" class="scale-label">2/5 = 0.4 = 40%</text>
            <text x="40" y="132" text-anchor="start">不可能</text>
            <text x="300" y="132" text-anchor="middle">发生与不发生等可能</text>
            <text x="560" y="132" text-anchor="end">必然</text>
          </svg>
        </div>
        <div class="probability-figure__notes">
          <strong>位置相同，不代表来源相同</strong>
          <p>0.4 可以是已知模型的概率，也可以是 20 次中出现 8 次所得的相对频率。</p>
          <p>前者依据模型，后者描述样本；需要估计时，才用后者推测未来。</p>
        </div>
      </div>
    </template>
  </figure>
</template>

<script setup lang="ts">
import type { ProbabilityFoundationCode } from '@/content/knowledge/probabilityFoundationsMethods'
defineProps<{ code: ProbabilityFoundationCode }>()
// 固定示意记录仅比较期望与可能的实际次数，不冒充随机模拟结果。
const records = [
  { label: '可能的一批', count: 4 },
  { label: '另一批', count: 8 },
]
</script>

<style scoped>
.probability-figure {
  container-type: inline-size;
  margin: 16px 0;
  padding: 14px 16px;
  background: #f7faff;
  border: 1px solid #d8e3f5;
  border-radius: 8px;
  color: #33465d;
}
figcaption {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #1d3049;
}
.probability-figure__layout {
  display: grid;
  gap: 12px 24px;
  align-items: start;
}
.probability-figure__stage {
  min-width: 0;
  max-width: 600px;
  width: 100%;
  overflow-x: auto;
}
.probability-figure__stage > svg {
  display: block;
  width: 100%;
  min-width: 520px;
  max-width: 600px;
  height: auto;
}
.probability-figure__stage > svg text {
  fill: #33465d;
  font-size: 16px;
}
.probability-figure__notes {
  font-size: 15px;
  line-height: 1.75;
  min-width: 0;
}
.probability-figure__notes strong {
  color: #1d3049;
  font-weight: 700;
}
.probability-figure p {
  margin: 6px 0;
}
.probability-figure .figure-caption {
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
}
.frequency-branch {
  fill: none;
  stroke: #8a9eb9;
  stroke-width: 1.5;
}
.frequency-root {
  fill: #eaf0ff;
  stroke: #acc2f4;
}
.frequency-red {
  fill: #fff0e8;
  stroke: #efc2a5;
}
.frequency-blue {
  fill: #e8f5fa;
  stroke: #a6cfdf;
}
.scale-line,
.scale-tick {
  fill: none;
  stroke: #8296b1;
  stroke-width: 1.5;
}
.scale-marker {
  fill: none;
  stroke: #2451d1;
  stroke-width: 2;
}
.probability-dot {
  fill: #2451d1;
}
.probability-figure__stage > svg .scale-label {
  fill: #2451d1;
  font-weight: 700;
}
.expected-label {
  font-size: 15px;
}
.count-chart {
  margin: 16px 0 8px;
}
.count-row {
  display: grid;
  grid-template-columns: 90px minmax(90px, 1fr) 42px;
  align-items: center;
  gap: 10px;
  margin: 12px 0;
  font-size: 14px;
}
.count-track {
  position: relative;
  height: 22px;
  background: #e6edf7;
  border-radius: 3px;
}
.count-fill {
  height: 100%;
  background: #6390dc;
  border-radius: 3px;
}
.count-track i {
  position: absolute;
  left: 60%;
  top: -5px;
  bottom: -5px;
  border-left: 2px dashed #187f78;
}
.count-scale {
  color: #64748b;
  margin-top: 6px;
}
.count-scale > div {
  display: flex;
  justify-content: space-between;
}
@container (min-width: 880px) {
  .probability-figure__layout {
    grid-template-columns: minmax(0, 600px) minmax(240px, 1fr);
  }
}
@media (max-width: 600px) {
  .count-row {
    grid-template-columns: 76px minmax(60px, 1fr) 36px;
    gap: 6px;
  }
}
</style>
