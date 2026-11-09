<!-- 数学1数的前八节概念与方法：紧凑算式与对照表替代基础运算的大幅交互图。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="数的概念与方法" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  numberFoundationsMethods,
  type NumberFoundationCode,
} from '@/content/knowledge/numberFoundationsMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: NumberFoundationCode }>()
// 按叶节点选择对应讲义，父章节内切节和直接进入叶节点使用同一内容。
const lesson = computed(() => numberFoundationsMethods[props.code])
</script>
