<!-- 法律文档页：统一承载用户协议、隐私政策和会员购买相关文档。 -->
<template>
  <div class="legal-page">
    <NavBar />

    <main class="legal-shell">
      <aside class="legal-sidebar">
        <nav class="legal-directory" aria-label="协议与政策目录">
          <span>协议与政策</span>
          <router-link
            v-for="item in legalDocumentList"
            :key="item.type"
            :to="`/legal/${item.type}`"
            :aria-current="item.type === currentDocument.type ? 'page' : undefined"
          >
            {{ item.shortTitle }}
          </router-link>
        </nav>

        <section class="legal-history" aria-labelledby="legal-history-title">
          <h2 id="legal-history-title">历史版本</h2>
          <p>暂无历史版本</p>
        </section>
      </aside>

      <article class="legal-document">
        <div class="legal-markdown" v-html="renderedDocument"></div>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import NavBar from '@/components/NavBar.vue'
import {
  isLegalDocumentType,
  legalDocumentList,
  legalDocuments,
  type LegalDocumentDefinition,
} from './legalDocumentData'

const route = useRoute()
const router = useRouter()

// 路由切换时同步当前文档；未知参数回退到用户协议入口。
const currentDocument = computed<LegalDocumentDefinition>(() => {
  const documentType = String(route.params.documentType || '')
  if (isLegalDocumentType(documentType)) return legalDocuments[documentType]
  void router.replace('/legal/user-agreement')
  return legalDocuments['user-agreement']
})

// 法律正文由仓库内受控 Markdown 提供，后续可直接替换内容而无需修改页面组件。
const renderedDocument = computed(() => marked.parse(currentDocument.value.markdown) as string)
</script>

<style scoped>
.legal-page {
  min-width: var(--fluid-page-min-width);
  min-height: 100vh;
  background: var(--color-bg);
}

.legal-shell {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: clamp(24px, 2.5vw, 40px);
  width: var(--fluid-shell-width);
  margin: 0 auto;
  padding: 56px 0 96px;
}

.legal-sidebar {
  position: sticky;
  top: calc(var(--nav-height) + 32px);
  align-self: start;
  width: max-content;
}

.legal-directory {
  display: grid;
  gap: 4px;
}

.legal-directory > span {
  margin-bottom: 12px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.legal-directory a {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  text-decoration: none;
  white-space: nowrap;
  transition:
    background var(--duration-base) ease,
    color var(--duration-base) ease;
}

.legal-directory a:hover,
.legal-directory a[aria-current='page'] {
  background: var(--color-active);
  color: var(--color-ink);
}

.legal-directory a:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 2px;
}

.legal-history {
  margin-top: 24px;
  padding: 20px 12px 0;
  border-top: 1px solid var(--color-line);
}

.legal-history h2 {
  margin: 0 0 10px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  line-height: var(--leading-normal);
}

.legal-history p {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

.legal-document {
  min-width: 0;
  min-height: 520px;
  padding: clamp(32px, 3.5vw, 48px) clamp(28px, 4vw, 56px) clamp(48px, 5vw, 64px);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.legal-markdown {
  width: 100%;
  max-width: none;
  color: var(--color-ink-soft);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  overflow-wrap: anywhere;
}

.legal-markdown :deep(h1) {
  margin: 0 0 28px;
  color: var(--color-ink);
  font-size: var(--text-3xl);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
}

.legal-markdown :deep(p) {
  margin: 0 0 18px;
}

.legal-markdown :deep(h2) {
  margin: 40px 0 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-line-soft);
  color: var(--color-ink);
  font-size: var(--text-xl);
  line-height: var(--leading-snug);
}

.legal-markdown :deep(h3) {
  margin: 28px 0 14px;
  color: var(--color-ink);
  font-size: var(--text-lg);
  line-height: var(--leading-snug);
}

.legal-markdown :deep(ul),
.legal-markdown :deep(ol) {
  margin: 0 0 20px;
  padding-left: 1.6em;
}

.legal-markdown :deep(li) {
  margin-bottom: 8px;
  padding-left: 4px;
}

.legal-markdown :deep(strong) {
  color: var(--color-ink);
}

.legal-markdown :deep(code) {
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
  color: var(--color-ink);
  font-size: 0.92em;
}

.legal-markdown :deep(blockquote) {
  margin: 0 0 28px;
  padding: 16px 18px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
  color: var(--color-ink);
}

.legal-markdown :deep(blockquote p) {
  margin: 0;
}

@media (max-width: 840px) {
  .legal-shell {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    padding: 32px 0 64px;
  }

  .legal-sidebar {
    position: static;
    width: 100%;
  }

  .legal-directory {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .legal-directory > span {
    grid-column: 1 / -1;
  }

  .legal-directory a {
    width: 100%;
    white-space: normal;
  }

  .legal-history {
    padding-right: 12px;
    padding-left: 12px;
  }
}

@media (max-width: 560px) {
  .legal-document {
    padding: 28px 20px 44px;
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }

  .legal-directory {
    grid-template-columns: minmax(0, 1fr);
  }

  .legal-markdown :deep(h1) {
    font-size: var(--text-2xl);
  }
}
</style>
