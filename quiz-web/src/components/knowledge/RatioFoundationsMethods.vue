<!-- 比与比例四节讲义：复用方法正文，仅在按比分配处显示紧凑份数对照。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="比与比例的概念与方法">
    <template #diagram>
      <figure class="ratio-shares" aria-label="A为3份，B为5份，合计8份，相差2份">
        <div class="ratio-shares__row">
          <strong>A</strong>
          <div class="ratio-shares__track"><span class="ratio-shares__a">3 份</span></div>
        </div>
        <div class="ratio-shares__row">
          <strong>B</strong>
          <div class="ratio-shares__track"><span class="ratio-shares__b">5 份</span></div>
        </div>
        <figcaption>总量对应 8 份；差值只对应多出的 2 份。</figcaption>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ratioFoundationsMethods, type RatioFoundationCode } from '@/content/knowledge/ratioFoundationsMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: RatioFoundationCode }>()
// 按当前考纲叶节点选择正文，章节内切换时同步更新摘要对应的方法内容。
const lesson = computed(() => ratioFoundationsMethods[props.code])
</script>

<style scoped lang="scss">
.ratio-shares {
  max-width: 480px;
  margin: 14px 0;
  font-size: 15px;
  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 0;
    strong { width: 16px; }
  }
  &__track { flex: 1; min-width: 0; }
  &__a, &__b {
    display: block;
    padding: 3px 0;
    text-align: center;
    border-radius: 4px;
  }
  &__a { width: 60%; background: #e8efff; color: #244dc1; }
  &__b { width: 100%; background: #e5f5f1; color: #08766c; }
  figcaption { margin-top: 10px; }
}
</style>
