<!-- 数学思维讲解：将关键观察、互动图像和分步推理编排在同一阅读流。 -->
<template>
  <section class="concept-flow" aria-label="概念与推理">
    <div class="concept-flow__opening">
      <div class="concept-flow__narrative">
        <div class="concept-flow__lead">
          <span class="concept-flow__eyebrow">{{ flow.eyebrow }}</span>
          <h5>{{ flow.title }}</h5>
          <p><KnowledgeText :text="flow.lead" /></p>
        </div>
        <dl class="concept-flow__observations">
          <div v-for="item in flow.observations" :key="item.title">
            <dt>{{ item.title }}</dt>
            <dd><KnowledgeText :text="item.text" /></dd>
          </div>
        </dl>
        <p class="concept-flow__visual-prompt"><KnowledgeText :text="flow.visualPrompt" /></p>
      </div>
      <div class="concept-flow__visual">
        <KnowledgeVisual :kind="visual" :topic="topic" />
      </div>
      <div class="concept-flow__visual-steps">
        <section v-for="step in visualSteps" :key="step.label" class="concept-flow__first-step">
          <span class="concept-flow__step-label">{{ step.label }}</span>
          <h6>{{ step.title }}</h6>
          <p v-for="paragraph in step.paragraphs" :key="paragraph">
            <KnowledgeText :text="paragraph" />
          </p>
          <p class="concept-flow__takeaway"><KnowledgeText :text="step.takeaway" /></p>
        </section>
      </div>
    </div>

    <div class="concept-flow__next-steps">
      <section v-for="step in remainingSteps" :key="step.label" class="concept-flow__step">
        <span class="concept-flow__step-label">{{ step.label }}</span>
        <h6>{{ step.title }}</h6>
        <p v-for="paragraph in step.paragraphs" :key="paragraph">
          <KnowledgeText :text="paragraph" />
        </p>
        <p class="concept-flow__takeaway"><KnowledgeText :text="step.takeaway" /></p>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KnowledgeSection } from '@/content/knowledge/types'
import KnowledgeText from './KnowledgeText.vue'
import KnowledgeVisual from './KnowledgeVisual.vue'

const props = defineProps<{
  flow: NonNullable<KnowledgeSection['conceptFlow']>
  visual: NonNullable<KnowledgeSection['visual']>
  topic: string
}>()

// 前两步紧邻图解，学生调整参数时可直接对照对应的数学解释。
const visualSteps = computed(() => props.flow.steps.slice(0, 2))
// 剩余应用按阅读顺序延续，窄屏自动换行而不制造空列。
const remainingSteps = computed(() => props.flow.steps.slice(2))
</script>

<style scoped>
.concept-flow {
  min-width: 0;
  color: var(--color-ink);
}
.concept-flow__opening {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(350px, 1.05fr);
  grid-template-areas: 'intro visual' 'steps visual';
  gap: 8px 28px;
  align-items: start;
}
.concept-flow__narrative,
.concept-flow__visual,
.concept-flow__visual-steps {
  min-width: 0;
}
.concept-flow__narrative {
  grid-area: intro;
}
.concept-flow__visual {
  grid-area: visual;
}
.concept-flow__visual-steps {
  grid-area: steps;
}
.concept-flow__lead {
  padding: 2px 0 16px;
  border-bottom: 1px solid var(--color-learning-blue-line);
}
.concept-flow__eyebrow,
.concept-flow__step-label {
  color: var(--color-learning-blue);
  font-size: 12px;
  font-weight: var(--weight-semi);
  letter-spacing: 0.04em;
}
.concept-flow h5,
.concept-flow h6 {
  margin: 6px 0 8px;
  color: var(--color-ink);
  line-height: 1.5;
}
.concept-flow h5 {
  font-size: 20px;
}
.concept-flow h6 {
  font-size: 16px;
}
.concept-flow p {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.85;
  overflow-wrap: anywhere;
}
.concept-flow__observations {
  margin: 2px 0 16px;
}
.concept-flow__observations > div {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}
.concept-flow__observations dt {
  color: var(--color-ink-soft);
  font-size: 13px;
  font-weight: var(--weight-semi);
}
.concept-flow__observations dd {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}
.concept-flow__first-step {
  padding-top: 10px;
}
.concept-flow__visual-prompt {
  margin-top: 16px !important;
  color: var(--color-learning-blue);
  font-weight: var(--weight-semi);
}
.concept-flow__next-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-learning-blue-line);
}
.concept-flow__step {
  flex: 1 1 260px;
  min-width: 0;
}
.concept-flow__takeaway {
  padding-left: 10px;
  border-left: 2px solid var(--color-learning-blue);
}
@media (max-width: 900px) {
  .concept-flow__opening {
    grid-template-columns: minmax(0, 1fr);
    /* DOM 顺序与视觉阅读顺序一致，键盘和读屏均先遇到图解再进入推理。 */
    grid-template-areas: 'intro' 'visual' 'steps';
    gap: 18px;
  }
  .concept-flow__next-steps {
    gap: 16px;
    margin-top: 18px;
  }
}
@media (max-width: 600px) {
  .concept-flow h5 {
    font-size: 18px;
  }
  .concept-flow__observations > div {
    grid-template-columns: 70px minmax(0, 1fr);
    gap: 8px;
  }
}
</style>
