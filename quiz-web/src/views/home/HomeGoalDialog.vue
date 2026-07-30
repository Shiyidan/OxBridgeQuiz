<!-- 登录后首页备考目标选择：补齐考试与科目后写回既有个人偏好接口。 -->
<template>
  <Teleport to="body">
    <Transition name="home-demo-fade">
      <div
        v-if="modelValue && examType"
        class="home-demo-backdrop"
        role="presentation"
        @mousedown.self="closeDialog"
      >
        <section
          ref="dialogRef"
          class="home-goal-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-goal-title"
          tabindex="-1"
          @keydown.esc.prevent="closeDialog"
          @keydown.tab="trapFocus"
        >
          <header class="home-goal-dialog__header">
            <div>
              <span>备考目标</span>
              <h2 id="home-goal-title">选择 {{ examType }} 作为当前目标</h2>
            </div>
            <button
              type="button"
              aria-label="关闭备考目标选择"
              :disabled="saving"
              @click="closeDialog"
            >
              ×
            </button>
          </header>

          <div class="home-goal-dialog__body">
            <template v-if="examType === 'ESAT'">
              <p>ESAT 诊断按三门科目分别生成结果。Mathematics 1 为必选，再选择两门科目。</p>
              <div class="home-goal-subjects" aria-label="选择 ESAT 三门科目">
                <button
                  v-for="subject in esatSubjects"
                  :key="subject.value"
                  type="button"
                  :class="{ 'is-selected': selectedSubjects.includes(subject.value) }"
                  :aria-pressed="selectedSubjects.includes(subject.value)"
                  :disabled="subject.required || isSubjectDisabled(subject.value)"
                  @click="toggleSubject(subject.value)"
                >
                  <b>{{ subject.label }}</b>
                  <span>{{
                    subject.required
                      ? '必选'
                      : selectedSubjects.includes(subject.value)
                        ? '已选择'
                        : '可选'
                  }}</span>
                </button>
              </div>
              <p class="home-goal-dialog__count">已选择 {{ selectedSubjects.length }} / 3 门</p>
            </template>
            <template v-else>
              <p>TMUA 使用 Mathematics 一项备考目标，诊断保留 Paper 1 与 Paper 2 的完整结构。</p>
              <div class="home-goal-confirmation">
                <span>TMUA</span><b>Mathematics · Paper 1 ＋ Paper 2</b>
              </div>
            </template>
          </div>

          <footer class="home-goal-dialog__footer">
            <button
              type="button"
              class="home-button home-button--secondary"
              :disabled="saving"
              @click="closeDialog"
            >
              暂不选择
            </button>
            <button
              type="button"
              class="home-button home-button--primary"
              :disabled="!canSave || saving"
              @click="saveGoal"
            >
              {{ saving ? '正在保存…' : '保存并进入我的首页' }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ActiveExamType } from '@/stores/auth'
import { useHomeDialogFocus } from './useHomeDialogFocus'

const props = defineProps<{
  modelValue: boolean
  examType: ActiveExamType | null
  saving: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', value: { examType: ActiveExamType; subjects: string[] }): void
}>()

const esatSubjects = [
  { value: '数学1', label: 'Mathematics 1', required: true },
  { value: '数学2', label: 'Mathematics 2', required: false },
  { value: '物理', label: 'Physics', required: false },
  { value: '化学', label: 'Chemistry', required: false },
  { value: '生物', label: 'Biology', required: false },
] as const

const selectedSubjects = ref<string[]>(['数学1'])
const dialogRef = ref<HTMLElement | null>(null)
const { trapFocus } = useHomeDialogFocus(
  dialogRef,
  () => props.modelValue && Boolean(props.examType),
)

// ESAT 必须确认三门科目；TMUA 的 Mathematics 由系统固定带入。
const canSave = computed(
  () =>
    props.examType === 'TMUA' || (props.examType === 'ESAT' && selectedSubjects.value.length === 3),
)

// 达到三门上限后锁定其他未选科目，避免保存不兼容的选科组合。
function isSubjectDisabled(subject: string): boolean {
  return selectedSubjects.value.length >= 3 && !selectedSubjects.value.includes(subject)
}

// 用户只能切换 ESAT 可选科目，Mathematics 1 始终保留。
function toggleSubject(subject: string): void {
  const index = selectedSubjects.value.indexOf(subject)
  if (index >= 0) selectedSubjects.value.splice(index, 1)
  else if (selectedSubjects.value.length < 3) selectedSubjects.value.push(subject)
}

// 保存时把界面选择转换为会员偏好接口使用的中文科目代码。
function saveGoal(): void {
  if (!props.examType || !canSave.value) return
  emit('save', {
    examType: props.examType,
    subjects: props.examType === 'TMUA' ? ['数学'] : [...selectedSubjects.value],
  })
}

// 保存期间不允许关闭，避免用户误以为目标没有写入。
function closeDialog(): void {
  if (props.saving) return
  emit('update:modelValue', false)
}

// 每次打开 ESAT 选择器都从必选科目开始，避免沿用上一次取消的临时选择。
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) selectedSubjects.value = ['数学1']
  },
)
</script>
