<!-- 变异概念方法：数量与比例并排，双因素实验用同尺度折线直接比较。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="变异的概念与方法">
    <template #diagram>
      <div v-if="code === '150701'" class="variation-figures">
        <div class="variation-grid">
          <figure v-for="proportion in [false, true]" :key="String(proportion)">
            <figcaption>
              {{ proportion ? '占比：耐药型从 20% 升到 50%' : '数量：耐药型从 20 减到 10' }}
            </figcaption>
            <svg
              viewBox="0 0 380 224"
              role="img"
              :aria-label="
                proportion
                  ? '处理前耐药占20%，处理后占50%，两条总长度都表示100%'
                  : '处理前80个敏感菌20个耐药菌，处理后各存活10个，同一长度表示相同数量'
              "
            >
              <g
                v-for="(stage, i) in stages"
                :key="stage.label"
                :transform="`translate(0,${i * 84})`"
              >
                <text x="12" y="69">{{ stage.label }}</text>
                <rect
                  x="85"
                  y="48"
                  :width="
                    proportion ? (250 * stage.sensitive) / stage.total : stage.sensitive * 2.5
                  "
                  height="30"
                  rx="2"
                  fill="#d6dfe9"
                />
                <rect
                  :x="
                    85 +
                    (proportion ? (250 * stage.sensitive) / stage.total : stage.sensitive * 2.5)
                  "
                  y="48"
                  :width="
                    proportion ? (250 * stage.resistant) / stage.total : stage.resistant * 2.5
                  "
                  height="30"
                  rx="2"
                  fill="#087f76"
                />
                <text x="85" y="37" class="small">
                  {{
                    proportion
                      ? `敏感型 ${(stage.sensitive / stage.total) * 100}%`
                      : `敏感 ${stage.sensitive} ＋ 耐药 ${stage.resistant} ＝ 总数 ${stage.total}`
                  }}
                </text>
                <text
                  v-if="proportion"
                  :x="335 - (125 * stage.resistant) / stage.total"
                  y="69"
                  text-anchor="middle"
                  fill="white"
                >
                  {{ (stage.resistant / stage.total) * 100 }}%
                </text>
              </g>
              <path d="M85 180H335" stroke="#a7b3c4" />
              <g v-for="tick in [0, 50, 100]" :key="tick">
                <path :d="`M${85 + tick * 2.5} 180v5`" stroke="#a7b3c4" />
                <text :x="85 + tick * 2.5" y="203" text-anchor="middle" class="small">
                  {{ tick }}{{ proportion ? '%' : '' }}
                </text>
              </g>
              <text x="210" y="223" text-anchor="middle" class="small">
                {{ proportion ? '分母：各阶段的群体总数' : '同一长度表示相同数量' }}
              </text>
            </svg>
          </figure>
        </div>
        <p class="caption">
          教学模型：青绿为耐药型，灰色为敏感型；假设处理期间无繁殖、突变或基因转移。比例变化来自两类存活率不同。
        </p>
      </div>
      <figure v-else class="source-figure">
        <figcaption>两种遗传背景 × 两种营养条件</figcaption>
        <svg
          viewBox="0 0 400 264"
          role="img"
          aria-label="教学数据：品系A在低营养和充足营养下平均株高16和28厘米，品系B为20和40厘米"
        >
          <text x="30" y="20" class="small">平均株高 / cm</text>
          <g v-for="tick in [0, 10, 20, 30, 40]" :key="tick">
            <path :d="`M55 ${205 - tick * 4}H345`" stroke="#e0e7ef" />
            <text x="44" :y="210 - tick * 4" text-anchor="end" class="small">{{ tick }}</text>
          </g>
          <path d="M55 35V205H345" fill="none" stroke="#8797ab" />
          <path d="M90 141L310 93" fill="none" stroke="#2453cd" stroke-width="3" />
          <path
            d="M90 125L310 45"
            fill="none"
            stroke="#087f76"
            stroke-width="3"
            stroke-dasharray="7 4"
          />
          <g fill="#2453cd">
            <circle cx="90" cy="141" r="5" />
            <circle cx="310" cy="93" r="5" />
          </g>
          <g fill="#087f76">
            <rect x="85" y="120" width="10" height="10" />
            <rect x="305" y="40" width="10" height="10" />
          </g>
          <text x="90" y="164" text-anchor="middle">16</text>
          <text x="90" y="112" text-anchor="middle">20</text>
          <text x="321" y="99">28</text>
          <text x="321" y="49">40</text>
          <text x="90" y="229" text-anchor="middle">低营养</text>
          <text x="310" y="229" text-anchor="middle">营养充足</text>
          <text x="82" y="258" fill="#2453cd">● A 品系：增加 12 cm</text>
          <text x="245" y="258" fill="#087f76">■ B：增加 20 cm</text>
        </svg>
        <p class="caption">
          原创教学数据，非实测结论。各点代表重复培养的均值；年龄、光照等相同。连线用于比较响应，不能据此推断所有中间条件的精确株高。
        </p>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
import { variationMethods, type VariationMethodCode } from '@/content/knowledge/variationMethods'

const props = defineProps<{ code: VariationMethodCode }>()
// 随叶节点同步正文与图示，防止章节内切换后仍显示前一节内容。
const lesson = computed(() => variationMethods[props.code])
const stages = [
  { label: '处理前', sensitive: 80, resistant: 20, total: 100 },
  { label: '处理后', sensitive: 10, resistant: 10, total: 20 },
]
</script>

<style scoped lang="scss">
.variation-figures {
  container-type: inline-size;
  max-width: 960px;
}
.variation-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr);
}
figure {
  margin: 0;
  padding: 16px;
  border: 1px solid #c8e8df;
  border-radius: 10px;
  background: #fff;
  min-width: 0;
}
figcaption {
  color: #087f76;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.6;
}
svg {
  display: block;
  width: 100%;
  height: auto;
  max-width: 440px;
  margin: 10px auto 0;
}
svg text {
  font-size: 16px;
  font-family: inherit;
}
svg text:not([fill]) {
  fill: #344767;
}
svg .small {
  font-size: 14px;
}
.source-figure {
  max-width: 540px;
}
.caption {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: #64748b;
}
@container (min-width: 720px) {
  .variation-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
