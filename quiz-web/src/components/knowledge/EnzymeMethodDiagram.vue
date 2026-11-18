<!-- 酶讲义专用紧凑 SVG：对照同时显示，坐标含义和模型适用条件就近标注。 -->
<template>
  <div class="enzyme-figures">
    <div v-if="code === '150801'" class="figure-grid">
      <figure>
        <figcaption>能量图：峰降低，起终点不变</figcaption>
        <svg
          viewBox="0 0 400 255"
          role="img"
          aria-label="同一反应有酶时能量峰较低，反应物与产物的能量相同；活化能从反应物水平量起"
        >
          <text x="18" y="22">能量</text>
          <path d="M45 35V212H372" class="axis" />
          <path
            d="M55 156H97C144 156 151 45 202 45S260 181 310 181H356"
            class="curve"
            stroke="#a97939"
          />
          <path
            d="M55 156H97C144 156 151 110 202 110S260 181 310 181H356"
            class="curve"
            stroke="#087f76"
          />
          <path d="M98 156H250 M202 45H240 M202 110H175" class="guide" />
          <path
            d="M235 47V154 M231 53L235 47L239 53 M231 148L235 154L239 148"
            stroke="#a97939"
            fill="none"
            stroke-width="1.8"
          />
          <path
            d="M175 112V154 M171 118L175 112L179 118 M171 148L175 154L179 148"
            stroke="#087f76"
            fill="none"
            stroke-width="1.8"
          />
          <text x="249" y="81" class="small" fill="#986729">无酶：障碍高</text>
          <text x="55" y="102" class="small" fill="#087f76">有酶：障碍低</text>
          <text x="53" y="148" class="small">反应物</text>
          <text x="311" y="173" class="small">产物</text>
          <text x="205" y="239" text-anchor="middle">反应进程（不是时间）</text>
        </svg>
      </figure>
      <figure>
        <figcaption>时间图：更快达到相同终点</figcaption>
        <svg
          viewBox="0 0 400 255"
          role="img"
          aria-label="固定底物且充分完成的示意反应：有酶曲线更快上升，两条曲线达到相同产物量"
        >
          <text x="18" y="22">产物量</text>
          <path d="M45 35V212H372" class="axis" />
          <path d="M45 61H360 M145 61V212" class="guide" />
          <path d="M45 212C78 89 109 61 148 61H360" class="curve" stroke="#087f76" />
          <path
            d="M45 212C80 197 120 173 145 149C205 91 260 61 330 61H360"
            class="curve"
            stroke="#a97939"
          />
          <text x="55" y="48" class="small">相同终点</text>
          <text x="93" y="104" class="small" fill="#087f76">有酶</text>
          <text x="247" y="131" class="small" fill="#986729">无酶</text>
          <circle cx="145" cy="61" r="4" fill="#087f76" />
          <circle cx="145" cy="149" r="4" fill="#a97939" />
          <text x="146" y="233" text-anchor="middle" class="small">比较同一时刻</text>
          <text x="344" y="239">时间</text>
        </svg>
      </figure>
    </div>
    <div v-else-if="code === '150802'" class="figure-grid cycle-grid">
      <figure v-for="(stage, i) in cycle" :key="stage.title">
        <figcaption>{{ i + 1 }} · {{ stage.title }}</figcaption>
        <svg viewBox="0 0 300 225" role="img" :aria-label="stage.description">
          <path
            :d="
              i === 1
                ? 'M112 100C66 74 43 113 58 153C64 185 95 202 128 190C173 210 228 188 239 155C256 118 217 75 188 100L181 128H119Z'
                : 'M112 100C66 74 43 113 58 153C64 185 95 202 128 190C173 210 228 188 239 155C256 118 217 75 188 100L188 126H112Z'
            "
            fill="#e6e2f7"
            stroke="#7958bb"
            stroke-width="2.5"
          />
          <path
            d="M80 134Q89 117 98 137 M94 166Q117 180 128 163 M191 147Q219 157 209 172"
            fill="none"
            stroke="#b4a0d7"
            stroke-width="3"
          />
          <g :transform="`translate(0,${i === 1 ? 69 : 0})`">
            <path
              :d="i === 2 ? 'M85 35H113V58H85Z' : 'M120 35H148V58H120Z'"
              fill="#edc68a"
              stroke="#ac7529"
              stroke-width="2"
            />
            <path
              :d="i === 2 ? 'M190 35H218V58H190Z' : 'M152 35H180V58H152Z'"
              fill="#93cdc1"
              stroke="#087f76"
              stroke-width="2"
            />
            <path v-if="i < 2" d="M148 46H152" stroke="#52627c" stroke-width="2" />
          </g>
          <template v-if="i === 0">
            <text x="150" y="24" text-anchor="middle">底物</text>
            <path d="M150 65V93 M145 86L150 93L155 86" class="axis" />
            <path d="M192 112H231V91" class="axis" />
            <text x="231" y="80" text-anchor="middle" class="small">活性位点</text>
          </template>
          <template v-else-if="i === 1">
            <text x="150" y="33" text-anchor="middle">酶—底物复合物</text>
            <text x="150" y="64" text-anchor="middle" class="small">结合时局部调整，催化转化</text>
          </template>
          <template v-else>
            <text x="150" y="23" text-anchor="middle">产物离开</text>
            <path
              d="M128 95L105 67 M105 67L106 76 M105 67L114 70 M172 95L199 67 M199 67L190 70 M199 67L198 76"
              class="axis"
            />
          </template>
          <text x="150" y="219" text-anchor="middle" class="small">{{ stage.footer }}</text>
        </svg>
      </figure>
    </div>
    <div v-else-if="code === '150803'" class="figure-grid">
      <figure>
        <figcaption>温度：碰撞增加与结构损伤共同影响</figcaption>
        <svg
          viewBox="0 0 400 250"
          role="img"
          aria-label="酶促初始速率随温度先升后降；低温有效碰撞较少，过高温度可导致变性"
        >
          <text x="18" y="22">初始速率</text>
          <path d="M45 35V208H370" class="axis" />
          <path
            d="M55 198C115 194 173 163 228 68C246 39 254 52 269 95C289 157 308 202 354 203"
            class="curve"
            stroke="#087f76"
          />
          <path d="M245 55V208" class="guide" />
          <text x="68" y="130" class="small">有效碰撞增加</text>
          <text x="274" y="48" class="small">活性酶减少</text>
          <text x="62" y="232" class="small">低温</text>
          <text x="245" y="232" text-anchor="middle" class="small">峰值附近</text>
          <text x="333" y="232" class="small">高温</text>
        </svg>
      </figure>
      <figure>
        <figcaption>pH：不同酶的适宜范围不同</figcaption>
        <svg
          viewBox="0 0 400 250"
          role="img"
          aria-label="两种酶的pH活性曲线峰值分别偏酸性与偏碱性，不存在所有酶通用的最适pH"
        >
          <text x="18" y="22">相对活性</text>
          <path d="M45 35V208H370" class="axis" />
          <path d="M55 190C75 185 77 63 113 63S151 207 207 207" class="curve" stroke="#087f76" />
          <path
            d="M121 207C193 207 203 63 263 63S310 200 355 207"
            class="curve"
            stroke="#7958bb"
            stroke-dasharray="7 4"
          />
          <text x="79" y="48" class="small" fill="#087f76">酶 A</text>
          <text x="253" y="48" class="small" fill="#7958bb">酶 B</text>
          <text x="60" y="232" class="small">酸性</text>
          <text x="200" y="232" class="small">中性</text>
          <text x="310" y="232" class="small">碱性 → pH</text>
        </svg>
      </figure>
    </div>
    <div v-else class="figure-grid">
      <figure>
        <figcaption>乳化：一个大滴分散为多个小滴</figcaption>
        <svg
          viewBox="0 0 400 240"
          role="img"
          aria-label="胆盐将大脂肪滴分散为小脂肪滴，脂肪总量不变，脂肪分子的化学键未被水解"
        >
          <circle cx="87" cy="114" r="47" fill="#fae7bf" stroke="#ba883c" stroke-width="2" />
          <g v-for="(drop, i) in droplets" :key="i">
            <circle
              :cx="drop[0]"
              :cy="drop[1]"
              r="23.5"
              fill="#fae7bf"
              stroke="#ba883c"
              stroke-width="1.5"
            />
          </g>
          <path d="M145 114H201 M194 109L201 114L194 119" class="axis" />
          <text x="171" y="97" text-anchor="middle" class="small">胆盐</text>
          <text x="87" y="179" text-anchor="middle">脂肪大滴</text>
          <text x="287" y="214" text-anchor="middle">更多可接触的表面</text>
          <text x="87" y="202" text-anchor="middle" class="small">分子未被切断</text>
        </svg>
      </figure>
      <figure>
        <figcaption>水解：切断脂肪分子的酯键</figcaption>
        <svg
          viewBox="0 0 400 240"
          role="img"
          aria-label="胰脂肪酶水解三酰甘油，主要形成单甘油酯和两个脂肪酸；图示分子结构关系不是脂肪滴大小"
        >
          <path
            d="M52 70V150 M52 70H75 M52 110H75 M52 150H75"
            fill="none"
            stroke="#7958bb"
            stroke-width="5"
          />
          <path
            d="M75 70L86 63L97 77L108 63L119 77L130 70 M75 110L86 103L97 117L108 103L119 117L130 110 M75 150L86 143L97 157L108 143L119 157L130 150"
            fill="none"
            stroke="#b87b29"
            stroke-width="3"
          />
          <circle cx="68" cy="70" r="9" fill="none" stroke="#c55c4b" stroke-dasharray="3 2" />
          <circle cx="68" cy="150" r="9" fill="none" stroke="#c55c4b" stroke-dasharray="3 2" />
          <path d="M150 110H215 M208 105L215 110L208 115" class="axis" />
          <text x="183" y="83" text-anchor="middle" class="small">脂肪酶</text>
          <text x="183" y="142" text-anchor="middle" class="small">＋水</text>
          <path d="M249 70V150 M249 110H272" fill="none" stroke="#7958bb" stroke-width="5" />
          <path
            d="M272 110L283 103L294 117L305 103L316 117L327 110 M284 47L295 40L306 54L317 40L328 54L339 47 M284 173L295 166L306 180L317 166L328 180L339 173"
            fill="none"
            stroke="#b87b29"
            stroke-width="3"
          />
          <circle cx="279" cy="47" r="4" fill="#087f76" />
          <circle cx="279" cy="173" r="4" fill="#087f76" />
          <text x="310" y="29" text-anchor="middle" class="small">游离脂肪酸</text>
          <text x="91" y="203" text-anchor="middle">三酰甘油</text>
          <text x="274" y="203" text-anchor="middle" class="small">单甘油酯 ＋ 2 个脂肪酸</text>
          <text x="200" y="232" text-anchor="middle" class="small">
            紫色：甘油部分　橙色：脂肪酸链
          </text>
        </svg>
      </figure>
    </div>
    <p class="diagram-caption">{{ captions[code] }}</p>
  </div>
</template>

<script setup lang="ts">
import type { EnzymeMethodCode } from '@/content/knowledge/enzymeMethods'

defineProps<{ code: EnzymeMethodCode }>()
const cycle = [
  {
    title: '底物接近并结合',
    description: '底物接近具有相容形状和化学性质的活性位点',
    footer: '只有局部区域承担结合与催化',
  },
  {
    title: '形成复合物并转化',
    description: '活性位点局部调整，形成酶底物复合物并催化底物转化',
    footer: '正常诱导契合，不等于变性',
  },
  {
    title: '释放产物，酶可再用',
    description: '分解反应形成的两个产物离开，酶恢复可用状态',
    footer: '底物已改变；酶进入下一轮循环',
  },
]
const droplets = [
  [247, 57],
  [301, 57],
  [224, 105],
  [278, 105],
  [332, 105],
  [247, 153],
  [301, 153],
  [355, 153],
]
const captions: Record<EnzymeMethodCode, string> = {
  '150801':
    '两张图的横轴不同：左侧是反应进程，右侧才是时间。均为机制示意；时间图假设底物固定、条件相同且反应充分完成，不代表任意实际反应都具有相同曲线。',
  '150802':
    '形状是分解反应的示意，不代表真实分子比例。两种颜色标记底物的两部分，释放后成为两个产物；专一性还取决于活性位点的化学性质。',
  '150803':
    '示意曲线不提供固定的最适温度或 pH 数值。左侧在各温度下直接测量；右侧两种酶的曲线分别归一化，只比较适宜 pH，不能比较其绝对催化能力。',
  '150804':
    '左侧比较脂肪滴，右侧放大到分子层次，不能互相当作尺度图。右侧示意胰脂肪酶的主要直接产物；不是脂肪完全水解的唯一终点。',
}
</script>

<style scoped lang="scss">
.enzyme-figures {
  container-type: inline-size;
  max-width: 1040px;
}
.figure-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
}
figure {
  min-width: 0;
  margin: 0;
  padding: 14px 16px;
  border: 1px solid #c8e8df;
  border-radius: 10px;
  background: #fff;
}
figcaption {
  color: #087f76;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.6;
}
svg {
  display: block;
  width: 100%;
  max-width: 440px;
  height: auto;
  margin: 10px auto 0;
}
svg text {
  font-family: inherit;
  font-size: 16px;
}
svg text:not([fill]) {
  fill: #344767;
}
svg .small {
  font-size: 14px;
}
.axis {
  fill: none;
  stroke: #8797ab;
  stroke-width: 1.6;
}
.curve {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
}
.guide {
  fill: none;
  stroke: #b1bccb;
  stroke-width: 1;
  stroke-dasharray: 4 4;
}
.cycle-grid svg {
  max-width: 320px;
}
.diagram-caption {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}
@container (min-width: 740px) {
  .figure-grid:not(.cycle-grid) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@container (min-width: 930px) {
  .cycle-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
