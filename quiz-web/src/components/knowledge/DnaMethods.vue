<!-- DNA 概念方法：紧凑结构图与静态双栏过程对照，窄容器恢复单列阅读。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="DNA 的概念与方法">
    <template #diagram>
      <figure v-if="code === '150502'" class="dna-structure">
        <svg viewBox="0 0 440 238" role="img" aria-labelledby="dnaStructureTitle">
          <title :id="dnaStructureTitle">
            DNA 展开示意：反向平行的糖磷酸骨架之间，A 与 T、G 与 C 互补配对
          </title>
          <g fill="none" stroke="#5167a7" stroke-width="2">
            <path d="M130 40V194 M310 40V194" />
          </g>
          <g v-for="pair in basePairs" :key="pair.left" :transform="`translate(0 ${pair.y})`">
            <path
              d="M130-14L144-4L139 13H121L116-4Z M310-14L324-4L319 13H301L296-4Z"
              fill="#e9e6fa"
              stroke="#6c4bbe"
              stroke-width="1.5"
            />
            <path d="M144 0H171 M269 0H296" stroke="#5167a7" stroke-width="2" />
            <rect x="171" y="-17" width="35" height="34" rx="5" fill="#e8efff" stroke="#2453cd" />
            <rect x="234" y="-17" width="35" height="34" rx="5" fill="#e3f4ef" stroke="#008578" />
            <g fill="#203c65" font-size="19" font-weight="700" text-anchor="middle">
              <text x="189" y="7">{{ pair.left }}</text>
              <text x="251" y="7">{{ pair.right }}</text>
            </g>
            <path
              :d="pair.bonds"
              fill="none"
              stroke="#aa782d"
              stroke-width="1.5"
              stroke-dasharray="3 3"
            />
          </g>
          <g fill="#fff3dc" stroke="#aa782d" stroke-width="1.5">
            <circle cx="130" cy="111" r="9" />
            <circle cx="310" cy="111" r="9" />
          </g>
          <g fill="#344767" font-size="16" text-anchor="middle">
            <text x="130" y="26">5′</text>
            <text x="310" y="26">3′</text>
            <text x="130" y="218">3′</text>
            <text x="310" y="218">5′</text>
          </g>
          <g fill="#52627c" font-size="15">
            <text x="12" y="76">脱氧核糖</text>
            <path d="M80 71H115" stroke="#6c4bbe" />
            <text x="12" y="117">磷酸基团</text>
            <path d="M80 112H120" stroke="#aa782d" />
            <text x="340" y="108">氢键</text>
            <path d="M337 114L225 151" fill="none" stroke="#aa782d" />
          </g>
        </svg>
        <figcaption>
          A—T 之间有 2 个氢键，G—C 之间有 3 个。图只画局部连接，不表示真实空间比例。
        </figcaption>
      </figure>
      <div v-else-if="code === '150503'" class="dna-comparison">
        <div class="dna-comparison__grid">
          <figure class="dna-panel">
            <figcaption>
              <strong>转录 · DNA → RNA</strong><span>典型真核细胞的核内</span>
            </figcaption>
            <p class="dna-sequence-label">DNA 模板链</p>
            <div class="dna-sequence">3′ TAC AAA CCG ATT 5′</div>
            <p class="dna-arrow">↓ 互补配对，合成 RNA</p>
            <div class="dna-sequence dna-sequence--rna">5′ AUG UUU GGC UAA 3′</div>
            <p>产生 mRNA；原 DNA 保留，信息被复制到 RNA。</p>
          </figure>
          <figure class="dna-panel">
            <figcaption><strong>翻译 · mRNA → 多肽</strong><span>核糖体上</span></figcaption>
            <p class="dna-sequence-label">mRNA，按给定阅读框分组</p>
            <div class="dna-sequence dna-sequence--rna">5′ AUG UUU GGC UAA 3′</div>
            <p class="dna-arrow">↓ 依次连接氨基酸</p>
            <div class="dna-sequence">Met — Phe — Gly <span class="dna-stop">停止</span></div>
            <p>得到 3 个氨基酸的示意短肽；UAA 是终止信号，不是第四个氨基酸。</p>
          </figure>
        </div>
      </div>
      <div v-else-if="code === '150504'" class="dna-comparison">
        <div class="dna-comparison__grid">
          <figure class="dna-panel">
            <figcaption><strong>替换 1 个碱基</strong><span>长度相同，阅读框保留</span></figcaption>
            <p class="dna-sequence-label">DNA 编码链，均按 5′→3′</p>
            <div class="dna-sequence">ATG TT<strong class="dna-change">T</strong> GGC TAA</div>
            <p class="dna-arrow">↓ T 换成 C</p>
            <div class="dna-sequence">ATG TT<strong class="dna-change">C</strong> GGC TAA</div>
            <p>对应 mRNA 的 UUU 与 UUC 都指定 Phe（苯丙氨酸）。这个替换不改变所示氨基酸序列。</p>
          </figure>
          <figure class="dna-panel">
            <figcaption><strong>插入 1 个碱基</strong><span>下游原序列重新分组</span></figcaption>
            <p class="dna-sequence-label">在起始 ATG 后插入 A</p>
            <div class="dna-sequence">ATG TTT GGC TAA</div>
            <p class="dna-arrow">↓ 从原起点重新每三个分组</p>
            <div class="dna-sequence">ATG <strong class="dna-change">A</strong>TT TGG CTA A…</div>
            <p>
              显示部分对应 Met—Ile—Trp—Leu。末尾 A 不是完整密码子，后续未画，不能据此确定最终长度。
            </p>
          </figure>
        </div>
      </div>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { dnaMethods, type DnaMethodCode } from '@/content/knowledge/dnaMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: DnaMethodCode }>()
// 父章节内切节与直接打开叶节点，都使用同一份方法、图解与摘要数据。
const lesson = computed(() => dnaMethods[props.code])
const dnaStructureTitle = `dna-structure-${useId()}`
const basePairs = [
  { left: 'A', right: 'T', y: 68, bonds: 'M206-4H234 M206 4H234' },
  { left: 'G', right: 'C', y: 154, bonds: 'M206-7H234 M206 0H234 M206 7H234' },
]
</script>

<style scoped lang="scss">
.dna-structure {
  max-width: 480px;
  margin: 12px 0;
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  figcaption {
    font-size: 14px;
    color: #52627c;
    line-height: 1.65;
  }
}
.dna-comparison {
  container-type: inline-size;
}
.dna-comparison__grid {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr);
}
.dna-panel {
  min-width: 0;
  margin: 0;
  padding: 16px;
  border: 1px solid var(--color-learning-teal-line, #c8e8df);
  border-radius: 10px;
  background: var(--color-surface, #fff);
  figcaption strong {
    display: block;
    font-size: 17px;
    color: var(--color-learning-teal, #087c72);
  }
  figcaption span {
    display: block;
    font-size: 14px;
    color: #52627c;
    margin-top: 3px;
  }
  p {
    font-size: 15px;
    line-height: 1.75;
    margin: 12px 0 0;
  }
  .dna-sequence-label {
    margin: 16px 0 6px;
    color: #52627c;
    font-size: 14px;
  }
  .dna-arrow {
    margin: 8px 0;
    color: #52627c;
    font-size: 14px;
  }
}
.dna-sequence {
  padding: 9px 10px;
  background: var(--color-learning-blue-soft, #edf3ff);
  border-radius: 5px;
  font: 500 15px/1.7 var(--font-mono, monospace);
  color: #203c65;
  overflow-wrap: anywhere;
}
.dna-sequence--rna {
  background: var(--color-learning-teal-soft, #edf9f5);
}
.dna-stop {
  font: 14px var(--font-sans, sans-serif);
  color: #8a520c;
}
.dna-change {
  background: #ffdf9b;
  color: #693c00;
  padding: 1px 2px;
}
@container (min-width: 740px) {
  .dna-comparison__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
