<!-- 酶概念方法：按每节机制插入静态能量图、催化循环、条件曲线和脂肪消化对照。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="酶的概念与方法">
    <template #diagram><EnzymeMethodDiagram :code="code" /></template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { enzymeMethods, type EnzymeMethodCode } from '@/content/knowledge/enzymeMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import EnzymeMethodDiagram from './EnzymeMethodDiagram.vue'

const props = defineProps<{ code: EnzymeMethodCode }>()
// 每个叶节点使用独立的内容组织，图示同步对应当前节的关键机制。
const lesson = computed(() => enzymeMethods[props.code])
</script>
