<!-- 植物生理概念页：各节按结构、条件和测量量组织，图解紧邻对应方法。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="植物生理的概念与方法">
    <template #diagram="{ block }">
      <PlantPhysiologyMethodDiagram :kind="plantPhysiologyDiagramKinds[block.title]!" />
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  plantPhysiologyMethods,
  plantPhysiologyDiagramKinds,
  type PlantPhysiologyMethodCode,
} from '@/content/knowledge/plantPhysiologyMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import PlantPhysiologyMethodDiagram from './PlantPhysiologyMethodDiagram.vue'

const props = defineProps<{ code: PlantPhysiologyMethodCode }>()
// 章节切换时同步正文与图示，不保留旧图谱的切换状态。
const lesson = computed(() => plantPhysiologyMethods[props.code])
</script>
