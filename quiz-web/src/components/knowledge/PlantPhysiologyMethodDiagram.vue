<!-- 植物生理静态图：叶片剖面、条件曲线、运输组织与吸水计分别解释一个问题。 -->
<template>
  <div class="plant-figures">
    <figure v-if="kind === 'leaf'" class="single-figure">
      <figcaption>叶片剖面：光、CO₂ 与水在叶肉细胞处汇合</figcaption>
      <svg
        viewBox="0 0 440 310"
        role="img"
        aria-label="叶片上表皮下是富含叶绿体的栅栏叶肉，海绵叶肉间有气腔，气孔供气体扩散，叶脉供应水并运出糖"
      >
        <path d="M40 48H309" stroke="#b4c9ad" stroke-width="5" />
        <rect x="40" y="52" width="269" height="22" fill="#f3f5e5" stroke="#88a47b" />
        <path
          v-for="x in [78, 116, 154, 192, 230, 268]"
          :key="x"
          :d="`M${x} 52V74`"
          stroke="#88a47b"
        />
        <g v-for="x in [46, 85, 124, 163, 202, 241, 280]" :key="x">
          <rect :x="x" y="78" width="29" height="67" rx="10" fill="#e0efce" stroke="#88a47b" />
          <ellipse
            v-for="y in [91, 111, 131]"
            :key="y"
            :cx="x + 8"
            :cy="y"
            rx="4"
            ry="7"
            fill="#5d9764"
          />
        </g>
        <g fill="#e8f1d8" stroke="#88a47b" stroke-width="1.5">
          <path
            d="M47 157Q79 147 87 169Q91 191 69 191L47 183Z M111 161Q139 149 150 170L140 188L115 185Z M174 153Q201 147 210 170L194 191L169 180Z M61 201Q87 187 107 209L99 226H63Z M125 204Q143 192 166 211L158 228H129Z M190 207Q214 188 229 213L221 228H192Z"
          />
        </g>
        <ellipse cx="267" cy="189" rx="36" ry="32" fill="#f4edda" stroke="#b8a37a" />
        <path d="M241 186A26 22 0 0 1 293 186Z" fill="#c4e1f7" stroke="#6898bc" />
        <path d="M241 193A26 22 0 0 0 293 193Z" fill="#ead5ad" stroke="#b58a43" />
        <rect x="40" y="232" width="117" height="21" fill="#f3f5e5" stroke="#88a47b" />
        <rect x="197" y="232" width="112" height="21" fill="#f3f5e5" stroke="#88a47b" />
        <ellipse cx="162" cy="243" rx="6" ry="15" fill="#a6cc91" stroke="#5d9764" />
        <ellipse cx="192" cy="243" rx="6" ry="15" fill="#a6cc91" stroke="#5d9764" />
        <g fill="none" stroke="#c49a33" stroke-width="2">
          <path d="M80 12V40 M75 33L80 40L85 33 M121 12V40 M116 33L121 40L126 33" />
        </g>
        <text x="146" y="29" class="small">光穿过表皮</text>
        <path
          d="M170 284V209 M165 216L170 209L175 216"
          fill="none"
          stroke="#087f76"
          stroke-width="2"
        />
        <path
          d="M183 209V284 M178 277L183 284L188 277"
          fill="none"
          stroke="#548ac1"
          stroke-width="2"
        />
        <text x="126" y="300" class="small">CO₂ 入</text>
        <text x="204" y="300" class="small">净放氧时：O₂ 出</text>
        <g class="leader">
          <path d="M309 62H327 M309 111H327 M297 174H327 M297 205H327 M309 243H327" />
        </g>
        <text x="332" y="67" class="small">上表皮</text>
        <text x="332" y="116" class="small">栅栏叶肉</text>
        <text x="332" y="179" class="small" fill="#548ac1">木质部供水</text>
        <text x="332" y="210" class="small" fill="#a87b35">韧皮部运糖</text>
        <text x="332" y="248" class="small">下表皮</text>
        <text x="44" y="280" class="small">内部气腔</text>
        <path d="M99 274L118 195" class="leader" />
      </svg>
    </figure>

    <figure v-else-if="kind === 'limiting'" class="single-figure chart">
      <figcaption>同样光强下，提高 CO₂ 后曲线能否抬高？</figcaption>
      <svg
        viewBox="0 0 400 260"
        role="img"
        aria-label="固定温度时，低和高二氧化碳条件的光合速率在弱光区相近，强光区提高二氧化碳可使速率提高"
      >
        <text x="16" y="22" class="small">光合作用速率</text>
        <path d="M45 36V211H372" class="axis" />
        <path
          d="M45 205C70 183 90 161 105 145C140 100 180 60 240 60H365"
          fill="none"
          stroke="#087f76"
          stroke-width="3"
        />
        <path
          d="M45 205C70 183 90 161 105 145C140 118 180 112 230 112H365"
          fill="none"
          stroke="#7958bb"
          stroke-width="3"
          stroke-dasharray="6 4"
        />
        <path d="M300 65V107 M295 72L300 65L305 72 M295 100L300 107L305 100" class="leader" />
        <path d="M300 113V211" class="guide" />
        <text x="239" y="48" class="small" fill="#087f76">较高 CO₂</text>
        <text x="239" y="101" class="small" fill="#7958bb">较低 CO₂</text>
        <text x="153" y="155" class="small">同光强、同温度比较</text>
        <text x="48" y="233" class="small">弱光</text>
        <text x="280" y="233" class="small">光照强度增加 →</text>
      </svg>
    </figure>

    <figure v-else-if="kind === 'net'" class="single-figure chart">
      <figcaption>净交换为零：两种过程相抵，不是停止</figcaption>
      <svg
        viewBox="0 0 400 260"
        role="img"
        aria-label="净放氧速率在黑暗或弱光时为负，补偿点为零，光照加强后为正；净零表示光合产氧与呼吸耗氧相等"
      >
        <text x="15" y="23" class="small">净放氧速率</text>
        <path d="M45 36V211H371" class="axis" />
        <path d="M45 150H372 M120 150V211" class="guide" />
        <text x="27" y="155" class="small">0</text>
        <path
          d="M45 195C70 188 94 165 120 150C174 119 215 66 281 66H365"
          fill="none"
          stroke="#087f76"
          stroke-width="3"
        />
        <circle cx="120" cy="150" r="5" fill="#087f76" />
        <path d="M124 155L150 177" class="leader" />
        <text x="157" y="184" class="small">产氧＝耗氧</text>
        <text x="233" y="53" class="small">净放氧（正）</text>
        <text x="166" y="129" class="small">光合与呼吸同时进行</text>
        <text x="53" y="235" class="small">弱光：净吸氧（负）</text>
        <text x="279" y="235" class="small">光照强度 →</text>
      </svg>
    </figure>

    <div v-else-if="kind === 'tissues'" class="figure-grid">
      <figure>
        <figcaption>木质部：中空、木质化，形成连续水路</figcaption>
        <svg
          viewBox="0 0 380 280"
          role="img"
          aria-label="木质部导管中空，木质化厚壁支撑，纹孔允许侧向水流，液态水主要向地上部移动"
        >
          <rect
            x="109"
            y="28"
            width="91"
            height="204"
            fill="#e5c18d"
            stroke="#a77d40"
            stroke-width="2"
          />
          <rect x="120" y="28" width="69" height="204" fill="#e3f1fc" />
          <g v-for="y in [72, 130, 188]" :key="y">
            <ellipse cx="114" :cy="y" rx="6" ry="9" fill="#f4f9fc" stroke="#a77d40" />
            <ellipse cx="195" :cy="y" rx="6" ry="9" fill="#f4f9fc" stroke="#a77d40" />
          </g>
          <path
            d="M154 215V51 M147 60L154 51L161 60 M168 130H222 M215 125L222 130L215 135"
            stroke="#548ac1"
            stroke-width="3"
            fill="none"
          />
          <path d="M202 44H234 M202 186H234" class="leader" />
          <text x="241" y="49" class="small">木质化厚壁</text>
          <text x="241" y="191" class="small">纹孔</text>
          <text x="240" y="123" class="small">可侧向流动</text>
          <text x="154" y="258" text-anchor="middle">主要运输水和矿物离子</text>
        </svg>
      </figure>
      <figure>
        <figcaption>韧皮部：筛板通汁液，伴胞支持代谢</figcaption>
        <svg
          viewBox="0 0 380 280"
          role="img"
          aria-label="活的筛管分子经筛板相连，旁有带细胞核的伴胞；图中示例糖由上方源流向下方库，实际方向由源库决定"
        >
          <rect
            x="98"
            y="28"
            width="81"
            height="204"
            rx="6"
            fill="#f7e9ca"
            stroke="#b49254"
            stroke-width="2"
          />
          <rect
            x="187"
            y="28"
            width="43"
            height="204"
            rx="12"
            fill="#e8e2f5"
            stroke="#7958bb"
            stroke-width="2"
          />
          <ellipse cx="208" cy="93" rx="12" ry="18" fill="#a68ac7" />
          <path
            v-for="y in [68, 144, 183]"
            :key="y"
            :d="`M201 ${y}q16-9 14 6q-10 11-14-6Z`"
            fill="#cfbde5"
            stroke="#9578b5"
          />
          <path d="M99 115H178 M99 124H178" stroke="#b49254" stroke-width="2" />
          <rect
            v-for="x in [108, 129, 150, 169]"
            :key="x"
            :x="x"
            y="114"
            width="6"
            height="12"
            fill="#f7e9ca"
          />
          <path
            d="M139 43V100 M134 93L139 100L144 93 M139 142V215 M134 208L139 215L144 208"
            stroke="#b0792c"
            stroke-width="2.5"
            fill="none"
          />
          <path d="M96 119H39 M231 92H251" class="leader" />
          <text x="19" y="108" class="small">筛板</text>
          <text x="258" y="88" class="small">伴胞</text>
          <text x="258" y="108" class="small">有细胞核</text>
          <text x="189" y="258" text-anchor="middle">本图示例：源在上、库在下</text>
        </svg>
      </figure>
    </div>

    <figure v-else class="single-figure potometer">
      <figcaption>气泡向枝条移动：量的是吸水体积</figcaption>
      <svg
        viewBox="0 0 480 315"
        role="img"
        aria-label="密封枝条吸水使毛细管气泡向枝条移动；虚线是起点，比较气泡同一端的位移，吸水体积等于管内横截面积乘位移"
      >
        <rect x="426" y="201" width="46" height="42" fill="#e3f1fc" />
        <path d="M425 193V244H473V193" class="leader" />
        <text x="449" y="183" text-anchor="middle" class="small">水源</text>
        <path d="M91 147V227H450 M107 147V211H450" fill="none" stroke="#86aac0" stroke-width="2" />
        <path d="M99 147V219H448" fill="none" stroke="#d2eaf8" stroke-width="12" />
        <rect x="83" y="132" width="33" height="22" rx="4" fill="#bdafa5" />
        <path
          d="M99 142V51 M99 92Q65 85 56 59Q94 50 99 92 M99 112Q134 100 144 72Q105 68 99 112 M99 65Q130 51 126 26Q98 29 99 65"
          fill="#bedb9e"
          stroke="#558c61"
          stroke-width="3"
        />
        <path d="M66 44V19 M61 26L66 19L71 26 M145 59L164 35 M155 38L164 35L162 44" class="arrow" />
        <text x="166" y="46" class="small">叶片失水</text>
        <text x="140" y="143" class="small">接头密封，导管避免进气</text>
        <rect
          x="287"
          y="213"
          width="19"
          height="12"
          rx="6"
          fill="white"
          stroke="#2453cd"
          stroke-width="2"
        />
        <rect
          x="365"
          y="213"
          width="19"
          height="12"
          rx="6"
          fill="none"
          stroke="#8797ab"
          stroke-dasharray="3 2"
        />
        <path
          d="M287 234V258 M365 234V258 M290 250H362 M297 245L290 250L297 255 M355 245L362 250L355 255"
          class="leader"
        />
        <text x="325" y="278" text-anchor="middle" class="small">Δx：左端到左端的距离</text>
        <text x="296" y="198" text-anchor="middle" class="small">终点</text>
        <text x="375" y="198" text-anchor="middle" class="small">起点</text>
        <path d="M337 177H294 M302 172L294 177L302 182" class="arrow" />
        <text x="43" y="277" class="small">管内面积 A</text>
        <path d="M113 270L171 224" class="leader" />
        <text x="266" y="308" text-anchor="middle" class="small">
          示例：0.5 mm² × 16 mm ÷ 2 min ＝ 4 mm³/min
        </text>
      </svg>
    </figure>
    <p class="figure-note">{{ notes[kind] }}</p>
  </div>
</template>

<script setup lang="ts">
import type { PlantPhysiologyDiagramKind } from '@/content/knowledge/plantPhysiologyMethods'

defineProps<{ kind: PlantPhysiologyDiagramKind }>()
const notes: Record<PlantPhysiologyDiagramKind, string> = {
  leaf: '常见陆生叶片的代表性剖面，结构不按比例。绿色小椭圆表示叶绿体；气孔同时允许水蒸气散失。氧的箭头限定为净放氧条件，不表示植物不呼吸。',
  limiting:
    '固定温度及材料等条件的示意曲线，没有指定数值或通用平台高度。弱光区接近不代表 CO₂ 永远不起作用；强光区差异来自对应条件下的受控比较。',
  net: '示意中呼吸速率视为稳定，纵轴为净量。补偿点处总光合和呼吸均可大于零；这不是光合作用速率达到最大值的位置。',
  tissues:
    '放大结构示意，省略多数细胞细节。右图仅选一个源—库方向；另一些筛管可以向上运输，不能把图中的箭头推广为韧皮部永远向下。',
  potometer:
    '仅示意测量通路，省略复位储水装置；毛细管外端接水源以供水。图上的像素距离不是实测刻度，计算使用题给 A、Δx 与时间。吸水不一定全转为蒸腾失水。',
}
</script>

<style scoped lang="scss">
.plant-figures {
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
  font-size: 16px;
  font-family: inherit;
}
svg text:not([fill]) {
  fill: #344767;
}
svg .small {
  font-size: 14px;
}
.axis,
.leader {
  fill: none;
  stroke: #8797ab;
  stroke-width: 1.6;
}
.arrow {
  fill: none;
  stroke: #548ac1;
  stroke-width: 2;
}
.guide {
  fill: none;
  stroke: #b1bccb;
  stroke-dasharray: 4 4;
}
.single-figure {
  max-width: 580px;
}
.single-figure svg {
  max-width: 530px;
}
.chart {
  max-width: 520px;
}
.chart svg {
  max-width: 460px;
}
.figure-note {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: #64748b;
}
@container (min-width: 760px) {
  .figure-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 420px) {
  figure {
    padding: 12px 8px;
  }
}
</style>
