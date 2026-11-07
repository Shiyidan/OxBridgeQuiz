<!-- 代数变形四节讲义：按结构与成立条件组织公式、短推导及对照表。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="代数概念与方法" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import {
  algebraManipulationMethods,
  type AlgebraManipulationCode,
} from '@/content/knowledge/algebraManipulationMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
const props = defineProps<{ code: AlgebraManipulationCode }>()
// 节点切换使用对应方法，不把因式分解、分式限制和证明任务混成通用导读。
const lesson = computed(() => algebraManipulationMethods[props.code])
</script>
