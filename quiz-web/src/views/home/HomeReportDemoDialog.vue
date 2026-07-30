<!-- 首页公开诊断报告示例：仅展示固定演示数据，并提供注册回流入口。 -->
<template>
  <Teleport to="body">
    <Transition name="home-demo-fade">
      <div
        v-if="modelValue"
        class="home-demo-backdrop"
        role="presentation"
        @mousedown.self="closeDialog"
      >
        <section
          ref="dialogRef"
          class="home-demo-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-demo-title"
          tabindex="-1"
          @keydown.esc.prevent="closeDialog"
          @keydown.tab="trapFocus"
        >
          <header class="home-demo-dialog__header">
            <div>
              <span>公开演示 · 非本人报告</span>
              <h2 id="home-demo-title">ESAT Mathematics 1 · 诊断报告示例</h2>
            </div>
            <button type="button" aria-label="关闭报告示例" @click="closeDialog">×</button>
          </header>

          <div class="home-demo-dialog__body">
            <section class="home-demo-score" aria-label="综合得分示例">
              <div>
                <span>综合得分</span>
                <strong>78</strong>
                <small>演示数据</small>
              </div>
              <dl>
                <div>
                  <dt>正确率</dt>
                  <dd>78%</dd>
                </div>
                <div>
                  <dt>完成用时</dt>
                  <dd>55:32</dd>
                </div>
              </dl>
            </section>

            <section class="home-demo-mastery" aria-labelledby="home-demo-mastery-title">
              <div class="home-demo-section-head">
                <span>知识点掌握度</span>
                <h3 id="home-demo-mastery-title">先看稳定项，再处理持续失分</h3>
              </div>
              <div v-for="item in mastery" :key="item.label" class="home-demo-mastery__row">
                <div>
                  <b>{{ item.label }}</b
                  ><span>{{ item.value }}%</span>
                </div>
                <div class="home-demo-progress" aria-hidden="true">
                  <i :style="{ width: `${item.value}%` }"></i>
                </div>
              </div>
            </section>

            <section class="home-demo-next" aria-labelledby="home-demo-next-title">
              <span>下一步建议</span>
              <h3 id="home-demo-next-title">优先练习 Functions &amp; Graphs 中等题</h3>
              <p>
                先完成 8 道同知识点练习，再回看 6
                道关联错题。建议来自本页演示记录，不代表任何真实学生。
              </p>
              <div class="home-demo-next__tags" aria-label="建议摘要">
                <b>8 道专项练习</b><b>6 道关联错题</b><b>完成后重新诊断</b>
              </div>
            </section>
          </div>

          <footer class="home-demo-dialog__footer">
            <p>完成你自己的真题诊断后，系统会生成与真实作答记录对应的个人报告。</p>
            <button
              type="button"
              class="home-button home-button--primary"
              @click="startRegistration"
            >
              免费注册并开始诊断 <span aria-hidden="true">→</span>
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useHomeDialogFocus } from './useHomeDialogFocus'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'register'): void
}>()

const dialogRef = ref<HTMLElement | null>(null)
const { trapFocus } = useHomeDialogFocus(dialogRef, () => props.modelValue)

const mastery = [
  { label: '代数与函数', value: 86 },
  { label: '数论与组合', value: 74 },
  { label: '几何与测量', value: 61 },
] as const

// 关闭示例后恢复触发按钮焦点，保留用户原来的浏览位置。
function closeDialog(): void {
  emit('update:modelValue', false)
}

// 报告示例的转化入口统一回到注册后进入诊断中心的主旅程。
function startRegistration(): void {
  emit('update:modelValue', false)
  emit('register')
}
</script>
