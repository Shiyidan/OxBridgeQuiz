<!-- 动物生理概念页：各节独立组织内容，将机制图放在对应通路或判断方法旁。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="动物生理的概念与方法">
    <template #diagram="{ block }">
      <AnimalPhysiologyMethodDiagram :kind="animalPhysiologyDiagramKinds[block.title]!" />
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  animalPhysiologyMethods,
  animalPhysiologyDiagramKinds,
  type AnimalPhysiologyMethodCode,
} from '@/content/knowledge/animalPhysiologyMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import AnimalPhysiologyMethodDiagram from './AnimalPhysiologyMethodDiagram.vue'

const props = defineProps<{ code: AnimalPhysiologyMethodCode }>()
// 叶节点切换时同步正文与图示；器官系统按各通路分别插图，不共用切换面板。
const lesson = computed(() => animalPhysiologyMethods[props.code])
</script>
