<!-- 数学1几何方法讲义：用紧凑分节、关系图与重点提示呈现可迁移的解题方法。 -->
<template>
  <div class="geometry-methods">
    <header class="method-intro">
      <span class="eyebrow">考点梳理</span>
      <h5>{{ lesson.title }}</h5>
      <p>{{ lesson.introduction }}</p>
      <ol v-if="lesson.route.length" class="method-route"><li v-for="(step, index) in lesson.route" :key="step"><span>0{{ index + 1 }}</span>{{ step }}</li></ol>
    </header>
    <section v-for="(section, index) in lesson.sections" :key="section.title" class="method-section">
      <header class="section-heading"><span>{{ String(index + 1).padStart(2, '0') }}</span><h5>{{ section.title }}</h5></header>
      <div :class="{ 'illustrated': section.diagram || section.reasoningDiagram || section.measurementDiagram || section.foundationDiagram || section.readingDiagram }">
        <div class="method-list" :style="{ '--method-columns': Math.min(section.items.length, 3) }" :class="{ 'method-list--columns': !section.diagram && !section.reasoningDiagram && !section.measurementDiagram && !section.foundationDiagram && !section.readingDiagram }">
          <article v-for="item in section.items" :key="item.title">
            <h6>{{ item.title }}</h6>
            <p v-if="item.formula" class="method-formula"><KnowledgeText :text="item.formula" /></p>
            <p><KnowledgeText :text="item.text" /></p>
          </article>
        </div>
        <GeometryMethodDiagram v-if="section.diagram" :kind="section.diagram" />
        <GeometryReasoningDiagram v-else-if="section.reasoningDiagram" :kind="section.reasoningDiagram" />
        <GeometryMeasurementDiagram v-else-if="section.measurementDiagram" :kind="section.measurementDiagram" />
        <GeometryFoundationDiagram v-else-if="section.foundationDiagram" :kind="section.foundationDiagram" />
        <GeometryReadingDiagram v-else-if="section.readingDiagram" :kind="section.readingDiagram" />
      </div>
      <p v-if="section.note" class="method-note"><KnowledgeText :text="section.note" /></p>
    </section>
    <section v-if="lesson.checks.length" class="method-checks">
      <h5>最后核对：结果是否符合图形</h5>
      <ul><li v-for="check in lesson.checks" :key="check">{{ check }}</li></ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import KnowledgeText from './KnowledgeText.vue'
import GeometryMethodDiagram from './GeometryMethodDiagram.vue'
import GeometryReasoningDiagram from './GeometryReasoningDiagram.vue'
import GeometryMeasurementDiagram from './GeometryMeasurementDiagram.vue'
import GeometryFoundationDiagram from './GeometryFoundationDiagram.vue'
import GeometryReadingDiagram from './GeometryReadingDiagram.vue'
import { geometryInferenceMethods, circleVocabularyMethods, solidVocabularyMethods, plansElevationsMethods } from '@/content/knowledge/geometryReadingMethods'
import { geometryNotationMethods, anglePropertiesMethods, shapePropertiesMethods, triangleCongruenceMethods } from '@/content/knowledge/geometryFoundationMethods'
import { coordinateMethods, transformationMethods } from '@/content/knowledge/coordinateTransformMethods'
import { similarityMethods, trigonometryMethods, vectorReasoningMethods } from '@/content/knowledge/geometryReasoningMethods'
import { mapsBearingsMethods, basicMeasureMethods, circularSolidsMethods, sectorMethods } from '@/content/knowledge/geometryMeasurementMethods'
const lessons = {
  '110501': geometryNotationMethods,
  '110502': anglePropertiesMethods,
  '110503': shapePropertiesMethods,
  '110504': triangleCongruenceMethods,
  '110505': geometryInferenceMethods,
  '110506': transformationMethods,
  '110508': circleVocabularyMethods,
  '110510': coordinateMethods,
  '110511': solidVocabularyMethods,
  '110512': plansElevationsMethods,
  '110513': mapsBearingsMethods,
  '110514': basicMeasureMethods,
  '110515': circularSolidsMethods,
  '110516': sectorMethods,
  '110517': similarityMethods,
  '110518': trigonometryMethods,
  '110519': vectorReasoningMethods,
}
const props = defineProps<{ code: keyof typeof lessons }>()
// 按考纲编码选择讲义，切换知识点时同步更新方法和图示。
const lesson = computed(() => lessons[props.code])
</script>

<style scoped>
.geometry-methods { container-type: inline-size; min-width: 0; color: var(--color-ink); }
.method-intro { padding: 2px 0 16px; border-bottom: 1px solid var(--color-line); }
.eyebrow { color: #2451c5; font-size: 13px; font-weight: 700; }
.method-intro h5 { margin: 8px 0; font-size: 22px; line-height: 1.5; color: #142033; }
p { margin: 7px 0 0; font-size: 14px; line-height: 1.85; color: var(--color-ink-soft); overflow-wrap: anywhere; }
.method-route { display: flex; flex-wrap: wrap; gap: 12px 24px; padding: 0; margin: 16px 0 0; list-style: none; font-size: 13px; color: #34455e; }
.method-route li { display: flex; gap: 8px; align-items: center; }
.method-route span, .section-heading > span { color: #2451c5; font-size: 12px; font-weight: 700; }
.method-section { padding: 24px 0; border-bottom: 1px solid var(--color-line); }
.section-heading { display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px; }
.section-heading h5, .method-checks h5 { margin: 0; font-size: 18px; line-height: 1.5; font-weight: 700; color: #142033; }
.illustrated { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(340px, .8fr); align-items: start; gap: 24px; }
/* 图框按内容自然增高；不再把 SVG 挤进左栏文字留下的高度，避免按钮越多图形越小。 */
.illustrated > figure {
  min-height: 0;
  padding: 14px 16px;
}
.illustrated > .method-list { align-self: start; }
.illustrated > figure > :deep(svg) {
  display: block;
  width: 100%;
  max-width: 360px;
  max-height: none;
  height: auto;
  margin: 10px auto;
}
.illustrated > figure :deep(p) { margin-top: 0; }
/* 按正文实际宽度切换，左侧考纲展开后也不会把图文两栏继续压窄。 */
@container (max-width: 880px) {
  .illustrated { grid-template-columns: minmax(0, 1fr); gap: 16px; }
}
.method-list { display: grid; gap: 18px; min-width: 0; }
/* 简短定义按实际条目排布，避免两条内容仍预留第三列空位。 */
.method-list--columns { grid-template-columns: repeat(var(--method-columns, 3), minmax(0, 1fr)); gap: 22px; }
.method-list article { min-width: 0; padding-top: 10px; border-top: 2px solid #dce6f5; }
h6 { margin: 0; color: var(--color-ink); font-size: 15px; line-height: 1.6; font-weight: 700; }
.method-formula { color: #2451c5; }
.method-note { margin-top: 18px; padding: 10px 14px; border-left: 3px solid #d99a38; background: #fff8ec; border-radius: 0 6px 6px 0; }
.method-checks { margin-top: 24px; padding: 18px; border-radius: 8px; background: #f2f8f7; }
.method-checks ul { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 28px; padding-left: 20px; margin: 14px 0 0; font-size: 14px; line-height: 1.8; }
.method-checks li::marker { color: #11786f; }
@media (max-width: 1000px) {
  .illustrated, .method-list--columns { grid-template-columns: minmax(0, 1fr); }
  .illustrated { gap: 16px; }
}
@media (max-width: 600px) {
  .method-checks ul { grid-template-columns: minmax(0, 1fr); }
  .method-intro h5 { font-size: 19px; }
}
</style>
