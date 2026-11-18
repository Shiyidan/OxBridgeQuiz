<!-- 动物生理静态机制图：数量与比例仅作教学示意，箭头表达通路、交换和反馈方向。 -->
<template>
  <div class="physiology-figures">
    <div v-if="kind === 'respirometer'" class="figure-grid">
      <figure v-for="control in [false, true]" :key="String(control)">
        <figcaption>
          {{ control ? '匹配对照：检查非呼吸因素' : '实验装置：耗氧使液滴向呼吸室移动' }}
        </figcaption>
        <svg
          viewBox="0 0 400 270"
          role="img"
          :aria-label="
            control
              ? '同温度、同气体体积，无呼吸材料的对照，液滴理想情况下不移动'
              : '动物与二氧化碳吸收剂隔开，氧被消耗后，毛细管液滴向密闭室移动'
          "
        >
          <path d="M208 100V60H42V222H208V112" fill="#f4f8fd" stroke="#8797ab" stroke-width="2" />
          <rect x="36" y="48" width="178" height="18" rx="3" fill="#b4a7a1" />
          <path d="M208 100H374 M208 112H374" class="axis" />
          <rect :x="control ? 340 : 292" y="100" width="9" height="12" rx="4" fill="#2453cd" />
          <path
            v-if="!control"
            d="M344 94V118 M338 132H304 M310 127L304 132L310 137"
            stroke="#2453cd"
            stroke-width="1.6"
            fill="none"
            stroke-dasharray="3 2"
          />
          <text x="289" y="83" text-anchor="middle" class="small">毛细管与液滴</text>
          <text x="288" y="164" text-anchor="middle" class="small">
            {{ control ? '理想情况：无净位移' : '向左移：室内气体减少' }}
          </text>
          <g v-if="!control" transform="translate(122 132)">
            <path
              d="M-26-10L-37-19 M-29 0L-40 0 M-26 10L-37 19 M26-10L37-19 M29 0L40 0 M26 10L37 19"
              stroke="#657766"
              stroke-width="2"
            />
            <ellipse rx="30" ry="20" fill="#becfba" stroke="#657766" stroke-width="2" />
            <path d="M-15-17V17 M-5-19V19 M5-19V19 M15-17V17" stroke="#7a9078" />
          </g>
          <g v-else fill="#c6cfd8" stroke="#8797ab">
            <circle cx="100" cy="132" r="14" />
            <circle cx="132" cy="132" r="14" />
            <circle cx="164" cy="132" r="14" />
          </g>
          <text x="125" y="94" text-anchor="middle" class="small">
            {{ control ? '等体积惰性材料' : '小型动物' }}
          </text>
          <path d="M48 174H202" stroke="#8797ab" stroke-dasharray="3 3" />
          <g fill="#e6c58d">
            <circle v-for="x in [65, 90, 115, 140, 165, 190]" :key="x" :cx="x" cy="199" r="8" />
          </g>
          <text x="125" y="247" text-anchor="middle" class="small">CO₂ 吸收剂（与材料隔开）</text>
        </svg>
      </figure>
    </div>

    <figure v-else-if="kind === 'circulation'" class="single-figure circulation">
      <figcaption>双循环：每完成一周，血液两次经过心脏</figcaption>
      <svg
        viewBox="0 0 480 350"
        role="img"
        aria-label="身体经腔静脉到右心房右心室，再经肺动脉到肺；肺静脉到左心房左心室，经主动脉回身体"
      >
        <defs>
          <marker
            :id="`${id}-blue`"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#2453cd" />
          </marker>
          <marker
            :id="`${id}-red`"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#bd5966" />
          </marker>
        </defs>
        <rect x="188" y="12" width="104" height="55" rx="23" fill="#f0f5fc" stroke="#8797ab" />
        <text x="240" y="37" text-anchor="middle">肺</text>
        <text x="240" y="57" text-anchor="middle" class="small">得氧、排 CO₂</text>
        <g v-for="(chamber, i) in chambers" :key="chamber.label">
          <rect
            :x="chamber.x"
            :y="chamber.y"
            width="90"
            height="45"
            rx="12"
            :fill="i < 2 ? '#eaf0fc' : '#fbecef'"
            :stroke="i < 2 ? '#2453cd' : '#bd5966'"
            stroke-width="2"
          />
          <text :x="chamber.x + 45" :y="chamber.y + 29" text-anchor="middle">
            {{ chamber.label }}
          </text>
        </g>
        <rect x="174" y="287" width="132" height="53" rx="12" fill="#f2f7ed" stroke="#879b74" />
        <text x="240" y="310" text-anchor="middle">身体组织</text>
        <text x="240" y="331" text-anchor="middle" class="small">耗氧、产生 CO₂</text>
        <g fill="none" stroke="#2453cd" stroke-width="3" :marker-end="`url(#${id}-blue)`">
          <path d="M174 312H35V134H64" />
          <path d="M109 157V187" />
          <path d="M154 210H173V40H185" />
        </g>
        <g fill="none" stroke="#bd5966" stroke-width="3" :marker-end="`url(#${id}-red)`">
          <path d="M292 40H371V108" />
          <path d="M371 157V187" />
          <path d="M416 210H445V312H309" />
        </g>
        <text x="69" y="270" class="small" fill="#2453cd">腔静脉</text>
        <text x="181" y="95" class="small" fill="#2453cd">肺动脉</text>
        <text x="310" y="85" class="small" fill="#bd5966">肺静脉</text>
        <text x="373" y="270" class="small" fill="#bd5966">主动脉</text>
        <text x="240" y="163" text-anchor="middle" class="small">右心 → 肺</text>
        <text x="240" y="187" text-anchor="middle" class="small">左心 → 身体</text>
      </svg>
    </figure>

    <figure v-else-if="kind === 'kidney'" class="single-figure">
      <figcaption>肾单位：有用的小分子也先进入滤液</figcaption>
      <svg
        viewBox="0 0 500 285"
        role="img"
        aria-label="血液在肾小球滤过，血细胞和大蛋白保留；水葡萄糖尿素进入滤液，葡萄糖和部分水重吸收回血液，剩余尿液排出"
      >
        <path
          d="M25 68H95C104 36 145 40 142 69C136 102 99 101 99 71C100 48 127 52 126 74L156 68H464"
          fill="none"
          stroke="#c6737b"
          stroke-width="12"
        />
        <path
          d="M76 80Q79 122 123 122H160V192Q160 215 188 215H211Q235 215 235 190V155Q235 133 260 133H325V230"
          fill="none"
          stroke="#c99e57"
          stroke-width="15"
        />
        <path
          d="M76 80Q79 122 123 122H160V192Q160 215 188 215H211Q235 215 235 190V155Q235 133 260 133H325V230"
          fill="none"
          stroke="#fcf0d8"
          stroke-width="10"
        />
        <text x="29" y="36" class="small">血液进入</text>
        <text x="293" y="40" class="small">血液带走重吸收物质</text>
        <ellipse cx="57" cy="68" rx="8" ry="4" fill="#9d3348" />
        <ellipse cx="390" cy="68" rx="8" ry="4" fill="#9d3348" />
        <path d="M120 87V109 M115 102L120 109L125 102" class="arrow" />
        <text x="183" y="101" class="small">① 滤过</text>
        <text x="26" y="155" class="small">肾小囊</text>
        <path
          d="M269 124V83 M264 90L269 83L274 90 M301 124V83 M296 90L301 83L306 90"
          stroke="#087f76"
          stroke-width="2"
          fill="none"
        />
        <text x="350" y="123" class="small" fill="#087f76">② 重吸收回血液</text>
        <text x="350" y="147" class="small">葡萄糖、部分水盐</text>
        <path d="M325 230V250 M320 243L325 250L330 243" class="arrow" />
        <text x="345" y="244" class="small">③ 尿液排出</text>
        <text x="25" y="264" class="small">正常：细胞、大蛋白留血中；小分子随滤液继续流动</text>
      </svg>
    </figure>

    <div v-else-if="kind === 'reflex'" class="figure-grid">
      <figure>
        <figcaption>撤回反射：信号有传入与传出</figcaption>
        <ol class="signal-path">
          <li><strong>感受器</strong><span>检测刺激</span></li>
          <li><strong>感觉神经元</strong><span>传入中枢</span></li>
          <li class="central"><strong>中间神经元</strong><span>位于脊髓等中枢内</span></li>
          <li><strong>运动神经元</strong><span>传出中枢</span></li>
          <li><strong>肌肉等效应器</strong><span>产生反应</span></li>
        </ol>
      </figure>
      <figure>
        <figcaption>化学突触：递质跨间隙，受体决定响应</figcaption>
        <svg
          viewBox="0 0 400 260"
          role="img"
          aria-label="神经递质从突触前末梢的小泡释放，扩散过间隙并结合突触后膜受体"
        >
          <path
            d="M48 25V133Q48 158 77 158H323Q352 158 352 133V25"
            fill="#eee7fa"
            stroke="#8b70b8"
            stroke-width="2"
          />
          <text x="200" y="52" text-anchor="middle">突触前末梢</text>
          <g v-for="x in [125, 200, 275]" :key="x">
            <circle :cx="x" cy="104" r="19" fill="white" stroke="#8b70b8" />
            <circle :cx="x - 5" cy="100" r="4" fill="#b77929" />
            <circle :cx="x + 5" cy="110" r="4" fill="#b77929" />
          </g>
          <path d="M200 127V181 M195 174L200 181L205 174" class="arrow" />
          <circle cx="191" cy="174" r="4" fill="#b77929" />
          <circle cx="213" cy="184" r="4" fill="#b77929" />
          <path d="M48 207H352V246H48Z" fill="#e0f2ed" stroke="#087f76" stroke-width="2" />
          <path
            v-for="x in [125, 200, 275]"
            :key="x"
            :d="`M${x - 8} 197V213H${x + 8}V197`"
            fill="white"
            stroke="#087f76"
            stroke-width="3"
          />
          <text x="62" y="187" class="small">突触间隙</text>
          <text x="313" y="188" class="small">受体</text>
          <text x="200" y="239" text-anchor="middle">突触后细胞</text>
        </svg>
      </figure>
    </div>

    <div v-else-if="kind === 'water'" class="figure-grid">
      <figure v-for="high in [true, false]" :key="String(high)">
        <figcaption>
          {{ high ? '失水时：ADH 较多，保留更多水' : '水较多时：ADH 较少，排出更多水' }}
        </figcaption>
        <svg
          viewBox="0 0 400 252"
          role="img"
          :aria-label="
            high
              ? '集合管水通道增加，更多水渗透到周围组织再回血液，尿量少而浓'
              : '集合管水通道较少，水重吸收减少，尿量多而稀'
          "
        >
          <rect x="32" y="57" width="155" height="164" rx="8" fill="#f2f7fe" />
          <rect x="187" y="57" width="16" height="164" fill="#e5d5be" />
          <rect x="323" y="57" width="43" height="164" rx="12" fill="#fae6e9" stroke="#c6737b" />
          <text x="108" y="35" text-anchor="middle">集合管管腔</text>
          <text x="292" y="35" text-anchor="middle">组织液 → 血液</text>
          <g v-for="y in high ? [92, 139, 186] : [139]" :key="y">
            <rect
              x="185"
              :y="y - 7"
              width="20"
              height="14"
              fill="white"
              stroke="#087f76"
              stroke-width="2"
            />
            <path
              :d="`M140 ${y}H302 M295 ${y - 5}L302 ${y}L295 ${y + 5}`"
              fill="none"
              stroke="#2453cd"
              stroke-width="2"
            />
          </g>
          <g v-for="y in [86, 125, 168, 202]" :key="y" fill="#78a7de">
            <circle cx="69" :cy="y" r="4" />
            <circle cx="108" :cy="y + 4" r="4" />
          </g>
          <ellipse
            v-for="y in [85, 132, 179]"
            :key="y"
            cx="345"
            :cy="y"
            rx="12"
            ry="5"
            fill="#d18590"
          />
          <text x="108" y="246" text-anchor="middle" class="small">
            {{ high ? '最终尿量少、较浓' : '最终尿量多、较稀' }}
          </text>
          <text x="284" y="246" text-anchor="middle" class="small">水沿渗透梯度移动</text>
        </svg>
      </figure>
    </div>

    <div v-else-if="kind === 'cycle'" class="figure-grid">
      <figure>
        <figcaption>卵巢激素：雌激素先升，孕激素后升</figcaption>
        <svg
          viewBox="0 0 400 260"
          role="img"
          aria-label="28天示意周期：雌激素在排卵前升高，孕激素主要在排卵后黄体期升高；未妊娠时二者下降"
        >
          <text x="17" y="23" class="small">相对水平（各曲线分别归一化）</text>
          <path d="M42 38V204H370" class="axis" />
          <path d="M205 40V204" class="guide" />
          <path
            d="M46 188C95 188 120 178 145 105C158 69 161 48 169 48C180 48 189 145 213 157C248 139 262 112 289 132S332 187 362 189"
            fill="none"
            stroke="#087f76"
            stroke-width="3"
          />
          <path
            d="M46 195H202C222 195 224 135 250 85C264 58 275 48 285 48C316 48 327 173 362 195"
            fill="none"
            stroke="#7958bb"
            stroke-width="3"
            stroke-dasharray="7 4"
          />
          <text x="82" y="82" class="small" fill="#087f76">雌激素</text>
          <text x="280" y="59" class="small" fill="#7958bb">孕激素</text>
          <text x="46" y="226" class="small">第 1 天</text>
          <text x="205" y="226" text-anchor="middle" class="small">示意排卵点</text>
          <text x="339" y="226" class="small">28 天</text>
          <text x="110" y="252" text-anchor="middle" class="small">卵泡期</text>
          <text x="287" y="252" text-anchor="middle" class="small">黄体期</text>
        </svg>
      </figure>
      <figure>
        <figcaption>把曲线变化对应到卵巢与子宫</figcaption>
        <ol class="cycle-events">
          <li><strong>卵泡发育</strong><span>FSH 促进发育；雌激素促进内膜增厚。</span></li>
          <li><strong>排卵前</strong><span>持续高雌激素正反馈，出现 LH 峰。</span></li>
          <li><strong>排卵后</strong><span>黄体形成、孕激素升高，维持内膜。</span></li>
          <li>
            <strong>未建立妊娠</strong><span>黄体退化、激素下降；内膜脱落，开始新周期。</span>
          </li>
        </ol>
      </figure>
    </div>

    <div v-else class="figure-grid">
      <figure>
        <figcaption>首次与再次接触：延迟和反应幅度不同</figcaption>
        <svg
          viewBox="0 0 400 260"
          role="img"
          aria-label="对同一抗原的首次抗体应答较慢且峰值较低，再次应答较快且更强；两条曲线各从接触时计时"
        >
          <text x="18" y="24" class="small">对应抗体水平（同一尺度）</text>
          <path d="M42 38V207H370" class="axis" />
          <path
            d="M43 203C87 203 101 185 135 158S189 139 221 169S293 198 361 201"
            fill="none"
            stroke="#a97939"
            stroke-width="3"
            stroke-dasharray="6 4"
          />
          <path
            d="M43 203C64 194 70 92 113 64S198 44 237 68S306 111 361 137"
            fill="none"
            stroke="#087f76"
            stroke-width="3"
          />
          <text x="181" y="43" class="small" fill="#087f76">再次接触：更快、更强</text>
          <text x="189" y="187" class="small" fill="#986729">首次接触</text>
          <text x="44" y="230" class="small">接触时</text>
          <text x="244" y="230" class="small">接触后经过的时间 →</text>
        </svg>
      </figure>
      <figure>
        <figcaption>记忆留在细胞中，抗体由浆细胞分泌</figcaption>
        <svg
          viewBox="0 0 400 260"
          role="img"
          aria-label="相应B细胞活化增殖分化，产生分泌抗体的浆细胞以及保留的记忆B细胞"
        >
          <g v-for="cell in immuneCells" :key="cell.label">
            <ellipse
              :cx="cell.x"
              :cy="cell.y"
              rx="29"
              ry="25"
              :fill="cell.fill"
              stroke="#7958bb"
              stroke-width="2"
            />
            <ellipse :cx="cell.x - 4" :cy="cell.y + 1" rx="14" ry="17" fill="#b29ace" />
            <text :x="cell.x" :y="cell.y + 47" text-anchor="middle" class="small">
              {{ cell.label }}
            </text>
          </g>
          <path
            d="M113 120L218 69 M210 68L218 69L214 77 M113 120L218 179 M210 180L218 179L214 171"
            class="arrow"
          />
          <text x="124" y="26" class="small">活化、增殖与分化</text>
          <path d="M282 65H312 M305 60L312 65L305 70" class="arrow" />
          <g
            v-for="p in [
              [336, 43],
              [353, 78],
              [327, 96],
            ]"
            :key="p[0]"
            :transform="`translate(${p[0]},${p[1]})`"
            stroke="#087f76"
            stroke-width="3"
            fill="none"
          >
            <path d="M0 12V0L-7-8 M0 0L7-8" />
          </g>
          <text x="341" y="130" text-anchor="middle" class="small">抗体</text>
          <text x="216" y="251" text-anchor="middle" class="small">
            再次遇到匹配抗原 → 迅速应答
          </text>
        </svg>
      </figure>
    </div>
    <p class="figure-note">{{ notes[kind] }}</p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import type { AnimalPhysiologyDiagramKind } from '@/content/knowledge/animalPhysiologyMethods'

defineProps<{ kind: AnimalPhysiologyDiagramKind }>()
const id = useId()
const chambers = [
  { label: '右心房', x: 64, y: 111 },
  { label: '右心室', x: 64, y: 188 },
  { label: '左心房', x: 326, y: 111 },
  { label: '左心室', x: 326, y: 188 },
]
const immuneCells = [
  { label: '相应 B 细胞', x: 80, y: 120, fill: '#eee7fa' },
  { label: '浆细胞', x: 250, y: 65, fill: '#e1f2ed' },
  { label: '记忆 B 细胞', x: 250, y: 180, fill: '#eee7fa' },
]
const notes: Record<AnimalPhysiologyDiagramKind, string> = {
  respirometer:
    '示意装置要求气密、温度稳定且 CO₂ 被充分吸收；对照匹配气体体积等条件。虚线标记液滴起点，真实位移需按管径换算为体积。',
  circulation:
    '功能通路图，不按解剖比例。蓝色表示相对低氧、红色表示相对高氧；两者都不是“完全无氧／只有氧”。沿箭头读名称，不能用动静脉名称代替含氧量判断。',
  kidney:
    '肾单位的功能简图，省略各段的细致形态与分泌等过程。图中肾小球后的血液路径概括周围毛细血管，滤液通路与血液通路彼此区分。',
  reflex:
    '以含中间神经元的撤回反射为例；并非所有反射都必须具有相同数量的神经元。右图只放大一个化学突触，不代表整个反射弧。',
  water:
    '通道数与箭头数仅示意通透性和水流变化，不表示定量比例。假设肾脏功能、渗透梯度及其他影响因素相近；水重吸收增加不代表所有溶质都同步增加。',
  cycle:
    '28 天仅为教学模型，曲线不用于确定个人排卵日期。两条曲线分别归一化，只比较各自随时间的变化，不比较两种激素的绝对浓度。',
  immunity:
    '曲线为同一抗原的典型应答示意，各自从接触时开始计时，不是先后排列的两次接触记录。细胞图省略辅助信号；记忆主要针对匹配抗原，不是对所有病原通用。',
}
</script>

<style scoped lang="scss">
.physiology-figures {
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
  max-width: 460px;
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
.single-figure {
  max-width: 600px;
}
.single-figure svg {
  max-width: 560px;
}
.axis,
.arrow {
  fill: none;
  stroke: #8797ab;
  stroke-width: 1.8;
}
.arrow {
  stroke: #087f76;
}
.guide {
  fill: none;
  stroke: #b1bccb;
  stroke-dasharray: 4 4;
}
.figure-note {
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
  margin: 10px 0 0;
}
.signal-path,
.cycle-events {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  font-size: 15px;
}
.signal-path li {
  display: flex;
  gap: 16px;
  padding: 9px 12px;
  margin-left: 12px;
  border-left: 2px solid #a8cdbf;
  position: relative;
}
.signal-path li::before {
  content: '↓';
  position: absolute;
  left: -8px;
  top: -11px;
  color: #087f76;
  background: white;
}
.signal-path li:first-child::before {
  content: '';
}
.signal-path .central {
  background: #f1edf9;
  border-left-color: #7958bb;
}
.signal-path strong {
  min-width: 106px;
}
.signal-path span,
.cycle-events span {
  color: #52627c;
}
.cycle-events li {
  padding: 9px 0;
  border-bottom: 1px solid #e6ebf2;
}
.cycle-events li:last-child {
  border-bottom: 0;
}
.cycle-events span {
  display: block;
  margin-top: 3px;
  line-height: 1.65;
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
  .signal-path li {
    gap: 8px;
    padding-right: 0;
  }
}
</style>
