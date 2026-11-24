<!-- 数学2三角讲义：SSA 两解并列、单位圆符号与函数图像采用紧凑静态示意。 -->
<template>
  <KnowledgeMethodsArticle
    class="math2-trigonometry-methods"
    :lesson="lesson"
    label="数学2三角：概念与方法"
  >
    <template #diagram>
      <div v-if="code === '120401'" class="trig-pair">
        <figure v-for="model in triangles" :key="String(model.near)" class="trig-figure">
          <h4>{{ model.near ? 'B 为钝角的三角形' : 'B 为锐角的三角形' }}</h4>
          <svg viewBox="0 0 300 200" role="img" :aria-labelledby="uid + '-ssa-' + model.near">
            <title :id="uid + '-ssa-' + model.near">
              A＝30°，对边 a＝4，另一边 b＝6，高 h＝3。边长为4的 BC 可对应两个 B 的位置；此图为{{
                model.near ? '较近的钝角解' : '较远的锐角解'
              }}。
            </title>
            <path d="M25 150H280" fill="none" stroke="#98a8bb" stroke-width="1.5" />
            <path
              :d="`M${cx} 66V150 M${cx} 140h10v10`"
              fill="none"
              stroke="#98a8bb"
              stroke-dasharray="3 3"
            />
            <path
              :d="`M25 150L${cx} 66L${model.bx} 150Z`"
              fill="#eaf1ff"
              fill-opacity="0.65"
              stroke="#2453cd"
              stroke-width="2.3"
            />
            <path
              d="M55 150A30 30 0 0 0 50.981 135"
              fill="none"
              stroke="#087f76"
              stroke-width="1.7"
            />
            <text x="60" y="143">30°</text>
            <text x="15" y="174">A</text>
            <text :x="model.bx" y="174" text-anchor="middle">B</text>
            <text :x="cx" y="53" text-anchor="middle">C</text>
            <text x="62" y="80">b＝6</text>
            <path v-if="model.near" d="M194 96L150 96L133.45 108" fill="none" stroke="#98a8bb" />
            <text :x="model.near ? 200 : 217" :y="model.near ? 101 : 108">a＝4</text>
            <text :x="cx + 12" y="132">h＝3</text>
          </svg>
          <figcaption>
            A、a、b 均相同，且 h＜a＜b；{{
              model.near ? 'B 靠近 A，∠B 为钝角。' : 'B 远离 A，∠B 为锐角。'
            }}第三边 AB 随分支改变。
          </figcaption>
        </figure>
      </div>

      <figure v-else-if="code === '120403'" class="trig-figure trig-figure--single">
        <svg viewBox="0 0 310 210" role="img" :aria-labelledby="uid + '-unit'">
          <title :id="uid + '-unit'">
            单位圆上30°与150°的两个点纵坐标同为1/2，横坐标分别为正、负√3/2；正弦相同但余弦符号不同。
          </title>
          <circle cx="145" cy="115" r="70" fill="none" stroke="#91aad3" stroke-width="1.8" />
          <path d="M35 115H282 M145 25V195" fill="none" stroke="#64748b" stroke-width="1.5" />
          <path
            d="M48 80H250 M84.378 80V115 M205.622 80V115"
            fill="none"
            stroke="#98a8bb"
            stroke-dasharray="4 4"
          />
          <path d="M84.378 80L145 115L205.622 80" fill="none" stroke="#2453cd" stroke-width="2.3" />
          <circle cx="84.378" cy="80" r="3.5" fill="#087f76" />
          <circle cx="205.622" cy="80" r="3.5" fill="#087f76" />
          <text x="20" y="70">150°</text>
          <text x="218" y="70">30°</text>
          <text x="151" y="73">1/2</text>
          <text x="84" y="138" text-anchor="middle">−√3/2</text>
          <text x="206" y="138" text-anchor="middle">√3/2</text>
          <text x="133" y="133">0</text>
          <text x="287" y="121">x</text>
          <text x="132" y="22">y</text>
        </svg>
        <figcaption>
          同样的参考角 30°，给出相同的 |sin|、|cos|。图中两点在 x 轴上方，sin 都为正；分别位于 y
          轴两侧，cos 的符号相反。
        </figcaption>
      </figure>

      <div v-else-if="code === '120404'" class="trig-pair">
        <figure class="trig-figure">
          <h4>sin 与 cos：一周期为 2π</h4>
          <svg viewBox="0 0 310 210" role="img" :aria-labelledby="uid + '-sine'">
            <title :id="uid + '-sine'">
              正弦实线和余弦虚线在0到2π的一周期内均在−1到1之间变化，正弦从0开始，余弦从1开始。
            </title>
            <path d="M35 35V165 M35 100H284" fill="none" stroke="#64748b" stroke-width="1.5" />
            <path
              d="M35 50H265 M35 150H265 M92.5 35V165 M150 35V165 M207.5 35V165 M265 35V165"
              fill="none"
              stroke="#d8e3ef"
              stroke-dasharray="3 4"
            />
            <path :d="sinPath" fill="none" stroke="#2453cd" stroke-width="2.4" />
            <path
              :d="cosPath"
              fill="none"
              stroke="#087f76"
              stroke-width="2.4"
              stroke-dasharray="6 3"
            />
            <path d="M50 20H70" stroke="#2453cd" stroke-width="2.4" />
            <text x="76" y="25">sin x</text>
            <path d="M165 20H185" stroke="#087f76" stroke-width="2.4" stroke-dasharray="6 3" />
            <text x="191" y="25">cos x</text>
            <text x="27" y="55" text-anchor="end">1</text>
            <text x="27" y="155" text-anchor="end">−1</text>
            <text
              v-for="(label, i) in ['0', 'π/2', 'π', '3π/2', '2π']"
              :key="label"
              :x="35 + i * 57.5"
              y="187"
              text-anchor="middle"
            >
              {{ label }}
            </text>
            <text x="289" y="106">x</text>
          </svg>
          <figcaption>
            先用四分之一周期定位零点和极值，再连成平滑图像。两条曲线共用同一组横坐标，起点与极值位置不同。
          </figcaption>
        </figure>
        <figure class="trig-figure">
          <h4>tan：渐近线之间一个分支</h4>
          <svg viewBox="0 0 310 230" role="img" :aria-labelledby="uid + '-tan'">
            <title :id="uid + '-tan'">
              正切在−π/2与π/2之间递增，过原点；两端是竖直渐近线，不是可取到的点，图中仅显示有限高度范围。
            </title>
            <path d="M20 110H282 M150 25V195" fill="none" stroke="#64748b" stroke-width="1.5" />
            <path
              d="M35 25V195 M265 25V195"
              stroke="#bd7132"
              stroke-dasharray="4 4"
              stroke-width="1.5"
            />
            <path :d="tanPath" fill="none" stroke="#2453cd" stroke-width="2.4" />
            <text x="150" y="214" text-anchor="middle">0</text>
            <text x="35" y="214" text-anchor="middle">−π/2</text>
            <text x="265" y="214" text-anchor="middle">π/2</text>
            <text x="138" y="89" text-anchor="end">1</text>
            <text x="138" y="141" text-anchor="end">−1</text>
            <text x="170" y="24">tan x</text>
            <text x="287" y="116">x</text>
          </svg>
          <figcaption>
            曲线可向上下继续延伸，不能碰到渐近线。向左或向右平移 π
            得到相邻分支；每一支递增不代表跨渐近线仍递增。
          </figcaption>
        </figure>
      </div>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  math2TrigonometryMethods,
  type Math2TrigonometryMethodCode,
} from '@/content/knowledge/math2TrigonometryMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: Math2TrigonometryMethodCode }>()
const uid = useId()
// 每个节点独立加载方法与配图，避免重复套用单位圆。
const lesson = computed(() => math2TrigonometryMethods[props.code])
const cx = 25 + 3 * Math.sqrt(3) * 28
// 同一组 SSA 数据对应底边射线上的两个真实交点，两个画布沿用同一比例。
const triangles = [true, false].map((near) => ({
  near,
  bx: 25 + (3 * Math.sqrt(3) + (near ? -1 : 1) * Math.sqrt(7)) * 28,
}))
// 按函数值采样，不跨越正切渐近线；正弦和余弦共享坐标刻度。
function trigPath(kind: 'sin' | 'cos' | 'tan') {
  return Array.from({ length: 161 }, (_, index) => {
    const fraction = index / 160
    if (kind === 'tan') {
      const x = (2 * fraction - 1) * Math.atan(3.2)
      return `${index ? 'L' : 'M'}${(150 + (230 * x) / Math.PI).toFixed(3)} ${(110 - 25 * Math.tan(x)).toFixed(3)}`
    }
    const x = fraction * 2 * Math.PI
    const y = kind === 'sin' ? Math.sin(x) : Math.cos(x)
    return `${index ? 'L' : 'M'}${(35 + fraction * 230).toFixed(3)} ${(100 - 50 * y).toFixed(3)}`
  }).join(' ')
}
const sinPath = trigPath('sin')
const cosPath = trigPath('cos')
const tanPath = trigPath('tan')
</script>

<style scoped lang="scss">
.math2-trigonometry-methods {
  container-type: inline-size;
}
.math2-trigonometry-methods :deep(h3 > span) {
  flex-shrink: 0;
  white-space: nowrap;
}
.trig-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  max-width: 680px;
  margin: 12px auto;
}
.trig-figure {
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.trig-figure svg {
  display: block;
  width: 100%;
  max-width: 310px;
  height: auto;
  margin: 0 auto;
}
.trig-figure svg text {
  fill: #344c6c;
  font-family: var(--font-family-base, sans-serif);
  font-size: 16px;
}
.trig-figure h4 {
  margin: 0 0 8px;
  font-size: 16px;
}
.trig-figure figcaption {
  margin: 8px 0 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
.trig-figure--single {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  max-width: 640px;
  margin: 12px auto;
}
.trig-figure--single figcaption {
  margin: 0;
}
@container (max-width: 600px) {
  .trig-pair {
    grid-template-columns: 1fr;
    max-width: 350px;
  }
  .trig-figure--single {
    grid-template-columns: 1fr;
    max-width: 350px;
    gap: 8px;
  }
}
@media (max-width: 600px) {
  .trig-figure {
    padding: 10px;
  }
}
</style>
