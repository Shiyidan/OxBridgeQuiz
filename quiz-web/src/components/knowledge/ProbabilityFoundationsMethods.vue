<!-- 概率前三节讲义入口：复用统计正文风格，使用独立、静态的紧凑示意。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="概率概念与方法">
    <template #diagram>
      <ProbabilityFoundationsDiagram :code="code" />
    </template>
  </KnowledgeMethodsArticle>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import {
  probabilityFoundationsMethods,
  type ProbabilityFoundationCode,
} from '@/content/knowledge/probabilityFoundationsMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import ProbabilityFoundationsDiagram from './ProbabilityFoundationsDiagram.vue'
const props = defineProps<{ code: ProbabilityFoundationCode }>()
// 切换概率叶节点时同步正文与图示，不沿用上一节摘要或速记。
const lesson = computed(() => probabilityFoundationsMethods[props.code])
</script>
