<template>
  <div class="exam-container">
    <!-- 顶部导航 -->
    <header class="exam-header">
      <div class="header-left">
        <h1 class="paper-title">{{ paper?.title || '试卷' }}</h1>
        <span class="paper-info" v-if="paper">
          共 {{ paper.totalQuestions }} 题 | 限时 {{ paper.duration }} 分钟
        </span>
      </div>
      <div class="header-right">
        <div class="progress-info">
          <span class="progress-text">{{ answeredCount }} / {{ totalQuestions }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
        <button
          v-if="!submitted"
          class="submit-btn"
          :disabled="!isComplete"
          @click="handleSubmit"
        >
          交卷
        </button>
        <button v-else class="reset-btn" @click="handleReset">
          重新开始
        </button>
      </div>
    </header>

    <!-- 成绩展示 -->
    <div v-if="submitted && score" class="score-banner">
      <div class="score-content">
        <span class="score-label">得分</span>
        <span class="score-value" :class="scoreClass">
          {{ score.correct }} / {{ score.total }}
        </span>
        <span class="score-percentage">({{ score.percentage }}%)</span>
      </div>
    </div>

    <!-- 题目列表 -->
    <main class="questions-list">
      <QuestionRenderer
        v-for="question in paper?.questions"
        :key="question.id"
        :question="question"
        :selected-answer="getAnswer(question.id)"
        :submitted="submitted"
        @select="(opt) => setAnswer(question.id, opt)"
      />
    </main>

    <!-- 底部操作栏 -->
    <footer v-if="!submitted" class="exam-footer">
      <button
        class="submit-btn-large"
        :disabled="!isComplete"
        @click="handleSubmit"
      >
        提交答案
      </button>
      <span v-if="!isComplete" class="incomplete-tip">
        还有 {{ totalQuestions - answeredCount }} 题未作答
      </span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import QuestionRenderer from '@/components/QuestionRenderer.vue'
import { useExamStore } from '@/stores/exam'
import { storeToRefs } from 'pinia'
import type { Paper } from '@/types'

const store = useExamStore()

// 使用 storeToRefs 保持响应式
const { paper, submitted, answeredCount, totalQuestions, progress, isComplete, score } = storeToRefs(store)

const scoreClass = computed(() => {
  if (!score.value) return ''
  if (score.value.percentage >= 80) return 'excellent'
  if (score.value.percentage >= 60) return 'pass'
  return 'fail'
})

function handleSubmit() {
  if (confirm('确定要提交答案吗？')) {
    store.submit()
  }
}

function handleReset() {
  if (confirm('确定要重新开始吗？当前成绩将丢失。')) {
    store.reset()
    // 重新加载数据
    loadPaperData()
  }
}

function getAnswer(questionId: string) {
  return store.getAnswer(questionId)
}

function setAnswer(questionId: string, option: string) {
  store.setAnswer(questionId, option)
}

// 加载试卷数据
async function loadPaperData() {
  try {
    console.log('正在加载试卷数据...')
    // 从 public/data/paper.json 加载
    const response = await fetch('/data/paper.json')
    console.log('响应状态:', response.status)
    if (!response.ok) {
      throw new Error('Failed to load paper: ' + response.statusText)
    }
    const data: Paper = await response.json()
    console.log('加载成功:', data.title, '共', data.totalQuestions, '题')
    store.loadPaper(data)
  } catch (error) {
    console.error('加载试卷失败:', error)
    // 使用示例数据
    useDemoData()
  }
}

// 使用示例数据
function useDemoData() {
  const demoPaper: Paper = {
    title: 'ENGAA 2023 Section 1 (示例)',
    year: 2023,
    duration: 60,
    totalQuestions: 2,
    questions: [
      {
        id: 'q1',
        number: 1,
        content: [
          { type: 'text', value: 'The surface area of a solid sphere of radius R is equal to the total surface area of 10 solid closed cylinders of radius r and height 4r.' },
          { type: 'break' },
          { type: 'text', value: 'Which of the following is an expression for R in terms of r?' },
          { type: 'break' },
          { type: 'text', value: '(The surface area of a sphere of radius R is 4πR².)' }
        ],
        options: [
          { label: 'A', content: [{ type: 'formula', value: 'R = 5r', latex: 'R = 5r' }] },
          { label: 'B', content: [{ type: 'formula', value: 'R = √12r', latex: 'R = \\sqrt{12r}' }] },
          { label: 'C', content: [{ type: 'formula', value: 'R = √(25r/2)', latex: 'R = \\sqrt{\\frac{25r}{2}}' }] },
          { label: 'D', content: [{ type: 'formula', value: 'R = √10r', latex: 'R = \\sqrt{10r}' }] },
          { label: 'E', content: [{ type: 'formula', value: 'R = √3(10r)', latex: 'R = \\sqrt[3]{10r}' }] },
          { label: 'F', content: [{ type: 'formula', value: 'R = √15r', latex: 'R = \\sqrt{15r}' }] }
        ],
        correctAnswer: 'C',
        tags: ['geometry', 'surface-area']
      },
      {
        id: 'q2',
        number: 2,
        content: [
          { type: 'text', value: 'A spaceship of mass 10 000 kg is moving at 2.0 m s⁻¹ relative to a space station.' },
          { type: 'break' },
          { type: 'text', value: 'The spaceship is captured by a robotic arm attached to the space station and brought to rest by a force of 1000 N.' },
          { type: 'break' },
          { type: 'text', value: 'How far will the spaceship move in its initial direction relative to the space station while the force is being applied?' },
          { type: 'break' },
          { type: 'text', value: '(Assume that the acceleration of the space station is negligible.)' }
        ],
        options: [
          { label: 'A', content: [{ type: 'text', value: '0.050 m' }] },
          { label: 'B', content: [{ type: 'text', value: '0.10 m' }] },
          { label: 'C', content: [{ type: 'text', value: '0.20 m' }] },
          { label: 'D', content: [{ type: 'text', value: '5.0 m' }] },
          { label: 'E', content: [{ type: 'text', value: '10 m' }] },
          { label: 'F', content: [{ type: 'text', value: '20 m' }] }
        ],
        correctAnswer: 'F',
        tags: ['mechanics', 'kinematics']
      }
    ]
  }
  store.loadPaper(demoPaper)
}

onMounted(() => {
  loadPaperData()
})
</script>

<style scoped>
.exam-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.paper-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.paper-info {
  font-size: 0.875rem;
  color: #8c8c8c;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.progress-text {
  font-size: 0.875rem;
  color: #595959;
  font-weight: 500;
}

.progress-bar {
  width: 120px;
  height: 6px;
  background: #e8e8e8;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1890ff;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.submit-btn,
.reset-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.submit-btn {
  background: #1890ff;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.submit-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.reset-btn {
  background: #f0f0f0;
  color: #262626;
}

.reset-btn:hover {
  background: #e0e0e0;
}

.score-banner {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.score-content {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12px;
}

.score-label {
  font-size: 1rem;
  color: #8c8c8c;
}

.score-value {
  font-size: 2rem;
  font-weight: 700;
}

.score-value.excellent {
  color: #52c41a;
}

.score-value.pass {
  color: #faad14;
}

.score-value.fail {
  color: #ff4d4f;
}

.score-percentage {
  font-size: 1.25rem;
  color: #595959;
}

.questions-list {
  margin-bottom: 80px;
}

.exam-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 16px 20px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.submit-btn-large {
  padding: 12px 48px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn-large:hover:not(:disabled) {
  background: #40a9ff;
}

.submit-btn-large:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.incomplete-tip {
  color: #ff4d4f;
  font-size: 0.875rem;
}
</style>
