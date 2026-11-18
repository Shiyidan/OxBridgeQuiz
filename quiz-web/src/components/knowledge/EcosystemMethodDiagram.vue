<!-- 生态系统机制图：箭头明确传递方向，取样图区分调查目标，示例数据标明统计口径。 -->
<template>
  <div class="ecosystem-figures">
    <div v-if="kind === 'food-web'" class="figure-grid">
      <figure>
        <figcaption>食物网：箭头从食物指向取食者</figcaption>
        <svg
          viewBox="0 0 400 270"
          role="img"
          aria-label="草被植食昆虫和兔取食，昆虫被鸟取食，鸟和兔被狐取食；狐减少可能经多个通路影响草"
        >
          <defs>
            <marker
              :id="`${id}-food`"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0 0L10 5L0 10Z" fill="#7b8e9d" />
            </marker>
          </defs>
          <g fill="none" stroke="#7b8e9d" stroke-width="2" :marker-end="`url(#${id}-food)`">
            <path d="M85 126L161 70 M85 152L161 207 M222 60H305 M222 209H305 M337 98V179" />
          </g>
          <g transform="translate(56 133)" stroke="#358866" stroke-width="2" fill="#b6d8a0">
            <path d="M0 25V-22 M0 8Q-35 1-27-22Q-2-20 0 8 M0-3Q31-7 26-31Q1-28 0-3" />
          </g>
          <text x="56" y="187" text-anchor="middle">草</text>
          <g transform="translate(192 60)" fill="#c3d6a4" stroke="#718856" stroke-width="2">
            <path d="M-18-5L-29-16 M-18 4L-30 15 M18-5L29-16 M18 4L30 15" />
            <ellipse rx="21" ry="13" />
            <path d="M-5-12V12 M5-12V12" />
          </g>
          <text x="192" y="101" text-anchor="middle" class="small">植食昆虫</text>
          <g transform="translate(192 208)" fill="#e1d2c3" stroke="#9b8370" stroke-width="1.5">
            <ellipse rx="25" ry="17" />
            <ellipse cx="17" cy="-16" rx="12" ry="13" />
            <ellipse cx="13" cy="-34" rx="4" ry="13" />
            <ellipse cx="22" cy="-32" rx="4" ry="12" />
            <circle cx="22" cy="-20" r="2" fill="#344767" />
          </g>
          <text x="192" y="250" text-anchor="middle">兔</text>
          <g transform="translate(337 60)" fill="#bccede" stroke="#69849e" stroke-width="1.5">
            <ellipse rx="22" ry="15" />
            <path d="M-19 0L-32-12L-28 7Z M6-9Q-3 12-18 4" />
            <circle cx="17" cy="-13" r="11" />
            <path d="M26-13L37-9L26-6" fill="#c5a46c" />
            <circle cx="20" cy="-16" r="2" fill="#344767" />
          </g>
          <text x="337" y="101" text-anchor="middle">鸟</text>
          <g transform="translate(337 208)" fill="#e5b17f" stroke="#ad7845" stroke-width="1.5">
            <path d="M-24 6Q-9-16 18-4L23-22L32-10L37 5L20 15H-20Q-42 21-40-5Z" />
            <circle cx="27" cy="0" r="2" fill="#344767" />
          </g>
          <text x="337" y="250" text-anchor="middle">狐</text>
        </svg>
      </figure>
      <figure>
        <figcaption>摄入能量，不会全部变成新生物量</figcaption>
        <svg
          viewBox="0 0 400 270"
          role="img"
          aria-label="假设消费者摄入1000能量单位，300未吸收或排出、550经呼吸最终散热、150进入新生物量，总和为1000"
        >
          <text x="32" y="35">摄入：1000 单位</text>
          <rect x="32" y="55" width="99" height="32" fill="#c8d4e0" />
          <rect x="131" y="55" width="181.5" height="32" fill="#dfba80" />
          <rect x="312.5" y="55" width="49.5" height="32" fill="#087f76" />
          <g
            v-for="(item, i) in energyBudget"
            :key="item.label"
            :transform="`translate(0,${i * 42})`"
          >
            <rect x="32" y="111" width="13" height="13" rx="2" :fill="item.color" />
            <text x="55" y="124" class="small">{{ item.label }}</text>
            <text x="354" y="124" text-anchor="end">{{ item.value }}</text>
          </g>
          <path d="M32 225H362" stroke="#d8e3ec" />
          <text x="32" y="252" class="small">分配示意：300 ＋ 550 ＋ 150 ＝ 1000</text>
        </svg>
      </figure>
    </div>

    <figure v-else-if="kind === 'carbon'" class="single-figure">
      <figcaption>同一个碳原子，可以经过不同路径回到 CO₂</figcaption>
      <svg
        viewBox="0 0 480 350"
        role="img"
        aria-label="二氧化碳通过光合作用进入生产者，摄食进入消费者；各类生物呼吸返回二氧化碳，遗体进入分解通路，长期储碳可经燃烧返回二氧化碳"
      >
        <defs>
          <marker
            :id="`${id}-carbon`"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#087f76" />
          </marker>
        </defs>
        <g fill="none" stroke="#087f76" stroke-width="1.8" :marker-end="`url(#${id}-carbon)`">
          <path d="M179 36H65V111" />
          <path d="M119 114V56H175" />
          <path d="M146 139H331" />
          <path d="M385 112V36H304" />
          <path d="M90 166V222H177 M385 166V222H305" />
          <path d="M178 240H16V28H175" />
          <path d="M240 246V288" />
          <path d="M304 309H449V20H304" />
        </g>
        <g v-for="node in carbonNodes" :key="node.label">
          <rect
            :x="node.x"
            :y="node.y"
            :width="node.w"
            height="46"
            rx="10"
            :fill="node.fill"
            stroke="#b8d2c8"
          />
          <text :x="node.x + node.w / 2" :y="node.y + 28" text-anchor="middle">
            {{ node.label }}
          </text>
        </g>
        <text x="20" y="91" class="small">光合</text>
        <text x="123" y="91" class="small">呼吸</text>
        <text x="210" y="129" class="small">摄食</text>
        <text x="392" y="90" class="small">呼吸</text>
        <text x="98" y="198" class="small">遗体等</text>
        <text x="324" y="198" class="small">遗体等</text>
        <text x="22" y="235" class="small">分解者呼吸</text>
        <text x="250" y="274" class="small">部分长期储存</text>
        <text x="410" y="286" class="small">燃烧</text>
      </svg>
    </figure>

    <figure v-else-if="kind === 'water'" class="single-figure">
      <figcaption>水有多条路径，并非每一滴都经过生物</figcaption>
      <svg
        viewBox="0 0 480 315"
        role="img"
        aria-label="水面蒸发和植物蒸腾形成水蒸气，凝结为云后降水；水可地表径流、下渗或被根吸收，地下水也可回到水体"
      >
        <defs>
          <marker
            :id="`${id}-water`"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#548ac1" />
          </marker>
        </defs>
        <path d="M22 206Q80 191 154 206L182 223H458V278H22Z" fill="#f0e5ce" />
        <path d="M22 206Q60 194 108 204Q135 209 162 211V238H22Z" fill="#d6eafa" stroke="#7bafd4" />
        <path
          d="M310 61C286 50 290 24 312 25C321 5 351 11 355 27C380 13 406 29 401 46C424 57 409 76 389 73H318Z"
          fill="#e8eff7"
          stroke="#9caec1"
        />
        <text x="352" y="51" text-anchor="middle" class="small">云：液滴／冰晶</text>
        <path
          d="M291 210V148 M291 174Q246 165 252 133Q288 131 291 174 M291 163Q337 145 327 118Q289 124 291 163"
          fill="#b2d49e"
          stroke="#5b9568"
          stroke-width="2"
        />
        <path d="M291 210L270 236 M291 210L312 238" fill="none" stroke="#947a50" stroke-width="2" />
        <g fill="none" stroke="#548ac1" stroke-width="2" :marker-end="`url(#${id}-water)`">
          <path d="M85 190V80H146" />
          <path d="M264 129V95H195" />
          <path d="M212 63H287" />
          <path d="M373 83V185" />
          <path d="M358 205H180" />
          <path d="M404 224V261" />
          <path d="M369 268H119V243" />
          <path d="M248 243L275 218" />
        </g>
        <text x="133" y="58" class="small">水蒸气</text>
        <text x="237" y="51" class="small">凝结</text>
        <text x="38" y="143" class="small">蒸发</text>
        <text x="218" y="116" class="small">蒸腾</text>
        <text x="385" y="138" class="small">降水</text>
        <text x="182" y="195" class="small">地表径流</text>
        <text x="416" y="246" class="small">下渗</text>
        <text x="192" y="258" class="small">根吸水</text>
        <text x="288" y="292" class="small">地下水流动</text>
      </svg>
    </figure>

    <div v-else-if="kind === 'sampling'" class="figure-grid">
      <figure v-for="transect in [false, true]" :key="String(transect)">
        <figcaption>
          {{ transect ? '样带：沿梯度比较分布' : '随机样方：估计目标区域平均值' }}
        </figcaption>
        <svg
          viewBox="0 0 400 265"
          role="img"
          :aria-label="
            transect
              ? '从水边到干地沿线布置等间距样方，用于观察分布随位置变化'
              : '在整片区域的坐标网格上随机选择样方位置，减少只挑某处的偏差'
          "
        >
          <defs>
            <linearGradient :id="`${id}-habitat-${transect}`" x1="0" x2="1">
              <stop stop-color="#d9edf4" />
              <stop offset="1" stop-color="#f2eccd" />
            </linearGradient>
          </defs>
          <rect
            x="44"
            y="32"
            width="320"
            height="176"
            rx="4"
            :fill="`url(#${id}-habitat-${transect})`"
          />
          <g stroke="#bacabf" stroke-width="0.7">
            <path v-for="x in [84, 124, 164, 204, 244, 284, 324]" :key="x" :d="`M${x} 32V208`" />
            <path v-for="y in [76, 120, 164]" :key="y" :d="`M44 ${y}H364`" />
          </g>
          <path
            v-if="transect"
            d="M44 120H364"
            stroke="#a87c40"
            stroke-width="2"
            stroke-dasharray="5 4"
          />
          <g v-for="(p, i) in transect ? transectQuadrats : randomQuadrats" :key="i">
            <rect
              :x="p[0]"
              :y="p[1]"
              width="27"
              height="27"
              fill="#fff"
              fill-opacity="0.8"
              stroke="#087f76"
              stroke-width="2"
            />
            <text :x="p[0]! + 13.5" :y="p[1]! + 19" text-anchor="middle" class="small">
              {{ i + 1 }}
            </text>
          </g>
          <text x="44" y="232" class="small">水边</text>
          <text x="334" y="232" class="small">干地</text>
          <text x="204" y="259" text-anchor="middle" class="small">
            {{
              transect
                ? '同步记录距离与环境变量，重复多条样带'
                : '先随机选位置，再记录；不是先找植物'
            }}
          </text>
        </svg>
      </figure>
    </div>

    <div v-else class="figure-grid eutrophication">
      <figure>
        <figcaption>从营养盐到缺氧：关键是呼吸耗氧</figcaption>
        <ol class="causal-chain">
          <li><strong>营养盐输入增加</strong><span>硝酸盐、磷酸盐等促进藻类增长。</span></li>
          <li>
            <strong>藻增、遮光及后续死亡</strong><span>部分植物受限，可分解有机物增加。</span>
          </li>
          <li class="key-step">
            <strong>分解者有氧呼吸增加</strong><span>耗氧超过补充时，溶解氧下降。</span>
          </li>
          <li><strong>敏感动物受影响</strong><span>鱼等可能缺氧死亡，物种组成改变。</span></li>
        </ol>
      </figure>
      <figure>
        <figcaption>不同措施，切断的是不同环节</figcaption>
        <svg
          viewBox="0 0 400 285"
          role="img"
          aria-label="减少营养盐排入针对源头，曝气补氧针对缺氧；水面藻层遮光，有机物沉降后分解者呼吸消耗氧"
        >
          <rect x="28" y="101" width="344" height="136" rx="8" fill="#e4f1f7" />
          <path d="M28 237H372V258H28Z" fill="#ddceb1" />
          <path
            d="M43 103Q65 91 84 103T126 102T171 102T213 102"
            fill="none"
            stroke="#719b50"
            stroke-width="10"
          />
          <path d="M26 52H97V85 M92 78L97 85L102 78" class="arrow" />
          <text x="16" y="33" class="small">减少营养盐排入</text>
          <text x="118" y="79" class="small">藻层</text>
          <path d="M144 117V193 M139 186L144 193L149 186" class="arrow" />
          <text x="43" y="161" class="small">有机物沉降</text>
          <g fill="#ad9061">
            <ellipse cx="123" cy="222" rx="8" ry="4" />
            <ellipse cx="150" cy="227" rx="8" ry="4" />
            <ellipse cx="176" cy="219" rx="8" ry="4" />
          </g>
          <text x="39" y="253" class="small">分解者呼吸耗氧</text>
          <path d="M301 75V215H268" fill="none" stroke="#8797ab" stroke-width="4" />
          <g fill="white" stroke="#79b1d1">
            <circle cx="268" cy="196" r="5" />
            <circle cx="278" cy="177" r="6" />
            <circle cx="264" cy="152" r="8" />
            <circle cx="282" cy="125" r="9" />
          </g>
          <text x="295" y="54" text-anchor="middle" class="small">曝气：补充氧</text>
          <text x="200" y="280" text-anchor="middle" class="small">缓解缺氧 ≠ 去除营养盐</text>
        </svg>
      </figure>
    </div>
    <p class="figure-note">{{ notes[kind] }}</p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import type { EcosystemDiagramKind } from '@/content/knowledge/ecosystemMethods'

defineProps<{ kind: EcosystemDiagramKind }>()
const id = useId()
const energyBudget = [
  { label: '未吸收／排出', value: 300, color: '#c8d4e0' },
  { label: '经呼吸等最终以热散失', value: 550, color: '#dfba80' },
  { label: '进入新生物量', value: 150, color: '#087f76' },
]
const carbonNodes = [
  { label: '环境中的 CO₂', x: 178, y: 13, w: 126, fill: '#edf3fc' },
  { label: '生产者', x: 36, y: 114, w: 110, fill: '#e8f3e1' },
  { label: '消费者', x: 333, y: 114, w: 105, fill: '#f8ead5' },
  { label: '遗体与分解通路', x: 178, y: 201, w: 126, fill: '#f0e8dd' },
  { label: '长期储碳', x: 178, y: 289, w: 126, fill: '#ece7e3' },
]
const randomQuadrats = [
  [55, 40],
  [179, 47],
  [291, 79],
  [101, 130],
  [231, 170],
  [327, 168],
]
const transectQuadrats = [
  [52, 106],
  [108, 106],
  [164, 106],
  [220, 106],
  [276, 106],
  [332, 106],
]
const notes: Record<EcosystemDiagramKind, string> = {
  'food-web':
    '左图只列部分食物关系，不能排除其他食物或天敌。右图为原创能量收支示例，口径是“已摄入能量”；不能直接把 150/1000 当成整个相邻营养级的传递效率。',
  carbon:
    '简化陆地碳通路，未穷尽海洋交换等过程。箭头表示过程和方向，不表示流量大小；“遗体与分解通路”包含进入分解者生物量及回到环境等不同去向。',
  water:
    '示意图并非只有一条闭合路线。云、土壤、地表水与地下水都可储水；植物的蒸腾把水带回空气，不是把水变成其他元素。',
  sampling:
    '编号是样方编号，不是植物数量；网格用于定位，不表示所有格子均已调查。两图调查目标不同，样带的系统布点不能直接当成全区随机样本。',
  eutrophication:
    '示意的是典型因果链，并非所有水体必然按相同时间变化。光合作用可以产氧；缺氧取决于总耗氧与补充的平衡，不能只凭藻多判断即时溶解氧。',
}
</script>

<style scoped lang="scss">
.ecosystem-figures {
  container-type: inline-size;
  max-width: 1040px;
}
.figure-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr);
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
  font-size: 16px;
  line-height: 1.6;
  color: #087f76;
  font-weight: 700;
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
.single-figure {
  max-width: 600px;
}
.single-figure svg {
  max-width: 540px;
}
.arrow {
  fill: none;
  stroke: #7b8e9d;
  stroke-width: 1.8;
}
.figure-note {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}
.causal-chain {
  list-style: none;
  padding: 0;
  margin: 14px 0 0;
  font-size: 15px;
}
.causal-chain li {
  position: relative;
  margin: 0 0 0 8px;
  padding: 9px 12px;
  border-left: 2px solid #b8cbbd;
}
.causal-chain li + li::before {
  content: '↓';
  position: absolute;
  top: -10px;
  left: -8px;
  background: white;
  color: #087f76;
}
.causal-chain span {
  display: block;
  margin-top: 3px;
  color: #52627c;
  line-height: 1.65;
}
.causal-chain .key-step {
  background: #edf7f3;
  border-color: #087f76;
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
