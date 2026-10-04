<!-- 收藏详情：复用逐题解析组件，收藏后即可查看完整题目、答案与解析。 -->
<template>
  <div class="favorite-detail-page">
    <NavBar />
    <main>
      <header>
        <AppButton type="text" :icon="Back" @click="goBack">返回我的收藏</AppButton>
        <h1>收藏题目</h1>
        <el-select
          v-if="detail && store.states[questionId]"
          :model-value="store.states[questionId]?.categoryId || 'unclassified'"
          :disabled="store.busy[questionId]"
          aria-label="题目分类"
          @change="changeCategory"
        >
          <el-option label="未分类" value="unclassified" /><el-option
            v-for="category in summary?.categories || []"
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
      </header>
      <div v-if="loading" class="detail-state">正在加载题目…</div>
      <div v-else-if="error" class="detail-state" role="alert">
        <p>{{ error }}</p>
        <AppButton type="secondary" @click="load">重试</AppButton>
      </div>
      <ExamQuestionAnalysis
        v-else-if="detail"
        :questions="[detail.question]"
        :correct-count="0"
        single-question-mode
        :show-user-answer="false"
        show-favorite
      />
    </main>
    <FavoriteCategoryManager
      v-model="managerOpen"
      :exam-type="detail?.question.examType || auth.activeExamType"
      :categories="summary?.categories || []"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import NavBar from '@/components/NavBar.vue'
import AppButton from '@/components/AppButton.vue'
import ExamQuestionAnalysis from '@/components/report/ExamQuestionAnalysis.vue'
import FavoriteCategoryManager from './FavoriteCategoryManager.vue'
import {
  getFavoriteDetail,
  getFavoriteSummary,
  type FavoriteDetail,
  type FavoriteSummary,
} from '@/api/favorites'
import { useFavoritesStore } from '@/stores/favorites'
import { useAuthStore } from '@/stores/auth'
import { getApiErrorMessage } from '@/utils/request'
const route = useRoute()
const router = useRouter()
const store = useFavoritesStore()
const auth = useAuthStore()
const detail = ref<FavoriteDetail | null>(null)
const summary = ref<FavoriteSummary | null>(null)
const loading = ref(false)
const error = ref('')
const managerOpen = ref(false)
let sequence = 0
// 收藏详情直接使用官方题目 ID，无需定位某张答卷。
const questionId = computed(() => String(route.params.questionId || ''))
// 正常取消收藏后保留当前题目供继续阅读，返回列表时自然移除。
async function load() {
  const request = ++sequence
  loading.value = true
  error.value = ''
  try {
    const result = await getFavoriteDetail(questionId.value)
    if (request !== sequence) return
    detail.value = result
    store.states[questionId.value] = { questionId: questionId.value, categoryId: result.categoryId }
    void loadSummary()
  } catch (err) {
    if (request === sequence) error.value = getApiErrorMessage(err, '收藏题目加载失败')
  } finally {
    if (request === sequence) loading.value = false
  }
}
// 分类管理后刷新标签及计数，不重新请求可能已取消收藏的详情。
async function loadSummary() {
  const examType = detail.value?.question.examType
  if (!examType) return
  try {
    summary.value = await getFavoriteSummary(examType)
  } catch {
    /* 公共请求层处理错误。 */
  }
}
// 单题详情也能直接归类，避免来回查找列表。
async function changeCategory(categoryId: string) {
  try {
    await store.organize(
      detail.value!.question.examType,
      [questionId.value],
      'move',
      categoryId === 'unclassified' ? null : categoryId,
    )
  } catch {
    /* 保留原分类。 */
  }
}
// 返回地址严格限定错题本，保留原分类与筛选参数。
async function goBack() {
  const target = String(route.query.returnTo || '')
  await router.push(
    target === '/mistake-notebook' || target.startsWith('/mistake-notebook?')
      ? target
      : '/mistake-notebook?tab=favorites',
  )
}
watch(questionId, load, { immediate: true })
watch(() => store.revision, loadSummary)
</script>
<style scoped>
.favorite-detail-page {
  min-height: 100vh;
  background: var(--color-bg);
}
main {
  width: var(--fluid-shell-width);
  margin: 0 auto;
  padding: 32px 0;
}
header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}
h1 {
  font-size: 24px;
  font-weight: 500;
  margin: 0;
}
header .el-select {
  width: 180px;
  margin-left: auto;
}
.detail-state {
  padding: 28px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
</style>
