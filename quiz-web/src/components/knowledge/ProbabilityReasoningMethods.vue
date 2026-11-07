<!-- 概率后四节讲义入口：按节点组合方法正文与固定图示，保持例题和自测独立。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="概率概念与方法">
    <template #diagram><ProbabilityReasoningDiagram :code="code" /></template>
  </KnowledgeMethodsArticle>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import {
  probabilityReasoningMethods,
  type ProbabilityReasoningCode,
} from '@/content/knowledge/probabilityReasoningMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import ProbabilityReasoningDiagram from './ProbabilityReasoningDiagram.vue'
const props = defineProps<{ code: ProbabilityReasoningCode }>()
// 节点切换时使用本节方法和静态模型，避免混入上一节点的讲解。
const lesson = computed(() => probabilityReasoningMethods[props.code])
</script>
