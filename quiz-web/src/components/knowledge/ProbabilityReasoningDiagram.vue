<!-- 概率分类与路径的紧凑静态图解：固定模型说明计数、权重和条件，不增加切换操作。 -->
<template>
  <figure class="reasoning-figure">
    <template v-if="code === '110704'">
      <figcaption>20 个对象：交集只能计一次</figcaption>
      <div class="reasoning-figure__layout">
        <div class="reasoning-figure__stage">
          <svg
            viewBox="0 0 560 230"
            role="img"
            aria-label="共20个对象，仅A有5个，A和B同时有3个，仅B有6个，两者都不有6个"
          >
            <title>两个相交事件的四个区域</title>
            <rect x="14" y="10" width="532" height="208" rx="8" class="space" />
            <circle cx="225" cy="115" r="88" class="region-a" />
            <circle cx="335" cy="115" r="88" class="region-b" />
            <text x="181" y="60" class="diagram-emphasis">A</text>
            <text x="370" y="60" class="diagram-emphasis">B</text>
            <text x="191" y="119" text-anchor="middle">仅 A：5</text>
            <text x="280" y="119" text-anchor="middle">同时：3</text>
            <text x="369" y="119" text-anchor="middle">仅 B：6</text>
            <text x="40" y="194">两者都不：6</text>
          </svg>
        </div>
        <div class="reasoning-figure__notes">
          <strong>A 或 B，包含“同时”</strong>
          <p>A 有 8 个，B 有 9 个。<br />并集：8 + 9 − 3 = <b>14</b></p>
          <p>恰好一个：5 + 6 = <b>11</b><br />两者都不：20 − 14 = <b>6</b></p>
          <p class="figure-caption">区域数字是对象数，图形面积不表示比例。</p>
        </div>
      </div>
    </template>
    <template v-else-if="code === '110705'">
      <figcaption>从 A、B、C、D 中选两个不同对象，不分先后</figcaption>
      <div class="reasoning-figure__layout">
        <div class="reasoning-figure__stage">
          <table class="listing-table">
            <caption class="sr-only">
              按字母顺序递增列举，共六组
            </caption>
            <thead>
              <tr>
                <th scope="col">固定较前一项</th>
                <th scope="col">只向后配对</th>
                <th scope="col">组数</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">A</th>
                <td>AB · AC · AD</td>
                <td>3</td>
              </tr>
              <tr>
                <th scope="row">B</th>
                <td>BC · BD</td>
                <td>2</td>
              </tr>
              <tr>
                <th scope="row">C</th>
                <td>CD</td>
                <td>1</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="reasoning-figure__notes">
          <strong>递增书写，避免重复</strong>
          <p>无序选择：3 + 2 + 1 = <b>6 组</b></p>
          <p>若保留先后，则有 4 × 3 = 12 个有序结果。</p>
          <p class="figure-caption">这里每组恰好对应两个顺序，例如 AB、BA，因此 12 ÷ 2 = 6。</p>
        </div>
      </div>
    </template>
    <template v-else-if="code === '110706'">
      <figcaption>两次独立、均匀选取 1 至 4；允许重复，筛选总和大于 5</figcaption>
      <div class="reasoning-figure__layout">
        <div class="reasoning-figure__stage">
          <table class="sample-table">
            <caption class="sr-only">
              每格写总和，勾号表示大于5，共十六格中六格满足
            </caption>
            <thead>
              <tr>
                <th scope="col">第一次 ↓<br />第二次 →</th>
                <th v-for="column in values" :key="column" scope="col">{{ column }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in values" :key="row">
                <th scope="row">{{ row }}</th>
                <td
                  v-for="column in values"
                  :key="column"
                  :class="{ 'sample-hit': row + column > 5 }"
                >
                  {{ row + column }}<span v-if="row + column > 5" aria-label="满足条件"> ✓</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="reasoning-figure__notes">
          <strong>数配对，不数总和的种类</strong>
          <p>16 个等可能配对中，6 个满足条件。<br />概率：6/16 = <b>3/8</b></p>
          <p>总和 2 至 8 对应的配对数是<br /><b>1、2、3、4、3、2、1</b>。</p>
          <p class="figure-caption">总和 6、7、8 并不与其他总和等可能，不能写成 3/7。</p>
        </div>
      </div>
    </template>
    <template v-else>
      <figcaption>袋中 2 红 2 蓝，均匀抽两次、不放回：求一红一蓝</figcaption>
      <div class="reasoning-figure__layout">
        <div class="reasoning-figure__stage">
          <svg
            viewBox="0 0 600 280"
            role="img"
            aria-label="首次红蓝各二分之一；同色第二次三分之一，异色三分之二；红红蓝蓝路径各六分之一，红蓝蓝红各三分之一"
          >
            <title>分支标条件概率，右侧标完整路径概率</title>
            <text x="65" y="20" text-anchor="middle">起点</text>
            <text x="238" y="20" text-anchor="middle">第一次</text>
            <text x="497" y="20" text-anchor="middle">第二次 · 路径概率</text>
            <path d="M65 145L218 85M65 145L218 215M258 85L437 48M258 215L437 252" class="branch" />
            <path d="M258 85L437 116M258 215L437 182" class="branch branch-hit" />
            <circle cx="65" cy="145" r="5" class="start" />
            <text x="135" y="98" class="fraction">1/2</text>
            <text x="135" y="201" class="fraction">1/2</text>
            <rect x="218" y="66" width="40" height="38" rx="5" class="red-label" />
            <text x="238" y="91" text-anchor="middle">红</text>
            <rect x="218" y="196" width="40" height="38" rx="5" class="blue-label" />
            <text x="238" y="221" text-anchor="middle">蓝</text>
            <text x="337" y="53" class="fraction">1/3</text>
            <text x="337" y="122" class="fraction">2/3</text>
            <text x="337" y="181" class="fraction">2/3</text>
            <text x="337" y="260" class="fraction">1/3</text>
            <text x="450" y="54">红红 · 1/6</text>
            <text x="450" y="122" class="diagram-emphasis">✓ 红蓝 · 1/3</text>
            <text x="450" y="188" class="diagram-emphasis">✓ 蓝红 · 1/3</text>
            <text x="450" y="258">蓝蓝 · 1/6</text>
          </svg>
        </div>
        <div class="reasoning-figure__notes">
          <strong>两条异色路径都要计入</strong>
          <p>红蓝：1/2 × 2/3 = 1/3<br />蓝红：1/2 × 2/3 = 1/3</p>
          <p>合计：1/3 + 1/3 = <b>2/3</b></p>
          <p class="figure-caption">首次抽走一种颜色后，袋中还剩 3 个；其中另一种颜色仍有 2 个。</p>
        </div>
      </div>
    </template>
  </figure>
</template>

<script setup lang="ts">
import type { ProbabilityReasoningCode } from '@/content/knowledge/probabilityReasoningMethods'
defineProps<{ code: ProbabilityReasoningCode }>()
// 固定四乘四样本空间保留抽取顺序，让相同总和的不同配对仍各占一格。
const values = [1, 2, 3, 4]
</script>

<style scoped>
.reasoning-figure {
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
.reasoning-figure__layout {
  display: grid;
  gap: 12px 24px;
  align-items: start;
}
.reasoning-figure__stage {
  min-width: 0;
  max-width: 600px;
  width: 100%;
  overflow-x: auto;
}
.reasoning-figure__stage > svg {
  display: block;
  width: 100%;
  min-width: 480px;
  max-width: 600px;
  height: auto;
}
.reasoning-figure__stage > svg text {
  fill: #33465d;
  font-size: 16px;
}
.reasoning-figure__stage > svg .diagram-emphasis {
  fill: #007b72;
  font-weight: 700;
}
.reasoning-figure__notes {
  font-size: 15px;
  line-height: 1.75;
  min-width: 0;
}
.reasoning-figure__notes strong {
  color: #1d3049;
  font-weight: 700;
}
.reasoning-figure p {
  margin: 6px 0;
}
.reasoning-figure .figure-caption {
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
}
.space {
  fill: #fff;
  stroke: #d5dfed;
}
.region-a {
  fill: #dae6ff;
  fill-opacity: 0.65;
  stroke: #547cce;
  stroke-width: 1.5;
}
.region-b {
  fill: #d4eee8;
  fill-opacity: 0.65;
  stroke: #318d81;
  stroke-width: 1.5;
}
.branch {
  fill: none;
  stroke: #95a7bd;
  stroke-width: 1.5;
}
.branch-hit {
  stroke: #16877a;
  stroke-width: 2;
}
.start {
  fill: #5375ae;
}
.red-label {
  fill: #fff0e8;
  stroke: #efc2a5;
}
.blue-label {
  fill: #e8f5fa;
  stroke: #a6cfdf;
}
.fraction {
  paint-order: stroke;
  stroke: #f7faff;
  stroke-width: 5;
  stroke-linejoin: round;
}
.listing-table,
.sample-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}
.listing-table th,
.listing-table td,
.sample-table th,
.sample-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #dce5f1;
  text-align: center;
}
.listing-table thead,
.sample-table th {
  background: #eaf1fc;
}
.sample-table td {
  border: 1px solid #dce5f1;
  width: 18%;
}
.sample-table th:first-child {
  font-size: 13px;
  white-space: nowrap;
}
.sample-table .sample-hit {
  background: #e0f3ee;
  color: #006f64;
  font-weight: 700;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
@container (min-width: 880px) {
  .reasoning-figure__layout {
    grid-template-columns: minmax(0, 600px) minmax(240px, 1fr);
  }
}
@media (max-width: 600px) {
  .reasoning-figure {
    padding: 12px;
  }
  .listing-table th,
  .listing-table td,
  .sample-table th,
  .sample-table td {
    padding: 8px 5px;
  }
}
</style>
