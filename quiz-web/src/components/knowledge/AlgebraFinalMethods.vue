<!-- 代数最后三节讲义：不等式配数轴与半平面，数列用项号及差分表解释规则。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="不等式与数列概念与方法">
    <template #diagram="{ block }">
      <AlgebraInequalityDiagram
        v-if="code === '110417'"
        :kind="block === lesson.blocks[1] ? 'interval' : 'region'"
      />
    </template>
  </KnowledgeMethodsArticle>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { algebraFinalMethods, type AlgebraFinalCode } from '@/content/knowledge/algebraFinalMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import AlgebraInequalityDiagram from './AlgebraInequalityDiagram.vue'
const props = defineProps<{ code: AlgebraFinalCode }>()
// 三节分别读取自己的摘要、方法和速记；图示插槽按当前方法块选择。
const lesson = computed(() => algebraFinalMethods[props.code])
</script>
