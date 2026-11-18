<!-- 周期表讲义：仅区域定位提供简图，其余内容用关系表与短推导呈现。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="元素周期表：概念与方法">
    <template #diagram>
      <figure class="periodic-regions" aria-label="周期表区域简图">
        <div class="periodic-regions__map">
          <div class="periodic-regions__left">
            <span class="periodic-regions__heading">左侧 · 第 1、2 族</span>
            <div class="periodic-regions__nonmetal periodic-regions__hydrogen">H：非金属</div>
            <div class="periodic-regions__metal">
              <strong>金属</strong><span>第 1 族：Li、Na、K…</span><span>第 2 族：Be、Mg、Ca…</span>
            </div>
          </div>
          <div class="periodic-regions__centre">
            <span class="periodic-regions__heading">中央</span>
            <div class="periodic-regions__metal periodic-regions__transition">
              <strong>过渡金属区域</strong><span>如 Fe、Cu</span><span>从第 4 周期开始出现</span>
            </div>
          </div>
          <div class="periodic-regions__right">
            <span class="periodic-regions__heading">右侧 · 第 13—18 族</span>
            <div class="periodic-regions__nonmetal">
              <strong>右上部：主要是非金属</strong><span>第 17 族卤素 · 第 18 族稀有气体</span>
            </div>
            <div class="periodic-regions__boundary">分界附近：B、Si 等类金属</div>
            <div class="periodic-regions__metal">左下部仍有金属，如 Al、Sn</div>
          </div>
        </div>
        <figcaption>
          区域示意，不代表每个元素的精确格子。H 是左侧的例外，右侧也并非全是非金属。
        </figcaption>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  periodicTableMethods,
  type PeriodicTableMethodCode,
} from '@/content/knowledge/periodicTableMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: PeriodicTableMethodCode }>()
// 每个考纲节点对应独立的正文与摘要，基础节不重复挂载区域图。
const lesson = computed(() => periodicTableMethods[props.code])
</script>

<style scoped>
.periodic-regions {
  margin: 12px auto;
  max-width: 900px;
  container-type: inline-size;
  font-size: 14px;
}
.periodic-regions__map {
  display: grid;
  grid-template-columns: 1fr 1fr 1.4fr;
  align-items: end;
  gap: 12px;
}
.periodic-regions__map > div {
  display: grid;
  gap: 7px;
  min-width: 0;
}
.periodic-regions__heading {
  color: #52627c;
  font-weight: 600;
}
.periodic-regions__metal,
.periodic-regions__nonmetal,
.periodic-regions__boundary {
  display: grid;
  padding: 10px 12px;
  border: 1px solid;
  border-radius: 6px;
  line-height: 1.7;
}
.periodic-regions__metal {
  background: #eef3ff;
  border-color: #c4d3f5;
  color: #284575;
}
.periodic-regions__nonmetal {
  background: #edf8f5;
  border-color: #b4ded5;
  color: #126e64;
}
.periodic-regions__boundary {
  background: #faf5e9;
  border-color: #e9d7a9;
  color: #775d24;
}
.periodic-regions__hydrogen {
  justify-self: start;
  padding: 5px 12px;
}
.periodic-regions__transition {
  min-height: 92px;
  align-content: center;
}
.periodic-regions figcaption {
  margin-top: 9px;
  color: #64748b;
  line-height: 1.65;
}
@container (max-width: 640px) {
  .periodic-regions__map {
    grid-template-columns: 1fr;
  }
  .periodic-regions__transition {
    min-height: 0;
  }
}
</style>
