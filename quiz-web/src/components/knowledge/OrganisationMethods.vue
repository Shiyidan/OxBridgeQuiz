<!-- 生物体层级概念与方法：将简短定义嵌入层级图，重点解释组成证据与常见混淆。 -->
<template>
  <article class="bio-methods" aria-label="生物体层级：概念与方法">
    <p class="bio-methods__intro"><KnowledgeText :text="content.intro" /></p>
    <section aria-labelledby="organisation-levels-title">
      <h3 id="organisation-levels-title"><span>01</span>从组成部分到完整个体</h3>
      <BiologyKnowledgeVisual kind="organisation" compact />
    </section>
    <section aria-labelledby="organisation-evidence-title">
      <h3 id="organisation-evidence-title"><span>02</span>看组成，而不是只看功能</h3>
      <div v-for="point in content.reasoning" :key="point.title" class="bio-methods__point">
        <h4>{{ point.title }}</h4>
        <p><KnowledgeText :text="point.text" /></p>
      </div>
      <p class="bio-methods__note">
        <KnowledgeText
          text="**大小与位置本身不决定层级**。放大照片不会改变对象的层级；完整器官离开生物体，也不会仅因离体就变成组织。"
        />
      </p>
    </section>
    <section aria-labelledby="organisation-boundaries-title">
      <h3 id="organisation-boundaries-title"><span>03</span>分清细胞器、器官与生物体</h3>
      <div v-for="point in content.boundaries" :key="point.title" class="bio-methods__point">
        <h4>{{ point.title }}</h4>
        <p><KnowledgeText :text="point.text" /></p>
      </div>
    </section>
  </article>
</template>
<script setup lang="ts">
import { organisationMethods as content } from '@/content/knowledge/organisationMethods'
import BiologyKnowledgeVisual from './BiologyKnowledgeVisual.vue'
import KnowledgeText from './KnowledgeText.vue'
</script>
<style scoped lang="scss">
@use './biologyMethods';
</style>
