<!-- 原核细胞概念与方法：结构识图、两类 DNA 对照及功能与分类的推理。 -->
<template>
  <article class="bio-methods" aria-label="原核细胞结构与功能：概念与方法">
    <p class="bio-methods__intro"><KnowledgeText :text="content.intro" /></p>
    <section aria-labelledby="prokaryotic-structures-title">
      <h3 id="prokaryotic-structures-title"><span>01</span>细菌结构：先分清各自的工作</h3>
      <div class="bio-methods__split">
        <div>
          <dl class="bio-methods__facts">
            <div v-for="structure in content.structures" :key="structure.name">
              <dt>
                {{ structure.name }}<small>{{ structure.english }}</small>
              </dt>
              <dd>{{ structure.role }}</dd>
            </div>
          </dl>
          <p class="bio-methods__note">
            <KnowledgeText
              text="**鞭毛**可帮助运动，**荚膜**可提供保护；它们与质粒一样，都不是所有细菌必有。没有这些附加结构，并不会改变细菌的原核身份。"
            />
          </p>
        </div>
        <CellStructureDiagram kind="prokaryotic-cell" compact />
      </div>
    </section>
    <section aria-labelledby="prokaryotic-dna-title">
      <h3 id="prokaryotic-dna-title"><span>02</span>环状 DNA，不一定就是质粒</h3>
      <p>
        典型细菌的主要染色体与质粒都可呈环状。识别时，要看它与主要染色体的关系和承担的遗传作用。
      </p>
      <table class="bio-methods__table">
        <thead>
          <tr>
            <th scope="col">比较依据</th>
            <th scope="col">主要染色体 DNA</th>
            <th scope="col">质粒 DNA</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in content.dnaComparison" :key="row[0]">
            <th scope="row">{{ row[0] }}</th>
            <td>{{ row[1] }}</td>
            <td>{{ row[2] }}</td>
          </tr>
        </tbody>
      </table>
      <p>
        <KnowledgeText
          text="==有质粒不能直接推出耐受某种抗生素==，还要知道质粒携带什么基因；没有质粒也不能排除抗性，因为相关基因可能位于染色体上。"
        />
      </p>
    </section>
    <section aria-labelledby="prokaryotic-reasoning-title">
      <h3 id="prokaryotic-reasoning-title"><span>03</span>缺少一种结构，不等于缺少相应功能</h3>
      <div v-for="point in content.reasoning" :key="point.title" class="bio-methods__point">
        <h4>{{ point.title }}</h4>
        <p><KnowledgeText :text="point.text" /></p>
      </div>
    </section>
  </article>
</template>
<script setup lang="ts">
import { prokaryoticCellMethods as content } from '@/content/knowledge/prokaryoticCellMethods'
import CellStructureDiagram from './CellStructureDiagram.vue'
import KnowledgeText from './KnowledgeText.vue'
</script>
<style scoped lang="scss">
@use './biologyMethods';
</style>
