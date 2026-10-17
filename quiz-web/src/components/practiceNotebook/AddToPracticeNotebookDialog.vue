<!-- 加入练习本弹窗：明确目标练习本及其既有组卷设置，避免静默改变难度和题量。 -->
<template>
  <AppDialog
    :model-value="modelValue"
    title="加入练习本"
    width="620px"
    confirm-text="确认加入"
    :confirm-disabled="!selectedNotebook || selectedNotebookAlreadyContainsScope"
    :loading="saving"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="emit('confirm')"
    @cancel="emit('cancel')"
  >
    <section class="notebook-scope" aria-label="当前知识点">
      <span>当前知识点</span>
      <strong>{{ scopeCnLabel }}</strong>
      <small>{{ scopeEnLabel }}</small>
      <em v-if="scopeLeafCount > 1">将加入其下 {{ scopeLeafCount }} 个叶子知识点</em>
    </section>

    <p class="notebook-dialog-tip">选择要加入的练习本。难度、题量和时间沿用该练习本的设置。</p>

    <div v-if="loading" class="notebook-dialog-state">正在加载练习本...</div>
    <div v-else-if="!notebooks.length" class="notebook-dialog-state">
      当前考试还没有练习本，可使用下方入口新建。
    </div>
    <div v-else class="notebook-options" role="radiogroup" aria-label="选择练习本">
      <button
        v-for="notebook in notebooks"
        :key="notebook.id"
        type="button"
        class="notebook-option"
        :class="{
          'notebook-option--selected': selectedNotebookId === notebook.id,
          'notebook-option--disabled': alreadyContainsScope(notebook),
        }"
        role="radio"
        :aria-checked="selectedNotebookId === notebook.id"
        :disabled="alreadyContainsScope(notebook)"
        @click="emit('select', notebook.id)"
      >
        <span class="notebook-option__radio" aria-hidden="true"></span>
        <span class="notebook-option__body">
          <span class="notebook-option__title-row">
            <strong>{{ notebook.name }}</strong>
            <em>{{ difficultyLabel(notebook.difficultyMode) }}</em>
          </span>
          <span class="notebook-option__settings">{{ settingsLabel(notebook) }}</span>
        </span>
        <span class="notebook-option__scope">
          {{
            alreadyContainsScope(notebook)
              ? '已包含当前知识点'
              : `已选 ${notebook.knowledgePointCodes.length} 个知识点`
          }}
        </span>
      </button>
    </div>

    <button type="button" class="notebook-create-entry" @click="emit('create')">
      <span aria-hidden="true">＋</span>
      <span>
        <strong>新建练习本</strong>
        <small>默认选中当前知识点，再设置名称、难度、题量和时间</small>
      </span>
    </button>

    <section v-if="selectedNotebook" class="notebook-confirm-summary" aria-live="polite">
      <span
        >将加入：<strong>{{ selectedNotebook.name }}</strong></span
      >
      <small>{{ confirmationLabel(selectedNotebook) }}</small>
    </section>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppDialog from '@/components/AppDialog.vue'
import type { PracticeDifficultyMode, PracticeNotebookSummary } from '@/api/practiceNotebook'

const props = defineProps<{
  modelValue: boolean
  notebooks: PracticeNotebookSummary[]
  selectedNotebookId: string
  scopeCodes: string[]
  scopeCnLabel: string
  scopeEnLabel: string
  scopeLeafCount: number
  loading: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [visible: boolean]
  select: [notebookId: string]
  confirm: []
  cancel: []
  create: []
}>()

const DIFFICULTY_LABELS: Record<PracticeDifficultyMode, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
  mixed: '混合难度',
}

// 当前选中项从父页面传入的 ID 派生，弹窗本身不复制练习本状态。
const selectedNotebook = computed(() =>
  props.notebooks.find((item) => item.id === props.selectedNotebookId),
)

// 完整包含当前范围时禁用确认，部分包含仍允许父页面补齐缺失节点。
const selectedNotebookAlreadyContainsScope = computed(() =>
  selectedNotebook.value ? alreadyContainsScope(selectedNotebook.value) : false,
)

// 已有练习本的难度是整本配置，弹窗只读展示并在加入时保持不变。
function difficultyLabel(mode: PracticeDifficultyMode): string {
  return DIFFICULTY_LABELS[mode]
}

// 练习本卡片集中说明每次组卷的题量、限时和未做优先规则。
function settingsLabel(notebook: PracticeNotebookSummary): string {
  const duration = notebook.durationMinutes === null ? '不限时' : `${notebook.durationMinutes} 分钟`
  return `每次 ${notebook.questionCount} 题 · ${duration}${notebook.unseenFirst ? ' · 未做优先' : ''}`
}

// 当前范围的全部叶子节点都已存在时禁止重复加入，部分重复仍只补充缺失节点。
function alreadyContainsScope(notebook: PracticeNotebookSummary): boolean {
  return (
    props.scopeCodes.length > 0 &&
    props.scopeCodes.every((code) => notebook.knowledgePointCodes.includes(code))
  )
}

// 最终确认区重复目标练习本的核心设置，避免用户只凭名称误操作。
function confirmationLabel(notebook: PracticeNotebookSummary): string {
  return `${difficultyLabel(notebook.difficultyMode)} · ${settingsLabel(notebook)}`
}
</script>

<style scoped lang="scss">
.notebook-scope {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 3px 12px;
  padding: 14px 16px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: var(--color-surface-alt);
}

.notebook-scope > span {
  grid-row: span 2;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.notebook-scope strong {
  color: var(--color-ink);
  font-size: var(--text-sm);
}

.notebook-scope small {
  color: var(--color-ink-muted);
}

.notebook-scope em {
  grid-column: 2;
  color: var(--color-learning-blue);
  font-size: var(--text-xs);
  font-style: normal;
}

.notebook-dialog-tip {
  margin: 14px 0 12px;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.notebook-dialog-state {
  padding: 28px 16px;
  border: 1px dashed var(--color-line);
  border-radius: 8px;
  color: var(--color-ink-muted);
  text-align: center;
}

.notebook-options {
  display: grid;
  gap: 10px;
}

.notebook-option {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 14px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.notebook-option:hover:not(:disabled),
.notebook-option--selected {
  border-color: var(--color-learning-blue);
  background: var(--color-learning-blue-soft);
}

.notebook-option:focus-visible,
.notebook-create-entry:focus-visible {
  outline: 2px solid var(--color-learning-blue);
  outline-offset: 2px;
}

.notebook-option--disabled {
  background: var(--color-surface-alt);
  color: var(--color-ink-muted);
  cursor: not-allowed;
}

.notebook-option__radio {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-ink-muted);
  border-radius: 50%;
  box-shadow: inset 0 0 0 3px var(--color-surface);
}

.notebook-option--selected .notebook-option__radio {
  border-color: var(--color-learning-blue);
  background: var(--color-learning-blue);
}

.notebook-option__body {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.notebook-option__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notebook-option__title-row strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notebook-option__title-row em {
  flex: none;
  padding: 2px 7px;
  border-radius: 5px;
  background: var(--color-learning-blue-soft);
  color: var(--color-learning-blue);
  font-size: 11px;
  font-style: normal;
}

.notebook-option__settings,
.notebook-option__scope {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.notebook-option__scope {
  max-width: 122px;
  text-align: right;
}

.notebook-create-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 12px;
  padding: 13px 16px;
  border: 1px dashed var(--color-learning-blue-line);
  border-radius: 8px;
  background: transparent;
  color: var(--color-learning-blue);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.notebook-create-entry > span:first-child {
  font-size: 24px;
}

.notebook-create-entry > span:last-child {
  display: grid;
  gap: 3px;
}

.notebook-create-entry small {
  color: var(--color-ink-muted);
}

.notebook-confirm-summary {
  display: grid;
  gap: 4px;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--color-learning-blue-soft);
  color: var(--color-ink);
}

.notebook-confirm-summary small {
  color: var(--color-ink-soft);
}

@media (max-width: 780px) {
  .notebook-option {
    grid-template-columns: 18px minmax(0, 1fr);
  }

  .notebook-option__scope {
    grid-column: 2;
    max-width: none;
    text-align: left;
  }
}
</style>
