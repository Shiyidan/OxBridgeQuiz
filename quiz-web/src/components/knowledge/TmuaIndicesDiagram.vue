<!-- TMUA 有理指数互动图解：将指数拆成开方、乘方与倒数。 -->
<template>
  <figure class="tmua-indices" aria-labelledby="tmua-indices-title">
    <figcaption>
      <span>TMUA · RATIONAL INDICES</span>
      <h5 id="tmua-indices-title">拆开指数，看清运算顺序</h5>
      <p>切换底数和指数，沿步骤观察每一次变形。</p>
    </figcaption>
    <div class="controls" role="group" aria-label="选择正底数">
      <span>底数</span
      ><AppButton
        v-for="item in bases"
        :key="item"
        size="small"
        :type="base === item ? 'primary' : 'secondary'"
        :aria-pressed="base === item"
        @click="base = item"
        >{{ item }}</AppButton
      >
    </div>
    <div class="controls" role="group" aria-label="选择有理指数">
      <span>指数</span
      ><AppButton
        v-for="item in powers"
        :key="item.id"
        size="small"
        :type="power === item.id ? 'primary' : 'secondary'"
        :aria-pressed="power === item.id"
        @click="power = item.id"
        >{{ item.label }}</AppButton
      >
    </div>
    <div class="path" aria-live="polite">
      <div class="path-head"><span>从原式出发</span><LatexText :text="equation" /></div>
      <div class="path-row">
        <span class="step">1</span>
        <div>
          <strong>{{ rootTitle }}</strong
          ><LatexText :text="rootFormula" />
        </div>
      </div>
      <div class="path-row">
        <span class="step">2</span>
        <div>
          <strong>{{ operationTitle }}</strong
          ><LatexText :text="resultFormula" />
        </div>
      </div>
    </div>
    <p class="note">
      这里底数均为正数。负指数表示倒数，底数不能为零；底数为负时，分母奇偶和约分会影响实数范围，不能直接套用正底数的规则。
    </p>
  </figure>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '../AppButton.vue'
import LatexText from '../LatexText.vue'

defineProps<{ topic?: string }>()
type Power = 'half' | 'three-halves' | 'minus-half' | 'third'
const bases = [4, 8] as const
const powers: { id: Power; label: string }[] = [
  { id: 'half', label: '1/2' },
  { id: 'three-halves', label: '3/2' },
  { id: 'minus-half', label: '−1/2' },
  { id: 'third', label: '1/3' },
]
const base = ref<4 | 8>(4)
const power = ref<Power>('three-halves')
const exponent: Record<Power, string> = {
  half: String.raw`\frac12`,
  'three-halves': String.raw`\frac32`,
  'minus-half': String.raw`-\frac12`,
  third: String.raw`\frac13`,
}
// 只使用明确的正底数，让根式及每一步结果均可精确核对。
const roots: Record<4 | 8, Record<'square' | 'cube', string>> = {
  4: { square: '2', cube: String.raw`\sqrt[3]{4}` },
  8: { square: String.raw`2\sqrt2`, cube: '2' },
}
const results: Record<4 | 8, Record<Power, string>> = {
  4: {
    half: '2',
    'three-halves': '8',
    'minus-half': String.raw`\frac12`,
    third: String.raw`\sqrt[3]{4}`,
  },
  8: {
    half: String.raw`2\sqrt2`,
    'three-halves': String.raw`16\sqrt2`,
    'minus-half': String.raw`\frac{\sqrt2}{4}`,
    third: '2',
  },
}
// 分母决定开方次数，分子决定乘方，负号最后表示取倒数。
const equation = computed(() => `$${base.value}^{${exponent[power.value]}}$`)
const rootTitle = computed(() =>
  power.value === 'third' ? '分母 3：先开立方' : '分母 2：先开平方',
)
const rootFormula = computed(
  () =>
    `$\\sqrt${power.value === 'third' ? '[3]' : ''}{${base.value}}=${roots[base.value][power.value === 'third' ? 'cube' : 'square']}$`,
)
const operationTitle = computed(() =>
  power.value === 'minus-half'
    ? '负指数：再取倒数'
    : power.value === 'three-halves'
      ? '分子 3：再立方'
      : '分子 1：结果保持不变',
)
const resultFormula = computed(
  () => `$${base.value}^{${exponent[power.value]}}=${results[base.value][power.value]}$`,
)
</script>
<style scoped>
.tmua-indices {
  margin: 0;
  padding: 22px;
  border: 1px solid #cee2ee;
  border-radius: 14px;
  background: #f2f8fc;
  color: #183248;
  min-width: 0;
}
figcaption > span {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: #136f85;
  font-weight: 700;
}
h5 {
  font-size: 19px;
  margin: 8px 0;
}
figcaption p,
.note {
  font-size: 14px;
  line-height: 1.65;
  color: #526b7d;
  margin: 0 0 14px;
}
.controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}
.controls > span {
  font-size: 14px;
  color: #526b7d;
  min-width: 34px;
}
.path {
  background: #fff;
  border: 1px solid #dce9ef;
  border-radius: 10px;
  padding: 16px;
  margin-top: 16px;
}
.path-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5eef3;
}
.path-head span {
  font-size: 13px;
  color: #607787;
}
.path-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding-top: 15px;
}
.path-row > div {
  display: grid;
  gap: 5px;
  min-width: 0;
}
.path-row strong {
  font-size: 14px;
}
.step {
  background: #e7f3f3;
  color: #087b75;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  text-align: center;
  line-height: 25px;
  font-weight: 700;
  flex: none;
}
.note {
  margin: 14px 0 0;
}
@media (max-width: 600px) {
  .tmua-indices {
    padding: 16px;
  }
  .path-head {
    flex-wrap: wrap;
  }
}
</style>
