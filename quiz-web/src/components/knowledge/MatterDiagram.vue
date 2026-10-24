<!-- 物理物质交互图解：用粒子、活塞、潜热账本、称量差和分层液柱解释P5五个叶子节点。 -->
<template>
  <figure class="matter-atlas">
    <figcaption>
      <span>PHYSICS · MATTER</span>
      <h5>{{ scene.title }}</h5>
      <p>{{ scene.intro }}</p>
    </figcaption>
    <div class="controls" role="group" :aria-label="scene.title">
      <AppButton
        v-for="(label, index) in scene.choices"
        :key="label"
        size="small"
        :type="choice === index ? 'primary' : 'secondary'"
        :aria-pressed="choice === index"
        @click="choice = index"
        >{{ label }}</AppButton
      >
    </div>

    <svg v-if="mode === '501'" viewBox="0 0 600 345" role="img" :aria-label="particleLabel">
      <title>{{ particleLabel }}</title>
      <rect x="65" y="30" width="470" height="240" rx="10" class="container" />
      <g v-for="(point, index) in particles" :key="index">
        <circle :cx="point.x" :cy="point.y" r="11" class="particle" />
        <path
          v-if="choice === 2"
          :d="'M' + (point.x + 14) + ' ' + point.y + 'h18l-5 -4m5 4l-5 4'"
          :transform="'rotate(' + index * 90 + ' ' + point.x + ' ' + point.y + ')'"
          class="motion"
        />
      </g>
      <text x="300" y="310" text-anchor="middle">
        {{ ['紧密且位置有约束', '紧密，但可以相互换位', '间隔较大，无规则运动'][choice] }}
      </text>
      <text x="300" y="342" text-anchor="middle">
        {{ choice === 0 ? '不是静止：仍在原位附近振动' : '圆点大小相同，不代表真实尺寸比例' }}
      </text>
    </svg>

    <svg v-else-if="mode === '502'" viewBox="0 0 600 340" role="img" :aria-label="gasLabel">
      <title>{{ gasLabel }}</title>
      <path d="M55 65V250H550M55 65H550" class="axis" />
      <rect x="56" y="66" :width="gasWidth" height="183" class="gas" />
      <rect :x="55 + gasWidth" y="65" width="18" height="185" class="piston" />
      <path :d="'M' + (73 + gasWidth) + ' 155H550'" class="handle" />
      <circle
        v-for="index in 12"
        :key="index"
        :cx="65 + ((((index - 1) % 4) + 0.5) * (gasWidth - 20)) / 4"
        :cy="100 + Math.floor((index - 1) / 4) * 55"
        r="7"
        class="particle"
      />
      <text x="40" y="35">粒子数相同 · 温度相同</text>
      <text x="40" y="292">V = {{ gasVolume }} cm³</text>
      <text x="315" y="292">p = {{ 30000 / gasVolume }} kPa</text>
      <text x="300" y="333" text-anchor="middle">pV始终为30 000 kPa·cm³</text>
    </svg>

    <svg v-else-if="mode === '503'" viewBox="0 0 600 370" role="img" :aria-label="heatLabel">
      <title>{{ heatLabel }}</title>
      <text x="35" y="35">起点：10 g冰 + 20 g水，均为0°C</text>
      <text x="35" y="78">本次输入：{{ suppliedHeat }} J</text>
      <rect x="35" y="105" width="520" height="55" class="empty-bar" />
      <rect
        x="35"
        y="105"
        :width="(520 * Math.min(suppliedHeat, 3300)) / 4560"
        height="55"
        class="latent"
      />
      <rect
        v-if="suppliedHeat > 3300"
        :x="35 + (520 * 3300) / 4560"
        y="105"
        :width="(520 * (suppliedHeat - 3300)) / 4560"
        height="55"
        class="sensible"
      />
      <text x="35" y="205">用于熔化：{{ Math.min(suppliedHeat, 3300) }} J</text>
      <text x="35" y="246">用于升温：{{ Math.max(suppliedHeat - 3300, 0) }} J</text>
      <text x="35" y="287">剩余冰：{{ Math.max(10 - suppliedHeat / 330, 0).toFixed(2) }} g</text>
      <text x="35" y="334">终温：{{ Math.max((suppliedHeat - 3300) / 126, 0) }} °C</text>
    </svg>

    <svg v-else-if="mode === '504'" viewBox="0 0 600 360" role="img" :aria-label="densityLabel">
      <title>{{ densityLabel }}</title>
      <path d="M130 45V255H330V45" class="axis" />
      <rect
        x="132"
        :y="choice === 2 ? 65 : 155"
        width="196"
        :height="choice === 2 ? 188 : 98"
        :class="choice === 1 ? 'oil' : 'water'"
      />
      <text x="230" :y="choice === 2 ? 120 : 200" text-anchor="middle">{{ liquidVolume }} cm³</text>
      <rect x="100" y="260" width="260" height="60" rx="10" class="scale" />
      <text x="230" y="300" text-anchor="middle">{{ totalMass }} g</text>
      <text x="365" y="115">空筒90 g</text>
      <text x="365" y="157">净液体</text>
      <text x="365" y="195">{{ totalMass - 90 }} g</text>
      <text x="300" y="350" text-anchor="middle">密度 = {{ density }} g/cm³</text>
    </svg>

    <svg v-else viewBox="0 0 600 360" role="img" :aria-label="pressureLabel">
      <title>{{ pressureLabel }}</title>
      <rect x="95" y="40" width="210" height="106.67" class="oil" />
      <rect x="95" y="146.67" width="210" height="133.33" class="water" />
      <path d="M95 30V280H305V30" class="axis" />
      <text x="65" y="48" text-anchor="end">9</text>
      <text x="65" y="155" text-anchor="end">5</text>
      <text x="65" y="288" text-anchor="end">0</text>
      <text x="10" y="325">底上高度 / cm</text>
      <text x="330" y="84">X：800 kg/m³</text>
      <text x="330" y="200">Y：1000 kg/m³</text>
      <path :d="'M85 ' + sensorY + 'H305'" class="sensor-line" />
      <circle cx="205" :cy="sensorY" r="8" class="sensor" />
      <text x="330" y="275">测点：{{ sensorHeight }} cm</text>
      <text x="300" y="355" text-anchor="middle">液体造成的压强：{{ pressure }} Pa</text>
    </svg>

    <p class="result" aria-live="polite"><LatexText :text="explanation" /></p>
    <p class="note">概念图可切换参数；图示数值用于理解关系，不另作题库题目。</p>
  </figure>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '../AppButton.vue'
import LatexText from '../LatexText.vue'
const props = defineProps<{ topic?: string }>()
const choice = ref(0)
// 当前考纲叶子决定图解内容；切换知识点清除上一次选择。
const mode = computed(() => props.topic?.slice(-3) || '501')
watch(
  () => props.topic,
  () => {
    choice.value = 0
  },
)
const scenes: Record<string, { title: string; intro: string; choices: string[] }> = {
  '501': {
    title: '同样是粒子，为什么有三种物态？',
    intro: '比较间距和位置约束。粒子图是静态截面，下面文字说明它们实际如何运动。',
    choices: ['固体', '液体', '气体'],
  },
  '502': {
    title: '压缩同一气体：pV保持多少？',
    intro: '封闭、恒温；图中点数固定，活塞越向左，气体数密度越大。',
    choices: ['300 cm³', '150 cm³', '75 cm³'],
  },
  '503': {
    title: '能量先熔冰，还是先升温？',
    intro: '绝热系统，熔化比潜热330 J/g，水比热容4.2 J/(g·°C)。',
    choices: ['输入2520 J', '输入3300 J', '输入4560 J'],
  },
  '504': {
    title: '称量包含容器，密度只用净质量',
    intro: '同一个90 g量筒；选择液体或改变体积，比较称量和密度。',
    choices: ['200 cm³水', '200 cm³油', '400 cm³水'],
  },
  '505': {
    title: '分层压强：只数测点上方的液体',
    intro: 'X层4 cm，Y层5 cm，g = 10 N/kg；显示液体贡献，不包含大气压。',
    choices: ['测点在底部', '底上4 cm', '底上7 cm'],
  },
}
// 未知节点仅用于安全兜底，正常学习路由传入130501至130505。
const scene = computed(() => scenes[mode.value] || scenes['501']!)
// 保持12个粒子不变，三态只改变排列与平均间距的示意。
const particles = computed(() =>
  Array.from({ length: 12 }, (_, index) => {
    if (choice.value === 0)
      return { x: 230 + (index % 4) * 32, y: 145 + Math.floor(index / 4) * 32 }
    if (choice.value === 1)
      return {
        x: 185 + (index % 4) * 50 + (Math.floor(index / 4) % 2) * 15,
        y: 160 + Math.floor(index / 4) * 30 + (index % 2) * 4,
      }
    return {
      x: 105 + (index % 4) * 112 + (Math.floor(index / 4) % 2) * 12,
      y: 65 + Math.floor(index / 4) * 75 + (index % 2) * 10,
    }
  }),
)
// 活塞宽度与体积严格成比例，压强由初态pV乘积计算。
const gasVolume = computed(() => [300, 150, 75][choice.value] || 300)
const gasWidth = computed(() => gasVolume.value * 1.4)
// 相变账本先支付10g冰熔化的3300J，再给30g水升温。
const suppliedHeat = computed(() => [2520, 3300, 4560][choice.value] || 2520)
// 称量总质量包含90g量筒，切换体积时保持水的密度不变。
const liquidVolume = computed(() => (choice.value === 2 ? 400 : 200))
const density = computed(() => (choice.value === 1 ? 0.9 : 1))
const totalMass = computed(() => 90 + liquidVolume.value * density.value)
// 液柱厚度由测点高度截取，绝不把测点以下的液体计入压强。
const sensorHeight = computed(() => [0, 4, 7][choice.value] || 0)
const sensorY = computed(() => 280 - (sensorHeight.value * 240) / 9)
const lowerHeight = computed(() => Math.max(5 - sensorHeight.value, 0))
const upperHeight = computed(() => Math.min(9 - sensorHeight.value, 4))
const pressure = computed(
  () => (1000 * 10 * lowerHeight.value) / 100 + (800 * 10 * upperHeight.value) / 100,
)
// 文字替代同步表达各个图像状态，屏幕阅读器不必读取SVG位置。
const particleLabel = computed(
  () =>
    ['固体粒子接近并在固定位置附近振动', '液体粒子接近并可相互换位', '气体粒子分散，无规则运动'][
      choice.value
    ],
)
const gasLabel = computed(
  () =>
    '气体体积' + gasVolume.value + '立方厘米，压强' + 30000 / gasVolume.value + '千帕，温度不变',
)
const heatLabel = computed(
  () => '输入' + suppliedHeat.value + '焦，先熔化冰，只有超过3300焦的部分让水升温',
)
const densityLabel = computed(
  () =>
    '量筒总质量' +
    totalMass.value +
    '克，净液体' +
    (totalMass.value - 90) +
    '克，密度' +
    density.value +
    '克每立方厘米',
)
const pressureLabel = computed(
  () =>
    '测点位于底上' +
    sensorHeight.value +
    '厘米，上方Y层' +
    lowerHeight.value +
    '厘米、X层' +
    upperHeight.value +
    '厘米，液柱压强' +
    pressure.value +
    '帕',
)
// 根据同一组图示数值给出解释，避免交互只改变颜色而不改变结论。
const explanation = computed(() => {
  if (mode.value === '501')
    return (
      [
        '固体粒子受到位置约束，因此保持形状；它们仍在振动，并非完全静止。',
        '液体粒子仍然接近，所以难压缩；可以相互换位，所以能流动。',
        '气体粒子之间有较大空隙，所以容易压缩；体积缩小不等于单个粒子缩小。',
      ][choice.value] || ''
    )
  if (mode.value === '502')
    return (
      '$pV=100\\times300=' +
      30000 / gasVolume.value +
      '\\times' +
      gasVolume.value +
      '=30000$ kPa·cm³。平均速率由恒温条件保持；同一活塞的碰撞频率随压强同比增加。'
    )
  if (mode.value === '503')
    return suppliedHeat.value < 3300
      ? '2520 J不足以熔完10 g冰，剩余约2.36 g冰；冰水共存，温度保持0°C。'
      : suppliedHeat.value === 3300
        ? '3300 J刚好熔完全部冰，尚无余额升温；30 g水仍为0°C。'
        : '熔冰后剩 $4560-3300=1260$ J；$\\Delta T=1260/(30\\times4.2)=10$ °C。'
  if (mode.value === '504')
    return (
      '$\\rho=(' +
      totalMass.value +
      '-90)/' +
      liquidVolume.value +
      '=' +
      density.value +
      '$ g/cm³。质量、体积同时翻倍时，同种液体的密度不变。'
    )
  return (
    '$p=1000\\times10\\times' +
    lowerHeight.value / 100 +
    '+800\\times10\\times' +
    upperHeight.value / 100 +
    '=' +
    pressure.value +
    '$ Pa。若求绝对压强，再加液面外压。'
  )
})
</script>
<style scoped>
.matter-atlas {
  margin: 0;
  padding: 22px;
  background: linear-gradient(135deg, #effaf7, #fff);
  border: 1px solid #c2e4da;
  border-radius: 16px;
  color: #15534c;
  min-width: 0;
}
figcaption > span {
  font-size: 12px;
  letter-spacing: 1.6px;
  font-weight: 700;
  color: #278577;
}
h5 {
  font-size: 21px;
  font-weight: 700;
  margin: 12px 0;
}
p {
  font-size: 14px;
  line-height: 1.8;
  margin: 10px 0;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}
.controls :deep(.app-button) {
  margin: 0;
  --app-button-bg: #fff;
  --app-button-color: #17675b;
  --app-button-border: #afd9ce;
}
.controls :deep(.app-button--primary) {
  --app-button-bg: #087e6d;
  --app-button-color: #fff;
  --app-button-border: #087e6d;
}
svg {
  display: block;
  width: 100%;
  height: auto;
  /* 桌面图示保留阅读高度，窄屏仍按原比例缩放。 */
  max-height: 380px;
  overflow: visible;
}
svg text {
  font-family: inherit;
  font-size: 24px;
  fill: #15534c;
}
.axis {
  fill: none;
  stroke: #709b92;
  stroke-width: 3;
}
.container {
  fill: #fff;
  stroke: #8fbeb3;
  stroke-width: 2;
}
.particle {
  fill: #328eac;
}
.motion {
  fill: none;
  stroke: #328eac;
  stroke-width: 2;
}
.gas {
  fill: #e3f5f8;
}
.piston {
  fill: #859d9b;
}
.handle {
  stroke: #859d9b;
  stroke-width: 14;
}
.empty-bar {
  fill: #edf1ef;
}
.latent,
.water {
  fill: #b6dae7;
}
.sensible,
.oil {
  fill: #eadbb1;
}
.scale {
  fill: #e4eeea;
  stroke: #6f9f92;
  stroke-width: 2;
}
.sensor-line {
  fill: none;
  stroke: #bb6549;
  stroke-width: 2;
  stroke-dasharray: 6 5;
}
.sensor {
  fill: #bb6549;
}
.result {
  padding: 12px 14px;
  background: #fff;
  border-left: 3px solid #359d88;
  border-radius: 5px;
}
.note {
  font-size: 12px;
  color: #668b80;
}
@media (max-width: 600px) {
  .matter-atlas {
    padding: 14px;
  }
  h5 {
    font-size: 18px;
  }
  .controls {
    gap: 6px;
  }
}
</style>
