<!-- TMUA 函数互动图解：对照复合顺序与反函数的定义域和值域。 -->
<template>
  <figure class="tmua-functions" aria-labelledby="tmua-functions-title">
    <figcaption>
      <span>TMUA · FUNCTIONS</span>
      <h5 id="tmua-functions-title">把函数看作输入与输出</h5>
      <p>选一个输入，观察函数按不同顺序作用的结果。</p>
    </figcaption>
    <div class="controls" role="group" aria-label="选择函数示例">
      <AppButton
        v-for="item in modes"
        :key="item.id"
        size="small"
        :type="mode === item.id ? 'primary' : 'secondary'"
        :aria-pressed="mode === item.id"
        @click="mode = item.id"
        >{{ item.label }}</AppButton
      >
    </div>
    <div class="functions"><LatexText :text="functionLabel" /></div>
    <div class="controls" role="group" aria-label="选择输入值">
      <span>输入</span
      ><AppButton
        v-for="item in inputs"
        :key="item"
        size="small"
        :type="input === item ? 'primary' : 'secondary'"
        :aria-pressed="input === item"
        @click="input = item"
        >{{ item }}</AppButton
      >
    </div>
    <div class="paths" aria-live="polite">
      <template v-if="mode === 'composition'">
        <div class="path"><strong>先 f，后 g</strong><LatexText :text="firstPath" /></div>
        <div class="path"><strong>先 g，后 f</strong><LatexText :text="secondPath" /></div>
        <p>同一个输入，两条路径的结果可能不同。复合函数从最里面开始计算。</p>
      </template>
      <template v-else>
        <div class="path"><strong>正向：平方</strong><LatexText :text="forwardPath" /></div>
        <div class="path"><strong>反向：主平方根</strong><LatexText :text="inversePath" /></div>
        <p>限定输入非负后，平方才是一对一；反函数的输入是原函数的输出。</p>
      </template>
    </div>
    <p class="note">
      复合前检查内层输出是否属于外层定义域；反函数存在时，原函数的定义域和值域互换。
    </p>
  </figure>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '../AppButton.vue'
import LatexText from '../LatexText.vue'

defineProps<{ topic?: string }>()
type Mode = 'composition' | 'inverse'
const modes: { id: Mode; label: string }[] = [
  { id: 'composition', label: '复合顺序' },
  { id: 'inverse', label: '反函数' },
]
const inputs = [0, 1, 2]
const mode = ref<Mode>('composition')
const input = ref(1)
// 当前模型的定义与路径同时切换，避免学生将两种例子混淆。
const functionLabel = computed(() =>
  mode.value === 'composition' ? '$f(x)=x^2$，$g(x)=x+1$' : '$f(x)=x^2$，限定 $x\\ge0$',
)
// 第一条路径展示先平方、后加一。
const firstPath = computed(
  () =>
    '$' +
    input.value +
    '\\xrightarrow{f}' +
    input.value ** 2 +
    '\\xrightarrow{g}' +
    (input.value ** 2 + 1) +
    '$',
)
// 第二条路径展示先加一、后平方，便于比较复合顺序。
const secondPath = computed(
  () =>
    '$' +
    input.value +
    '\\xrightarrow{g}' +
    (input.value + 1) +
    '\\xrightarrow{f}' +
    (input.value + 1) ** 2 +
    '$',
)
// 限制非负输入后记录正向平方的结果。
const forwardPath = computed(() => '$' + input.value + '\\xrightarrow{f}' + input.value ** 2 + '$')
// 从正向输出回到唯一输入，解释所选分支的反函数。
const inversePath = computed(
  () => '$' + input.value ** 2 + '\\xrightarrow{f^{-1}}' + input.value + '$',
)
</script>
<style scoped>
.tmua-functions {
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
.note,
.paths p {
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
  color: #526b7d;
  font-size: 14px;
}
.functions {
  padding: 12px 15px;
  background: #e6f1f7;
  border-radius: 8px;
  line-height: 1.6;
}
.paths {
  padding: 4px 15px 12px;
  background: #fff;
  border: 1px solid #dce9ef;
  border-radius: 10px;
}
.path {
  display: grid;
  gap: 8px;
  padding: 12px 0;
}
.path + .path {
  border-top: 1px solid #e5eef3;
}
.path strong {
  font-size: 14px;
  color: #087b75;
}
.paths p,
.note {
  margin: 10px 0 0;
}
@media (max-width: 600px) {
  .tmua-functions {
    padding: 16px;
  }
}
</style>
