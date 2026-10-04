<!-- 我的收藏：按分类浏览题目，支持单题归类、批量整理及保留筛选的详情往返。 -->
<template>
  <section class="favorites-panel" aria-label="我的收藏">
    <form
      class="notebook-filter-bar favorite-filters"
      aria-label="收藏筛选"
      @submit.prevent="search"
    >
      <label class="filter-field">
        <span class="filter-field__label">科目</span>
        <el-select v-model="draft.subjectCode" clearable placeholder="全部科目">
          <el-option
            v-for="subject in summary?.subjects || []"
            :key="subject.subjectCode"
            :value="subject.subjectCode"
            :label="subject.subject || subject.subjectCode"
          />
        </el-select>
      </label>
      <label class="filter-field">
        <span class="filter-field__label">难度</span>
        <el-select v-model="draft.difficulty" clearable placeholder="全部难度">
          <el-option label="低" value="easy" /><el-option label="中" value="medium" /><el-option
            label="高"
            value="hard"
          />
        </el-select>
      </label>
      <label class="filter-field">
        <span class="filter-field__label">知识点</span>
        <el-input v-model="draft.knowledge" clearable maxlength="100" placeholder="输入知识点" />
      </label>
      <label class="filter-field">
        <span class="filter-field__label">题目搜索</span>
        <el-input v-model="draft.keyword" clearable maxlength="100" placeholder="输入题干关键词" />
      </label>
      <div class="filter-actions">
        <AppButton native-type="submit" size="small" :loading="loading">搜索</AppButton>
        <AppButton type="secondary" size="small" :disabled="loading" @click="reset">重置</AppButton>
      </div>
    </form>
    <div class="favorites-toolbar">
      <div class="category-bar">
        <div class="category-tabs" role="group" aria-label="收藏分类">
          <button type="button" :class="{ active: !query.categoryId }" @click="selectCategory('')">
            全部收藏 <span>{{ summary?.total ?? '—' }}</span>
          </button>
          <button
            type="button"
            :class="{ active: query.categoryId === 'unclassified' }"
            @click="selectCategory('unclassified')"
          >
            未分类 <span>{{ summary?.unclassified ?? '—' }}</span>
          </button>
          <button
            type="button"
            v-for="category in visibleCategories"
            :key="category.id"
            :class="{ active: query.categoryId === category.id }"
            @click="selectCategory(category.id)"
          >
            {{ category.name }} <span>{{ category.count }}</span>
          </button>
          <el-dropdown v-if="extraCategories.length" @command="selectCategory">
            <AppButton type="text" size="small"
              >更多分类 <el-icon><ArrowDown /></el-icon
            ></AppButton>
            <template #dropdown
              ><el-dropdown-menu
                ><el-dropdown-item
                  v-for="category in extraCategories"
                  :key="category.id"
                  :command="category.id"
                  >{{ category.name }} · {{ category.count }}</el-dropdown-item
                ></el-dropdown-menu
              ></template
            >
          </el-dropdown>
        </div>
        <AppButton type="text" size="small" :icon="FolderOpened" @click="managerOpen = true"
          >管理分类</AppButton
        >
      </div>
      <div class="favorites-toolbar__actions">
        <span class="sort-label">按收藏时间倒序</span>
        <AppButton
          type="secondary"
          size="small"
          :disabled="loading || (!items.length && !batchMode)"
          @click="toggleBatch"
          >{{ batchMode ? '完成管理' : '批量管理' }}</AppButton
        >
      </div>
    </div>
    <div v-if="batchMode" class="batch-toolbar">
      <el-checkbox
        :model-value="allSelected"
        :indeterminate="selected.length > 0 && !allSelected"
        :disabled="working"
        @change="selectPage"
        >选择本页</el-checkbox
      >
      <span>已选 {{ selected.length }} 题</span>
      <el-select
        :model-value="undefined"
        placeholder="移动到分类"
        :disabled="!selected.length || working"
        @change="moveSelected"
      >
        <el-option label="未分类" value="unclassified" /><el-option
          v-for="category in categories"
          :key="category.id"
          :label="category.name"
          :value="category.id"
        />
      </el-select>
      <AppButton
        type="text"
        size="small"
        :disabled="!selected.length || working"
        @click="removeOpen = true"
        >取消收藏</AppButton
      >
    </div>
    <div v-if="error" class="favorite-state" role="alert">
      <p>{{ error }}</p>
      <AppButton type="secondary" size="small" @click="load">重新加载</AppButton>
    </div>
    <div v-else-if="loading && !items.length" class="favorite-state">正在加载收藏…</div>
    <div v-else-if="!items.length" class="favorite-state">
      <el-icon class="empty-star"><Star /></el-icon>
      <h3>{{ hasFilters ? '暂无匹配的收藏' : '把值得再看的题目留在这里' }}</h3>
      <p>
        {{
          hasFilters
            ? '试试其他分类或筛选条件。'
            : '答题或查看解析时，点击题号旁的星标，即可随时回来复习。'
        }}
      </p>
    </div>
    <div v-else class="favorite-list" :aria-busy="loading">
      <article v-for="item in items" :key="item.questionId" class="favorite-item">
        <el-checkbox
          v-if="batchMode"
          :model-value="selected.includes(item.questionId)"
          :disabled="working"
          :aria-label="`选择题目：${item.question.title}`"
          @change="selectItem(item.questionId, Boolean($event))"
        />
        <div class="favorite-item__body">
          <div class="favorite-item__heading">
            <QuestionFavoriteButton :question-id="item.questionId" />
            <h3><LatexText :text="item.question.title" /></h3>
          </div>
          <div class="favorite-item__meta">
            <span v-if="item.question.subject">{{ item.question.subject }}</span>
            <QuestionDifficultyTag :difficulty="item.question.difficulty" />
            <span v-if="item.question.topic">知识点：{{ item.question.topic }}</span>
            <span>收藏于 {{ formatDate(item.createdAt) }}</span>
          </div>
        </div>
        <div class="favorite-item__actions">
          <el-select
            :model-value="item.categoryId || 'unclassified'"
            :disabled="working || store.busy[item.questionId]"
            aria-label="题目分类"
            @change="moveOne(item.questionId, $event)"
          >
            <el-option label="未分类" value="unclassified" /><el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
            <template #footer
              ><AppButton type="text" size="small" @click="managerOpen = true"
                >＋ 新建分类</AppButton
              ></template
            >
          </el-select>
          <AppButton type="secondary" size="small" @click="viewQuestion(item.questionId)"
            >查看题目</AppButton
          >
        </div>
      </article>
    </div>
    <AppPagination
      :page="query.page"
      :page-size="query.pageSize"
      :total="total"
      @page-change="changePage"
      @page-size-change="changePageSize"
    />
    <FavoriteCategoryManager v-model="managerOpen" :exam-type="examType" :categories="categories" />
    <AppDialog
      v-model="removeOpen"
      title="取消收藏"
      confirm-text="取消收藏"
      confirm-type="danger"
      :loading="working"
      @confirm="removeSelected"
    >
      确定取消所选 {{ selected.length }} 道题目的收藏？作答记录和错题历史会保留。
    </AppDialog>
  </section>
</template>
<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, FolderOpened, Star } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import AppDialog from '@/components/AppDialog.vue'
import AppPagination from '@/components/AppPagination.vue'
import LatexText from '@/components/LatexText.vue'
import QuestionFavoriteButton from './QuestionFavoriteButton.vue'
import QuestionDifficultyTag from './QuestionDifficultyTag.vue'
import FavoriteCategoryManager from './FavoriteCategoryManager.vue'
import {
  getFavorites,
  type FavoriteSummary,
  type FavoriteItem,
  type FavoriteQuery,
} from '@/api/favorites'
import { useFavoritesStore } from '@/stores/favorites'
import { getApiErrorMessage } from '@/utils/request'
const props = defineProps<{ examType: string; active: boolean; summary: FavoriteSummary | null }>()
const emit = defineEmits<{ loaded: []; beforeContentChange: [] }>()
const route = useRoute()
const router = useRouter()
const store = useFavoritesStore()
const items = ref<FavoriteItem[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const managerOpen = ref(false)
const batchMode = ref(false)
const selected = ref<string[]>([])
const working = ref(false)
const removeOpen = ref(false)
let sequence = 0
const query = reactive<FavoriteQuery>({
  examType: props.examType,
  page: Math.max(1, Number(route.query.fPage) || 1),
  pageSize: Math.min(100, Math.max(1, Number(route.query.fSize) || 20)),
  categoryId: String(route.query.fCategory || ''),
  keyword: String(route.query.fKeyword || ''),
  subjectCode: String(route.query.fSubject || ''),
  difficulty: String(route.query.fDifficulty || ''),
  knowledge: String(route.query.fKnowledge || ''),
})
const draft = reactive({
  keyword: query.keyword || '',
  subjectCode: query.subjectCode || '',
  difficulty: query.difficulty || '',
  knowledge: query.knowledge || '',
})
// 分类数来自整个工作区，列表搜索不改变分类数量。
const categories = computed(() => props.summary?.categories || [])
// 将正在浏览的分类保留在可见行，其他较多分类收进下拉菜单。
const visibleCategories = computed(() => {
  const first = categories.value.slice(0, 3)
  const current = categories.value.find((item) => item.id === query.categoryId)
  if (current && !first.includes(current)) first.splice(2, 1, current)
  return first
})
// 溢出的分类保持管理抽屉中设定的顺序。
const extraCategories = computed(() =>
  categories.value.filter((item) => !visibleCategories.value.includes(item)),
)
// 只有当前页面全部勾选时，全选框才显示选中。
const allSelected = computed(
  () => items.value.length > 0 && selected.value.length === items.value.length,
)
// 区分首次没有收藏与筛选后没有匹配题目。
const hasFilters = computed(() =>
  Boolean(
    query.categoryId || query.keyword || query.subjectCode || query.difficulty || query.knowledge,
  ),
)
// 分类和分页写入独立查询参数，避免覆盖我的错题的筛选条件。
async function syncRoute() {
  if (route.name !== 'mistake-notebook') return
  await router.replace({
    query: {
      ...route.query,
      fPage: String(query.page),
      fSize: String(query.pageSize),
      fCategory: query.categoryId || undefined,
      fKeyword: query.keyword || undefined,
      fSubject: query.subjectCode || undefined,
      fDifficulty: query.difficulty || undefined,
      fKnowledge: query.knowledge || undefined,
    },
  })
}
// 请求序号保证快速切换分类或工作区时只呈现最后一次结果。
async function load() {
  const request = ++sequence
  if (props.active) emit('beforeContentChange')
  loading.value = true
  error.value = ''
  try {
    const result = await getFavorites({ ...query, examType: props.examType })
    if (request !== sequence) return
    // 请求期间用户仍可滚动，按响应到达时的位置预留高度，不拉回点击时的位置。
    if (props.active) emit('beforeContentChange')
    total.value = result.total
    if (
      query.page > 1 &&
      !result.items.length &&
      result.total <= (query.page - 1) * query.pageSize
    ) {
      query.page = Math.max(1, Math.ceil(result.total / query.pageSize))
      await load()
      return
    }
    items.value = result.items
    result.items.forEach((item) => {
      if (!store.busy[item.questionId])
        store.states[item.questionId] = { questionId: item.questionId, categoryId: item.categoryId }
    })
    selected.value = selected.value.filter((id) =>
      items.value.some((item) => item.questionId === id),
    )
    await syncRoute()
    emit('loaded')
  } catch (err) {
    if (request === sequence) {
      if (props.active) emit('beforeContentChange')
      items.value = []
      error.value = getApiErrorMessage(err, '收藏加载失败，请重试')
    }
  } finally {
    if (request === sequence) loading.value = false
  }
}
// 切换分类清空跨分类勾选，避免用户误操作隐藏的题目。
async function selectCategory(id: string) {
  query.categoryId = id
  query.page = 1
  selected.value = []
  await load()
}
// 只有搜索确认后应用草稿条件。
async function search() {
  Object.assign(query, draft, { page: 1 })
  selected.value = []
  await load()
}
// 重置保留当前分类，清空科目、难度、知识点与搜索。
async function reset() {
  Object.assign(draft, { keyword: '', subjectCode: '', difficulty: '', knowledge: '' })
  await search()
}
// 分页只选择当前页面，防止上一页的选中项被批量修改。
async function changePage(page: number) {
  query.page = page
  selected.value = []
  await load()
}
// 每页数量变化回到第一页。
async function changePageSize(size: number) {
  query.pageSize = size
  await changePage(1)
}
// 退出管理时清空临时勾选。
function toggleBatch() {
  batchMode.value = !batchMode.value
  selected.value = []
}
// 全选范围明确限定本页。
function selectPage(value: unknown) {
  selected.value = value ? items.value.map((item) => item.questionId) : []
}
// 单题勾选始终保持去重。
function selectItem(id: string, value: boolean) {
  selected.value = value
    ? [...new Set([...selected.value, id])]
    : selected.value.filter((item) => item !== id)
}
// 整理完成刷新列表与上方分类统计。
async function organize(ids: string[], action: 'move' | 'remove', categoryId?: string) {
  working.value = true
  try {
    if (
      await store.organize(
        props.examType,
        ids,
        action,
        categoryId === 'unclassified' ? null : categoryId || null,
      )
    ) {
      selected.value = []
      removeOpen.value = false
    }
  } catch {
    /* 保留当前选择以便重试。 */
  } finally {
    working.value = false
  }
}
// 单题分类与批量分类使用同一个服务端规则。
async function moveOne(id: string, categoryId: string) {
  await organize([id], 'move', categoryId)
}
// 批量移动前复制选择，避免响应期间列表变化影响操作范围。
async function moveSelected(categoryId: string) {
  await organize([...selected.value], 'move', categoryId)
}
// 批量取消需在确认弹窗中执行。
async function removeSelected() {
  await organize([...selected.value], 'remove')
}
// 详情保存完整列表地址，返回时可恢复分类、筛选和页码。
async function viewQuestion(questionId: string) {
  await syncRoute()
  await router.push({
    name: 'favorite-question',
    params: { questionId },
    query: { returnTo: route.fullPath },
  })
}
// 收藏日期按用户本地时区显示。
function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN')
}
watch(
  () => [props.active, props.examType] as const,
  async ([active, exam], previous) => {
    if (previous && exam !== previous[1]) {
      sequence++
      items.value = []
      query.categoryId = ''
      query.page = 1
      Object.assign(query, { keyword: '', subjectCode: '', difficulty: '', knowledge: '' })
      Object.assign(draft, { keyword: '', subjectCode: '', difficulty: '', knowledge: '' })
      selected.value = []
      managerOpen.value = false
    }
    if (active) {
      await nextTick()
      await load()
    }
  },
  { immediate: true },
)
watch(
  () => store.revision,
  () => {
    if (props.active) void load()
  },
)
watch(categories, () => {
  if (
    props.summary &&
    query.categoryId &&
    query.categoryId !== 'unclassified' &&
    !categories.value.some((item) => item.id === query.categoryId)
  )
    void selectCategory('')
})
</script>
<style scoped>
.favorites-panel {
  padding-bottom: 24px;
}
.category-tabs,
.category-bar,
.favorites-toolbar,
.favorites-toolbar__actions,
.batch-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
}
.category-bar {
  flex: 1;
  min-width: 0;
  min-height: 32px;
}
.category-bar > .app-button {
  flex-shrink: 0;
}
.category-tabs {
  gap: 8px;
  min-width: 0;
  min-height: 32px;
  overflow-x: auto;
  scrollbar-width: none;
}
.category-tabs > * {
  flex-shrink: 0;
}
.category-tabs > button {
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #647080;
  padding: 4px 10px;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  line-height: 20px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.category-tabs > button:hover {
  background: #f0f1f3;
}
.category-tabs > button.active {
  color: #84631d;
  background: #fff7e3;
  border-color: #edddb2;
}
.category-tabs span {
  margin-left: 6px;
  font-size: 12px;
  opacity: 0.8;
}
.favorite-filters.notebook-filter-bar {
  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1fr)
    minmax(0, 1.2fr)
    minmax(0, 1.5fr)
    auto;
  column-gap: 16px;
}
.favorite-filters .filter-actions {
  grid-column: auto;
}
.favorites-toolbar {
  flex-wrap: wrap;
  min-height: 32px;
  margin-bottom: 10px;
}
.favorites-toolbar__actions {
  flex-shrink: 0;
  margin-left: auto;
}
.sort-label {
  color: #8c94a0;
  font-size: var(--text-xs);
  white-space: nowrap;
}
.batch-toolbar {
  padding: 14px 20px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: #f0f3f7;
  font-size: 14px;
}
.batch-toolbar .el-select {
  width: 170px;
}
.favorite-list {
  display: grid;
  gap: 12px;
  padding-bottom: 24px;
}
.favorite-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
.favorite-item__body {
  flex: 1;
  min-width: 0;
}
.favorite-item__heading {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 12px;
}
.favorite-item__heading :deep(.favorite-button) {
  margin-left: 0;
}
.favorite-item h3 {
  min-width: 0;
  margin: 3px 0 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.favorite-item__meta {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
  color: #8b929d;
  font-size: 12px;
}
.favorite-item__actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.favorite-item__actions .el-select {
  width: 160px;
}
.favorite-state {
  text-align: center;
  padding: 70px 24px;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: #858e9a;
}
.favorite-state h3 {
  color: #414b59;
  font-size: 18px;
  font-weight: 500;
}
.empty-star {
  font-size: 42px;
  color: #d8c395;
}
@media (max-width: 800px) {
  .favorite-item__actions {
    flex-direction: column;
  }
}
@media (max-width: 780px), (max-device-width: 780px) {
  .category-bar {
    flex-basis: 100%;
  }
  .favorite-filters.notebook-filter-bar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 8px;
  }
  .favorite-filters .filter-actions {
    grid-column: 2 / span 2;
    align-self: end;
  }
}
</style>
