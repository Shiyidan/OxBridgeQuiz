<!-- 物理热学互动图：分别演示导热倍率、流体循环、辐射平衡与输入能量分配。 -->
<template>
  <figure class="thermal-atlas" aria-label="热学概念互动图">
    <figcaption>
      <span>PHYSICS · THERMAL</span>
      <h5>{{ titles[mode] }}</h5>
      <p>{{ descriptions[mode] }}</p>
    </figcaption>
    <template v-if="mode === 0">
      <div class="controls" role="group" aria-label="导热控制变量">
        <AppButton
          size="small"
          :type="areaDouble ? 'primary' : 'secondary'"
          :aria-pressed="areaDouble"
          @click="areaDouble = !areaDouble"
          >截面积 ×{{ areaDouble ? 2 : 1 }}</AppButton
        ><AppButton
          size="small"
          :type="lengthDouble ? 'primary' : 'secondary'"
          :aria-pressed="lengthDouble"
          @click="lengthDouble = !lengthDouble"
          >长度 ×{{ lengthDouble ? 2 : 1 }}</AppButton
        ><AppButton
          size="small"
          :type="differenceDouble ? 'primary' : 'secondary'"
          :aria-pressed="differenceDouble"
          @click="differenceDouble = !differenceDouble"
          >温差 ×{{ differenceDouble ? 2 : 1 }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 600 300"
        role="img"
        :aria-label="'导热率是基准的' + conductionFactor + '倍'"
      >
        <title>均匀同材料棒，无侧面热损失，比较稳态导热率</title>
        <rect x="35" y="65" width="95" height="150" rx="8" fill="#f8d2bc" />
        <rect x="470" y="65" width="95" height="150" rx="8" fill="#cce4f5" />
        <rect
          x="130"
          :y="areaDouble ? 95 : 115"
          width="340"
          :height="areaDouble ? 90 : 50"
          fill="#c9d9df"
          stroke="#7794a0"
        />
        <path d="M175 140H425l-20-13m20 13-20 13" class="heat" />
        <text x="82" y="45" text-anchor="middle">{{ differenceDouble ? 100 : 60 }}°C</text>
        <text x="517" y="45" text-anchor="middle">20°C</text>
        <text x="300" y="220" text-anchor="middle">长度：{{ lengthDouble ? 2 : 1 }} L</text>
        <text x="300" y="275" text-anchor="middle">面积：{{ areaDouble ? 2 : 1 }} A</text>
      </svg>
      <div class="result" aria-live="polite"><LatexText :text="conductionText" /></div>
      <p class="insight">
        {{
          conductionFactor === 1
            ? '几个因素可以相互抵消：面积与长度同时加倍，导热率不变。'
            : '只改变一项时先判断方向，多项变化时把倍率相乘。'
        }}
      </p>
      <p class="note">尺寸为示意；按钮改变的是截面积，不是直径。棒的材料、侧面绝热条件保持不变。</p>
    </template>
    <template v-else-if="mode === 1">
      <div class="controls" role="group" aria-label="加热位置">
        <AppButton
          size="small"
          :type="!heatTop ? 'primary' : 'secondary'"
          :aria-pressed="!heatTop"
          @click="heatTop = false"
          >从底部加热</AppButton
        ><AppButton
          size="small"
          :type="heatTop ? 'primary' : 'secondary'"
          :aria-pressed="heatTop"
          @click="heatTop = true"
          >从顶部加热</AppButton
        >
      </div>
      <svg
        viewBox="0 0 600 330"
        role="img"
        :aria-label="heatTop ? '热水在上方形成较稳定分层' : '底部热水上升，两侧冷水下降形成循环'"
      >
        <title>自然对流依赖密度差和可流动介质，示例为常温以上的水</title>
        <path d="M100 45V285H500V45" class="container" />
        <rect x="105" y="65" width="390" height="215" fill="#e0eff7" />
        <rect x="105" :y="heatTop ? 65 : 245" width="390" height="35" fill="#f5c6a4" />
        <g v-if="!heatTop">
          <path d="M300 240V100l-14 18m14-18 14 18" class="heat" />
          <path d="M170 105V230l-14-18m14 18 14-18M430 105V230l-14-18m14 18 14-18" class="cool" />
          <text x="300" y="55" text-anchor="middle">低密度热水上升</text>
        </g>
        <g v-else>
          <text x="300" y="120" text-anchor="middle">热、低密度</text>
          <text x="300" y="215" text-anchor="middle">冷、高密度</text>
        </g>
        <text x="300" y="320" text-anchor="middle">
          {{ heatTop ? '稳定分层，自然对流较弱' : '两侧较冷水下沉，形成循环' }}
        </text>
      </svg>
      <p class="result" aria-live="polite">
        {{
          heatTop
            ? '加热上部不等于热水会自动往下循环；流体上轻下重时较稳定，能量仍可通过传导等方式向下传递。'
            : '底部一团水受热，质量不变而体积增大，密度下降；上升后较冷水补入。'
        }}
      </p>
      <p class="note">
        对流方向是流体运动，不是单独画一条“热总向上”的规则。0—4°C水的特殊密度变化不在这个示例条件内。
      </p>
    </template>
    <template v-else-if="mode === 2">
      <div class="controls" role="group" aria-label="辐射条件">
        <AppButton
          size="small"
          :type="dark ? 'primary' : 'secondary'"
          :aria-pressed="dark"
          @click="dark = !dark"
          >{{ dark ? '暗哑表面' : '光亮表面' }}</AppButton
        ><AppButton
          size="small"
          :type="equalTemperature ? 'primary' : 'secondary'"
          :aria-pressed="equalTemperature"
          @click="equalTemperature = !equalTemperature"
          >{{ equalTemperature ? '物体与环境同温' : '物体比环境热' }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 600 320"
        role="img"
        :aria-label="
          equalTemperature ? '辐射吸收与发射相等，净传热为零' : '发射大于吸收，物体净失热'
        "
      >
        <title>两种表面的比较保持面积与温度相同，箭头长度只表示定性关系</title>
        <rect x="30" y="35" width="540" height="240" rx="20" fill="#edf5fa" stroke="#a7bfce" />
        <circle
          cx="300"
          cy="150"
          r="60"
          :fill="dark ? '#425063' : '#d9e1e7'"
          stroke="#678493"
          stroke-width="3"
        />
        <text x="300" y="155" text-anchor="middle" :style="{ fill: dark ? 'white' : '#294655' }">
          {{ equalTemperature ? '20°C' : '60°C' }}
        </text>
        <g v-for="i in dark ? 3 : 1" :key="i">
          <path
            :d="
              'M370 ' + (110 + i * 25) + 'h' + (equalTemperature ? 75 : 120) + 'l-15-10m15 10-15 10'
            "
            class="heat"
          />
          <path :d="'M150 ' + (110 + i * 25) + 'H225l-15-10m15 10-15 10'" class="cool" />
        </g>
        <text x="130" y="85" text-anchor="middle">吸收</text>
        <text x="460" y="85" text-anchor="middle">发射</text>
        <text x="300" y="255" text-anchor="middle">环境20°C</text>
        <text x="300" y="310" text-anchor="middle">
          {{ equalTemperature ? '净传热为0，双方仍在辐射' : '物体持续发射，也同时吸收' }}
        </text>
      </svg>
      <p class="result" aria-live="polite">
        {{
          dark
            ? '暗哑表面在相同条件下通常吸收和发射都较强。'
            : '光亮表面通常吸收和发射都较弱，而不是只吸收弱、发射强。'
        }}{{
          equalTemperature
            ? ' 同温时两者平衡，不能说辐射停止。'
            : ' 物体更热时净失热；不要把发射总量与净损失混为一谈。'
        }}
      </p>
      <p class="note">箭头为定性示意，不按辐射定律计算长度。辐射可穿过真空，和传导、对流不同。</p>
    </template>
    <template v-else>
      <div class="controls" role="group" aria-label="热量账">
        <AppButton size="small" type="secondary" @click="massDouble = !massDouble"
          >质量 {{ massDouble ? 1 : 0.5 }} kg</AppButton
        ><AppButton size="small" type="secondary" @click="capacityDouble = !capacityDouble"
          >比热容 {{ capacityDouble ? 2000 : 1000 }}</AppButton
        ><AppButton
          size="small"
          :type="hasLoss ? 'primary' : 'secondary'"
          :aria-pressed="hasLoss"
          @click="hasLoss = !hasLoss"
          >{{ hasLoss ? '25%能量散失' : '忽略散热' }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 600 320"
        role="img"
        :aria-label="
          '输入12000焦耳，储存' + storedEnergy + '焦耳，温升' + temperatureRise + '摄氏度'
        "
      >
        <title>200 W加热60秒，从20摄氏度开始，无相变且比热容恒定</title>
        <text x="300" y="45" text-anchor="middle">输入：200 W × 60 s = 12000 J</text>
        <rect x="55" y="80" width="490" height="55" rx="6" fill="#f3c28d" />
        <rect
          x="55"
          y="180"
          :width="490 * (hasLoss ? 0.75 : 1)"
          height="55"
          rx="6"
          fill="#81b5cf"
        />
        <rect v-if="hasLoss" x="422.5" y="180" width="122.5" height="55" rx="6" fill="#e2b8ad" />
        <text :x="hasLoss ? 230 : 300" y="216" text-anchor="middle">储存 {{ storedEnergy }} J</text>
        <text v-if="hasLoss" x="485" y="265" text-anchor="middle">散失3000 J</text>
        <text x="75" y="305">末温 {{ 20 + temperatureRise }}°C</text>
        <text x="335" y="305">温升 {{ temperatureRise }}°C</text>
      </svg>
      <div class="result" aria-live="polite"><LatexText :text="heatCapacityText" /></div>
      <p class="insight">
        相同输入不一定相同温升：质量或比热容增加，温升减小；有散热时，只把真正储存的能量代入mcΔT。
      </p>
      <p class="note">
        比热容单位J/(kg·°C)。教学示例无相变，所示散失比例是给定条件，不是任何加热器的固定损耗。
      </p>
    </template>
  </figure>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'
const props = defineProps<{ topic: string }>()
// 四个考纲叶子分别使用传导、对流、辐射和热容量账。
const mode = computed(() =>
  Math.max(0, ['130401', '130402', '130403', '130404'].indexOf(props.topic)),
)
const areaDouble = ref(false),
  lengthDouble = ref(false),
  differenceDouble = ref(false),
  heatTop = ref(false),
  dark = ref(true),
  equalTemperature = ref(false),
  massDouble = ref(false),
  capacityDouble = ref(false),
  hasLoss = ref(false)
const titles = [
  '三个倍率，合成一个导热率',
  '换个加热位置，循环就不同',
  '发射还在，净传热却可以为零',
  '12000 J：先分账，再算温升',
]
const descriptions = [
  '同一材料，热端60°C、冷端20°C作为基准。',
  '观察一团固定质量的水，不把空间体积与水的质量混用。',
  '面积相同，对比表面性质与环境条件。',
  '200 W加热60 s，初温20°C，无相变。',
]
// 稳态导热比例随面积和温差同向变化，随长度反向变化。
const conductionFactor = computed(
  () =>
    ((areaDouble.value ? 2 : 1) * (differenceDouble.value ? 2 : 1)) / (lengthDouble.value ? 2 : 1),
)
// 公式保留控制变量的倍率，帮助学生复核抵消关系。
const conductionText = computed(
  () =>
    `$P/P_0=\\dfrac{${areaDouble.value ? 2 : 1}\\times${differenceDouble.value ? 2 : 1}}{${lengthDouble.value ? 2 : 1}}=${conductionFactor.value}$`,
)
// 总输入12000 J，指定散热条件后剩余部分进入物体内能。
const storedEnergy = computed(() => 12000 * (hasLoss.value ? 0.75 : 1))
// 温升只使用物体储存的能量，质量与比热容独立受控。
const temperatureRise = computed(
  () => storedEnergy.value / ((massDouble.value ? 1 : 0.5) * (capacityDouble.value ? 2000 : 1000)),
)
// 温差公式与SVG能量条使用同一组数据，避免图文数值分离。
const heatCapacityText = computed(
  () =>
    `$\\Delta T=\\dfrac{Q}{mc}=\\dfrac{${storedEnergy.value}}{${massDouble.value ? 1 : 0.5}\\times${capacityDouble.value ? 2000 : 1000}}=${temperatureRise.value}\\,^{\\circ}\\mathrm C$`,
)
// 切换最小知识点重置控制项，避免沿用上一节的假设。
watch(
  () => props.topic,
  () => {
    areaDouble.value = false
    lengthDouble.value = false
    differenceDouble.value = false
    heatTop.value = false
    dark.value = true
    equalTemperature.value = false
    massDouble.value = false
    capacityDouble.value = false
    hasLoss.value = false
  },
)
</script>
<style scoped>
.thermal-atlas {
  margin: 0;
  padding: 24px;
  border: 1px solid #e6d8c2;
  border-radius: 12px;
  background: linear-gradient(135deg, #fff8ed, #fff);
  color: #41372d;
  min-width: 0;
}
figcaption > span {
  font: 600 12px/1.5 sans-serif;
  letter-spacing: 0.1em;
  color: #96703f;
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
  --app-button-color: #86622f;
  --app-button-border: #ddcba9;
  --app-button-hover-bg: #fcf6eb;
  --app-button-hover-border: #86622f;
  --app-button-active-bg: #fcf6eb;
  --app-button-active-border: #86622f;
}
.controls :deep(.app-button.el-button.app-button--primary) {
  --app-button-bg: #86622f;
  --app-button-color: #fff;
  --app-button-border: #86622f;
  --app-button-hover-bg: #86622f;
  --app-button-hover-border: #86622f;
  --app-button-active-bg: #86622f;
  --app-button-active-border: #86622f;
}
svg {
  display: block;
  width: 100%;
}
svg text {
  font-size: 24px;
  fill: #42484c;
}
.heat {
  stroke: #d8753e;
  stroke-width: 4;
  fill: none;
}
.cool {
  stroke: #468eaf;
  stroke-width: 4;
  fill: none;
}
.container {
  stroke: #63808b;
  stroke-width: 5;
  fill: none;
}
.result {
  padding: 14px 0;
  border-block: 1px solid #eadfce;
  line-height: 1.8;
}
.insight {
  border-left: 3px solid #c3914e;
  padding-left: 12px;
  margin-top: 16px;
}
.note {
  font-size: 12px;
  color: #807768;
}
@media (max-width: 600px) {
  .thermal-atlas {
    padding: 14px;
  }
  h5 {
    font-size: 18px;
  }
  svg text {
    font-size: 24px;
  }
  .controls {
    gap: 6px;
  }
}
</style>
