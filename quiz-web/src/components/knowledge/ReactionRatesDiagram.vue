<!-- ESAT 速率互动图解：实验曲线、碰撞密度和催化路径随叶子知识点切换，模型数据仅用于解释规律。 -->
<template>
  <figure class="rate-atlas">
    <figcaption>
      <span>CHEMISTRY · 从实验走到粒子</span>
      <h5>{{ heading }}</h5>
    </figcaption>
    <template v-if="isGraph">
      <div class="controls" role="group" aria-label="选择实验变化">
        <AppButton
          v-for="(item, index) in scenarios"
          :key="item.label"
          :type="scenarioIndex === index ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="scenarioIndex === index"
          @click="scenarioIndex = index"
          >{{ item.label }}</AppButton
        >
      </div>
      <p>{{ scenario.note }}</p>
      <svg
        viewBox="0 0 480 280"
        role="img"
        :aria-label="`累计产物曲线，${scenario.label}，蓝色基准，绿色比较。${scenario.note}`"
      >
        <path d="M48 25V230H450" class="axis" />
        <text x="73" y="17">累计产物 / 示意单位</text>
        <text x="411" y="263">时间 / s</text>
        <path :d="baselinePath" class="baseline" />
        <path :d="comparisonPath" class="comparison" />
        <line
          x1="48"
          x2="440"
          :y1="230 - scenario.amount"
          :y2="230 - scenario.amount"
          class="guide"
        />
        <text x="389" :y="220 - scenario.amount">最终量 {{ scenario.amount }}</text>
        <line :x1="point.x" :x2="point.x" y1="230" :y2="point.y" class="guide" />
        <circle :cx="point.x" :cy="point.y" r="5" class="dot" />
        <line
          v-if="topic === '141003'"
          :x1="point.x - 23"
          :x2="point.x + 23"
          :y1="point.y + point.slope * 23"
          :y2="point.y - point.slope * 23"
          class="tangent"
        />
        <line v-else :x1="48" :x2="point.x" y1="230" :y2="point.y" class="tangent" />
        <text v-for="tick in [0, 20, 40, 60]" :key="tick" :x="48 + tick * 6" y="250">
          {{ tick }}
        </text>
      </svg>
      <label>观察到第 {{ elapsed }} 秒</label
      ><el-slider v-model="elapsed" :min="5" :max="60" :step="5" aria-label="观察时间" />
      <div class="stats" aria-live="polite">
        <div>
          <span>累计产物</span><strong>{{ amountNow.toFixed(1) }}</strong>
        </div>
        <div>
          <span>0—{{ elapsed }} s 平均速率</span
          ><strong>{{ (amountNow / elapsed).toFixed(2) }}</strong>
        </div>
        <div>
          <span>此刻瞬时速率</span><strong>{{ instantaneous.toFixed(2) }}</strong>
        </div>
      </div>
      <p class="insight">
        {{
          topic === '141003'
            ? '橙色为此刻切线：斜率是瞬时速率。曲线高度是累计量，平台是最终量。'
            : '橙色割线连接起点与当前点：斜率是该时间段的平均速率。'
        }}
        蓝线为基准，绿线为比较实验。速率单位为“示意单位/s”；曲线是教学模型，不代表具体反应速率方程。
      </p>
    </template>
    <template v-else-if="topic === '141004'">
      <div class="controls">
        <AppButton
          :type="compressed ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="compressed"
          @click="compressed = !compressed"
          >{{ compressed ? '已压缩：高压' : '未压缩：低压' }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 480 245"
        role="img"
        :aria-label="
          compressed
            ? '相同粒子在更小体积中，数密度增大；温度保持'
            : '相同粒子在较大体积中，数密度较小；温度保持'
        "
      >
        <rect x="35" y="25" :width="compressed ? 235 : 405" height="160" rx="12" class="vessel" />
        <g
          v-for="i in 12"
          :key="i"
          :transform="`translate(${60 + ((i - 1) % 4) * (compressed ? 55 : 108)},${58 + Math.floor((i - 1) / 4) * 48})`"
        >
          <circle r="11" :class="i % 2 ? 'particle-a' : 'particle-b'" />
          <path d="M13 0H28L23 -4M28 0L23 4" class="motion" />
        </g>
        <text x="240" y="219">粒子数相同 · 温度相同 · 箭头长度相同</text>
      </svg>
      <div class="insight" aria-live="polite">
        <strong>{{
          compressed ? '体积变小 → 数密度增加 → 碰撞更频繁' : '体积较大 → 粒子较稀 → 碰撞机会较少'
        }}</strong>
        <p>
          这里没有升温，平均动能不变。升温则会同时改变运动与能量分布，不能把两种原因混在一起。粒子位置为示意，不模拟真实轨迹或随机碰撞。
        </p>
      </div>
    </template>
    <template v-else>
      <div class="controls">
        <AppButton
          :type="catalysed ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="catalysed"
          @click="catalysed = !catalysed"
          >{{ catalysed ? '移除催化路径' : '加入催化路径' }}</AppButton
        ><AppButton
          :type="reverse ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="reverse"
          @click="reverse = !reverse"
          >{{ reverse ? '观察正反应' : '观察逆反应' }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 480 255"
        role="img"
        :aria-label="`正反应焓变负100千焦每摩尔，当前方向活化能${barrier}千焦每摩尔，催化${catalysed ? '有' : '无'}`"
      >
        <path d="M40 18V220H450" class="axis" />
        <text x="87" y="16">能量 / kJ mol⁻¹</text>
        <text x="395" y="246">反应进程</text>
        <path d="M65 140H115C165 140 180 50 230 50S305 200 365 200H430" class="baseline" />
        <path
          v-if="catalysed"
          d="M65 140H115C165 140 180 96.8 230 96.8S305 200 365 200H430"
          class="comparison"
        />
        <line
          :x1="reverse ? 345 : 135"
          :x2="reverse ? 345 : 135"
          :y1="reverse ? 200 : 140"
          :y2="catalysed ? 96.8 : 50"
          class="tangent"
        />
        <text :x="reverse ? 388 : 85" y="115">Eₐ {{ barrier }}</text>
        <text x="82" y="163">反应物 0</text>
        <text x="384" y="220">产物 −100</text>
        <text x="240" y="32">{{ catalysed ? '蓝：原路径；绿：催化路径' : '原路径峰顶 +150' }}</text>
      </svg>
      <div class="stats" aria-live="polite">
        <div>
          <span>当前方向</span><strong>{{ reverse ? '逆反应' : '正反应' }}</strong>
        </div>
        <div>
          <span>活化能 Eₐ</span><strong>{{ barrier }} kJ/mol</strong>
        </div>
        <div>
          <span>反应焓 ΔH</span><strong>{{ reverse ? '+100' : '−100' }} kJ/mol</strong>
        </div>
      </div>
      <p class="insight">
        催化示意峰顶为 +72 kJ/mol，原峰顶为 +150；两端仍是 0 与
        −100。切换方向只改变测量起点，切换路径只改变能垒。
      </p>
      <template v-if="topic === '141006'"
        ><div class="controls" role="group" aria-label="选择催化表面步骤">
          <AppButton
            v-for="(step, index) in cycle"
            :key="step.title"
            :type="cycleIndex === index ? 'primary' : 'secondary'"
            size="small"
            :aria-pressed="cycleIndex === index"
            @click="cycleIndex = index"
            >{{ index + 1 }} · {{ step.title }}</AppButton
          >
        </div>
        <div class="insight" aria-live="polite">
          <strong>{{ cycle[cycleIndex]!.title }}</strong>
          <p>{{ cycle[cycleIndex]!.text }}</p>
          <p>吸附 → 反应 → 解吸 → 空位再用；催化剂总体再生。</p>
        </div></template
      >
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElSlider } from 'element-plus'
import AppButton from '@/components/AppButton.vue'
const props = defineProps<{ topic: string }>()
const scenarioIndex = ref(0)
const elapsed = ref(20)
const compressed = ref(false)
const catalysed = ref(false)
const reverse = ref(false)
const cycleIndex = ref(0)
const scenarios = [
  {
    label: '只加快，不改总量',
    amount: 135,
    k: 0.1,
    note: '同量反应物、完全反应：可用更大表面积或适当催化解释更早到相同平台。',
  },
  {
    label: '反应物更多且更快',
    amount: 180,
    k: 0.09,
    note: '示意同时改变总量与速率：平台更高，初始斜率也更大。真实题仍需先计算限制试剂。',
  },
  {
    label: '更快，但总量较少',
    amount: 80,
    k: 0.15,
    note: '示意浓度较高但总摩尔数较少：开始更快，却到达较低平台。不能只看一处特征。',
  },
]
const cycle = [
  {
    title: '吸附',
    text: '反应物接近表面活性位，在合适位置相遇，某些键被削弱。不是整个粒子被吸收到固体内部。',
  },
  { title: '表面反应', text: '经较低能垒的路径重新成键；催化剂可以参与中间步骤，并非始终旁观。' },
  {
    title: '解吸',
    text: '产物离开表面，活性位释放，继续下一轮；位点被占据可能降低活性，但不改变平衡常数。',
  },
]
// 前三个知识点使用同一实验模型，分别强调条件、测量与读图。
const isGraph = computed(() => ['141001', '141002', '141003'].includes(props.topic))
// 图题随所选叶子变化，明确当前学习任务。
const heading = computed(
  () =>
    (
      ({
        '141001': '同一幅图，分开看快慢和总量',
        '141002': '从累计读数得到每秒变化',
        '141003': '移动观察时刻，比较割线与切线',
        '141004': '恒温压缩：动能没变，碰撞机会变了',
        '141005': '换方向，活化能从哪里量？',
        '141006': '换路径，反应终点不动',
      }) as Record<string, string>
    )[props.topic] || '反应速率的三种视角',
)
// 情景参数用于定性比较，不作为真实化学反应的拟合结果。
const scenario = computed(() => scenarios[scenarioIndex.value]!)
// 累计量教学模型保持单调增加并接近设定平台。
function quantity(time: number, amount: number, k: number) {
  return amount * (1 - Math.exp(-k * time))
}
// 将模型数据转换为可缩放SVG路径，不依赖计时器和动画循环。
function curve(amount: number, k: number) {
  return Array.from(
    { length: 66 },
    (_, time) => `${time ? 'L' : 'M'}${48 + time * 6},${230 - quantity(time, amount, k)}`,
  ).join(' ')
}
// 固定基准曲线使切换实验时有可比对象。
const baselinePath = computed(() => curve(135, 0.045))
// 绿线由所选实验的速率参数和最终量共同决定。
const comparisonPath = computed(() => curve(scenario.value.amount, scenario.value.k))
// 当前时刻的累计读数与瞬时导数分开计算，防止把高度当速率。
const amountNow = computed(() => quantity(elapsed.value, scenario.value.amount, scenario.value.k))
// 教学曲线的解析导数用于切线展示。
const instantaneous = computed(
  () => scenario.value.amount * scenario.value.k * Math.exp(-scenario.value.k * elapsed.value),
)
// SVG横轴每秒六个坐标单位，切线斜率按相同比例转换。
const point = computed(() => ({
  x: 48 + elapsed.value * 6,
  y: 230 - amountNow.value,
  slope: instantaneous.value / 6,
}))
// 正逆方向分别从0或负100能级量至当前路径的峰顶。
const barrier = computed(() => (catalysed.value ? 72 : 150) + (reverse.value ? 100 : 0))
</script>

<style scoped lang="scss">
// 图解选择沿用学习区配色，通过按下状态区分当前演示。
.rate-atlas :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-color: var(--color-learning-teal);
  --app-button-hover-border: var(--color-learning-teal);
}
.rate-atlas :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-border: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-hover-color: var(--color-ink-inverse);
}

.rate-atlas {
  margin: 0;
  padding: 22px;
  border: 1px solid #bbdedc;
  border-radius: 14px;
  background: linear-gradient(135deg, #f0fbf9, #fff);
  color: #173e4b;
  min-width: 0;
  font-size: 14px;
  line-height: 1.75;
  figcaption > span {
    font-size: 12px;
    letter-spacing: 1px;
    color: #087e80;
  }
  h5 {
    font-size: 20px;
    margin: 8px 0 16px;
  }
  p {
    margin: 9px 0;
  }
  .controls {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  svg {
    width: 100%;
    max-width: 620px;
    display: block;
    margin: 12px auto;
  }
  svg text {
    font-size: 12px;
    fill: #214958;
    text-anchor: middle;
  }
  .axis {
    fill: none;
    stroke: #78969e;
    stroke-width: 1.5;
  }
  .baseline,
  .comparison {
    fill: none;
    stroke: #416ed3;
    stroke-width: 3;
  }
  .comparison {
    stroke: #098b82;
  }
  .guide {
    stroke: #9eb8bb;
    stroke-dasharray: 4 4;
  }
  .tangent {
    stroke: #d98a29;
    stroke-width: 2;
  }
  .dot {
    fill: #098b82;
  }
  .vessel {
    fill: #fff;
    stroke: #93c6c3;
    stroke-width: 2;
  }
  .particle-a {
    fill: #70b9b0;
  }
  .particle-b {
    fill: #94b6ee;
  }
  .motion {
    fill: none;
    stroke: #5e8090;
    stroke-width: 2;
  }
  .insight {
    border-left: 3px solid #168487;
    padding: 9px 14px;
    background: #fff;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 14px 0;
    span,
    strong {
      display: block;
    }
    span {
      font-size: 12px;
      color: #647b86;
    }
    strong {
      font-size: 16px;
    }
  }
}
@media (max-width: 580px) {
  .rate-atlas {
    padding: 15px;
    .stats {
      grid-template-columns: 1fr;
    }
    h5 {
      font-size: 18px;
    }
  }
}
</style>
