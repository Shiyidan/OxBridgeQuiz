<!-- ESAT波章节互动图解：同一绘图区按知识点演示振动、界面、光路、回波和波谱。 -->
<template>
  <figure class="waves-atlas">
    <figcaption>
      <span>PHYSICS · WAVES</span>
      <h5>{{ heading }}</h5>
      <p>{{ introduction }}</p>
    </figcaption>
    <template v-if="mode === 'properties'">
      <div class="controls" role="group" aria-label="波形横轴">
        <AppButton
          v-for="(label, i) in ['位置图', '时间图', '纵波粒子']"
          :key="label"
          size="small"
          :type="view === i ? 'primary' : 'secondary'"
          :aria-pressed="view === i"
          @click="view = i"
          >{{ label }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="振动相位">
        <AppButton
          v-for="(label, i) in ['0', 'T/4', 'T/2', '3T/4', 'T']"
          :key="label"
          size="small"
          :type="phase === i ? 'primary' : 'secondary'"
          :aria-pressed="phase === i"
          @click="phase = i"
          >{{ label }}</AppButton
        >
      </div>
      <svg v-if="view < 2" viewBox="0 0 600 300" role="img" :aria-label="waveCaption">
        <title>{{ waveCaption }}</title>
        <path d="M60 35V235M60 145H560" class="axis" />
        <path :d="wavePath" class="wave" />
        <path d="M60 85H560M60 205H560" class="guide" />
        <text x="12" y="91">+3</text>
        <text x="24" y="152">0</text>
        <text x="12" y="211">−3</text>
        <text x="65" y="26">位移 / cm</text>
        <text x="70" y="273">{{ view === 0 ? '0' : '0' }}</text>
        <text x="300" y="273" text-anchor="middle">
          {{ view === 0 ? '4 cm = λ' : '0.20 s = T' }}
        </text>
        <text x="540" y="273" text-anchor="end">{{ view === 0 ? '位置' : '时间' }}</text>
        <circle :cx="view === 0 ? 180 : 60 + phase * 60" :cy="markerY" r="9" class="marker" />
        <path v-if="view === 0" d="M180 75V215" class="guide" />
      </svg>
      <svg
        v-else
        viewBox="0 0 600 250"
        role="img"
        aria-label="纵波粒子在平衡位置左右振动，密部与疏部向右传播"
      >
        <title>点只左右振动，密部与疏部向右移动</title>
        <line x1="35" x2="565" y1="140" y2="140" class="guide" />
        <circle
          v-for="particle in particles"
          :key="particle.i"
          :cx="particle.x"
          cy="140"
          :r="particle.i === 12 ? 8 : 5"
          :class="particle.i === 12 ? 'marker' : 'particle'"
        />
        <path d="M390 58H520L508 50M520 58L508 66" class="ray" />
        <text x="50" y="65">传播方向</text>
        <text x="50" y="205">橙点围绕原位置左右振动</text>
      </svg>
      <p class="result">{{ waveCaption }}</p>
      <p>示意参数：A = 3 cm，λ = 4 cm，f = 5 Hz，T = 0.20 s。颜色标记的是同一个介质粒子。</p>
    </template>

    <template v-else-if="mode === 'behaviour'">
      <div class="controls" role="group" aria-label="波的行为">
        <AppButton
          v-for="(label, i) in ['反射', '进入慢介质', '声源接近']"
          :key="label"
          size="small"
          :type="behaviour === i ? 'primary' : 'secondary'"
          :aria-pressed="behaviour === i"
          @click="behaviour = i"
          >{{ label }}</AppButton
        >
      </div>
      <svg v-if="behaviour < 2" viewBox="0 0 600 330" role="img" :aria-label="boundaryCaption">
        <title>{{ boundaryCaption }}</title>
        <rect x="25" y="165" width="550" height="140" fill="#e4f0fc" />
        <path d="M25 165H575M300 30V305" class="guide" />
        <path d="M160 25L300 165" class="ray" />
        <path d="M225 80L230 95L215 90" class="ray" />
        <path v-if="behaviour === 0" d="M300 165L440 25M367 110L375 90L355 98" class="out" />
        <path v-else d="M300 165L380 300M330 235L342 236L340 222" class="out" />
        <text x="315" y="50">法线</text>
        <text x="35" y="145">入射介质</text>
        <text x="35" y="280">{{ behaviour === 0 ? '反射面' : '慢介质' }}</text>
        <text x="390" y="195">{{ behaviour === 0 ? 'i = r' : '更靠近法线' }}</text>
      </svg>
      <svg
        v-else
        viewBox="0 0 600 340"
        role="img"
        aria-label="移动声源前方波前更密，后方波前更疏；观察者前方接收频率更高"
      >
        <title>声源向右移动：前方波前密，后方波前疏</title>
        <circle
          v-for="(radius, i) in [150, 112.5, 75, 37.5]"
          :key="radius"
          :cx="200 + i * 15"
          cy="175"
          :r="radius"
          class="wavefront"
        />
        <circle cx="260" cy="175" r="10" class="marker" />
        <path d="M270 175H320L310 167M320 175L310 183" class="ray" />
        <text x="35" y="325">后方：间距大</text>
        <text x="355" y="325">前方：间距小</text>
        <text x="365" y="95">同一介质中</text>
        <text x="365" y="130">波速没有增加</text>
      </svg>
      <p class="result">{{ boundaryCaption }}</p>
      <p v-if="behaviour === 2">
        图中每条圆弧来自更早的声源位置；不是同心圆整体被搬动。只作定性示意，不代替声速的数值计算。
      </p>
    </template>

    <template v-else-if="mode === 'optics'">
      <div class="controls" role="group" aria-label="光学示意">
        <AppButton
          v-for="(label, i) in ['反射角', '镜后虚像']"
          :key="label"
          size="small"
          :type="optics === i ? 'primary' : 'secondary'"
          :aria-pressed="optics === i"
          @click="optics = i"
          >{{ label }}</AppButton
        >
      </div>
      <template v-if="optics === 0">
        <div class="controls" role="group" aria-label="选择入射角">
          <AppButton
            v-for="i in [20, 40, 60]"
            :key="i"
            size="small"
            :type="incidence === i ? 'primary' : 'secondary'"
            :aria-pressed="incidence === i"
            @click="incidence = i"
            >i = {{ i }}°</AppButton
          >
        </div>
        <svg
          viewBox="0 0 600 300"
          role="img"
          :aria-label="`入射角及反射角均${incidence}度，与镜面夹角${90 - incidence}度`"
        >
          <title>两个角都从法线量起</title>
          <path d="M30 250H570" class="mirror" />
          <path d="M300 20V265" class="guide" />
          <path :d="reflectionPath" class="ray" />
          <path :d="reflectionArrow" class="out" />
          <path :d="angleArcs" class="angle-arc" />
          <text x="315" y="40">法线</text>
          <text x="100" y="285">镜面</text>
          <text :x="300 - angleLabel.x" :y="angleLabel.y" text-anchor="middle">
            {{ incidence }}°
          </text>
          <text :x="300 + angleLabel.x" :y="angleLabel.y" text-anchor="middle">
            {{ incidence }}°
          </text>
        </svg>
        <p class="result">
          入射角 = 反射角 = {{ incidence }}°；与镜面的夹角 = {{ 90 - incidence }}°。
        </p>
      </template>
      <template v-else>
        <svg
          viewBox="0 0 600 300"
          role="img"
          aria-label="物点和虚像关于竖直镜面对称，反射线反向延长相交于镜后虚像"
        >
          <title>镜后虚线是延长线，不是真实穿透的光</title>
          <path d="M300 20V275" class="mirror" />
          <path d="M150 145L300 110L100 63.333M150 145L300 180L100 226.667" class="ray" />
          <path d="M300 110L450 145L300 180" class="guide" />
          <circle cx="150" cy="145" r="8" class="marker" />
          <circle cx="450" cy="145" r="8" class="virtual" />
          <text x="105" y="185">物点</text>
          <text x="415" y="185">虚像</text>
          <path d="M150 245H450" class="guide" />
          <text x="195" y="275">d</text>
          <text x="380" y="275">d</text>
        </svg>
        <p class="result">物距 = 像距；镜后交点由反射线的反向延长得到。</p>
      </template>
    </template>

    <template v-else-if="mode === 'sound'">
      <div class="controls" role="group" aria-label="声波应用">
        <AppButton
          v-for="(label, i) in ['回声测距', '音调与响度']"
          :key="label"
          size="small"
          :type="sound === i ? 'primary' : 'secondary'"
          :aria-pressed="sound === i"
          @click="sound = i"
          >{{ label }}</AppButton
        >
      </div>
      <template v-if="sound === 0">
        <div class="controls" role="group" aria-label="选择水深">
          <AppButton
            v-for="d in [150, 300, 450]"
            :key="d"
            size="small"
            :type="depth === d ? 'primary' : 'secondary'"
            :aria-pressed="depth === d"
            @click="depth = d"
            >{{ d }} m</AppButton
          >
        </div>
        <svg
          viewBox="0 0 600 330"
          role="img"
          :aria-label="`水深${depth}米，往返${2 * depth}米，时间${((2 * depth) / 1500).toFixed(2)}秒`"
        >
          <title>声呐计时覆盖下行及上行</title>
          <rect x="40" y="65" width="520" height="230" fill="#e6f2fc" />
          <path d="M200 35H340L320 65H220Z" class="boat" />
          <path :d="`M245 75V${echoBottom}H315V75`" class="ray" />
          <path :d="`M237 125L245 137L253 125M307 137L315 125L323 137`" class="ray" />
          <path :d="`M80 ${echoBottom}H520`" class="mirror" />
          <text x="355" :y="echoBottom - 10">深 {{ depth }} m</text>
          <text x="65" y="320">v = 1500 m/s</text>
        </svg>
        <p class="result">
          t = 2d/v = {{ ((2 * depth) / 1500).toFixed(2) }} s；如果只乘vt，会得到两倍水深。
        </p>
      </template>
      <template v-else>
        <div class="controls" role="group" aria-label="改变声波属性">
          <AppButton
            size="small"
            :type="highPitch ? 'primary' : 'secondary'"
            :aria-pressed="highPitch"
            @click="highPitch = !highPitch"
            >{{ highPitch ? '高频' : '低频' }}：切换音调</AppButton
          >
          <AppButton
            size="small"
            :type="loud ? 'primary' : 'secondary'"
            :aria-pressed="loud"
            @click="loud = !loud"
            >{{ loud ? '大振幅' : '小振幅' }}：切换响度</AppButton
          >
        </div>
        <svg
          viewBox="0 0 600 230"
          role="img"
          aria-label="压力相对变化随时间的曲线，振幅与频率独立切换"
        >
          <title>纵轴是压力变化，正弦外形不表示声波是横波</title>
          <path d="M40 120H560" class="guide" />
          <path :d="soundPath" class="wave" />
          <text x="40" y="30">压力变化</text>
          <text x="500" y="220">时间</text>
        </svg>
        <p class="result">
          {{ highPitch ? '周期较短，音调较高' : '周期较长，音调较低' }}；{{
            loud ? '振幅大，通常更响' : '振幅小，通常更轻'
          }}。
        </p>
        <p>纵轴是压力变化，不是空气粒子上下运动。空气声音仍是纵波。</p>
      </template>
    </template>

    <template v-else>
      <div class="controls spectrum" role="group" aria-label="选择电磁波段">
        <AppButton
          v-for="(item, i) in spectrum"
          :key="item.name"
          size="small"
          :type="band === i ? 'primary' : 'secondary'"
          :aria-pressed="band === i"
          @click="band = i"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="spectrum-track" aria-hidden="true">
        <span v-for="(_, i) in spectrum" :key="i" :class="{ selected: band === i }">{{
          i + 1
        }}</span>
      </div>
      <p class="direction">左 → 右：频率升高 · 波长缩短</p>
      <div class="band-detail">
        <strong>{{ currentBand.name }}</strong>
        <p>{{ currentBand.use }}</p>
        <p>{{ currentBand.hazard }}</p>
      </div>
      <p class="result"><LatexText :text="currentBand.formula" /></p>
      <p>数值为各波段中的一个示例，不是波段边界；真空中全部满足c = 3.0 × 10⁸ m/s。</p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic: string }>()
// 同一章节的叶子节点选择对应物理模型，不将不同知识点塞进同一幅静态图。
const mode = computed(
  () =>
    ({
      '130601': 'properties',
      '130602': 'behaviour',
      '130603': 'optics',
      '130604': 'sound',
      '130605': 'spectrum',
    })[props.topic] ?? 'properties',
)
// 每幅图的标题直接描述要观察的物理差别。
const heading = computed(
  () =>
    ({
      properties: '同一个粒子，波向前、点往返',
      behaviour: '先分清边界还是相对运动',
      optics: '先画法线，再追踪光线',
      sound: '画出声音走过的完整路径',
      spectrum: '一种电磁波，不同频率与用途',
    })[mode.value],
)
// 图解提示先指向可操作变量，再说明观察目标。
const introduction = computed(
  () =>
    ({
      properties: '切换横轴与四分之一周期，观察橙色粒子的运动。',
      behaviour: '切换情境，查看频率、波长与方向中哪些改变。',
      optics: '改变入射角，或把反射线延长到镜后。',
      sound: '改变水深看回波延迟，独立改变音调与响度。',
      spectrum: '依次点选波段，把顺序、用途与危害连起来。',
    })[mode.value],
)
const view = ref(0)
const phase = ref(0)
const behaviour = ref(0)
const optics = ref(0)
const incidence = ref(40)
const sound = ref(0)
const depth = ref(300)
const highPitch = ref(false)
const loud = ref(false)
const band = ref(3)
// 空间图随相位向右移动，时间图保持整条轨迹并移动当前时间标记。
const wavePath = computed(() =>
  Array.from({ length: 241 }, (_, i) => {
    const x = 60 + i * 2
    const angle =
      (2 * Math.PI * (x - 60)) / 240 - (view.value === 0 ? (phase.value * Math.PI) / 2 : 0)
    return `${i ? 'L' : 'M'}${x},${145 - 60 * Math.sin(angle)}`
  }).join(' '),
)
// 空间图固定标记位置为半波长处；时间图标记正弦振动当前时刻。
const markerY = computed(
  () =>
    145 -
    60 *
      Math.sin(
        view.value === 0 ? Math.PI - (phase.value * Math.PI) / 2 : (phase.value * Math.PI) / 2,
      ),
)
// 固定平衡位置的粒子只做小幅纵向振动，压缩密集处随相位传播。
const particles = computed(() =>
  Array.from({ length: 37 }, (_, i) => ({
    i,
    x: 50 + i * 14 + 10 * Math.sin((i * Math.PI) / 6 - (phase.value * Math.PI) / 2),
  })),
)
// 用文字补足图中的横轴语义与四分之一周期标记，供小屏和读屏使用。
const waveCaption = computed(
  () =>
    `${view.value === 0 ? '同一时刻的位置图：峰到峰为λ' : view.value === 1 ? '同一位置的时间图：峰到峰为T' : '纵波：振动方向平行传播方向'}；当前t = ${['0', 'T/4', 'T/2', '3T/4', 'T'][phase.value]}。`,
)
// 固定界面与移动声源的频率规律不同，随选项显示完整条件。
const boundaryCaption = computed(
  () =>
    [
      '固定边界反射：同介质中v、f、λ不变，方向改变；振幅未必不变。',
      '静止边界进入慢介质：f不变、v减小、λ缩短，斜入射向法线偏。',
      '声源接近观察者：前方波峰更密，接收频率更高；介质中的声速未变。',
    ][behaviour.value],
)
// 入射、反射端点由同一个法线夹角生成，确保每个按钮状态满足反射定律。
const reflectionPath = computed(() => {
  const x = 190 * Math.sin((incidence.value * Math.PI) / 180),
    y = 250 - 190 * Math.cos((incidence.value * Math.PI) / 180)
  return `M${300 - x} ${y}L300 250L${300 + x} ${y}`
})
// 两条角弧均从法线出发，到入射或反射射线结束，避免误标为镜面夹角。
const angleArcs = computed(() => {
  const s = Math.sin((incidence.value * Math.PI) / 180),
    c = Math.cos((incidence.value * Math.PI) / 180)
  return `M300 180A70 70 0 0 0 ${300 - 70 * s} ${250 - 70 * c} M300 180A70 70 0 0 1 ${300 + 70 * s} ${250 - 70 * c}`
})
// 数字置于法线与射线的角平分线上，20°到60°切换时始终属于正确夹角。
const angleLabel = computed(() => ({
  x: 160 * Math.sin((incidence.value * Math.PI) / 360),
  y: 256 - 160 * Math.cos((incidence.value * Math.PI) / 360),
}))
// 箭头分别指向镜面和远离镜面，使传播方向不靠读者猜测。
const reflectionArrow = computed(() => {
  const s = Math.sin((incidence.value * Math.PI) / 180),
    c = Math.cos((incidence.value * Math.PI) / 180)
  return `M${300 - 95 * s - 8} ${250 - 95 * c - 8}L${300 - 95 * s} ${250 - 95 * c}L${300 - 95 * s + 2} ${250 - 95 * c - 12} M${300 + 95 * s - 10} ${250 - 95 * c + 7}L${300 + 95 * s} ${250 - 95 * c}L${300 + 95 * s + 1} ${250 - 95 * c + 12}`
})
// 水深只改变反射面位置，计时始终按相同水中声速计算往返。
const echoBottom = computed(() => 110 + depth.value / 3)
// 压力时间曲线用独立参数改变周期和振幅，避免把声波画成空间横波。
const soundPath = computed(() =>
  Array.from(
    { length: 261 },
    (_, i) =>
      `${i ? 'L' : 'M'}${40 + i * 2},${120 - (loud.value ? 60 : 25) * Math.sin((i / 260) * Math.PI * (highPitch.value ? 12 : 6))}`,
  ).join(' '),
)
const spectrum = [
  {
    name: '无线电',
    use: '广播和通信；波长可很长。',
    hazard: '强场可能导致组织加热，非电离不等于无限安全。',
    formula: String.raw`示例：$f=1\,\mathrm{MHz}$，$\lambda=300\,\mathrm m$。`,
  },
  {
    name: '微波',
    use: '通信、雷达和微波加热。',
    hazard: '足够强时加热含水组织；不是声波。',
    formula: String.raw`示例：$f=3\,\mathrm{GHz}$，$\lambda=0.10\,\mathrm m$。`,
  },
  {
    name: '红外',
    use: '热成像、遥控和辐射加热。',
    hazard: '高强度可造成热损伤。',
    formula: String.raw`示例：$\lambda=10\,\mu\mathrm m$，$f=3\times10^{13}\,\mathrm{Hz}$。`,
  },
  {
    name: '可见光',
    use: '视觉、照明和光学成像；红端长波、紫端短波。',
    hazard: '强光特别是激光可伤眼。',
    formula: String.raw`示例：$\lambda=500\,\mathrm{nm}$，$f=6\times10^{14}\,\mathrm{Hz}$。`,
  },
  {
    name: '紫外',
    use: '荧光检测、适当条件下用于消毒。',
    hazard: '可损伤皮肤和眼睛；高频端具有电离能力。',
    formula: String.raw`示例：$\lambda=100\,\mathrm{nm}$，$f=3\times10^{15}\,\mathrm{Hz}$。`,
  },
  {
    name: 'X射线',
    use: '穿透成像和结构检测。',
    hazard: '电离辐射，可损伤细胞。',
    formula: String.raw`示例：$\lambda=0.10\,\mathrm{nm}$，$f=3\times10^{18}\,\mathrm{Hz}$。`,
  },
  {
    name: '伽马',
    use: '核过程产生；示踪、灭菌及放射治疗。',
    hazard: '穿透强，可电离损伤组织。',
    formula: String.raw`示例：$\lambda=0.001\,\mathrm{nm}$，$f=3\times10^{20}\,\mathrm{Hz}$。`,
  },
]
// 波段名称、用途、代表数值必须随当前按钮一起切换。
const currentBand = computed(() => spectrum[band.value]!)
</script>

<style scoped lang="scss">
.waves-atlas {
  margin: 0;
  padding: 20px;
  border: 1px solid #c9e0ec;
  border-radius: 14px;
  background: linear-gradient(145deg, #f1f9fc, #fff);
  color: #16354c;
  min-width: 0;
  overflow: hidden;
}
figcaption > span {
  font-size: 12px;
  color: #16718a;
  letter-spacing: 0.12em;
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
.angle-arc {
  fill: none;
  stroke: #c88a25;
  stroke-width: 2;
}
svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 380px;
  background: #fff;
  border-radius: 10px;
  margin: 16px 0;
}
svg text {
  font-size: 24px;
  fill: #234257;
  font-family: inherit;
}
.axis,
.guide {
  fill: none;
  stroke: #8ea6b5;
  stroke-width: 2;
}
.guide {
  stroke-dasharray: 7 6;
}
.wave,
.ray,
.out,
.mirror {
  fill: none;
  stroke: #2062be;
  stroke-width: 3;
}
.out {
  stroke: #0e918c;
}
.mirror {
  stroke: #566b7d;
  stroke-width: 5;
}
.marker {
  fill: #e68c20;
  stroke: #fff;
  stroke-width: 2;
}
.particle {
  fill: #3974a3;
}
.virtual {
  fill: none;
  stroke: #0e918c;
  stroke-width: 3;
  stroke-dasharray: 4 3;
}
.wavefront {
  fill: none;
  stroke: #3894ae;
  stroke-width: 2;
}
.boat {
  fill: #2b6ea8;
}
.result {
  padding: 12px 14px;
  border-left: 3px solid #2d7fa6;
  background: #e9f3fa;
  font-weight: 600;
}
.spectrum-track {
  display: flex;
  height: 45px;
  border-radius: 8px;
  overflow: hidden;
}
.spectrum-track span {
  flex: 1;
  display: grid;
  place-items: center;
  color: #fff;
  background: #8ba6ba;
  border-right: 1px solid #fff;
}
.spectrum-track .selected {
  background: #215bc5;
  font-weight: 700;
}
.direction {
  text-align: center;
  color: #336c8a;
}
.band-detail {
  padding: 16px;
  background: #fff;
  border-radius: 10px;
}
.band-detail strong {
  font-size: 20px;
}
@media (max-width: 600px) {
  .waves-atlas {
    padding: 12px;
  }
  h5 {
    font-size: 18px;
  }
  .controls {
    gap: 6px;
  }
}
</style>
