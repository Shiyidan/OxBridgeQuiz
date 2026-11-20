<!-- 化学后十一章讲义：简洁正文与选择性读图示意，不再重复旧版交互图。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="化学：概念与方法">
    <template #diagram>
      <figure v-if="code === '140804'" class="chem-method-figure">
        <svg viewBox="0 0 520 258" role="img" :aria-labelledby="uid + '-chromatography'">
          <title :id="uid + '-chromatography'">
            色谱基线到前沿为 8 cm，斑点 A 到基线 4 cm，B 为 6 cm。
          </title>
          <rect x="68" y="24" width="254" height="198" rx="4" fill="#f5f9ff" stroke="#c8d7ee" />
          <path d="M68 44H322 M68 204H322" stroke="#778aa5" stroke-dasharray="5 4" fill="none" />
          <text x="78" y="37">溶剂前沿</text>
          <text x="78" y="197">铅笔基线</text>
          <circle cx="170" cy="124" r="9" fill="#2453cd" />
          <circle cx="262" cy="84" r="9" fill="#087f76" />
          <text x="170" y="244" text-anchor="middle">A</text>
          <text x="262" y="244" text-anchor="middle">B</text>
          <path d="M170 139V204 M262 99V204" stroke="#9eacc1" stroke-dasharray="3 4" fill="none" />
          <text x="181" y="165">4 cm</text>
          <text x="273" y="155">6 cm</text>
          <path d="M345 44H359 M352 44V204 M345 204H359" stroke="#425574" fill="none" />
          <text x="366" y="129">8 cm</text>
        </svg>
        <figcaption>
          A：Rf＝4/8＝0.50；B：Rf＝6/8＝0.75。距离从同一基线量到斑点中心，不能从纸的底边起量。
        </figcaption>
      </figure>
      <figure v-else-if="code === '141003'" class="chem-method-figure">
        <svg viewBox="0 0 520 260" role="img" :aria-labelledby="uid + '-rate'">
          <title :id="uid + '-rate'">
            相同最终产气量的两条累计曲线。A 初始斜率更大，较早达到相同平台。
          </title>
          <path d="M55 32V218H479" stroke="#64748b" stroke-width="1.5" fill="none" />
          <text x="55" y="21">累计气体体积</text>
          <text x="470" y="247" text-anchor="end">时间</text>
          <text x="42" y="237">0</text>
          <path d="M55 65H478" stroke="#a7b5c9" stroke-dasharray="5 5" fill="none" />
          <path
            d="M55 218C78 110 115 65 205 65H465"
            stroke="#2453cd"
            stroke-width="3"
            fill="none"
          />
          <path
            d="M55 218C130 142 235 65 380 65H465"
            stroke="#087f76"
            stroke-width="3"
            stroke-dasharray="9 4"
            fill="none"
          />
          <text x="124" y="85" fill="#2453cd">A</text>
          <text x="225" y="123" fill="#087f76">B</text>
          <text x="347" y="51">相同平台</text>
          <text x="290" y="184">A 初始更快</text>
          <text x="290" y="208">最终量相同</text>
        </svg>
        <figcaption>
          示意图无数值刻度：可比较初始快慢和最终量，不能据此计算具体速率。A 为实线，B 为虚线。
        </figcaption>
      </figure>
      <figure v-else-if="code === '141103'" class="chem-method-figure">
        <svg viewBox="0 0 520 286" role="img" :aria-labelledby="uid + '-energy'">
          <title :id="uid + '-energy'">
            反应物能量 40，峰顶 100，产物 10，单位 kJ 每 mol；正向活化能 60，逆向 90，焓变负 30。
          </title>
          <path d="M55 28V244H480" stroke="#64748b" stroke-width="1.5" fill="none" />
          <text x="55" y="19">能量 / kJ mol⁻¹</text>
          <text x="474" y="274" text-anchor="end">反应进程</text>
          <path
            d="M55 44H352 M55 164H190 M55 224H465"
            stroke="#b7c5d8"
            stroke-dasharray="4 4"
            fill="none"
          />
          <text x="45" y="49" text-anchor="end">100</text>
          <text x="45" y="169" text-anchor="end">40</text>
          <text x="45" y="229" text-anchor="end">10</text>
          <path
            d="M72 164H128C181 164 183 44 251 44S302 224 395 224H465"
            stroke="#2453cd"
            stroke-width="3"
            fill="none"
          />
          <text x="78" y="152">反应物 R</text>
          <text x="388" y="211">产物 P</text>
          <path
            d="M193 44H207 M200 44V164 M193 164H207 M343 44H357 M350 44V224 M343 224H357"
            stroke="#087f76"
            stroke-width="1.5"
            fill="none"
          />
          <text x="171" y="101" text-anchor="end">Ea 正＝60</text>
          <text x="367" y="121">Ea 逆＝90</text>
          <text x="74" y="208">ΔH＝−30</text>
        </svg>
        <figcaption>
          以相同计量基准：Ea 正＝100−40，Ea 逆＝100−10，ΔH＝10−40。正逆活化能差为 ΔH。
        </figcaption>
      </figure>
      <figure v-else-if="code === '141502'" class="chem-method-figure">
        <svg viewBox="0 0 520 266" role="img" :aria-labelledby="uid + '-heating'">
          <title :id="uid + '-heating'">
            纯物质恒压加热曲线：固体升温、熔化平台、液体升温、沸腾平台、气体升温。
          </title>
          <path d="M50 23V225H480" stroke="#64748b" stroke-width="1.5" fill="none" />
          <text x="51" y="18">温度</text>
          <text x="478" y="254" text-anchor="end">输入热量</text>
          <path d="M50 173H175 M50 80H378" stroke="#b7c5d8" stroke-dasharray="4 4" fill="none" />
          <polyline
            points="65,213 107,173 185,173 255,80 392,80 453,32"
            stroke="#2453cd"
            stroke-width="3"
            fill="none"
          />
          <path d="M107 173H185 M255 80H392" stroke="#087f76" stroke-width="4" fill="none" />
          <text x="112" y="156">熔化</text>
          <text x="280" y="62">沸腾</text>
          <text x="70" y="240">固体</text>
          <text x="191" y="124">液体</text>
          <text x="435" y="67">气体</text>
          <text x="107" y="197">固＋液</text>
          <text x="283" y="105">液＋气</text>
        </svg>
        <figcaption>
          示意图用于区分升温与相变。绿色平台仍在吸热，平台中两种物态共存；图形长度不代表某种物质的实际潜热数值。
        </figcaption>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { chemistryRemainingMethods } from '@/content/knowledge/chemistryRemainingMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: string }>()
const uid = useId()
// 入口仅对已注册的化学小节渲染，切换节点时同步正文和对应图示。
const lesson = computed(() => chemistryRemainingMethods[props.code]!)
</script>

<style scoped lang="scss">
.chem-method-figure {
  width: 100%;
  max-width: 580px;
  margin: 16px auto;
  padding: 14px;
  box-sizing: border-box;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.chem-method-figure > svg {
  display: block;
  width: 100%;
  height: auto;
}
.chem-method-figure > svg text {
  font-family: var(--font-sans);
  font-size: 16px;
  fill: #344c6c;
}
.chem-method-figure figcaption {
  margin: 8px 0 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
@media (max-width: 600px) {
  .chem-method-figure {
    padding: 8px;
  }
}
</style>
