<!-- 坐标与函数图解：单图与说明就近并排，函数家族以自然高度的小图对照。 -->
<template>
  <div class="algebra-diagrams" :class="{ 'algebra-diagrams--gallery': code === '110412' }">
    <figure v-for="model in models" :key="model.title" class="algebra-diagram">
      <figcaption>
        <h4>{{ model.title }}</h4>
        <div v-if="model.curves.length" class="algebra-diagram__legend">
          <span v-for="curve in model.curves" :key="curve.label">
            <svg width="25" height="10" viewBox="0 0 25 10" aria-hidden="true">
              <line
                x1="0"
                y1="5"
                x2="25"
                y2="5"
                :stroke="curve.color"
                :stroke-dasharray="curve.dash"
                stroke-width="2.5"
              />
            </svg>
            <KnowledgeText :text="curve.label" />
          </span>
        </div>
      </figcaption>
      <div class="algebra-diagram__body">
        <AlgebraGraphPlot :model="model" />
        <div class="algebra-diagram__notes">
          <p v-for="note in model.notes" :key="note"><KnowledgeText :text="note" /></p>
        </div>
      </div>
    </figure>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { AlgebraGraphCode } from '@/content/knowledge/algebraGraphMethods'
import { algebraGraphModels } from '@/content/knowledge/algebraGraphModels'
import AlgebraGraphPlot from './AlgebraGraphPlot.vue'
import KnowledgeText from './KnowledgeText.vue'
const props = defineProps<{ code: AlgebraGraphCode }>()
// 每节使用对应的静态模型，避免无关图示和切换状态留到下一节点。
const models = computed(() => algebraGraphModels[props.code])
</script>
<style scoped lang="scss">
.algebra-diagrams {
  container-type: inline-size;
  min-width: 0;
}
.algebra-diagram {
  margin: 0;
  min-width: 0;
  padding: 18px 20px;
  border: 1px solid #dce6f8;
  border-radius: 12px;
  background: #f6f9ff;
}
.algebra-diagram h4 {
  margin: 0 0 8px;
  color: #193e67;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.5;
}
.algebra-diagram__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 14px;
  line-height: 1.5;
}
.algebra-diagram__legend > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.algebra-diagram__legend svg {
  flex: none;
}
.algebra-diagram__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 8px 24px;
}
.algebra-diagram__notes {
  min-width: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #415976;
}
.algebra-diagram__notes p {
  margin: 8px 0;
}
.algebra-diagrams--gallery {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr);
}
.algebra-diagrams--gallery .algebra-diagram {
  background: #fbfcff;
}
@container (min-width:760px) {
  .algebra-diagram__body {
    grid-template-columns: minmax(0, 440px) minmax(0, 1fr);
  }
}
/* 图集按可用正文宽度排布，保证最窄的小图仍能读清刻度，不压缩高度。 */
.algebra-diagrams--gallery {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 350px), 1fr));
}
.algebra-diagrams--gallery .algebra-diagram__body {
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
}
</style>
