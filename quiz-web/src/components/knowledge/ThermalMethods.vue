<!-- 热学概念与方法：用紧凑温度图与静态对照说明传热条件，复用讲义正文和公式渲染。 -->
<template>
  <KnowledgeMethodsArticle class="thermal-methods" :lesson="lesson" label="热学：概念与方法">
    <template #diagram>
      <figure v-if="code === '130401'" class="thermal-figure thermal-figure--single">
        <svg viewBox="0 0 330 205" role="img" :aria-labelledby="uid + '-conduction'">
          <title :id="uid + '-conduction'">
            两层等厚、等截面积材料串接，稳态时温度从 80°C 经界面 60°C 降至
            20°C；第二层温差较大、导热较差。
          </title>
          <rect x="40" y="20" width="110" height="145" fill="#edf3ff" />
          <rect x="150" y="20" width="110" height="145" fill="#eaf6f3" />
          <path d="M40 15V165H285" fill="none" stroke="#64748b" stroke-width="1.5" />
          <path d="M40 25L150 65L260 145" fill="none" stroke="#2453cd" stroke-width="2.5" />
          <path
            d="M40 65H150V165 M40 145H260"
            fill="none"
            stroke="#98a8bb"
            stroke-dasharray="4 4"
          />
          <text x="46" y="15">T / °C</text>
          <text x="32" y="31" text-anchor="end">80</text>
          <text x="32" y="71" text-anchor="end">60</text>
          <text x="32" y="151" text-anchor="end">20</text>
          <text x="95" y="187" text-anchor="middle">良导体</text>
          <text x="205" y="187" text-anchor="middle">较差导体</text>
          <text x="284" y="181">位置</text>
        </svg>
        <figcaption>
          两层等厚、等截面且接触理想。各层热功率相同，温差分别为
          20°C、40°C；第二层图线更陡，并不表示它传热更多。
        </figcaption>
      </figure>

      <div v-else-if="code === '130402'" class="thermal-comparison">
        <div class="thermal-pair">
          <figure v-for="bottom in [true, false]" :key="String(bottom)" class="thermal-figure">
            <h4>{{ bottom ? '底部局部加热' : '顶部加热' }}</h4>
            <svg viewBox="0 0 220 170" role="img" :aria-labelledby="uid + '-convection-' + bottom">
              <title :id="uid + '-convection-' + bottom">
                {{
                  bottom
                    ? '底部热流体上升，上方流体流向另一侧，较冷流体下沉并补入底部，形成循环。'
                    : '低密度热层留在上方，密度分层较稳定，难形成贯穿上下的自然循环。'
                }}
              </title>
              <rect x="35" y="30" width="150" height="105" fill="#edf3ff" />
              <path d="M35 20V135H185V20" fill="none" stroke="#7193c6" stroke-width="2" />
              <template v-if="bottom">
                <path d="M75 115V50H150V115H75" fill="none" stroke="#7193c6" stroke-width="2" />
                <path
                  d="M75 98V67L70 75 M75 67L80 75"
                  fill="none"
                  stroke="#c07b42"
                  stroke-width="2.5"
                />
                <path
                  d="M150 61V98L145 90 M150 98L155 90 M92 50H124L116 45 M124 50L116 55 M130 115H98L106 110 M98 115L106 120"
                  fill="none"
                  stroke="#2453cd"
                  stroke-width="2"
                />
                <path d="M55 145H95" stroke="#c07b42" stroke-width="5" stroke-linecap="round" />
                <text x="52" y="87">升</text>
                <text x="160" y="87">降</text>
              </template>
              <template v-else>
                <rect x="36" y="30" width="148" height="27" fill="#ffeadb" />
                <path d="M90 19H130" stroke="#c07b42" stroke-width="5" stroke-linecap="round" />
                <text x="110" y="50" text-anchor="middle">热层</text>
                <text x="110" y="100" text-anchor="middle">较冷流体</text>
              </template>
            </svg>
            <figcaption>
              {{
                bottom
                  ? '低密度流体在下，易上升；较冷流体补入形成回流。'
                  : '低密度流体已在上，自然对流较弱，仍可通过传导等换热。'
              }}
            </figcaption>
          </figure>
        </div>
      </div>

      <figure v-else-if="code === '130404'" class="thermal-figure thermal-figure--single">
        <svg viewBox="0 0 330 205" role="img" :aria-labelledby="uid + '-capacity'">
          <title :id="uid + '-capacity'">
            同质量、同恒定净功率加热 40 秒，A 从 20°C 升至 60°C，B 从 20°C 升至 40°C；B 的比热容为 A
            的两倍。
          </title>
          <path d="M45 15V135H293" fill="none" stroke="#64748b" stroke-width="1.5" />
          <path d="M45 35H255V135 M45 85H255" fill="none" stroke="#98a8bb" stroke-dasharray="4 4" />
          <path d="M45 135L255 35" fill="none" stroke="#2453cd" stroke-width="2.5" />
          <path d="M45 135L255 85" fill="none" stroke="#087f76" stroke-width="2.5" />
          <text x="51" y="16">T / °C</text>
          <text x="34" y="41" text-anchor="end">60</text>
          <text x="34" y="91" text-anchor="end">40</text>
          <text x="34" y="141" text-anchor="end">20</text>
          <text x="45" y="157" text-anchor="middle">0</text>
          <text x="255" y="157" text-anchor="middle">40</text>
          <text x="292" y="180">t / s</text>
          <text x="269" y="41">A</text>
          <text x="269" y="91">B</text>
        </svg>
        <figcaption>
          质量和净加热功率相同，A 温升 40°C，B 温升 20°C，故 B 的比热容是 A 的 2
          倍。比较的是温升或斜率，不能拿末温 60 与 40 直接求比热容之比。
        </figcaption>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { thermalMethods, type ThermalMethodCode } from '@/content/knowledge/thermalMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: ThermalMethodCode }>()
const uid = useId()
// 按叶节点取独立讲义，使摘要、正文与对应的图示保持一致。
const lesson = computed(() => thermalMethods[props.code])
</script>

<style scoped lang="scss">
.thermal-methods {
  container-type: inline-size;
}
.thermal-methods :deep(h3 > span) {
  flex-shrink: 0;
  white-space: nowrap;
}
.thermal-figure {
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.thermal-figure--single {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  max-width: 640px;
  margin: 12px auto;
}
.thermal-figure > svg {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  margin: auto;
}
.thermal-figure > svg text {
  font-family: var(--font-sans);
  font-size: 16px;
  fill: #344c6c;
}
.thermal-figure h4 {
  margin: 0 0 6px;
  color: #243e65;
  font-size: 16px;
}
.thermal-figure figcaption {
  margin: 8px 0 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
.thermal-figure--single figcaption {
  margin: 0;
}
.thermal-comparison {
  container-type: inline-size;
  max-width: 600px;
  margin: 12px auto;
}
.thermal-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.thermal-pair svg {
  max-width: 210px;
}
@container (max-width: 560px) {
  .thermal-figure--single {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
    max-width: 360px;
  }
  .thermal-pair {
    grid-template-columns: 1fr;
  }
  .thermal-pair figure {
    width: 100%;
    max-width: 320px;
    box-sizing: border-box;
    justify-self: center;
  }
}
@media (max-width: 600px) {
  .thermal-figure {
    padding: 10px;
  }
  .thermal-methods :deep(tbody th) {
    width: 30%;
  }
}
</style>
