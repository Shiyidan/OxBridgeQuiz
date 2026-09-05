<!-- 管理端试卷上传页：校验并预览新版 sections 试卷及历史兼容格式。 -->
<template>
  <div class="upload-page">
    <!-- 顶部返回 -->
    <div class="page-top-bar">
      <button class="back-btn" @click="$router.push(uploadBackPath)">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {{ uploadBackLabel }}
      </button>
    </div>

    <div class="page-body">
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">试卷解析录入</h2>
          <p class="section-desc">
            上传 PDF 试卷或单题图片，由 Qwen 大模型自动识别题目、公式与图形。
          </p>
        </div>
      </div>

      <!-- 模式切换 -->
      <div class="mode-tabs">
        <button
          class="mode-tab"
          :class="{ 'mode-tab--active': mode === 'markdown' }"
          @click="mode = 'markdown'"
        >
          Markdown 上传
        </button>
        <button
          class="mode-tab"
          :class="{ 'mode-tab--active': mode === 'file' }"
          @click="mode = 'file'"
        >
          文件上传
        </button>
        <button
          class="mode-tab"
          :class="{ 'mode-tab--active': mode === 'json' }"
          @click="mode = 'json'"
        >
          JSON 导入
        </button>
      </div>

      <div class="upload-area" v-if="mode === 'file'" :class="{ 'has-file': file }">
        <!-- 上传区 -->
        <div
          class="drop-zone"
          :class="{ 'drop-zone--active': dragOver }"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <template v-if="!file && !parsing">
            <div class="drop-icon-wrap">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6366f1"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <p class="drop-title">拖拽 PDF 或题目图片到此处</p>
            <p class="drop-hint">或点击此区域选择文件</p>
            <p class="drop-limit">支持 PDF（最大 50MB） / PNG / JPG（最大 10MB，单题测试）</p>
          </template>

          <template v-else-if="file && !parsing && !rendering">
            <div class="file-preview">
              <div v-if="fileKind === 'image' && imagePreviewUrl" class="image-thumb-wrap">
                <img :src="imagePreviewUrl" class="image-thumb" alt="题目图片预览" />
              </div>
              <div v-else class="file-icon-wrap">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4f46e5"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p class="file-name-text">{{ file.name }}</p>
              <p class="file-size-text">
                <span class="file-kind-badge" :class="`kind-${fileKind}`">{{
                  fileKind === 'image' ? '单题图片' : 'PDF'
                }}</span>
                {{ (file.size / 1024 / 1024).toFixed(2) }} MB
              </p>
              <button class="btn-change" @click.stop="clearFile">重新选择</button>
            </div>
          </template>

          <!-- 前端渲染 + 流式上传中 -->
          <div v-if="rendering" class="parsing-status">
            <div class="parsing-spinner"></div>
            <p class="parsing-title">正在渲染并上传 PDF 页面...</p>
            <p class="parsing-detail">浏览器端渲染，逐页上传到后端解析</p>
          </div>

          <!-- 全部上传完成，等待 Qwen 解析 -->
          <div v-else-if="parsing && !rendering" class="parsing-status">
            <div class="parsing-spinner"></div>
            <p class="parsing-title">
              {{
                parsingDone ? '解析完成' : parsingFailed ? '解析失败' : 'Qwen 大模型正在识别题目...'
              }}
            </p>
            <p class="parsing-detail" v-if="!parsingDone && !parsingFailed">
              {{ uploadDone ? `已上传全部 ${renderTotal} 页，后台解析中` : '正在上传页面...' }}
            </p>
            <p class="parsing-detail error-text" v-if="parsingFailed">{{ parseError }}</p>
          </div>
        </div>

        <!-- 标题编辑 -->
        <div v-if="file && !parsing && !rendering" class="title-edit-area">
          <label class="field-label">试卷名称</label>
          <input v-model="title" class="field-input" placeholder="输入试卷名称..." />
          <p class="field-hint">已自动使用文件名，可自行修改</p>

          <div class="meta-row">
            <div class="meta-field">
              <label class="field-label">考试类型</label>
              <select v-model="examType" class="field-input field-input--sm">
                <option v-for="item in examTypeOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>
            <div class="meta-field">
              <label class="field-label">年份</label>
              <input v-model.number="year" type="number" class="field-input field-input--sm" />
            </div>
            <div class="meta-field">
              <label class="field-label">考试时长（分钟）</label>
              <input v-model.number="duration" type="number" class="field-input field-input--sm" />
            </div>
          </div>
          <div class="meta-row">
            <div class="meta-field">
              <label class="field-label">访问级别</label>
              <select v-model="accessTier" class="field-input field-input--sm">
                <option v-for="item in accessTierOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
              <p class="field-hint">免费卷对所有学生开放，会员卷仅对对应考试会员开放</p>
            </div>
          </div>

          <div class="action-bar">
            <button class="btn-secondary-action" @click="clearFile">取消</button>
            <button class="btn-primary-action" @click="startUpload" :disabled="!title || !year">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              开始解析
            </button>
          </div>
        </div>

        <!-- 渲染 + 上传进度 -->
        <div v-if="rendering || (parsing && !uploadDone)" class="progress-area">
          <div class="progress-bar-wrap">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: renderProgress + '%' }"></div>
            </div>
            <span class="progress-label">{{ renderProgress }}%</span>
          </div>
          <p class="progress-detail">已渲染并上传 {{ renderCurrent }} / {{ renderTotal }} 页</p>
        </div>

        <!-- Qwen 解析进度 -->
        <div v-if="parsing && uploadDone && !parsingDone && !parsingFailed" class="progress-area">
          <div class="progress-bar-wrap">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
            <span class="progress-label">{{ progress }}%</span>
          </div>
        </div>

        <!-- 结果 -->
        <div v-if="!rendering" class="result-actions" :class="{ 'mt-20': parsing }">
          <template v-if="parsingDone && paperId">
            <button class="btn-primary-action" @click="goToPreview">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              查看解析结果
            </button>
            <button class="btn-secondary-action" @click="resetUpload">上传新试卷</button>
          </template>

          <template v-if="parsingFailed">
            <button class="btn-secondary-action" @click="resetUpload">重新选择</button>
            <button class="btn-primary-action" @click="retryParse">重试解析</button>
          </template>
        </div>
      </div>

      <!-- Markdown 导入模式 -->
      <div class="json-import-area" v-if="mode === 'markdown'">
        <!-- 未选择文件时：上传区 -->
        <div
          v-if="!mdFile && !mdImporting && !mdDone"
          class="drop-zone"
          :class="{ 'drop-zone--active': mdDragOver }"
          @dragover.prevent="mdDragOver = true"
          @dragleave.prevent="mdDragOver = false"
          @drop.prevent="handleMdDrop"
          @click="triggerMdFileInput"
        >
          <div class="drop-icon-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="12" y1="17" x2="12" y2="9" />
            </svg>
          </div>
          <p class="drop-title">拖拽 Markdown 文件到此处</p>
          <p class="drop-hint">或点击此区域选择 .md 文件</p>
          <p class="drop-limit">文件需包含 ```json 代码块，内含题目数据</p>
        </div>

        <!-- MD 文件已选择，编辑元数据 -->
        <div v-if="mdFile && !mdImporting && !mdDone && !mdError" class="json-edit-area">
          <div class="file-preview" style="text-align: center; margin-bottom: 20px">
            <div class="file-icon-wrap">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4f46e5"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p class="file-name-text">{{ mdFile.name }}</p>
            <p style="font-size: 0.8125rem; color: #94a3b8; margin: 0">
              找到 <b>{{ mdJsonBlockCount }}</b> 个 JSON 块，共
              <b>{{ mdQuestions.length }}</b> 道题目
            </p>
            <button class="btn-change" @click="clearMdFile">重新选择</button>
          </div>

          <label class="field-label">试卷名称</label>
          <input v-model="mdTitle" class="field-input" placeholder="输入试卷名称..." />

          <div class="meta-row">
            <div class="meta-field">
              <label class="field-label">考试类型</label>
              <select
                v-model="mdExamType"
                class="field-input field-input--sm"
                :disabled="mdUsesSectionSchema"
              >
                <option v-for="item in examTypeOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>
            <div class="meta-field">
              <label class="field-label">年份</label>
              <input
                v-model.number="mdYear"
                type="number"
                class="field-input field-input--sm"
                :disabled="mdUsesSectionSchema"
              />
            </div>
            <div class="meta-field">
              <label class="field-label">考试时长（分钟）</label>
              <input
                v-model.number="mdDuration"
                type="number"
                class="field-input field-input--sm"
                :disabled="mdUsesSectionSchema"
              />
              <p v-if="mdUsesSectionSchema" class="field-hint">按考试分段规则自动计算</p>
            </div>
          </div>

          <div class="meta-row" style="margin-top: 12px">
            <div class="meta-field">
              <label class="field-label">
                {{ mdUsesSectionSchema ? '套卷代码' : '套卷代码（可选）' }}
              </label>
              <input
                v-model="mdCode"
                class="field-input field-input--sm"
                placeholder="如 ESAT-EQUIV-2023-M1-CHE-M2 或 TMUA-2023"
              />
              <p class="field-hint">用于识别整套试卷及报告展示，不代表学科</p>
            </div>
            <div class="meta-field">
              <label class="field-label">访问级别</label>
              <select v-model="mdAccessTier" class="field-input field-input--sm">
                <option v-for="item in accessTierOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
              <p class="field-hint">免费卷可不限次数重测</p>
            </div>
            <div class="meta-field" style="display: flex; align-items: flex-end">
              <span style="font-size: 0.875rem; color: #475569"
                >共 <b>{{ mdQuestions.length }}</b> 道题目</span
              >
            </div>
          </div>

          <!-- 题目预览列表 -->
          <div v-if="mdModules.length" class="module-preview">
            <span v-for="module in mdModules" :key="module.code">
              <b>{{ module.subject }}</b> · {{ module.count }} 题 · {{ module.duration }} 分钟
            </span>
          </div>
          <div class="json-preview-list" v-if="mdQuestions.length">
            <p class="field-label" style="margin-top: 16px">题目预览</p>
            <div class="json-preview-item" v-for="q in mdQuestions" :key="questionPreviewKey(q)">
              <span class="json-preview-num">{{
                q.module_question_number || q.number
              }}</span>
              <span v-if="q.subject" class="json-preview-module">{{ q.subject }}</span>
              <span class="json-preview-title">{{ truncateText(q.title, 60) }}</span>
              <span class="json-preview-opts">{{ q.options?.length || 0 }} 个选项</span>
            </div>
          </div>

          <div class="action-bar">
            <button class="btn-secondary-action" @click="clearMdFile">取消</button>
            <button
              class="btn-primary-action"
              @click="importMarkdown"
              :disabled="!mdTitle || !mdYear || !mdQuestions.length"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="16 4 20 4 20 8" />
                <line x1="14" y1="10" x2="20" y2="4" />
                <path d="M22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
              </svg>
              导入到真题库
            </button>
          </div>
        </div>

        <!-- 导入中 -->
        <div v-if="mdImporting" class="parsing-status">
          <div class="parsing-spinner"></div>
          <p class="parsing-title">正在导入...</p>
        </div>

        <!-- 导入失败 -->
        <div v-if="mdError" class="parsing-status">
          <p class="parsing-title">导入失败</p>
          <p class="parsing-detail error-text">{{ mdError }}</p>
          <div style="margin-top: 16px">
            <button class="btn-secondary-action" @click="clearMdFile">重新选择</button>
          </div>
        </div>

        <!-- 导入成功 -->
        <div v-if="mdDone && mdPaperId" class="result-actions">
          <p v-if="mdWarnings.length" style="font-size: 0.8125rem; color: #f59e0b; margin: 0 0 8px">
            注意：{{ mdWarnings.join('；') }}
          </p>
          <button class="btn-primary-action" @click="goToMdPreview">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            查看导入结果
          </button>
          <button class="btn-secondary-action" @click="resetMdImport">导入新试卷</button>
        </div>
      </div>

      <!-- JSON 导入模式 -->
      <div class="json-import-area" v-if="mode === 'json'">
        <!-- 未选择文件时：上传区 -->
        <div
          v-if="!jsonFile && !jsonImporting && !jsonDone"
          class="drop-zone"
          :class="{ 'drop-zone--active': jsonDragOver }"
          @dragover.prevent="jsonDragOver = true"
          @dragleave.prevent="jsonDragOver = false"
          @drop.prevent="handleJsonDrop"
          @click="triggerJsonFileInput"
        >
          <div class="drop-icon-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p class="drop-title">拖拽 JSON 文件到此处</p>
          <p class="drop-hint">或点击此区域选择 .json 文件</p>
          <p class="drop-limit">支持符合题目数据格式的 JSON 文件</p>
        </div>

        <!-- JSON 文件已选择，编辑元数据 -->
        <div v-if="jsonFile && !jsonImporting && !jsonDone && !jsonError" class="json-edit-area">
          <div class="file-preview" style="text-align: center; margin-bottom: 20px">
            <div class="file-icon-wrap">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4f46e5"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p class="file-name-text">{{ jsonFile.name }}</p>
            <button class="btn-change" @click="clearJsonFile">重新选择</button>
          </div>

          <label class="field-label">试卷名称</label>
          <input v-model="jsonTitle" class="field-input" placeholder="输入试卷名称..." />

          <div class="meta-row">
            <div class="meta-field">
              <label class="field-label">考试类型</label>
              <select
                v-model="jsonExamType"
                class="field-input field-input--sm"
                :disabled="jsonUsesSectionSchema"
              >
                <option v-for="item in examTypeOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>
            <div class="meta-field">
              <label class="field-label">年份</label>
              <input
                v-model.number="jsonYear"
                type="number"
                class="field-input field-input--sm"
                :disabled="jsonUsesSectionSchema"
              />
            </div>
            <div class="meta-field">
              <label class="field-label">考试时长（分钟）</label>
              <input
                v-model.number="jsonDuration"
                type="number"
                class="field-input field-input--sm"
                :disabled="jsonUsesSectionSchema"
              />
              <p v-if="jsonUsesSectionSchema" class="field-hint">按考试分段规则自动计算</p>
            </div>
          </div>

          <div class="meta-row" style="margin-top: 12px">
            <div class="meta-field">
              <label class="field-label">
                {{ jsonUsesSectionSchema ? '套卷代码' : '套卷代码（可选）' }}
              </label>
              <input
                v-model="jsonCode"
                class="field-input field-input--sm"
                placeholder="如 ESAT-EQUIV-2023-M1-CHE-M2 或 TMUA-2023"
              />
              <p class="field-hint">用于识别整套试卷及报告展示，不代表学科</p>
            </div>
            <div class="meta-field">
              <label class="field-label">访问级别</label>
              <select v-model="jsonAccessTier" class="field-input field-input--sm">
                <option v-for="item in accessTierOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
              <p class="field-hint">免费卷可不限次数重测</p>
            </div>
            <div class="meta-field" style="display: flex; align-items: flex-end">
              <span style="font-size: 0.875rem; color: #475569"
                >共 <b>{{ jsonQuestions.length }}</b> 道题目</span
              >
            </div>
          </div>

          <!-- 题目预览列表 -->
          <div v-if="jsonModules.length" class="module-preview">
            <span v-for="module in jsonModules" :key="module.code">
              <b>{{ module.subject }}</b> · {{ module.count }} 题 · {{ module.duration }} 分钟
            </span>
          </div>
          <div class="json-preview-list" v-if="jsonQuestions.length">
            <p class="field-label" style="margin-top: 16px">题目预览</p>
            <div class="json-preview-item" v-for="q in jsonQuestions" :key="questionPreviewKey(q)">
              <span class="json-preview-num">{{
                q.module_question_number || q.number
              }}</span>
              <span v-if="q.subject" class="json-preview-module">{{ q.subject }}</span>
              <span class="json-preview-title">{{ truncateText(q.title, 60) }}</span>
              <span class="json-preview-opts">{{ q.options.length }} 个选项</span>
            </div>
          </div>

          <div class="action-bar">
            <button class="btn-secondary-action" @click="clearJsonFile">取消</button>
            <button
              class="btn-primary-action"
              @click="importJson"
              :disabled="!jsonTitle || !jsonYear"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="16 4 20 4 20 8" />
                <line x1="14" y1="10" x2="20" y2="4" />
                <path d="M22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
              </svg>
              导入到真题库
            </button>
          </div>
        </div>

        <!-- 导入中 -->
        <div v-if="jsonImporting" class="parsing-status">
          <div class="parsing-spinner"></div>
          <p class="parsing-title">正在导入...</p>
        </div>

        <!-- 导入失败 -->
        <div v-if="jsonError" class="parsing-status">
          <p class="parsing-title">导入失败</p>
          <p class="parsing-detail error-text">{{ jsonError }}</p>
          <div style="margin-top: 16px">
            <button class="btn-secondary-action" @click="clearJsonFile">重新选择</button>
          </div>
        </div>

        <!-- 导入成功 -->
        <div v-if="jsonDone && jsonPaperId" class="result-actions">
          <button class="btn-primary-action" @click="goToJsonPreview">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            查看导入结果
          </button>
          <button class="btn-secondary-action" @click="resetJsonImport">导入新试卷</button>
        </div>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".pdf,image/png,image/jpeg"
      class="hidden-input"
      @change="handleFileSelect"
    />
    <input
      ref="jsonFileInput"
      type="file"
      accept=".json,application/json"
      class="hidden-input"
      @change="handleJsonFileSelect"
    />
    <input
      ref="mdFileInput"
      type="file"
      accept=".md,text/markdown"
      class="hidden-input"
      @change="handleMdFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  createUploadTask,
  uploadPage,
  getParseTaskStatusData,
  retryParseTask,
  importJson as apiImportJson,
  importMarkdown as apiImportMarkdown,
} from '@/api/upload'
import { ElMessage } from 'element-plus'
import { renderPdfToBase64Pages, type RenderedPage } from '@/utils/pdfRenderer'
import { DEFAULT_EXAM_TYPE, EXAM_TYPE_OPTIONS, type ExamType } from '@/constants/examTypes'
import {
  PAPER_ACCESS_TIER,
  PAPER_ACCESS_TIER_OPTIONS,
  PAPER_TYPE,
  type PaperAccessTier,
} from '@/constants/paperTypes'
import type { PaperMetadata, ProjectQuestionInput, QuestionInput, StandardPaperJson } from '@/types'
import { getApiErrorMessage, hasApiErrorCode } from '@/utils/request'

const router = useRouter()
const route = useRoute()

const isQuestionBankSource = computed(() => route.query.source === 'questions')
const uploadBackPath = computed(() =>
  isQuestionBankSource.value ? '/admin/core-library/questions' : '/admin/core-library/exams',
)
const uploadBackLabel = computed(() =>
  isQuestionBankSource.value ? '返回试题库管理' : '返回真题库列表',
)

// 模式切换
const mode = ref<'markdown' | 'file' | 'json'>('markdown')

const fileInput = ref<HTMLInputElement | null>(null)
const jsonFileInput = ref<HTMLInputElement | null>(null)
const mdFileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const fileKind = ref<'pdf' | 'image'>('pdf')
const imagePreviewUrl = ref('')
const dragOver = ref(false)
const title = ref('')
const examType = ref(DEFAULT_EXAM_TYPE)
const year = ref(new Date().getFullYear())
const duration = ref(75)
const accessTier = ref<PaperAccessTier>(PAPER_ACCESS_TIER.MEMBER)
const examTypeOptions = EXAM_TYPE_OPTIONS
const accessTierOptions = PAPER_ACCESS_TIER_OPTIONS

const PDF_MAX_BYTES = 50 * 1024 * 1024
const IMG_MAX_BYTES = 10 * 1024 * 1024

function detectKind(f: File): 'pdf' | 'image' | null {
  if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) return 'pdf'
  if (/^image\/(png|jpe?g)$/i.test(f.type) || /\.(png|jpe?g)$/i.test(f.name)) return 'image'
  return null
}

const rendering = ref(false)
const renderCurrent = ref(0)
const renderTotal = ref(0)
const renderProgress = ref(0)

const parsing = ref(false)
const uploadDone = ref(false)
const parsingDone = ref(false)
const parsingFailed = ref(false)
const parseError = ref('')
const progress = ref(0)
const paperId = ref('')
let taskId = ''
let pollTimer: ReturnType<typeof setInterval> | null = null
let abortController: AbortController | null = null

// 缓存渲染后的页面，供重试使用
let cachedPages: RenderedPage[] = []

// JSON 导入状态
const jsonDragOver = ref(false)
const jsonFile = ref<File | null>(null)
const jsonTitle = ref('')
const jsonExamType = ref(DEFAULT_EXAM_TYPE)
const jsonYear = ref(new Date().getFullYear())
const jsonDuration = ref(75)
const jsonCode = ref('')
const jsonAccessTier = ref<PaperAccessTier>(PAPER_ACCESS_TIER.MEMBER)
const jsonMetadata = ref<PaperMetadata | null>(null)
const jsonQuestions = ref<QuestionInput[]>([])
const jsonDocument = ref<StandardPaperJson | null>(null)
const jsonModules = ref<Array<{ code: string; subject: string; duration: number; count: number }>>(
  [],
)
const jsonUsesSectionSchema = ref(false)
const jsonImporting = ref(false)
const jsonDone = ref(false)
const jsonError = ref('')
const jsonPaperId = ref('')

// Markdown 导入状态
const mdDragOver = ref(false)
const mdFile = ref<File | null>(null)
const mdTitle = ref('')
const mdExamType = ref(DEFAULT_EXAM_TYPE)
const mdYear = ref(new Date().getFullYear())
const mdDuration = ref(75)
const mdCode = ref('')
const mdAccessTier = ref<PaperAccessTier>(PAPER_ACCESS_TIER.MEMBER)
const mdMetadata = ref<PaperMetadata | null>(null)
const mdRawText = ref('')
const mdQuestions = ref<QuestionInput[]>([])
const mdModules = ref<Array<{ code: string; subject: string; duration: number; count: number }>>([])
const mdUsesSectionSchema = ref(false)
const mdJsonBlockCount = ref(0)
const mdImporting = ref(false)
const mdDone = ref(false)
const mdError = ref('')
const mdWarnings = ref<string[]>([])
const mdPaperId = ref('')

function truncateText(text: string, maxLen: number): string {
  if (!text) return ''
  const cleaned = text.replace(/\[\[(BS|NL|PARA|FIG)\]\]/g, ' ')
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) + '...' : cleaned
}

function normalizeExamType(value: unknown): ExamType {
  return EXAM_TYPE_OPTIONS.some((item) => item.value === value)
    ? (value as ExamType)
    : DEFAULT_EXAM_TYPE
}

function isPaperTypeValue(value: unknown): value is PaperMetadata['paperType'] {
  return Object.values(PAPER_TYPE).includes(value as PaperMetadata['paperType'])
}

const SECTION_PREVIEW_PROFILES: Record<
  string,
  { subject: string; duration: number; sectionType: 'paper' | 'subject' }
> = {
  paper1: {
    subject: 'Paper 1: Applications of Mathematical Knowledge',
    duration: 75,
    sectionType: 'paper',
  },
  paper2: {
    subject: 'Paper 2: Mathematical Reasoning',
    duration: 75,
    sectionType: 'paper',
  },
  maths1: { subject: 'Mathematics 1', duration: 40, sectionType: 'subject' },
  maths2: { subject: 'Mathematics 2', duration: 40, sectionType: 'subject' },
  physics: { subject: 'Physics', duration: 40, sectionType: 'subject' },
  chemistry: { subject: 'Chemistry', duration: 40, sectionType: 'subject' },
  biology: { subject: 'Biology', duration: 40, sectionType: 'subject' },
}

interface PreviewDocumentMetadata {
  code?: unknown
  title?: unknown
  paperName?: unknown
  year?: unknown
  duration?: unknown
  examType?: unknown
  paperType?: unknown
  accessTier?: unknown
  deliveryMode?: unknown
  totalQuestions?: unknown
  assemblyType?: unknown
  remarks?: unknown
}

interface PreviewModuleRow extends Record<string, unknown> {
  code?: unknown
  module_code?: unknown
  sectionType?: unknown
  order?: unknown
  subject?: unknown
  subject_code?: unknown
  duration?: unknown
  questions?: unknown[]
  items?: unknown[]
}

interface PreviewPaperDocument {
  metadata?: PreviewDocumentMetadata
  sections?: PreviewModuleRow[]
  modules?: PreviewModuleRow[]
  questions?: unknown[]
}

// 新版 sections 文档不携带计时字段，上传页仅按后端同一考试规则展示派生值。
function isSectionPaperDocument(
  raw: unknown,
): raw is PreviewPaperDocument & { sections: PreviewModuleRow[] } {
  return Boolean(
    raw && typeof raw === 'object' && Array.isArray((raw as { sections?: unknown }).sections),
  )
}

// JSON 预览边界先收窄为可检查的文档外形，字段合法性由后续标准校验逐项确认。
function toPreviewPaperDocument(raw: unknown): PreviewPaperDocument | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as PreviewPaperDocument
}

// 上传预览统一转为页面现有题目模型，正式入库仍由后端完成同一字段归一化和校验。
function normalizeProjectQuestionForPreview(
  question: ProjectQuestionInput,
  metadata: { examType?: string },
): QuestionInput {
  const classification = question?.classification
  const source = question?.source
  const learningAnalysis = question?.learningAnalysis
  return {
    ...question,
    content_blocks: Array.isArray(question?.contentBlocks)
      ? question.contentBlocks.map((block) =>
          block?.type === 'paragraph'
            ? { ...block, inline: block.align === 'center' ? false : true }
            : block,
        )
      : [],
    question_type: question?.questionType,
    subject: classification?.subject,
    subject_code: classification?.subjectCode,
    topic: classification?.topic,
    topic_code: classification?.topicCode,
    knowledge_points: Array.isArray(classification?.knowledgePoints)
      ? classification.knowledgePoints
      : [],
    examType: metadata?.examType,
    source_examType: source?.examType,
    year: source?.year,
    learning_analysis: learningAnalysis
      ? {
          correct_solution: learningAnalysis.correctSolution,
          exam_focus: learningAnalysis.examFocus,
          common_error_causes: learningAnalysis.commonErrorCauses,
          review_guidance: learningAnalysis.reviewGuidance,
        }
      : undefined,
  } as QuestionInput
}

// 页面编辑表单沿用统一元数据视图；新版文档缺省的时长和题量由 sections 规则派生。
function readStandardMetadata(raw: unknown): PaperMetadata | null {
  const document = toPreviewPaperDocument(raw)
  const metadata = document?.metadata
  if (!metadata || typeof metadata !== 'object') return null
  if (isSectionPaperDocument(document)) {
    if (!metadata.code || typeof metadata.code !== 'string') return null
    if (!metadata.title || typeof metadata.title !== 'string') return null
    if (typeof metadata.year !== 'number') return null
    if (metadata.examType !== 'TMUA' && metadata.examType !== 'ESAT') return null
    if (!isPaperTypeValue(metadata.paperType)) return null
    if (metadata.deliveryMode !== 'section_sequence') return null
    const expectedSectionCount = metadata.examType === 'TMUA' ? 2 : 3
    if (document.sections.length !== expectedSectionCount) return null
    const seenCodes = new Set<string>()
    const seenOrders = new Set<number>()
    const sectionRows = document.sections
    const validSections = sectionRows.every((section, index) => {
      const profile = SECTION_PREVIEW_PROFILES[String(section?.code)]
      const tmuaOrderIsValid =
        metadata.examType !== 'TMUA' ||
        (section?.code === (index === 0 ? 'paper1' : 'paper2') && section?.order === index + 1)
      const sectionQuestionCount = Array.isArray(section.questions) ? section.questions.length : 0
      const questionCountIsValid =
        metadata.examType === 'TMUA' ? sectionQuestionCount === 20 : sectionQuestionCount > 0
      const sectionCode = String(section?.code || '')
      const sectionOrder = Number(section?.order)
      const hasUniqueIdentity = !seenCodes.has(sectionCode) && !seenOrders.has(sectionOrder)
      seenCodes.add(sectionCode)
      seenOrders.add(sectionOrder)
      if (!profile) return false
      return (
        profile.sectionType === section?.sectionType &&
        Number.isInteger(section?.order) &&
        sectionOrder > 0 &&
        tmuaOrderIsValid &&
        hasUniqueIdentity &&
        Array.isArray(section?.questions) &&
        questionCountIsValid
      )
    })
    if (!validSections) return null
    if (metadata.examType === 'ESAT' && !seenCodes.has('maths1')) return null
    const totalQuestions = sectionRows.reduce(
      (sum: number, section) =>
        sum + (Array.isArray(section?.questions) ? section.questions.length : 0),
      0,
    )
    const duration = sectionRows.reduce(
      (sum: number, section) =>
        sum + (SECTION_PREVIEW_PROFILES[String(section?.code)]?.duration || 0),
      0,
    )
    return {
      paperName: metadata.title,
      year: metadata.year,
      duration,
      examType: metadata.examType,
      paperType: metadata.paperType,
      accessTier:
        metadata.accessTier === PAPER_ACCESS_TIER.FREE
          ? PAPER_ACCESS_TIER.FREE
          : PAPER_ACCESS_TIER.MEMBER,
      totalQuestions,
      deliveryMode: 'section_sequence',
      assemblyType: typeof metadata.assemblyType === 'string' ? metadata.assemblyType : undefined,
      remarks: typeof metadata.remarks === 'string' ? metadata.remarks : undefined,
    }
  }
  if (!metadata.paperName || typeof metadata.paperName !== 'string') return null
  if (typeof metadata.year !== 'number') return null
  if (typeof metadata.duration !== 'number') return null
  if (!EXAM_TYPE_OPTIONS.some((item) => item.value === metadata.examType)) return null
  if (!isPaperTypeValue(metadata.paperType)) return null
  if (typeof metadata.totalQuestions !== 'number') return null
  return metadata as PaperMetadata
}

// 上传预览接受新版 sections，并兼容 modules[].questions、modules[].items 和扁平 questions。
function readPaperDocumentPreview(raw: unknown): {
  metadata: PaperMetadata
  questions: QuestionInput[]
  modules: Array<{ code: string; subject: string; duration: number; count: number }>
  isSectionSchema: boolean
} | null {
  const document = toPreviewPaperDocument(raw)
  if (!document) return null
  const metadata = readStandardMetadata(document)
  if (!metadata) return null

  const isSectionSchema = isSectionPaperDocument(document)
  const rawModuleRows = isSectionSchema
    ? document.sections
    : Array.isArray(document.modules)
      ? document.modules
      : Array.isArray(document.questions) &&
          document.questions.length > 0 &&
          document.questions.every(
            (item) =>
              Boolean(item) &&
              typeof item === 'object' &&
              Array.isArray((item as PreviewModuleRow).items),
          )
        ? (document.questions as PreviewModuleRow[])
        : null
  const moduleRows =
    rawModuleRows?.map((module) => ({
      ...module,
      questions: Array.isArray(module.questions)
        ? module.questions
        : Array.isArray(module.items)
          ? module.items
          : [],
    })) || null

  if (moduleRows) {
    const modules = moduleRows.map((module, moduleIndex: number) => ({
      code: String(
        module.code ||
          module.module_code ||
          module.subject ||
          `module-${moduleIndex + 1}`,
      ),
      subject: String(
        module.subject ||
          SECTION_PREVIEW_PROFILES[String(module.code)]?.subject ||
          `Module ${moduleIndex + 1}`,
      ),
      duration:
        Number(module.duration) || SECTION_PREVIEW_PROFILES[String(module.code)]?.duration || 0,
      count: Array.isArray(module.questions) ? module.questions.length : 0,
    }))
    const questions = moduleRows.flatMap((module, moduleIndex: number) => {
      const moduleQuestions = module.questions as QuestionInput[]
      const moduleCode = String(module.code || module.module_code || '') as QuestionInput['module_code']
      const moduleSubject = typeof module.subject === 'string' ? module.subject : undefined
      const moduleSubjectCode =
        typeof module.subject_code === 'string' || typeof module.subject_code === 'number'
          ? module.subject_code
          : ''
      return moduleQuestions.map((rawQuestion, itemIndex: number) => {
        const question = isSectionSchema
          ? normalizeProjectQuestionForPreview(
              rawQuestion as unknown as ProjectQuestionInput,
              metadata,
            )
          : rawQuestion
        return {
          ...question,
          number: questionsBeforeModule(moduleRows, moduleIndex) + itemIndex + 1,
          module_code: moduleCode,
          module_order: Number(module.order) || moduleIndex + 1,
          module_question_number: rawQuestion.number || itemIndex + 1,
          subject: question.subject || moduleSubject,
          subject_code: question.subject_code || moduleSubjectCode,
        }
      })
    })
    if (metadata.totalQuestions !== questions.length) return null
    return { metadata, questions, modules, isSectionSchema }
  }

  if (!Array.isArray(document.questions) || metadata.totalQuestions !== document.questions.length)
    return null
  return {
    metadata,
    questions: document.questions as QuestionInput[],
    modules: [],
    isSectionSchema: false,
  }
}

// Paper 1/2 内题号都会从 1 开始，预览列表使用稳定 code 避免重复 Vue key。
function questionPreviewKey(question: QuestionInput): string {
  return (
    question.code ||
    `${question.module_code || 'flat'}-${question.module_question_number || question.number}`
  )
}

function questionsBeforeModule(modules: PreviewModuleRow[], targetIndex: number): number {
  return modules
    .slice(0, targetIndex)
    .reduce(
      (sum, module) =>
        sum +
        (Array.isArray(module?.questions)
          ? module.questions.length
          : Array.isArray(module?.items)
            ? module.items.length
            : 0),
      0,
    )
}

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (abortController) abortController.abort()
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
})

function triggerFileInput(): void {
  if (!parsing.value && !rendering.value) fileInput.value?.click()
}

function handleFileSelect(e: Event): void {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) selectFile(f)
}

function handleDrop(e: DragEvent): void {
  dragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) selectFile(f)
}

function selectFile(f: File): void {
  const kind = detectKind(f)
  if (!kind) {
    ElMessage.warning('仅支持 PDF / PNG / JPG 文件')
    return
  }
  const limit = kind === 'pdf' ? PDF_MAX_BYTES : IMG_MAX_BYTES
  if (f.size > limit) {
    ElMessage.warning(`文件超过大小限制（${kind === 'pdf' ? '50MB' : '10MB'}）`)
    return
  }
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
  }
  file.value = f
  fileKind.value = kind
  title.value = f.name.replace(/\.(pdf|png|jpe?g)$/i, '')
  if (kind === 'image') {
    imagePreviewUrl.value = URL.createObjectURL(f)
  }
}

function clearFile(): void {
  file.value = null
  fileKind.value = 'pdf'
  title.value = ''
  accessTier.value = PAPER_ACCESS_TIER.MEMBER
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
  }
  cachedPages = []
}

function resetUpload(): void {
  file.value = null
  fileKind.value = 'pdf'
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
  }
  title.value = ''
  examType.value = DEFAULT_EXAM_TYPE
  accessTier.value = PAPER_ACCESS_TIER.MEMBER
  rendering.value = false
  parsing.value = false
  uploadDone.value = false
  parsingDone.value = false
  parsingFailed.value = false
  parseError.value = ''
  progress.value = 0
  paperId.value = ''
  taskId = ''
  cachedPages = []
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

// 单题图片直接读原始字节为 base64，不做 Canvas 重编码。
// 之前对 PNG 做 0.9 JPEG 重编码会压糊电路图细线，导致 Qwen 识别失败返回空数组。
async function imageFileToBase64(f: File): Promise<{ base64: string; mimeType: string }> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(f)
  })
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!m || !m[1] || !m[2]) throw new Error('无法读取图片 base64')
  const mimeType = /png/i.test(m[1]) ? 'image/png' : 'image/jpeg'
  return { base64: m[2], mimeType }
}

async function startUpload(): Promise<void> {
  if (!file.value) return

  rendering.value = true
  parsingFailed.value = false
  parseError.value = ''

  // 阶段 1：收集页面 base64（PDF 走 pdf.js 渲染；单题图片直接读原始 bytes，不重编码）
  let pages: RenderedPage[]
  try {
    if (fileKind.value === 'image') {
      renderTotal.value = 1
      renderCurrent.value = 0
      renderProgress.value = 10
      const { base64, mimeType } = await imageFileToBase64(file.value)
      pages = [{ page: 1, base64, mimeType }]
      renderCurrent.value = 1
      renderProgress.value = 50
    } else {
      pages = await renderPdfToBase64Pages(file.value, {
        scale: 1.5,
        quality: 0.85,
        onProgress: (current, total) => {
          renderCurrent.value = current
          renderTotal.value = total
          renderProgress.value = Math.round((current / total) * 50)
        },
      })
    }

    if (pages.length === 0) {
      parsingFailed.value = true
      parseError.value = fileKind.value === 'image' ? '图片处理失败' : 'PDF 无可识别的内容页面'
      rendering.value = false
      return
    }

    cachedPages = pages
  } catch (e: unknown) {
    rendering.value = false
    parsingFailed.value = true
    const prefix = fileKind.value === 'image' ? '图片处理失败：' : 'PDF 渲染失败：'
    parseError.value = prefix + getApiErrorMessage(e, '未知错误')
    return
  }

  // 阶段 2：创建任务
  parsing.value = true
  abortController = new AbortController()

  try {
    const createRes = await createUploadTask({
      title: title.value,
      year: year.value,
      duration: duration.value,
      examType: examType.value,
      totalPages: pages.length,
      paperType: PAPER_TYPE.REAL_PAPER,
      accessTier: accessTier.value,
    })
    taskId = createRes.taskId
    paperId.value = createRes.paperId
  } catch (e: unknown) {
    rendering.value = false
    if (!hasApiErrorCode(e, 'ERR_CANCELED')) {
      parsingFailed.value = true
      parseError.value = getApiErrorMessage(e, '创建任务失败')
    }
    return
  }

  // 阶段 3：逐页上传（渲染完成一页立刻 POST，不等全部渲染完）
  for (const p of pages) {
    try {
      await uploadPage(taskId!, {
        page: p.page!,
        base64: p.base64!,
        mimeType: p.mimeType!,
        totalPages: pages.length,
      })
    } catch (e: unknown) {
      if (hasApiErrorCode(e, 'ERR_CANCELED')) return
      console.error(`Page ${p.page} upload failed:`, getApiErrorMessage(e, '上传失败'))
    }

    renderCurrent.value = p.page
    renderProgress.value = 50 + Math.round((p.page / pages.length) * 50)
  }

  rendering.value = false
  uploadDone.value = true
  pollTask()
}

function pollTask(): void {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(async () => {
    try {
      const res = await getParseTaskStatusData(taskId)
      progress.value = res.progress || 0

      if (res.status === 'completed') {
        if (pollTimer) {
          clearInterval(pollTimer)
          pollTimer = null
        }
        parsingDone.value = true
      }
      if (res.status === 'failed') {
        if (pollTimer) {
          clearInterval(pollTimer)
          pollTimer = null
        }
        parsingFailed.value = true
        parseError.value = res.error || '解析失败，请重试'
      }
    } catch {
      // 轮询错误静默处理
    }
  }, 2000)
}

async function retryParse(): Promise<void> {
  // 新流程：用缓存的渲染页面重新上传
  if (cachedPages.length > 0) {
    parsingFailed.value = false
    parseError.value = ''
    progress.value = 0
    uploadDone.value = false
    rendering.value = true

    abortController = new AbortController()

    // 重新创建任务
    try {
      const createRes = await createUploadTask({
        title: title.value,
        year: year.value,
        duration: duration.value,
        examType: examType.value,
        totalPages: cachedPages.length,
        paperType: PAPER_TYPE.REAL_PAPER,
        accessTier: accessTier.value,
      })
      taskId = createRes.taskId
      paperId.value = createRes.paperId
    } catch (e: unknown) {
      rendering.value = false
      if (!hasApiErrorCode(e, 'ERR_CANCELED')) {
        parsingFailed.value = true
        parseError.value = getApiErrorMessage(e, '重试失败')
      }
      return
    }

    // 逐页重新上传
    for (const p of cachedPages) {
      try {
        await uploadPage(taskId!, {
          page: p.page!,
          base64: p.base64!,
          mimeType: p.mimeType!,
          totalPages: cachedPages.length,
        })
      } catch (e: unknown) {
        if (hasApiErrorCode(e, 'ERR_CANCELED')) return
        console.error(`Retry page ${p.page} upload failed:`, getApiErrorMessage(e, '上传失败'))
      }
      renderCurrent.value = p.page
      renderProgress.value = Math.round((p.page / cachedPages.length) * 100)
    }

    rendering.value = false
    uploadDone.value = true
    pollTask()
    return
  }

  // 旧流程 fallback
  if (!taskId) return
  parsingFailed.value = false
  parseError.value = ''
  progress.value = 0

  try {
    await retryParseTask(taskId)
    pollTask()
  } catch (e: unknown) {
    parsingFailed.value = true
    parseError.value = getApiErrorMessage(e, '重试失败')
  }
}

function goToPreview(): void {
  router.push(`/admin/core-library/exams/${paperId.value}`)
}

function previewPathForPaperType(id: string, paperType?: PaperMetadata['paperType']): string {
  return paperType === PAPER_TYPE.AI_PAPER
    ? `/admin/core-library/questions/${id}`
    : `/admin/core-library/exams/${id}`
}

// ---- JSON 导入逻辑 ----

function triggerJsonFileInput(): void {
  jsonFileInput.value?.click()
}

function handleJsonDrop(e: DragEvent): void {
  jsonDragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) processJsonFile(f)
}

function handleJsonFileSelect(e: Event): void {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) processJsonFile(f)
}

function processJsonFile(f: File): void {
  if (!f.name.endsWith('.json') && f.type !== 'application/json') {
    ElMessage.warning('仅支持 .json 文件')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const raw = JSON.parse(reader.result as string)
      const preview = readPaperDocumentPreview(raw)
      if (!preview) {
        ElMessage.warning('JSON 必须使用新版 sections 或受支持的历史试卷结构')
        return
      }

      jsonMetadata.value = preview.metadata
      jsonQuestions.value = preview.questions
      jsonModules.value = preview.modules
      jsonUsesSectionSchema.value = preview.isSectionSchema
      jsonDocument.value = raw as StandardPaperJson
      jsonTitle.value = preview.metadata.paperName
      jsonExamType.value = normalizeExamType(preview.metadata.examType)
      jsonYear.value = preview.metadata.year
      jsonDuration.value = preview.metadata.duration
      jsonCode.value = raw.metadata?.code || raw.code || ''
      jsonAccessTier.value =
        preview.metadata.accessTier === PAPER_ACCESS_TIER.FREE
          ? PAPER_ACCESS_TIER.FREE
          : PAPER_ACCESS_TIER.MEMBER
      jsonFile.value = f
      jsonError.value = ''
    } catch {
      ElMessage.error('JSON 格式解析失败，请检查文件内容')
    }
  }
  reader.readAsText(f)
}

function clearJsonFile(): void {
  jsonFile.value = null
  jsonTitle.value = ''
  jsonExamType.value = DEFAULT_EXAM_TYPE
  jsonYear.value = new Date().getFullYear()
  jsonDuration.value = 75
  jsonCode.value = ''
  jsonAccessTier.value = PAPER_ACCESS_TIER.MEMBER
  jsonMetadata.value = null
  jsonQuestions.value = []
  jsonDocument.value = null
  jsonModules.value = []
  jsonUsesSectionSchema.value = false
  jsonError.value = ''
  jsonDone.value = false
  jsonPaperId.value = ''
}

function resetJsonImport(): void {
  clearJsonFile()
  jsonImporting.value = false
}

async function importJson(): Promise<void> {
  if (!jsonMetadata.value || !jsonDocument.value) {
    ElMessage.warning('请先选择标准 JSON 文件')
    return
  }
  if (!jsonTitle.value.trim()) {
    ElMessage.warning('请填写试卷名称')
    return
  }
  if (!jsonQuestions.value.length) {
    ElMessage.warning('没有可导入的题目')
    return
  }

  jsonImporting.value = true
  jsonError.value = ''

  try {
    const metadata = buildEditedMetadata(
      jsonMetadata.value,
      jsonTitle.value,
      jsonExamType.value,
      jsonYear.value,
      jsonDuration.value,
      jsonAccessTier.value,
    )
    const editedDocument = buildEditedPaperDocument(jsonDocument.value, metadata, jsonCode.value)
    const res = await apiImportJson(editedDocument)
    jsonMetadata.value = metadata
    jsonPaperId.value = res.id
    jsonDone.value = true
    if (res.warnings?.length) {
      ElMessage.warning(res.warnings.join('；'))
    }
  } catch (e: unknown) {
    jsonError.value = getApiErrorMessage(e, '导入失败')
  } finally {
    jsonImporting.value = false
  }
}

function goToJsonPreview(): void {
  router.push(previewPathForPaperType(jsonPaperId.value, jsonMetadata.value?.paperType))
}

// ---- Markdown 导入逻辑 ----

function triggerMdFileInput(): void {
  mdFileInput.value?.click()
}

function handleMdDrop(e: DragEvent): void {
  mdDragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) processMdFile(f)
}

function handleMdFileSelect(e: Event): void {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) processMdFile(f)
}

function processMdFile(f: File): void {
  if (!f.name.endsWith('.md') && f.type !== 'text/markdown') {
    ElMessage.warning('仅支持 .md 文件')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const rawMd = reader.result as string
      mdRawText.value = rawMd

      // 前端提取 JSON 代码块做预览
      const jsonBlockRe = /```json\s*\n([\s\S]*?)\n\s*```/g
      let parsedDocument: ReturnType<typeof readPaperDocumentPreview> = null
      let parsedSource: { metadata?: { code?: string }; code?: string } | null = null
      let blockCount = 0
      let match: RegExpExecArray | null

      while ((match = jsonBlockRe.exec(rawMd)) !== null) {
        blockCount++
        try {
          const parsed = JSON.parse(match![1]!.trim())
          parsedDocument = readPaperDocumentPreview(parsed)
          parsedSource = parsed
        } catch {
          // 某个块解析失败，跳过
        }
      }

      if (blockCount === 0) {
        ElMessage.warning('未找到 JSON 代码块（需要 ```json ... ``` 格式）')
        return
      }
      if (blockCount > 1) {
        ElMessage.warning('标准 Markdown 只能包含一个完整 JSON 代码块')
        return
      }
      if (!parsedDocument) {
        ElMessage.warning('JSON 代码块必须使用新版 sections 或受支持的历史试卷结构')
        return
      }

      mdJsonBlockCount.value = blockCount
      mdMetadata.value = parsedDocument.metadata
      mdQuestions.value = parsedDocument.questions
      mdModules.value = parsedDocument.modules
      mdUsesSectionSchema.value = parsedDocument.isSectionSchema
      mdTitle.value = parsedDocument.metadata.paperName
      mdExamType.value = normalizeExamType(parsedDocument.metadata.examType)
      mdYear.value = parsedDocument.metadata.year
      mdDuration.value = parsedDocument.metadata.duration
      mdCode.value = parsedSource?.metadata?.code || parsedSource?.code || ''
      mdAccessTier.value =
        parsedDocument.metadata.accessTier === PAPER_ACCESS_TIER.FREE
          ? PAPER_ACCESS_TIER.FREE
          : PAPER_ACCESS_TIER.MEMBER
      mdFile.value = f
      mdError.value = ''
      mdWarnings.value = []
    } catch {
      ElMessage.error('文件读取失败')
    }
  }
  reader.readAsText(f)
}

function clearMdFile(): void {
  mdFile.value = null
  mdTitle.value = ''
  mdExamType.value = DEFAULT_EXAM_TYPE
  mdYear.value = new Date().getFullYear()
  mdDuration.value = 75
  mdCode.value = ''
  mdAccessTier.value = PAPER_ACCESS_TIER.MEMBER
  mdMetadata.value = null
  mdRawText.value = ''
  mdQuestions.value = []
  mdModules.value = []
  mdUsesSectionSchema.value = false
  mdJsonBlockCount.value = 0
  mdError.value = ''
  mdWarnings.value = []
  mdDone.value = false
  mdPaperId.value = ''
}

function resetMdImport(): void {
  clearMdFile()
  mdImporting.value = false
}

async function importMarkdown(): Promise<void> {
  if (!mdMetadata.value) {
    ElMessage.warning('请先选择包含标准 JSON 代码块的 Markdown 文件')
    return
  }
  if (!mdTitle.value.trim()) {
    ElMessage.warning('请填写试卷名称')
    return
  }
  if (!mdRawText.value) {
    ElMessage.warning('没有可导入的内容')
    return
  }

  mdImporting.value = true
  mdError.value = ''
  mdWarnings.value = []

  try {
    const metadata = buildEditedMetadata(
      mdMetadata.value,
      mdTitle.value,
      mdExamType.value,
      mdYear.value,
      mdDuration.value,
      mdAccessTier.value,
    )
    const res = await apiImportMarkdown({
      markdown: buildEditedMarkdown(mdRawText.value, metadata, mdCode.value),
      code: mdCode.value || undefined,
    })
    mdMetadata.value = metadata
    mdPaperId.value = res.id
    mdWarnings.value = res.warnings || []
    mdDone.value = true
  } catch (e: unknown) {
    mdError.value = getApiErrorMessage(e, '导入失败')
  } finally {
    mdImporting.value = false
  }
}

function goToMdPreview(): void {
  router.push(previewPathForPaperType(mdPaperId.value, mdMetadata.value?.paperType))
}

function buildEditedMetadata(
  metadata: PaperMetadata,
  paperName: string,
  examType: ExamType,
  year: number,
  duration: number,
  accessTier: PaperAccessTier,
): PaperMetadata {
  return {
    ...metadata,
    paperName: paperName.trim(),
    examType,
    year: Number(year),
    duration: Number(duration),
    accessTier,
  }
}

// 新版文档只回写它声明的元数据字段，避免把 duration 等考试规则重新塞入上传 JSON。
function buildEditedPaperDocument(
  document: StandardPaperJson,
  metadata: PaperMetadata,
  code: string,
): StandardPaperJson {
  if ('sections' in document && Array.isArray(document.sections)) {
    return {
      ...document,
      metadata: {
        ...document.metadata,
        code: code.trim() || document.metadata.code,
        title: metadata.paperName,
        examType: metadata.examType,
        year: metadata.year,
        paperType: metadata.paperType,
        accessTier: metadata.accessTier,
      },
    } as StandardPaperJson
  }
  return {
    ...document,
    ...(code.trim() ? { code: code.trim() } : {}),
    metadata,
  } as StandardPaperJson
}

// Markdown 仍只是 JSON 容器，编辑后保持原文档采用的 sections 或兼容结构。
function buildEditedMarkdown(markdown: string, metadata: PaperMetadata, code: string): string {
  const jsonBlockRe = /```json\s*\n([\s\S]*?)\n\s*```/
  return markdown.replace(jsonBlockRe, (_full, rawJson: string) => {
    const parsed = JSON.parse(rawJson.trim()) as StandardPaperJson
    const editedDocument = buildEditedPaperDocument(parsed, metadata, code)
    return `\`\`\`json\n${JSON.stringify(editedDocument, null, 2)}\n\`\`\``
  })
}
</script>

<style scoped lang="scss">
.upload-page {
  min-height: 100%;
}

.page-top-bar {
  padding: 28px 40px 0;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s ease;
  svg {
    width: 16px;
    height: 16px;
  }
  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }
}

.page-body {
  padding: 24px 40px 48px;
}

.section-header {
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

.upload-area {
  max-width: 620px;
}

.drop-zone {
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  padding: 52px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;

  &:hover {
    border-color: #c7d2fe;
    background: #fafaff;
  }
  &--active {
    border-color: #4f46e5;
    background: #eef2ff;
  }
}

.drop-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  svg {
    width: 28px;
    height: 28px;
  }
}

.drop-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 6px;
}
.drop-hint {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0 0 6px;
}
.drop-limit {
  font-size: 0.75rem;
  color: #cbd5e1;
  margin: 0;
}

.file-preview {
  text-align: center;
}
.file-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  svg {
    width: 28px;
    height: 28px;
  }
}
.file-name-text {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px;
  word-break: break-all;
}
.file-size-text {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.file-kind-badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  &.kind-pdf {
    background: #eef2ff;
    color: #4f46e5;
  }
  &.kind-image {
    background: #ecfeff;
    color: #0891b2;
  }
}
.image-thumb-wrap {
  margin: 0 auto 12px;
  max-width: 320px;
}
.image-thumb {
  max-width: 100%;
  max-height: 240px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: block;
  margin: 0 auto;
}
.btn-change {
  background: none;
  border: none;
  color: #4f46e5;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 6px;
  &:hover {
    background: #eef2ff;
  }
}

.parsing-status {
  text-align: center;
}
.parsing-spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 0 auto 16px;
  border: 4px solid #eef2ff;
  border-top-color: #4f46e5;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.parsing-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 6px;
}
.parsing-detail {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
}
.parsing-detail.error-text {
  color: #ef4444;
}

.title-edit-area {
  margin-top: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
}

.field-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}
.field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 4px 0 0;
}

.field-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #0f172a;
  outline: none;
  font-family: inherit;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  &::placeholder {
    color: #cbd5e1;
  }
  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  &--sm {
    width: 100%;
  }
}

.meta-row {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}
.meta-field {
  flex: 1;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-primary-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  svg {
    width: 16px;
    height: 16px;
  }
  &:hover:not(:disabled) {
    background: #6366f1;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  background: #ffffff;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  svg {
    width: 16px;
    height: 16px;
  }
  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
}

.progress-area {
  margin-top: 20px;
}
.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.progress-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #4f46e5);
  border-radius: 4px;
  transition: width 0.5s ease;
}
.progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4f46e5;
  min-width: 36px;
}
.progress-detail {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 8px 0 0;
  text-align: center;
}

.result-actions {
  display: flex;
  gap: 12px;
}
.mt-20 {
  margin-top: 20px;
}

.hidden-input {
  display: none;
}

// 模式切换标签
.mode-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 4px;
  width: fit-content;
}
.mode-tab {
  padding: 8px 20px;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  &:hover {
    color: #0f172a;
  }
  &--active {
    background: #ffffff;
    color: #4f46e5;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
}

// JSON 导入区域
.json-import-area {
  max-width: 620px;
}
.json-edit-area {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
}
.json-preview-list {
  max-height: 280px;
  overflow-y: auto;
  margin-top: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.module-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.module-preview span {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  color: #64748b;
  font-size: 0.75rem;
}
.json-preview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8125rem;
  &:last-child {
    border-bottom: none;
  }
}
.json-preview-num {
  min-width: 28px;
  height: 24px;
  border-radius: 6px;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}
.json-preview-title {
  flex: 1;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.json-preview-module {
  min-width: 86px;
  color: #6366f1;
  font-size: 0.75rem;
  font-weight: 600;
}
.json-preview-opts {
  color: #94a3b8;
  font-size: 0.75rem;
  white-space: nowrap;
}
</style>
