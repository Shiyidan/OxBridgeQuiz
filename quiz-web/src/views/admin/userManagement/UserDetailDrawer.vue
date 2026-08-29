<template>
  <el-drawer
    :model-value="modelValue"
    :title="detail ? `${detail.profile.username} 的用户详情` : '用户详情'"
    size="min(820px, 96vw)"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="user-detail-drawer">
      <template v-if="detail">
        <section class="profile-card">
          <div class="profile-identity">
            <div class="profile-avatar" aria-hidden="true">
              <AppAvatar
                :source="detail.profile.avatar"
                :name="detail.profile.username"
                decorative
              />
            </div>
            <div>
              <div class="profile-name-row">
                <h3>{{ detail.profile.username }}</h3>
                <el-tag :type="detail.profile.role === 'admin' ? 'danger' : 'info'" effect="light">
                  {{ roleLabel(detail.profile.role) }}
                </el-tag>
              </div>
              <p>{{ detail.profile.email }}</p>
            </div>
          </div>
          <dl class="profile-times">
            <div>
              <dt>登录位置</dt>
              <dd>{{ formatLoginLocation(detail.loginLocation) }}</dd>
            </div>
            <div>
              <dt>注册时间</dt>
              <dd>{{ formatDateTime(detail.profile.createdAt) }}</dd>
            </div>
            <div>
              <dt>最近活跃</dt>
              <dd>{{ formatOptionalDateTime(detail.lastActiveAt) }}</dd>
            </div>
          </dl>
        </section>

        <section class="detail-section source-entitlement-section">
          <div class="section-heading">
            <div>
              <h3>来源与权益</h3>
              <p>展示注册邀请来源和当前正在生效的用户权益。</p>
            </div>
          </div>

          <div class="source-entitlement-grid">
            <article>
              <div class="info-card-title">
                <span>注册来源</span>
                <el-tag
                  :type="detail.sourceAndEntitlements.invitation ? 'primary' : 'info'"
                  effect="plain"
                  size="small"
                >
                  {{ detail.sourceAndEntitlements.invitation ? '邀请码' : '自然注册' }}
                </el-tag>
              </div>
              <template v-if="detail.sourceAndEntitlements.invitation">
                <div class="registration-source-line">
                  <strong>
                    来自 {{ detail.sourceAndEntitlements.invitation.inviter.username }}
                  </strong>
                  <span>邀请码 {{ detail.sourceAndEntitlements.invitation.code }}</span>
                  <span>
                    {{ bindingSourceLabel(detail.sourceAndEntitlements.invitation.bindingSource) }}
                  </span>
                  <span>
                    绑定于 {{ formatDateTime(detail.sourceAndEntitlements.invitation.boundAt) }}
                  </span>
                </div>
              </template>
              <template v-else>
                <div class="registration-source-line">
                  <strong>未绑定邀请码</strong>
                  <span>该用户没有邀请来源记录</span>
                </div>
              </template>
            </article>

            <article>
              <div class="info-card-title">
                <span>当前权益</span>
                <el-tag
                  :type="detail.sourceAndEntitlements.accessLevel === 'free' ? 'info' : 'success'"
                  effect="plain"
                  size="small"
                >
                  {{ accessLevelLabel(detail.sourceAndEntitlements.accessLevel) }}
                </el-tag>
              </div>
              <div class="current-entitlement-line">
                <div v-if="detail.sourceAndEntitlements.accessLevel === 'admin'">
                  <strong>全产品管理员权限</strong>
                  <span>当前账号不受会员权益限制</span>
                </div>
                <template v-else-if="detail.sourceAndEntitlements.memberships.length">
                  <div
                    v-for="membership in detail.sourceAndEntitlements.memberships"
                    :key="membership.id"
                  >
                    <strong>
                      {{ membership.examType }} · {{ membershipPlanLabel(membership.plan) }}
                    </strong>
                    <span>
                      有效至
                      {{ formatDateTime(membership.entitlementEndsAt ?? membership.endsAt) }}
                    </span>
                  </div>
                </template>
                <div v-else>
                  <strong>免费用户</strong>
                  <span>当前没有正在生效的会员权益</span>
                </div>
                <div
                  v-for="card in detail.sourceAndEntitlements.rewardCards"
                  :key="card.key"
                >
                  <strong>{{ card.label }} {{ card.total }} 张</strong>
                  <span>{{ rewardCardStatusSummary(card) }}</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="detail-section attempt-section">
          <div class="section-heading">
            <div>
              <h3>学习数据概览</h3>
              <p>点击模块查看对应的答题记录或错题分布。</p>
            </div>
          </div>
          <div v-if="detail.overview.moduleAttemptCounts.length" class="module-count-list">
            <button
              v-for="item in detail.overview.moduleAttemptCounts"
              :key="item.key"
              type="button"
              :class="{ 'is-active': selectedModule === item.key }"
              :aria-pressed="selectedModule === item.key"
              @click="handleModuleChange(item.key)"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.count }} {{ item.unit }}</strong>
            </button>
          </div>
          <span v-else class="empty-inline">暂无作答</span>

          <div class="attempt-summary">
            <strong>{{ selectedModuleLabel }}</strong>
            <span v-if="selectedModule === 'mistakeNotebook'">
              {{ detail.wrongQuestionOverview.total }} 道错题
            </span>
            <span v-else>{{ detail.pagination.total }} 条记录</span>
          </div>

          <div
            v-if="selectedModule === 'mistakeNotebook' && detail.wrongQuestionOverview.subjects.length"
            class="wrong-subject-list"
          >
            <article
              v-for="item in detail.wrongQuestionOverview.subjects"
              :key="`${item.examType}:${item.subjectCode || item.subject}`"
              class="wrong-subject-card"
            >
              <div class="wrong-subject-heading">
                <div>
                  <span>{{ item.examType }}</span>
                  <strong>{{ item.subject }}</strong>
                </div>
                <b>{{ item.count }} 道</b>
              </div>
              <div class="wrong-difficulty-list">
                <span>简单 {{ item.difficultyCounts.easy }}</span>
                <span>中等 {{ item.difficultyCounts.medium }}</span>
                <span>困难 {{ item.difficultyCounts.hard }}</span>
                <span v-if="item.difficultyCounts.unknown">
                  未标注 {{ item.difficultyCounts.unknown }}
                </span>
              </div>
            </article>
          </div>
          <el-empty
            v-else-if="selectedModule === 'mistakeNotebook'"
            description="该用户暂无错题"
            :image-size="72"
          />

          <div v-else-if="detail.attempts.length" class="attempt-list">
            <article v-for="attempt in detail.attempts" :key="attempt.id" class="attempt-card">
              <div class="attempt-header">
                <div class="attempt-title-row">
                  <p class="attempt-label">
                    {{ attempt.examType }} · {{ attemptTypeLabel(attempt) }}
                    <template v-if="attempt.paper.code && !attempt.questionBankPractice">
                      · {{ attempt.paper.code }}
                    </template>
                  </p>
                  <p v-if="selectedModule === 'questionBank'" class="attempt-subjects">
                    科目：{{ formatAttemptSubjects(attempt.subjects) }}
                  </p>
                  <el-tag
                    :type="attempt.status === 'submitted' ? 'success' : 'warning'"
                    effect="light"
                  >
                    {{ attemptStatusLabel(attempt.status) }}
                  </el-tag>
                </div>
                <div class="attempt-accuracy">
                  <span>正确率</span>
                  <strong>{{ formatAccuracy(attempt.accuracy) }}</strong>
                </div>
              </div>

              <div class="attempt-time">
                <span>开始：{{ formatDateTime(attempt.startedAt) }}</span>
                <span>提交：{{ formatOptionalDateTime(attempt.submittedAt) }}</span>
              </div>
            </article>
          </div>
          <el-empty v-else :description="`该用户暂无${selectedModuleLabel}记录`" :image-size="72" />

          <AppPagination
            v-if="selectedModule !== 'mistakeNotebook'"
            v-model:page="attemptPage"
            v-model:page-size="attemptPageSize"
            :total="detail.pagination.total"
            :page-sizes="[5, 10, 20]"
            layout="total, sizes, prev, pager, next"
            @page-change="handleAttemptPageChange"
            @page-size-change="handleAttemptPageSizeChange"
          />
        </section>
      </template>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
// 用户详情抽屉：在后台用户列表按需加载个人信息、登录位置和分页答题汇总。
import { computed, ref, watch } from 'vue'
import AppAvatar from '@/components/AppAvatar.vue'
import AppPagination from '@/components/AppPagination.vue'
import {
  getAdminUserDetailData,
  type AdminUserActivityModule,
  type AdminUserAttempt,
  type AdminUserDetail,
  type AdminUserIpLocation,
  type AdminUserRewardCardSummary,
} from '@/api/admin'

const props = defineProps<{
  modelValue: boolean
  userId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const loading = ref(false)
const detail = ref<AdminUserDetail | null>(null)
const selectedModule = ref<AdminUserActivityModule | null>(null)
const attemptPage = ref(1)
const attemptPageSize = ref(5)
let latestRequestId = 0

// 每次切换用户都回到第一页，避免沿用上一位用户的答题分页位置。
watch(
  () => [props.modelValue, props.userId] as const,
  ([visible, userId], previous) => {
    if (!visible || !userId) return
    if (!previous || previous[1] !== userId) {
      selectedModule.value = null
      attemptPage.value = 1
    }
    void loadDetail()
  },
  { immediate: true },
)

function roleLabel(role: string): string {
  return role === 'admin' ? '管理员' : '普通用户'
}

// 邀请关系区分注册时填写与注册后补填，便于管理员判断来源录入节点。
function bindingSourceLabel(source: string): string {
  return source === 'register' ? '注册时绑定' : '注册后补填'
}

// 当前权益级别只表达用户现状，不展示管理员赠卡操作历史。
function accessLevelLabel(level: 'admin' | 'member' | 'free'): string {
  if (level === 'admin') return '管理员'
  return level === 'member' ? '会员' : '免费'
}

// 会员套餐统一转成用户管理中使用的中文名称。
function membershipPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    monthly: '月卡',
    quarterly: '季卡',
    yearly: '年卡',
    weekly_reward: '7 天权益',
    daily_gift: '日卡',
  }
  return labels[plan] || plan
}

// 权益卡按当前用户持有状态汇总，不暴露发放管理员或批次信息。
function rewardCardStatusSummary(card: AdminUserRewardCardSummary): string {
  if (card.total === 0) return '暂无卡券'
  const parts = [
    card.pendingCount ? `待启用 ${card.pendingCount}` : '',
    card.activatedCount ? `已启用 ${card.activatedCount}` : '',
    card.expiredCount ? `已过期 ${card.expiredCount}` : '',
    card.revokedCount ? `已撤回 ${card.revokedCount}` : '',
  ].filter(Boolean)
  return parts.join(' · ')
}

function formatDateTime(value: string | number): string {
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatOptionalDateTime(value?: string | null): string {
  return value ? formatDateTime(value) : '暂无记录'
}

// 属地从结构化国家、地区和城市去重拼接，避免直辖市名称重复。
function formatLoginLocation(location: AdminUserIpLocation | null): string {
  if (!location) return '暂无属地'
  return [...new Set([location.country, location.region, location.city].filter(Boolean))].join(
    ' · ',
  )
}

function formatAccuracy(value: number | null): string {
  return value === null ? '-' : `${value.toFixed(1)}%`
}

// 题库答卷可能跨多个科目，按实际题目去重后的顺序完整展示。
function formatAttemptSubjects(subjects: string[]): string {
  return subjects.length > 0 ? subjects.join('、') : '未标注'
}

function attemptStatusLabel(status: string): string {
  return status === 'submitted' ? '已提交' : '进行中'
}

function paperTypeLabel(paperType: string): string {
  const labels: Record<string, string> = {
    realPaper: '历年真题',
    mockPaper: '模拟卷',
    aiPaper: '题库练习',
  }
  return labels[paperType] || paperType
}

// 试题库记录展示用户实际选择的入口，练习册仍存在时同时保留当时使用的名称。
function attemptTypeLabel(attempt: AdminUserAttempt): string {
  const practice = attempt.questionBankPractice
  if (!practice) return paperTypeLabel(attempt.paper.paperType)
  if (practice.mode === 'random') return '随机组题'
  return practice.notebookName ? `练习册做题 · ${practice.notebookName}` : '练习册做题'
}

// 当前筛选模块名称同时用于记录区标题和空状态提示。
const selectedModuleLabel = computed(
  () =>
    detail.value?.overview.moduleAttemptCounts.find(
      (item) => item.key === selectedModule.value,
    )?.label || '答题',
)

// 请求序号确保快速切换用户或分页时，较慢的旧响应不会覆盖当前详情。
async function loadDetail(): Promise<void> {
  if (!props.userId || !props.modelValue) return
  const requestId = ++latestRequestId
  loading.value = true
  try {
    const data = await getAdminUserDetailData(props.userId, {
      page: attemptPage.value,
      pageSize: attemptPageSize.value,
      ...(selectedModule.value ? { module: selectedModule.value } : {}),
    })
    if (requestId !== latestRequestId) return
    detail.value = data
    selectedModule.value = data.overview.selectedModule
    attemptPage.value = data.pagination.page
    attemptPageSize.value = data.pagination.pageSize
  } catch {
    if (requestId === latestRequestId) detail.value = null
  } finally {
    if (requestId === latestRequestId) loading.value = false
  }
}

// 切换产品模块时回到第一页，并由后端按模块重新分页查询。
async function handleModuleChange(module: AdminUserActivityModule): Promise<void> {
  if (selectedModule.value === module) return
  selectedModule.value = module
  attemptPage.value = 1
  await loadDetail()
}

// 答题记录翻页时保留用户基础信息，并以接口返回的全量总览刷新抽屉。
async function handleAttemptPageChange(page: number): Promise<void> {
  attemptPage.value = page
  await loadDetail()
}

// 调整每页数量后从第一页重新查询，防止落到超出总页数的页码。
async function handleAttemptPageSizeChange(pageSize: number): Promise<void> {
  attemptPageSize.value = pageSize
  attemptPage.value = 1
  await loadDetail()
}

// 关闭后清理敏感详情，下一次打开必须重新经过管理员接口鉴权读取。
function handleClosed(): void {
  latestRequestId += 1
  detail.value = null
  loading.value = false
  selectedModule.value = null
  attemptPage.value = 1
}
</script>

<style scoped lang="scss">
.user-detail-drawer {
  min-height: 240px;
  padding-bottom: 28px;
}

.profile-card,
.detail-section {
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.profile-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px;
}

.profile-identity,
.profile-name-row {
  display: flex;
  align-items: center;
}

.profile-identity {
  gap: 14px;
  min-width: 0;
}

.profile-avatar {
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  overflow: hidden;
  place-items: center;
  border-radius: 14px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 20px;
  font-weight: 800;
}

.profile-name-row {
  gap: 10px;
}

.profile-name-row h3,
.section-heading h3 {
  margin: 0;
  color: var(--color-ink);
}

.profile-identity p,
.section-heading p {
  margin: 5px 0 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.profile-times {
  display: grid;
  gap: 8px;
  margin: 0;
}

.profile-times div {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px;
}

.profile-times dt,
.profile-times dd {
  margin: 0;
  font-size: var(--text-sm);
}

.profile-times dt {
  color: var(--color-ink-muted);
}

.profile-times dd {
  color: var(--color-ink);
}

.detail-section {
  margin-top: 16px;
  padding: 20px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-heading > span {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.source-entitlement-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.source-entitlement-grid > article {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.info-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.registration-source-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  overflow-x: auto;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.registration-source-line strong {
  color: var(--color-ink);
  font-size: var(--text-sm);
}

.registration-source-line > * + *::before {
  margin-right: 8px;
  color: var(--color-ink-muted);
  content: '·';
}

.source-entitlement-grid p,
.source-entitlement-grid small {
  display: block;
  margin: 5px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.current-entitlement-line {
  display: grid;
  gap: 8px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.current-entitlement-line > div {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.current-entitlement-line strong {
  color: var(--color-ink);
  font-size: var(--text-sm);
}

.current-entitlement-line > div + div {
  padding-top: 8px;
  border-top: 1px solid var(--color-line-soft);
}

.module-count-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.module-count-list > button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
  cursor: pointer;
  font: inherit;
  font-size: var(--text-sm);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.module-count-list > button:hover,
.module-count-list > button.is-active {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.module-count-list > button.is-active {
  color: var(--el-color-primary);
}

.module-count-list strong {
  color: var(--color-ink);
}

.attempt-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0 10px;
  padding-top: 12px;
  border-top: 1px solid var(--color-line-soft);
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.attempt-summary strong {
  color: var(--color-ink);
}

.empty-inline {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.attempt-list {
  display: grid;
  gap: 8px;
}

.wrong-subject-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.wrong-subject-card {
  padding: 12px 14px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.wrong-subject-heading,
.wrong-subject-heading > div,
.wrong-difficulty-list {
  display: flex;
}

.wrong-subject-heading {
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.wrong-subject-heading > div {
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.wrong-subject-heading span,
.wrong-difficulty-list {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.wrong-subject-heading strong {
  color: var(--color-ink);
  font-size: var(--text-sm);
}

.wrong-subject-heading b {
  flex: 0 0 auto;
  color: var(--el-color-danger);
  font-size: 16px;
}

.wrong-difficulty-list {
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--color-line-soft);
}

.attempt-card {
  padding: 12px 14px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.attempt-header,
.attempt-title-row,
.attempt-time {
  display: flex;
}

.attempt-header {
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.attempt-title-row {
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.attempt-label {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-sm);
}

.attempt-subjects {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.attempt-accuracy {
  display: flex;
  flex: 0 0 auto;
  align-items: baseline;
  gap: 6px;
}

.attempt-accuracy strong {
  color: var(--color-ink);
  font-size: 16px;
}

.attempt-accuracy span,
.attempt-time {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.attempt-time {
  gap: 16px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-line-soft);
}

.attempt-section :deep(.app-pagination) {
  margin-top: 16px;
  background: transparent;
}

@media (max-width: 720px) {
  .profile-card,
  .attempt-header {
    align-items: stretch;
    flex-direction: column;
  }

  .wrong-subject-list {
    grid-template-columns: 1fr;
  }

  .profile-times {
    grid-template-columns: 1fr;
  }

  .module-count-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

}
</style>
