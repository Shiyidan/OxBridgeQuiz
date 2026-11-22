<!-- 电学概念与方法：符号速查与静态对照图，图文按当前小节同步。 -->
<template>
  <KnowledgeMethodsArticle class="electricity-methods" :lesson="lesson" label="电学：概念与方法">
    <template #diagram="{ block }">
      <figure v-if="code === '130101'" class="electricity-figure electricity-figure--single">
        <svg viewBox="0 0 450 175" role="img" :aria-labelledby="uid + '-induction'">
          <title :id="uid + '-induction'">
            正电棒靠近中性导体，电子向近端移动，导体内三负三正、总电荷仍为零。
          </title>
          <rect x="30" y="30" width="42" height="108" rx="12" fill="#fff2e8" stroke="#bf7235" />
          <text v-for="y in [57, 88, 119]" :key="y" x="51" :y="y" text-anchor="middle">+</text>
          <rect x="150" y="32" width="260" height="104" rx="34" fill="#edf4ff" stroke="#7193c6" />
          <text
            v-for="y in [59, 88, 117]"
            :key="'negative-' + y"
            x="177"
            :y="y"
            text-anchor="middle"
          >
            −
          </text>
          <text
            v-for="y in [59, 88, 117]"
            :key="'positive-' + y"
            x="383"
            :y="y"
            text-anchor="middle"
          >
            +
          </text>
          <path
            d="M327 87H228L239 80M228 87L239 94"
            stroke="#2453cd"
            stroke-width="2"
            fill="none"
          />
          <text x="278" y="67" text-anchor="middle">电子重排</text>
          <text x="51" y="164" text-anchor="middle">正电棒</text>
          <text x="280" y="164" text-anchor="middle">未接地、未接触的导体</text>
        </svg>
        <figcaption>
          近端异号、远端同号，整体仍中性。图中符号表示净电荷分布，不表示正电荷从原子核中跑出。
        </figcaption>
      </figure>

      <div v-else-if="block.title === '读图先认符号，再追踪连线'" class="electricity-symbols">
        <figure v-for="symbol in symbols" :key="symbol.kind">
          <svg viewBox="0 0 140 58" role="img" :aria-label="symbol.name + '电路符号'">
            <g fill="none" stroke="#344c6c" stroke-width="2">
              <template v-if="symbol.kind === 'cell'">
                <path d="M10 29H60 M60 9V49 M77 17V41 M77 29H130" />
              </template>
              <template v-else-if="symbol.kind === 'battery'">
                <path d="M10 29H46 M46 9V49 M59 17V41 M59 29H79 M79 9V49 M92 17V41 M92 29H130" />
              </template>
              <template v-else-if="symbol.kind === 'lamp'">
                <path d="M10 29H50 M90 29H130 M56 15L84 43 M56 43L84 15" />
                <circle cx="70" cy="29" r="20" />
              </template>
              <template v-else-if="symbol.kind === 'resistor' || symbol.kind === 'variable'">
                <path d="M10 29H43 M97 29H130" />
                <rect x="43" y="17" width="54" height="24" />
                <path v-if="symbol.kind === 'variable'" d="M45 51L94 5L82 8 M94 5L90 17" />
              </template>
              <template v-else-if="symbol.kind === 'ammeter' || symbol.kind === 'voltmeter'">
                <path d="M10 29H50 M90 29H130" />
                <circle cx="70" cy="29" r="20" />
              </template>
              <template v-else-if="symbol.kind === 'switch'">
                <path d="M10 36H46 M94 36H130 M49 35L91 12" />
                <circle cx="46" cy="36" r="3" />
                <circle cx="94" cy="36" r="3" />
              </template>
              <template v-else>
                <path d="M10 29H50 M50 10L87 29L50 48Z M87 9V49 M87 29H130" />
              </template>
            </g>
            <text
              v-if="symbol.kind === 'ammeter' || symbol.kind === 'voltmeter'"
              x="70"
              y="36"
              text-anchor="middle"
            >
              {{ symbol.kind === 'ammeter' ? 'A' : 'V' }}
            </text>
          </svg>
          <figcaption>{{ symbol.name }}</figcaption>
        </figure>
      </div>

      <div
        v-else-if="block.title === 'V–I 图先看轴，非线性图用 V/I 求电阻'"
        class="electricity-comparison"
      >
        <div class="electricity-pair">
          <figure
            v-for="swapped in [false, true]"
            :key="String(swapped)"
            class="electricity-figure"
          >
            <h4>{{ swapped ? '纵轴 I，横轴 V' : '纵轴 V，横轴 I' }}</h4>
            <svg viewBox="0 0 270 210" role="img" :aria-labelledby="uid + '-graph-' + swapped">
              <title :id="uid + '-graph-' + swapped">
                {{
                  swapped
                    ? '灯丝的 I 对 V 曲线逐渐变平；定温电阻为过原点的直线。'
                    : '灯丝的 V 对 I 曲线逐渐变陡；定温电阻为过原点的直线。'
                }}
              </title>
              <path d="M40 18V165H243" stroke="#64748b" stroke-width="1.5" fill="none" />
              <path
                d="M40 165L195 45"
                stroke="#087f76"
                stroke-width="2"
                stroke-dasharray="6 4"
                fill="none"
              />
              <path
                :d="
                  swapped
                    ? 'M40 165C54.44 106.5 121.11 58.8 190 30'
                    : 'M40 165C105 152 158 92 190 30'
                "
                stroke="#2453cd"
                stroke-width="3"
                fill="none"
              />
              <text x="19" y="30">{{ swapped ? 'I' : 'V' }}</text>
              <text x="242" y="189" text-anchor="end">{{ swapped ? 'V' : 'I' }}</text>
              <text x="26" y="185">0</text>
            </svg>
            <figcaption>
              {{
                swapped
                  ? '横轴为电压：定温电阻的直线斜率是 1/R。'
                  : '横轴为电流：定温电阻的直线斜率是 R。'
              }}
            </figcaption>
          </figure>
        </div>
        <p class="electricity-caption">
          蓝色实线：灯丝；绿色虚线：定温电阻。两图为正向工作区示意，比较曲线趋势，不从无刻度图上读取数值。
        </p>
      </div>

      <div
        v-else-if="block.title === '传感元件变阻后，先确定输出跨在哪一段'"
        class="electricity-comparison"
      >
        <div class="electricity-pair">
          <figure v-for="state in dividerStates" :key="state.sensor" class="electricity-figure">
            <h4>{{ state.title }}</h4>
            <svg
              viewBox="0 0 270 230"
              role="img"
              :aria-labelledby="uid + '-divider-' + state.sensor"
            >
              <title :id="uid + '-divider-' + state.sensor">
                8 V 电源上，2 千欧固定电阻与 {{ state.sensor }} 千欧传感电阻串联，传感电阻分压
                {{ state.voltage }} V。
              </title>
              <g fill="none" stroke="#425574" stroke-width="2">
                <path d="M105 25V48 M105 86V127 M105 165V205" />
                <rect x="93" y="48" width="24" height="38" fill="#edf4ff" />
                <rect x="93" y="127" width="24" height="38" fill="#eaf8f5" />
                <path
                  d="M105 25H28V99 M28 123V205H105 M15 105H41 M20 117H36 M28 99V105 M28 117V123"
                />
                <path d="M105 106H227 M105 205H227" stroke="#087f76" />
              </g>
              <circle v-for="y in [106, 205]" :key="y" cx="105" :cy="y" r="3" fill="#087f76" />
              <text x="50" y="111">8 V</text>
              <text x="128" y="72">固定 2 kΩ</text>
              <text x="128" y="153">传感 {{ state.sensor }} kΩ</text>
              <text x="128" y="185" fill="#087f76">V出＝{{ state.voltage }} V</text>
              <text x="10" y="94">+</text>
              <text x="10" y="137">−</text>
            </svg>
            <figcaption>{{ state.caption }}</figcaption>
          </figure>
        </div>
        <p class="electricity-caption">
          两个固定状态直接对照：输出跨传感电阻、无额外负载。绿色两线为输出端，未在外部接通。
        </p>
      </div>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  electricityMethods,
  type ElectricityMethodCode,
} from '@/content/knowledge/electricityMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: ElectricityMethodCode }>()
const uid = useId()
// 两个小节各有独立摘要、正文和速记，切换时由同一份数据同步。
const lesson = computed(() => electricityMethods[props.code])
const symbols = [
  { kind: 'cell', name: '电池单元 cell' },
  { kind: 'battery', name: '电池组 battery' },
  { kind: 'lamp', name: '灯泡' },
  { kind: 'resistor', name: '定值电阻' },
  { kind: 'variable', name: '可变电阻' },
  { kind: 'ammeter', name: '电流表' },
  { kind: 'voltmeter', name: '电压表' },
  { kind: 'switch', name: '断开的开关' },
  { kind: 'diode', name: '二极管（条线端为阴极）' },
]
const dividerStates = [
  {
    title: '传感电阻较大',
    sensor: 6,
    voltage: 6,
    caption: '总电流 8/(2＋6)＝1 mA；固定电阻分压 2 V。',
  },
  {
    title: '传感电阻减小后',
    sensor: 2,
    voltage: 4,
    caption: '总电流 8/(2＋2)＝2 mA；固定电阻分压升至 4 V。',
  },
]
</script>

<style scoped lang="scss">
.electricity-methods {
  container-type: inline-size;
}
.electricity-methods :deep(h3 > span) {
  flex-shrink: 0;
  white-space: nowrap;
}
.electricity-comparison,
.electricity-symbols {
  container-type: inline-size;
  max-width: 640px;
  margin: 12px auto;
}
.electricity-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.electricity-figure {
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.electricity-figure--single {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  max-width: 640px;
  margin: 12px auto;
}
.electricity-figure--single figcaption {
  margin: 0;
}
.electricity-figure > svg,
.electricity-symbols svg {
  display: block;
  width: 100%;
  height: auto;
}
.electricity-figure > svg {
  max-width: 250px;
  margin: auto;
}
.electricity-figure--single > svg {
  max-width: 320px;
}
.electricity-figure > svg text,
.electricity-symbols svg text {
  font-family: var(--font-sans);
  font-size: 16px;
  fill: #344c6c;
}
.electricity-figure--single > svg text {
  font-size: 20px;
}
.electricity-figure h4 {
  margin: 0 0 6px;
  color: #243e65;
  font-size: 16px;
}
.electricity-figure figcaption,
.electricity-caption,
.electricity-symbols figcaption {
  margin: 8px 0 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
.electricity-symbols {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px 22px;
}
.electricity-symbols figure {
  min-width: 0;
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5eaf1;
  text-align: center;
}
.electricity-symbols svg {
  max-width: 160px;
  margin: auto;
}
@container (max-width: 560px) {
  .electricity-pair {
    grid-template-columns: 1fr;
  }
  .electricity-pair figure {
    width: 100%;
    max-width: 340px;
    box-sizing: border-box;
    justify-self: center;
  }
  .electricity-figure--single {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
    max-width: 360px;
  }
}
@media (max-width: 600px) {
  .electricity-symbols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .electricity-figure {
    padding: 10px;
  }
}
</style>
