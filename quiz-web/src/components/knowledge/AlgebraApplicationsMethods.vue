<!-- 代数第十三至十六节讲义：图像情境配紧凑图解，方程方法使用短推导与选法对照。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="实际图像与方程概念与方法">
    <template #diagram>
      <AlgebraApplicationDiagram v-if="code === '110413' || code === '110414'" :code="code" />
    </template>
  </KnowledgeMethodsArticle>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import {
  algebraApplicationsMethods,
  type AlgebraApplicationsCode,
} from '@/content/knowledge/algebraApplicationsMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import AlgebraApplicationDiagram from './AlgebraApplicationDiagram.vue'
const props = defineProps<{ code: AlgebraApplicationsCode }>()
// 正文使用对应节点的独立讲义，摘要与速记由相同数据接入学习面板。
const lesson = computed(() => algebraApplicationsMethods[props.code])
</script>
