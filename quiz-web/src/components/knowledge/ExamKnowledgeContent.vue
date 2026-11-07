<!-- 学科备考讲义：图文结合梳理知识，复用真题与题库题讲清推理及易错原因。 -->
<template>
  <div class="exam-knowledge" :class="{ 'exam-knowledge--compact': usesCompactLayout }">
    <el-tabs v-model="activeTab" class="exam-tabs" aria-label="备考讲解内容">
      <el-tab-pane label="概念与方法" name="summary">
        <PythagorasMethods v-if="section.code === '110507'" />
        <CircleTheoremMethods v-else-if="section.code === '110509'" />
        <UnitsMethods
          v-else-if="section.code === '110101' || section.code === '110102'"
          :code="section.code"
        />
        <ProbabilityFoundationsMethods
          v-else-if="section.code === '110701' || section.code === '110702' || section.code === '110703'"
          :code="section.code"
        />
        <ProbabilityReasoningMethods
          v-else-if="section.code === '110704' || section.code === '110705' || section.code === '110706' || section.code === '110707'"
          :code="section.code"
        />
        <AlgebraFoundationsMethods
          v-else-if="section.code === '110401' || section.code === '110402' || section.code === '110403' || section.code === '110404'"
          :code="section.code"
        />
        <AlgebraManipulationMethods
          v-else-if="section.code === '110405' || section.code === '110406' || section.code === '110407' || section.code === '110408'"
          :code="section.code"
        />
        <AlgebraGraphMethods
          v-else-if="section.code === '110409' || section.code === '110410' || section.code === '110411' || section.code === '110412'"
          :code="section.code"
        />
        <AlgebraApplicationsMethods
          v-else-if="section.code === '110413' || section.code === '110414' || section.code === '110415' || section.code === '110416'"
          :code="section.code"
        />
        <AlgebraFinalMethods
          v-else-if="section.code === '110417' || section.code === '110418' || section.code === '110419'"
          :code="section.code"
        />
        <StatisticsMethods
          v-else-if="section.code === '110601' || section.code === '110602' || section.code === '110603' || section.code === '110604'"
          :code="section.code"
        />
        <EukaryoticCellMethods v-else-if="section.code === '150101'" />
        <ProkaryoticCellMethods v-else-if="section.code === '150102'" />
        <OrganisationMethods v-else-if="section.code === '150103'" />
        <MembraneTransportMethods v-else-if="section.code === '150201'" />
        <CellDivisionMethods
          v-else-if="section.code === '150301' || section.code === '150302' || section.code === '150303' || section.code === '150304'"
          :code="section.code"
        />
        <InheritanceMethods
          v-else-if="section.code === '150401' || section.code === '150402' || section.code === '150403'"
          :code="section.code"
        />
        <GeometryMethodsReview
          v-else-if="section.code === '110501' || section.code === '110502' || section.code === '110503' || section.code === '110504' || section.code === '110505' || section.code === '110506' || section.code === '110508' || section.code === '110510' || section.code === '110511' || section.code === '110512' || section.code === '110513' || section.code === '110514' || section.code === '110515' || section.code === '110516' || section.code === '110517' || section.code === '110518' || section.code === '110519'"
          :key="section.code"
          :code="section.code"
        />
        <KnowledgeConceptFlow
          v-else-if="section.conceptFlow && section.visual"
          :flow="section.conceptFlow"
          :visual="section.visual"
          :topic="section.code"
        />
        <div
          v-else
          class="exam-story"
          :class="{
            'exam-story--illustrated': section.visual,
            'exam-story--division': section.visual === 'cell-division',
            'exam-story--atlas':
              section.visual === 'eukaryotic-cell' ||
              section.visual === 'prokaryotic-cell' ||
              usesCompactLayout,
          }"
        >
          <div class="exam-story__narrative">
            <div class="exam-overview">
              <div class="exam-section-label">
                <Reading aria-hidden="true" />
                <h5>先把知识串起来</h5>
              </div>
              <p><KnowledgeText :text="focus.goal" /></p>
            </div>
            <div class="exam-summary-copy">
              <p v-for="(paragraph, index) in section.paragraphs" :key="index">
                <KnowledgeText :text="paragraph" />
              </p>
            </div>
          </div>
          <div v-if="section.visual" class="exam-story__visual">
            <KnowledgeVisual :kind="section.visual" :topic="section.code" />
          </div>
        <section class="exam-concepts" aria-label="核心知识要点">
          <div class="exam-section-label">
            <CollectionTag aria-hidden="true" />
            <h5>核心知识</h5>
            <span class="exam-concept-count">{{ section.rules.length }} 个要点</span>
          </div>
          <div class="exam-concept-grid">
            <section v-for="(rule, index) in section.rules" :key="index" class="exam-concept-card">
              <header>
                <span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
                <h6>{{ rule.title }}</h6>
              </header>
              <p><KnowledgeText :text="rule.text" /></p>
            </section>
          </div>
        </section>
        </div>

        <div v-if="focus.comparison && !['110401', '110402', '110403', '110404', '110405', '110406', '110407', '110408', '110409', '110410', '110411', '110412', '110413', '110414', '110415', '110416', '110417', '110418', '110419', '110701', '110702', '110703', '110704', '110705', '110706', '110707', '110601', '110602', '110603', '110604', '110101', '110102', '150101', '150102', '150103', '150201', '150301', '150302', '150303', '150304', '150401', '150402', '150403'].includes(section.code)" class="exam-comparison">
          <div class="exam-section-label">
            <List aria-hidden="true" />
            <h5>{{ focus.comparison.title }}</h5>
          </div>
          <div
            class="exam-table-scroll"
            role="region"
            :aria-label="focus.comparison.title"
            tabindex="0"
          >
            <table>
              <thead>
                <tr>
                  <th v-for="column in focus.comparison.columns" :key="column" scope="col">
                    {{ column }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in focus.comparison.rows" :key="rowIndex">
                  <template v-for="(cell, cellIndex) in row" :key="cellIndex">
                    <th v-if="cellIndex === 0" scope="row"><KnowledgeText :text="cell" /></th>
                    <td v-else><KnowledgeText :text="cell" /></td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <slot name="memory" />
        <div class="exam-next-step">
          <p>知识理清楚后，跟着例题学习怎样判断条件、排除选项。</p>
          <AppButton
            class="exam-button"
            type="secondary"
            size="small"
            :icon="Right"
            icon-position="right"
            @click="goToTab('examples')"
            >{{ usesCompactLayout ? '进入例题拆解' : '进入例题与变式' }}</AppButton
          >
        </div>
      </el-tab-pane>

      <el-tab-pane label="例题拆解" name="examples" lazy>
        <div class="exam-section-label exam-example-intro">
          <EditPen aria-hidden="true" />
          <h5 ref="examplesHeadingRef" tabindex="-1">{{ patternHeading }}</h5>
        </div>
        <section
          v-if="displayPatterns.length"
          class="exam-patterns"
          aria-label="本知识点历年真题考法"
        >
          <dl class="exam-patterns__list">
            <div
              v-for="(pattern, index) in displayPatterns"
              :key="pattern.form"
              class="exam-patterns__row"
              :class="{ 'is-active': getPatternExampleIndex(pattern) === exampleIndex && getPatternExampleIndex(pattern) >= 0 }"
              @click="selectPattern(pattern)"
            >
              <dt>
                <span class="exam-patterns__number">{{ String(index + 1).padStart(2, '0') }}</span>
                <button
                  type="button"
                  class="exam-patterns__title"
                  :disabled="patternSourcesLoading || getPatternExampleIndex(pattern) < 0"
                  :aria-pressed="getPatternExampleIndex(pattern) === exampleIndex && getPatternExampleIndex(pattern) >= 0"
                  aria-controls="exam-worked-example"
                  @click.stop="selectPattern(pattern)"
                >{{ pattern.form }}</button>
                <span v-if="getPatternExampleIndex(pattern) === exampleIndex && getPatternExampleIndex(pattern) >= 0" class="exam-patterns__selected">当前例题</span>
              </dt>
              <dd>
                <p><KnowledgeText :text="pattern.description" /></p>
                <div class="exam-patterns__source">
                  <span class="exam-patterns__source-label">题目来源</span>
                  <div class="exam-patterns__source-items">
                    <span v-for="item in getPatternSourceLabels(pattern)" :key="item.key" class="exam-patterns__source-item">
                      <template v-if="item.source">
                        {{ item.source.origin }} · 收录于
                        <RouterLink
                          v-if="item.source.year && item.source.paperTitle"
                          class="exam-patterns__link"
                          :to="{ name: 'assessment', query: { year: String(item.source.year), examType } }"
                          @click.stop
                        >{{ item.source.paperTitle }}</RouterLink>
                        <template v-else>{{ item.source.collection.split(' · ')[0] }}</template>
                      </template>
                      <template v-else>{{ item.text }}</template>
                    </span>
                  </div>
                </div>
              </dd>
            </div>
          </dl>
        </section>
        <p v-if="patternSourcesError" role="status">部分考法对应的真题暂时无法加载，请稍后重试。</p>
        <div v-if="otherExamples.length" class="exam-example-picker" role="group" aria-label="其他例题">
          <span class="exam-example-picker__label">其他例题</span>
          <AppButton
            v-for="item in otherExamples"
            :key="item.index"
            type="secondary"
            size="small"
            :class="{ 'is-selected': exampleIndex === item.index }"
            :aria-pressed="exampleIndex === item.index"
            :disabled="patternSourcesLoading"
            @click="selectExample(item.index)"
            >{{ getExampleTitle(item.example) }}</AppButton
          >
        </div>
        <article v-if="example && !patternSourcesLoading" id="exam-worked-example" :key="exampleIndex" class="exam-worked-example">
          <div ref="exampleCardRef" class="exam-question-card" :class="{ 'exam-question-card--paper': example.source }" :style="{ minHeight: reservedExampleHeight ? `${reservedExampleHeight}px` : undefined }">
            <div class="exam-card-title exam-card-title--inline">
              <span
                >{{
                  example.source?.kind === 'bank'
                    ? '题库例题'
                    : example.source
                      ? '真题例题'
                      : '专项例题'
                }}
                {{ exampleIndex + 1 }}</span
              >
              <h6>{{ getExampleTitle(example) }}</h6>
            </div>
            <PastPaperQuestion
              v-if="example.source"
              :source="example.source"
              :hide-source="sourceInPattern"
              :hide-reason="exampleHasPattern"
              @ready="loadedSource = $event"
              @source-info="exampleSourceInfo = $event"
            />
            <p v-else class="exam-question" lang="en"><KnowledgeText :text="example.question" /></p>
            <ol
              v-if="!example.source && example.options"
              class="exam-options"
              aria-label="例题选项"
            >
              <li v-for="(option, index) in example.options" :key="index">
                <span>{{ String.fromCharCode(65 + index) }}</span
                ><KnowledgeText :text="option" />
              </li>
            </ol>
            <div class="exam-example-actions">
              <AppButton
                class="exam-button"
                type="secondary"
                size="small"
                :aria-expanded="revealedExamples.includes(exampleIndex)"
                :disabled="!exampleReady"
                @click="toggleExample"
                >{{
                  revealedExamples.includes(exampleIndex) ? '收起解析' : '查看推理与选项分析'
                }}</AppButton
              >
              <div v-if="exampleReady && revealedExamples.includes(exampleIndex) && (example.answer || originalAnswer)" class="exam-answer">
                <span>正确答案</span><strong><KnowledgeText :text="example.answer || originalAnswer" /></strong>
              </div>
            </div>
          </div>
          <div v-if="exampleReady && revealedExamples.includes(exampleIndex)" class="exam-solution">
            <OriginalQuestionAnalysis v-if="example.source" :subject="example.source.subject || 'biology'" :source-code="example.source.questionCode" @answer="originalAnswer = $event" />
            <h6 v-if="example.steps.length" class="exam-reasoning-title">把知识用到这道题里</h6>
            <ol v-if="example.steps.length" class="exam-reasoning">
              <li v-for="(step, index) in example.steps" :key="index">
                <span>{{ index + 1 }}</span
                ><KnowledgeText :text="step" />
              </li>
            </ol>
            <div v-if="example.optionNotes?.length" class="exam-option-review">
              <h6>每个选项为什么对，为什么错</h6>
              <ul>
                <li v-for="(note, index) in example.optionNotes" :key="index">
                  <KnowledgeText :text="note" />
                </li>
              </ul>
            </div>
            <p v-if="example.takeaway" class="exam-takeaway">
              <strong>下次遇到类似题，记住这一点</strong><KnowledgeText :text="example.takeaway" />
            </p>
          </div>
          <div v-if="exampleReady && example.variant" class="exam-variant">
            <div class="exam-card-title">
              <span>原创改编变式 · 换一个条件（非原卷真题）</span>
              <h6>这次结论还成立吗？</h6>
            </div>
            <p><KnowledgeText :text="example.variant.question" /></p>
            <AppButton
              class="exam-variant-button"
              type="secondary"
              size="small"
              :aria-expanded="revealedVariants.includes(exampleIndex)"
              @click="toggleVariant"
              >{{
                revealedVariants.includes(exampleIndex) ? '收起变式答案' : '核对变式答案'
              }}</AppButton
            >
            <div
              v-if="revealedVariants.includes(exampleIndex)"
              class="exam-variant-answer"
              role="status"
            >
              <strong><KnowledgeText :text="example.variant.answer" /></strong>
              <p><KnowledgeText :text="example.variant.explanation" /></p>
            </div>
          </div>
        </article>
        <div class="exam-next-step">
          <p>解释清楚“为什么错”，再做一次独立判断。</p>
          <AppButton
            class="exam-button"
            type="secondary"
            size="small"
            :icon="Right"
            icon-position="right"
            @click="goToTab('check')"
            >进入易错与自测</AppButton
          >
        </div>
      </el-tab-pane>

      <el-tab-pane label="易错与自测" name="check" lazy>
        <div class="exam-pitfalls">
          <div class="exam-section-label">
            <Warning aria-hidden="true" />
            <h5 ref="checkHeadingRef" tabindex="-1">这几处容易想错，做题时多看一眼</h5>
          </div>
          <ul>
            <li v-for="(pitfall, index) in section.pitfalls" :key="index">
              <KnowledgeText :text="pitfall" />
            </li>
          </ul>
        </div>
        <KnowledgeSelfCheck :key="section.code" :code="section.code" :exam-type="examType" />
        <div class="exam-checklist">
          <div class="exam-section-label">
            <CircleCheck aria-hidden="true" />
            <h5>进入练习前，确认自己能做到</h5>
          </div>
          <ul>
            <li v-for="(item, index) in focus.checklist" :key="index">
              <CircleCheck aria-hidden="true" /><KnowledgeText :text="item" />
            </li>
          </ul>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onDeactivated, ref, watch } from 'vue'
import {
  CircleCheck,
  CollectionTag,
  EditPen,
  List,
  Reading,
  Right,
  Warning,
} from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'
import KnowledgeVisual from './KnowledgeVisual.vue'
import PastPaperQuestion from './PastPaperQuestion.vue'
import KnowledgeSelfCheck from './KnowledgeSelfCheck.vue'
import KnowledgeConceptFlow from './KnowledgeConceptFlow.vue'
import PythagorasMethods from './PythagorasMethods.vue'
import CircleTheoremMethods from './CircleTheoremMethods.vue'
import UnitsMethods from './UnitsMethods.vue'
import StatisticsMethods from './StatisticsMethods.vue'
import ProbabilityFoundationsMethods from './ProbabilityFoundationsMethods.vue'
import ProbabilityReasoningMethods from './ProbabilityReasoningMethods.vue'
import AlgebraFoundationsMethods from './AlgebraFoundationsMethods.vue'
import AlgebraManipulationMethods from './AlgebraManipulationMethods.vue'
import AlgebraGraphMethods from './AlgebraGraphMethods.vue'
import AlgebraApplicationsMethods from './AlgebraApplicationsMethods.vue'
import AlgebraFinalMethods from './AlgebraFinalMethods.vue'
import EukaryoticCellMethods from './EukaryoticCellMethods.vue'
import ProkaryoticCellMethods from './ProkaryoticCellMethods.vue'
import OrganisationMethods from './OrganisationMethods.vue'
import MembraneTransportMethods from './MembraneTransportMethods.vue'
import CellDivisionMethods from './CellDivisionMethods.vue'
import InheritanceMethods from './InheritanceMethods.vue'
import GeometryMethodsReview from './GeometryMethodsReview.vue'
import OriginalQuestionAnalysis from './OriginalQuestionAnalysis.vue'
import { getLearningPatternSources, type LearningPatternSource } from '@/api/learningExamples'
import type {
  KnowledgeExamFocus,
  KnowledgeExamStage,
  KnowledgeSection,
} from '@/content/knowledge/types'

const props = defineProps<{
  section: KnowledgeSection
  focus: KnowledgeExamFocus
  examType: 'ESAT' | 'TMUA'
}>()
// 将当前学习阶段交给外层面板，让速记显隐跟随标签和底部导航同步。
const activeTab = defineModel<KnowledgeExamStage>('stage', { default: 'summary' })
const exampleIndex = ref(0)
const exampleCardRef = ref<HTMLElement | null>(null)
const reservedExampleHeight = ref(0)
const loadedSource = ref('')
const exampleSourceInfo = ref<{ code: string; origin: string; collection: string } | null>(null)
const patternSources = ref<LearningPatternSource[]>([])
const patternSourcesError = ref(false)
const patternSourcesLoading = ref(false)
const originalAnswer = ref('')
const revealedExamples = ref<number[]>([])
const revealedVariants = ref<number[]>([])
const examplesHeadingRef = ref<HTMLElement>()
const checkHeadingRef = ref<HTMLElement>()

// 单一试卷类型的年份逐一标出来源；混合卷别不能推断逐年的对应关系。
function formatPastPaperReference(reference: string): string {
  if (props.examType !== 'ESAT' || !/NSAA|ENGAA/i.test(reference)) return reference
  const singlePaper = /^(\d{4}(?:[—–-]\d{4})?(?:[、,，]\s*\d{4}(?:[—–-]\d{4})?)*)\s+(NSAA|ENGAA)(.*)$/i.exec(reference)
  let formatted = reference
  if (singlePaper && !/NSAA|ENGAA/i.test(singlePaper[3] || '')) {
    const years: string[] = []
    for (const part of singlePaper[1]!.split(/[、,，]/)) {
      const bounds = part.trim().split(/[—–-]/).map(Number)
      const start = bounds[0]!
      const end = bounds[1] ?? start
      // 超出正常年度范围时保留原文，避免把异常字符串当作完整年份列表。
      if (end < start || end - start > 20) return reference
      for (let year = start; year <= end; year++) years.push(`${year} ${singlePaper[2]}`)
    }
    formatted = years.join('、') + singlePaper[3]
  }
  const subjects: Record<string, string> = { '13': '物理', '14': '化学', '15': '生物' }
  const subject = subjects[props.section.code.slice(0, 2)]
  return subject && !formatted.includes(subject) ? `${formatted} · ${subject}` : formatted
}

// 数学、化学与物理使用宽幅互动图解和紧凑规则列表，保留生物既有的图文布局。
const usesCompactLayout = computed(
  () =>
    props.section.visual != null &&
    [
      'maths-units',
      'maths-number',
      'maths-ratio',
      'maths-algebra',
      'maths-geometry',
      'maths-statistics',
      'maths-probability',
      'maths2-algebra',
      'maths2-sequences',
      'maths2-coordinate',
      'maths2-trigonometry',
      'maths2-exponentials',
      'maths2-differentiation',
      'maths2-integration',
      'maths2-graphs',
      'tmua-quadratic',
      'tmua-simultaneous',
      'tmua-indices',
      'tmua-surds',
      'tmua-inequalities',
      'tmua-polynomials',
      'tmua-functions',
      'physics-electricity',
      'physics-magnetism',
      'physics-mechanics',
      'physics-thermal',
      'physics-matter',
      'physics-waves',
      'physics-radioactivity',
      'atomic-structure',
      'periodic-table',
      'chemical-reactions',
      'quantitative-chemistry',
      'redox',
      'chemical-bonding',
      'group-chemistry',
      'separation-techniques',
      'acids-bases-salts',
      'reaction-rates',
      'energy-changes',
      'electrolysis',
      'organic-chemistry',
      'metals',
      'particle-theory',
      'chemical-tests',
      'air-water',
    ].includes(props.section.visual),
)

// 离开缓存工作区时卸载自测，避免下次进入沿用上一次答案。
onDeactivated(() => {
  activeTab.value = 'summary'
})

// 同一知识点中只展开当前选定的一道例题，减少长篇讲解的阅读负担。
// 旧讲义缺少历年归纳时，只从标明真题来源的精选例题提取考法，不冒充全量统计。
const displayPatterns = computed(() => {
  if (props.focus.pastPaperPatterns?.length) return props.focus.pastPaperPatterns
  return props.focus.examples
    .filter((item) => item.source && item.source.kind !== 'bank')
    .map((item) => ({
      form: item.title,
      description: item.source!.why,
      reference: item.source!.questionCode,
      sourceCodes: [item.source!.questionCode],
    }))
})
// 区分历年归纳和例题线索，避免让学生误认为单题代表完整考查范围。
const patternHeading = computed(() =>
  props.focus.pastPaperPatterns?.length ? '真题怎么考' : displayPatterns.value.length ? '精选真题怎么考' : '例题拆解',
)
// 每个考法优先沿用已有拆解；缺失时展示已关联的真题及其原始解析。
const displayExamples = computed<KnowledgeExamFocus['examples']>(() => {
  if (!props.focus.pastPaperPatterns?.length) return props.focus.examples
  const used = new Set<KnowledgeExamFocus['examples'][number]>()
  const examples: KnowledgeExamFocus['examples'] = []
  for (const pattern of props.focus.pastPaperPatterns) {
    const existing = props.focus.examples.find((item) => item.source && pattern.sourceCodes?.includes(item.source.questionCode))
    if (existing) {
      used.add(existing)
      examples.push({ ...existing, title: pattern.form })
      continue
    }
    const source = patternSources.value.find((item) => item.exampleAvailable && pattern.sourceCodes?.includes(item.code))
    if (source) {
      examples.push({ title: pattern.form, source: { questionCode: source.code, subject: 'pattern', kind: 'annual', why: pattern.description }, question: '', answer: '', steps: [], takeaway: '' })
    }
  }
  return [...examples, ...props.focus.examples.filter((item) => !used.has(item))]
})
// 已选择的例题随考法列表读取，切换知识点时按既有流程恢复第一题。
const example = computed(() => displayExamples.value[exampleIndex.value])
// 已在考法中说明的题目不再重复显示练习目的。
const exampleHasPattern = computed(() => {
  const code = example.value?.source?.questionCode
  return Boolean(code && displayPatterns.value.some((pattern) => pattern.sourceCodes?.includes(code)))
})
// 同一真题可能涉及多条考法，优先按生成的考法标题确定对应入口。
function getPatternExampleIndex(pattern: { form: string; sourceCodes?: string[] }): number {
  const codes = pattern.sourceCodes || []
  const exact = displayExamples.value.findIndex((item) => item.title === pattern.form && item.source && codes.includes(item.source.questionCode))
  return exact >= 0 ? exact : displayExamples.value.findIndex((item) => item.source && codes.includes(item.source.questionCode))
}
// 不属于任何已展示考法的例题保留独立入口，避免原有例题无法访问。
const otherExamples = computed(() => {
  const linked = new Set(displayPatterns.value.map(getPatternExampleIndex).filter((index) => index >= 0))
  return displayExamples.value.map((item, index) => ({ example: item, index })).filter((item) => !linked.has(item.index))
})
// 更换例题时清除上题原始答案，解析展开后再读取当前题答案。
watch(() => example.value?.source?.questionCode, () => { originalAnswer.value = '' })

// 考法行负责选择对应例题，来源链接仍单独处理诊断卷导航。
function selectPattern(pattern: { form: string; sourceCodes?: string[] }): void {
  if (patternSourcesLoading.value) return
  const index = getPatternExampleIndex(pattern)
  if (index >= 0) selectExample(index)
}

// 切题时保留适度题卡高度，避免加载占位导致页面先收缩再撑开。
function selectExample(index: number): void {
  if (index === exampleIndex.value) return
  reservedExampleHeight.value = Math.min(exampleCardRef.value?.offsetHeight || 0, 420)
  exampleIndex.value = index
}
// 按真题来源匹配唯一考法，关联不明确时保留题目原有标题。
function getExampleTitle(item: KnowledgeExamFocus['examples'][number]): string {
  const code = item.source?.questionCode
  if (!code) return item.title
  const matches = displayPatterns.value.filter((pattern) => pattern.sourceCodes?.includes(code))
  return matches.length === 1 ? matches[0]!.form : item.title
}
// 阅读例题时批量读取考法涉及的诊断卷位置，切换知识点时丢弃旧请求。
watch(
  () => [activeTab.value, props.examType, displayPatterns.value] as const,
  async ([stage, examType, patterns], _previous, onCleanup) => {
    let active = true
    onCleanup(() => { active = false })
    patternSources.value = []
    patternSourcesError.value = false
    patternSourcesLoading.value = false
    if (stage !== 'examples') return
    const codes = [...new Set(patterns.flatMap((pattern) => pattern.sourceCodes || []))]
    if (!codes.length) return
    patternSourcesLoading.value = true
    try {
      const sources = await getLearningPatternSources(examType, codes)
      if (active) patternSources.value = sources
    } catch {
      // 来源接口暂不可用时保留讲义中已有的来源文字。
      if (active) patternSourcesError.value = true
    } finally {
      if (active) patternSourcesLoading.value = false
    }
  },
  { immediate: true },
)

// 多道来源逐题展示；未能匹配的来源保留原有归纳，避免丢失考查范围。
function getPatternSourceLabels(pattern: { reference: string; sourceCodes?: string[] }): Array<{ key: string; source?: LearningPatternSource; text?: string }> {
  const codes = pattern.sourceCodes || []
  const matches = patternSources.value.filter((source) => codes.includes(source.code))
  if (exampleSourceInfo.value && codes.includes(exampleSourceInfo.value.code) && !matches.some((source) => source.code === exampleSourceInfo.value?.code)) {
    matches.push(exampleSourceInfo.value)
  }
  const labels = [...new Map(matches.map((source) => [ `${source.origin} · ${source.collection}`, { key: `${source.origin} · ${source.collection}`, source } ])).values()]
  if (!labels.length || codes.some((code) => !matches.some((source) => source.code === code))) {
    const text = formatPastPaperReference(pattern.reference)
    return [...labels, { key: `fallback:${text}`, text }]
  }
  return labels
}
// 仅在来源编号与考法明确对应时上移，避免把例题归到不相关的考法。
const sourceInPattern = computed(() =>
  Boolean(exampleSourceInfo.value && displayPatterns.value.some((pattern) =>
    pattern.sourceCodes?.includes(exampleSourceInfo.value!.code),
  )),
)
// 原题尚未加载时不展示脱离题干的解析或变式，旧请求不能解锁另一道题。
const exampleReady = computed(
  () => !example.value?.source || loadedSource.value === example.value.source.questionCode,
)

// 底部学习入口切换后把焦点与阅读位置交给下一阶段，避免停留在已隐藏的按钮上。
async function goToTab(tab: 'examples' | 'check'): Promise<void> {
  activeTab.value = tab
  await nextTick()
  // 等标签组件完成自己的焦点更新，再交给正文，避免它覆盖本次阅读定位。
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
  if (activeTab.value !== tab) return
  const heading = tab === 'examples' ? examplesHeadingRef.value : checkHeadingRef.value
  heading?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
  heading?.focus({ preventScroll: true })
}

// 各例题独立保留解析展开状态，方便在原题和变式之间来回核对。
function toggleExample(): void {
  revealedExamples.value = revealedExamples.value.includes(exampleIndex.value)
    ? revealedExamples.value.filter((index) => index !== exampleIndex.value)
    : [...revealedExamples.value, exampleIndex.value]
}

// 变式答案与原题解析分别揭示，避免查看原题时提前看到变式结论。
function toggleVariant(): void {
  revealedVariants.value = revealedVariants.value.includes(exampleIndex.value)
    ? revealedVariants.value.filter((index) => index !== exampleIndex.value)
    : [...revealedVariants.value, exampleIndex.value]
}
</script>

<style scoped>
.exam-knowledge {
  min-width: 0;
  color: var(--color-ink-soft);
}
.exam-patterns {
  margin: 0 0 24px;
  font-size: var(--text-sm);
}
.exam-patterns__list {
  margin: 0;
  border-top: 1px solid var(--color-line);
}
.exam-patterns__row {
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-line);
  border-left: 3px solid transparent;
  cursor: pointer;
}
.exam-patterns__row.is-active {
  border-left-color: var(--color-learning-teal);
  background: var(--color-learning-teal-soft);
}
.exam-patterns__row dt {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: var(--color-ink);
  font-weight: 700;
  line-height: var(--leading-relaxed);
}
.exam-patterns__row dd,
.exam-patterns__row p {
  margin: 0;
  line-height: var(--leading-relaxed);
}
.exam-patterns__row dd {
  margin-top: 4px;
}
.exam-patterns__number {
  flex: none;
  color: var(--color-learning-blue);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.exam-patterns__title {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}
.exam-patterns__title:focus-visible {
  outline: 2px solid var(--color-learning-blue);
  outline-offset: 3px;
}
.exam-patterns__title:disabled {
  cursor: default;
}
.exam-patterns__selected {
  color: var(--color-learning-teal);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.exam-patterns__source {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 5px;
  color: var(--color-ink-soft);
  font-size: 13px;
}
.exam-patterns__source-label {
  color: var(--color-ink-muted);
}
.exam-patterns__source-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.exam-patterns__source-item {
  display: inline;
}
.exam-patterns__link {
  color: var(--color-learning-blue);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.exam-patterns__link:hover {
  color: var(--color-ink);
}
.exam-story {
  display: grid;
  gap: 22px;
  align-items: start;
}
.exam-story--illustrated {
  grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
  gap: 24px;
}
/* 细胞分裂讲解将要点延续在文字列，与较高的互动图解并行阅读。 */
.exam-story > .exam-concepts {
  grid-column: 1 / -1;
}
.exam-story--division {
  grid-template-areas: 'narrative visual' 'concepts visual';
  grid-template-rows: auto 1fr;
  row-gap: 0;
}
.exam-story--division .exam-story__narrative {
  grid-area: narrative;
}
.exam-story--division .exam-story__visual {
  grid-area: visual;
}
.exam-story--division > .exam-concepts {
  grid-area: concepts;
  min-width: 0;
}
.exam-story--division .exam-concept-grid {
  grid-template-columns: minmax(0, 1fr);
  margin-bottom: 0;
}
/* 细胞图解自带结构说明栏，整行展示才能让插图与交互说明同时可读。 */
.exam-story--atlas {
  grid-template-columns: minmax(0, 1fr);
}
/* 化学把简短导读与正文接成一个阅读区域，让结构图、反应图和计算路线使用完整宽度。 */
.exam-knowledge--compact .exam-story__narrative {
  display: grid;
  grid-template-columns: minmax(200px, 0.7fr) minmax(0, 1.3fr);
  gap: 22px;
  align-items: start;
}
.exam-knowledge--compact .exam-summary-copy {
  margin-top: 0;
}
.exam-knowledge--compact .exam-concept-grid {
  display: block;
}
.exam-knowledge--compact .exam-concept-card {
  display: grid;
  grid-template-columns: minmax(150px, 0.3fr) minmax(0, 1fr);
  gap: 18px;
  padding: 14px 0;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  border-radius: 0;
  background: transparent;
}
.exam-knowledge--compact .exam-concept-card > p {
  margin: 0;
}
@media (max-width: 900px) {
  .exam-knowledge--compact .exam-story__narrative,
  .exam-knowledge--compact .exam-concept-card {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
}
.exam-story__narrative,
.exam-story__visual {
  min-width: 0;
}
.exam-story__visual :deep(figure) {
  margin-top: 0;
}
.exam-overview {
  padding: 15px 18px;
  border-left: 3px solid var(--color-learning-blue);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  background: var(--color-learning-blue-soft);
}
.exam-overview .exam-section-label {
  margin: 0 0 8px;
}
.exam-overview p {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  line-height: 1.8;
}
.exam-summary-copy {
  margin: 12px 0 0;
  font-size: var(--text-sm);
  line-height: 1.9;
}
.exam-summary-copy p {
  margin: 10px 0;
}
.exam-tabs {
  --el-color-primary: var(--color-learning-blue);
}
.exam-tabs :deep(.el-tabs__header) {
  margin-bottom: 18px;
}
.exam-tabs :deep(.el-tabs__item) {
  font-weight: var(--weight-semi);
  font-size: var(--text-base);
}
.exam-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: var(--color-learning-blue-line);
}
.exam-tabs :deep(.el-tab-pane) {
  min-width: 0;
}
.exam-section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 22px 0 10px;
  color: var(--color-learning-blue);
}
.exam-section-label > svg {
  width: 20px;
  height: 20px;
  flex: none;
}
.exam-section-label h5 {
  scroll-margin-top: 100px;
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
  line-height: 1.6;
}
.exam-helper {
  margin: 10px 0 16px;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.7;
}
/* 例题区只保留一行轻量提示，为题目和解析留出阅读空间。 */
.exam-example-intro {
  margin: 8px 0 12px;
}
.exam-example-intro h5 {
  color: var(--color-ink-soft);
  font-size: 14px;
  font-weight: var(--weight-normal);
}
.exam-concept-count {
  margin-left: auto;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
}
.exam-concept-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 32px;
  margin: 8px 0 24px;
}
.exam-concept-card {
  --concept-color: var(--color-learning-blue);
  min-width: 0;
  padding: 15px 0 17px;
  border-top: 1px solid var(--color-line);
}
.exam-concept-card:nth-child(3n + 2) {
  --concept-color: var(--color-learning-teal);
}
.exam-concept-card:nth-child(3n + 3) {
  --concept-color: var(--color-learning-violet);
}
.exam-concept-card header {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.exam-concept-card header > span {
  flex: none;
  color: var(--concept-color);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
}
.exam-concept-card h6 {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  line-height: 1.7;
}
.exam-concept-card > p {
  margin: 7px 0 0 28px;
  font-size: var(--text-sm);
  line-height: 1.8;
}
.exam-reasoning-title {
  margin: 20px 0 12px;
  color: var(--color-learning-teal);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}
.exam-table-scroll {
  overflow-x: auto;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: var(--radius-md);
}
.exam-table-scroll table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
  line-height: 1.8;
}
.exam-table-scroll th,
.exam-table-scroll td {
  min-width: 130px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-line);
  text-align: left;
  vertical-align: top;
}
.exam-table-scroll thead th {
  color: var(--color-learning-blue);
  background: var(--color-learning-blue-soft);
  font-weight: var(--weight-semi);
}
.exam-table-scroll tbody th {
  color: var(--color-ink);
  font-weight: var(--weight-medium);
}
.exam-table-scroll tr:last-child > * {
  border-bottom: 0;
}
.exam-table-scroll tbody tr:nth-child(even) {
  background: var(--color-surface-alt);
}
.exam-next-step {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-line);
}
.exam-next-step p {
  margin: 0;
  font-size: var(--text-sm);
}
.exam-knowledge .app-button.exam-button,
.exam-knowledge .exam-example-picker .app-button.is-selected {
  --app-button-bg: var(--color-learning-teal-soft);
  --app-button-color: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-hover-bg: var(--color-learning-teal-line);
  --app-button-hover-border: var(--color-learning-teal);
  --app-button-active-bg: var(--color-learning-teal-line);
  --app-button-active-border: var(--color-learning-teal);
}
.exam-example-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 16px 0 20px;
}
.exam-example-picker__label {
  align-self: center;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}
.exam-example-picker :deep(.app-button) {
  max-width: 100%;
  min-height: 38px;
  height: auto;
  padding: 9px 12px;
  line-height: 1.6;
  white-space: normal;
  text-align: left;
}
.exam-example-picker .is-selected {
  box-shadow: inset 0 0 0 1px var(--color-learning-teal);
}
.exam-example-picker :deep(.app-button.el-button:active:not(:disabled)) {
  transform: none;
}
.exam-question-card {
  box-sizing: border-box;
  overflow-anchor: none;
  padding: 22px;
  border: 1px solid var(--color-learning-teal-line);
  border-top: 3px solid var(--color-learning-teal);
  border-radius: var(--radius-lg);
  background: linear-gradient(140deg, var(--color-learning-teal-soft), var(--color-surface));
}
/* 外层使用轻色底，将在线答题组件的白色题干和选项从页面中区分出来。 */
.exam-question-card--paper {
  border: 1px solid #dfe6ef;
  border-radius: var(--radius-md);
  background: #f5f8fc;
}
.exam-card-title > span {
  display: block;
  margin-bottom: 5px;
  color: var(--color-learning-teal);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}
.exam-card-title h6 {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-semi);
  line-height: 1.6;
}
/* 例题序号与问题并排呈现，避免辅助标签单独占据一行。 */
.exam-card-title--inline {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.exam-card-title--inline > span {
  flex-shrink: 0;
  margin-bottom: 0;
  font-size: var(--text-lg);
}
.exam-card-title--inline h6 {
  min-width: 0;
}
.exam-question {
  margin: 18px 0;
  color: var(--color-ink);
  font-size: var(--text-base);
  line-height: 1.9;
}
.exam-options {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 16px 0 22px;
  list-style: none;
}
.exam-options li {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  line-height: 1.75;
}
.exam-options li > span:first-child {
  color: var(--color-learning-teal);
  font-family: var(--font-mono);
  font-weight: var(--weight-bold);
}
.exam-options li > :last-child {
  min-width: 0;
}
.exam-solution {
  margin: 12px 0 24px;
  padding: 20px 22px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.exam-example-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 16px;
}
.exam-answer {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  line-height: 1.5;
}
.exam-answer > span {
  color: var(--color-learning-teal);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}
.exam-answer strong {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}
.exam-reasoning {
  display: grid;
  gap: 16px;
  padding: 18px 0;
  margin: 0;
  list-style: none;
}
.exam-reasoning li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  line-height: 1.9;
}
.exam-reasoning li > span:first-child {
  display: grid;
  place-items: center;
  flex: none;
  width: 27px;
  height: 27px;
  margin-top: 2px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: 50%;
  color: var(--color-learning-teal);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  font-weight: var(--weight-semi);
}
.exam-option-review {
  padding: 16px 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
}
.exam-option-review h6 {
  margin: 0 0 10px;
  color: var(--color-ink);
  font-size: var(--text-sm);
}
.exam-option-review ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 20px;
  font-size: var(--text-sm);
  line-height: 1.9;
}
.exam-takeaway {
  display: grid;
  gap: 8px;
  padding: 16px 20px;
  margin: 14px 0 0;
  border-left: 3px solid var(--color-learning-teal);
  background: var(--color-learning-teal-soft);
  font-size: var(--text-sm);
  line-height: 1.8;
}
.exam-takeaway strong {
  color: var(--color-learning-teal);
}
.exam-variant {
  margin-top: 18px;
  padding: 22px;
  border: 1px solid var(--color-learning-violet-line);
  border-radius: var(--radius-lg);
  background: var(--color-learning-violet-soft);
}
.exam-variant .exam-card-title > span {
  color: var(--color-learning-violet);
}
.exam-variant > p,
.exam-variant-answer p {
  line-height: 1.9;
}
.exam-knowledge .app-button.exam-variant-button {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-violet);
  --app-button-border: var(--color-learning-violet-line);
  --app-button-hover-bg: var(--color-learning-violet-line);
  --app-button-hover-border: var(--color-learning-violet);
  --app-button-active-bg: var(--color-learning-violet-line);
  --app-button-active-border: var(--color-learning-violet);
}
.exam-variant-answer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-learning-violet-line);
  line-height: 1.8;
}
.exam-variant-answer strong {
  color: var(--color-learning-violet);
  font-weight: var(--weight-semi);
}
.exam-variant-answer p:last-child {
  margin-bottom: 0;
}
.exam-pitfalls {
  padding: 4px 20px 16px;
  border: 1px solid var(--color-learning-amber-line);
  border-radius: var(--radius-lg);
  background: var(--color-learning-amber-soft);
}
.exam-pitfalls .exam-section-label {
  color: var(--color-learning-amber);
}
.exam-pitfalls ul {
  display: grid;
  gap: 10px;
  padding-left: 20px;
  line-height: 1.85;
  font-size: var(--text-sm);
}
.exam-pitfalls li::marker {
  color: var(--color-learning-amber);
}
.exam-check {
  min-width: 0;
  margin: 24px 0;
  padding: 20px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-lg);
}
.exam-check legend {
  padding: 0 8px;
  color: var(--color-learning-teal);
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
}
.exam-check > p {
  margin: 0 0 16px;
  line-height: 1.9;
}
.exam-check :deep(.el-radio-group) {
  display: grid;
  gap: 10px;
  width: 100%;
  margin-bottom: 20px;
}
.exam-check :deep(.el-radio) {
  height: auto;
  min-width: 0;
  margin: 0;
  padding: 13px 14px;
  align-items: flex-start;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
}
.exam-check :deep(.el-radio.is-checked) {
  border-color: var(--color-learning-blue);
  background: var(--color-learning-blue-soft);
}
.exam-check :deep(.el-radio__input) {
  margin-top: 5px;
}
.exam-check :deep(.el-radio__label) {
  min-width: 0;
  padding-left: 12px;
  white-space: normal;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.85;
}
.exam-option-letter {
  margin-right: 8px;
  font-weight: var(--weight-semi);
}
.exam-check > .exam-helper:last-child {
  margin: 14px 0 0;
  font-size: var(--text-xs);
}
.exam-feedback {
  padding: 16px 18px;
  border-radius: var(--radius-md);
  background: var(--color-learning-amber-soft);
  color: var(--color-learning-amber);
  line-height: 1.8;
}
.exam-feedback p {
  color: var(--color-ink-soft);
}
.exam-feedback.is-correct {
  background: var(--color-learning-teal-soft);
  color: var(--color-learning-teal);
}
.exam-checklist {
  padding: 0 0 4px;
}
.exam-checklist ul {
  display: grid;
  gap: 12px;
  padding: 0;
  list-style: none;
}
.exam-checklist li {
  display: flex;
  gap: 10px;
  font-size: var(--text-sm);
  line-height: 1.9;
}
.exam-checklist li > svg {
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 4px;
  color: var(--color-learning-teal);
}
.exam-knowledge :deep(.latex-text) {
  overflow-wrap: anywhere;
}
@media (max-width: 1180px) {
  .exam-story--illustrated {
    grid-template-columns: minmax(0, 1fr);
  }
  .exam-story--division {
    grid-template-areas: 'narrative' 'visual' 'concepts';
    grid-template-rows: auto;
    row-gap: 18px;
  }
}
@media (max-width: 760px) {
  .exam-solution {
    padding: 16px;
  }
  .exam-patterns__row {
    padding: 10px 0;
  }
  .exam-tabs :deep(.el-tabs__item) {
    padding: 0 12px;
    font-size: var(--text-sm);
  }
  .exam-question-card,
  .exam-variant,
  .exam-check {
    padding: 16px;
  }
  .exam-concept-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .exam-concept-card > p {
    margin-left: 26px;
  }
  .exam-question {
    font-size: var(--text-sm);
  }
  .exam-check :deep(.el-radio) {
    padding: 10px;
  }
  .exam-check :deep(.el-radio__label) {
    padding-left: 8px;
  }
}
</style>
