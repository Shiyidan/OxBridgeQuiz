<!-- 统计四节讲义入口：共用正文排版，保留统计图解与各节独立内容。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="统计概念与方法">
    <template #diagram>
      <StatisticsLearningDiagram :topic="code" compact />
    </template>
  </KnowledgeMethodsArticle>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { statisticsMethods, type StatisticsMethodCode } from '@/content/knowledge/statisticsMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import StatisticsLearningDiagram from './StatisticsLearningDiagram.vue'
const props = defineProps<{ code: StatisticsMethodCode }>()
// 章级目录与叶节点都由当前考纲 code 选择同一份统计讲义。
const lesson = computed(() => statisticsMethods[props.code])
</script>
