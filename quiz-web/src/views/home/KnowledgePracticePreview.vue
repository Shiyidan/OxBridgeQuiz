<!-- 首页知识图练习预览：按知识点和难度展示题库精选题，提供作答判定和原题解析。 -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Right, RefreshRight, Reading } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from '@/components/knowledge/KnowledgeText.vue'
import {
  knowledgePracticeExamples,
  practiceDifficultyLabels,
  type HomeKnowledgeTopic,
  type HomePracticeDifficulty,
} from './knowledgePracticeExamples'

const props = defineProps<{
  topic: HomeKnowledgeTopic
  topicLabel: string
  difficulty: HomePracticeDifficulty
}>()
const emit = defineEmits<{ learn: []; practice: [] }>()
const selectedAnswer = ref<number | null>(null)
// 同一个选择组合同时决定训练目标、题目与解析，避免只切换外观。
const exercise = computed(() => knowledgePracticeExamples[props.topic][props.difficulty])
// 直接使用题库的原始选项标签，与正确答案及解析保持一致。
const answerLabels = computed(() => exercise.value.answerLabels)
// 组合键让切换内容有轻微入场反馈，并重建题目内的临时交互状态。
const exerciseKey = computed(() => `${props.topic}-${props.difficulty}`)
// 回答前不展示正确选项；回答后给出当前示例的即时反馈。
const isCorrect = computed(() => selectedAnswer.value === exercise.value.answerIndex)

// 切换知识点或难度时清空上一题的答案，避免旧结果串入新内容。
function resetExercise() {
  selectedAnswer.value = null
}

// 首次选择后锁定本次反馈；用户可通过重新作答再次体验。
function chooseAnswer(index: number) {
  if (selectedAnswer.value === null) selectedAnswer.value = index
}

watch(exerciseKey, resetExercise, { flush: 'sync' })
</script>

<template>
  <div id="home-knowledge-practice" class="practice-preview">
    <div :key="exerciseKey" class="preview-content">
      <aside class="practice-focus">
        <span class="focus-eyebrow">从知识，到应用</span>
        <p class="selection-summary" aria-live="polite" aria-atomic="true">
          {{ topicLabel }} <span aria-hidden="true">/</span>
          {{ practiceDifficultyLabels[difficulty] }}
        </p>
        <h4>{{ exercise.title }}</h4>
        <p class="focus-description">{{ exercise.focus }}</p>
        <div class="focus-actions">
          <AppButton type="text" size="small" :icon="Reading" @click="emit('learn')"
            >先学这个知识点</AppButton
          >
          <AppButton
            type="text"
            size="small"
            :icon="Right"
            icon-position="right"
            @click="emit('practice')"
            >进入完整练习</AppButton
          >
        </div>
      </aside>

      <section class="quick-exercise" aria-labelledby="home-exercise-title">
        <header class="exercise-heading">
          <span id="home-exercise-title">试题库</span>
          <p class="answer-prompt">
            选一个答案，立即查看解析。切换上方知识点或难度，可以体验另一道题。
          </p>
        </header>
        <div class="exercise-question">
          <KnowledgeText :text="exercise.displayQuestion ?? exercise.question" />
        </div>
        <div class="exercise-options" role="group" aria-label="选择练习答案">
          <button
            v-for="(option, index) in exercise.options"
            :id="`home-exercise-option-${index}`"
            :key="index"
            type="button"
            :aria-pressed="selectedAnswer === index"
            :aria-disabled="selectedAnswer !== null"
            :class="{
              'option-correct': selectedAnswer !== null && index === exercise.answerIndex,
              'option-incorrect': selectedAnswer === index && !isCorrect,
            }"
            @click="chooseAnswer(index)"
          >
            <span class="option-label">{{ answerLabels[index] }}</span>
            <KnowledgeText :text="option" />
            <span
              v-if="selectedAnswer !== null && index === exercise.answerIndex"
              class="option-result"
              >正确答案</span
            >
            <span v-else-if="selectedAnswer === index" class="option-result">你的选择</span>
          </button>
        </div>
        <div
          class="exercise-response"
          :class="{ 'exercise-response--answered': selectedAnswer !== null }"
          aria-live="polite"
          aria-atomic="true"
        >
          <div v-if="selectedAnswer !== null" class="answer-feedback">
            <div class="feedback-heading">
              <strong>{{
                isCorrect
                  ? '答对了，思路很清楚。'
                  : `正确答案是 ${answerLabels[exercise.answerIndex]}，看看关键一步。`
              }}</strong>
              <AppButton
                id="home-exercise-retry"
                type="text"
                size="small"
                :icon="RefreshRight"
                @click="resetExercise"
                >重新作答</AppButton
              >
            </div>
            <div class="answer-explanation"><KnowledgeText :text="exercise.explanation" /></div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.practice-preview {
  margin: 20px 0 0;
  border: 1px solid #dde8f3;
  border-radius: 15px;
  background: #fff;
  overflow: hidden;
}
.preview-content {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.8fr);
  animation: preview-enter 0.25s ease-out;
}
.practice-focus {
  padding: 30px 32px;
  background: linear-gradient(145deg, #f1f7fe, #fbfdff 85%);
  border-right: 1px solid #e6eef7;
}
.focus-eyebrow {
  font-size: 11px;
  color: #6585a7;
  letter-spacing: 0.06em;
}
.selection-summary {
  margin: 19px 0 10px;
  color: #4386ca;
  font-size: 12px;
  font-weight: 600;
}
.selection-summary span {
  color: #bdcddd;
  padding: 0 10px;
}
.practice-focus h4 {
  margin: 0;
  color: #20333f;
  font-size: clamp(18px, 1.6vw, 22px);
  font-weight: 650;
  line-height: 1.5;
}
.focus-description {
  max-width: 290px;
  margin: 14px 0 22px;
  color: #73869a;
  font-size: 13px;
  line-height: 1.9;
}
.focus-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.focus-actions :deep(.app-button) {
  padding-left: 0;
  --app-button-color: #405e79;
}
.quick-exercise {
  min-width: 0;
  padding: 23px 30px 18px;
}
.exercise-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.exercise-heading > span {
  color: #000;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.exercise-question {
  min-height: 28px;
  margin: 12px 0 17px;
  color: #20333f;
  font-size: 15px;
  line-height: 1.9;
}
.exercise-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.exercise-options button {
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 48px;
  padding: 10px 13px;
  font: inherit;
  font-size: 13px;
  line-height: 1.8;
  text-align: left;
  border: 1px solid #e1e9f2;
  border-radius: 7px;
  background: #fff;
  color: #435c70;
  cursor: pointer;
  transition:
    border-color 0.18s,
    background 0.18s;
}
.exercise-options button:not([aria-disabled='true']):hover {
  background: #f6faff;
  border-color: #a4c8ed;
}
.option-label {
  flex: 0 0 20px;
  color: #8b9eb1;
  font-size: 11px;
}
.exercise-options button[aria-disabled='true'] {
  cursor: default;
}
.exercise-options button.option-correct {
  border-color: #b4cf80;
  background: #f4fae9;
  color: #426122;
}
.exercise-options button.option-incorrect {
  border-color: #ddc49d;
  background: #fff8ed;
  color: #806641;
}
.option-result {
  margin-left: auto;
  white-space: nowrap;
  font-size: 10px;
}
.exercise-options :deep(.knowledge-text) {
  min-width: 0;
  overflow-wrap: anywhere;
}
.exercise-response--answered {
  margin-top: 16px;
  border-top: 1px solid #edf2f7;
  padding-top: 12px;
}
.answer-prompt {
  margin: 0;
  font-size: 11px;
  color: #8b9bac;
  line-height: 1.8;
}
.feedback-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.feedback-heading strong {
  color: #466781;
  font-size: 12px;
  font-weight: 600;
}
.feedback-heading :deep(.app-button) {
  font-size: 11px;
  flex-shrink: 0;
}
.answer-explanation {
  margin: 5px 0 0;
  color: #61798e;
  font-size: 12px;
  line-height: 1.9;
}
button:focus-visible {
  outline: 2px solid #438ff1;
  outline-offset: 3px;
}
@keyframes preview-enter {
  from {
    opacity: 0.3;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 1100px) {
  .preview-content {
    grid-template-columns: 220px minmax(0, 1fr);
  }
  .practice-focus {
    padding: 24px 22px;
  }
  .quick-exercise {
    padding: 20px;
  }
  .exercise-options {
    grid-template-columns: 1fr;
  }
}
@media (prefers-reduced-motion: reduce) {
  .preview-content {
    animation: none;
  }
  .exercise-options button {
    transition: none;
  }
}
</style>
