<!-- 个人中心学习足迹：用自适应时间范围与正方形日历格展示每日学习强度。 -->
<template>
  <section class="learning-panel" aria-labelledby="learning-footprint-title">
    <ProfileModuleHeading
      kicker="LEARNING JOURNEY"
      title="学习足迹"
      description="每一个格子，记录一天的学习积累"
      title-id="learning-footprint-title"
    />

    <div v-if="loading && !footprint" class="learning-state" aria-live="polite">
      正在整理学习足迹…
    </div>
    <div v-else-if="loadError" class="learning-state" role="status">
      <span>学习足迹暂时加载失败</span>
      <el-button link type="primary" @click="loadFootprint">重新加载</el-button>
    </div>
    <template v-else-if="footprint">
      <div class="learning-summary">
        <div>
          <strong>{{ footprint.summary.activeDays }}<small>天</small></strong
          ><span>累计学习</span>
        </div>
        <div>
          <strong>{{ footprint.summary.answers }}<small>次</small></strong
          ><span>作答练习</span>
        </div>
        <div>
          <strong
            >{{ footprint.summary.reviews + footprint.summary.reports }}<small>次</small></strong
          ><span>复习与报告</span>
        </div>
      </div>

      <div class="learning-toolbar">
        <span
          >{{ calendarStartDate.replaceAll('-', '.') }} —
          {{ footprint.endDate.replaceAll('-', '.') }}</span
        >
      </div>

      <div class="learning-calendar">
        <div class="weekday-labels" aria-hidden="true">
          <span v-for="day in weekdays" :key="day">{{ day }}</span>
        </div>
        <div
          ref="calendar"
          class="calendar-scroll"
          aria-label="每日学习日历，可左右滚动查看更早记录"
          @scroll="popoverVisible = false"
        >
          <div class="calendar-weeks" :style="{ '--week-count': weeks.length }">
            <div v-for="(week, index) in weeks" :key="index" class="calendar-week">
              <span v-if="week.label" class="month-label">{{ week.label }}</span>
              <template v-for="(day, row) in week.days" :key="row">
                <button
                  v-if="day?.activity"
                  type="button"
                  class="learning-day"
                  :class="[
                    `level-${day.activity.level}`,
                    { today: day.date === footprint.endDate },
                  ]"
                  :data-date="day.date"
                  :tabindex="day.date === focusDate ? 0 : -1"
                  :aria-label="dayLabel(day.activity)"
                  @mouseenter="showDay(day.activity, $event)"
                  @mouseleave="popoverVisible = false"
                  @focus="showDay(day.activity, $event)"
                  @blur="popoverVisible = false"
                  @click="showDay(day.activity, $event)"
                  @keydown="moveFocus(day.activity, $event)"
                />
                <span
                  v-else-if="day"
                  class="learning-day level-0 before-registration"
                  role="img"
                  :aria-label="`${day.date}，注册前`"
                />
                <span v-else class="learning-day outside" aria-hidden="true" />
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="learning-footer">
        <span>{{
          footprint.summary.total ? '所有考试 · 北京时间' : '从今天开始，点亮你的学习足迹'
        }}</span>
        <div
          class="learning-legend"
          aria-label="每日学习活动：0 次、1 到 5 次、6 到 15 次、16 到 30 次、31 次及以上"
        >
          <span>少</span><i v-for="level in 5" :key="level" :class="`level-${level - 1}`" /><span
            >多</span
          >
        </div>
      </div>
      <div class="learning-notes">
        <span>记录作答、错题与收藏复习、报告查看</span>
        <el-popover placement="top" :width="280" trigger="click" :show-arrow="false">
          <template #reference
            ><button type="button" class="learning-rule-button" aria-label="查看学习足迹统计说明">
              统计说明
            </button></template
          >
          <div class="learning-rules">
            <p>保存答案即可计入，无需交卷。同一答卷的题目、复习题目或报告，每天最多计一次。</p>
            <p>每天按 0、1–5、6–15、16–30、31 次及以上分为五档；登录、浏览列表及支付不计入。</p>
          </div>
        </el-popover>
      </div>
    </template>

    <el-popover
      :visible="popoverVisible"
      :virtual-ref="dayAnchor"
      virtual-triggering
      placement="top"
      :width="252"
      :show-arrow="false"
    >
      <div v-if="activeDay" class="learning-day-detail" aria-live="polite">
        <strong>{{ activeDay.date }} · {{ dayWeekday(activeDay.date) }}</strong>
        <p>
          {{ activeDay.total ? `共 ${activeDay.total} 次学习活动` : '暂无学习记录' }}
        </p>
        <div class="day-counts">
          <span
            >作答 <b>{{ activeDay.answers }}</b></span
          ><span
            >复习 <b>{{ activeDay.reviews }}</b></span
          ><span
            >报告 <b>{{ activeDay.reports }}</b></span
          >
        </div>
      </div>
    </el-popover>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ProfileModuleHeading from '@/components/ProfileModuleHeading.vue'
import {
  getLearningFootprint,
  type LearningDay,
  type LearningFootprint,
} from '@/api/learningFootprint'

const footprint = ref<LearningFootprint | null>(null)
const loading = ref(false)
const loadError = ref(false)
const calendar = ref<HTMLElement>()
const calendarWidth = ref(0)
const focusDate = ref('')
const activeDay = ref<LearningDay>()
const dayAnchor = ref<HTMLElement>()
const popoverVisible = ref(false)
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
let lastLoaded = 0
let disposed = false

// 格子保持 14px 正方形；日期不足一屏时向前补齐完整周，不拉宽格子。
const calendarStartDate = computed(() => {
  if (!footprint.value) return ''
  const end = Date.parse(footprint.value.endDate)
  const mondayOffset = (new Date(end).getUTCDay() + 6) % 7
  const visibleWeeks = Math.max(1, Math.floor((calendarWidth.value + 4) / 18))
  const firstVisibleDay = end - (mondayOffset + (visibleWeeks - 1) * 7) * 86_400_000
  const firstRecordedDay = Date.parse(footprint.value.startDate)
  const firstDay = Math.min(firstVisibleDay, firstRecordedDay)
  const offset = (new Date(firstDay).getUTCDay() + 6) % 7
  return new Date(firstDay - offset * 86_400_000).toISOString().slice(0, 10)
})

// 以周一为首行，注册前仅显示浅色占位，真实学习记录仍来自接口。
const weeks = computed(() => {
  if (!footprint.value) return []
  const activities = new Map(footprint.value.days.map((day) => [day.date, day]))
  type CalendarDay = { date: string; activity?: LearningDay }
  const cells: Array<CalendarDay | null> = []
  const end = Date.parse(footprint.value.endDate)
  for (let time = Date.parse(calendarStartDate.value); time <= end; time += 86_400_000) {
    const date = new Date(time).toISOString().slice(0, 10)
    cells.push({ date, activity: activities.get(date) })
  }
  const result: Array<{ label: string; days: Array<CalendarDay | null> }> = []
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7)
    while (week.length < 7) week.push(null)
    const monthStart = week.find((day) => day?.date.endsWith('-01'))
    const labelDay = monthStart || (i === 0 ? cells[0] : null)
    const label = labelDay
      ? `${monthStart?.date.slice(5, 7) === '01' ? `${labelDay.date.slice(0, 4)}年 ` : ''}${Number(labelDay.date.slice(5, 7))}月`
      : ''
    result.push({ label, days: week })
  }
  return result
})

// 卡片尺寸变化时调整显示周数；加载或重试后重新观察当前日历节点。
watch(calendar, (element, _, onCleanup) => {
  if (!element) return
  const observer = new ResizeObserver(([entry]) => {
    if (!entry || entry.contentRect.width === calendarWidth.value) return
    const atEnd =
      !calendarWidth.value ||
      element.scrollLeft + calendarWidth.value + 6 >= element.scrollWidth - 1
    calendarWidth.value = entry.contentRect.width
    popoverVisible.value = false
    if (atEnd)
      void nextTick(() => {
        element.scrollLeft = element.scrollWidth
      })
  })
  observer.observe(element)
  onCleanup(() => observer.disconnect())
})

// 日期字符串按 UTC 读取星期，避免浏览器时区使日期偏移。
function dayWeekday(date: string): string {
  return `周${weekdays[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7]}`
}

// 每个日期具有可由键盘与读屏获取的完整活动摘要。
function dayLabel(day: LearningDay): string {
  return `${day.date} ${dayWeekday(day.date)}，${day.total} 次学习活动：作答 ${day.answers}，复习 ${day.reviews}，报告 ${day.reports}`
}

// 所有格子共享一个浮层，长时间范围也不创建数千个独立弹层。
function showDay(day: LearningDay, event: Event): void {
  activeDay.value = day
  focusDate.value = day.date
  dayAnchor.value = event.currentTarget as HTMLElement
  popoverVisible.value = true
}

// 上下按日期移动，左右按周移动；仅真实日期可以取得焦点。
function moveFocus(day: LearningDay, event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    popoverVisible.value = false
    return
  }
  const offset = (
    { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 } as Record<string, number>
  )[event.key]
  if (offset === undefined) return
  event.preventDefault()
  const date = new Date(Date.parse(day.date) + offset * 86_400_000).toISOString().slice(0, 10)
  calendar.value
    ?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)
    ?.focus({ preventScroll: true })
  const button = calendar.value?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)
  if (button && calendar.value) {
    const cellBounds = button.getBoundingClientRect()
    const viewportBounds = calendar.value.getBoundingClientRect()
    if (cellBounds.left < viewportBounds.left || cellBounds.right > viewportBounds.right)
      calendar.value.scrollLeft +=
        cellBounds.left - viewportBounds.left - calendar.value.clientWidth / 2
  }
}

// 初次加载定位今天，返回页面更新数据时保留用户已经查看的时间位置。
async function loadFootprint(): Promise<void> {
  if (loading.value) return
  loading.value = true
  loadError.value = false
  const firstLoad = !footprint.value
  try {
    const data = await getLearningFootprint()
    if (disposed) return
    footprint.value = data
    lastLoaded = Date.now()
    await nextTick()
    if (firstLoad && calendar.value) {
      focusDate.value = data.endDate
      calendar.value.scrollLeft = calendar.value.scrollWidth
    }
  } catch {
    if (!disposed) loadError.value = true
  } finally {
    loading.value = false
  }
}

// 在其他标签页完成练习后回到个人中心即可更新足迹，短时间焦点切换不重复请求。
function refreshOnFocus(): void {
  if (Date.now() - lastLoaded > 15_000) void loadFootprint()
}

// 窗口或触点变化后收起日期浮层，避免旧位置越出窄屏边界。
function dismissDay(event: Event): void {
  if (
    event.type === 'resize' ||
    !(event.target instanceof Element) ||
    !event.target.closest('.learning-day')
  ) {
    popoverVisible.value = false
  }
}

onMounted(() => {
  void loadFootprint()
  window.addEventListener('focus', refreshOnFocus)
  window.addEventListener('resize', dismissDay)
  document.addEventListener('pointerdown', dismissDay)
})
onBeforeUnmount(() => {
  disposed = true
  window.removeEventListener('focus', refreshOnFocus)
  window.removeEventListener('resize', dismissDay)
  document.removeEventListener('pointerdown', dismissDay)
})
</script>

<style scoped lang="scss">
.learning-panel {
  min-width: 0;
  padding: 18px 20px 16px;
  border: 1px solid #e3e7f1;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(44, 49, 86, 0.07);
  color: #211f35;
}
.learning-state {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: #777187;
  font-size: 13px;
}
.learning-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 20px 0;
}
.learning-summary > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.learning-summary strong {
  font-size: 26px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.learning-summary small {
  margin-left: 5px;
  font-size: 11px;
  font-weight: 400;
  color: #888299;
}
.learning-summary span {
  font-size: 12px;
  color: #777187;
}
.learning-toolbar,
.learning-footer,
.learning-notes {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #777187;
}
.learning-rule-button {
  padding: 2px 0;
  border: 0;
  background: none;
  font: inherit;
  color: #6453d9;
  cursor: pointer;
}
.learning-rule-button:hover {
  text-decoration: underline;
}
.learning-calendar {
  display: flex;
  gap: 9px;
  margin: 12px 40px 0;
}
.weekday-labels {
  display: grid;
  flex-shrink: 0;
  grid-template-rows: repeat(7, 14px);
  gap: 4px;
  padding-top: 25px;
  font-size: 10px;
  line-height: 14px;
  color: #888299;
}
.calendar-scroll {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  padding: 25px 3px 10px;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: #d8d3ef transparent;
}
.calendar-weeks {
  display: grid;
  grid-template-columns: repeat(var(--week-count), 14px);
  justify-content: space-between;
  gap: 4px;
  width: 100%;
  min-width: calc(var(--week-count) * 18px - 4px);
}
.calendar-week {
  position: relative;
  display: grid;
  min-width: 0;
  grid-template-rows: repeat(7, 14px);
  gap: 4px;
}
.month-label {
  position: absolute;
  top: -23px;
  left: 0;
  white-space: nowrap;
  font-size: 10px;
  color: #777187;
}
.calendar-week:nth-last-child(-n + 3) .month-label {
  right: 0;
  left: auto;
}
.learning-day,
.learning-legend i {
  display: block;
  width: 14px;
  height: 14px;
  padding: 0;
  border: 1px solid rgba(80, 65, 130, 0.03);
  border-radius: 3px;
}
.learning-day {
  cursor: pointer;
  transition: outline-color 0.12s;
}
button.learning-day:hover,
.learning-day:focus-visible {
  outline: 2px solid #7461df;
  outline-offset: 1px;
}
.learning-day.today {
  box-shadow: inset 0 0 0 1px #8e80cc;
}
.learning-day.outside {
  visibility: hidden;
}
.learning-day.before-registration {
  cursor: default;
}
.level-0 {
  background: #f0eff5;
}
.level-1 {
  background: #ddd7ff;
}
.level-2 {
  background: #b1a3fb;
}
.level-3 {
  background: #8671f0;
}
.level-4 {
  background: #5e43d8;
}
.learning-footer {
  margin-top: 8px;
}
.learning-legend {
  display: flex;
  align-items: center;
  gap: 4px;
}
.learning-legend i {
  width: 11px;
  height: 11px;
}
.learning-legend span:first-child {
  margin-right: 2px;
}
.learning-legend span:last-child {
  margin-left: 2px;
}
.learning-notes {
  margin-top: 13px;
  padding-top: 10px;
  border-top: 1px solid #f0eef6;
  font-size: 10px;
}
.learning-rules {
  font-size: 12px;
  line-height: 1.7;
}
.learning-rules p {
  margin: 0 0 8px;
}
.learning-rules p:last-child {
  margin: 0;
}
.learning-day-detail {
  color: #575067;
  font-size: 12px;
}
.learning-day-detail strong {
  color: #292336;
}
.learning-day-detail p {
  margin: 7px 0;
}
.day-counts {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.day-counts b {
  color: #6453d9;
}
@media (max-width: 560px) {
  .learning-panel {
    padding: 16px;
  }
  .learning-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .learning-summary {
    margin: 16px 0;
  }
  .learning-calendar {
    margin-inline: 0;
  }
}
</style>
