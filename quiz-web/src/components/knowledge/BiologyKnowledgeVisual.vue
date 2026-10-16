<!-- 生物图示入口：细胞、跨膜运输与组织层级使用各自的教学图解。 -->
<template>
  <MembraneTransportDiagram v-if="kind === 'membrane-transport'" />
  <CellStructureDiagram
    v-else-if="kind === 'eukaryotic-cell' || kind === 'prokaryotic-cell'"
    :kind="kind"
  />
  <figure v-else class="biology-visual">
    <figcaption><span class="biology-label">层级图解</span>从一个细胞，到协作的整体</figcaption>
    <div class="biology-controls" role="group" aria-label="选择生物体层级示例">
      <AppButton
        v-for="item in organismOptions"
        :key="item.id"
        type="secondary"
        size="small"
        :aria-pressed="organism === item.id"
        @click="organism = item.id"
        >{{ item.label }}</AppButton
      >
    </div>
    <ol class="organisation-chain" aria-label="细胞到生物体的层级">
      <li v-for="(level, index) in organisationLevels" :key="level.name">
        <span class="level-number">{{ String(index + 1).padStart(2, '0') }}</span>
        <strong>{{ level.name }}</strong
        ><small>{{ level.english }}</small>
        <span>{{ level.example }}</span>
      </li>
    </ol>
    <p class="biology-note">
      <KnowledgeText :text="organisationExplanation" />
    </p>
    <p class="biology-caution">
      <KnowledgeText
        text="沿箭头往右看，是把组成部分放进更大的整体：**箭头表示组成关系**，不是一个细胞先变成组织、再变成器官。组织可以含有不止一种细胞；单细胞生物只靠一个细胞生活，没有图中这套组织和器官层级。"
      />
    </p>
  </figure>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import CellStructureDiagram from './CellStructureDiagram.vue'
import MembraneTransportDiagram from './MembraneTransportDiagram.vue'
import KnowledgeText from './KnowledgeText.vue'
import type { KnowledgeSection } from '@/content/knowledge/types'
const props = defineProps<{ kind: NonNullable<KnowledgeSection['visual']> }>()
const organism = ref<'animal' | 'plant'>('animal')
const organismOptions = [
  { id: 'animal', label: '动物：循环系统' },
  { id: 'plant', label: '植物：地上部系统' },
] as const
// 切换知识点时将层级图恢复为默认实例。
watch(
  () => props.kind,
  () => {
    organism.value = 'animal'
  },
)
// 两条连续实例共用层级名称，强调细胞、组织、器官不是同一概念。
const organisationLevels = computed(() => {
  const examples =
    organism.value === 'animal'
      ? ['心肌细胞', '心肌组织', '心脏', '循环系统', '人体']
      : ['栅栏叶肉细胞', '栅栏叶肉组织', '叶', '地上部系统', '整株植物']
  return [
    { name: '细胞', english: 'cell' },
    { name: '组织', english: 'tissue' },
    { name: '器官', english: 'organ' },
    { name: '器官系统', english: 'organ system' },
    { name: '生物体', english: 'organism' },
  ].map((level, index) => ({ ...level, example: examples[index] }))
})
// 用完整实例解释“多种组织组成器官”，避免学生只机械背诵层级名称。
const organisationExplanation = computed(() =>
  organism.value === 'animal'
    ? '以人体为例，许多**心肌细胞**共同组成心肌组织。心脏还需要神经组织、结缔组织等一起工作，因此它属于==由多种组织构成的器官==。心脏与血管等组成循环系统，循环系统再与其他系统共同维持人体生命。'
    : '以植物为例，许多**栅栏叶肉细胞**组成栅栏叶肉组织。一片叶中还包含表皮、维管等组织，所以==叶是器官，不是单一组织==。叶、茎和芽等构成地上部系统，再与根系一起维持整株植物的生命。',
)
</script>
<style scoped>
.biology-visual {
  margin: 24px 0 0;
  padding: 20px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-lg);
  background: var(--color-learning-teal-soft);
  color: var(--color-ink-soft);
}
figcaption {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: var(--color-learning-teal);
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
}
.biology-label {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-learning-teal);
  color: var(--color-ink-inverse);
  font-size: var(--text-xs);
}
.biology-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.biology-visual :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-color: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-border: var(--color-learning-teal);
  --app-button-active-bg: var(--color-learning-teal-line);
  --app-button-active-border: var(--color-learning-teal);
}
.biology-visual :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-active-bg: var(--color-learning-teal);
}
.biology-visual :deep(.app-button.el-button:focus-visible) {
  outline-color: var(--color-learning-teal);
}
svg {
  display: block;
  width: 100%;
  max-width: 620px;
  margin: 20px auto 0;
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
svg text {
  font-family: var(--font-sans);
  text-anchor: middle;
  fill: var(--color-ink-soft);
}
.biology-note,
.osmosis-outcome p {
  margin: 10px 0 0;
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
.biology-caution {
  margin: 16px 0 0;
  padding-top: 12px;
  border-top: 1px solid var(--color-learning-teal-line);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}
.organisation-chain {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 20px;
  padding: 0;
  margin: 20px 0;
  list-style: none;
}
.organisation-chain li {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  text-align: center;
}
.organisation-chain li:not(:last-child)::after {
  position: absolute;
  right: -19px;
  top: 42%;
  content: '→';
  color: var(--color-learning-teal);
}
.level-number {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--color-learning-teal);
}
.organisation-chain strong {
  margin-top: 8px;
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
  color: var(--color-learning-teal);
}
.organisation-chain small {
  font-size: var(--text-xs);
}
.organisation-chain li > span:last-child {
  margin-top: 12px;
  font-size: var(--text-sm);
  color: var(--color-ink);
}

@media (max-width: 700px) {
  .biology-visual {
    padding: 14px;
  }
  .organisation-chain {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .organisation-chain li:not(:last-child)::after {
    right: auto;
    top: auto;
    bottom: -24px;
    left: 50%;
    content: '↓';
  }
}
</style>
