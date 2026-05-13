<template>
  <div class="sub-page">
    <div class="page-top-bar">
      <button class="back-btn" @click="$router.push('/admin/core-library')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        返回类别列表
      </button>
    </div>
    <div class="page-body">
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">试题库管理</h2>
          <p class="section-desc">历年真题、模拟卷及按考点分类的习题集合。</p>
        </div>
        <button class="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新增题目
        </button>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="search-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="搜索题目..." class="search-input" />
        </div>
        <div class="filter-tags">
          <span class="filter-tag filter-tag--active">全部</span>
          <span class="filter-tag">ENGAA</span>
          <span class="filter-tag">NSAA</span>
          <span class="filter-tag">TMUA</span>
          <span class="filter-tag">PAT</span>
        </div>
      </div>

      <!-- 题目列表 -->
      <div class="data-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>编号</th>
              <th>题目标题</th>
              <th>学科</th>
              <th>难度</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in questionList" :key="item.id">
              <td><span class="id-badge">{{ item.id }}</span></td>
              <td class="title-cell">{{ item.title }}</td>
              <td>{{ item.subject }}</td>
              <td><span :class="`diff diff--${item.difficulty}`">{{ difficultyLabel(item.difficulty) }}</span></td>
              <td><span :class="`status status--${item.status}`">{{ statusLabel(item.status) }}</span></td>
              <td class="action-cell">
                <a href="#" class="action-link">编辑</a>
                <a href="#" class="action-link danger">删除</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 试题库管理（题目列表 + 搜索筛选）
const questionList = [
  { id: 'Q001', title: 'The surface area of a solid sphere of radius R...', subject: 'ENGAA', difficulty: 'easy', status: 'published' },
  { id: 'Q002', title: 'A spaceship of mass 10000 kg is moving at...', subject: 'ENGAA', difficulty: 'easy', status: 'published' },
  { id: 'Q003', title: 'Which of the following is a correct rearrangement...', subject: 'ENGAA', difficulty: 'medium', status: 'published' },
  { id: 'Q004', title: 'A circuit is set up as shown. All three resistors...', subject: 'ENGAA', difficulty: 'hard', status: 'draft' },
]

function difficultyLabel(d: string) {
  return { easy: '简单', medium: '中等', hard: '困难' }[d] || d
}

function statusLabel(s: string) {
  return { published: '已发布', draft: '草稿' }[s] || s
}
</script>

<style scoped lang="scss">
.sub-page { min-height: 100%; }
.page-top-bar { padding: 28px 40px 0; }
.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: none; background: transparent;
  font-size: 0.875rem; font-weight: 500; color: #64748b;
  cursor: pointer; border-radius: 8px; transition: all 0.15s ease;
  svg { width: 16px; height: 16px; }
  &:hover { color: #0f172a; background: #f1f5f9; }
}
.page-body { padding: 24px 40px 48px; }

.section-header {
  display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px;
}
.header-text { max-width: 520px; }
.section-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 8px; letter-spacing: -0.02em; }
.section-desc { font-size: 0.9rem; color: #64748b; margin: 0; line-height: 1.5; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; background: #4f46e5; color: white;
  border: none; border-radius: 10px; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease;
  svg { width: 16px; height: 16px; }
  &:hover { background: #6366f1; box-shadow: 0 4px 12px rgba(79,70,229,.35); }
}

.filter-bar {
  display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
}
.search-input-wrap {
  position: relative; flex: 1; max-width: 320px;
  svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; }
}
.search-input {
  width: 100%; padding: 10px 12px 10px 38px;
  border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 0.875rem; color: #0f172a; outline: none; transition: border-color 0.2s;
  &::placeholder { color: #94a3b8; }
  &:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.1); }
}
.filter-tags { display: flex; gap: 8px; }
.filter-tag {
  padding: 6px 14px; border-radius: 8px; font-size: 0.8125rem; font-weight: 500;
  color: #64748b; background: #f1f5f9; cursor: pointer; transition: all 0.15s;
  &:hover { background: #e2e8f0; color: #0f172a; }
  &--active { background: #4f46e5; color: white; }
}

.data-card {
  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;
}
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  background: #f8fafc; padding: 14px 20px; text-align: left;
  font-weight: 600; font-size: 0.8125rem; color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}
.data-table td {
  padding: 14px 20px; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155;
}
.title-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.action-cell { white-space: nowrap; }
.action-link { color: #4f46e5; text-decoration: none; font-size: 0.8125rem; font-weight: 500; margin-right: 12px; cursor: pointer; &:hover { text-decoration: underline; } }
.action-link.danger { color: #ef4444; }

.id-badge { font-family: var(--font-mono); font-size: 0.8125rem; color: #94a3b8; }
.diff { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
.diff--easy { background: #ecfdf5; color: #059669; }
.diff--medium { background: #fffbeb; color: #d97706; }
.diff--hard { background: #fef2f2; color: #dc2626; }
.status { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; }
.status--published { background: #ecfdf5; color: #059669; }
.status--draft { background: #f1f5f9; color: #64748b; }
</style>
