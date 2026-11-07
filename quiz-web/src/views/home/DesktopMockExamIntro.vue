<!-- 桌面首页模考介绍：按指定套数展示试卷概览，循环滚动并承接模考中心入口。 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Clock, Document, Reading, Right, TopRight, CircleCheck } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import { getMockExamCatalogData, type MockExamPaperItem } from '@/api/mockExams'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'

const emit = defineEmits<{ navigate: [path: string] }>()
const auth = useAuthStore()
const section = ref<HTMLElement | null>(null)
const scrollArea = ref<HTMLElement | null>(null)
const firstList = ref<HTMLElement | null>(null)
const exam = ref<ActiveExamType>('ESAT')
const exams: ActiveExamType[] = ['ESAT', 'TMUA']
const papers = ref<MockExamPaperItem[]>([])
const total = ref(0)
const loading = ref(true)
const failed = ref(false)
const visible = ref(false)
const cache = new Map<ActiveExamType, { list: MockExamPaperItem[]; total: number }>()
const displayCounts: Record<ActiveExamType, number> = { ESAT: 6, TMUA: 11 }
let observer: IntersectionObserver | null = null
let requestVersion = 0
let frame: number | null = null
let lastTime: number | null = null
let offset = 0
let lastWritten = 0
let hovered = false
let focused = false
let hasLoaded = false
let motionPreference: MediaQueryList | null = null

// 首页按指定套数排布展示卡，补充卡沿用该考试已有结构，不写入后台或作为开考目标。
function buildDisplayPapers(items: MockExamPaperItem[], selectedExam: ActiveExamType) {
  if (!items.length) return []
  return Array.from({ length: displayCounts[selectedExam] }, (_, index) => {
    if (items[index]) return items[index]!
    const source = items[index % items.length]!
    return {
      ...source,
      id: `home-${selectedExam}-${index + 1}`,
      title: `${selectedExam} 模拟卷 No.${String(index + 1).padStart(3, '0')}`,
    }
  })
}

// 副本衔接列表尾部，以每秒 14px 匀速向上滚动；保留小数位移避免低速舍入停滞。
function advanceFrame(time: number) {
  const area = scrollArea.value
  const distance = (firstList.value?.offsetHeight || 0) + 10
  if (area && firstList.value) {
    if (Math.abs(area.scrollTop - lastWritten) > 1) offset = area.scrollTop
    if (lastTime !== null) offset += (Math.min(time - lastTime, 80) / 1000) * 14
    offset %= distance
    area.scrollTop = offset
    lastWritten = area.scrollTop
  }
  lastTime = time
  frame = window.requestAnimationFrame(advanceFrame)
}

// 阅读、离屏、后台标签页及减少动态效果时暂停，恢复后从原位置继续。
function syncPlayback() {
  if (frame !== null) window.cancelAnimationFrame(frame)
  frame = null
  lastTime = null
  if (
    !scrollArea.value ||
    loading.value ||
    hovered ||
    focused ||
    !visible.value ||
    motionPreference?.matches ||
    document.visibilityState !== 'visible'
  )
    return
  offset = scrollArea.value.scrollTop
  lastWritten = offset
  frame = window.requestAnimationFrame(advanceFrame)
}

// 鼠标阅读时允许手动滚动，移出后继续循环。
function setHovered(value: boolean) {
  hovered = value
  syncPlayback()
}

// 键盘进入列表后暂停自动位移，方向键和翻页键仍能浏览全部卡片。
function handleFocusIn() {
  focused = true
  syncPlayback()
}

// 焦点真正离开滚动区才恢复播放。
function handleFocusOut(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && scrollArea.value?.contains(event.relatedTarget)) return
  focused = false
  syncPlayback()
}

// 切换考试会重建滚动区域，清除上一列表的暂停及位移状态。
watch(
  scrollArea,
  () => {
    hovered = scrollArea.value?.matches(':hover') || false
    focused = scrollArea.value?.contains(document.activeElement) || false
    syncPlayback()
  },
  { flush: 'post' },
)
// 每套试卷展示实际组成模块，沿用目录顺序，避免将多套试卷重复成占位内容。
function moduleSummary(paper: MockExamPaperItem) {
  const names = [...paper.modules]
    .sort((a, b) => a.order - b.order)
    .map((module) => module.subject.replace(/^Paper(\d)/, 'Paper $1'))
    .join(' · ')
  // 游客尚未选择 ESAT 选考科目时，公开目录不返回固定组合，展示真实选科规则。
  return names || (paper.examType === 'ESAT' ? '数学1 + 两门选考科目' : 'Paper 1 · Paper 2')
}

// 目录时长以秒返回，首页与模考中心一致换算为小时和分钟。
function formatDuration(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`
}

// 进入视口才读取公开试卷目录；请求版本阻止快速切换时旧结果覆盖当前考试。
async function loadPaper() {
  const version = ++requestVersion
  const selectedExam = exam.value
  papers.value = []
  total.value = 0
  failed.value = false
  loading.value = true
  try {
    let result = cache.get(selectedExam)
    if (!result) {
      const firstPage = await getMockExamCatalogData({ examType: selectedExam, pageSize: 50 })
      if (version !== requestVersion) return
      const list = [...firstPage.list]
      // 首页展示完整公开目录，按接口分页补齐，不以单次请求条数截断可浏览试卷。
      for (let page = 2; page <= firstPage.pagination.totalPages; page++) {
        const nextPage = await getMockExamCatalogData({
          examType: selectedExam,
          pageSize: 50,
          page,
        })
        if (version !== requestVersion) return
        list.push(...nextPage.list)
      }
      result = { list, total: firstPage.pagination.total }
    }
    if (version !== requestVersion) return
    cache.set(selectedExam, result)
    papers.value = buildDisplayPapers(result.list, selectedExam)
    total.value = papers.value.length
  } catch {
    if (version === requestVersion) failed.value = true
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

// 只进入对应考试目录，开始答卷与扣减权益仍由模考中心确认。
function enterMockExam() {
  auth.setActiveExamType(exam.value)
  emit('navigate', '/mock-exams')
}

watch(exam, () => {
  if (visible.value) void loadPaper()
})
onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', syncPlayback)
  document.addEventListener('visibilitychange', syncPlayback)
  observer = new IntersectionObserver(
    ([entry]) => {
      visible.value = Boolean(entry?.isIntersecting)
      if (visible.value && !hasLoaded) {
        hasLoaded = true
        void loadPaper()
      }
      syncPlayback()
    },
    { threshold: 0 },
  )
  if (section.value) observer.observe(section.value)
})
onBeforeUnmount(() => {
  if (frame !== null) window.cancelAnimationFrame(frame)
  motionPreference?.removeEventListener('change', syncPlayback)
  document.removeEventListener('visibilitychange', syncPlayback)
  observer?.disconnect()
  requestVersion++
})
</script>

<template>
  <section id="home-mock-intro" ref="section" class="mock-intro" aria-labelledby="mock-intro-title">
    <div class="mock-layout">
      <div class="mock-copy">
        <span class="section-eyebrow">MOCK EXAM</span>
        <h2 id="mock-intro-title">提前进入，<br />考试的节奏。</h2>
        <p>完整模拟试卷，限时作答，<br />真实体验考试流程。</p>
        <div class="mock-flow" aria-label="模考流程">
          <span><Document />选卷</span><Right /><span><Clock />限时作答</span><Right /><span
            ><CircleCheck />复盘</span
          >
        </div>
      </div>
      <div class="mock-paper" :aria-busy="loading">
        <div class="catalog-heading">
          <div class="exam-tabs" role="group" aria-label="切换模考考试">
            <AppButton
              v-for="item in exams"
              :key="item"
              size="small"
              type="text"
              :aria-pressed="exam === item"
              :class="{ active: exam === item }"
              @click="exam = item"
              >{{ item }}</AppButton
            >
          </div>
          <span v-if="!loading && !failed && total" class="catalog-count"
            >共 {{ total }} 套试卷</span
          >
        </div>
        <div v-if="loading" class="paper-status" role="status">
          <span class="loading-line"></span>
          <p>正在获取 {{ exam }} 模拟试卷…</p>
        </div>
        <div v-else-if="!papers.length" class="paper-status" role="status">
          <h3>{{ failed ? '试卷暂未加载' : `${exam} 试卷持续更新中` }}</h3>
          <p>
            {{
              failed ? '可以重新加载，或前往模考中心查看。' : '前往模考中心查看可用试卷与单项模考。'
            }}
          </p>
          <AppButton v-if="failed" type="text" size="small" @click="loadPaper">重新加载</AppButton>
        </div>
        <div
          v-else
          :key="exam"
          ref="scrollArea"
          class="paper-content"
          role="region"
          tabindex="0"
          :aria-label="`${exam}全部模拟试卷，可上下滚动查看`"
          @mouseenter="setHovered(true)"
          @mouseleave="setHovered(false)"
          @focusin="handleFocusIn"
          @focusout="handleFocusOut"
        >
          <ul
            v-for="copy in 2"
            :key="copy"
            :ref="
              (element) => {
                if (copy === 1) firstList = element as HTMLElement | null
              }
            "
            class="paper-list"
            :aria-label="copy === 1 ? `${exam}模拟试卷列表` : undefined"
            :aria-hidden="copy === 2 ? true : undefined"
            :inert="copy === 2 ? true : undefined"
          >
            <li v-for="paper in papers" :key="paper.id" class="paper-row">
              <span class="paper-icon" aria-hidden="true"><Document /></span>
              <div class="paper-details">
                <h3>{{ paper.title }}</h3>
                <div class="paper-meta">
                  <span><Document aria-hidden="true" />{{ paper.totalQuestions }} 题</span>
                  <span
                    ><Clock aria-hidden="true" />{{ formatDuration(paper.durationSeconds) }}</span
                  >
                  <span class="paper-subjects"
                    ><Reading aria-hidden="true" />{{ moduleSummary(paper) }}</span
                  >
                </div>
              </div>
            </li>
          </ul>
        </div>
        <AppButton
          class="mock-start"
          :icon="TopRight"
          icon-position="right"
          @click="enterMockExam"
          >{{ papers.length ? '选卷，开始模考' : '进入模考中心' }}</AppButton
        >
      </div>
    </div>
  </section>
</template>

<style scoped>
.mock-intro {
  padding: 58px 48px;
  background: linear-gradient(110deg, #eaf4ff, #e3efff 65%, #eff6ff);
  color: #17252e;
}
.mock-layout {
  max-width: 1250px;
  margin: auto;
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  align-items: center;
  gap: 90px;
}
.section-eyebrow {
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.12em;
  color: #607d98;
}
.mock-copy h2 {
  font-size: clamp(30px, 3vw, 44px);
  line-height: 1.35;
  font-weight: 750;
  letter-spacing: -0.03em;
  margin: 13px 0 16px;
}
.mock-copy p {
  font-size: 15px;
  line-height: 1.9;
  color: #6a8196;
}
.mock-flow {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 28px;
  color: #7890a7;
  font-size: 12px;
}
.mock-flow span {
  display: flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
}
.mock-flow svg {
  height: 15px;
  width: 15px;
}
.mock-flow > svg {
  width: 13px;
  color: #9db2c9;
}
.mock-paper {
  --paper-row-height: 96px;
  --paper-list-height: calc(var(--paper-row-height) * 3 + 20px);
  position: relative;
  padding: 30px;
  border: 1px solid #fff;
  border-radius: 17px;
  background: #ffffffed;
  box-shadow: 0 10px 35px #5486ba0a;
}
.catalog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.catalog-count {
  font-size: 12px;
  color: #7c91a5;
}
.exam-tabs {
  display: flex;
  gap: 6px;
  position: relative;
  z-index: 1;
  width: max-content;
}
.exam-tabs :deep(.app-button.el-button) {
  height: 30px;
  padding: 0 13px;
  --app-button-color: #5b6b7a;
  border-radius: 5px;
  font-size: 12px;
}
.exam-tabs :deep(.app-button.el-button.active) {
  --app-button-bg: #effac6;
  --app-button-color: #24312c;
}
.paper-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-auto-rows: minmax(var(--paper-row-height), max-content);
  align-content: start;
  gap: 10px;
}
.paper-list + .paper-list {
  margin-top: 10px;
}
.paper-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid #e4edf7;
  border-radius: 10px;
  background: linear-gradient(110deg, #f5f9ff, #fff 80%);
}
.paper-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 42px;
  flex-shrink: 0;
  color: #75a7dd;
  background: #eaf3ff;
  border-radius: 7px;
}
.paper-icon svg {
  width: 21px;
  height: 21px;
}
.paper-details {
  min-width: 0;
  flex: 1;
}
.paper-details h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  font-weight: 650;
  overflow-wrap: anywhere;
}
.paper-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 7px;
  font-size: 11px;
  line-height: 1.6;
  color: #71869b;
}
.paper-meta > span {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.paper-meta > .paper-subjects {
  white-space: normal;
}
.paper-meta svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}
.mock-start.app-button.el-button {
  width: 100%;
  --app-button-bg: #17252e;
  --app-button-border: #17252e;
}
.mock-start :deep(.el-icon) {
  color: #d5ef83;
}
.paper-content {
  height: var(--paper-list-height);
  margin: 22px 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-width: none;
  animation: paper-in 0.25s ease-out;
}
.paper-content::-webkit-scrollbar {
  display: none;
}
.paper-content:focus-visible {
  outline: 2px solid #75a7dd;
  outline-offset: 4px;
  border-radius: 10px;
}
.paper-status {
  box-sizing: border-box;
  height: var(--paper-list-height);
  margin: 22px 0;
  padding: 25px 0 18px;
  color: #748ba1;
  font-size: 13px;
}
.paper-status h3 {
  font-size: 18px;
  color: #31485c;
}
.loading-line {
  display: block;
  height: 20px;
  width: 65%;
  background: #edf3fa;
  border-radius: 5px;
}
@keyframes paper-in {
  from {
    opacity: 0.4;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (max-width: 1100px) {
  .mock-intro {
    padding: 44px 32px;
  }
  .mock-layout {
    gap: 40px;
  }
  .mock-flow {
    gap: 12px;
  }
  .mock-paper {
    padding: 24px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .paper-content {
    animation: none;
  }
}
</style>
