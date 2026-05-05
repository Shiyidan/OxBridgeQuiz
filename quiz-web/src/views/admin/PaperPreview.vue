<template>
  <div class="page-content">
    <div class="page-header">
      <div>
        <h2>{{ paper?.title || '加载中...' }}</h2>
        <div class="meta" v-if="paper">
          <span>年份：{{ paper.year }}</span>
          <span class="meta-sep">|</span>
          <span>时长：{{ paper.duration }} 分钟</span>
          <span class="meta-sep">|</span>
          <span>共 {{ paper.totalQuestions }} 题</span>
          <span class="meta-sep">|</span>
          <span :class="`tag tag-${paper.status}`">{{ statusLabel(paper.status) }}</span>
        </div>
      </div>
      <div class="header-actions">
        <a :href="`http://localhost:3001/api/papers/${paper?.id}/pdf`" download class="btn-outline">下载PDF</a>
        <router-link v-if="paper?.status === 'draft'" :to="`/admin/papers/${paper?.id}/edit`" class="btn-primary">编辑校对</router-link>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="questions.length" class="questions-area">
      <div v-for="(q, i) in questions" :key="i" class="q-card">
        <div class="q-header">
          <span class="q-num">第 {{ q.number || q.order || i+1 }} 题</span>
          <span v-if="q.answer?.length" class="q-answer-label">答案：{{ q.answer.join(', ') }}</span>
        </div>
        <div class="q-body">
          <LatexText :text="q.title || ''" />
        </div>
        <!-- 图形 -->
        <div v-if="q.images?.length" class="q-images">
          <div v-for="(img, j) in q.images" :key="j" class="q-image-wrap">
            <div v-if="img.type === 'svg'" v-html="img.code" class="svg-box" />
            <img v-else-if="img.src" :src="img.src" class="img-box" :alt="img.alt" />
          </div>
        </div>
        <!-- 选项 -->
        <div class="q-options">
          <div v-for="opt in q.options || []" :key="opt.label"
            class="q-opt" :class="{ correct: q.answer?.includes(opt.label) }">
            <span class="opt-letter">{{ opt.label }}</span>
            <LatexText :text="opt.text || ''" />
            <span v-if="q.answer?.includes(opt.label)" class="opt-check">✓ 正确答案</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-card">暂无题目数据</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import LatexText from '@/components/LatexText.vue'

const route = useRoute()
const paper = ref<any>(null)
const questions = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  const res = await fetch(`http://localhost:3001/api/papers/${route.params.id}`)
  const data = await res.json()
  paper.value = data
  questions.value = data.questions || []
  loading.value = false
})

function statusLabel(s: string) {
  return { draft: '草稿', published: '已发布', archived: '已归档' }[s] || s
}
</script>

<style scoped>
.page-content { padding: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-header h2 { margin: 0 0 8px; font-size: 1.25rem; }
.meta { font-size: 13px; color: #8c8c8c; display: flex; align-items: center; gap: 4px; }
.meta-sep { color: #e8e8e8; margin: 0 4px; }
.tag { display: inline-block; padding: 1px 8px; border-radius: 8px; font-size: 12px; }
.tag-draft { background: #fff7e6; color: #fa8c16; }
.tag-published { background: #f6ffed; color: #52c41a; }
.header-actions { display: flex; gap: 12px; }
.btn-primary { padding: 8px 20px; background: #1890ff; color: white; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; }
.btn-primary:hover { background: #40a9ff; }
.btn-outline { display: inline-block; padding: 8px 20px; border: 1px solid #d9d9d9; color: #595959; border-radius: 6px; text-decoration: none; font-size: 14px; background: white; }
.btn-outline:hover { border-color: #1890ff; color: #1890ff; }
.loading { text-align: center; padding: 60px; color: #999; }

.questions-area { display: flex; flex-direction: column; gap: 16px; }
.q-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.04); border: 1px solid #f0f0f0; }
.q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f5f5f5; }
.q-num { font-weight: 600; font-size: 15px; color: #262626; }
.q-answer-label { font-size: 13px; color: #52c41a; font-weight: 500; background: #f6ffed; padding: 2px 10px; border-radius: 10px; }
.q-body { line-height: 1.8; font-size: 14px; color: #333; margin-bottom: 16px; }
.q-images { margin: 16px 0; text-align: center; }
.q-image-wrap { margin: 12px 0; }
.svg-box :deep(svg) { max-width: 100%; height: auto; }
.img-box { max-width: 100%; height: auto; border-radius: 4px; }
.q-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
.q-opt { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border: 1px solid #f0f0f0; border-radius: 8px; background: #fafafa; }
.q-opt.correct { border-color: #b7eb8f; background: #f6ffed; }
.opt-letter { font-weight: 700; color: #595959; width: 20px; }
.opt-check { margin-left: auto; font-size: 12px; color: #52c41a; font-weight: 500; }
.empty-card { text-align: center; padding: 80px 0; color: #999; background: white; border-radius: 12px; }
</style>
