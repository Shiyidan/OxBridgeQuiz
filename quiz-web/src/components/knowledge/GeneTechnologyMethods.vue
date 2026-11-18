<!-- 基因技术讲义：质粒连接与干细胞命运采用并排静态图，选择育种采用紧凑流程。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="基因技术的概念与方法">
    <template #diagram>
      <GeneTechnologyMechanism v-if="code === '150601'" kind="plasmid" />
      <GeneTechnologyMechanism v-else-if="code === '150602'" kind="stem" />
      <figure v-else class="breeding-process">
        <ol>
          <li><strong>选亲本</strong><span>按目标性状与遗传证据选择</span></li>
          <li><strong>繁殖</strong><span>产生仍有遗传差异的后代</span></li>
          <li><strong>评价并再选</strong><span>选出的后代作为下一代亲本</span></li>
        </ol>
        <figcaption>循环多代，观察群体性状变化；不是让同一个个体按目标不断“升级”。</figcaption>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  geneTechnologyMethods,
  type GeneTechnologyCode,
} from '@/content/knowledge/geneTechnologyMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import GeneTechnologyMechanism from './GeneTechnologyMechanism.vue'

const props = defineProps<{ code: GeneTechnologyCode }>()
// 根据当前考纲叶节点更新整份讲义，确保章节内切换后图文与摘要一致。
const lesson = computed(() => geneTechnologyMethods[props.code])
</script>

<style scoped lang="scss">
.breeding-process figcaption {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: #52627c;
}
.breeding-process {
  margin: 12px 0;
  ol {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 12px 24px;
    padding: 0;
    list-style-position: inside;
  }
  li {
    padding: 10px 12px;
    border-top: 2px solid #97cfc2;
    background: var(--color-learning-teal-soft, #edf9f5);
    font-size: 15px;
  }
  strong {
    color: #087f76;
  }
  span {
    display: block;
    margin-top: 4px;
  }
}
</style>
