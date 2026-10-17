<!-- 学习讲义固定自测：复用题卡展示原题，在原位用例题拆解风格展开判分与解析。 -->
<template>
  <section class="knowledge-self-check" aria-label="知识点自测" :aria-busy="loading || submitting">
    <p v-if="loading" role="status">正在加载自测题…</p>
    <div v-else-if="loadError" role="alert">
      <p>{{ loadError }}</p>
      <AppButton type="secondary" size="small" @click="retryKey++">重新加载</AppButton>
    </div>
    <template v-else-if="data?.question">
      <div class="knowledge-self-check__question">
        <header class="knowledge-self-check__header">
          <h5>知识点自测</h5>
          <span>精选试题库题目 · 不计入练习记录</span>
        </header>
        <QuestionCard
          :question="result?.question || data.question"
          :index="0"
          :show-question-label="false"
          :show-favorite="false"
          :selected-answer="selectedAnswer"
          :show-answer="Boolean(result)"
          :disabled="submitting || Boolean(result)"
          @select="selectedAnswer = $event"
        />
        <p v-if="submitError" role="alert">{{ submitError }}</p>
        <AppButton
          v-if="!result"
          class="knowledge-self-check__submit"
          size="small"
          :disabled="!selectedAnswer || submitting"
          @click="submitAnswer"
        >
          {{ submitting ? '正在核对…' : '检查答案' }}
        </AppButton>
        <div v-else class="knowledge-self-check__actions">
          <AppButton
            type="secondary"
            size="small"
            :aria-expanded="explanationOpen"
            @click="explanationOpen = !explanationOpen"
          >
            {{ explanationOpen ? '收起解析' : '查看推理与选项分析' }}
          </AppButton>
          <AppButton type="secondary" size="small" @click="resetAnswer">重新作答</AppButton>
        </div>
      </div>
      <div v-if="result" class="knowledge-self-check__solution">
        <div class="knowledge-self-check__answer" role="status">
          <strong :class="{ 'is-incorrect': !result.isCorrect }">{{
            result.isCorrect ? '回答正确' : '回答不正确'
          }}</strong>
          <span>你的答案：{{ selectedAnswer }}</span>
          <span
            >正确答案：<strong>{{ result.question.answer.join('、') }}</strong></span
          >
        </div>
        <template v-if="explanationOpen">
          <h6>把知识用到这道题里</h6>
          <p v-if="correctSolution" class="knowledge-self-check__prose">
            <KnowledgeText :text="correctSolution" />
          </p>
          <template v-else>
            <ol v-if="analysis?.solution_trace?.steps?.length" class="knowledge-self-check__steps">
              <li v-for="(step, index) in analysis.solution_trace.steps" :key="index">
                <span>{{ index + 1 }}</span
                ><KnowledgeText :text="step" />
              </li>
            </ol>
            <p v-if="analysis?.solution_trace?.final_value" class="knowledge-self-check__prose">
              <KnowledgeText :text="analysis.solution_trace.final_value" />
            </p>
            <div
              v-if="analysis?.solution_trace?.distractors?.length"
              class="knowledge-self-check__notes"
            >
              <h6>每个选项为什么错</h6>
              <ul>
                <li v-for="(note, index) in analysis.solution_trace.distractors" :key="index">
                  <KnowledgeText :text="`${note.option}：${note.reason}`" />
                </li>
              </ul>
            </div>
            <p v-if="!hasSolution" class="knowledge-self-check__prose">当前题目暂无推理解析。</p>
          </template>
          <div v-if="analysis?.common_error_causes?.length" class="knowledge-self-check__notes">
            <h6>容易错在哪里</h6>
            <ul>
              <li v-for="(cause, index) in analysis.common_error_causes" :key="index">
                <KnowledgeText :text="cause" />
              </li>
            </ul>
          </div>
          <p
            v-if="analysis?.review_guidance || result.reason"
            class="knowledge-self-check__takeaway"
          >
            <strong>下次遇到类似题，记住这一点</strong>
            <KnowledgeText :text="analysis?.review_guidance || result.reason" />
          </p>
        </template>
      </div>
    </template>
    <p v-else class="knowledge-self-check__empty" role="status">{{ data?.message }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onActivated, onDeactivated, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import KnowledgeText from './KnowledgeText.vue'
import {
  getLearningSelfCheck,
  checkLearningSelfCheck,
  type LearningSelfCheck,
  type LearningSelfCheckResult,
} from '@/api/learningExamples'
import { getApiErrorMessage } from '@/utils/request'

const props = defineProps<{ code: string }>()
const data = ref<LearningSelfCheck | null>(null)
const result = ref<LearningSelfCheckResult | null>(null)
const explanationOpen = ref(true)
// 解析仅来自提交后的题库响应，未作答时不读取或显示答案。
const analysis = computed(() => result.value?.question.learning_analysis)
// 完整解析优先，结构化推理作为缺失时的兜底，避免同一解法重复出现。
const correctSolution = computed(
  () => analysis.value?.correct_solution || analysis.value?.solution || '',
)
// 缺失解析时显示明确提示，避免只留下空标题。
const hasSolution = computed(() =>
  Boolean(
    correctSolution.value ||
    analysis.value?.solution_trace?.steps?.length ||
    analysis.value?.solution_trace?.final_value ||
    analysis.value?.solution_trace?.distractors?.length,
  ),
)
const selectedAnswer = ref<string>()
const loading = ref(false)
const submitting = ref(false)
const loadError = ref('')
const submitError = ref('')
const retryKey = ref(0)
let generation = 0
let reloadOnActivation = false

// 页面缓存不保存即时自测；取消旧响应，返回后重新读取当前固定题目。
onDeactivated(() => {
  generation++
  resetAnswer()
  data.value = null
  loading.value = false
  reloadOnActivation = true
})
onActivated(() => {
  if (reloadOnActivation) {
    reloadOnActivation = false
    retryKey.value++
  }
})

// 切知识点或卸载时使旧请求失效，确保题目、选项与判分不会跨知识点串用。
watch(
  () => [props.code, retryKey.value] as const,
  async ([code], _previous, onCleanup) => {
    const current = ++generation
    onCleanup(() => {
      generation++
    })
    data.value = null
    resetAnswer()
    loading.value = true
    loadError.value = ''
    try {
      const loaded = await getLearningSelfCheck(code)
      if (generation === current) data.value = loaded
    } catch (error) {
      if (generation === current) loadError.value = getApiErrorMessage(error, '自测题暂时加载失败')
    } finally {
      if (generation === current) loading.value = false
    }
  },
  { immediate: true },
)

// 重做只重置当前面板的选择，不改题号、不更新练习统计。
function resetAnswer() {
  explanationOpen.value = true
  selectedAnswer.value = undefined
  result.value = null
  submitError.value = ''
  submitting.value = false
}

// 用加载时的题目身份核对固定精选题，避免编辑改题后使用旧题答案判分。
async function submitAnswer() {
  if (!data.value?.question || !selectedAnswer.value || submitting.value) return
  const current = generation
  submitting.value = true
  submitError.value = ''
  try {
    const checked = await checkLearningSelfCheck(
      props.code,
      data.value.question.id,
      selectedAnswer.value,
    )
    if (generation === current) result.value = checked
  } catch (error) {
    if (generation === current)
      submitError.value = getApiErrorMessage(error, '答案核对失败，请重试')
  } finally {
    if (generation === current) submitting.value = false
  }
}
</script>

<style scoped>
.knowledge-self-check {
  margin: 20px 0;
  min-width: 0;
}
/* 与例题拆解一致：浅青色题面、连续推理正文，提交前后保留同一题卡。 */
.knowledge-self-check__question {
  padding: 22px;
  border: 1px solid var(--color-learning-teal-line);
  border-top: 3px solid var(--color-learning-teal);
  border-radius: var(--radius-lg);
  background: linear-gradient(140deg, var(--color-learning-teal-soft), var(--color-surface));
}
.knowledge-self-check__header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-bottom: 12px;
}
.knowledge-self-check__header h5 {
  margin: 0;
  color: var(--color-learning-teal);
  font-size: var(--text-lg);
}
.knowledge-self-check__header span,
.knowledge-self-check__empty {
  color: var(--color-ink-soft);
  font-size: 14px;
}
.knowledge-self-check__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}
.knowledge-self-check__solution {
  margin: 18px 0 24px;
}
.knowledge-self-check__answer {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 24px;
  padding: 16px 20px;
  border-radius: var(--radius-md);
  background: var(--color-learning-teal-soft);
  line-height: 1.8;
}
.knowledge-self-check__answer > strong {
  color: var(--color-learning-teal);
}
.knowledge-self-check__answer > .is-incorrect {
  color: var(--color-learning-amber);
}
.knowledge-self-check__solution h6 {
  margin: 20px 0 10px;
  font-size: var(--text-base);
  color: var(--color-ink);
}
.knowledge-self-check__prose {
  margin: 12px 0 20px;
  line-height: 1.9;
  overflow-wrap: anywhere;
}
.knowledge-self-check__steps {
  display: grid;
  gap: 16px;
  padding: 8px 0 18px;
  margin: 0;
  list-style: none;
}
.knowledge-self-check__steps li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  line-height: 1.9;
}
.knowledge-self-check__steps li > span:first-child {
  display: grid;
  place-items: center;
  flex: none;
  width: 27px;
  height: 27px;
  margin-top: 2px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: 50%;
  color: var(--color-learning-teal);
  font-size: var(--text-sm);
}
.knowledge-self-check__steps li > :last-child {
  min-width: 0;
}
.knowledge-self-check__notes {
  margin-top: 14px;
  padding: 16px 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
}
.knowledge-self-check__notes h6 {
  margin: 0 0 10px;
  font-size: var(--text-sm);
}
.knowledge-self-check__notes ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 20px;
  font-size: var(--text-sm);
  line-height: 1.9;
}
.knowledge-self-check__takeaway {
  display: grid;
  gap: 8px;
  padding: 16px 20px;
  margin: 14px 0 0;
  border-left: 3px solid var(--color-learning-teal);
  background: var(--color-learning-teal-soft);
  font-size: var(--text-sm);
  line-height: 1.8;
}
.knowledge-self-check__takeaway strong {
  color: var(--color-learning-teal);
}
.knowledge-self-check .knowledge-self-check__actions :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-border: var(--color-learning-teal);
  --app-button-active-bg: var(--color-learning-teal-soft);
  --app-button-active-border: var(--color-learning-teal);
}
.knowledge-self-check .app-button.knowledge-self-check__submit {
  --app-button-bg: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-hover-border: var(--color-learning-teal);
  --app-button-active-bg: var(--color-learning-teal);
  --app-button-active-border: var(--color-learning-teal);
  margin-top: 12px;
}
.knowledge-self-check :deep(.question-card) {
  box-shadow: none;
}
@media (max-width: 640px) {
  .knowledge-self-check__question {
    padding: 14px;
  }
}
</style>
