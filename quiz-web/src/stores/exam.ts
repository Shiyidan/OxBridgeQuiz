import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Paper, Question } from '@/types'

export const useExamStore = defineStore('exam', () => {
  // State
  const paper = ref<Paper | null>(null)
  const answers = ref<Map<string, string>>(new Map())
  const submitted = ref(false)
  const startedAt = ref<number | null>(null)
  const submittedAt = ref<number | null>(null)

  // Getters
  const totalQuestions = computed(() => paper.value?.totalQuestions || 0)
  const answeredCount = computed(() => answers.value.size)
  const progress = computed(() => {
    if (totalQuestions.value === 0) return 0
    return Math.round((answeredCount.value / totalQuestions.value) * 100)
  })

  const score = computed(() => {
    if (!paper.value || !submitted.value) return null

    let correct = 0
    paper.value.questions.forEach((q) => {
      if (q.correctAnswer && answers.value.get(q.id) === q.correctAnswer) {
        correct++
      }
    })

    return {
      correct,
      total: totalQuestions.value,
      percentage: Math.round((correct / totalQuestions.value) * 100)
    }
  })

  const isComplete = computed(() => {
    return answeredCount.value === totalQuestions.value
  })

  // Actions
  function loadPaper(data: Paper) {
    paper.value = data
    answers.value = new Map()
    submitted.value = false
    startedAt.value = Date.now()
    submittedAt.value = null
  }

  function setAnswer(questionId: string, option: string) {
    if (submitted.value) return
    answers.value.set(questionId, option)
  }

  function getAnswer(questionId: string): string | undefined {
    return answers.value.get(questionId)
  }

  function submit() {
    if (submitted.value) return
    submitted.value = true
    submittedAt.value = Date.now()
  }

  function reset() {
    paper.value = null
    answers.value = new Map()
    submitted.value = false
    startedAt.value = null
    submittedAt.value = null
  }

  return {
    // State
    paper,
    answers,
    submitted,
    startedAt,
    submittedAt,
    // Getters
    totalQuestions,
    answeredCount,
    progress,
    score,
    isComplete,
    // Actions
    loadPaper,
    setAnswer,
    getAnswer,
    submit,
    reset
  }
})
