// 学习平台共享上下文：考纲选择、账号进度及相关练习册供总览和任务页面共同使用。
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { useAuthStore } from './auth'
import { getSyllabusData, type SyllabusNode } from '@/api/questionBank'
import {
  getLearningCompletions,
  getCompletedQuestionCounts,
  setLearningCompletion,
} from '@/api/learningCompletion'
import { getMember } from '@/api/member'
import {
  getPracticeNotebooks,
  type PracticeNotebookSummary,
  type ActiveNotebookPractice,
} from '@/api/practiceNotebook'
import { isFreePracticeScope } from '@/constants/freeLearningAccess'
import { getApiErrorMessage, hasApiErrorCode } from '@/utils/request'

export const useLearningWorkspaceStore = defineStore('learning-workspace', () => {
  const auth = useAuthStore()
  const syllabus = ref<SyllabusNode[]>([])
  const syllabusLoading = ref(false)
  const syllabusError = ref(false)
  const subjectCode = ref('')
  const selectedCode = ref('')
  const collapsed = ref(false)
  const completedCodes = ref<string[]>([])
  const completionLoading = ref(false)
  const completionError = ref(false)
  const completionSavingCode = ref('')
  const memberAllowed = ref(false)
  const counts = ref<Record<string, number>>({})
  const countsLoading = ref(false)
  const countsError = ref(false)
  const notebooks = ref<PracticeNotebookSummary[]>([])
  const activePractice = ref<ActiveNotebookPractice | null>(null)
  const notebooksLoading = ref(false)
  const notebooksError = ref(false)
  let syllabusEpoch = 0
  let personalEpoch = 0
  let syllabusExam = ''
  let pendingSyllabus: Promise<SyllabusNode[]> | undefined

  // API 的考试根节点不进入科目下拉，保持真实考纲顺序。
  const subjects = computed(() => syllabus.value[0]?.children || [])
  // 索引包含祖先路径，支持图谱跨章节选择后自动展开考纲。
  const index = computed(() => {
    const entries = new Map<
      string,
      { node: SyllabusNode; parents: string[]; subject: string; leaves: string[] }
    >()
    // 章节进度始终按真实叶子汇总，不依赖固定编号长度。
    function visit(node: SyllabusNode, parents: string[], subject: string): string[] {
      const leaves = node.children?.length
        ? node.children.flatMap((child) => visit(child, [...parents, node.code], subject))
        : [node.code]
      entries.set(node.code, { node, parents, subject, leaves })
      return leaves
    }
    subjects.value.forEach((node) => visit(node, [], node.code))
    return entries
  })
  // 选中知识点和科目都从同一份考纲派生，避免名称与页面范围不一致。
  const subject = computed(() => subjects.value.find((node) => node.code === subjectCode.value))
  // 右侧详情使用正式考纲名称，不从图谱标签反向解析。
  const selected = computed(() => index.value.get(selectedCode.value)?.node)
  // 科目进度只统计叶子知识点，避免把章节重复计数。
  const subjectLeaves = computed(() => index.value.get(subjectCode.value)?.leaves || [])
  // 总数随科目和当前账号的点亮状态即时更新。
  const completedTotal = computed(
    () => subjectLeaves.value.filter((code) => completedCodes.value.includes(code)).length,
  )
  // 未知读取状态和保存期间禁止反转进度。
  const completionDisabled = computed(
    () =>
      !auth.isLoggedIn ||
      completionLoading.value ||
      completionError.value ||
      Boolean(completionSavingCode.value),
  )
  // 无权益时不能新增付费点亮，已有点亮仍可取消。
  const lockedCodes = computed(() =>
    [...index.value.entries()]
      .filter(
        ([code, item]) =>
          !completionState(code).active &&
          !memberAllowed.value &&
          !item.leaves.every((leaf) => isFreePracticeScope(auth.activeExamType, leaf)),
      )
      .map(([code]) => code),
  )
  // 相关练习册按保存的知识点范围匹配，绝不把全部练习册默认限制到当前科目。
  const relatedNotebooks = computed(() => {
    const leaves = new Set(index.value.get(selectedCode.value)?.leaves || [])
    return notebooks.value.filter((book) =>
      book.knowledgePointCodes.some((code) => leaves.has(code)),
    )
  })

  // 两种导航共享选择，图谱中的跨章节节点也能切到对应科目。
  function select(code: string): void {
    const item = index.value.get(code)
    if (!item) return
    subjectCode.value = item.subject
    selectedCode.value = code
  }
  // 切换科目回到该科目总览，保留其他任务页面自己的表单状态。
  function selectSubject(code: string): void {
    if (!subjects.value.some((node) => node.code === code)) return
    subjectCode.value = code
    selectedCode.value = code
  }
  // 全亮与部分完成分别呈现，不能将空章节误报成已学完。
  function completionState(code: string) {
    const leaves = index.value.get(code)?.leaves || [code]
    const count = leaves.filter((leaf) => completedCodes.value.includes(leaf)).length
    return {
      active: leaves.length > 0 && count === leaves.length,
      partial: count > 0 && count < leaves.length,
    }
  }
  // 同考试请求合并；考试切换时旧响应不能覆盖新考纲。
  async function loadSyllabus(force = false): Promise<SyllabusNode[]> {
    const exam = auth.activeExamType
    if (!force && syllabusExam === exam) {
      if (pendingSyllabus) return pendingSyllabus
      if (syllabus.value.length) return syllabus.value
    }
    const epoch = ++syllabusEpoch
    syllabusExam = exam
    syllabusLoading.value = true
    syllabusError.value = false
    syllabus.value = []
    pendingSyllabus = getSyllabusData(exam)
    try {
      const nodes = await pendingSyllabus
      if (epoch !== syllabusEpoch) return nodes
      syllabus.value = nodes
      if (!subject.value) selectSubject(subjects.value[0]?.code || '')
      return nodes
    } catch (error) {
      if (epoch === syllabusEpoch) syllabusError.value = true
      throw error
    } finally {
      if (epoch === syllabusEpoch) {
        syllabusLoading.value = false
        pendingSyllabus = undefined
      }
    }
  }
  // 每次身份变化先清空所有个人数据，并独立呈现各接口失败，防止账号串态。
  async function loadPersonal(): Promise<void> {
    const epoch = ++personalEpoch
    completedCodes.value = []
    counts.value = {}
    notebooks.value = []
    activePractice.value = null
    memberAllowed.value = false
    completionSavingCode.value = ''
    completionError.value = countsError.value = notebooksError.value = false
    completionLoading.value = countsLoading.value = notebooksLoading.value = false
    if (!auth.isLoggedIn) return
    const exam = auth.activeExamType
    completionLoading.value = countsLoading.value = notebooksLoading.value = true
    await Promise.allSettled([
      getLearningCompletions(exam)
        .then((result) => {
          if (epoch === personalEpoch) completedCodes.value = result.items.map((item) => item.code)
        })
        .catch(() => {
          if (epoch === personalEpoch) completionError.value = true
        })
        .finally(() => {
          if (epoch === personalEpoch) completionLoading.value = false
        }),
      getCompletedQuestionCounts(exam)
        .then((result) => {
          if (epoch === personalEpoch) counts.value = result.counts
        })
        .catch(() => {
          if (epoch === personalEpoch) countsError.value = true
        })
        .finally(() => {
          if (epoch === personalEpoch) countsLoading.value = false
        }),
      getPracticeNotebooks(exam)
        .then((result) => {
          if (epoch !== personalEpoch) return
          notebooks.value = result.notebooks
          activePractice.value = result.activePractice
        })
        .catch(() => {
          if (epoch === personalEpoch) notebooksError.value = true
        })
        .finally(() => {
          if (epoch === personalEpoch) notebooksLoading.value = false
        }),
      getMember().then((result) => {
        if (epoch === personalEpoch)
          memberAllowed.value = Boolean(result.isAdmin || result.quotas[exam]?.learningAccess)
      }),
    ])
  }
  // 点亮沿用现有接口及日志规则：取消只更新状态，不新增操作日志。
  async function toggleCompletion(code: string): Promise<void> {
    if (completionDisabled.value || lockedCodes.value.includes(code)) return
    const epoch = personalEpoch
    const completed = !completionState(code).active
    completionSavingCode.value = code
    try {
      const result = await setLearningCompletion(auth.activeExamType, code, completed)
      if (epoch !== personalEpoch) return
      completedCodes.value = result.items.map((item) => item.code)
      ElMessage.success(completed ? '已点亮，学习进度已保存' : '已取消点亮')
    } catch (error) {
      if (epoch !== personalEpoch) return
      if (hasApiErrorCode(error, 'LEARNING_MEMBERSHIP_REQUIRED')) memberAllowed.value = false
      else ElMessage.error(getApiErrorMessage(error, '保存失败，请重试'))
    } finally {
      if (epoch === personalEpoch) completionSavingCode.value = ''
    }
  }

  watch(
    () => auth.activeExamType,
    () => {
      subjectCode.value = selectedCode.value = ''
      void loadSyllabus().catch(() => undefined)
    },
    { immediate: true, flush: 'sync' },
  )
  watch(
    () => [auth.user?.id, auth.isLoggedIn, auth.activeExamType],
    () => {
      void loadPersonal()
    },
    { immediate: true, flush: 'sync' },
  )

  return {
    syllabus,
    syllabusLoading,
    syllabusError,
    subjects,
    subjectCode,
    selectedCode,
    subject,
    selected,
    index,
    collapsed,
    subjectLeaves,
    completedTotal,
    completedCodes,
    completionLoading,
    completionError,
    completionSavingCode,
    completionDisabled,
    memberAllowed,
    lockedCodes,
    counts,
    countsLoading,
    countsError,
    notebooks,
    activePractice,
    notebooksLoading,
    notebooksError,
    relatedNotebooks,
    select,
    selectSubject,
    completionState,
    loadSyllabus,
    loadPersonal,
    toggleCompletion,
  }
})
