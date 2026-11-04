<!-- 例题原题解析：展开时读取已审核题目的原始答案和解析。 -->
<template>
  <section class="original-analysis" aria-label="题目解析" :aria-busy="loading">
    <h6>题目解析</h6>
    <p v-if="loading" role="status">正在加载解析…</p>
    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <AppButton type="secondary" size="small" @click="retry++">重新加载</AppButton>
    </div>
    <template v-else-if="data">
      <p v-if="data.analysis.correct_solution || data.analysis.solution" class="original-analysis__text">
        <KnowledgeText :text="data.analysis.correct_solution || data.analysis.solution || ''" />
      </p>
      <template v-else-if="data.analysis.solution_trace?.steps?.length || data.analysis.solution_trace?.final_value || data.analysis.solution_trace?.distractors?.length">
        <ol v-if="data.analysis.solution_trace.steps?.length"><li v-for="(step, index) in data.analysis.solution_trace.steps" :key="index"><KnowledgeText :text="step" /></li></ol>
        <p v-if="data.analysis.solution_trace.final_value"><KnowledgeText :text="data.analysis.solution_trace.final_value" /></p>
        <ul v-if="data.analysis.solution_trace.distractors?.length"><li v-for="item in data.analysis.solution_trace.distractors" :key="item.option"><KnowledgeText :text="`${item.option}：${item.reason}`" /></li></ul>
      </template>
      <p v-else>这道题暂未提供解析。</p>
      <div v-if="data.analysis.common_error_causes?.length">
        <h6>易错原因</h6>
        <ul><li v-for="(cause, index) in data.analysis.common_error_causes" :key="index"><KnowledgeText :text="cause" /></li></ul>
      </div>
      <div v-if="data.analysis.review_guidance">
        <h6>复习建议</h6>
        <p class="original-analysis__text"><KnowledgeText :text="data.analysis.review_guidance" /></p>
      </div>
    </template>
  </section>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import { getLearningExampleAnalysis } from '@/api/learningExamples'
import { getApiErrorMessage } from '@/utils/request'
import KnowledgeText from './KnowledgeText.vue'

const props = defineProps<{ subject: string; sourceCode: string }>()
const emit = defineEmits<{ answer: [answer: string] }>()
const data = ref<Awaited<ReturnType<typeof getLearningExampleAnalysis>> | null>(null)
const loading = ref(false)
const error = ref('')
const retry = ref(0)
// 切题或关闭时丢弃迟到结果，防止展示上一题的原解析。
watch(() => [props.subject, props.sourceCode, retry.value] as const, async ([subject, code], _old, onCleanup) => {
  let active = true
  onCleanup(() => { active = false })
  data.value = null
  error.value = ''
  loading.value = true
  try {
    const result = await getLearningExampleAnalysis(subject, code)
    if (active && result.sourceCode === code) {
      data.value = result
      emit('answer', result.answer.join('、'))
    }
  } catch (cause) {
    if (active) error.value = getApiErrorMessage(cause, '解析暂时无法加载，请重试。')
  } finally {
    if (active) loading.value = false
  }
}, { immediate: true })
</script>
<style scoped>
.original-analysis { margin-top: 16px; padding: 16px 18px; border: 1px solid #dce7f4; border-radius: 8px; background: #f4f8fe; }
.original-analysis h6 { margin: 0 0 10px; color: var(--color-ink); font-size: var(--text-base); font-weight: 700; }
.original-analysis p, .original-analysis li { line-height: 1.8; }
.original-analysis__text { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
