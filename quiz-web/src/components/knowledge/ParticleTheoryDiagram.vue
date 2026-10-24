<!-- ESAT 粒子理论图解：切换三态和压缩条件，或逐段阅读纯物质的恒压加热曲线。 -->
<template>
  <figure class="particle-atlas" :aria-label="isEnergy ? '物态变化与能量图解' : '三态中的粒子图解'">
    <figcaption>
      <span class="eyebrow">CHEMISTRY · 粒子与能量</span>
      <h5>{{ isEnergy ? '热量进入，温度一定升高吗？' : '粒子没有变小，变的是间距与运动' }}</h5>
      <p>
        {{
          isEnergy
            ? '点选曲线阶段，分清平均动能与粒子间势能。'
            : '切换物态，再对比气体压缩前后；每幅图保留相同粒子数与大小。'
        }}
      </p>
    </figcaption>

    <template v-if="!isEnergy">
      <div class="controls" role="group" aria-label="选择物态">
        <AppButton
          v-for="(item, index) in states"
          :key="item.name"
          size="small"
          :type="stateIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="stateIndex === index"
          @click="chooseState(index)"
          >{{ item.name }}</AppButton
        >
        <AppButton
          v-if="stateIndex === 2"
          size="small"
          type="secondary"
          :aria-pressed="compressed"
          @click="compressed = !compressed"
          >{{ compressed ? '恢复体积' : '保持温度，压缩气体' }}</AppButton
        >
      </div>
      <div class="particle-layout">
        <svg viewBox="0 0 350 270" role="img" :aria-label="particleDescription">
          <title>{{ particleDescription }}，示意图非真实比例</title>
          <rect
            x="20"
            y="18"
            :width="stateIndex === 2 && compressed ? 165 : 310"
            height="218"
            rx="12"
            class="vessel"
          />
          <path
            v-if="stateIndex === 2 && compressed"
            d="M185 26V229 M238 124H200 M210 117L200 124L210 131"
            class="piston"
          />
          <g v-for="(point, index) in particles" :key="index">
            <circle :cx="point.x" :cy="point.y" r="10" class="particle" />
            <path
              v-if="stateIndex === 0"
              :d="`M${point.x - 13} ${point.y + 15}h26`"
              class="motion"
            />
            <path
              v-else
              :d="`M${point.x + 12} ${point.y}h${stateIndex === 2 ? 15 : 8}l-4 -4m4 4l-4 4`"
              class="motion"
            />
          </g>
          <text x="175" y="260" text-anchor="middle">
            {{
              stateIndex === 2
                ? compressed
                  ? '粒子数不变 · 间距减小'
                  : '粒子相距远 · 可压缩'
                : stateIndex === 0
                  ? '固定位置附近振动'
                  : '相邻粒子可以换位'
            }}
          </text>
        </svg>
        <dl aria-live="polite">
          <div>
            <dt>排列与间距</dt>
            <dd>{{ currentState.arrangement }}</dd>
          </div>
          <div>
            <dt>运动</dt>
            <dd>{{ currentState.motion }}</dd>
          </div>
          <div>
            <dt>宏观表现</dt>
            <dd>{{ currentState.property }}</dd>
          </div>
        </dl>
      </div>
      <p class="insight" aria-live="polite">
        {{
          compressed && stateIndex === 2
            ? '恒温压缩：平均动能不因压缩本身增加；单位时间碰壁更频繁，压强增大。分子本身没有缩小。'
            : '图中的圆点只表示粒子。真实粒子可以是原子、分子或离子；“能移动”与“能带电导电”是不同问题。'
        }}
      </p>
    </template>

    <template v-else>
      <div class="controls" role="group" aria-label="选择加热曲线阶段">
        <AppButton
          v-for="(item, index) in stages"
          :key="item.name"
          size="small"
          :type="stageIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="stageIndex === index"
          @click="stageIndex = index"
          >{{ index + 1 }} · {{ item.name }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 560 280"
        role="img"
        :aria-label="`加热曲线：${currentStage.name}，${currentStage.temperature}`"
      >
        <title>纯物质恒压加热曲线；横轴累计输入热量，纵轴温度，示意图非真实比例</title>
        <path d="M45 20V238H535" class="axis" />
        <text x="12" y="25">温度</text>
        <text x="405" y="267">输入的热量 →</text>
        <path d="M65 220L145 175H235L325 85H435L505 35" class="curve" />
        <path :d="currentStage.path" class="selected-curve" />
        <path d="M45 175H235 M45 85H435" class="guide" />
        <text x="53" y="164">熔点</text>
        <text x="53" y="74">沸点</text>
        <circle :cx="currentStage.x" :cy="currentStage.y" r="7" class="focus" />
      </svg>
      <div class="energy-result" aria-live="polite">
        <strong>{{ currentStage.name }} · {{ currentStage.temperature }}</strong>
        <p>{{ currentStage.energy }}</p>
        <span>{{ currentStage.particles }}</span>
      </div>
      <p class="insight">
        斜段：同一物态升温，平均动能增大。平台：吸收能量用于相变，温度可保持不变。冷却时过程反向，并向周围放热。
      </p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{ topic: string }>()
const stateIndex = ref(0)
const compressed = ref(false)
const stageIndex = ref(0)
const states = [
  {
    name: '固体',
    arrangement: '粒子靠近；此图用规则排列的晶体作示例。',
    motion: '围绕相对固定的位置振动，不是完全静止。',
    property: '通常有固定形状和体积，难以压缩。',
  },
  {
    name: '液体',
    arrangement: '粒子仍紧靠，排列较不规则。',
    motion: '可以相互越过，改变相邻关系。',
    property: '能流动、随容器改变形状，体积相对固定且难压缩。',
  },
  {
    name: '气体',
    arrangement: '粒子间距远大于自身尺寸。',
    motion: '向各方向不断运动，碰撞容器壁。',
    property: '充满容器，可压缩；压强来自对容器壁的碰撞。',
  },
]
const stages = [
  {
    name: '固体升温',
    path: 'M65 220L145 175',
    x: 105,
    y: 197.5,
    temperature: '温度上升',
    energy: '输入能量主要增加平均动能，粒子振动更剧烈。',
    particles: '粒子仍围绕固定位置振动。',
  },
  {
    name: '熔化',
    path: 'M145 175H235',
    x: 190,
    y: 175,
    temperature: '温度保持在熔点',
    energy: '继续吸热，改变粒子间相对位置并克服部分约束；并非停止吸热。',
    particles: '固、液两相共存，直到固体完全熔化。',
  },
  {
    name: '液体升温',
    path: 'M235 175L325 85',
    x: 280,
    y: 130,
    temperature: '温度上升',
    energy: '平均动能增加，粒子仍相互靠近但移动更快。',
    particles: '这是液态升温，不是每一刻都在沸腾。',
  },
  {
    name: '沸腾',
    path: 'M325 85H435',
    x: 380,
    y: 85,
    temperature: '温度保持在沸点',
    energy: '持续输入热量用于使粒子分离。分子物质通常保留分子内的共价键。',
    particles: '液、气两相共存，气泡由液体的蒸气构成。',
  },
  {
    name: '气体升温',
    path: 'M435 85L505 35',
    x: 470,
    y: 60,
    temperature: '温度再次上升',
    energy: '液体已完全汽化，继续供热增加气体粒子的平均动能。',
    particles: '这不是分子数增多或每个分子变大。',
  },
]

// 当前叶子决定展示粒子空间模型还是加热曲线，不把两节内容混在同一默认画面。
const isEnergy = computed(() => props.topic === '141502')
// 物态按钮提供对应的宏观与微观解释。
const currentState = computed(() => states[stateIndex.value]!)
// 曲线阶段将高亮线段与能量解释绑定，避免只改变颜色。
const currentStage = computed(() => stages[stageIndex.value]!)
// 所有物态保留十二个等半径粒子；压缩只缩短气体粒子的横向间距。
const particles = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    if (stateIndex.value === 0) return { x: 75 + (i % 4) * 55, y: 105 + Math.floor(i / 4) * 43 }
    if (stateIndex.value === 1)
      return {
        x: 65 + (i % 4) * 60 + (Math.floor(i / 4) % 2) * 10,
        y: 118 + Math.floor(i / 4) * 35 - (i % 3) * 4,
      }
    return {
      x: 42 + (i % 4) * (compressed.value ? 34 : 76),
      y: 48 + Math.floor(i / 4) * 70 + (i % 2) * 18,
    }
  }),
)
// 图形的替代文字同步物态和压缩条件，让图示变化不只依赖视觉。
const particleDescription = computed(
  () =>
    `${currentState.value.name}，12个粒子，${currentState.value.arrangement}${compressed.value && stateIndex.value === 2 ? '恒温压缩后间距减小。' : ''}`,
)

// 切换物态时撤销气体专用压缩条件，以免固液态继承不适用状态。
function chooseState(index: number) {
  stateIndex.value = index
  compressed.value = false
}

// 切换考纲叶子回到基础观察，防止上一节的曲线或压缩状态误导新内容。
watch(
  () => props.topic,
  () => {
    chooseState(0)
    stageIndex.value = 0
  },
)
</script>

<style scoped lang="scss">
// 图解选择沿用学习区配色，通过按下状态区分当前演示。
.particle-atlas :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-color: var(--color-learning-teal);
  --app-button-hover-border: var(--color-learning-teal);
}
.particle-atlas :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-border: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-hover-color: var(--color-ink-inverse);
}

.particle-atlas {
  margin: 0;
  padding: 24px;
  border: 1px solid #bddfe3;
  border-radius: 14px;
  background: linear-gradient(145deg, #f1faf9, #fff);
  color: #173e4e;
}
.eyebrow {
  font-size: 12px;
  letter-spacing: 0.1em;
  color: #0b777a;
  font-weight: 700;
}
h5 {
  margin: 10px 0;
  font-size: 20px;
  color: #132d39;
  line-height: 1.5;
}
figcaption p,
.insight {
  font-size: 14px;
  line-height: 1.8;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0;
}
.particle-layout {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(180px, 1fr);
  align-items: center;
  gap: 20px;
}
svg {
  width: 100%;
  height: auto;
  display: block;
}
svg text {
  fill: #426274;
  font-size: 13px;
}
.vessel {
  fill: white;
  stroke: #83aeb9;
  stroke-width: 2;
  transition: width 0.2s;
}
.particle {
  fill: #38a5a2;
  stroke: #117977;
  stroke-width: 1;
}
.motion {
  fill: none;
  stroke: #2765bd;
  stroke-width: 1.6;
}
.piston {
  fill: none;
  stroke: #52677b;
  stroke-width: 3;
}
dl {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
}
dl div {
  margin-bottom: 12px;
}
dt {
  font-weight: 700;
  color: #0b777a;
}
dd {
  margin: 2px 0 0;
}
.insight {
  padding: 12px 14px;
  background: #e9f3ff;
  border-left: 3px solid #3c73dc;
  margin: 18px 0 0;
}
.axis {
  fill: none;
  stroke: #647887;
  stroke-width: 2;
}
.curve {
  fill: none;
  stroke: #bbd4de;
  stroke-width: 5;
}
.guide {
  fill: none;
  stroke: #cedde5;
  stroke-dasharray: 4 5;
}
.selected-curve {
  fill: none;
  stroke: #147c81;
  stroke-width: 7;
  stroke-linecap: round;
}
.focus {
  fill: #fff;
  stroke: #147c81;
  stroke-width: 3;
}
.energy-result {
  border-top: 1px solid #cbe4e7;
  padding-top: 16px;
  line-height: 1.8;
  font-size: 14px;
}
.energy-result strong {
  color: #0c777b;
  font-size: 16px;
}
.energy-result p {
  margin: 6px 0;
}
.energy-result span {
  color: #5b7180;
}
@media (max-width: 650px) {
  .particle-atlas {
    padding: 16px;
  }
  .particle-layout {
    grid-template-columns: 1fr;
  }
}
@media (prefers-reduced-motion: reduce) {
  .vessel {
    transition: none;
  }
}
</style>
