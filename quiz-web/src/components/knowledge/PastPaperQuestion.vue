<!-- 备考讲义精选题：保留真实来源，复用通用题卡加载完整题干、图表与选项。 -->
<template>
  <div class="past-paper-question" :aria-busy="loading">
    <p v-if="loading" class="past-paper-status" role="status">正在加载题目…</p>
    <div v-else-if="error" class="past-paper-status" role="alert">
      <p>{{ error }}</p>
      <AppButton type="secondary" size="small" @click="retryKey++">重新加载题目</AppButton>
    </div>
    <template v-else-if="data">
      <p class="past-paper-source">
        <template v-if="'collectionLabel' in data.source">
          <span>收录于：{{ data.source.collectionLabel }}</span>
          <span class="past-paper-source__divider" aria-hidden="true">｜</span>
          <span>来源：{{ data.source.originLabel }}</span>
        </template>
        <template v-else>
          <span
            >收录于：{{ data.source.diagnosticTitle }} · 生物第
            {{ data.source.diagnosticQuestionNumber }} 题</span
          >
          <span class="past-paper-source__divider" aria-hidden="true">｜</span>
          <span
            >来源：{{ data.source.year }} {{ data.source.exam }} · {{ data.source.paper }} · 第
            {{ data.source.questionNumber }} 题</span
          >
        </template>
      </p>
      <p class="past-paper-reason"><strong>这道题练什么：</strong>{{ source.why }}</p>
      <QuestionCard
        :question="data.question"
        :index="0"
        :show-question-label="false"
        :selected-answer="selectedAnswer"
        :show-favorite="false"
        @select="selectedAnswer = $event"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import {
  getBiologyLearningExample,
  getChemistryLearningExample,
  getMathematicsLearningExample,
  getMathematics2LearningExample,
  getPhysicsLearningExample,
  type BiologyLearningExample,
  type ChemistryLearningExample,
} from '@/api/learningExamples'
import { getApiErrorMessage } from '@/utils/request'

const props = defineProps<{
  source: {
    questionCode: string
    why: string
    subject?: 'biology' | 'chemistry' | 'mathematics1' | 'mathematics2' | 'physics'
    kind?: 'annual' | 'bank'
  }
}>()
const emit = defineEmits<{ ready: [sourceCode: string] }>()
const data = ref<BiologyLearningExample | ChemistryLearningExample | null>(null)
const loading = ref(false)
const error = ref('')
const retryKey = ref(0)
const selectedAnswer = ref<string>()

// 切题或重试立即清空旧题；迟到请求不能把上一道题及来源写回当前讲义。
watch(
  () => [props.source.questionCode, props.source.subject, retryKey.value] as const,
  async ([code], _previous, onCleanup) => {
    let active = true
    onCleanup(() => {
      active = false
    })
    data.value = null
    selectedAnswer.value = undefined
    error.value = ''
    loading.value = true
    emit('ready', '')
    try {
      const result =
        props.source.subject === 'physics'
          ? await getPhysicsLearningExample(code)
          : props.source.subject === 'mathematics1'
            ? await getMathematicsLearningExample(code)
            : props.source.subject === 'mathematics2'
              ? await getMathematics2LearningExample(code)
              : props.source.subject === 'chemistry'
                ? await getChemistryLearningExample(code)
                : await getBiologyLearningExample(code)
      if (!active) return
      if (result.sourceCode !== code) throw new Error('题目来源不匹配，请重新加载。')
      data.value = result
      emit('ready', code)
    } catch (cause) {
      if (active) error.value = getApiErrorMessage(cause, '题目暂时无法加载，请重试。')
    } finally {
      if (active) loading.value = false
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.past-paper-question {
  min-width: 0;
  margin: 8px 0 20px;
}
/* 原卷出处与诊断卷位置合并展示，长文本在窄屏自然换行。 */
.past-paper-source {
  margin: 0 0 12px;
  color: var(--color-ink-soft);
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.past-paper-source__divider {
  margin-inline: 8px;
  color: var(--color-ink-muted);
}
.past-paper-reason {
  margin: 0 0 18px;
  color: var(--color-ink);
  line-height: 1.8;
}
.past-paper-status {
  padding: 16px;
  border-radius: var(--radius-md);
  background: var(--color-learning-amber-soft);
  line-height: 1.8;
}
.past-paper-question :deep(.question-card) {
  box-shadow: none;
}
</style>
