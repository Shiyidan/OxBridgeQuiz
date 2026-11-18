<!-- 定量化学讲义：计算用公式和表格，溶解度用一幅紧凑读图连接析晶量。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="定量化学：概念与方法">
    <template #diagram>
      <figure class="solubility-reading">
        <div class="solubility-reading__layout">
          <svg viewBox="0 0 420 265" role="img" :aria-labelledby="uid + '-solubility'">
            <title :id="uid + '-solubility'">
              某盐的示例溶解度：20摄氏度时每100克水溶20克，60摄氏度时溶50克；差为30克。
            </title>
            <text x="12" y="24">溶解度 / (g / 100 g 水)</text>
            <path d="M58 44V214H383" fill="none" stroke="#7b8ca6" stroke-width="1.5" />
            <g v-for="value in [0, 20, 40, 60]" :key="value">
              <path :d="'M53 ' + (214 - value * 2.5) + 'H58'" stroke="#7b8ca6" />
              <text x="46" :y="220 - value * 2.5" text-anchor="end">{{ value }}</text>
            </g>
            <g v-for="value in [0, 20, 40, 60, 80]" :key="value">
              <path :d="'M' + (58 + value * 4) + ' 214V219'" stroke="#7b8ca6" />
              <text :x="58 + value * 4" y="239" text-anchor="middle">{{ value }}</text>
            </g>
            <text x="277" y="262">温度 / °C</text>
            <path
              d="M58 164H138V214 M58 89H298V214"
              fill="none"
              stroke="#9aabc5"
              stroke-dasharray="5 4"
            />
            <path d="M138 164L298 89" fill="none" stroke="#2453cd" stroke-width="2.5" />
            <circle cx="138" cy="164" r="5" fill="#2453cd" />
            <circle cx="298" cy="89" r="5" fill="#2453cd" />
            <text x="83" y="145" fill="#2453cd">20°C：20</text>
            <text x="233" y="69" fill="#2453cd">60°C：50</text>
            <path d="M325 89H334V164H325" fill="none" stroke="#087f76" stroke-width="2" />
            <text x="343" y="133" fill="#087f76">差 30</text>
          </svg>
          <div class="solubility-reading__calculation">
            <h4>先找水的质量，再求析出量</h4>
            <p>60°C 的饱和溶液共 150 g，其中溶质与水的质量比为 50∶100。</p>
            <dl>
              <div>
                <dt>水</dt>
                <dd>150 × 100/150 ＝ 100 g</dd>
              </div>
              <div>
                <dt>原已溶解</dt>
                <dd>50 g</dd>
              </div>
              <div>
                <dt>20°C 仍可溶</dt>
                <dd>20 g</dd>
              </div>
              <div class="solubility-reading__answer">
                <dt>析出晶体</dt>
                <dd>50 − 20 ＝ 30 g</dd>
              </div>
            </dl>
          </div>
        </div>
        <figcaption>
          某盐的示例数据；连线仅帮助比较两个读数。假设水不蒸发、冷却充分，析出无水晶体。分母始终是水的质量，不能用
          150 g 溶液直接乘溶解度差。
        </figcaption>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  quantitativeChemistryMethods,
  type QuantitativeChemistryMethodCode,
} from '@/content/knowledge/quantitativeChemistryMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: QuantitativeChemistryMethodCode }>()
// 各节按自身知识结构呈现，基础换算节不重复附加图形。
const lesson = computed(() => quantitativeChemistryMethods[props.code])
const uid = 'quantitative-method-' + useId()
</script>

<style scoped>
.solubility-reading {
  max-width: 960px;
  margin: 12px auto;
  padding: 16px;
  border: 1px solid #d8e3f5;
  border-radius: 10px;
  background: #f6f9ff;
  container-type: inline-size;
}
.solubility-reading__layout {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 22px;
  align-items: center;
}
.solubility-reading svg {
  display: block;
  width: 100%;
  max-width: 500px;
  height: auto;
  margin: 0 auto;
}
.solubility-reading svg text {
  font-family: var(--font-sans);
  font-size: 17px;
}
.solubility-reading__calculation {
  min-width: 0;
  font-size: 15px;
  line-height: 1.75;
  color: #425574;
}
.solubility-reading h4 {
  margin: 0 0 8px;
  font-size: 17px;
  color: #243e65;
}
.solubility-reading p {
  margin: 8px 0;
}
.solubility-reading dl {
  margin: 12px 0 0;
}
.solubility-reading dl > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2px 12px;
  padding: 5px 0;
  border-bottom: 1px solid #dce5f3;
}
.solubility-reading dt {
  font-weight: 600;
}
.solubility-reading dd {
  margin: 0;
}
.solubility-reading__answer {
  color: #087f76;
  font-weight: 600;
}
.solubility-reading figcaption {
  margin-top: 12px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}
@container (max-width: 690px) {
  .solubility-reading__layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
@media (max-width: 480px) {
  .solubility-reading {
    padding: 10px;
  }
}
</style>
