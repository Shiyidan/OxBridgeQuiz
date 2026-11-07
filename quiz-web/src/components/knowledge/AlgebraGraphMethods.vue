<!-- 代数第九至十二节概念与方法：按坐标、直线、二次图像和函数家族独立接入。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="坐标与函数概念与方法">
    <template #diagram><AlgebraGraphsDiagram :code="code" /></template>
  </KnowledgeMethodsArticle>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { algebraGraphMethods, type AlgebraGraphCode } from '@/content/knowledge/algebraGraphMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import AlgebraGraphsDiagram from './AlgebraGraphsDiagram.vue'
const props = defineProps<{ code: AlgebraGraphCode }>()
// 摘要与正文按当前节点读取同一份讲义，父节点阅读与叶节点入口保持一致。
const lesson = computed(() => algebraGraphMethods[props.code])
</script>
