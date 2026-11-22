<!-- 磁学讲义配图：固定观察方向，对照电流、受力与感应；窄屏自然堆叠。 -->
<template>
  <KnowledgeMethodsArticle class="magnetism-methods" :lesson="lesson" label="磁学：概念与方法">
    <template #diagram="{ block }">
      <figure v-if="code === '130201'" class="magnetism-figure magnetism-figure--single">
        <svg viewBox="90 10 260 200" role="img" :aria-labelledby="uid + '-bar'">
          <title :id="uid + '-bar'">
            条形磁体左端 N，右端 S；上、下外部磁场线从 N 绕行到 S，内部从 S 返回 N。
          </title>
          <path
            d="M150 100C55 8 385 8 290 100 M150 120C55 212 385 212 290 120"
            fill="none"
            stroke="#2453cd"
            stroke-width="2"
          />
          <path
            d="M218 31L229 31L222 25 M229 31L222 37 M218 189L229 189L222 183 M229 189L222 195"
            fill="none"
            stroke="#2453cd"
            stroke-width="2"
          />
          <rect x="150" y="87" width="70" height="46" fill="#ffede5" stroke="#ba7953" />
          <rect x="220" y="87" width="70" height="46" fill="#edf3ff" stroke="#7193c6" />
          <text x="174" y="115" text-anchor="middle">N</text>
          <text x="269" y="115" text-anchor="middle">S</text>
          <path
            d="M244 110H197L204 104 M197 110L204 116"
            fill="none"
            stroke="#087f76"
            stroke-width="2"
          />
          <text x="220" y="68" text-anchor="middle">外部 N → S</text>
          <text x="220" y="157" text-anchor="middle">内部 S → N</text>
        </svg>
        <figcaption>
          磁场方向沿曲线切线；磁针的 N 极沿当地箭头指向。图中只画两条代表性外部场线。
        </figcaption>
      </figure>

      <div
        v-else-if="code === '130202' && block.title.startsWith('直导线')"
        class="magnetism-comparison"
      >
        <div class="magnetism-pair">
          <figure v-for="out in [true, false]" :key="String(out)" class="magnetism-figure">
            <h4>{{ out ? '电流出纸面 ⊙' : '电流入纸面 ⊗' }}</h4>
            <svg viewBox="0 0 260 210" role="img" :aria-labelledby="uid + '-wire-' + out">
              <title :id="uid + '-wire-' + out">
                {{ out ? '电流出纸面，磁场逆时针环绕。' : '电流入纸面，磁场顺时针环绕。' }}
              </title>
              <circle
                v-for="radius in [48, 74]"
                :key="radius"
                cx="130"
                cy="100"
                :r="radius"
                stroke="#2453cd"
                fill="none"
                stroke-width="2"
              />
              <path
                :d="out ? 'M141 52H119L128 46 M119 52L128 58' : 'M119 52H141L132 46 M141 52L132 58'"
                stroke="#2453cd"
                fill="none"
                stroke-width="2"
              />
              <circle cx="130" cy="100" r="13" stroke="#425574" stroke-width="2" fill="#fff" />
              <circle v-if="out" cx="130" cy="100" r="4" fill="#425574" />
              <path v-else d="M122 92L138 108 M122 108L138 92" stroke="#425574" stroke-width="2" />
              <text x="130" y="199" text-anchor="middle">{{ out ? 'B 逆时针' : 'B 顺时针' }}</text>
            </svg>
            <figcaption>
              {{ out ? '拇指朝自己，四指逆时针。' : '拇指背离自己，四指顺时针。' }}
            </figcaption>
          </figure>
        </div>
      </div>

      <figure v-else-if="code === '130202'" class="magnetism-figure magnetism-figure--single">
        <svg viewBox="65 0 310 215" role="img" :aria-labelledby="uid + '-coil'">
          <title :id="uid + '-coil'">
            螺线管轴向剖视，上侧电流出纸面、下侧入纸面，内部磁场向右，左端 S、右端 N。
          </title>
          <path
            d="M319 66C361 4 79 4 121 66 M319 150C361 212 79 212 121 150"
            fill="none"
            stroke="#7193c6"
            stroke-width="2"
          />
          <path
            d="M231 20H210L218 14 M210 20L218 26 M231 196H210L218 190 M210 196L218 202"
            stroke="#7193c6"
            fill="none"
            stroke-width="2"
          />
          <rect
            x="106"
            y="57"
            width="228"
            height="101"
            rx="8"
            fill="#f0f6ff"
            stroke="#c4d4ec"
            stroke-dasharray="4 4"
          />
          <g v-for="x in [130, 175, 220, 265, 310]" :key="x">
            <circle :cx="x" cy="71" r="8" stroke="#425574" fill="#fff" stroke-width="1.5" />
            <circle :cx="x" cy="71" r="2.5" fill="#425574" />
            <circle :cx="x" cy="144" r="8" stroke="#425574" fill="#fff" stroke-width="1.5" />
            <path
              :d="
                'M' + (x - 5) + ' 139L' + (x + 5) + ' 149 M' + (x - 5) + ' 149L' + (x + 5) + ' 139'
              "
              stroke="#425574"
              stroke-width="1.5"
            />
          </g>
          <path
            v-for="y in [99, 116]"
            :key="y"
            :d="'M124 ' + y + 'H313L305 ' + (y - 5) + ' M313 ' + y + 'L305 ' + (y + 5)"
            stroke="#2453cd"
            fill="none"
            stroke-width="2"
          />
          <text x="84" y="112" text-anchor="middle">S</text>
          <text x="356" y="112" text-anchor="middle">N</text>
          <text x="220" y="181" text-anchor="middle">内部 B 向右</text>
        </svg>
        <figcaption>
          沿轴剖视示意：上侧 ⊙、下侧 ⊗ 是绕线在截面上的电流方向；内部场由 S 指向 N，外部返回。
        </figcaption>
      </figure>

      <div v-else-if="code === '130203'" class="magnetism-comparison">
        <div class="magnetism-pair">
          <figure v-for="out in [true, false]" :key="String(out)" class="magnetism-figure">
            <h4>{{ out ? '电流出纸面：力向上' : '仅反转电流：力向下' }}</h4>
            <svg viewBox="0 0 280 225" role="img" :aria-labelledby="uid + '-force-' + out">
              <title :id="uid + '-force-' + out">
                磁场向右，{{ out ? '电流出纸面，导线磁力向上。' : '电流入纸面，导线磁力向下。' }}
              </title>
              <path
                v-for="y in [72, 110, 148]"
                :key="y"
                :d="'M24 ' + y + 'H252L244 ' + (y - 5) + ' M252 ' + y + 'L244 ' + (y + 5)"
                stroke="#91aacd"
                fill="none"
                stroke-width="1.5"
              />
              <text x="214" y="57">B →</text>
              <path
                :d="
                  out ? 'M140 94V26L134 35 M140 26L146 35' : 'M140 126V194L134 185 M140 194L146 185'
                "
                stroke="#087f76"
                fill="none"
                stroke-width="3"
              />
              <text x="154" :y="out ? 40 : 194">F</text>
              <circle cx="140" cy="110" r="14" fill="#fff" stroke="#425574" stroke-width="2" />
              <circle v-if="out" cx="140" cy="110" r="4" fill="#425574" />
              <path
                v-else
                d="M132 102L148 118 M132 118L148 102"
                stroke="#425574"
                stroke-width="2"
              />
              <text x="140" y="218" text-anchor="middle">{{ out ? 'I：⊙' : 'I：⊗' }}</text>
            </svg>
            <figcaption>
              磁场 B 与电流大小不变，{{ out ? '按左手定则判断。' : '力大小不变、方向相反。' }}
            </figcaption>
          </figure>
        </div>
      </div>

      <figure
        v-else-if="code === '130204' && block.title.startsWith('交流发电机')"
        class="magnetism-figure magnetism-figure--single magnetism-figure--wave"
      >
        <svg viewBox="0 0 440 205" role="img" :aria-labelledby="uid + '-ac'">
          <title :id="uid + '-ac'">交流电压随时间正负交替，相邻两个正峰间隔为一个周期 T。</title>
          <path d="M40 25V175 M40 100H416" stroke="#64748b" stroke-width="1.5" fill="none" />
          <path
            d="M40 100C55 76 70 55 85 55S115 76 130 100S160 145 175 145S205 124 220 100S250 55 265 55S295 76 310 100S340 145 355 145S385 124 400 100"
            stroke="#2453cd"
            stroke-width="2.5"
            fill="none"
          />
          <path
            d="M85 49V30H265V49 M40 55H78"
            stroke="#087f76"
            stroke-dasharray="4 3"
            fill="none"
          />
          <text x="175" y="23" text-anchor="middle">一个周期 T</text>
          <text x="18" y="24">V</text>
          <text x="27" y="105" text-anchor="end">0</text>
          <text x="414" y="122">t</text>
          <text x="85" y="188" text-anchor="middle">正峰</text>
          <text x="265" y="188" text-anchor="middle">下一正峰</text>
        </svg>
        <figcaption>
          波形示意：正峰到下一正峰为 T，正峰到相邻负峰仅为
          T/2；正负号表示极性，不表示能量凭空出现或消失。
        </figcaption>
      </figure>
      <div v-else-if="code === '130204'" class="magnetism-comparison">
        <div class="magnetism-pair">
          <figure
            v-for="approach in [true, false]"
            :key="String(approach)"
            class="magnetism-figure"
          >
            <h4>{{ approach ? 'N 极靠近' : 'N 极远离' }}</h4>
            <svg viewBox="0 0 280 185" role="img" :aria-labelledby="uid + '-induced-' + approach">
              <title :id="uid + '-induced-' + approach">
                闭合线圈面对磁体 N 极；{{
                  approach
                    ? '磁体靠近，线圈近端感应为 N，排斥磁体。'
                    : '磁体远离，线圈近端感应为 S，吸引磁体。'
                }}
              </title>
              <rect x="20" y="72" width="43" height="40" fill="#edf3ff" stroke="#7193c6" />
              <rect x="63" y="72" width="43" height="40" fill="#ffede5" stroke="#ba7953" />
              <text x="41" y="98" text-anchor="middle">S</text>
              <text x="84" y="98" text-anchor="middle">N</text>
              <path
                :d="approach ? 'M37 48H99L91 42 M99 48L91 54' : 'M99 48H37L45 42 M37 48L45 54'"
                stroke="#2453cd"
                fill="none"
                stroke-width="2"
              />
              <text x="69" y="29" text-anchor="middle">运动</text>
              <ellipse
                cx="215"
                cy="92"
                rx="31"
                ry="53"
                fill="#eff9f7"
                stroke="#087f76"
                stroke-width="2"
              />
              <text x="215" y="98" text-anchor="middle" fill="#087f76">
                {{ approach ? 'N' : 'S' }}
              </text>
              <text x="215" y="166" text-anchor="middle">线圈近端</text>
              <text x="68" y="166" text-anchor="middle">
                {{ approach ? '受到排斥' : '受到吸引' }}
              </text>
            </svg>
            <figcaption>
              {{
                approach
                  ? '原磁场链接增强，感应效应阻碍靠近。'
                  : '原磁场链接减弱，感应效应阻碍远离。'
              }}
            </figcaption>
          </figure>
        </div>
        <p class="magnetism-caption">
          闭合线圈的磁极示意，不表示电荷正负。先判近端磁极，再从该端用右手定则反推感应电流绕向。
        </p>
      </div>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { magnetismMethods, type MagnetismMethodCode } from '@/content/knowledge/magnetismMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: MagnetismMethodCode }>()
const uid = useId()
// 五个节点分别取正文；图示与小节及方法块一同切换，避免沿用旧图。
const lesson = computed(() => magnetismMethods[props.code])
</script>

<style scoped lang="scss">
.magnetism-methods {
  container-type: inline-size;
}
.magnetism-methods :deep(h3 > span) {
  flex-shrink: 0;
  white-space: nowrap;
}
.magnetism-comparison {
  container-type: inline-size;
  max-width: 620px;
  margin: 12px auto;
}
.magnetism-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.magnetism-figure {
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.magnetism-figure--single {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  max-width: 620px;
  margin: 12px auto;
}
.magnetism-figure--single figcaption {
  margin: 0;
}
.magnetism-figure > svg {
  display: block;
  width: 100%;
  max-width: 210px;
  height: auto;
  margin: auto;
}
.magnetism-figure--single > svg {
  max-width: 280px;
  max-height: 190px;
}
.magnetism-figure > svg text {
  font-family: var(--font-sans);
  font-size: 18px;
  fill: #344c6c;
}
.magnetism-figure--wave > svg text {
  font-size: 22px;
}
.magnetism-pair svg text {
  font-size: 20px;
}
.magnetism-figure h4 {
  margin: 0 0 6px;
  font-size: 16px;
  color: #243e65;
}
.magnetism-figure figcaption,
.magnetism-caption {
  margin: 8px 0 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
@container (max-width: 540px) {
  .magnetism-pair {
    grid-template-columns: 1fr;
  }
  .magnetism-pair figure {
    width: 100%;
    max-width: 320px;
    box-sizing: border-box;
    justify-self: center;
  }
  .magnetism-figure--single {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
    max-width: 360px;
  }
}
@media (max-width: 600px) {
  .magnetism-figure {
    padding: 10px;
  }
  .magnetism-methods :deep(tbody th) {
    width: 30%;
  }
}
</style>
