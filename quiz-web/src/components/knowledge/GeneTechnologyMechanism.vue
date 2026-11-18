<!-- 基因技术概念页的静态机制对照：DNA 连接处与干细胞命运，宽屏并排阅读。 -->
<template>
  <div class="mechanism-comparison">
    <div class="mechanism-grid">
      <figure v-for="phase in [0, 1]" :key="phase" class="mechanism-panel">
        <template v-if="kind === 'plasmid'">
          <figcaption>
            {{ phase ? '连接后 · 骨架缺口被封闭' : '连接前 · 互补末端先配对' }}
          </figcaption>
          <p class="panel-lead">
            {{ phase ? '连接酶形成共价键，稳定重组 DNA。' : '碱基已配对，不代表两条骨架已接好。' }}
          </p>
          <svg
            viewBox="0 0 400 330"
            role="img"
            :aria-label="
              phase
                ? '重组质粒连接处放大：连接酶封闭双链上的两个骨架缺口'
                : '兼容黏性末端配对后，双链连接处仍有两个骨架缺口'
            "
          >
            <g fill="none" stroke-linecap="round">
              <path d="M71 41 A45 45 0 1 0 129 41" stroke="#087f76" stroke-width="8" />
              <path d="M71 41 A45 45 0 0 1 129 41" stroke="#b67722" stroke-width="8" />
              <template v-if="!phase">
                <path d="M68 40L75 46 M125 46L132 40" stroke="white" stroke-width="3" />
              </template>
              <circle cx="129" cy="41" r="12" stroke="#7251b7" stroke-width="1.5" />
              <path
                d="M141 41H168V162 M168 162L162 154 M168 162L174 154"
                stroke="#9aa8b8"
                stroke-width="1.5"
                stroke-dasharray="4 4"
              />
              <path d="M210 52H234" stroke="#087f76" stroke-width="5" />
              <path d="M210 83H234" stroke="#b67722" stroke-width="5" />
            </g>
            <g class="diagram-text">
              <text x="100" y="81" text-anchor="middle">
                {{ phase ? '重组质粒' : '末端已配对' }}
              </text>
              <text x="246" y="58">载体 DNA</text>
              <text x="246" y="89">目的片段</text>
              <text x="200" y="148" text-anchor="middle" class="small">
                放大一个连接处 · 以黏性末端为例
              </text>
            </g>
            <rect x="12" y="173" width="376" height="144" rx="12" fill="#f5f8fc" />
            <!-- G|AATTC 与 CTTAA|G 的错位切口；颜色按 DNA 来源延续到两条链。 -->
            <g fill="none" stroke-width="4" stroke-linecap="round">
              <path d="M96 198H352" stroke="#b67722" />
              <path d="M48 198H78 M48 292H304" stroke="#087f76" />
              <path d="M322 292H352" stroke="#b67722" />
              <template v-if="phase">
                <path d="M78 198H96 M304 292H322" stroke="#7251b7" stroke-width="5" />
              </template>
              <template v-else>
                <circle
                  cx="87"
                  cy="198"
                  r="11"
                  stroke="#c26838"
                  stroke-width="1.5"
                  stroke-dasharray="3 3"
                />
                <circle
                  cx="313"
                  cy="292"
                  r="11"
                  stroke="#c26838"
                  stroke-width="1.5"
                  stroke-dasharray="3 3"
                />
              </template>
            </g>
            <g
              v-for="(base, i) in bases"
              :key="i"
              :transform="`translate(${60 + i * 56},0)`"
              text-anchor="middle"
            >
              <path d="M0 199V213" :stroke="i === 0 ? '#087f76' : '#b67722'" stroke-width="2" />
              <path d="M0 277V291" :stroke="i === 5 ? '#b67722' : '#087f76'" stroke-width="2" />
              <text y="232" :fill="i === 0 ? '#087f76' : '#a06415'" class="base">
                {{ base.top }}
              </text>
              <text y="274" :fill="i === 5 ? '#a06415' : '#087f76'" class="base">
                {{ base.bottom }}
              </text>
              <path
                v-for="bond in base.bonds"
                :key="bond"
                :d="`M${(bond - (base.bonds + 1) / 2) * 6} 239V253`"
                stroke="#9ba9bb"
                stroke-width="1.5"
                stroke-dasharray="2 3"
              />
            </g>
            <g class="diagram-text small" text-anchor="middle">
              <text x="29" y="203">5′</text>
              <text x="371" y="203">3′</text>
              <text x="29" y="297">3′</text>
              <text x="371" y="297">5′</text>
            </g>
          </svg>
          <p class="panel-result">
            <span class="result-mark" :class="{ sealed: phase }" />
            {{
              phase
                ? '紫色短线：连接酶封闭两条链的骨架缺口。'
                : '虚线圈：骨架缺口。中间虚线：碱基间氢键。'
            }}
          </p>
        </template>
        <template v-else>
          <figcaption>
            {{ phase ? '进入分化 · 产生谱系细胞' : '自我更新 · 保留干细胞身份' }}
          </figcaption>
          <p class="panel-lead">
            {{ phase ? '两个子细胞均离开原来的干细胞状态。' : '分裂后的两个子细胞仍是干细胞。' }}
          </p>
          <svg
            viewBox="0 0 400 330"
            role="img"
            :aria-label="
              phase
                ? '造血干细胞分裂后，两个子细胞进入分化；经多个前体阶段产生红细胞或粒细胞等谱系细胞'
                : '一个造血干细胞分裂成两个保留自我更新能力和分化潜能的干细胞'
            "
          >
            <defs>
              <radialGradient :id="`${id}-cell-${phase}`" cx="35%" cy="30%" r="75%">
                <stop stop-color="#fff" />
                <stop offset="1" stop-color="#ded8fa" />
              </radialGradient>
              <g :id="`${id}-stem-${phase}`">
                <path
                  d="M-28-8C-30-26-9-34 8-29C30-27 34-6 28 12C24 30 4 34-13 27C-30 22-34 6-28-8Z"
                  :fill="`url(#${id}-cell-${phase})`"
                  stroke="#7958bb"
                  stroke-width="2"
                />
                <ellipse
                  cx="-2"
                  cy="-1"
                  rx="18"
                  ry="20"
                  fill="#c9b7ed"
                  stroke="#7958bb"
                  stroke-width="1.5"
                />
                <path
                  d="M-12-8Q-2-15 7-5 M-11 5Q-1 13 9 3"
                  fill="none"
                  stroke="#9679cc"
                  stroke-width="2"
                />
                <circle cx="4" cy="-5" r="4" fill="#7652b0" />
                <path
                  d="M19 5q6 3 0 8 M-23-1q-4 4 0 8"
                  fill="none"
                  stroke="#ad94d5"
                  stroke-width="2"
                />
              </g>
              <g :id="`${id}-precursor-${phase}`">
                <path
                  d="M-28-10C-22-29 1-33 18-22C34-11 32 13 16 25C-1 36-27 24-30 7Z"
                  fill="#e2f2ed"
                  stroke="#16887d"
                  stroke-width="2"
                />
                <path
                  d="M-13-15C4-24 21-10 14 5C9 17-9 20-17 7C-22-1-21-9-13-15Z"
                  fill="#c8b9e7"
                  stroke="#8869b4"
                  stroke-width="1.5"
                />
                <circle cx="-3" cy="-4" r="4" fill="#8869b4" />
                <path
                  d="M17 11q7 2 2 8 M-23 2q4 0 3 7"
                  fill="none"
                  stroke="#68b3a5"
                  stroke-width="2"
                />
              </g>
              <marker
                :id="`${id}-arrow-${phase}`"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0 0L10 5L0 10Z" fill="#7e8fa2" />
              </marker>
            </defs>
            <use :href="`#${id}-stem-${phase}`" transform="translate(200 41)" />
            <text x="247" y="38" class="diagram-text">造血干细胞</text>
            <text x="247" y="60" class="diagram-text small">起始：1 个</text>
            <g
              fill="none"
              stroke="#7e8fa2"
              stroke-width="2"
              :marker-end="`url(#${id}-arrow-${phase})`"
            >
              <path d="M180 67L119 115" />
              <path d="M220 67L281 115" />
            </g>
            <text x="200" y="102" text-anchor="middle" class="diagram-text small">
              一次有丝分裂
            </text>
            <g v-for="x in [100, 300]" :key="x">
              <use
                :href="`#${id}-${phase ? 'precursor' : 'stem'}-${phase}`"
                :transform="`translate(${x} 151)`"
              />
              <text :x="x" y="203" text-anchor="middle" class="diagram-text">
                {{ phase ? '进入分化的子细胞' : '干细胞' }}
              </text>
            </g>
            <template v-if="phase">
              <path
                d="M100 212V253 M300 212V253"
                fill="none"
                stroke="#7e8fa2"
                stroke-width="2"
                stroke-dasharray="4 4"
                :marker-end="`url(#${id}-arrow-${phase})`"
              />
              <text x="200" y="234" text-anchor="middle" class="diagram-text small">
                多个前体阶段
              </text>
              <text x="200" y="254" text-anchor="middle" class="diagram-text small">
                增殖与分化
              </text>
              <ellipse
                cx="100"
                cy="281"
                rx="29"
                ry="19"
                fill="#efb1b4"
                stroke="#c85c68"
                stroke-width="2"
              />
              <ellipse cx="100" cy="281" rx="15" ry="9" fill="#f9d9da" stroke="#d98088" />
              <path
                d="M276 269C288 254 315 255 326 274C336 294 311 309 290 302C273 299 268 282 276 269Z"
                fill="#ebeffa"
                stroke="#8699bd"
                stroke-width="2"
              />
              <path
                d="M283 275C283 264 297 264 299 275L303 279C313 271 322 280 315 289L308 293C305 305 291 299 294 290L289 285C282 286 279 280 283 275Z"
                fill="#a28ac8"
                stroke="#76539b"
                stroke-width="1.5"
              />
              <g fill="#9eaed0">
                <circle cx="319" cy="273" r="2" />
                <circle cx="282" cy="292" r="2" />
                <circle cx="305" cy="265" r="2" />
              </g>
              <text x="100" y="325" text-anchor="middle" class="diagram-text small">
                红细胞：运输氧
              </text>
              <text x="300" y="325" text-anchor="middle" class="diagram-text small">
                粒细胞：参与免疫
              </text>
            </template>
            <template v-else>
              <path
                d="M62 170C37 169 37 133 62 129 M62 129L53 125 M62 129L55 137 M338 170C363 169 363 133 338 129 M338 129L347 125 M338 129L345 137"
                fill="none"
                stroke="#9778c8"
                stroke-width="1.8"
              />
              <rect x="30" y="229" width="340" height="89" rx="12" fill="#f3effb" />
              <g class="diagram-text" text-anchor="middle">
                <text x="200" y="258" font-weight="600" fill="#7251b7">保留两种能力</text>
                <text x="200" y="284">继续自我更新 · 产生造血谱系细胞</text>
                <text x="200" y="307" class="small">自我更新增加干细胞储备</text>
              </g>
            </template>
          </svg>
          <p class="panel-result">
            本次分裂：总细胞数 <strong>1 → 2</strong>；干细胞数
            <strong>{{ phase ? '1 → 0' : '1 → 2' }}</strong
            >。
          </p>
        </template>
      </figure>
    </div>
    <p class="mechanism-caption">
      {{
        kind === 'plasmid'
          ? '上方为环状 DNA 的片段示意，下方放大其中一个连接处；另一个连接处也需封闭。配对靠互补碱基间的氢键，连接酶连接的是糖—磷酸骨架。'
          : '以造血谱系为例，虚线省略后续多个阶段，不表示一次分裂就得到成熟血细胞；数量只统计第一次分裂。也可能一个子细胞保留干细胞状态，另一个进入分化。'
      }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ kind: 'plasmid' | 'stem' }>()
const id = useId()
const bases = [
  { top: 'G', bottom: 'C', bonds: 3 },
  { top: 'A', bottom: 'T', bonds: 2 },
  { top: 'A', bottom: 'T', bonds: 2 },
  { top: 'T', bottom: 'A', bonds: 2 },
  { top: 'T', bottom: 'A', bonds: 2 },
  { top: 'C', bottom: 'G', bonds: 3 },
]
</script>

<style scoped lang="scss">
.mechanism-comparison {
  container-type: inline-size;
  max-width: 1080px;
}
.mechanism-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
}
.mechanism-panel {
  min-width: 0;
  margin: 0;
  padding: 16px;
  border: 1px solid var(--color-learning-teal-line, #c8e8df);
  border-radius: 10px;
  background: var(--color-surface, #fff);
  figcaption {
    color: #087f76;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.5;
  }
  > svg {
    display: block;
    width: 100%;
    max-width: 440px;
    height: auto;
    margin: 12px auto;
  }
}
.panel-lead,
.panel-result {
  margin: 6px 0 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
.panel-result {
  padding-top: 10px;
  border-top: 1px solid #e4eaf1;
}
.diagram-text {
  font-size: 16px;
  fill: #344767;
  font-family: inherit;
}
.small {
  font-size: 14px;
  fill: #52627c;
}
.base {
  font-family: ui-monospace, monospace;
  font-size: 21px;
  font-weight: 600;
}
.result-mark {
  display: inline-block;
  width: 11px;
  height: 11px;
  margin-right: 5px;
  border: 1.5px dashed #c26838;
  border-radius: 50%;
  &.sealed {
    height: 4px;
    border: 0;
    border-radius: 2px;
    background: #7251b7;
    vertical-align: middle;
  }
}
.mechanism-caption {
  margin: 10px 0 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
@container (min-width: 760px) {
  .mechanism-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
