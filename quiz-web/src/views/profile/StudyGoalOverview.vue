<!-- 个人中心备考目标概览：汇总院校、专业、考试、备考科目、目标分数与学习计划。 -->
<template>
  <div class="study-goal-overview">
    <div class="study-goal-summary-grid">
      <article class="study-goal-summary-card">
        <div class="study-goal-card-label">
          <span class="study-goal-icon study-goal-icon--lilac">
            <el-icon aria-hidden="true"><OfficeBuilding /></el-icon>
          </span>
          <span>目标院校</span>
        </div>
        <div class="study-goal-value">{{ normalizedSchools.join('、') }}</div>
      </article>

      <article class="study-goal-summary-card">
        <div class="study-goal-card-label">
          <span class="study-goal-icon study-goal-icon--lilac">
            <el-icon aria-hidden="true"><CollectionTag /></el-icon>
          </span>
          <span>目标专业方向</span>
        </div>
        <div class="study-goal-value">{{ normalizedMajors.join('、') }}</div>
      </article>

      <article class="study-goal-summary-card study-goal-summary-card--exam">
        <div class="study-goal-card-label">
          <span class="study-goal-icon study-goal-icon--mint">
            <el-icon aria-hidden="true"><Aim /></el-icon>
          </span>
          <span>目标考试</span>
        </div>
        <div class="study-goal-value">{{ normalizedExamTypes.join('、') }}</div>
      </article>

      <article class="study-goal-summary-card">
        <div class="study-goal-card-label">
          <span class="study-goal-icon study-goal-icon--mint">
            <el-icon aria-hidden="true"><Reading /></el-icon>
          </span>
          <span>备考科目</span>
        </div>
        <div class="study-goal-value" :title="targetSubjectsText">{{ targetSubjectsText }}</div>
      </article>
    </div>

    <div class="study-goal-detail-grid">
      <article class="study-goal-summary-card">
        <div class="study-goal-card-label">
          <span class="study-goal-icon study-goal-icon--lilac">
            <el-icon aria-hidden="true"><Trophy /></el-icon>
          </span>
          <span>目标分数</span>
        </div>
        <div class="study-goal-value">{{ targetScoresText }}</div>
      </article>

      <article class="study-goal-summary-card">
        <div class="study-goal-card-label">
          <span class="study-goal-icon study-goal-icon--lilac">
            <el-icon aria-hidden="true"><Clock /></el-icon>
          </span>
          <span>每周可投入时长</span>
        </div>
        <div class="study-goal-value">{{ weeklyHours }}</div>
      </article>
      <article class="study-goal-summary-card">
        <div class="study-goal-card-label">
          <span class="study-goal-icon study-goal-icon--lilac">
            <el-icon aria-hidden="true"><Calendar /></el-icon>
          </span>
          <span>考试日期</span>
        </div>
        <div class="study-goal-value">{{ examDate }}</div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Aim,
  Calendar,
  Clock,
  CollectionTag,
  OfficeBuilding,
  Reading,
  Trophy,
} from '@element-plus/icons-vue'

interface StudyGoalOverviewProps {
  schools: string[]
  majors: string[]
  examTypes: string[]
  esatSubjects: string[]
  targetScores: Record<'ESAT' | 'TMUA', number | null>
  weeklyHours: string
  examDate: string
}

const props = defineProps<StudyGoalOverviewProps>()

// 空值使用稳定占位，避免未完成偏好设置时卡片结构塌陷。
const normalizedSchools = computed(() => (props.schools.length ? props.schools : ['尚未设置']))
const normalizedMajors = computed(() => (props.majors.length ? props.majors : ['尚未设置']))
const normalizedExamTypes = computed(() =>
  props.examTypes.length ? props.examTypes : ['尚未设置'],
)

// 科目跟随已选择的目标考试展示，TMUA 使用固定的两卷考试结构。
const targetSubjectsText = computed(() => {
  const sections: string[] = []
  if (props.examTypes.includes('ESAT')) {
    sections.push(`ESAT ${props.esatSubjects.length ? props.esatSubjects.join('、') : '未设置'}`)
  }
  if (props.examTypes.includes('TMUA')) sections.push('TMUA Paper 1、Paper 2')
  return sections.length ? sections.join('；') : '尚未设置'
})

// 第二行按考试分别概览目标分数，避免不同考试的目标值混淆。
const targetScoresText = computed(() => {
  const examTypes = props.examTypes.filter(
    (examType): examType is 'ESAT' | 'TMUA' => examType === 'ESAT' || examType === 'TMUA',
  )
  if (!examTypes.length) return '尚未设置'
  return examTypes
    .map((examType) => {
      const score = props.targetScores[examType]
      return `${examType} ${score === null ? '未设置' : score.toFixed(1)}`
    })
    .join('、')
})
</script>

<style scoped lang="scss">
.study-goal-overview {
  display: grid;
  gap: 6px;
}

.study-goal-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.study-goal-summary-card {
  box-sizing: border-box;
  border: 1px solid #d8ebe6;
  border-radius: 5px;
  background: #f7fcfa;
}

.study-goal-summary-card {
  min-width: 0;
  min-height: 56px;
  padding: 7px 10px;
}

.study-goal-summary-card--exam {
  border-color: #d8ebe6;
  background: #f7fcfa;
}

.study-goal-card-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #74798d;
  font-size: 11px;
}

.study-goal-icon {
  display: inline-flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 5px;
  font-size: 14px;
}

.study-goal-icon--lilac {
  color: #26a987;
  background: #e7f8f3;
}

.study-goal-icon--mint {
  color: #26a987;
  background: #e7f8f3;
}

.study-goal-value {
  overflow: hidden;
  color: #343a49;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.study-goal-summary-card > .study-goal-value {
  margin-top: 4px;
}

.study-goal-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

@media (max-width: 1200px) {
  .study-goal-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .study-goal-detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .study-goal-summary-grid {
    grid-template-columns: 1fr;
  }
}

</style>
