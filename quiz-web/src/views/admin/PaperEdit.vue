<template>
  <div class="page-content">
    <div class="page-header">
      <h2>编辑校对 - {{ paper?.title }}</h2>
      <div class="header-actions">
        <button @click="save" class="btn-primary">保存</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="edit-area">
      <!-- 试卷基本信息 -->
      <div class="card section">
        <h3 class="section-title">基本信息</h3>
        <div class="form-row">
          <div class="form-group">
            <label>标题</label>
            <input v-model="paper.title" />
          </div>
          <div class="form-group" style="width:100px">
            <label>年份</label>
            <input v-model.number="paper.year" type="number" />
          </div>
          <div class="form-group" style="width:120px">
            <label>时长(分钟)</label>
            <input v-model.number="paper.duration" type="number" />
          </div>
        </div>
      </div>

      <!-- 题目列表 -->
      <div v-for="(q, i) in questions" :key="i" class="card section">
        <div class="section-header">
          <h3 class="section-title">第 {{ q.number || i+1 }} 题</h3>
          <button @click="removeQuestion(i)" class="btn-text danger">删除此题</button>
        </div>

        <div class="form-group">
          <label>题目内容（支持 LaTeX 公式）</label>
          <textarea v-model="q.title" rows="3" placeholder="题目文本，公式用 $...$ 包裹" />
        </div>

        <div class="form-group">
          <label>正确答案</label>
          <input v-model="q.answerText" placeholder="如: C" style="width:100px" />
        </div>

        <label class="opt-section-label">选项</label>
        <div class="options-grid">
          <div v-for="(opt, j) in q.options" :key="j" class="opt-row">
            <span class="opt-tag">{{ opt.label }}</span>
            <input v-model="opt.text" class="opt-input" placeholder="选项内容，公式用 $...$" />
            <button @click="removeOption(q, j)" class="btn-icon" title="删除选项">×</button>
          </div>
        </div>
        <button @click="addOption(q)" class="btn-text" v-if="(q.options?.length || 0) < 8">+ 添加选项</button>
      </div>

      <button @click="addQuestion" class="btn-add-section">+ 添加题目</button>
    </div>

    <!-- 保存成功提示 -->
    <div class="toast" v-if="saved">保存成功</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const paper = ref<any>({ title: '', year: 2023, duration: 60 })
const questions = ref<any[]>([])
const loading = ref(true)
const saved = ref(false)

onMounted(async () => {
  const res = await fetch(`http://localhost:3001/api/papers/${route.params.id}`)
  const data = await res.json()
  paper.value = data
  questions.value = (data.questions || []).map((q: any) => ({
    ...q,
    answerText: q.answer?.[0] || ''
  }))
  loading.value = false
})

function addQuestion() {
  questions.value.push({
    number: questions.value.length + 1,
    title: '',
    options: [
      { label: 'A', text: '' }, { label: 'B', text: '' },
      { label: 'C', text: '' }, { label: 'D', text: '' }
    ],
    answerText: '',
    images: []
  })
}

function removeQuestion(i: number) {
  if (confirm('确定删除此题？')) questions.value.splice(i, 1)
}

function addOption(q: any) {
  const labels = 'ABCDEFGH'
  const used = q.options.map((o: any) => o.label)
  const next = labels.split('').find(l => !used.includes(l))
  if (next) q.options.push({ label: next, text: '' })
}

function removeOption(q: any, j: number) {
  if (q.options.length <= 2) return
  q.options.splice(j, 1)
}

async function save() {
  const payload = {
    title: paper.value.title,
    year: paper.value.year,
    duration: paper.value.duration,
    questions: questions.value.map((q: any) => ({
      ...q,
      answer: q.answerText ? [q.answerText.trim().toUpperCase()] : []
    }))
  }
  await fetch(`http://localhost:3001/api/papers/${route.params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}
</script>

<style scoped>
.page-content { padding: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h2 { margin: 0; font-size: 1.25rem; }
.card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.04); border: 1px solid #f0f0f0; }
.section { margin-bottom: 16px; }
.section-title { font-size: 15px; font-weight: 600; margin: 0 0 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-header .section-title { margin: 0; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px; color: #333; }
.form-group input, .form-group textarea { width: 100%; padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 6px; font-size: 14px; }
.form-group input:focus, .form-group textarea:focus { outline: none; border-color: #1890ff; }
.form-row { display: flex; gap: 12px; align-items: flex-end; }
.opt-section-label { display: block; margin-bottom: 10px; font-weight: 500; font-size: 13px; color: #333; }
.options-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.opt-row { display: flex; align-items: center; gap: 10px; }
.opt-tag { width: 28px; height: 28px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #595959; flex-shrink: 0; }
.opt-input { flex: 1; padding: 8px 12px; border: 1px solid #e8e8e8; border-radius: 6px; font-size: 14px; }
.opt-input:focus { outline: none; border-color: #1890ff; }
.btn-icon { width: 28px; height: 28px; border: none; background: none; color: #999; font-size: 18px; cursor: pointer; border-radius: 4px; }
.btn-icon:hover { background: #fff2f0; color: #ff4d4f; }
.btn-text { background: none; border: none; color: #1890ff; cursor: pointer; font-size: 13px; padding: 0; }
.btn-text.danger { color: #ff4d4f; }
.btn-text:hover { opacity: .8; }
.btn-primary { padding: 10px 32px; background: #1890ff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-primary:hover { background: #40a9ff; }
.btn-add-section { width: 100%; padding: 16px; border: 2px dashed #d9d9d9; background: #fafafa; border-radius: 12px; cursor: pointer; font-size: 14px; color: #999; }
.btn-add-section:hover { border-color: #1890ff; color: #1890ff; }
.header-actions { display: flex; gap: 12px; }
.loading { text-align: center; padding: 60px; color: #999; }
.toast { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); padding: 10px 24px; border-radius: 6px; font-size: 14px; z-index: 2000; background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; animation: fadeInOut 2s; }
@keyframes fadeInOut { 0%,100% { opacity: 0; transform: translateX(-50%) translateY(-10px); } 15%,85% { opacity: 1; transform: translateX(-50%) translateY(0); } }
</style>
