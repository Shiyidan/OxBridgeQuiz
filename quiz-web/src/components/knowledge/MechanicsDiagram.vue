<!-- 物理力学交互图解：按叶子节点展示方向、受力、弹性、惯性、终端速度、碰撞与能量账本。 -->
<template>
  <figure class="mechanics-atlas">
    <figcaption>
      <span>PHYSICS · MECHANICS</span>
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

    <svg v-if="mode === '301'" viewBox="0 0 600 340" role="img" :aria-label="motionLabel">
      <title>{{ motionLabel }}</title>
      <path d="M70 35V285M70 180H555" class="axis" />
      <text x="18" y="30">v / m·s⁻¹</text>
      <text x="490" y="325">t / s</text>
      <text x="52" y="106" text-anchor="end">2</text>
      <text x="52" y="188" text-anchor="end">0</text>
      <text x="52" y="268" text-anchor="end">−2</text>
      <rect x="70" y="100" width="220" height="80" class="positive" />
      <rect
        x="290"
        :y="choice === 0 ? 100 : 180"
        width="220"
        height="80"
        :class="choice === 0 ? 'positive' : 'negative'"
      />
      <path :d="choice === 0 ? 'M70 100H510' : 'M70 100H290V260H510'" class="curve" />
      <text x="70" y="310" text-anchor="middle">0</text>
      <text x="290" y="310" text-anchor="middle">4</text>
      <text x="510" y="310" text-anchor="middle">8</text>
      <text x="180" y="142" text-anchor="middle">+8 m</text>
      <text x="400" :y="choice === 0 ? 142 : 230" text-anchor="middle">
        {{ choice === 0 ? '+8 m' : '−8 m' }}
      </text>
    </svg>

    <svg v-else-if="mode === '302'" viewBox="0 0 600 360" role="img" :aria-label="forceLabel">
      <title>{{ forceLabel }}</title>
      <rect x="70" y="35" width="460" height="280" rx="14" class="water" />
      <circle cx="280" cy="170" r="36" class="object" />
      <path d="M280 205V305M270 293L280 305L290 293" class="red-arrow" />
      <path d="M260 132V92M250 104L260 92L270 104" class="green-arrow" />
      <path
        v-if="choice > 0"
        :d="
          choice === 1 ? 'M300 132V102M290 114L300 102L310 114' : 'M300 132V72M290 84L300 72L310 84'
        "
        class="blue-arrow"
      />
      <text x="320" y="282">重力 10 N</text>
      <text x="92" y="76">浮力 4 N</text>
      <text x="335" y="115">阻力 {{ choice * 3 }} N</text>
      <text x="300" y="345" text-anchor="middle">合力向下 {{ 6 - choice * 3 }} N</text>
    </svg>

    <svg v-else-if="mode === '303'" viewBox="0 0 600 370" role="img" :aria-label="springLabel">
      <title>{{ springLabel }}</title>
      <path d="M75 30V280H545" class="axis" />
      <text x="24" y="27">F / N</text>
      <text x="440" y="340">x / cm</text>
      <polygon :points="'75,280 ' + springX + ',280 ' + springX + ',' + springY" class="positive" />
      <path d="M75 280L495 70" class="curve" />
      <path :d="'M75 ' + springY + 'H' + springX + 'V280'" class="dashed" />
      <circle :cx="springX" :cy="springY" r="7" class="dot" />
      <text x="55" :y="springY + 8" text-anchor="end">{{ extension * 2 }}</text>
      <text :x="springX" y="312" text-anchor="middle">{{ extension }}</text>
      <text x="330" y="250" text-anchor="middle">面积单位：N·cm</text>
      <text x="300" y="365" text-anchor="middle">同一弹簧 k = 200 N/m</text>
    </svg>

    <svg v-else-if="mode === '304'" viewBox="0 0 600 330" role="img" :aria-label="newtonLabel">
      <title>{{ newtonLabel }}</title>
      <path d="M40 230H555" class="axis" />
      <rect x="100" y="100" width="170" height="105" rx="14" class="object" />
      <circle cx="135" cy="215" r="16" class="wheel" />
      <circle cx="235" cy="215" r="16" class="wheel" />
      <text x="185" y="160" text-anchor="middle">{{ inertialMass }} kg</text>
      <path d="M280 148H475M460 138L475 148L460 158" class="blue-arrow" />
      <text x="365" y="120" text-anchor="middle">合力 12 N →</text>
      <text x="300" y="285" text-anchor="middle">a = {{ 12 / inertialMass }} m/s²</text>
      <text x="300" y="322" text-anchor="middle">只改变质量，不改变合力</text>
    </svg>

    <svg v-else-if="mode === '305'" viewBox="0 0 600 360" role="img" :aria-label="fallLabel">
      <title>{{ fallLabel }}</title>
      <circle cx="270" cy="165" r="35" class="object" />
      <path d="M270 205V310M260 298L270 310L280 298" class="red-arrow" />
      <path
        v-if="drag > 0"
        :d="
          'M270 125V' +
          (125 - drag / 5) +
          'M260 ' +
          (137 - drag / 5) +
          'L270 ' +
          (125 - drag / 5) +
          'L280 ' +
          (137 - drag / 5)
        "
        class="green-arrow"
      />
      <text x="320" y="95">阻力 {{ drag }} N</text>
      <text x="320" y="280">重量 500 N</text>
      <text x="35" y="170">50 kg</text>
      <text x="35" y="205">向下运动</text>
      <text x="300" y="350" text-anchor="middle">向下加速度 {{ (500 - drag) / 50 }} m/s²</text>
    </svg>

    <svg v-else-if="mode === '306'" viewBox="0 0 600 350" role="img" :aria-label="collisionLabel">
      <title>{{ collisionLabel }}</title>
      <text x="40" y="35">取向右为正 →</text>
      <path d="M40 240H560" class="axis" />
      <g v-if="choice === 0">
        <rect x="75" y="155" width="140" height="70" rx="10" class="object" />
        <text x="145" y="198" text-anchor="middle">2 kg</text>
        <rect x="365" y="155" width="110" height="70" rx="10" class="second-object" />
        <text x="420" y="198" text-anchor="middle">1 kg</text>
        <path d="M95 110H235M222 100L235 110L222 120" class="blue-arrow" />
        <text x="150" y="83" text-anchor="middle">+3 m/s</text>
        <path d="M475 110H375M388 100L375 110L388 120" class="red-arrow" />
        <text x="425" y="83" text-anchor="middle">−1 m/s</text>
      </g>
      <g v-else>
        <rect x="190" y="155" width="220" height="70" rx="10" class="object" />
        <text x="300" y="198" text-anchor="middle">黏合后 3 kg</text>
        <path d="M220 110H380M367 100L380 110L367 120" class="blue-arrow" />
        <text x="300" y="83" text-anchor="middle">+5/3 m/s</text>
      </g>
      <text x="300" y="285" text-anchor="middle">总动量：+5 kg·m/s</text>
      <text x="300" y="330" text-anchor="middle">
        动能：{{ choice === 0 ? '9.5' : '25/6 ≈ 4.17' }} J
      </text>
    </svg>

    <svg v-else viewBox="0 0 600 340" role="img" :aria-label="energyLabel">
      <title>{{ energyLabel }}</title>
      <text x="40" y="45">总输入 200 J</text>
      <rect x="40" y="70" width="520" height="65" class="neutral" />
      <rect x="40" y="70" :width="520 * efficiency" height="65" class="positive" />
      <text x="40" y="177">有用：{{ 200 * efficiency }} J</text>
      <text x="40" y="218">损耗：{{ 200 * (1 - efficiency) }} J</text>
      <text x="40" y="259">效率：{{ efficiency * 100 }}%</text>
      <text x="40" y="305">提升2 kg：h = {{ 10 * efficiency }} m</text>
    </svg>

    <p class="result" aria-live="polite"><LatexText :text="explanation" /></p>
    <p class="note">概念示意，数值用于观察物理关系；例题和自测使用题库原题。</p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '../AppButton.vue'
import LatexText from '../LatexText.vue'
const props = defineProps<{ topic?: string }>()
const choice = ref(0)
// 使用叶子节点编号选择图解，切换节点时清除上一节操作。
const mode = computed(() => props.topic?.slice(-3) || '301')
watch(
  () => props.topic,
  () => {
    choice.value = 0
  },
)
const scenes: Record<string, { title: string; intro: string; choices: string[] }> = {
  '301': {
    title: '同样走16米，位移一定相同吗？',
    intro: '每段4秒，忽略转向所需时间；面积给有方向的位移，返回段需单独处理。',
    choices: ['一直向右', '后4秒返回'],
  },
  '302': {
    title: '液体中下落：先把三股力画全',
    intro: '完全浸没的同一物体，重量和浮力不变；向下运动时阻力向上。',
    choices: ['阻力为零', '阻力3 N', '终端速度'],
  },
  '303': {
    title: '伸长翻倍，图下面积怎样变？',
    intro: '选择不同伸长，观察同一直线上的力与三角形储能。',
    choices: ['伸长2 cm', '伸长4 cm', '伸长6 cm'],
  },
  '304': {
    title: '同样的合力，谁更难加速？',
    intro: '小车只改变质量；图中箭头表示已扣除阻力后的合力。',
    choices: ['质量2 kg', '质量4 kg', '质量6 kg'],
  },
  '305': {
    title: '从加速下落到终端速度',
    intro: '取g = 10 N/kg，忽略浮力；增加空气阻力，观察向下加速度。',
    choices: ['刚释放', '阻力增大', '终端下落'],
  },
  '306': {
    title: '黏合碰撞：守恒的是哪一个量？',
    intro: '水平外力冲量忽略，切换碰撞前后，比较动量与动能。',
    choices: ['碰撞前', '黏合后'],
  },
  '307': {
    title: '输入相同，提升高度由效率决定',
    intro: '缓慢提升2 kg负载，g = 10 N/kg；有用能量全部变为重力势能。',
    choices: ['效率25%', '效率50%', '效率75%'],
  },
}
// 保持未知节点的安全显示，正常路由均传入当前章节叶子编号。
const scene = computed(() => scenes[mode.value] || scenes['301']!)
// 线性弹簧选点由真实F=kx生成，面积和读数共享同一个伸长值。
const extension = computed(() => 2 * (choice.value + 1))
const springX = computed(() => 75 + extension.value * 70)
const springY = computed(() => 280 - extension.value * 35)
// 质量、阻力与效率由离散按钮改变，避免图示与公式使用不同数据。
const inertialMass = computed(() => 2 * (choice.value + 1))
const drag = computed(() => [0, 300, 500][choice.value] || 0)
const efficiency = computed(() => (choice.value + 1) / 4)
// 无障碍描述同步给出图中的物理读数。
const motionLabel = computed(() =>
  choice.value === 0
    ? '速度始终正2，8秒路程与位移都是16米'
    : '前4秒速度正2，后4秒负2；总路程16米，位移零',
)
const forceLabel = computed(() => '重力10牛向下，浮力4牛向上，阻力' + choice.value * 3 + '牛向上')
const springLabel = computed(
  () =>
    '伸长' +
    extension.value +
    '厘米，力' +
    extension.value * 2 +
    '牛，储能' +
    extension.value ** 2 / 100 +
    '焦',
)
const newtonLabel = computed(
  () =>
    '质量' +
    inertialMass.value +
    '千克，合力12牛，加速度' +
    12 / inertialMass.value +
    '米每二次方秒',
)
const fallLabel = computed(
  () => '质量50千克，重量500牛，阻力' + drag.value + '牛，向下加速度' + (500 - drag.value) / 50,
)
const collisionLabel = computed(() =>
  choice.value === 0
    ? '2千克以正3米每秒，1千克以负1米每秒接近，总动量正5'
    : '黏合质量3千克，速度正5/3米每秒，总动量仍正5',
)
const energyLabel = computed(
  () =>
    '输入200焦，有用' + 200 * efficiency.value + '焦，损耗' + 200 * (1 - efficiency.value) + '焦',
)
// 说明直接由图示参数计算，让每个按钮都能检验一个物理结论。
const explanation = computed(() => {
  if (mode.value === '301')
    return choice.value === 0
      ? '位移 $8+8=16$ m，路程16 m；平均速率与平均速度均为2 m/s。'
      : '位移 $8-8=0$，路程 $8+8=16$ m；平均速度为零，平均速率仍是2 m/s。'
  if (mode.value === '302')
    return choice.value === 2
      ? '重力 = 浮力 + 阻力，合力为零；物体仍可向下匀速运动。'
      : '$F_{\\rm net}=10-4-' + choice.value * 3 + '=' + (6 - choice.value * 3) + '$ N，方向向下。'
  if (mode.value === '303')
    return (
      '$F=kx=' +
      extension.value * 2 +
      '$ N；$E=\\frac12kx^2=' +
      (extension.value ** 2 / 100).toFixed(2) +
      '$ J。图上面积用N·cm表示，乘0.01才是J。伸长翻倍，力翻倍而储能变四倍。'
    )
  if (mode.value === '304')
    return (
      '$a=F/m=12/' +
      inertialMass.value +
      '=' +
      12 / inertialMass.value +
      '$ m/s²。质量越大，相同合力造成的加速度越小。'
    )
  if (mode.value === '305')
    return drag.value === 500
      ? '重力与阻力平衡，加速度为零；这不是停止，而是保持终端速度下落。'
      : '$a=(mg-D)/m=(500-' +
          drag.value +
          ')/50=' +
          (500 - drag.value) / 50 +
          '$ m/s²。向下合力减小，加速度随之减小。'
  if (mode.value === '306')
    return choice.value === 0
      ? '$p=2\\times3+1\\times(-1)=5$ kg·m/s；两物体动能相加为9.5 J。'
      : '$v=5/3$ m/s；动能变为 $25/6$ J，减少 $16/3$ J。动量守恒，机械能转为内能等。'
  return (
    '$h=E_{\\rm useful}/(mg)=' +
    200 * efficiency.value +
    '/20=' +
    10 * efficiency.value +
    '$ m；有用能量与损耗之和始终200 J。'
  )
})
</script>
<style scoped>
.mechanics-atlas {
  margin: 0;
  padding: 22px;
  background: linear-gradient(135deg, #f0f8ff, #fff);
  border: 1px solid #c9dff0;
  border-radius: 16px;
  color: #183c61;
  min-width: 0;
}
figcaption > span {
  font-size: 12px;
  letter-spacing: 1.6px;
  font-weight: 700;
  color: #336a99;
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
  --app-button-color: #285c8c;
  --app-button-border: #b5d1e9;
}
.controls :deep(.app-button--primary) {
  --app-button-bg: #225ec0;
  --app-button-color: #fff;
  --app-button-border: #225ec0;
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
  fill: #183c61;
}
.axis {
  fill: none;
  stroke: #6b859b;
  stroke-width: 2;
}
.curve,
.blue-arrow {
  fill: none;
  stroke: #2464ca;
  stroke-width: 4;
}
.red-arrow {
  fill: none;
  stroke: #bb5948;
  stroke-width: 4;
}
.green-arrow {
  fill: none;
  stroke: #188875;
  stroke-width: 4;
}
.positive {
  fill: #c5e7ec;
}
.negative {
  fill: #f6d4c9;
}
.neutral {
  fill: #e9cfc7;
}
.object {
  fill: #c6dcfa;
  stroke: #3572ad;
  stroke-width: 2;
}
.second-object {
  fill: #f4d5c0;
  stroke: #b0774f;
  stroke-width: 2;
}
.wheel {
  fill: #5e788d;
}
.water {
  fill: #e2f3fa;
}
.dot {
  fill: #225ec0;
}
.dashed {
  fill: none;
  stroke: #8fa7bc;
  stroke-dasharray: 5 5;
  stroke-width: 2;
}
.result {
  padding: 12px 14px;
  background: #fff;
  border-left: 3px solid #3479c3;
  border-radius: 5px;
}
.note {
  font-size: 12px;
  color: #65809a;
}
@media (max-width: 600px) {
  .mechanics-atlas {
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
