<!-- 波的概念与方法：位置与时间图并列，光路和回波图就近解释，限制画布尺寸。 -->
<template>
  <KnowledgeMethodsArticle class="waves-methods" :lesson="lesson" label="波：概念与方法">
    <template #diagram="{ block }">
      <div v-if="code === '130601'" class="waves-pair">
        <figure v-for="time in [false, true]" :key="String(time)" class="waves-figure">
          <h4>{{ time ? '固定位置：读周期' : '固定时刻：读波长' }}</h4>
          <svg viewBox="0 0 300 185" role="img" :aria-labelledby="uid + '-wave-' + time">
            <title :id="uid + '-wave-' + time">
              {{
                time ? '位移对时间图，相邻峰间隔为周期 T。' : '位移对位置图，相邻峰间隔为波长 λ。'
              }}振幅从平衡位置量到峰。
            </title>
            <path d="M40 40V145 M40 95H280" fill="none" stroke="#64748b" stroke-width="1.5" />
            <path :d="wavePath" fill="none" stroke="#2453cd" stroke-width="2.5" />
            <path
              d="M65 51V35H165V51 M17 60H28 M22 60V95 M17 95H28"
              fill="none"
              stroke="#087f76"
              stroke-width="1.5"
            />
            <text x="43" y="18">位移</text>
            <text x="115" y="27" text-anchor="middle">{{ time ? 'T' : 'λ' }}</text>
            <text x="3" y="82">A</text>
            <text x="34" y="111" text-anchor="end">0</text>
            <text x="275" y="169" text-anchor="end">{{ time ? '时间 t' : '位置 x' }}</text>
          </svg>
          <figcaption>
            {{
              time
                ? '跟踪一个粒子：横向间隔用时间单位，不能读成距离。'
                : '拍下整段波：横向间隔用长度单位，不能读成周期。'
            }}
          </figcaption>
        </figure>
      </div>

      <figure
        v-else-if="code === '130603' && block.title.startsWith('反射角')"
        class="waves-figure waves-figure--single"
      >
        <svg viewBox="0 0 320 195" role="img" :aria-labelledby="uid + '-reflection'">
          <title :id="uid + '-reflection'">
            光线从左上射向镜面后向右上反射；入射角 i 与反射角 r 均从垂直镜面的法线量起。
          </title>
          <path d="M35 140H285" stroke="#64748b" stroke-width="3" />
          <path
            d="M50 141l-8 9 M80 141l-8 9 M110 141l-8 9 M140 141l-8 9 M170 141l-8 9 M200 141l-8 9 M230 141l-8 9 M260 141l-8 9"
            stroke="#98a8bb"
          />
          <path d="M160 25V175" stroke="#98a8bb" stroke-dasharray="4 4" />
          <path
            d="M60 40L160 140L260 40 M98 90H110V78 M210 102V90H198"
            fill="none"
            stroke="#2453cd"
            stroke-width="2.5"
          />
          <path
            d="M133 113A38 38 0 0 1 160 102 M160 102A38 38 0 0 1 187 113"
            fill="none"
            stroke="#087f76"
            stroke-width="1.5"
          />
          <text x="138" y="94">i</text>
          <text x="176" y="94">r</text>
          <text x="171" y="24">法线</text>
          <text x="240" y="176">镜面</text>
        </svg>
        <figcaption>
          角的顶点在入射点，起始边是法线。若题目给的是光线与镜面的夹角，先取余角，再用 i＝r。
        </figcaption>
      </figure>

      <figure v-else-if="code === '130603'" class="waves-figure waves-figure--single">
        <svg viewBox="0 0 320 205" role="img" :aria-labelledby="uid + '-refraction'">
          <title :id="uid + '-refraction'">
            光从较快介质斜入射到较慢介质，折射线向法线偏折，折射角小于入射角。
          </title>
          <rect x="20" y="100" width="280" height="95" rx="4" fill="#e4edff" />
          <path d="M20 100H300 M160 15V195" fill="none" stroke="#98a8bb" stroke-dasharray="4 4" />
          <path
            d="M60 20L160 100L195 180 M106 57l12 10-2-14 M181 147l9 21 4-14"
            fill="none"
            stroke="#2453cd"
            stroke-width="2.5"
          />
          <path
            d="M130 76A38 38 0 0 1 160 62 M160 142A42 42 0 0 0 177 138"
            fill="none"
            stroke="#087f76"
            stroke-width="1.5"
          />
          <text x="137" y="54">i</text>
          <text x="168" y="160">r</text>
          <text x="224" y="46">较快介质</text>
          <text x="35" y="153">较慢介质</text>
          <text x="174" y="19">法线</text>
        </svg>
        <figcaption>
          先沿箭头认清入射侧。图中 i＞r，进入较慢介质；静止界面两侧频率相同，较慢一侧波长更短。
        </figcaption>
      </figure>

      <figure v-else-if="code === '130604'" class="waves-figure waves-figure--single">
        <svg viewBox="0 0 330 205" role="img" :aria-labelledby="uid + '-echo'">
          <title :id="uid + '-echo'">
            同一次发射产生两个回波，分别在 t₁、t₂ 到达；它们的时间差对应两反射位置间的双程距离。
          </title>
          <path d="M35 40V155H312" fill="none" stroke="#64748b" stroke-width="1.5" />
          <path
            d="M40 155L44 62L48 155 M140 155L144 92L148 155 M250 155L254 110L258 155"
            fill="none"
            stroke="#2453cd"
            stroke-width="2.5"
          />
          <path d="M144 89V63H254V105" fill="none" stroke="#087f76" stroke-width="1.5" />
          <text x="199" y="55" text-anchor="middle">Δt＝t₂−t₁</text>
          <text x="44" y="28" text-anchor="middle">发射</text>
          <text x="144" y="183" text-anchor="middle">t₁</text>
          <text x="254" y="183" text-anchor="middle">t₂</text>
          <text x="44" y="183" text-anchor="middle">0</text>
          <text x="312" y="183" text-anchor="end">t</text>
          <text x="149" y="125">回波 1</text>
          <text x="259" y="137">回波 2</text>
        </svg>
        <figcaption>
          从发射时刻到 t₁，得到第一反射处距离 vt₁/2；两个回波的间隔 Δt 对应两反射处之间距离
          vΔt/2。脉冲高度不表示距离。
        </figcaption>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { wavesMethods, type WavesMethodCode } from '@/content/knowledge/wavesMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: WavesMethodCode }>()
const uid = useId()
// 每个考纲节点独立选择正文，切换章节时保持图文一致。
const lesson = computed(() => wavesMethods[props.code])
// 两图使用同一抽象波形，突出横轴改变后读数的不同含义。
const wavePath = Array.from({ length: 121 }, (_, index) => {
  const x = 40 + index * 2
  const y = 95 - 35 * Math.sin(((x - 40) * Math.PI) / 50)
  return `${index === 0 ? 'M' : 'L'}${x} ${y.toFixed(2)}`
}).join(' ')
</script>

<style scoped lang="scss">
.waves-methods {
  container-type: inline-size;
}
.waves-methods :deep(h3 > span) {
  flex-shrink: 0;
  white-space: nowrap;
}
.waves-figure {
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.waves-figure svg {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  margin: 0 auto;
}
.waves-figure svg text {
  fill: #344c6c;
  font-family: var(--font-family-base, sans-serif);
  font-size: 16px;
}
.waves-figure h4 {
  margin: 0 0 6px;
  font-size: 16px;
}
.waves-figure figcaption {
  margin-top: 8px;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
.waves-figure--single {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  max-width: 640px;
  margin: 12px auto;
}
.waves-figure--single figcaption {
  margin-top: 0;
}
.waves-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  max-width: 620px;
  margin: 12px auto;
}
.waves-pair svg {
  max-width: 280px;
}
@container (max-width: 560px) {
  .waves-figure--single {
    grid-template-columns: 1fr;
    max-width: 360px;
    gap: 8px;
  }
  .waves-pair {
    grid-template-columns: 1fr;
  }
  .waves-pair .waves-figure {
    width: 100%;
    max-width: 330px;
    box-sizing: border-box;
    justify-self: center;
  }
}
@media (max-width: 600px) {
  .waves-figure {
    padding: 10px;
  }
}
</style>
