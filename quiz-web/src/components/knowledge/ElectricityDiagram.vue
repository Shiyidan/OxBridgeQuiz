<!-- 物理电学互动图：观察电子转移、接地与串并联电路的电流电压账。 -->
<template>
  <figure class="electricity-atlas" aria-label="电学概念互动图">
    <figcaption>
      <span>PHYSICS · ELECTRICITY</span>
      <h5>{{ electrostatic ? '电子去哪，电荷就怎样变' : '同一电源，两种连接' }}</h5>
      <p>
        {{
          electrostatic
            ? '逐步观察电荷转移；这是概念示意，不是原题配图。'
            : '两个6 Ω电阻接入理想电源，比较局部量与总量。'
        }}
      </p>
    </figcaption>
    <template v-if="electrostatic">
      <div class="controls" role="group" aria-label="静电过程">
        <AppButton
          v-for="(label, i) in chargeSteps"
          :key="label"
          size="small"
          :type="stage === i ? 'primary' : 'secondary'"
          :aria-pressed="stage === i"
          @click="stage = i"
          >{{ label }}</AppButton
        >
      </div>
      <svg viewBox="0 0 600 330" role="img" :aria-label="chargeDescriptions[stage]">
        <title>{{ chargeDescriptions[stage] }}</title>
        <rect x="55" y="80" width="175" height="145" rx="18" fill="#edf3ff" stroke="#3265c8" />
        <rect x="370" y="80" width="175" height="145" rx="18" fill="#e5f6f1" stroke="#168879" />
        <text x="142" y="55" text-anchor="middle">{{ stage === 2 ? '带负电金属' : '玻璃棒' }}</text>
        <text x="457" y="55" text-anchor="middle">{{ stage === 2 ? '大地' : '丝绸' }}</text>
        <text x="142" y="140" text-anchor="middle">
          {{ stage === 0 ? '净电荷 0' : stage === 1 ? '缺少电子' : '多余电子' }}
        </text>
        <text x="142" y="185" text-anchor="middle" class="charge">
          {{ stage === 0 ? '+ − + −' : stage === 1 ? '+ + +' : '− − −' }}
        </text>
        <text x="457" y="140" text-anchor="middle">
          {{ stage === 0 ? '净电荷 0' : stage === 1 ? '得到电子' : '接收电子' }}
        </text>
        <text x="457" y="185" text-anchor="middle" class="charge">
          {{ stage === 0 ? '+ − + −' : stage === 1 ? '− − −' : '导电通路' }}
        </text>
        <g v-if="stage > 0">
          <path d="M250 165H350l-15-12m15 12-15 12" class="electron" />
          <text x="300" y="125" text-anchor="middle">电子</text>
        </g>
        <text x="300" y="280" text-anchor="middle">
          {{
            stage === 0
              ? '两物体总电荷：0'
              : stage === 1
                ? '正负等量，总电荷仍为0'
                : '多余电子释放，金属趋于中性'
          }}
        </text>
      </svg>
      <p class="insight" aria-live="polite">{{ chargeDescriptions[stage] }}</p>
      <p class="note">
        接地演示使用导体，不能据此认为玻璃上的局部电荷会自由流动。正导体接地时，电子方向相反。
      </p>
    </template>
    <template v-else>
      <div class="controls" role="group" aria-label="电路连接方式">
        <AppButton
          v-for="(label, i) in ['串联', '并联']"
          :key="label"
          size="small"
          :type="parallel === Boolean(i) ? 'primary' : 'secondary'"
          :aria-pressed="parallel === Boolean(i)"
          @click="parallel = Boolean(i)"
          >{{ label }}</AppButton
        ><AppButton size="small" type="secondary" @click="voltage = voltage === 6 ? 12 : 6"
          >电源：{{ voltage }} V · 切换</AppButton
        >
      </div>
      <svg
        viewBox="0 0 600 360"
        role="img"
        :aria-label="parallel ? '两个6欧电阻并联，两端电压相同' : '两个6欧电阻串联，电流相同'"
      >
        <title>
          {{ parallel ? '并联支路同电压，总电流相加' : '串联电流相同，电源电压分给两电阻' }}
        </title>
        <path d="M80 250V65H520V295H80V280" class="wire" />
        <path d="M55 250H105M65 280H95" class="wire" />
        <text x="45" y="235">+</text>
        <text x="45" y="305">−</text>
        <rect x="130" y="35" width="100" height="60" class="resistor" />
        <text x="180" y="75" text-anchor="middle">6 Ω</text>
        <template v-if="!parallel">
          <rect x="350" y="35" width="100" height="60" class="resistor" />
          <text x="400" y="75" text-anchor="middle">6 Ω</text>
          <text x="180" y="130" text-anchor="middle">{{ voltage / 2 }} V</text>
          <text x="400" y="130" text-anchor="middle">{{ voltage / 2 }} V</text>
          <text x="300" y="220" text-anchor="middle">每处 I = {{ current }} A</text>
        </template>
        <template v-else>
          <path d="M80 200H520" class="wire" />
          <rect x="250" y="170" width="100" height="60" class="resistor" />
          <text x="300" y="210" text-anchor="middle">6 Ω</text>
          <text x="350" y="120" text-anchor="middle">{{ voltage }} V · {{ voltage / 6 }} A</text>
          <text x="350" y="265" text-anchor="middle">{{ voltage }} V · {{ voltage / 6 }} A</text>
        </template>
        <text x="80" y="340" text-anchor="middle">{{ voltage }} V</text>
        <text x="330" y="340" text-anchor="middle">总电流 {{ current }} A</text>
      </svg>
      <div class="metrics">
        <span
          >等效电阻<strong>{{ parallel ? 3 : 12 }} Ω</strong></span
        ><span
          >单个功率<strong>{{ powerEach }} W</strong></span
        ><span
          >总功率<strong>{{ voltage * current }} W</strong></span
        >
      </div>
      <LatexText :text="circuitRelation" />
      <p class="insight" aria-live="polite">
        {{
          parallel
            ? '两条支路各跨接整个电源。并联后等效电阻小于6 Ω；每条支路的电流不能当作总电流。'
            : '两个相同电阻分得相同电压。每个电阻只能代入其两端电压，不能直接代入整个电源电压。'
        }}
      </p>
    </template>
  </figure>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'
const props = defineProps<{ topic: string }>()
// 考纲叶子决定静电过程或电路关系图，整章默认从静电开始。
const electrostatic = computed(() => props.topic !== '130102')
const stage = ref(0)
const parallel = ref(false)
const voltage = ref(6)
const chargeSteps = ['摩擦前', '摩擦后', '导体接地']
const chargeDescriptions = [
  '整体中正负电荷平衡，不代表物体内部没有电荷。',
  '玻璃失电子为正，丝绸得电子为负；电子发生转移，总电荷守恒。',
  '负金属通过接地导线释放多余电子。这里已经换成导体示例，不是把玻璃棒当导体。',
]
// 电源理想且每个电阻固定为6 Ω，按连接方式求总电流。
const current = computed(() => voltage.value / (parallel.value ? 3 : 12))
// 单个元件的功率只使用它自身的电压，避免将串联总电压代入。
const powerEach = computed(() => (parallel.value ? voltage.value : voltage.value / 2) ** 2 / 6)
// 公式在脚本中转义，避免模板表达式把反斜线当作字符串转义吞掉。
const circuitRelation = computed(() =>
  parallel.value
    ? '$I_{\\rm total}=I_1+I_2,\\quad V_1=V_2$'
    : '$I_1=I_2,\\quad V_{\\rm total}=V_1+V_2$',
)
// 切换知识点清除上一节的交互状态。
watch(
  () => props.topic,
  () => {
    stage.value = 0
    parallel.value = false
    voltage.value = 6
  },
)
</script>
<style scoped>
.electricity-atlas {
  margin: 0;
  padding: 24px;
  border: 1px solid #cadcf3;
  border-radius: 12px;
  background: linear-gradient(135deg, #f1f6ff, #fff);
  color: #172b48;
  min-width: 0;
}
figcaption > span {
  font: 600 12px/1.5 sans-serif;
  letter-spacing: 0.1em;
  color: #315a96;
}
h5 {
  font-size: 21px;
  font-weight: 700;
  margin: 10px 0;
}
p {
  font-size: 14px;
  line-height: 1.8;
  margin: 8px 0;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0;
}
.controls :deep(.app-button.el-button) {
  --app-button-bg: #fff;
  --app-button-color: #275bbb;
  --app-button-border: #bbceee;
  --app-button-hover-bg: #eef4ff;
  --app-button-hover-border: #275bbb;
  --app-button-active-bg: #eef4ff;
  --app-button-active-border: #275bbb;
}
.controls :deep(.app-button.el-button.app-button--primary) {
  --app-button-bg: #275bbb;
  --app-button-color: #fff;
  --app-button-border: #275bbb;
  --app-button-hover-bg: #275bbb;
  --app-button-hover-border: #275bbb;
  --app-button-active-bg: #275bbb;
  --app-button-active-border: #275bbb;
}
svg {
  width: 100%;
  display: block;
  overflow: visible;
}
svg text {
  font-size: 24px;
  fill: #233b5c;
}
.charge {
  font-size: 30px;
}
.wire {
  stroke: #405b7f;
  stroke-width: 4;
  fill: none;
}
.resistor {
  fill: #fff;
  stroke: #3265c8;
  stroke-width: 3;
}
.electron {
  fill: none;
  stroke: #3265c8;
  stroke-width: 4;
}
.metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding: 14px 0;
  margin-bottom: 10px;
  border-block: 1px solid #d4e1f2;
}
.metrics span {
  flex: 1;
  min-width: 80px;
  font-size: 13px;
  color: #536b8b;
}
.metrics strong {
  display: block;
  font-size: 22px;
  margin-top: 6px;
  color: #234f9b;
}
.insight {
  border-left: 3px solid #3265c8;
  padding-left: 12px;
  margin-top: 16px;
}
.note {
  color: #61728a;
  font-size: 12px;
}
@media (max-width: 600px) {
  .electricity-atlas {
    padding: 14px;
  }
  h5 {
    font-size: 18px;
  }
  .controls {
    gap: 6px;
  }
  svg text {
    font-size: 25px;
  }
}
</style>
