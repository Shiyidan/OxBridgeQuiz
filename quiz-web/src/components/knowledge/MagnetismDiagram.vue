<!-- 物理磁学互动图：按知识点比较材料、场方向、磁力、感应波形与变压器能量账。 -->
<template>
  <figure class="magnetism-atlas" aria-label="磁学概念互动图">
    <figcaption>
      <span>PHYSICS · MAGNETISM</span>
      <h5>{{ titles[mode] }}</h5>
      <p>{{ descriptions[mode] }}</p>
    </figcaption>
    <div v-if="mode === 0" class="controls" role="group" aria-label="磁性材料和外场">
      <AppButton
        size="small"
        :type="!steel ? 'primary' : 'secondary'"
        :aria-pressed="!steel"
        @click="steel = false"
        >软铁</AppButton
      ><AppButton
        size="small"
        :type="steel ? 'primary' : 'secondary'"
        :aria-pressed="steel"
        @click="steel = true"
        >已磁化钢</AppButton
      ><AppButton size="small" type="secondary" @click="fieldOn = !fieldOn">{{
        fieldOn ? '移走外磁体' : '靠近外磁体'
      }}</AppButton>
    </div>
    <div v-else-if="mode === 1" class="controls" role="group" aria-label="电流磁场">
      <AppButton size="small" type="secondary" @click="reverse = !reverse">反转电流</AppButton
      ><AppButton size="small" type="secondary" @click="doubleCurrent = !doubleCurrent">{{
        doubleCurrent ? '恢复1 A' : '电流加倍'
      }}</AppButton>
    </div>
    <div v-else-if="mode === 2" class="controls" role="group" aria-label="磁力方向和大小">
      <AppButton size="small" type="secondary" @click="reverse = !reverse">反转电流</AppButton
      ><AppButton size="small" type="secondary" @click="doubleCurrent = !doubleCurrent">{{
        doubleCurrent ? '恢复2 A' : '电流加倍'
      }}</AppButton>
    </div>
    <div v-else-if="mode === 3" class="controls" role="group" aria-label="发电机波形">
      <AppButton size="small" type="secondary" @click="fast = !fast">{{
        fast ? '恢复原转速' : '转速加倍'
      }}</AppButton
      ><AppButton size="small" type="secondary" @click="turnsDouble = !turnsDouble">{{
        turnsDouble ? '恢复原匝数' : '匝数加倍'
      }}</AppButton
      ><AppButton size="small" type="secondary" @click="stopped = !stopped">{{
        stopped ? '继续转动' : '停止转动'
      }}</AppButton>
    </div>
    <div v-else class="controls" role="group" aria-label="升降压">
      <AppButton
        size="small"
        :type="stepUp ? 'primary' : 'secondary'"
        :aria-pressed="stepUp"
        @click="stepUp = true"
        >升压2倍</AppButton
      ><AppButton
        size="small"
        :type="!stepUp ? 'primary' : 'secondary'"
        :aria-pressed="!stepUp"
        @click="stepUp = false"
        >降压一半</AppButton
      >
    </div>

    <svg v-if="mode === 0" viewBox="0 0 600 300" role="img" :aria-label="materialCaption">
      <title>{{ materialCaption }}</title>
      <g :opacity="fieldOn ? 1 : 0.18">
        <rect x="35" y="85" width="90" height="90" rx="8" fill="#547cb7" />
        <rect x="125" y="85" width="90" height="90" rx="8" fill="#d87872" />
        <text x="80" y="140" text-anchor="middle" fill="white">S</text>
        <text x="170" y="140" text-anchor="middle" fill="white">N</text>
      </g>
      <rect x="330" y="85" width="220" height="90" rx="8" fill="#dce8ed" stroke="#75929b" />
      <text x="375" y="140" text-anchor="middle">{{ fieldOn || steel ? 'S' : '≈0' }}</text>
      <text x="505" y="140" text-anchor="middle">{{ fieldOn || steel ? 'N' : '≈0' }}</text>
      <path v-if="fieldOn" d="M230 130H315l-16-12m16 12-16 12" class="field" />
      <text x="440" y="220" text-anchor="middle">
        {{ steel ? '硬磁材料：钢' : '软磁材料：软铁' }}
      </text>
      <text x="300" y="275" text-anchor="middle">
        {{
          fieldOn
            ? '近端为异极，受到吸引'
            : steel
              ? '撤去外场，保留明显磁性'
              : '撤去外场，大部分磁化消失'
        }}
      </text>
    </svg>
    <svg
      v-else-if="mode === 1"
      viewBox="0 0 600 340"
      role="img"
      :aria-label="reverse ? '电流入纸面，磁场顺时针' : '电流出纸面，磁场逆时针'"
    >
      <title>右手拇指沿电流，四指弯曲给出磁场</title>
      <circle
        v-for="radius in doubleCurrent ? [45, 65, 85, 105, 125] : [65, 95, 125]"
        :key="radius"
        cx="260"
        cy="155"
        :r="radius"
        fill="none"
        stroke="#488b9a"
        stroke-width="3"
      />
      <circle cx="260" cy="155" r="24" fill="white" stroke="#244d8c" stroke-width="3" />
      <text x="260" y="165" text-anchor="middle" class="current-symbol">
        {{ reverse ? '×' : '•' }}
      </text>
      <path
        :d="reverse ? 'M245 30H275l-14-10m14 10-14 10' : 'M275 30H245l14-10m-14 10 14 10'"
        class="field"
      />
      <text x="445" y="100" text-anchor="middle">{{ reverse ? '入纸面 ×' : '出纸面 •' }}</text>
      <text x="445" y="150" text-anchor="middle">{{ reverse ? '顺时针' : '逆时针' }}</text>
      <text x="445" y="200" text-anchor="middle">I = {{ doubleCurrent ? 2 : 1 }} A</text>
      <text x="300" y="325" text-anchor="middle">圆心是导线，越近磁场越强</text>
    </svg>
    <svg
      v-else-if="mode === 2"
      viewBox="0 0 600 350"
      role="img"
      :aria-label="reverse ? '磁场向右、电流入纸面，力向下' : '磁场向右、电流出纸面，力向上'"
    >
      <title>左手定则：改变电流就反转力，磁场方向保持向右</title>
      <g v-for="y in [80, 170, 260]" :key="y">
        <path :d="'M60 ' + y + 'H540l-17-12m17 12-17 12'" class="field" />
      </g>
      <circle cx="300" cy="170" r="26" fill="white" stroke="#315c92" stroke-width="3" />
      <text x="300" y="181" text-anchor="middle" class="current-symbol">
        {{ reverse ? '×' : '•' }}
      </text>
      <path
        :d="reverse ? 'M300 205V290l-12-17m12 17 12-17' : 'M300 135V50l-12 17m12-17 12 17'"
        class="force"
      />
      <text x="360" :y="reverse ? 300 : 45">F</text>
      <text x="110" y="40">B →</text>
      <text x="300" y="340" text-anchor="middle">B = 0.5 T，L = 0.2 m</text>
    </svg>
    <svg
      v-else-if="mode === 3"
      viewBox="0 0 600 330"
      role="img"
      :aria-label="stopped ? '静止时电压为零' : '匀速发电机的理想正弦波形'"
    >
      <title>纵轴为相对感应电压，横轴为固定时间窗口，示意不代表某道原题数据</title>
      <path d="M60 30V280M60 160H550" class="axis" />
      <path d="M60 70H550M60 250H550" class="grid" />
      <text x="45" y="45" text-anchor="end">U</text>
      <text x="540" y="300">t</text>
      <text x="45" y="170" text-anchor="end">0</text>
      <path :d="wavePath" class="wave" />
      <text x="300" y="315" text-anchor="middle">
        {{
          stopped
            ? '不再变化 → U = 0'
            : fast
              ? '同样时间内振荡次数加倍'
              : '正负交替，每转一周一周期'
        }}
      </text>
    </svg>
    <svg
      v-else
      viewBox="0 0 600 340"
      role="img"
      :aria-label="stepUp ? '升压2倍，理想电流减半' : '降压一半，理想电流加倍'"
    >
      <title>理想变压器输入输出均为120 W，原线圈100匝</title>
      <rect
        x="170"
        y="85"
        width="260"
        height="140"
        rx="20"
        fill="none"
        stroke="#9cafbe"
        stroke-width="28"
      />
      <g v-for="i in 5" :key="i">
        <path :d="'M145 ' + (90 + i * 22) + 'q50 0 50 12q-50 0-50 12'" class="coil" />
      </g>
      <g v-for="i in stepUp ? 10 : 3" :key="'s' + i">
        <path
          :d="'M405 ' + (90 + i * (stepUp ? 12 : 35)) + 'q50 0 50 10q-50 0-50 10'"
          class="coil"
        />
      </g>
      <text x="120" y="45" text-anchor="middle">原侧100匝</text>
      <text x="460" y="45" text-anchor="middle">副侧{{ stepUp ? 200 : 50 }}匝</text>
      <text x="120" y="275" text-anchor="middle">240 V · 0.5 A</text>
      <text x="460" y="275" text-anchor="middle">
        {{ stepUp ? '480 V · 0.25 A' : '120 V · 1 A' }}
      </text>
      <text x="300" y="325" text-anchor="middle">输入 120 W = 输出 120 W</text>
    </svg>
    <div class="result" aria-live="polite"><LatexText :text="calculation" /></div>
    <p class="insight" aria-live="polite">{{ insights[mode] }}</p>
    <p class="note">
      教学示意：箭头表示约定方向；场线疏密与线圈绘制匝数用于定性比较，不按实际尺寸绘制。
    </p>
  </figure>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'
const props = defineProps<{ topic: string }>()
// 同一章节图解按叶子编码切换五种物理关系。
const mode = computed(() =>
  Math.max(0, ['130201', '130202', '130203', '130204', '130205'].indexOf(props.topic)),
)
const steel = ref(false),
  fieldOn = ref(true),
  reverse = ref(false),
  doubleCurrent = ref(false),
  fast = ref(false),
  turnsDouble = ref(false),
  stopped = ref(false),
  stepUp = ref(true)
const titles = [
  '磁化后，撤去外场会怎样？',
  '电流反转，磁场也反转',
  '不是平移箭头：用左手判断力',
  '感应看变化，波形看节奏',
  '电压加倍，功率没有加倍',
]
const descriptions = [
  '软铁和已磁化钢对外场撤去的响应不同。',
  '从导线端面看磁场，点朝向你，叉背离你。',
  '场始终向右，导线垂直纸面，比较力的方向和大小。',
  '同一时间窗口比较理想交流发电机；峰值和频率分别观察。',
  '理想模型中输入功率固定120 W，比较升压与降压。',
]
// 材料说明同时反映当前外场状态，供图形的无障碍标签读取。
const materialCaption = computed(() =>
  fieldOn.value
    ? '外磁体N极靠近材料，近端为S极'
    : steel.value
      ? '已磁化钢保留明显磁性'
      : '软铁大部分磁化消失',
)
// 理想发电机波形随转速同时改变频率和峰值，随匝数只改变峰值。
const wavePath = computed(() =>
  Array.from({ length: 121 }, (_, i) => {
    const x = 60 + i * 4
    const y =
      160 -
      (stopped.value
        ? 0
        : 22 *
          (fast.value ? 2 : 1) *
          (turnsDouble.value ? 2 : 1) *
          Math.sin((i / 120) * 2 * Math.PI * (fast.value ? 2 : 1)))
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' '),
)
// 每张图只计算其物理量，避免将场强比例、磁力和感应电压混用。
const calculation = computed(() =>
  mode.value === 0
    ? materialCaption.value
    : mode.value === 1
      ? `电流${reverse.value ? '入' : '出'}纸面；相同距离的场强为原来的${doubleCurrent.value ? 2 : 1}倍。`
      : mode.value === 2
        ? `$F=BIL=0.5\\times${doubleCurrent.value ? 4 : 2}\\times0.2=${doubleCurrent.value ? 0.4 : 0.2}\\,\\mathrm N$，方向${reverse.value ? '向下' : '向上'}。`
        : mode.value === 3
          ? stopped.value
            ? '静止且磁场不变：感应电压为零。'
            : `相对峰值：${(fast.value ? 2 : 1) * (turnsDouble.value ? 2 : 1)}倍；相对频率：${fast.value ? 2 : 1}倍。`
          : '$V_pI_p=V_sI_s$；电压与匝数同向，电流与匝数反向。',
)
const insights = [
  '软铁易磁化也易退磁；硬磁材料更适合保持永久磁性。吸引本身不能证明材料原来带有永久磁极。',
  '长螺线管的场还取决于单位长度匝数和铁芯；直导线周围是圆形场，不是沿导线向前的场。',
  '只反转电流使磁力反向；电流加倍使力加倍。这里L是处于均匀场中的有效长度。',
  '磁场存在不等于电压存在。增加匝数不改变周期；加快转动既增大峰值，也缩短周期。',
  '升压减流只有在同样功率下才能这样比较；线路发热要用线路所在侧的电流计算I²R。',
]
// 章节导航恢复概念图初始条件，防止上一节控制影响下一节。
watch(
  () => props.topic,
  () => {
    steel.value = false
    fieldOn.value = true
    reverse.value = false
    doubleCurrent.value = false
    fast.value = false
    turnsDouble.value = false
    stopped.value = false
    stepUp.value = true
  },
)
</script>
<style scoped>
.magnetism-atlas {
  margin: 0;
  padding: 24px;
  border: 1px solid #bfdfdd;
  border-radius: 12px;
  background: linear-gradient(135deg, #edf8f6, #fff);
  color: #183b46;
  min-width: 0;
}
figcaption > span {
  font: 600 12px/1.5 sans-serif;
  color: #26746e;
  letter-spacing: 0.1em;
}
h5 {
  font-size: 21px;
  font-weight: 700;
  margin: 10px 0;
}
p {
  font-size: 14px;
  line-height: 1.8;
  margin: 8px 0;
}
.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 18px 0;
}
.controls :deep(.app-button.el-button) {
  --app-button-bg: #fff;
  --app-button-color: #177e75;
  --app-button-border: #b2d8d2;
  --app-button-hover-bg: #edf8f5;
  --app-button-hover-border: #177e75;
  --app-button-active-bg: #edf8f5;
  --app-button-active-border: #177e75;
}
.controls :deep(.app-button.el-button.app-button--primary) {
  --app-button-bg: #177e75;
  --app-button-color: #fff;
  --app-button-border: #177e75;
  --app-button-hover-bg: #177e75;
  --app-button-hover-border: #177e75;
  --app-button-active-bg: #177e75;
  --app-button-active-border: #177e75;
}
svg {
  width: 100%;
  display: block;
}
svg text {
  font-size: 24px;
  fill: #254654;
}
.field {
  stroke: #258d88;
  stroke-width: 3;
  fill: none;
}
.force {
  stroke: #d97038;
  stroke-width: 5;
  fill: none;
}
.current-symbol {
  font-size: 36px;
}
.axis {
  stroke: #67838f;
  stroke-width: 2;
  fill: none;
}
.grid {
  stroke: #d9e7e6;
  stroke-width: 1;
  stroke-dasharray: 4 5;
}
.wave {
  fill: none;
  stroke: #276bbb;
  stroke-width: 4;
}
.coil {
  fill: none;
  stroke: #bc7a38;
  stroke-width: 4;
}
.result {
  padding: 14px 0;
  border-block: 1px solid #cfe4e1;
  line-height: 1.8;
}
.insight {
  margin-top: 16px;
  border-left: 3px solid #268c82;
  padding-left: 12px;
}
.note {
  font-size: 12px;
  color: #607b83;
}
@media (max-width: 600px) {
  .magnetism-atlas {
    padding: 14px;
  }
  h5 {
    font-size: 18px;
  }
  svg text {
    font-size: 24px;
  }
  .controls {
    gap: 6px;
  }
}
</style>
