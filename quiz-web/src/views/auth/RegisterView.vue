<template>
  <div class="register-page">
    <NavBar />

    <main class="register-main">
      <section class="register-card">
        <div class="register-brand">
          <span class="brand-mark">G5</span>
        </div>
        <h1 class="register-title">创建账号</h1>
        <p class="register-subtitle">注册后即可查看完整诊断报告</p>

        <el-form
          ref="formRef"
          class="register-form"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              autocomplete="username"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="电子邮箱" prop="email">
            <el-input v-model="form.email" placeholder="example@mail.com" autocomplete="email" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              autocomplete="new-password"
              show-password
            />
            <template #extra>
              <span class="field-hint">8-32 位，需要包含字母和数字</span>
            </template>
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="再次输入密码"
              autocomplete="new-password"
              show-password
            />
          </el-form-item>

          <el-form-item label="备考类型（可多选）">
            <div class="exam-type-group">
              <label
                v-for="et in examTypes"
                :key="et.value"
                class="exam-type-chip"
                :class="{ 'exam-type-chip--active': selectedExamTypes.includes(et.value) }"
              >
                <input
                  type="checkbox"
                  :value="et.value"
                  :checked="selectedExamTypes.includes(et.value)"
                  class="sr-only"
                  @change="toggleExamType(et.value)"
                />
                {{ et.label }}
              </label>
            </div>
          </el-form-item>

          <el-form-item v-if="selectedExamTypes.length" label="备考科目">
            <div v-for="et in selectedExamTypes" :key="et" class="subject-group">
              <span class="subject-exam-label"
                >{{ examTypeLabel(et) }}{{ et === 'ESAT' ? '（最多选 3 科）' : '' }}</span
              >
              <div class="subject-chip-group">
                <label
                  v-for="sub in examSubjects[et]"
                  :key="sub"
                  class="subject-chip"
                  :class="{
                    'subject-chip--active': selectedSubjects[et]?.includes(sub),
                    'subject-chip--required': isSubjectRequired(et, sub),
                  }"
                >
                  <input
                    type="checkbox"
                    :value="sub"
                    :checked="selectedSubjects[et]?.includes(sub)"
                    :disabled="isSubjectDisabled(et, sub)"
                    class="sr-only"
                    @change="toggleSubject(et, sub)"
                  />
                  {{ sub }}
                </label>
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="register-submit button_primary"
              :loading="auth.loading"
              native-type="submit"
            >
              {{ auth.loading ? '注册中...' : '注册' }}
            </el-button>
          </el-form-item>
        </el-form>

        <p class="register-footnote">
          已有账号？
          <router-link to="/login" class="form-link">去登录</router-link>
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// 注册页，用于创建账号并进入登录态。
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import { useAuthStore } from '@/stores/auth'
import { getMember } from '@/api/member'
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
} from '@/utils/validation'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// 复用共享校验规则，确保注册页与后端基础规则保持一致。
const rules: FormRules = {
  username: [
    {
      validator: (_rule, value: string, callback) => {
        const result = validateUsername(value)
        result.valid ? callback() : callback(new Error(result.message))
      },
      trigger: 'blur',
    },
  ],
  email: [
    {
      validator: (_rule, value: string, callback) => {
        const result = validateEmail(value)
        result.valid ? callback() : callback(new Error(result.message))
      },
      trigger: 'blur',
    },
  ],
  password: [
    {
      validator: (_rule, value: string, callback) => {
        const result = validatePassword(value)
        result.valid ? callback() : callback(new Error(result.message))
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    {
      validator: (_rule, value: string, callback) => {
        const result = validateConfirmPassword(form.password, value)
        result.valid ? callback() : callback(new Error(result.message))
      },
      trigger: 'blur',
    },
  ],
}

const examTypes = [
  { value: 'ESAT', label: 'ESAT' },
  { value: 'TMUA', label: 'TMUA' },
  { value: 'STEP', label: 'STEP' },
] as const

const examSubjects: Record<string, string[]> = {
  ESAT: ['数学1', '数学2', '物理', '化学', '生物'],
  TMUA: ['数学'],
  STEP: ['数学'],
}

const examRequiredSubjects: Record<string, string[]> = {
  ESAT: ['数学1'],
  TMUA: ['数学'],
  STEP: ['数学'],
}

// 注册时保存备考偏好，后续用于个人中心和各考试类型默认展示。
const selectedExamTypes = ref<string[]>([])
const selectedSubjects = ref<Record<string, string[]>>({})
const ESAT_MAX_SUBJECTS = 3

function examTypeLabel(value: string): string {
  return examTypes.find((e) => e.value === value)?.label || value
}

function isSubjectRequired(examType: string, subject: string): boolean {
  return (examRequiredSubjects[examType] || []).includes(subject)
}

function isSubjectDisabled(examType: string, subject: string): boolean {
  if (isSubjectRequired(examType, subject)) return true
  if (examType === 'ESAT') {
    const current = selectedSubjects.value.ESAT || []
    return current.length >= ESAT_MAX_SUBJECTS && !current.includes(subject)
  }
  return false
}

function toggleExamType(value: string): void {
  const idx = selectedExamTypes.value.indexOf(value)
  if (idx >= 0) {
    selectedExamTypes.value.splice(idx, 1)
    delete selectedSubjects.value[value]
  } else {
    selectedExamTypes.value.push(value)
    // 必选科目需要在选择考试类型时自动带入。
    selectedSubjects.value[value] = [...(examRequiredSubjects[value] || [])]
  }
}

function toggleSubject(examType: string, subject: string): void {
  if (isSubjectDisabled(examType, subject)) return
  const subs = selectedSubjects.value[examType] || []
  const idx = subs.indexOf(subject)
  if (idx >= 0) subs.splice(idx, 1)
  else subs.push(subject)
  selectedSubjects.value[examType] = subs
}

const handleSubmit = async (): Promise<void> => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  try {
    const examPrefs = selectedExamTypes.value.map((et) => ({
      examType: et,
      subjects: selectedSubjects.value[et] || [],
    }))
    await auth.register(form.username, form.email, form.password, form.confirmPassword, examPrefs)
    const memberCtx = await getMember()
    auth.setMemberContext(memberCtx)
    router.push('/')
  } catch {
    // 错误信息已写入 auth.error。
  }
}
</script>

<style scoped lang="scss">
.register-page {
  --color-primary: #4f46e5;
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --shadow-card: 0 4px 24px -4px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
}

.register-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) 1rem;
}

.register-card {
  width: 100%;
  max-width: 440px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-12) var(--space-10);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.register-brand {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: var(--color-text);
  color: var(--color-text-inverse);
  border-radius: var(--radius-xl);
  font-size: 1.5rem;
  font-weight: 700;
}

.register-title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.register-subtitle {
  margin: 0 0 var(--space-8);
  font-size: 0.938rem;
  color: var(--color-text-muted);
}

.register-form {
  text-align: left;
}

.field-hint {
  font-size: 0.813rem;
  color: var(--color-text-muted);
}

.form-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.register-submit {
  width: 100%;
}

.register-footnote {
  margin: var(--space-8) 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.exam-type-group,
.subject-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.exam-type-chip,
.subject-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--color-primary);
  }
}

.exam-type-chip--active,
.subject-chip--active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.subject-chip--required {
  cursor: not-allowed;
}

.subject-group {
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
}

.subject-exam-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.813rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

@media (max-width: 640px) {
  .register-card {
    padding: var(--space-10) 1.5rem;
    border-radius: var(--radius-xl);
  }
}
</style>
