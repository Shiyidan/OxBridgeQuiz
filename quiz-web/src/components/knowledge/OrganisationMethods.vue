<!-- 生物体层级概念与方法：将简短定义嵌入层级图，重点解释组成证据与常见混淆。 -->
<template>
  <article class="bio-methods" aria-label="生物体层级：概念与方法">
    <p class="bio-methods__intro"><KnowledgeText :text="content.intro" /></p>
    <section aria-labelledby="organisation-levels-title">
      <h3 id="organisation-levels-title"><span>01</span>从组成部分到完整个体</h3>
      <dl class="organisation-definitions">
        <div v-for="level in content.levels" :key="level.name">
          <dt>
            {{ level.name }} <small>{{ level.english }}</small>
          </dt>
          <dd>{{ level.definition }}</dd>
        </div>
      </dl>
      <div class="organisation-examples">
        <figure v-for="example in examples" :key="example.title">
          <figcaption>{{ example.title }}</figcaption>
          <ol>
            <li v-for="(item, index) in example.items" :key="item">
              <span>{{ content.levels[index]?.name }}</span
              ><strong>{{ item }}</strong>
            </li>
          </ol>
        </figure>
      </div>
      <p class="organisation-caption">箭头表示组成关系，不是一个细胞依次变成组织、器官和系统。</p>
    </section>
    <section aria-labelledby="organisation-evidence-title">
      <h3 id="organisation-evidence-title"><span>02</span>三个容易混淆的判断</h3>
      <div v-for="point in content.reasoning" :key="point.title" class="bio-methods__point">
        <h4>{{ point.title }}</h4>
        <p><KnowledgeText :text="point.text" /></p>
      </div>
    </section>
  </article>
</template>
<script setup lang="ts">
import { organisationMethods as content } from '@/content/knowledge/organisationMethods'
import KnowledgeText from './KnowledgeText.vue'
const examples = [
  { title: '动物 · 循环系统', items: ['心肌细胞', '心肌组织', '心脏', '循环系统', '人体'] },
  {
    title: '植物 · 地上部系统',
    items: ['栅栏叶肉细胞', '栅栏叶肉组织', '叶', '地上部系统', '整株植物'],
  },
]
</script>
<style scoped lang="scss">
@use './biologyMethods';
.bio-methods {
  container-type: inline-size;
}
.organisation-definitions {
  margin: 0 0 20px;
}
.organisation-definitions > div {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-line);
}
.organisation-definitions dt {
  font-weight: 600;
}
.organisation-definitions small {
  font-weight: 400;
  color: var(--color-ink-soft);
}
.organisation-definitions dd {
  margin: 0;
  color: var(--color-ink-soft);
}
.organisation-examples {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  max-width: 900px;
}
.organisation-examples figure {
  margin: 0;
  padding: 16px 20px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: 10px;
}
.organisation-examples figcaption {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-learning-teal);
}
.organisation-examples ol {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
}
.organisation-examples li {
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
}
.organisation-examples li + li::before {
  content: '↓';
  position: absolute;
  right: 24px;
  top: -10px;
  color: var(--color-learning-teal);
}
.organisation-examples li span {
  color: var(--color-ink-soft);
  font-size: 14px;
}
.bio-methods .organisation-caption {
  font-size: 14px;
}
@container (min-width: 680px) {
  .organisation-examples {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@container (max-width: 480px) {
  .organisation-definitions > div {
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
  }
}
</style>
