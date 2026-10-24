<!-- ESAT放射性互动图解：核内外计数、衰变双账本、辐射屏蔽及母子体衰变曲线。 -->
<template>
  <figure class="nuclear-atlas">
    <figcaption>
      <span>PHYSICS · RADIOACTIVITY</span>
      <h5>{{ heading }}</h5>
      <p>{{ introduction }}</p>
    </figcaption>
    <template v-if="mode === 'atom'">
      <div class="controls" role="group" aria-label="切换碳同位素">
        <AppButton
          v-for="n in [6, 7, 8]"
          :key="n"
          size="small"
          :type="neutrons === n ? 'primary' : 'secondary'"
          :aria-pressed="neutrons === n"
          @click="neutrons = n"
          >碳-{{ 6 + n }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="切换离子电荷">
        <AppButton
          v-for="q in [-1, 0, 1]"
          :key="q"
          size="small"
          :type="charge === q ? 'primary' : 'secondary'"
          :aria-pressed="charge === q"
          @click="charge = q"
          >{{ q === 0 ? '中性' : q === 1 ? '失去1电子' : '获得1电子' }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 600 340"
        role="img"
        :aria-label="`碳${6 + neutrons}含6质子${neutrons}中子${6 - charge}电子`"
      >
        <title>核子图为计数示意，不按原子与核的真实尺度绘制</title>
        <ellipse cx="220" cy="170" rx="175" ry="125" class="orbit" />
        <circle
          v-for="(p, i) in nucleons"
          :key="i"
          :cx="p.x"
          :cy="p.y"
          r="17"
          :class="p.proton ? 'proton' : 'neutron'"
        />
        <text
          v-for="(p, i) in nucleons"
          :key="`label${i}`"
          :x="p.x"
          :y="p.y + 7"
          text-anchor="middle"
          class="particle-label"
        >
          {{ p.proton ? 'p' : 'n' }}
        </text>
        <g v-for="(electron, i) in electrons" :key="`e${i}`">
          <circle :cx="electron.x" :cy="electron.y" r="13" class="electron" />
          <text :x="electron.x" :y="electron.y + 7" text-anchor="middle" class="electron-label">
            −
          </text>
        </g>
        <text x="415" y="115">p = 6</text>
        <text x="415" y="165">n = {{ neutrons }}</text>
        <text x="415" y="215">电子 = {{ 6 - charge }}</text>
        <text x="45" y="325">改变中子 → 同位素；改变电子 → 离子</text>
      </svg>
      <p class="result"><LatexText :text="atomLabel" /></p>
      <p>核子和轨道只用于数数；真实原子核相对原子小得多，电子也不是沿这些经典小圆轨道运动。</p>
    </template>

    <template v-else-if="mode === 'decay'">
      <div class="controls" role="group" aria-label="执行一种核变化">
        <AppButton
          size="small"
          type="secondary"
          :disabled="events.length >= 6"
          @click="emitDecay('alpha')"
          >发出 α</AppButton
        >
        <AppButton
          size="small"
          type="secondary"
          :disabled="events.length >= 6"
          @click="emitDecay('beta')"
          >发出 β−</AppButton
        >
        <AppButton
          size="small"
          type="secondary"
          :disabled="events.length >= 6"
          @click="emitDecay('gamma')"
          >发出 γ</AppButton
        >
        <AppButton size="small" type="secondary" @click="events = []">重置</AppButton>
      </div>
      <div class="decay-model">
        <div><span>起始</span><LatexText :text="String.raw`$^{238}_{92}\mathrm X$`" /></div>
        <b aria-hidden="true">→</b>
        <div><span>当前</span><LatexText :text="daughterLabel" /></div>
      </div>
      <div class="ledger">
        <p><strong>质量数 A</strong><br />238 − 4 × {{ alphaCount }} = {{ massNumber }}</p>
        <p>
          <strong>质子数 Z</strong><br />92 − 2 × {{ alphaCount }} + {{ betaCount }} =
          {{ protonNumber }}
        </p>
      </div>
      <p class="result">{{ decayReason }}</p>
      <ol v-if="events.length" class="events">
        <li v-for="(event, i) in events" :key="i">
          {{
            { alpha: 'α：A减4，Z减2', beta: 'β−：A不变，Z加1', gamma: 'γ：A、Z不变，核能量降低' }[
              event
            ]
          }}
        </li>
      </ol>
      <p>
        这是A、Z守恒的形式记账模型，X/Y为占位符，不断言按钮序列一定是某种真实核素的允许衰变链。γ需有可释放能量的激发态。
      </p>
    </template>

    <template v-else-if="mode === 'radiation'">
      <div class="controls" role="group" aria-label="选择辐射种类">
        <AppButton
          v-for="(r, i) in radiationTypes"
          :key="r.name"
          size="small"
          :type="radiation === i ? 'primary' : 'secondary'"
          :aria-pressed="radiation === i"
          @click="radiation = i"
          >{{ r.name }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="选择屏蔽材料">
        <AppButton
          v-for="(s, i) in ['无屏蔽', '纸', '薄铝', '厚铅']"
          :key="s"
          size="small"
          :type="shield === i ? 'primary' : 'secondary'"
          :aria-pressed="shield === i"
          @click="shield = i"
          >{{ s }}</AppButton
        >
      </div>
      <svg viewBox="0 0 600 240" role="img" :aria-label="shieldCaption">
        <title>{{ shieldCaption }}</title>
        <circle cx="70" cy="120" r="25" class="source" />
        <text x="40" y="175">源</text>
        <rect
          v-if="shield"
          x="290"
          y="40"
          :width="shield === 3 ? 60 : shield === 2 ? 20 : 6"
          height="150"
          :fill="['', '#e9cc8b', '#abbcc9', '#657c8c'][shield]"
        />
        <path d="M100 120H290" class="beam" />
        <path
          v-if="!blocked"
          :d="`M${shield === 3 ? 350 : shield === 2 ? 310 : 296} 120H550`"
          class="beam"
          :class="{ attenuated: radiation === 2 && shield === 3 }"
        />
        <path v-else d="M280 110L300 130M280 130L300 110" class="stop" />
        <text x="310" y="220">
          {{
            blocked ? '被阻挡' : radiation === 2 && shield === 3 ? '显著衰减，非绝对零' : '仍能透过'
          }}
        </text>
      </svg>
      <p class="result">{{ shieldCaption }}</p>
      <div class="controls">
        <AppButton
          size="small"
          type="secondary"
          :aria-pressed="showField"
          @click="showField = !showField"
          >{{ showField ? '收起' : '查看' }}电场偏转</AppButton
        >
      </div>
      <svg v-if="showField" viewBox="0 0 600 250" role="img" :aria-label="fieldCaption">
        <title>{{ fieldCaption }}</title>
        <path d="M140 35H560M140 215H560" class="plate" />
        <text x="145" y="26">+ + + + + + +</text>
        <text x="145" y="245">− − − − − − −</text>
        <path :d="fieldPath" class="beam" />
        <text x="25" y="115">{{ radiationTypes[radiation]!.name }}</text>
      </svg>
      <p v-if="showField">
        {{ fieldCaption }} 轨迹只表示方向，不按同能量或同速度下的精确曲率比例绘制。
      </p>
      <p>
        {{ radiationTypes[radiation]!.ionisation }}
        屏蔽示意采用常见能量范围；实际射程随粒子能量及材料厚度改变。
      </p>
    </template>

    <template v-else>
      <div class="controls" role="group" aria-label="选择衰变曲线">
        <AppButton
          v-for="(label, i) in ['总计数与本底', '稳定子体', '放射性子体']"
          :key="label"
          size="small"
          :type="curve === i ? 'primary' : 'secondary'"
          :aria-pressed="curve === i"
          @click="curve = i"
          >{{ label }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="经过几个母体半衰期">
        <AppButton
          v-for="n in [0, 1, 2, 3, 4, 5]"
          :key="n"
          size="small"
          :type="halves === n ? 'primary' : 'secondary'"
          :aria-pressed="halves === n"
          @click="halves = n"
          >{{ n }} T</AppButton
        >
      </div>
      <svg viewBox="0 0 600 360" role="img" :aria-label="decayCaption">
        <title>{{ decayCaption }}</title>
        <path d="M65 30V290H560" class="axis" />
        <g v-for="n in [0, 80, 160, 240]" :key="n">
          <path :d="`M65 ${290 - n}H545`" class="grid" />
          <text x="55" :y="297 - n" text-anchor="end">{{ n }}</text>
        </g>
        <path :d="parentPath" class="parent-curve" />
        <path :d="productPath" class="product-curve" />
        <path v-if="curve === 0" d="M65 270H545" class="background" />
        <path :d="`M${65 + halves * 80} 40V290`" class="guide" />
        <circle :cx="65 + halves * 80" :cy="290 - parent" r="6" class="parent-dot" />
        <circle :cx="65 + halves * 80" :cy="290 - product" r="6" class="product-dot" />
        <text
          v-for="n in [0, 1, 2, 3, 4, 5, 6]"
          :key="`tick${n}`"
          :x="65 + n * 80"
          y="320"
          text-anchor="middle"
        >
          {{ n }}
        </text>
        <text x="65" y="25">{{ curve === 0 ? '计数率 / cpm' : '核数（相对单位）' }}</text>
        <text x="330" y="350">时间 / 母体半衰期T</text>
      </svg>
      <p class="legend">
        <span class="blue">蓝：{{ curve === 0 ? '源净计数' : '母体X' }}</span
        ><span class="orange"
          >橙：{{ curve === 0 ? '总读数' : curve === 1 ? '稳定子体Y' : '放射性子体Y' }}</span
        >
      </p>
      <p class="result">{{ decayCaption }}</p>
      <p v-if="curve === 0">
        本底恒定20 cpm，初始源计数160 cpm。仪器读数从180趋近20；减半的是净计数，不是总读数。
      </p>
      <p v-else-if="curve === 1">
        初始母体160、稳定子体80，且每个母核生成一个子核；总核数240守恒。子体不是从零开始。
      </p>
      <p v-else>
        初始只有160单位X；X生成Y，Y半衰期为2T且继续衰变成其他核。Y先积累再减少，不能用160−X作为Y。
      </p>
      <p>曲线表示大量核的统计期望，不代表每次实测完全没有随机波动。</p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic: string }>()
// 根据考纲叶子选择核模型，避免原子结构与半衰期混用同一幅示意。
const mode = computed(
  () =>
    ({ '130701': 'atom', '130702': 'decay', '130703': 'radiation', '130704': 'halfLife' })[
      props.topic
    ] ?? 'atom',
)
// 标题强调当前应掌握的计数或观察规则。
const heading = computed(
  () =>
    ({
      atom: '核内数A、Z，核外数电荷',
      decay: 'A和Z分别记账',
      radiation: '电离强，不等于穿透强',
      halfLife: '真正减半的是哪一个量？',
    })[mode.value],
)
// 以可操作变量提示学生探索当前图解。
const introduction = computed(
  () =>
    ({
      atom: '换中子得到同位素，换电子得到离子。',
      decay: '逐次发出粒子，同时核对两个账本。',
      radiation: '切换辐射和屏蔽，再看电场中的偏转方向。',
      halfLife: '切换计数或子体模型，沿半衰期逐步观察。',
    })[mode.value],
)
const neutrons = ref(6)
const charge = ref(0)
const events = ref<Array<'alpha' | 'beta' | 'gamma'>>([])
const radiation = ref(0)
const shield = ref(0)
const showField = ref(false)
const curve = ref(0)
const halves = ref(0)
// 核子只作计数排布，六个质子固定，中子由同位素按钮决定。
const nucleons = computed(() =>
  Array.from({ length: 6 + neutrons.value }, (_, i) => ({
    proton: i < 6,
    x: 160 + (i % 4) * 38,
    y: 115 + Math.floor(i / 4) * 38,
  })),
)
// 电子数由净电荷确定，环形布局仅是计数图例。
const electrons = computed(() =>
  Array.from({ length: 6 - charge.value }, (_, i) => ({
    x: 220 + 175 * Math.cos((i * 2 * Math.PI) / (6 - charge.value)),
    y: 170 + 125 * Math.sin((i * 2 * Math.PI) / (6 - charge.value)),
  })),
)
// 核素上标和下标随中子变化，离子电荷只追加到元素符号右侧。
const atomLabel = computed(
  () =>
    `$^{${6 + neutrons.value}}_{6}\\mathrm C${charge.value === 0 ? '' : charge.value > 0 ? '^{+}' : '^{-}'}$：p固定为6，n为${neutrons.value}，净电荷为${charge.value > 0 ? '+' : ''}${charge.value}。`,
)
// 限制单次演示长度，让学生能逐条审查衰变链。
function emitDecay(event: 'alpha' | 'beta' | 'gamma') {
  if (events.value.length < 6) events.value.push(event)
}
// α次数唯一决定本模型的质量数减少量。
const alphaCount = computed(() => events.value.filter((e) => e === 'alpha').length)
// β−次数决定α之后质子数的回增量。
const betaCount = computed(() => events.value.filter((e) => e === 'beta').length)
// 按每次α减少四个核子求当前A。
const massNumber = computed(() => 238 - 4 * alphaCount.value)
// 按α和β−对电荷数的不同作用求当前Z。
const protonNumber = computed(() => 92 - 2 * alphaCount.value + betaCount.value)
// 当前核素符号由两个账本共同生成，不使用实际元素名称暗示允许链。
const daughterLabel = computed(() => `$^{${massNumber.value}}_{${protonNumber.value}}\\mathrm Y$`)
// 将最后操作解释为核内变化，而非仅重复按钮名称。
const decayReason = computed(() => {
  const last = events.value.at(-1)
  return last
    ? {
        alpha: 'α带走2质子和2中子，A减4、Z减2。',
        beta: '一个中子变为质子并发出β−，A不变、Z加1。',
        gamma: '核退激发放出电磁辐射，A和Z都不改变。',
      }[last]
    : '点一种核变化，检查质量数与质子数是否分别守恒。'
})
const radiationTypes = [
  { name: 'α', ionisation: '常见课程比较中：α电离强、穿透弱。' },
  { name: 'β−', ionisation: '常见课程比较中：β电离与穿透处于α和γ之间。' },
  { name: 'γ', ionisation: '常见课程比较中：γ穿透强，单位短路径电离较弱。' },
]
// 纸挡α、薄铝挡普通β；γ只显示显著衰减而不画成完全终止。
const blocked = computed(
  () => shield.value > 0 && (radiation.value === 0 || (radiation.value === 1 && shield.value >= 2)),
)
// 文字结论补充能量范围条件，避免屏蔽示意被误读为绝对规律。
const shieldCaption = computed(
  () =>
    `${radiationTypes[radiation.value]!.name} + ${['无屏蔽', '纸', '薄铝', '厚铅'][shield.value]}：${blocked.value ? '在本示意的常见能量范围内被阻挡' : radiation.value === 2 && shield.value === 3 ? '显著衰减，仍可能有透射' : '仍有辐射向前传播'}。`,
)
// 上正下负的电场向下，α向下、β−向上，γ保持直线。
const fieldPath = computed(
  () =>
    ['M80 125H170Q270 125 450 195', 'M80 125H170Q245 125 320 55', 'M80 125H540'][radiation.value],
)
// 将图中极板符号映射到电荷受力方向。
const fieldCaption = computed(
  () =>
    ['α带正电，向下方负极板偏转。', 'β−带负电，向上方正极板偏转。', 'γ不带电，不被电场偏转。'][
      radiation.value
    ],
)
// 母体在各模型中都以T为半衰期，初始相对量固定160。
function parentAt(t: number) {
  return 160 * 2 ** -t
}
// 稳定子体保留初值80；放射性子体用T与2T的连续衰变期望式。
function productAt(t: number) {
  return curve.value === 0
    ? 20 + parentAt(t)
    : curve.value === 1
      ? 240 - parentAt(t)
      : 320 * (2 ** (-t / 2) - 2 ** -t)
}
// 当前选中时刻的母核量或源净计数。
const parent = computed(() => parentAt(halves.value))
// 当前第二条曲线值，随模型切换更新。
const product = computed(() => productAt(halves.value))
// 同一坐标将0至6个半衰期映射到固定图宽，数量单位纵轴不截断。
const parentPath = computed(() =>
  Array.from(
    { length: 121 },
    (_, i) => `${i ? 'L' : 'M'}${65 + i * 4},${290 - parentAt(i / 20)}`,
  ).join(' '),
)
// 子体或总计数曲线与母体使用同一坐标和相同时刻。
const productPath = computed(() =>
  Array.from(
    { length: 121 },
    (_, i) => `${i ? 'L' : 'M'}${65 + i * 4},${290 - productAt(i / 20)}`,
  ).join(' '),
)
// 取一位小数只用于展示统计期望，避免把核个数误认为必须为小数的单次测量。
const decayCaption = computed(
  () =>
    `${halves.value}T：${curve.value === 0 ? '源净计数' : '母体X'} = ${parent.value.toFixed(1)}；${curve.value === 0 ? '总读数' : curve.value === 1 ? '稳定子体Y' : '放射性子体Y'} = ${product.value.toFixed(1)}${curve.value === 0 ? ' cpm' : '（相对单位）'}。`,
)
</script>

<style scoped lang="scss">
.nuclear-atlas {
  margin: 0;
  padding: 20px;
  border: 1px solid #d6dced;
  border-radius: 14px;
  background: linear-gradient(145deg, #f5f4fc, #fff);
  color: #283553;
  min-width: 0;
  overflow: hidden;
}
figcaption > span {
  font-size: 12px;
  letter-spacing: 0.1em;
  color: #6667ad;
  font-weight: 700;
}
h5 {
  font-size: 20px;
  font-weight: 700;
  margin: 12px 0;
}
p {
  line-height: 1.75;
  margin: 12px 0;
  overflow-wrap: anywhere;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}
.controls :deep(.app-button.el-button) {
  --app-button-bg: #fff;
  --app-button-color: #2167a6;
  --app-button-border: #c0d8ec;
  --app-button-hover-bg: #eaf4fc;
  --app-button-hover-border: #2167a6;
  --app-button-active-bg: #eaf4fc;
  --app-button-active-border: #2167a6;
}
.controls :deep(.app-button.el-button.app-button--primary) {
  --app-button-bg: #2167a6;
  --app-button-color: #fff;
  --app-button-border: #2167a6;
  --app-button-hover-bg: #1b5a96;
  --app-button-hover-border: #1b5a96;
  --app-button-active-bg: #1b5a96;
  --app-button-active-border: #1b5a96;
}
svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 400px;
  background: #fff;
  border-radius: 10px;
  margin: 16px 0;
}
svg text {
  font-size: 24px;
  fill: #293d57;
  font-family: inherit;
}
.orbit,
.guide,
.grid {
  fill: none;
  stroke: #acb6c9;
  stroke-width: 2;
}
.guide {
  stroke-dasharray: 6 6;
}
.grid {
  stroke: #e5e9f2;
  stroke-width: 1;
}
.proton {
  fill: #dd7762;
}
.neutron {
  fill: #7189ad;
}
.electron {
  fill: #376cc6;
}
svg .particle-label,
svg .electron-label {
  fill: #fff;
  font-size: 23px;
}
.result {
  padding: 12px 14px;
  border-left: 3px solid #696ab1;
  background: #efeffb;
  font-weight: 600;
}
.decay-model {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 12px;
  padding: 20px 10px;
  background: #fff;
  border-radius: 10px;
  font-size: 28px;
}
.decay-model span {
  display: block;
  font-size: 14px;
  color: #778199;
  margin-bottom: 10px;
}
.ledger {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.ledger p {
  padding: 12px;
  background: #fff;
  border-radius: 10px;
}
.events {
  line-height: 1.8;
  padding-left: 24px;
}
.source {
  fill: #aa80b0;
}
.beam,
.plate,
.axis {
  fill: none;
  stroke: #486eab;
  stroke-width: 3;
}
.plate {
  stroke: #687993;
  stroke-width: 5;
}
.stop {
  fill: none;
  stroke: #c44b43;
  stroke-width: 4;
}
.beam.attenuated {
  stroke-dasharray: 4 10;
  opacity: 0.4;
}
.parent-curve {
  fill: none;
  stroke: #356ec1;
  stroke-width: 3;
}
.product-curve {
  fill: none;
  stroke: #d48b27;
  stroke-width: 3;
}
.background {
  fill: none;
  stroke: #9a82b7;
  stroke-dasharray: 8 5;
  stroke-width: 2;
}
.parent-dot {
  fill: #356ec1;
}
.product-dot {
  fill: #d48b27;
}
.legend {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}
.blue {
  color: #356ec1;
}
.orange {
  color: #a76818;
}
@media (max-width: 600px) {
  .nuclear-atlas {
    padding: 12px;
  }
  h5 {
    font-size: 18px;
  }
  .ledger {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .controls {
    gap: 6px;
  }
}
</style>
