<!-- 放射性概念与方法：电场偏转用小图，半衰期两种读图并排，基础计数直接用表。 -->
<template>
  <KnowledgeMethodsArticle
    class="radioactivity-methods"
    :lesson="lesson"
    label="放射性：概念与方法"
  >
    <template #diagram>
      <figure v-if="code === '130703'" class="radiation-figure radiation-figure--single">
        <svg viewBox="0 0 320 210" role="img" :aria-labelledby="uid + '-field'">
          <title :id="uid + '-field'">
            三种辐射同向向右进入电场，上方正极板、下方负极板；β−向上偏，α向下偏，γ直行。曲率仅作示意。
          </title>
          <path d="M75 35H255" stroke="#bd7132" stroke-width="4" />
          <path d="M75 175H255" stroke="#2453cd" stroke-width="4" />
          <text x="165" y="23" text-anchor="middle">＋　＋　＋　＋</text>
          <text x="165" y="198" text-anchor="middle">−　−　−　−</text>
          <rect x="15" y="90" width="35" height="30" rx="4" fill="#e4edff" stroke="#98a8bb" />
          <text x="32" y="110" text-anchor="middle">源</text>
          <path
            d="M50 105H75 Q160 105 246 55 M237 56L246 55L242 64"
            fill="none"
            stroke="#7b52c8"
            stroke-width="2.5"
          />
          <path
            d="M50 105H270 M259 99L270 105L259 111"
            fill="none"
            stroke="#64748b"
            stroke-width="2.5"
          />
          <path
            d="M50 105H75 Q160 105 246 155 M242 146L246 155L237 154"
            fill="none"
            stroke="#087f76"
            stroke-width="2.5"
          />
          <text x="260" y="61">β−</text>
          <text x="284" y="111">γ</text>
          <text x="260" y="162">α</text>
        </svg>
        <figcaption>
          先看电荷正负：β− 被正极板吸引，α 被负极板吸引，γ
          不受电场力。此图只比较偏转方向，不表示两种粒子的实际偏转程度相等。
        </figcaption>
      </figure>

      <div v-else-if="code === '130704'" class="radiation-pair">
        <figure v-for="daughter in [false, true]" :key="String(daughter)" class="radiation-figure">
          <h4>{{ daughter ? '稳定子核：看离平台的差' : '总计数：看高出本底的差' }}</h4>
          <svg viewBox="0 0 320 225" role="img" :aria-labelledby="uid + '-decay-' + daughter">
            <title :id="uid + '-decay-' + daughter">
              {{
                daughter
                  ? '初始子核20、母核160，每个母核生成一个稳定子核。子核数依次为20、100、140，趋向180的平台。'
                  : '本底20次每分钟，初始源净计数160。总计数在零、一个、两个半衰期为180、100、60，趋向20。'
              }}
            </title>
            <path d="M46 35V182H296" fill="none" stroke="#64748b" stroke-width="1.5" />
            <path
              :d="daughter ? 'M46 65H290' : 'M46 169H290'"
              fill="none"
              stroke="#bd7132"
              stroke-width="1.5"
              stroke-dasharray="4 4"
            />
            <path
              :d="daughter ? daughterCurve : countCurve"
              fill="none"
              stroke="#2453cd"
              stroke-width="2.5"
            />
            <path
              :d="daughter ? 'M46 117H100V182 M46 91H154V182' : 'M46 117H100V182 M46 143H154V182'"
              fill="none"
              stroke="#98a8bb"
              stroke-dasharray="3 4"
            />
            <circle cx="100" cy="117" r="3.5" fill="#2453cd" />
            <circle cx="154" :cy="daughter ? 91 : 143" r="3.5" fill="#2453cd" />
            <text x="46" y="21">
              {{ daughter ? '子核数 D / 任意单位' : '总计数率 R / 次·min⁻¹' }}
            </text>
            <text x="36" y="71" text-anchor="end">180</text>
            <text x="36" y="123" text-anchor="end">100</text>
            <text v-if="!daughter" x="36" y="149" text-anchor="end">60</text>
            <text v-else x="36" y="97" text-anchor="end">140</text>
            <text x="36" y="175" text-anchor="end">20</text>
            <path d="M195 45H212" stroke="#bd7132" stroke-width="1.5" stroke-dasharray="4 4" />
            <text x="282" y="50" text-anchor="end">{{ daughter ? '平台 180' : '本底 20' }}</text>
            <text x="46" y="203" text-anchor="middle">0</text>
            <text v-for="n in [1, 2, 3, 4]" :key="n" :x="46 + n * 54" y="203" text-anchor="middle">
              {{ n === 1 ? 'T' : n + 'T' }}
            </text>
            <text x="297" y="219" text-anchor="end">时间 t</text>
          </svg>
          <figcaption>
            {{
              daughter
                ? '离平台的差：180−20＝160 → 80 → 40。每隔 T 减半；子核自身的数量却在增加。'
                : '扣除本底：180−20＝160 → 80 → 40。总读数为 180 → 100 → 60，不是逐次直接减半。'
            }}T 表示半衰期。
          </figcaption>
        </figure>
      </div>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  radioactivityMethods,
  type RadioactivityMethodCode,
} from '@/content/knowledge/radioactivityMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: RadioactivityMethodCode }>()
const uid = useId()
// 每个考纲节点选取自己的正文，图示随节点同步切换。
const lesson = computed(() => radioactivityMethods[props.code])
// 两幅曲线共用初值和坐标尺度，分别表示恒定本底叠加与稳定子核累积。
function decayPath(daughter: boolean) {
  return Array.from({ length: 91 }, (_, index) => {
    const periods = index / 20
    const remaining = 160 * 2 ** -periods
    const value = daughter ? 180 - remaining : 20 + remaining
    return `${index === 0 ? 'M' : 'L'}${(46 + periods * 54).toFixed(2)} ${(182 - value * 0.65).toFixed(2)}`
  }).join(' ')
}
const countCurve = decayPath(false)
const daughterCurve = decayPath(true)
</script>

<style scoped lang="scss">
.radioactivity-methods {
  container-type: inline-size;
}
.radioactivity-methods :deep(h3 > span) {
  flex-shrink: 0;
  white-space: nowrap;
}
.radiation-figure {
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.radiation-figure svg {
  display: block;
  width: 100%;
  max-width: 320px;
  height: auto;
  margin: 0 auto;
}
.radiation-figure svg text {
  fill: #344c6c;
  font-family: var(--font-family-base, sans-serif);
  font-size: 15px;
}
.radiation-figure h4 {
  margin: 0 0 8px;
  font-size: 16px;
}
.radiation-figure figcaption {
  margin-top: 8px;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
.radiation-figure--single {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  max-width: 620px;
  margin: 12px auto;
}
.radiation-figure--single figcaption {
  margin-top: 0;
}
.radiation-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  max-width: 680px;
  margin: 12px auto;
}
@container (max-width: 600px) {
  .radiation-figure--single {
    grid-template-columns: 1fr;
    max-width: 350px;
    gap: 8px;
  }
  .radiation-pair {
    grid-template-columns: 1fr;
  }
  .radiation-pair .radiation-figure {
    width: 100%;
    max-width: 350px;
    box-sizing: border-box;
    justify-self: center;
  }
}
@media (max-width: 600px) {
  .radiation-figure {
    padding: 10px;
  }
}
</style>
