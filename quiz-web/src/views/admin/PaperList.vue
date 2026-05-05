<template>
  <div class="page-content">
    <div class="page-header">
      <h2>试卷列表</h2>
      <router-link to="/admin/papers/upload" class="btn-primary">+ 上传试卷</router-link>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div class="card" v-else-if="papers.length">
      <table class="data-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>年份</th>
            <th>题目数</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in papers" :key="p.id">
            <td class="title-cell">{{ p.title }}</td>
            <td>{{ p.year }}</td>
            <td>{{ p.totalQuestions }}</td>
            <td><span :class="`tag tag-${p.status}`">{{ statusLabel(p.status) }}</span></td>
            <td>{{ formatDate(p.createdAt) }}</td>
            <td class="action-cell">
              <router-link :to="`/admin/papers/${p.id}`" class="action-link">预览</router-link>
              <span class="action-sep">|</span>
              <router-link v-if="p.status !== 'published'" :to="`/admin/papers/${p.id}/edit`" class="action-link">编辑</router-link>
              <span v-if="p.status !== 'published'" class="action-sep">|</span>
              <a :href="`http://localhost:3001/api/papers/${p.id}/pdf`" download class="action-link">下载</a>
              <span class="action-sep">|</span>
              <button v-if="p.status === 'draft'" @click="publishPaper(p)" class="action-link action-btn">发布</button>
              <span v-if="p.status === 'draft'" class="action-sep">|</span>
              <button @click="confirmDelete(p)" class="action-link action-btn danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination" v-if="totalPages > 1">
        <button :disabled="page <= 1" @click="page--; loadPapers()">上一页</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button :disabled="page >= totalPages" @click="page++; loadPapers()">下一页</button>
      </div>
    </div>

    <div class="card empty-card" v-else>暂无试卷，请先上传</div>

    <!-- 删除确认弹窗 -->
    <div class="modal-overlay" v-if="deleteTarget" @click.self="deleteTarget = null">
      <div class="modal-box">
        <h3>确认删除</h3>
        <p>确定要删除 <strong>{{ deleteTarget.title }}</strong> 吗？此操作不可恢复。</p>
        <div class="modal-actions">
          <button @click="deleteTarget = null" class="btn-cancel">取消</button>
          <button @click="doDelete" class="btn-danger">确认删除</button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div class="toast" v-if="toast" :class="toast.type">{{ toast.msg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface PaperItem { id: string; title: string; year: number; totalQuestions: number; status: string; createdAt: string }

const papers = ref<PaperItem[]>([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const deleteTarget = ref<PaperItem | null>(null)
const toast = ref<{ msg: string; type: string } | null>(null)

onMounted(() => loadPapers())

async function loadPapers() {
  loading.value = true
  const res = await fetch(`http://localhost:3001/api/papers?page=${page.value}`)
  const data = await res.json()
  papers.value = data.papers
  totalPages.value = data.totalPages
  loading.value = false
}

function statusLabel(s: string) {
  return { draft: '草稿', published: '已发布', archived: '已归档' }[s] || s
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN')
}

async function publishPaper(p: PaperItem) {
  await fetch(`http://localhost:3001/api/papers/${p.id}/publish`, { method: 'PUT' })
  showToast('发布成功', 'success')
  loadPapers()
}

function confirmDelete(p: PaperItem) { deleteTarget.value = p }

async function doDelete() {
  if (!deleteTarget.value) return
  await fetch(`http://localhost:3001/api/papers/${deleteTarget.value.id}`, { method: 'DELETE' })
  showToast('已删除', 'success')
  deleteTarget.value = null
  loadPapers()
}

function showToast(msg: string, type: string) {
  toast.value = { msg, type }
  setTimeout(() => toast.value = null, 2500)
}
</script>

<style scoped>
.page-content { padding: 32px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h2 { margin: 0; font-size: 1.25rem; }
.btn-primary { padding: 8px 20px; background: #1890ff; color: white; border: none; border-radius: 6px; text-decoration: none; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-primary:hover { background: #40a9ff; }
.card { background: white; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #fafafa; padding: 14px 16px; text-align: left; font-weight: 600; font-size: 13px; color: #595959; border-bottom: 1px solid #f0f0f0; }
.data-table td { padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.title-cell { font-weight: 500; color: #262626; }
.action-cell { white-space: nowrap; }
.action-link { color: #1890ff; text-decoration: none; font-size: 13px; }
.action-link:hover { color: #40a9ff; }
.action-sep { color: #e8e8e8; margin: 0 4px; }
.action-btn { background: none; border: none; cursor: pointer; padding: 0; }
.danger { color: #ff4d4f; }
.danger:hover { color: #ff7875; }
.tag { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 12px; }
.tag-draft { background: #fff7e6; color: #fa8c16; }
.tag-published { background: #f6ffed; color: #52c41a; }
.tag-archived { background: #f5f5f5; color: #8c8c8c; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 12px; padding: 16px; }
.pagination button { padding: 6px 16px; border: 1px solid #d9d9d9; background: white; border-radius: 4px; cursor: pointer; }
.pagination button:disabled { color: #ccc; cursor: not-allowed; }
.empty-card { text-align: center; padding: 80px 0; color: #999; font-size: 14px; }
.loading { text-align: center; padding: 40px; color: #999; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: white; border-radius: 12px; padding: 32px; width: 420px; box-shadow: 0 8px 32px rgba(0,0,0,.15); }
.modal-box h3 { margin: 0 0 12px; font-size: 1.1rem; }
.modal-box p { color: #666; margin: 0 0 24px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; }
.btn-cancel { padding: 8px 20px; border: 1px solid #d9d9d9; background: white; border-radius: 6px; cursor: pointer; }
.btn-danger { padding: 8px 20px; background: #ff4d4f; color: white; border: none; border-radius: 6px; cursor: pointer; }
.btn-danger:hover { background: #ff7875; }

.toast { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); padding: 10px 24px; border-radius: 6px; font-size: 14px; z-index: 2000; animation: fadeInOut 2.5s; }
.toast.success { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
.toast.error { background: #fff2f0; color: #ff4d4f; border: 1px solid #ffa39e; }
@keyframes fadeInOut { 0%,100% { opacity: 0; transform: translateX(-50%) translateY(-10px); } 15%,85% { opacity: 1; transform: translateX(-50%) translateY(0); } }
</style>
