<!-- 生态系统概念页：三节独立正文，关系图、循环图和调查图与对应方法就近展示。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="生态系统的概念与方法">
    <template #diagram="{ block }">
      <EcosystemMethodDiagram :kind="ecosystemDiagramKinds[block.title]!" />
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ecosystemMethods,
  ecosystemDiagramKinds,
  type EcosystemMethodCode,
} from '@/content/knowledge/ecosystemMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import EcosystemMethodDiagram from './EcosystemMethodDiagram.vue'

const props = defineProps<{ code: EcosystemMethodCode }>()
// 当前叶节点同时决定正文、速记来源和该节插图，避免切换后保留上一节内容。
const lesson = computed(() => ecosystemMethods[props.code])
</script>
