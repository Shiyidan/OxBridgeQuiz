<!-- 代数前四节概念与方法：复用紧凑讲义，只有分配律需要静态面积示意。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="代数概念与方法">
    <template #diagram><AlgebraExpansionDiagram /></template>
  </KnowledgeMethodsArticle>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import {
  algebraFoundationsMethods,
  type AlgebraFoundationCode,
} from '@/content/knowledge/algebraFoundationsMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import AlgebraExpansionDiagram from './AlgebraExpansionDiagram.vue'
const props = defineProps<{ code: AlgebraFoundationCode }>()
// 每个叶节点使用自己的正文、摘要和速记，基础术语不套用复杂方法模板。
const lesson = computed(() => algebraFoundationsMethods[props.code])
</script>
