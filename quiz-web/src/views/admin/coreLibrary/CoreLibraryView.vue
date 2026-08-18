<template>
  <div class="core-library">
    <div class="page-body">
      <!-- 标题区 -->
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">专业资料库</h2>
          <p class="section-desc">管理该学科下的所有题目、教材与学习大纲。</p>
        </div>
      </div>

      <!-- 资料库入口网格 -->
      <div class="card-grid">
        <router-link
          v-for="card in libraryCards"
          :key="card.key"
          :to="card.path"
          class="library-card"
        >
          <div class="card-icon-wrap" :style="{ background: card.iconBg }">
            <span class="card-icon" v-html="card.icon"></span>
          </div>
          <h3 class="card-title">{{ card.title }}</h3>
          <p class="card-desc">{{ card.desc }}</p>
          <div class="card-footer">
            <span class="card-count">{{ card.count }} {{ card.unit }}</span>
            <span class="card-action">管理 &rarr;</span>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 核心资料库首页：汇总各类资料库及模考试卷管理入口。
import { onMounted, reactive } from 'vue'
import { getMockPaperSetStats } from '@/api/mockPaperAdmin'

interface LibraryCard {
  key: string
  title: string
  desc: string
  count: number | string
  unit: string
  icon: string
  iconBg: string
  path: string
}

const libraryCards = reactive<LibraryCard[]>([
  {
    key: 'questions',
    title: '试题库',
    desc: 'AI 生成题目批次及按考点分类的习题集合。',
    count: 420,
    unit: '题',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    iconBg: '#eef2ff',
    path: '/admin/core-library/questions',
  },
  {
    key: 'textbooks',
    title: '教材库',
    desc: '核心参考书、官方指南、知识点总结讲义。',
    count: 12,
    unit: '份',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
    iconBg: '#fffbeb',
    path: '/admin/core-library/textbooks',
  },
  {
    key: 'syllabus',
    title: '大纲库',
    desc: '官方考试大纲、知识树映射及能力要求模型。',
    count: 8,
    unit: '份',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    iconBg: '#ecfdf5',
    path: '/admin/core-library/syllabus',
  },
  {
    key: 'exams',
    title: '真题库',
    desc: '按套卷维度管理历年全套真题及相关配置。',
    count: 24,
    unit: '套',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    iconBg: '#eff6ff',
    path: '/admin/core-library/exams',
  },
  {
    key: 'mock-exams',
    title: '模考试卷库',
    desc: '按模块上传题号、检查题库匹配并管理固定 ESAT / TMUA 模考卷。',
    count: '—',
    unit: '套',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h5M8 16h4"/><path d="m15 16 1.5 1.5L20 14"/></svg>',
    iconBg: '#f5f3ff',
    path: '/admin/core-library/mock-exams',
  },
])

// 模考试卷数量来自后台汇总；加载失败时保留占位，不阻塞其他资料库入口。
async function loadMockPaperCount(): Promise<void> {
  try {
    const result = await getMockPaperSetStats()
    const card = libraryCards.find((item) => item.key === 'mock-exams')
    if (card) card.count = result.total
  } catch {
    // 首页入口仍可进入，具体加载错误由模考试卷库页面呈现。
  }
}

onMounted(() => void loadMockPaperCount())
</script>

<style scoped lang="scss">
.core-library {
  min-height: 100%;
}

.page-body {
  padding: 24px 40px 48px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}

.header-text {
  max-width: 520px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}

.section-desc {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

/* ========== 卡片网格 ========== */
.card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.library-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px 24px;
  text-decoration: none;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #c7d2fe;
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.08);
    transform: translateY(-3px);
  }
}

.card-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.card-icon {
  width: 26px;
  height: 26px;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
}

.card-desc {
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 24px;
  flex: 1;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.card-count {
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 500;
}

.card-action {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4f46e5;
  transition: color 0.15s;

  .library-card:hover & {
    color: #6366f1;
  }
}

/* ========== 响应式 ========== */
@media (max-width: 1200px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-body {
    padding: 20px 20px 36px;
  }

  .section-header {
    flex-direction: column;
    gap: 16px;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
