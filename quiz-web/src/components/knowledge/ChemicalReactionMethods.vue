<!-- 反应、式与方程讲义：仅动态平衡使用并排读图，符号与配平沿用紧凑正文。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="反应、式与方程：概念与方法">
    <template #diagram>
      <div class="equilibrium-comparison">
        <div class="equilibrium-comparison__plots">
          <figure v-for="plot in plots" :key="plot.key">
            <h4>{{ plot.title }}</h4>
            <svg viewBox="0 0 400 225" role="img" :aria-labelledby="`${uid}-${plot.key}`">
              <title :id="`${uid}-${plot.key}`">{{ plot.description }}</title>
              <rect x="288" y="42" width="76" height="140" fill="#e9f4ef" />
              <path d="M48 40V182H370" fill="none" stroke="#7b8ca6" stroke-width="1.5" />
              <text x="14" y="25">{{ plot.axis }}</text>
              <text x="318" y="207">时间</text>
              <text x="35" y="188" text-anchor="end">0</text>
              <text x="326" y="61" text-anchor="middle" class="equilibrium-comparison__annotation">
                平衡
              </text>
              <path :d="plot.first" fill="none" stroke="#2453cd" stroke-width="3" />
              <path
                :d="plot.second"
                fill="none"
                stroke="#087f76"
                stroke-width="3"
                stroke-dasharray="7 4"
              />
            </svg>
            <div class="equilibrium-comparison__legend">
              <span><i class="equilibrium-comparison__blue" />{{ plot.firstLabel }}</span>
              <span><i class="equilibrium-comparison__green" />{{ plot.secondLabel }}</span>
            </div>
            <figcaption>{{ plot.caption }}</figcaption>
          </figure>
        </div>
        <p class="equilibrium-comparison__note">
          A ⇌ B，起初只有 A；定性示意，尾段表示平衡后的稳定读数，不是实验测量数据。
        </p>
      </div>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  chemicalReactionMethods,
  type ChemicalReactionMethodCode,
} from '@/content/knowledge/chemicalReactionMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: ChemicalReactionMethodCode }>()
// 正文、摘要及速记按同一考纲节点取值，避免旧版导读与新版内容叠加。
const lesson = computed(() => chemicalReactionMethods[props.code])
const uid = `reaction-method-${useId()}`
const plots = [
  {
    key: 'concentration',
    title: '浓度：各自稳定，数值不必相等',
    description: 'A 的浓度下降，B 从零上升；达到平衡后两条浓度曲线保持水平，但高度不同。',
    axis: '浓度',
    first: 'M48 52C100 88 155 104 288 104H364',
    second: 'M48 182C100 146 155 130 288 130H364',
    firstLabel: 'A 的浓度',
    secondLabel: 'B 的浓度',
    caption: 'A 仍有剩余；水平表示浓度不再变化，不表示 A 与 B 一样多。',
  },
  {
    key: 'rate',
    title: '速率：大小相等，反应仍在进行',
    description: '正反应速率下降，逆反应速率从零上升；平衡时两条曲线在大于零的位置重合。',
    axis: '反应速率',
    first: 'M48 52C100 88 155 104 288 104H364',
    second: 'M48 182C100 128 155 104 288 104H364',
    firstLabel: '正反应速率',
    secondLabel: '逆反应速率',
    caption: '平衡处两条线重合且高于零：两个方向都在反应，净变化为零。',
  },
]
</script>

<style scoped>
.equilibrium-comparison {
  container-type: inline-size;
  max-width: 960px;
  margin: 14px auto;
}
.equilibrium-comparison__plots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.equilibrium-comparison figure {
  min-width: 0;
  margin: 0;
  padding: 14px;
  border: 1px solid #d8e3f5;
  border-radius: 9px;
  background: #f6f9ff;
}
.equilibrium-comparison h4 {
  margin: 0 0 8px;
  color: #233d64;
  font-size: 16px;
  line-height: 1.6;
}
.equilibrium-comparison svg {
  display: block;
  width: 100%;
  height: auto;
}
.equilibrium-comparison svg text {
  font-family: var(--font-sans);
  font-size: 17px;
  fill: #52627c;
}
.equilibrium-comparison svg .equilibrium-comparison__annotation {
  fill: #237465;
}
.equilibrium-comparison__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  font-size: 14px;
}
.equilibrium-comparison__legend span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.equilibrium-comparison__legend i {
  width: 22px;
  border-top: 3px solid #2453cd;
}
.equilibrium-comparison__legend .equilibrium-comparison__green {
  border-top: 3px dashed #087f76;
}
.equilibrium-comparison figcaption,
.equilibrium-comparison__note {
  margin: 9px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: #52627c;
}
@container (max-width: 680px) {
  .equilibrium-comparison__plots {
    grid-template-columns: 1fr;
  }
  .equilibrium-comparison figure {
    max-width: 460px;
    justify-self: center;
    padding: 12px;
  }
}
</style>
