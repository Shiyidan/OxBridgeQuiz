<!-- 基于氧的氧化与还原：用方程与简表呈现，不为基础定义重复配图。 -->
<template>
  <KnowledgeMethodsArticle :lesson="oxygenRedoxMethods" label="基于氧的氧化与还原：概念与方法" />
</template>

<script setup lang="ts">
import { oxygenRedoxMethods } from '@/content/knowledge/oxygenRedoxMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
</script>
