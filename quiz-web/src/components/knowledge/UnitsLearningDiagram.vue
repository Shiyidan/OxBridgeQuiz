<!-- 数学1单位图解：以总量/单位量和逐项消去单位演示复合量、面积及体积换算。 -->
<template>
  <figure class="units-atlas" aria-label="单位与换算交互图解">
    <figcaption>
      <span class="eyebrow">MATHEMATICS 1 · UNITS</span>
      <h5>{{ conversion ? '单位也参加运算' : '把“每”放到分母' }}</h5>
      <p>
        {{
          conversion
            ? '切换换算路线，观察分子、分母与维数分别怎样变化。'
            : '同一种结构，可以读懂速度、工资、单价、密度和压强。'
        }}
      </p>
    </figcaption>
    <div class="controls" role="group" :aria-label="conversion ? '选择换算量' : '选择复合量'">
      <AppButton
        v-for="(item, index) in choices"
        :key="item.label"
        size="small"
        :type="selected === index ? 'primary' : 'secondary'"
        :aria-pressed="selected === index"
        @click="selected = index"
        >{{ item.label }}</AppButton
      >
    </div>
    <template v-if="!conversion">
      <div class="ratio-story" aria-live="polite">
        <div class="quantity">
          <span>{{ current.top }}</span
          ><strong>{{ current.topValue }}</strong>
        </div>
        <span class="operator">÷</span>
        <div class="quantity">
          <span>{{ current.bottom }}</span
          ><strong>{{ current.bottomValue }}</strong>
        </div>
        <span class="operator">=</span>
        <div class="quantity result">
          <span>{{ current.label }}</span
          ><strong>{{ current.result }}</strong>
        </div>
      </div>
      <LatexText class="equation" :text="current.formula" />
      <svg viewBox="0 0 520 130" role="img" :aria-label="current.diagramLabel">
        <title>{{ current.diagramLabel }}</title>
        <g v-for="index in 4" :key="index">
          <rect
            :x="30 + (index - 1) * 120"
            y="24"
            width="108"
            height="42"
            rx="6"
            class="unit-part"
          />
          <text :x="84 + (index - 1) * 120" y="51" text-anchor="middle">
            {{ current.unitPart }}
          </text>
          <text :x="84 + (index - 1) * 120" y="91" text-anchor="middle">{{ current.share }}</text>
        </g>
      </svg>
      <p class="insight">{{ current.note }}</p>
    </template>
    <template v-else>
      <div class="conversion-path" aria-live="polite">
        <LatexText :text="route.start" />
        <span class="path-arrow" aria-hidden="true">↓</span>
        <LatexText :text="route.factor" />
        <span class="path-arrow" aria-hidden="true">↓</span>
        <LatexText class="equation" :text="route.end" />
      </div>
      <div
        v-if="selected < 3"
        class="dimension-grid"
        :class="`dimension-${selected + 1}`"
        aria-label="每个方向都独立换算"
      >
        <div v-for="dimension in selected + 1" :key="dimension">
          <span>第 {{ dimension }} 个方向</span><strong>1 m → 100 cm</strong>
        </div>
      </div>
      <p class="insight">{{ route.note }}</p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic: string }>()
const selected = ref(0)
// 第二个叶子节点使用单位消去路线；整章阅读沿用复合量导读。
const conversion = computed(() => props.topic === '110102')
const quantities = [
  {
    label: '速度',
    top: '总路程',
    topValue: '120 km',
    bottom: '总时间',
    bottomValue: '4 h',
    result: '30 km/h',
    formula: '$v=d/t,\\quad d=vt$',
    diagramLabel: '匀速运动四小时，每小时走三十千米',
    unitPart: '1 小时',
    share: '30 km',
    note: '图中每段用时相同，所以可等分路程。变速行程应把实际路程和实际用时分别加总，不能套等速分块。',
  },
  {
    label: '时薪',
    top: '报酬',
    topValue: '48 英镑',
    bottom: '工作时间',
    bottomValue: '4 h',
    result: '12 英镑/h',
    formula: '$\\text{pay}=\\text{hourly rate}\\times\\text{hours}$',
    diagramLabel: '固定时薪四小时，每小时十二英镑',
    unitPart: '1 小时',
    share: '12 英镑',
    note: '15分钟是0.25小时；2小时15分钟是2.25小时。加班费不同则先分段。',
  },
  {
    label: '单价',
    top: '总价',
    topValue: '8 英镑',
    bottom: '质量',
    bottomValue: '4 kg',
    result: '2 英镑/kg',
    formula: '$\\text{price}=\\text{unit price}\\times\\text{quantity}$',
    diagramLabel: '同一单价四千克，每千克两英镑',
    unitPart: '1 kg',
    share: '2 英镑',
    note: '每100 g与每kg价格不能直接比较；“更小包装总价更低”不等于单价更便宜。',
  },
  {
    label: '密度',
    top: '质量',
    topValue: '12 g',
    bottom: '体积',
    bottomValue: '4 cm³',
    result: '3 g/cm³',
    formula: '$\\rho=m/V,\\quad m=\\rho V$',
    diagramLabel: '均匀材料四立方厘米，每立方厘米三克',
    unitPart: '1 cm³',
    share: '3 g',
    note: '图示假设材料均匀。质量和体积必须配对；1升某液体不一定重1千克。',
  },
  {
    label: '压强',
    top: '垂直力',
    topValue: '80 N',
    bottom: '受力面积',
    bottomValue: '4 m²',
    result: '20 Pa',
    formula: '$p=F/A,\\quad 1\\,\\mathrm{Pa}=1\\,\\mathrm{N/m^2}$',
    diagramLabel: '均匀受力四平方米，每平方米二十牛顿',
    unitPart: '1 m²',
    share: '20 N',
    note: '图示为均匀受力。相同的力分到更小面积，压强更大；面积换算因子必须平方。',
  },
]
const routes = [
  {
    label: '长度',
    start: '$2.5\\,\\mathrm{m}$',
    factor: '$\\times\\dfrac{100\\,\\mathrm{cm}}{1\\,\\mathrm{m}}$',
    end: '$=250\\,\\mathrm{cm}$',
    note: '换算分数等于1，约去原单位m；数值变了，同一段实际长度没有变。',
  },
  {
    label: '面积',
    start: '$2.5\\,\\mathrm{m^2}$',
    factor: '$\\times\\left(\\dfrac{100\\,\\mathrm{cm}}{1\\,\\mathrm{m}}\\right)^2$',
    end: '$=25000\\,\\mathrm{cm^2}$',
    note: '面积有两个方向：每个方向乘100，总换算因子是100²，不是100。',
  },
  {
    label: '体积',
    start: '$2.5\\,\\mathrm{m^3}$',
    factor: '$\\times\\left(\\dfrac{100\\,\\mathrm{cm}}{1\\,\\mathrm{m}}\\right)^3$',
    end: '$=2500000\\,\\mathrm{cm^3}=2500\\,\\mathrm{L}$',
    note: '体积换算因子是100³。另记1 L=1000 cm³，1 m³=1000 L。',
  },
  {
    label: '速度',
    start: '$72\\,\\mathrm{km/h}$',
    factor:
      '$\\times\\dfrac{1000\\,\\mathrm{m}}{1\\,\\mathrm{km}}\\times\\dfrac{1\\,\\mathrm{h}}{3600\\,\\mathrm{s}}$',
    end: '$=20\\,\\mathrm{m/s}$',
    note: '分子km换m乘1000；分母h换s除3600，所以km/h换m/s是除3.6。',
  },
  {
    label: '密度',
    start: '$2.7\\,\\mathrm{g/cm^3}$',
    factor:
      '$\\times\\dfrac{1\\,\\mathrm{kg}}{1000\\,\\mathrm{g}}\\times\\dfrac{10^6\\,\\mathrm{cm^3}}{1\\,\\mathrm{m^3}}$',
    end: '$=2700\\,\\mathrm{kg/m^3}$',
    note: '质量换算乘10⁻³，分母体积换算等效乘10⁶，总因子10³。不能只换分子。',
  },
  {
    label: '压强',
    start: '$3\\,\\mathrm{N/cm^2}$',
    factor: '$\\times\\dfrac{10000\\,\\mathrm{cm^2}}{1\\,\\mathrm{m^2}}$',
    end: '$=30000\\,\\mathrm{Pa}$',
    note: '分母由cm²换成m²，每平方米包含更多平方厘米，所以每平方米的力更大。',
  },
]
// 选项与当前章节模式一致，避免章节切换后沿用不相关索引。
const choices = computed(() => (conversion.value ? routes : quantities))
// 复合量示例保持分母可等分，帮助读懂“每”的含义。
const current = computed(() => quantities[selected.value] ?? quantities[0]!)
// 换算路线逐项显示单位消去，不依赖口诀猜乘除方向。
const route = computed(() => routes[selected.value] ?? routes[0]!)
watch(
  () => props.topic,
  () => {
    selected.value = 0
  },
)
</script>

<style scoped lang="scss">
.units-atlas {
  margin: 0;
  padding: 22px;
  min-width: 0;
  border: 1px solid #bfdcfa;
  border-radius: 14px;
  background: linear-gradient(135deg, #f3f8ff, #f4fbfa);
  color: #183752;
}
.eyebrow {
  color: #087f86;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
h5 {
  font-size: 20px;
  margin: 10px 0;
}
p {
  line-height: 1.7;
  margin: 8px 0 16px;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.ratio-story {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.quantity {
  flex: 1 1 100px;
  display: grid;
  gap: 8px;
  background: white;
  padding: 14px 10px;
  border: 1px solid #dce7f4;
  border-radius: 9px;
  text-align: center;
}
.quantity span {
  font-size: 13px;
  color: #657b94;
}
.quantity strong {
  font-size: 18px;
}
.result {
  color: #086e79;
  background: #e6f7f4;
}
.operator {
  font-size: 20px;
  color: #2353c8;
}
.equation {
  display: block;
  padding: 14px 0;
  text-align: center;
  overflow-x: auto;
}
svg {
  display: block;
  width: 100%;
  max-height: 160px;
  font-size: 14px;
  fill: #244963;
}
.unit-part {
  fill: #deedff;
  stroke: #9cbde8;
}
.insight {
  border-left: 3px solid #178f99;
  padding: 8px 0 8px 13px;
  margin: 12px 0 0;
}
.conversion-path {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 16px 8px;
  border-radius: 10px;
  background: white;
  overflow-x: auto;
}
.path-arrow {
  color: #2c5bd4;
}
.dimension-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}
.dimension-grid div {
  flex: 1 1 100px;
  padding: 12px;
  background: #e2edf9;
  border-radius: 7px;
  display: grid;
  gap: 7px;
  font-size: 13px;
}
@media (max-width: 600px) {
  .units-atlas {
    padding: 14px;
  }
  .ratio-story {
    gap: 6px;
  }
  .quantity {
    flex-basis: 72px;
    padding: 10px 5px;
  }
  .quantity strong {
    font-size: 14px;
  }
  h5 {
    font-size: 18px;
  }
}

.controls :deep(.app-button) {
  white-space: normal;
  max-width: 100%;
  margin: 0;
  height: auto;
  min-height: 32px;
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue-line);
  --app-button-hover-bg: var(--color-learning-blue-soft);
  --app-button-hover-border: var(--color-learning-blue-line);
  --app-button-active-bg: var(--color-learning-blue-soft);
  --app-button-active-border: var(--color-learning-blue);
}
.controls :deep(.app-button--primary) {
  --app-button-bg: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue);
  --app-button-color: var(--color-ink-inverse);
  --app-button-hover-bg: var(--color-learning-blue);
  --app-button-hover-border: var(--color-learning-blue);
  --app-button-active-bg: var(--color-learning-blue);
  --app-button-active-border: var(--color-learning-blue);
}
</style>
