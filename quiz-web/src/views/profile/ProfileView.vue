<template>
  <!-- 学生个人中心：整合个人档案、会员权益、报考目标与交易记录。 -->
  <div class="profile-page">
    <!--
      THESIS: 个人中心是一张可继续编辑的升学档案，不是统计卡片集合。
      OWN-WORLD: 冷白档案纸、柔紫会员区、细线信息表与轻量升学插画。
      STORY: 学生先确认身份、网络与目标，再查看当前权益和订单。
      FIRST VIEWPORT: 标题下是一张横向个人档案，下一行并列会员权益与目标偏好。
      FORM: 依据用户截图重建的桌面档案仪表板，保留导航栏同宽的流体外壳。
    -->
    <NavBar :show-exam-switcher="false" />

    <main class="profile-shell">
      <header class="page-heading">
        <div>
          <h1>个人中心</h1>
          <p>管理您的个人信息与升学规划</p>
        </div>
      </header>

      <section class="profile-identity-card" aria-labelledby="profile-student-name">
        <div class="profile-avatar-wrap">
          <div class="avatar-frame">
            <img
              v-if="auth.user?.avatar"
              :src="auth.user?.avatar || ''"
              :alt="`${displayName}头像`"
            />
            <span v-else>{{ userInitial }}</span>
          </div>
          <button type="button" class="profile-account-edit" @click="openAccountDialog">
            修改信息
          </button>
        </div>

        <div class="profile-identity-copy">
          <div class="profile-name-line">
            <h2 id="profile-student-name">{{ displayName }}</h2>
            <span class="profile-membership-chip">{{ membershipTags.join(' · ') }}</span>
          </div>
          <ul class="profile-identity-list">
            <li>
              <el-icon aria-hidden="true"><Message /></el-icon>
              <span>{{ auth.user?.email || '尚未绑定邮箱' }}</span>
            </li>
            <li>
              <el-icon aria-hidden="true"><School /></el-icon>
              <span>目标院校　{{ profileTargetSchoolsText }}</span>
            </li>
            <li>
              <el-icon aria-hidden="true"><Location /></el-icon>
              <span>{{ profileIpLocationText }}</span>
            </li>
            <li>
              <el-icon aria-hidden="true"><Connection /></el-icon>
              <span>IP　{{ profileIpAddressText }}</span>
            </li>
          </ul>
        </div>

        <div class="profile-study-illustration" aria-hidden="true">
          <svg viewBox="0 0 320 170" focusable="false">
            <defs>
              <linearGradient id="profileCap" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stop-color="#8f7cff" />
                <stop offset="1" stop-color="#4d3bfa" />
              </linearGradient>
              <linearGradient id="profileBook" x1="0" x2="1">
                <stop offset="0" stop-color="#ffd79f" />
                <stop offset="1" stop-color="#ffb56a" />
              </linearGradient>
            </defs>
            <ellipse cx="179" cy="146" rx="115" ry="12" fill="#dcdafa" opacity=".65" />
            <path d="M96 106h136l14 18H88z" fill="url(#profileBook)" />
            <path
              d="M88 124h158v17H95c-8 0-12-10-7-17Z"
              fill="#fff"
              stroke="#7565ff"
              stroke-width="3"
            />
            <path d="M116 82h111l12 18H106z" fill="#b8b0ff" />
            <path
              d="M106 100h133v17H112c-8 0-12-10-6-17Z"
              fill="#fff"
              stroke="#5d4dff"
              stroke-width="3"
            />
            <path d="m92 46 83-28 89 30-87 30z" fill="url(#profileCap)" />
            <path d="M130 61v28c24 13 68 14 94 0V61l-48 17z" fill="#5947f7" />
            <path d="M263 49v38" stroke="#4938e9" stroke-width="4" stroke-linecap="round" />
            <circle cx="263" cy="89" r="5" fill="#ffbd6f" />
            <circle cx="287" cy="30" r="6" fill="#9bbcff" />
            <circle cx="302" cy="71" r="9" fill="#dedbff" />
            <path d="m44 69 10-20 10 20z" fill="#f5d7ff" />
          </svg>
        </div>
      </section>

      <div class="profile-dashboard-grid">
        <section class="profile-membership-panel" aria-labelledby="profile-membership-title">
          <ProfileModuleHeading
            class="profile-card-heading"
            kicker="MEMBERSHIP BENEFITS"
            title="当前会员权益"
            description="真实权益与学习记录"
            title-id="profile-membership-title"
          />

          <div class="membership-exam-switch" role="tablist" aria-label="考试权益切换">
            <button
              v-for="item in diagnosticQuotaItems"
              :key="item.examType"
              type="button"
              role="tab"
              :aria-selected="currentExamType === item.examType"
              :aria-disabled="!item.available"
              :class="{
                active: currentExamType === item.examType,
                unavailable: !item.available,
              }"
              @click="handleExamContextClick(item.examType)"
            >
              <strong>{{ item.label }}</strong
              ><span>{{ item.text }}</span>
              <svg
                v-if="currentExamType === item.examType"
                class="membership-exam-switch-pointer"
                viewBox="0 0 24 12"
                aria-hidden="true"
              >
                <path d="M2 0h20l-7.8 9.4a2.8 2.8 0 0 1-4.4 0z" />
              </svg>
            </button>
          </div>

          <div class="membership-benefit-board">
            <div
              class="membership-plan-banner"
              :class="
                isCurrentExamActive
                  ? 'membership-plan-banner--member'
                  : 'membership-plan-banner--free'
              "
            >
              <span class="membership-plan-icon"
                ><el-icon aria-hidden="true"><Trophy /></el-icon
              ></span>
              <div>
                <small>{{ isCurrentExamActive ? '当前生效方案' : '当前账户方案' }}</small>
                <strong>{{ membershipPlanTitle }}</strong>
                <span>{{ membershipPeriodText }}</span>
              </div>
              <button
                type="button"
                class="membership-plan-action"
                @click="handleMembershipPrimaryAction"
              >
                {{ isCurrentExamActive ? '续费会员' : '开通会员' }}
              </button>
            </div>

            <div class="membership-benefit-grid">
              <article>
                <el-icon aria-hidden="true"><Tickets /></el-icon>
                <span>试题库</span>
                <strong>{{ currentQuestionBankAnsweredCount }}<small>道</small></strong>
                <small>累计答题数量</small>
              </article>
              <article>
                <el-icon aria-hidden="true"><Aim /></el-icon>
                <span>诊断考试</span>
                <strong>{{ currentExamStats.diagnosticExamCount }}<small>次</small></strong>
                <small>累计真实记录</small>
              </article>
              <article>
                <el-icon aria-hidden="true"><Download /></el-icon>
                <span>资料下载</span>
                <strong class="benefit-text-value">功能上线中</strong>
                <small>敬请期待</small>
              </article>
            </div>

            <div class="membership-summary-note">
              <span>
                当前学习：预估分 {{ currentDiagnosticScoreText }} / 9.0 · 累计做题
                {{ currentExamStats.answeredQuestionCount }} 道
              </span>
              <button type="button" @click="handleUpgradeClick">查看会员权益 →</button>
            </div>
          </div>
        </section>

        <section
          ref="profileTargetPanel"
          class="profile-target-panel"
          aria-labelledby="profile-target-title"
        >
          <ProfileModuleHeading
            class="profile-card-heading"
            kicker="TARGET & PREFERENCES"
            title="目标偏好"
            description="管理备考考试、目标分数与学习计划"
            title-id="profile-target-title"
          >
            <button
              v-if="!examEditing"
              type="button"
              class="profile-inline-action"
              @click="startEditExam"
            >
              <el-icon aria-hidden="true"><EditPen /></el-icon>编辑目标偏好
            </button>
            <div v-else class="profile-target-edit-actions">
              <button type="button" class="profile-target-cancel" @click="cancelEditExam">
                取消
              </button>
              <button
                type="button"
                class="profile-target-save"
                :disabled="examSaving"
                @click="saveExam"
              >
                {{ examSaving ? '保存中...' : '保存修改' }}
              </button>
            </div>
          </ProfileModuleHeading>

          <dl class="profile-target-list">
            <div>
              <dt>
                <el-icon aria-hidden="true"><OfficeBuilding /></el-icon>目标院校层级
              </dt>
              <dd>
                <el-select
                  v-if="examEditing"
                  v-model="editTargetUniversities"
                  class="profile-target-row-select"
                  multiple
                  :multiple-limit="2"
                  aria-label="目标院校层级"
                  placeholder="请选择目标院校"
                >
                  <el-option
                    v-for="university in TARGET_UNIVERSITY_OPTIONS"
                    :key="university"
                    :label="university"
                    :value="university"
                  />
                </el-select>
                <template v-else>
                  {{ profileTargetSchoolsText }}
                </template>
              </dd>
            </div>
            <div>
              <dt>
                <el-icon aria-hidden="true"><CollectionTag /></el-icon>目标专业方向
              </dt>
              <dd>
                <input
                  v-if="examEditing"
                  v-model="editTargetMajor"
                  class="profile-target-row-input"
                  type="text"
                  aria-label="目标专业方向"
                  placeholder="例如：数学与统计"
                />
                <template v-else>
                  {{ profileTargetMajorText }}
                </template>
              </dd>
            </div>
            <div class="profile-target-exam-row">
              <dt>
                <el-icon aria-hidden="true"><Aim /></el-icon>目标考试
              </dt>
              <dd class="profile-target-exam-content">
                <div v-if="examEditing" class="profile-exam-editor">
                  <div class="profile-exam-type-group" role="group" aria-label="目标考试">
                    <button
                    v-for="item in examTypes"
                    :key="item.value"
                    class="profile-exam-choice"
                    :class="{
                      'is-active': editExamTypes.includes(item.value),
                      'is-unavailable': !item.available,
                    }"
                    type="button"
                    :disabled="!item.available"
                    @click="toggleProfileExamType(item.value)"
                    >
                      {{ item.label }}
                      <small v-if="!item.available">推进中</small>
                    </button>
                  </div>

                  <div v-if="editExamTypes.length" class="profile-exam-subject-editor">
                    <section v-if="editExamTypes.includes('ESAT')">
                      <span class="profile-exam-editor-label">ESAT（五选三）</span>
                      <div class="profile-exam-subject-choices">
                        <button
                          v-for="subject in ESAT_SUBJECT_OPTIONS"
                          :key="subject"
                          class="profile-exam-subject-choice"
                          :class="{
                            'is-active': editEsatSubjects.includes(subject),
                            'is-required': subject === '数学1',
                          }"
                          type="button"
                          :disabled="isProfileEsatSubjectDisabled(subject)"
                          @click="toggleProfileEsatSubject(subject)"
                        >
                          {{ subject }}
                        </button>
                      </div>
                    </section>

                    <section v-if="editExamTypes.includes('TMUA')">
                      <span class="profile-exam-editor-label">TMUA（固定科目）</span>
                      <div class="profile-exam-subject-choices">
                        <span class="profile-exam-subject-choice is-active is-required">Paper 1</span>
                        <span class="profile-exam-subject-choice is-active is-required">Paper 2</span>
                      </div>
                    </section>
                  </div>
                  <span v-else class="profile-exam-editor-hint">选择考试后设置对应科目</span>
                </div>

                <div v-else class="profile-target-subjects">
                  <div
                    v-if="displayedTargetExamTypes.includes('ESAT')"
                    class="profile-subject-group"
                  >
                    <span class="profile-subject-exam">ESAT</span>
                    <span>{{ profileEsatSubjectsText }}</span>
                  </div>
                  <div
                    v-if="displayedTargetExamTypes.includes('TMUA')"
                    class="profile-subject-group"
                  >
                    <span class="profile-subject-exam">TMUA</span>
                    <span>Paper 1、Paper 2</span>
                  </div>
                  <span v-if="!displayedTargetExamTypes.length">
                    尚未设置
                  </span>
                </div>
              </dd>
            </div>
            <div v-if="targetScoreExamTypes.length">
              <dt><el-icon aria-hidden="true"><Trophy /></el-icon>目标分数</dt>
              <dd class="profile-target-score-content">
                <template v-if="examEditing">
                  <label
                    v-for="examType in targetScoreExamTypes"
                    :key="examType"
                    class="profile-target-score-editor"
                  >
                    <span class="profile-subject-exam">{{ examType }}</span>
                    <el-input-number
                      v-model="targetScoreDrafts[examType]"
                      class="profile-target-row-number"
                      :min="1"
                      :max="9"
                      :step="0.1"
                      :precision="1"
                      controls-position="right"
                      :aria-label="`${examType} 目标分数`"
                      placeholder="1.0-9.0"
                    />
                  </label>
                </template>
                <template v-else>
                  <div
                    v-for="examType in targetScoreExamTypes"
                    :key="examType"
                    class="profile-target-score-display"
                  >
                    <span class="profile-subject-exam">{{ examType }}</span>
                    <strong>{{ profileTargetScoreTexts[examType] }}</strong>
                  </div>
                </template>
              </dd>
            </div>
            <div>
              <dt>
                <el-icon aria-hidden="true"><Clock /></el-icon>每周可投入时长
              </dt>
              <dd>
                <el-input-number
                  v-if="examEditing"
                  v-model="weeklyHoursDraft"
                  class="profile-target-row-number"
                  :min="1"
                  :max="80"
                  :step="1"
                  :precision="0"
                  controls-position="right"
                  aria-label="每周可投入时长"
                />
                <template v-else>
                  {{ profileWeeklyHoursText }}
                </template>
              </dd>
            </div>
            <div>
              <dt>
                <el-icon aria-hidden="true"><Calendar /></el-icon>考试日期
              </dt>
              <dd>
                <el-select
                  v-if="examEditing"
                  v-model="examDateDraft"
                  class="profile-target-row-select"
                  aria-label="考试日期"
                  placeholder="请选择考试日期"
                >
                  <el-option
                    v-for="option in EXAM_DATE_OPTIONS"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <template v-else>
                  {{ profileExamDateText }}
                </template>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <InvitationPanel
        @membership-changed="handleInvitationMembershipChanged"
        @edit-goals="handleInvitationEditGoals"
      />

      <section class="billing-panel" aria-labelledby="billing-title">
        <ProfileModuleHeading
          class="billing-heading"
          kicker="BILLING & ORDERS"
          title="订阅与支付记录"
          description="统一查看会员订阅状态、订单支付信息与续费情况"
          title-id="billing-title"
        />

        <div class="billing-summary-grid" aria-label="订阅与支付汇总">
          <article>
            <span class="billing-summary-icon billing-summary-icon--blue">
              <el-icon aria-hidden="true"><Tickets /></el-icon>
            </span>
            <div>
              <span>累计订阅</span>
              <strong
                >{{ billingSummaryValue('totalSubscriptions')
                }}<small v-if="billingOverview">项</small></strong
              >
              <small>{{ subscribedExamTypesText }}</small>
            </div>
          </article>
          <article>
            <span class="billing-summary-icon billing-summary-icon--green">
              <el-icon aria-hidden="true"><CircleCheck /></el-icon>
            </span>
            <div>
              <span>当前权益</span>
              <strong
                >{{ billingSummaryValue('activeEntitlements')
                }}<small v-if="billingOverview">项</small></strong
              >
              <small>当前生效会员权益</small>
            </div>
          </article>
          <article>
            <span class="billing-summary-icon billing-summary-icon--blue">
              <el-icon aria-hidden="true"><Document /></el-icon>
            </span>
            <div>
              <span>累计订单</span>
              <strong
                >{{ billingSummaryValue('totalOrders')
                }}<small v-if="billingOverview">笔</small></strong
              >
              <small>全部历史支付订单</small>
            </div>
          </article>
          <article>
            <span class="billing-summary-icon billing-summary-icon--orange">
              <el-icon aria-hidden="true"><Money /></el-icon>
            </span>
            <div>
              <span>累计实付</span>
              <strong class="billing-paid-total">{{ billingNetPaidText }}</strong>
              <small>已扣除退款金额</small>
            </div>
          </article>
        </div>

        <div class="billing-toolbar">
          <div class="billing-tabs" role="tablist" aria-label="订阅与支付记录筛选">
            <button
              v-for="filter in billingFilters"
              :key="filter.value"
              :class="{ active: billingFilter === filter.value }"
              type="button"
              role="tab"
              :aria-selected="billingFilter === filter.value"
              @click="billingFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>
          <button
            class="billing-sort-button"
            type="button"
            :aria-pressed="!billingSortDescending"
            @click="billingSortDescending = !billingSortDescending"
          >
            <el-icon aria-hidden="true"><Calendar /></el-icon>
            {{ billingSortDescending ? '按创建时间排序' : '按创建时间倒序' }}
            <span aria-hidden="true">⌄</span>
          </button>
        </div>

        <div v-if="billingLoading" class="billing-empty-state" aria-live="polite">
          <strong>正在加载订阅与支付记录</strong>
          <span>正在从账户数据中同步最新状态…</span>
        </div>
        <div v-else-if="billingError" class="billing-empty-state billing-empty-state--error">
          <strong>订阅与支付记录加载失败</strong>
          <span>{{ billingError }}</span>
          <button type="button" @click="loadBillingOverview">重新加载</button>
        </div>
        <div v-else-if="filteredBillingRecords.length" class="billing-record-list">
          <article
            v-for="record in filteredBillingRecords"
            :key="record.id"
            class="billing-record-card"
          >
            <header>
              <div>
                <h3>{{ record.title }}</h3>
                <p>订阅周期：{{ record.period }}</p>
              </div>
              <span class="billing-status" :class="`billing-status--${record.status}`">
                {{ billingStatusText(record.status) }}
              </span>
            </header>

            <dl class="billing-record-meta">
              <div>
                <dt>考试类型</dt>
                <dd>{{ record.examType }}</dd>
              </div>
              <div>
                <dt>套餐</dt>
                <dd>{{ record.planText }}</dd>
              </div>
              <div>
                <dt>支付金额</dt>
                <dd>{{ record.amountText }}</dd>
              </div>
              <div>
                <dt>支付方式</dt>
                <dd>{{ record.channelText }}</dd>
              </div>
              <div>
                <dt>订单编号</dt>
                <dd class="billing-order-number">{{ record.orderNo || '—' }}</dd>
              </div>
              <div>
                <dt>创建时间</dt>
                <dd>{{ formatDateTime(record.createdAt) }}</dd>
              </div>
              <div>
                <dt>支付时间</dt>
                <dd>{{ formatDateTime(record.paidAt) }}</dd>
              </div>
            </dl>

            <footer v-if="billingActionLabel(record)">
              <button type="button" @click="handleBillingAction(record)">
                {{ billingActionLabel(record) }}
              </button>
            </footer>
          </article>
        </div>
        <div v-else class="billing-empty-state">
          <strong>{{ billingRecords.length ? '当前筛选下暂无记录' : '暂无订阅与支付记录' }}</strong>
          <span>{{
            billingRecords.length
              ? '请选择其他状态继续查看。'
              : '完成真实支付后，订单与订阅记录将在这里显示；后台授予权益不计入交易记录。'
          }}</span>
        </div>
      </section>

      <nav class="profile-legal-links" aria-label="协议与政策">
        <router-link to="/legal/user-agreement" target="_blank" rel="noopener noreferrer"
          >用户协议</router-link
        >
        <router-link to="/legal/privacy-policy" target="_blank" rel="noopener noreferrer"
          >隐私政策</router-link
        >
        <router-link
          to="/legal/membership-service-agreement"
          target="_blank"
          rel="noopener noreferrer"
          >会员服务协议</router-link
        >
        <router-link
          to="/legal/membership-purchase-notice"
          target="_blank"
          rel="noopener noreferrer"
          >会员购买须知与权益</router-link
        >
      </nav>

      <p v-if="errorText" class="load-warning">{{ errorText }}</p>
    </main>

    <PaymentModal
      v-model="paymentVisible"
      :default-exam-type="currentExamType"
      :resume-order-no="paymentResumeOrderNo || undefined"
      @paid="handlePaymentSuccess"
    />

    <el-dialog
      v-model="accountDialogVisible"
      class="profile-account-dialog"
      title="修改信息"
      width="560px"
      align-center
      destroy-on-close
      @closed="resetAccountDialog"
    >
      <div class="account-dialog-content">
        <section class="account-dialog-section" aria-labelledby="change-email-title">
          <header class="account-dialog-heading">
            <span aria-hidden="true">1</span>
            <div>
              <h3 id="change-email-title">修改邮箱</h3>
              <p>当前邮箱：{{ auth.user?.email || '尚未绑定邮箱' }}</p>
            </div>
          </header>

          <el-input
            v-model="emailForm.email"
            type="email"
            autocomplete="off"
            maxlength="191"
            placeholder="请输入新邮箱"
            :disabled="emailSaving"
            @input="resetEmailVerification"
          />

          <div class="account-email-verification">
            <el-input
              v-model="emailCode"
              maxlength="6"
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="off"
              placeholder="六位验证码"
              :disabled="emailSaving"
              @input="handleChangeEmailCodeInput"
            />
            <div class="account-email-actions">
              <button
                type="button"
                class="button_cancel account-code-button"
                :disabled="emailSaving || emailCodeSending || emailCountdown > 0"
                @click="sendChangeEmailCode"
              >
                {{ emailCountdown > 0 ? `${emailCountdown}秒后重发` : '获取验证码' }}
              </button>
              <button
                type="button"
                class="button_primary"
                :disabled="emailSaving || !accountEmailChanged"
                @click="saveEmail"
              >
                {{ emailSaving ? '保存中...' : '保存新邮箱' }}
              </button>
            </div>
          </div>
        </section>

        <section class="account-dialog-section" aria-labelledby="change-password-title">
          <header class="account-dialog-heading">
            <span aria-hidden="true">2</span>
            <div>
              <h3 id="change-password-title">修改密码</h3>
              <p>验证当前密码后更新；修改成功后需要重新登录。</p>
            </div>
          </header>

          <div class="account-password-form password-form">
            <el-input
              v-model="passwordForm.currentPassword"
              type="password"
              autocomplete="off"
              placeholder="当前密码"
              :disabled="passwordSaving"
              show-password
            />
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              autocomplete="new-password"
              maxlength="12"
              placeholder="新密码（8-12位，英文+数字，可使用 !@#$%）"
              :disabled="passwordSaving"
              show-password
            />
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              autocomplete="new-password"
              maxlength="12"
              placeholder="确认新密码"
              :disabled="passwordSaving"
              show-password
            />
          </div>

          <div class="account-dialog-actions">
            <button
              type="button"
              class="button_primary"
              :disabled="passwordSaving"
              @click="savePassword"
            >
              {{ passwordSaving ? '修改中...' : '修改密码' }}
            </button>
          </div>
        </section>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 学生个人中心：展示会员权益、学习统计、登录网络、订阅和支付记录。
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Aim,
  Calendar,
  CircleCheck,
  Clock,
  CollectionTag,
  Connection,
  Document,
  Download,
  EditPen,
  Location,
  Message,
  Money,
  OfficeBuilding,
  School,
  Tickets,
  Trophy,
} from '@element-plus/icons-vue'
import NavBar from '@/components/NavBar.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import InvitationPanel from '@/components/InvitationPanel.vue'
import ProfileModuleHeading from '@/components/ProfileModuleHeading.vue'
import { getMember, updateStudyPreferences, type StudyPreferences } from '@/api/member'
import { getProfileExamStats, type ProfileExamStats } from '@/api/exam'
import { getBillingOverview, type BillingOverview, type PaymentOrder } from '@/api/payment'
import { useAuthStore } from '@/stores/auth'
import {
  DEFAULT_EXAM_TYPE,
  EXAM_TYPE_OPTIONS,
  getExamUnavailableMessage,
  isExamTypeAvailable,
  type ExamType,
} from '@/constants/examTypes'
import { TARGET_UNIVERSITY_OPTIONS } from '@/constants/universities'
import { changePassword, getSessions, sendEmailCode, type AuthSessionItem } from '@/api/auth'
import {
  EMAIL_CODE_PATTERN,
  normalizeEmailCode,
  validateConfirmPassword,
  validatePassword,
} from '@/utils/validation'
import { getApiErrorMessage } from '@/utils/request'

type BillingFilter = 'all' | 'active' | 'expired' | 'failed' | 'refund'
type BillingStatus =
  | 'active'
  | 'queued'
  | 'expired'
  | 'cancelled'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'closed'
  | 'refunding'
  | 'refunded'

interface BillingRecord {
  id: string
  kind: 'subscription' | 'order'
  examType: string
  title: string
  period: string
  planText: string
  amountText: string
  channelText: string
  orderNo: string | null
  createdAt: string | null
  paidAt: string | null
  sortTimestamp: number
  status: BillingStatus
  order: PaymentOrder | null
}

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const errorText = ref('')
const profileStats = ref<Record<string, ProfileExamStats>>({})
const currentExamType = ref<ExamType>(auth.activeExamType)
const billingFilter = ref<BillingFilter>('all')
const billingSortDescending = ref(true)
const billingOverview = ref<BillingOverview | null>(null)
const billingLoading = ref(true)
const billingError = ref('')
const paymentVisible = ref(false)
const paymentResumeOrderNo = ref('')
const sessions = ref<AuthSessionItem[]>([])
const accountDialogVisible = ref(false)
const emailSaving = ref(false)
const emailForm = reactive({ email: '' })
const emailCode = ref('')
const emailChallengeId = ref('')
const emailCodeSending = ref(false)
const emailCountdown = ref(0)
let emailTimer: number | undefined

// 个人中心的权益切换只是本页查看维度，不改写顶部导航和其他业务页的全局考试上下文。
function setCurrentExamType(examType: ExamType): void {
  if (!isExamTypeAvailable(examType)) return
  currentExamType.value = examType
}
const passwordSaving = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
// 只有输入的新邮箱与当前账号邮箱不同时，才展示并校验验证码流程。
const accountEmailChanged = computed(
  () =>
    Boolean(emailForm.email.trim()) &&
    emailForm.email.trim().toLowerCase() !== (auth.user?.email || '').toLowerCase(),
)
// 顶部资料卡只展示本次登录会话，避免其他设备信息干扰身份概览。
const currentSession = computed(() => sessions.value.find((item) => item.isCurrent) || null)
// 回环地址统一为熟悉的 IPv4 写法，公网地址保持服务端记录的原值。
const profileIpAddressText = computed(() => formatIpAddress(currentSession.value?.ipAddress))
// 公网 IP 优先展示服务端解析的近似地区，本地开发和解析失败时使用明确降级文案。
const profileIpLocationText = computed(() => {
  const locationLabel = currentSession.value?.ipLocation?.label?.trim()
  if (locationLabel) return locationLabel
  return profileIpAddressText.value === '127.0.0.1' ? '本地网络' : '位置暂不可用'
})

// 报考目标编辑
const examEditing = ref(false)
const examSaving = ref(false)
const profileTargetPanel = ref<HTMLElement | null>(null)
const editExamTypes = ref<string[]>([])
const editTargetUniversities = ref<string[]>([])
const editTargetMajor = ref('')
const editEsatSubjects = ref<string[]>(['数学1'])
const targetScoreDrafts = reactive<Record<ScoreExamType, number | undefined>>({
  ESAT: undefined,
  TMUA: undefined,
})
const weeklyHoursDraft = ref(20)
const examDateDraft = ref('2026-10')
const ESAT_SUBJECT_OPTIONS = ['数学1', '数学2', '物理', '化学', '生物'] as const
const EXAM_DATE_OPTIONS = [
  { label: '2026 年 10 月', value: '2026-10' },
  { label: '2027 年 1 月', value: '2027-01' },
  { label: '2027 年 10 月', value: '2027-10' },
  { label: '2028 年 1 月', value: '2028-01' },
  { label: '2028 年 10 月', value: '2028-10' },
] as const

const examTypes = EXAM_TYPE_OPTIONS.filter((item) => item.available)
type ScoreExamType = 'ESAT' | 'TMUA'
const displayedTargetExamTypes = computed(() =>
  examEditing.value
    ? editExamTypes.value
    : auth.memberContext?.studyPreferences.examTypes || [],
)
// 目标分数与考试类型一一对应，避免 ESAT 与 TMUA 的备考标准互相覆盖。
const targetScoreExamTypes = computed<ScoreExamType[]>(() => {
  const targetExamTypes = examEditing.value
    ? editExamTypes.value
    : displayedTargetExamTypes.value
  return targetExamTypes.filter(
    (examType): examType is ScoreExamType => examType === 'ESAT' || examType === 'TMUA',
  )
})

// 个人中心沿用注册页的考试卡片交互，选中考试后再展开对应科目。
function toggleProfileExamType(examType: string): void {
  const option = examTypes.find((item) => item.value === examType)
  if (!option?.available) return

  const index = editExamTypes.value.indexOf(examType)
  if (index >= 0) {
    editExamTypes.value.splice(index, 1)
    if (examType === 'ESAT') {
      editEsatSubjects.value = ['数学1']
    }
    if (examType === 'ESAT' || examType === 'TMUA') targetScoreDrafts[examType] = undefined
    return
  }

  editExamTypes.value.push(examType)
  editExamTypes.value.sort(
    (left, right) =>
      examTypes.findIndex((item) => item.value === left) -
      examTypes.findIndex((item) => item.value === right),
  )
  if (examType === 'ESAT' && !editEsatSubjects.value.includes('数学1')) {
    editEsatSubjects.value.unshift('数学1')
  }
}

// 数学1不可取消，已选满三科时锁定其余未选科目。
function isProfileEsatSubjectDisabled(subject: string): boolean {
  if (subject === '数学1') return true
  return editEsatSubjects.value.length >= 3 && !editEsatSubjects.value.includes(subject)
}

// ESAT 科目卡片只处理四个可选科目，数学1由业务规则固定保留。
function toggleProfileEsatSubject(subject: string): void {
  if (isProfileEsatSubjectDisabled(subject)) return
  const index = editEsatSubjects.value.indexOf(subject)
  if (index >= 0) editEsatSubjects.value.splice(index, 1)
  else editEsatSubjects.value.push(subject)
}

// 进入编辑模式时把所有已保存偏好复制为当前卡片内的可撤销草稿。
function startEditExam(): void {
  const preferences = auth.memberContext?.studyPreferences
  editExamTypes.value = preferences?.examTypes.length
    ? [...preferences.examTypes]
    : []
  editTargetUniversities.value = preferences?.targetUniversities.length
    ? [...preferences.targetUniversities]
    : TARGET_UNIVERSITY_OPTIONS.slice(2, 4)
  editTargetMajor.value = preferences?.targetMajor || '数学与统计、计算机科学'
  const savedEsatSubjects = preferences?.esatSubjects || []
  editEsatSubjects.value = Array.from(new Set(['数学1', ...savedEsatSubjects])).slice(0, 3)
  targetScoreDrafts.ESAT = preferences?.targetScores.ESAT ?? undefined
  targetScoreDrafts.TMUA = preferences?.targetScores.TMUA ?? undefined
  weeklyHoursDraft.value = preferences?.weeklyHours || 20
  examDateDraft.value = preferences?.examDate || EXAM_DATE_OPTIONS[0].value
  examEditing.value = true
}

// 取消编辑时只退出草稿态，服务端已保存的会员上下文保持不变。
function cancelEditExam(): void {
  editTargetUniversities.value = []
  editTargetMajor.value = ''
  editEsatSubjects.value = ['数学1']
  targetScoreDrafts.ESAT = undefined
  targetScoreDrafts.TMUA = undefined
  weeklyHoursDraft.value = 20
  examEditing.value = false
}

// 保存前按考试验证目标分数，避免 ESAT 与 TMUA 的目标值写入同一条偏好。
async function saveExam(): Promise<void> {
  if (!editExamTypes.value.length) {
    ElMessage.warning('请至少选择一个目标考试')
    return
  }
  if (!editTargetUniversities.value.length) {
    ElMessage.warning('请至少选择一所目标院校')
    return
  }
  const targetMajor = editTargetMajor.value.trim()
  if (!targetMajor) {
    ElMessage.warning('请输入目标专业方向')
    return
  }
  if (
    editExamTypes.value.includes('ESAT') &&
    (editEsatSubjects.value.length !== 3 || !editEsatSubjects.value.includes('数学1'))
  ) {
    ElMessage.warning('ESAT 需选择 3 个科目，且数学1为必选科目')
    return
  }
  for (const examType of targetScoreExamTypes.value) {
    const targetScore = targetScoreDrafts[examType]
    if (
      targetScore !== undefined &&
      (!Number.isFinite(targetScore) || targetScore < 1 || targetScore > 9)
    ) {
      ElMessage.warning(`${examType} 目标分数需为 1.0-9.0`)
      return
    }
  }
  if (
    !Number.isInteger(weeklyHoursDraft.value) ||
    weeklyHoursDraft.value < 1 ||
    weeklyHoursDraft.value > 80
  ) {
    ElMessage.warning('每周可投入时长需为 1-80 小时')
    return
  }
  if (!EXAM_DATE_OPTIONS.some((option) => option.value === examDateDraft.value)) {
    ElMessage.warning('请选择有效的考试日期')
    return
  }
  examSaving.value = true
  try {
    const preferences: StudyPreferences = {
      examTypes: [...editExamTypes.value],
      esatSubjects: editExamTypes.value.includes('ESAT') ? [...editEsatSubjects.value] : [],
      targetRegions: auth.memberContext?.studyPreferences.targetRegions || '',
      targetUniversities: [...editTargetUniversities.value],
      targetMajor,
      targetScores: {
        ESAT: editExamTypes.value.includes('ESAT') ? targetScoreDrafts.ESAT ?? null : null,
        TMUA: editExamTypes.value.includes('TMUA') ? targetScoreDrafts.TMUA ?? null : null,
      },
      examDate: examDateDraft.value,
      weeklyHours: weeklyHoursDraft.value,
    }
    await updateStudyPreferences(preferences)
    // 刷新 memberContext 以同步界面
    const ctx = await getMember()
    auth.setMemberContext(ctx)
    examEditing.value = false
    ElMessage.success('报考目标已更新')
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    examSaving.value = false
  }
}

const billingFilters: { label: string; value: BillingFilter }[] = [
  { label: '全部记录', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已过期', value: 'expired' },
  { label: '支付失败', value: 'failed' },
  { label: '退款', value: 'refund' },
]

// 用户名缺失时提供稳定称呼，避免个人中心标题为空。
const displayName = computed(() => auth.user?.username || '同学')
// 未上传头像时从展示名生成文字占位。
const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())
// 仅有效会员记录参与当前权益和标签计算。
const activeMemberships = computed(() =>
  (auth.memberContext?.memberships || []).filter((item) => item.status === 'active'),
)
// 会员展示只读取正式 UserMembership，不再接受用户表上的全局付费标识。
const hasActiveMembership = computed(() => activeMemberships.value.length > 0)
// 个人中心只消费后端归一后的账户级偏好，不再自行聚合按考试兼容数据。
const studyPreferences = computed(() => auth.memberContext?.studyPreferences)
const profileTargetSchoolsText = computed(() => {
  const schools = studyPreferences.value?.targetUniversities || []
  return schools.length ? schools.join('、') : 'UCL、帝国理工、LSE'
})
const profileTargetMajorText = computed(
  () => studyPreferences.value?.targetMajor || '数学与统计、计算机科学',
)
const profileEsatSubjectsText = computed(() => {
  const subjects = studyPreferences.value?.esatSubjects || []
  return subjects.length ? subjects.join('、') : '尚未设置'
})
// 目标分数按考试类型分别显示，未填写时保持明确占位，避免与诊断预估分混淆。
const profileTargetScoreTexts = computed<Record<ScoreExamType, string>>(() => {
  const targetScores = studyPreferences.value?.targetScores
  return {
    ESAT: targetScores?.ESAT === null || targetScores?.ESAT === undefined
      ? '未设置'
      : targetScores.ESAT.toFixed(1),
    TMUA: targetScores?.TMUA === null || targetScores?.TMUA === undefined
      ? '未设置'
      : targetScores.TMUA.toFixed(1),
  }
})
const profileWeeklyHoursText = computed(
  () => `${studyPreferences.value?.weeklyHours || 20} 小时/周`,
)
// 考试日期展示产品约定的月份标签。
const profileExamDateText = computed(() => {
  const value = studyPreferences.value?.examDate || EXAM_DATE_OPTIONS[0].value
  return EXAM_DATE_OPTIONS.find((option) => option.value === value)?.label || '2026 年 10 月'
})
// 管理员只展示身份，不重复罗列其天然拥有的各考试管理权益。
const membershipTags = computed(() => {
  if (auth.isAdmin) return ['管理员']
  if (!activeMemberships.value.length) return ['免费版']
  return activeMemberships.value.map((item) => `${item.examType}会员`)
})
// 未开通的考试类型保留 tab 入口，但统计值按产品要求隐藏为占位符。
const isCurrentExamActive = computed(() =>
  activeMemberships.value.some(
    (item) => normalizeExamType(item.examType) === currentExamType.value,
  ),
)
// 会员主卡只展示当前考试上下文对应的有效会员，不混用其他考试权益。
const currentMembership = computed(() =>
  activeMemberships.value.find(
    (item) => normalizeExamType(item.examType) === currentExamType.value,
  ),
)
// 会员主标题只区分考试权益是否生效，具体付费周期留在账单记录中展示。
const membershipPlanTitle = computed(() => {
  const membership = currentMembership.value
  return membership
    ? `${currentExamType.value}会员`
    : `${currentExamType.value} 免费版`
})
// 会员周期优先展示真实到期日，免费状态改为说明实际可用的诊断权益。
const membershipPeriodText = computed(() => {
  const membership = currentMembership.value
  return membership?.entitlementEndsAt
    ? `到期时间：${formatTimestamp(membership.entitlementEndsAt)}`
    : '免费诊断卷可不限次测试'
})
// 后端按考试类型返回统计，前端兜底可避免接口缺项导致模板分支复杂化。
const currentExamStats = computed<ProfileExamStats>(
  () =>
    profileStats.value[currentExamType.value] || {
      estimatedScore: null,
      answeredQuestionCount: 0,
      diagnosticExamCount: 0,
    },
)
// 试题库答题数量直接使用会员上下文中的实际用量，并随当前考试类型切换。
const currentQuestionBankAnsweredCount = computed(
  () => auth.memberContext?.quotas?.[currentExamType.value]?.questionBank.used || 0,
)
// 预估分数只对已开通考试展示，并统一保留一位小数。
const estimatedScoreText = computed(() => {
  if (!isCurrentExamActive.value) return '--'
  const score = currentExamStats.value.estimatedScore
  return score === null ? '--' : score.toFixed(1)
})
// 未开通考试隐藏答题量，避免把零误解为有效学习统计。
const answeredQuestionText = computed(() =>
  isCurrentExamActive.value ? String(currentExamStats.value.answeredQuestionCount) : '--',
)
// 未开通考试隐藏诊断次数，与其他统计卡片保持同一展示规则。
const diagnosticExamText = computed(() =>
  isCurrentExamActive.value ? String(currentExamStats.value.diagnosticExamCount) : '--',
)
// 诊断权益只区分免费卷和考试会员，不再展示已停用的次数额度。
const diagnosticQuotaItems = computed(() => {
  const quotas = auth.memberContext?.quotas || {}
  return EXAM_TYPE_OPTIONS.map((item) => {
    const quota = quotas[item.value]
    const available = isExamTypeAvailable(item.value)
    const isMember = Boolean(auth.isAdmin || quota?.isMember)
    const text = available ? (isMember ? '全部试卷已解锁' : '免费卷不限次') : '正在推进中'

    return {
      examType: item.value,
      label: item.label,
      text,
      available,
      isEmpty: !available,
    }
  })
})
// 当前诊断卡片统一格式化分数，无有效成绩时显示占位符。
const currentDiagnosticScoreText = computed(() => {
  const score = currentExamStats.value.estimatedScore
  return score === null ? '--' : score.toFixed(1)
})
// 交易列表以真实支付订单为唯一来源；会员权益只用于补充已支付订单的生效周期与状态。
const billingRecords = computed<BillingRecord[]>(() => {
  const overview = billingOverview.value
  if (!overview) return []
  const matchedMembershipIds = new Set<string>()
  return overview.orders.map((order) => {
    const hasSuccessfulPayment = ['paid', 'refunding', 'refunded'].includes(order.status)
    const membership = hasSuccessfulPayment
      ? overview.memberships.find(
          (item) =>
            !matchedMembershipIds.has(item.id) &&
            item.plan === order.plan &&
            order.examTypes.some(
              (examType) => examType.toUpperCase() === item.examType.toUpperCase(),
            ),
        )
      : undefined
    if (membership) matchedMembershipIds.add(membership.id)
    const status =
      order.status === 'refunding' || order.status === 'refunded'
        ? normalizeBillingStatus(order.status)
        : membership
          ? normalizeBillingStatus(membership.status)
          : order.status === 'pending' && new Date(order.expiresAt).getTime() <= Date.now()
            ? 'closed'
            : normalizeBillingStatus(order.status)
    const examType = order.examTypes.join('、') || '—'
    return {
      id: `order-${order.id}`,
      kind: membership ? 'subscription' : 'order',
      examType,
      title: membership
        ? `${examType} ${membershipPlanText(membership.plan)}订阅`
        : paymentOrderTitle(order),
      period: membership
        ? `${formatTimestamp(membership.startsAt)} — ${formatTimestamp(membership.endsAt)}`
        : '—',
      planText: paymentPlanText(order),
      amountText: formatPaymentAmount(order.amountCents, order.currency),
      channelText: paymentChannelText(order.channel),
      orderNo: order.orderNo,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      sortTimestamp: Date.parse(order.createdAt) || 0,
      status,
      order,
    }
  })
})
// 筛选只改变统一列表的可见范围；已支付历史订单始终可在“全部记录”中核对。
const filteredBillingRecords = computed(() => {
  const records = billingRecords.value.filter((record) => {
    if (billingFilter.value === 'all') return true
    if (billingFilter.value === 'active') return ['active', 'queued', 'pending'].includes(record.status)
    if (billingFilter.value === 'expired') {
      return ['expired', 'cancelled', 'closed'].includes(record.status)
    }
    if (billingFilter.value === 'failed') return record.status === 'failed'
    return ['refunding', 'refunded'].includes(record.status)
  })
  const direction = billingSortDescending.value ? -1 : 1
  return [...records].sort((left, right) => (left.sortTimestamp - right.sortTimestamp) * direction)
})
// 汇总卡只使用后端基于完整数据集计算的值，加载或失败时不伪造为零。
function billingSummaryValue(
  key: 'totalSubscriptions' | 'activeEntitlements' | 'totalOrders',
): string {
  if (!billingOverview.value) return '—'
  return String(billingOverview.value.summary[key])
}
// 已订阅考试类型只来自成功支付订单，后台授予权益不会被标记为付费订阅。
const subscribedExamTypesText = computed(() => {
  if (!billingOverview.value) return billingLoading.value ? '正在同步' : '暂无付费订阅'
  const examTypes = billingOverview.value.summary.subscribedExamTypes
  return examTypes.length ? `包含 ${examTypes.join(' / ')}` : '暂无付费订阅'
})
// 累计实付由后端扣除退款金额后汇总，避免前端分页造成金额不完整。
const billingNetPaidText = computed(() => {
  const summary = billingOverview.value?.summary
  return summary ? formatPaymentAmount(summary.netPaidCents, summary.currency) : '—'
})

// 打开弹窗时从最新账户状态初始化邮箱，并清空上一次未提交的敏感信息。
function openAccountDialog(): void {
  resetAccountDialog()
  accountDialogVisible.value = true
}

// 弹窗关闭后丢弃未提交的邮箱和密码草稿，避免敏感信息残留。
function resetAccountDialog(): void {
  emailForm.email = ''
  resetEmailVerification()
  resetPasswordDraft()
}

// 邮箱验证码倒计时沿用服务端返回间隔，避免前端重发时间与接口限流不一致。
function startEmailCountdown(seconds: number): void {
  if (emailTimer) window.clearInterval(emailTimer)
  emailCountdown.value = seconds
  emailTimer = window.setInterval(() => {
    emailCountdown.value -= 1
    if (emailCountdown.value <= 0 && emailTimer) {
      window.clearInterval(emailTimer)
      emailTimer = undefined
    }
  }, 1000)
}

// 新邮箱再次变化时废弃旧挑战，防止验证码被用于不同邮箱。
function resetEmailVerification(): void {
  emailChallengeId.value = ''
  emailCode.value = ''
}

// 验证码输入始终归一为前六位数字，兼容键盘输入和粘贴。
function handleChangeEmailCodeInput(value: string): void {
  emailCode.value = normalizeEmailCode(value)
}

// 修改邮箱验证码只发送至当前输入的新地址，并保存与该邮箱绑定的挑战标识。
async function sendChangeEmailCode(): Promise<void> {
  const email = emailForm.email.trim()
  if (!accountEmailChanged.value) {
    ElMessage.warning('请输入与当前邮箱不同的新邮箱')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ElMessage.warning('请输入有效的新邮箱地址')
    return
  }
  emailCodeSending.value = true
  try {
    const data = await sendEmailCode(email, 'CHANGE_EMAIL')
    emailChallengeId.value = data.challengeId
    emailCode.value = ''
    startEmailCountdown(data.resendAfter)
    ElMessage.success('验证码已发送到新邮箱')
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    emailCodeSending.value = false
  }
}

// 保存邮箱时保留现有用户名，并消费发送至新邮箱的验证码挑战。
async function saveEmail(): Promise<void> {
  const email = emailForm.email.trim()
  if (!accountEmailChanged.value) {
    ElMessage.warning('请输入与当前邮箱不同的新邮箱')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ElMessage.warning('请输入有效的新邮箱地址')
    return
  }
  if (!emailChallengeId.value || !EMAIL_CODE_PATTERN.test(emailCode.value)) {
    ElMessage.warning('请先获取验证码并输入新邮箱收到的六位验证码')
    return
  }

  emailSaving.value = true
  try {
    await auth.updateProfile({
      username: auth.user?.username || '',
      email,
      challengeId: emailChallengeId.value,
      emailCode: emailCode.value,
    })
    emailForm.email = auth.user?.email || email
    resetEmailVerification()
    ElMessage.success('邮箱已更新')
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    emailSaving.value = false
  }
}

// 密码修改成功后清除本地会话并要求重新登录，避免旧凭据继续使用。
async function savePassword(): Promise<void> {
  if (!accountDialogVisible.value) return
  const passwordResult = validatePassword(passwordForm.newPassword)
  const confirmResult = validateConfirmPassword(
    passwordForm.newPassword,
    passwordForm.confirmPassword,
  )
  if (!passwordForm.currentPassword) {
    ElMessage.warning('请输入当前密码')
    return
  }
  if (!passwordResult.valid) {
    ElMessage.warning(passwordResult.message)
    return
  }
  if (!confirmResult.valid) {
    ElMessage.warning(confirmResult.message)
    return
  }

  passwordSaving.value = true
  try {
    await changePassword(passwordForm)
    resetPasswordDraft()
    auth.clearLocalSession()
    ElMessage.success('密码已修改，请使用新密码重新登录')
    await router.replace('/login')
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    passwordSaving.value = false
  }
}

// 密码草稿不持久化，每次退出弹窗后立即清空。
function resetPasswordDraft(): void {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

// 进入个人中心并行加载权益、统计、设备会话和完整账单总览，局部失败不阻塞其他区域。
onMounted(async () => {
  errorText.value = ''
  const [memberResult, statsResult, sessionsResult, billingResult] = await Promise.allSettled([
    getMember(),
    getProfileExamStats(),
    getSessions(),
    getBillingOverview(),
  ])

  if (memberResult.status === 'fulfilled') {
    auth.setMemberContext(memberResult.value)
    setCurrentExamType(auth.activeExamType)
  }
  if (statsResult.status === 'fulfilled') {
    profileStats.value = statsResult.value.stats || {}
  }
  if (sessionsResult.status === 'fulfilled') sessions.value = sessionsResult.value.list
  if (billingResult.status === 'fulfilled') {
    billingOverview.value = billingResult.value
  } else {
    billingError.value = '暂时无法获取订阅与支付记录，请稍后重试。'
  }
  billingLoading.value = false
  const hasFailure = [memberResult, statsResult, sessionsResult].some(
    (result) => result.status === 'rejected',
  )
  if (hasFailure) errorText.value = '部分学习数据暂时无法加载，请稍后刷新。'
  if (route.query.purchase === '1') paymentVisible.value = true
})

// 个人中心所有升级入口统一打开支付弹窗，并预选当前查看的考试类型。
function handleUpgradeClick(): void {
  if (!isExamTypeAvailable(currentExamType.value)) {
    ElMessage.info(getExamUnavailableMessage(currentExamType.value))
    return
  }
  paymentResumeOrderNo.value = ''
  paymentVisible.value = true
}

// 会员主卡只承接当前考试类型的开通或续费，诊断入口保留在独立业务场景中。
function handleMembershipPrimaryAction(): void {
  handleUpgradeClick()
}

// 支付完成后刷新会员与订单数据，使个人中心立即展示新权益和支付记录。
async function handlePaymentSuccess(): Promise<void> {
  paymentVisible.value = false
  paymentResumeOrderNo.value = ''
  const [memberResult] = await Promise.allSettled([getMember(), loadBillingOverview()])
  if (memberResult.status === 'fulfilled') {
    auth.setMemberContext(memberResult.value)
  }
}

// 邀请周卡启用后刷新会员与账单，保持主权益卡和奖励面板的时间一致。
async function handleInvitationMembershipChanged(): Promise<void> {
  const [memberResult] = await Promise.allSettled([getMember(), loadBillingOverview()])
  if (memberResult.status === 'fulfilled') auth.setMemberContext(memberResult.value)
}

// 周卡缺少推荐依据时进入目标编辑，并把视口定位到个人中心的备考目标卡片。
function handleInvitationEditGoals(): void {
  startEditExam()
  window.requestAnimationFrame(() => {
    profileTargetPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

// 记录操作根据真实状态恢复待支付订单，或进入对应考试的重新购买流程。
function handleBillingAction(record: BillingRecord): void {
  const examType = record.order?.examTypes[0] || record.examType.split('、')[0] || ''
  if (!isExamTypeAvailable(examType)) {
    ElMessage.info(getExamUnavailableMessage(examType))
    return
  }
  setCurrentExamType(normalizeExamType(examType))
  paymentResumeOrderNo.value =
    record.order && record.status === 'pending' ? record.order.orderNo : ''
  paymentVisible.value = true
}

// 不同订单和订阅状态只展示可完成实际闭环的操作入口。
function billingActionLabel(record: BillingRecord): string {
  if (record.status === 'refunding' || record.status === 'refunded') return ''
  if (record.kind === 'subscription') {
    if (record.planText === '管理员权益') return ''
    if (record.status === 'queued') return ''
    return record.status === 'active' ? '续费' : '重新开通'
  }
  if (record.status === 'pending') return '继续支付'
  if (record.status === 'failed' || record.status === 'closed') return '重新支付'
  if (record.status === 'paid') return '再次订阅'
  return ''
}

// 额度卡片保留 STEP 上线预告，但未开放类型不会切换到可购买或可诊断状态。
function handleExamContextClick(examType: ExamType): void {
  if (!isExamTypeAvailable(examType)) {
    ElMessage.info(getExamUnavailableMessage(examType))
    return
  }
  setCurrentExamType(examType)
}

// 从额度区进入统一诊断入口，由诊断页继续选择具体试卷。
function handleStartDiagnostic(): void {
  if (!isExamTypeAvailable(currentExamType.value)) {
    ElMessage.info(getExamUnavailableMessage(currentExamType.value))
    return
  }
  auth.setActiveExamType(currentExamType.value as 'ESAT' | 'TMUA')
  router.push('/assessment')
}

// 用户主动重试或支付完成时刷新完整账单总览，确保汇总与明细来自同一快照。
async function loadBillingOverview(): Promise<void> {
  billingLoading.value = true
  billingError.value = ''
  try {
    const overview = await getBillingOverview()
    billingOverview.value = overview
  } catch (error: unknown) {
    billingError.value = getApiErrorMessage(error, '暂时无法获取订阅与支付记录，请稍后重试。')
  } finally {
    billingLoading.value = false
  }
}

// IPv4 映射地址转换为用户熟悉的显示格式，本地回环统一为 127.0.0.1。
function formatIpAddress(value?: string | null): string {
  if (!value) return '未知'
  if (value === '::1') return '127.0.0.1'
  return value.replace(/^::ffff:/i, '')
}

// 未识别的考试类型回落到默认值，保证统计和路由上下文可用。
function normalizeExamType(value: unknown): ExamType {
  return EXAM_TYPE_OPTIONS.some((item) => item.value === value)
    ? (value as ExamType)
    : DEFAULT_EXAM_TYPE
}

// 套餐内部值集中映射为中文名称，避免各卡片重复维护文案。
function planName(plan: string): string {
  if (plan === 'yearly') return '专业版'
  if (plan === 'monthly') return '月度版'
  if (plan === 'admin') return '管理员权益'
  if (plan === 'weekly_reward') return '七天邀请会员卡'
  return '免费版'
}

// 服务端状态归一为页面可识别集合，未知状态降级为失败而不是伪装成功。
function normalizeBillingStatus(status: string): BillingStatus {
  const statuses: BillingStatus[] = [
    'active',
    'queued',
    'expired',
    'cancelled',
    'pending',
    'paid',
    'failed',
    'closed',
    'refunding',
    'refunded',
  ]
  return statuses.includes(status as BillingStatus) ? (status as BillingStatus) : 'failed'
}

// 统一状态文案同时覆盖会员生命周期与支付订单生命周期。
function billingStatusText(status: BillingStatus): string {
  const map: Record<BillingStatus, string> = {
    active: '进行中',
    queued: '排队生效',
    expired: '已过期',
    cancelled: '已取消',
    pending: '待支付',
    paid: '已支付',
    failed: '支付失败',
    closed: '已关闭',
    refunding: '退款中',
    refunded: '已退款',
  }
  return map[status]
}

// 订阅日期统一输出年月日，无效或缺失时间使用占位符。
function formatTimestamp(value: number | string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

// 会员记录套餐名忠实反映后端值，不使用价格页营销名称替代历史数据。
function membershipPlanText(plan: string): string {
  if (plan === 'yearly') return '年度套餐'
  if (plan === 'monthly') return '月度套餐'
  if (plan === 'admin') return '管理员权益'
  if (plan === 'weekly_reward') return '七天邀请会员卡'
  return planName(plan)
}

// 支付订单标题由考试类型和套餐组成，缺失考试类型时保留稳定兜底。
function paymentOrderTitle(order: PaymentOrder): string {
  return `${order.examTypes.join('、') || '会员'} ${paymentPlanText(order)}订单`
}

// 套餐文案同时体现首月优惠，避免用户将优惠订单误解为普通月付。
function paymentPlanText(order: Pick<PaymentOrder, 'plan' | 'priceType'>): string {
  if (order.priceType === 'first_monthly') return '月度套餐（首月优惠）'
  return order.plan === 'yearly' ? '年度套餐' : '月度套餐'
}

// 支付渠道统一转换为用户可理解的中文名称。
function paymentChannelText(channel: PaymentOrder['channel']): string {
  const map: Record<PaymentOrder['channel'], string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    unionpay: '银联支付',
  }
  return map[channel]
}

// 金额以分为单位格式化，异常币种回退到人民币符号展示。
function formatPaymentAmount(amountCents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency || 'CNY',
      minimumFractionDigits: 2,
    }).format(amountCents / 100)
  } catch {
    return `¥${(amountCents / 100).toFixed(2)}`
  }
}

// 支付时间保留到分钟，未支付订单使用占位符。
function formatDateTime(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

// 页面离开时释放邮箱验证码倒计时，避免卸载后继续更新组件状态。
onBeforeUnmount(() => {
  if (emailTimer) window.clearInterval(emailTimer)
})
</script>

<style scoped lang="scss">
.profile-page {
  min-width: var(--fluid-page-min-width);
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg);
  color: var(--color-ink);
  --profile-sidebar-width: clamp(200px, 15vw, 240px);
  --profile-card-pad: clamp(24px, 2vw, 32px);
  --profile-card-pad-x: clamp(18px, 1.5vw, 24px);
  --profile-card-gap: clamp(12px, 1vw, 16px);
  --profile-card-gap-lg: clamp(18px, 1.5vw, 24px);
  --profile-overview-body-min-height: clamp(150px, 10vw, 160px);
  --profile-avatar-size: clamp(76px, 5.25vw, 84px);
}

.profile-shell {
  width: 100%;
  height: calc(100vh - var(--nav-height));
  margin: 0;
  padding: clamp(48px, 3.33vw, 64px) 0 clamp(72px, 5vw, 96px);
  overflow: auto;
  scrollbar-gutter: stable;
}

.profile-shell > * {
  width: var(--fluid-shell-width);
  margin-left: auto;
  margin-right: auto;
}

.profile-legal-links {
  display: flex;
  justify-content: center;
  gap: 8px 24px;
  margin-top: 24px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.profile-legal-links a {
  color: var(--color-ink-soft);
  text-underline-offset: 3px;
}

.profile-legal-links a:hover {
  color: var(--color-ink);
}

.profile-legal-links a:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 2px;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(18px, 1.25vw, 24px);
  padding-bottom: clamp(22px, 1.46vw, 28px);
  border-bottom: 1px solid var(--color-line);

  h1 {
    margin: 0 0 12px;
    color: var(--color-ink);
    font-size: clamp(var(--text-3xl), 1.875vw, var(--text-4xl));
    font-weight: var(--weight-bold);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-tight);
  }

  p {
    margin: 0;
    color: var(--color-ink-soft);
    font-size: var(--text-base);
    font-weight: var(--weight-normal);
    line-height: var(--leading-relaxed);
  }
}

.diagnostic-quota-panel {
  display: grid;
  grid-template-columns: minmax(170px, 0.65fr) minmax(0, 1.35fr);
  align-items: center;
  gap: var(--profile-card-gap-lg);
  padding: clamp(16px, 1.25vw, 20px) var(--profile-card-pad);
  border-bottom: 1px solid var(--color-line-soft);
  background: var(--color-surface);
}

.diagnostic-quota-heading {
  flex: 0 0 auto;

  h2 {
    margin: 0 0 6px;
    color: var(--color-ink);
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
  }

  p {
    margin: 0;
    color: var(--color-ink-muted);
    font-size: var(--text-sm);
  }
}

.diagnostic-quota-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--profile-card-gap);
  min-width: 0;
}

.diagnostic-quota-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.diagnostic-quota-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  background: var(--color-hover);
  color: var(--color-ink-soft);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color var(--duration-base) ease,
    background var(--duration-base) ease,
    color var(--duration-base) ease,
    transform var(--duration-base) ease;

  strong {
    color: var(--color-ink);
  }

  &:hover {
    border-color: var(--color-ink);
    transform: translateY(-1px);
  }
}

.diagnostic-quota-pill--active {
  border-color: var(--color-ink);
  background: var(--color-ink);
  color: var(--color-ink-inverse);

  strong {
    color: var(--color-ink-inverse);
  }
}

.diagnostic-quota-pill--empty:not(.diagnostic-quota-pill--active) {
  background: var(--color-surface-alt);
  color: var(--color-ink-muted);
}

.diagnostic-quota-button {
  flex: 0 0 auto;
  min-width: 176px;
  height: 42px;
  padding: 0 20px;
  border-radius: var(--radius-md);
}

.profile-grid {
  display: grid;
  grid-template-columns: var(--profile-sidebar-width) minmax(0, 1fr);
  gap: var(--profile-card-gap-lg);
  margin-top: var(--profile-card-gap-lg);
}

.student-card,
.learning-overview-panel,
.form-panel,
.subscription-panel,
.payment-panel {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.student-card {
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  justify-items: center;
  gap: 10px;
  align-self: stretch;
  min-height: 0;
  padding: clamp(20px, 1.5vw, 24px) var(--profile-card-pad-x) 18px;

  strong {
    color: var(--color-ink);
    font-size: clamp(var(--text-lg), 1.25vw, var(--text-xl));
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-tight);
  }
}

.student-card .diagnostic-quota-button {
  width: auto;
  min-width: 0;
  margin-top: 4px;
  height: 34px;
  padding: 0 14px;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.learning-overview-panel {
  display: grid;
  grid-template-rows: auto minmax(var(--profile-overview-body-min-height), 1fr);
  overflow: hidden;
}

.student-name-row {
  display: grid;
  justify-items: center;
  gap: 8px;
  max-width: 100%;
  text-align: center;
}

.membership-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  max-width: 100%;

  :deep(.el-tag) {
    border-color: var(--color-line);
    background: var(--color-hover);
    color: var(--color-ink);
    font-weight: var(--weight-semi);
  }
}

.avatar-frame {
  display: grid;
  place-items: center;
  width: var(--profile-avatar-size);
  height: var(--profile-avatar-size);
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.free-upgrade-panel {
  min-height: var(--profile-overview-body-min-height);
  padding: clamp(20px, 1.5vw, 24px) var(--profile-card-pad);
  background: var(--color-charcoal);
  color: var(--color-ink-inverse);

  h2 {
    margin: 16px 0 12px;
    color: var(--color-ink-inverse);
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    line-height: var(--leading-snug);
    letter-spacing: var(--tracking-tight);
  }

  p {
    margin: 0 0 24px;
    color: color-mix(in srgb, var(--color-ink-inverse) 72%, transparent);
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
  }

  .button_cancel {
    height: 46px;
    padding: 0 24px;
    font-size: 15px;
  }

  .button_cancel:hover {
    transform: translateY(-2px);
  }
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--color-ink-inverse) 20%, transparent);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-ink-inverse) 10%, transparent);
  color: var(--color-ink-inverse);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.member-dashboard {
  display: grid;
  min-height: var(--profile-overview-body-min-height);
}

.metric-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: 100%;
  padding: clamp(18px, 1.5vw, 24px) var(--profile-card-pad);

  .metric-item {
    display: grid;
    align-content: center;
    justify-items: center;
    gap: clamp(12px, 1.13vw, 18px);
    min-width: 0;
    padding: clamp(10px, 0.75vw, 12px) clamp(12px, 1.13vw, 18px);
    text-align: center;
  }

  .metric-item + .metric-item {
    border-left: 1px solid var(--color-line-soft);
  }

  span {
    color: var(--color-ink-muted);
    font-size: var(--text-sm);
    font-weight: var(--weight-semi);
  }

  strong {
    color: var(--color-ink);
    font-size: clamp(var(--text-3xl), 2.5vw, var(--text-5xl));
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-tight);
    line-height: 1;
  }

  small {
    color: var(--color-ink-muted);
    font-size: var(--text-xl);
    font-weight: var(--weight-medium);
  }
}

.member-upgrade-panel {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: var(--profile-card-gap);
  min-height: 100%;
  padding: clamp(18px, 1.5vw, 24px) var(--profile-card-pad);
  text-align: center;

  h2 {
    margin: 0;
    color: var(--color-ink);
    font-size: var(--text-3xl);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-tight);
  }

  p {
    max-width: 520px;
    margin: 0;
    color: var(--color-ink-soft);
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
  }

  .button_primary {
    padding: 0 22px;
  }

  .button_primary:hover {
    transform: translateY(-2px);
  }
}

.form-panel,
.subscription-panel,
.payment-panel {
  margin-top: var(--profile-card-gap-lg);
  padding: var(--profile-card-pad);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(12px, 0.83vw, 16px);
  margin-bottom: clamp(22px, 1.46vw, 28px);

  h2 {
    margin: 0;
    color: var(--color-ink);
    font-size: clamp(var(--text-xl), 1.5vw, var(--text-2xl));
    font-weight: var(--weight-bold);
    line-height: var(--leading-snug);
    letter-spacing: var(--tracking-tight);
  }

  button:not(.button_primary):not(.button_cancel) {
    border: 0;
    background: transparent;
    color: var(--color-ink);
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: var(--weight-semi);
    cursor: pointer;
    transition: color var(--duration-base) ease;
  }

  button:not(.button_primary):not(.button_cancel):hover {
    color: var(--color-charcoal);
  }
}

.section-title > div > p {
  margin: 6px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.section-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.section-actions .text-button {
  min-width: 62px;
  height: var(--height-button-sm);
  padding: 0 14px;
}

.section-actions .primary-button {
  min-width: 62px;
  height: var(--height-button-sm);
  padding: 0 14px;
}

.readonly-form {
  display: grid;
  gap: clamp(18px, 1.15vw, 22px) clamp(24px, 1.67vw, 32px);

  label {
    display: grid;
    grid-template-columns: 78px minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  span {
    color: var(--color-ink);
    font-size: var(--text-sm);
    font-weight: var(--weight-semi);
    white-space: nowrap;
  }

  input {
    width: 100%;
    min-width: 0;
    height: 40px;
    padding: 0 12px;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-ink);
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }

  :deep(.el-input__wrapper) {
    min-height: 40px;
    padding: 0 12px;
    border-radius: var(--radius-md);
    box-shadow: 0 0 0 1px var(--color-line) inset;
  }

  :deep(.el-input__inner) {
    color: var(--color-ink);
    font-weight: var(--weight-medium);
  }

  :deep(.el-input.is-disabled .el-input__wrapper) {
    background: var(--color-surface-alt);
  }
}

.readonly-form--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.readonly-form--profile-edit {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 28px;
}

.profile-edit-content {
  width: min(100%, 1080px);
}

.readonly-form--profile-edit > label {
  grid-template-columns: 76px minmax(0, 1fr);
  align-items: start;
}

.readonly-form--profile-edit > label > span {
  padding-top: 10px;
}

.profile-field-control {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.profile-field-control small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  line-height: var(--leading-relaxed);
}

.profile-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.profile-summary-grid article {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 16px 18px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.profile-summary-grid span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.profile-summary-grid strong {
  overflow-wrap: anywhere;
  color: var(--color-ink);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}

.exam-summary-list {
  display: grid;
  gap: 18px;
}

.exam-summary-card {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
}

.exam-summary-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--color-line-soft);
  background: var(--color-surface);
}

.exam-summary-header > span {
  display: grid;
  place-items: center;
  min-width: 58px;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}

.exam-summary-header div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.exam-summary-header strong {
  color: var(--color-ink);
  font-size: var(--text-base);
  font-weight: var(--weight-bold);
}

.exam-summary-header small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.exam-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}

.exam-summary-item {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
  min-height: 76px;
  padding: 14px 16px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.exam-summary-item span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.exam-summary-item strong {
  overflow-wrap: anywhere;
  color: var(--color-ink);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  line-height: var(--leading-relaxed);
}

.exam-summary-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 36px 24px;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
  text-align: center;
}

.exam-summary-empty strong {
  color: var(--color-ink);
  font-size: var(--text-base);
}

.exam-summary-empty span {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.email-verification-panel {
  display: grid;
  gap: 14px;
  max-width: none;
  margin-top: 22px;
  padding: 18px 20px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.email-verification-heading {
  display: grid;
  gap: 4px;
}

.email-verification-heading strong {
  color: var(--color-ink);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
}

.email-verification-heading span {
  overflow-wrap: anywhere;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.email-verification-row {
  display: grid;
  grid-template-columns: minmax(0, 520px) 150px;
  align-items: center;
  gap: 12px;
}

.email-verification-row :deep(.el-input__wrapper),
.password-form :deep(.el-input__wrapper) {
  height: 40px;
  min-height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: 0 0 0 1px var(--color-line) inset;
}

.email-verification-row :deep(.el-input__inner),
.password-form :deep(.el-input__inner) {
  color: var(--color-ink);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.password-edit-section,
.current-device-section {
  margin-top: clamp(24px, 1.67vw, 32px);
  padding-top: clamp(22px, 1.46vw, 28px);
  border-top: 1px solid var(--color-line-soft);
}

.password-edit-section {
  padding: 24px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
}

.profile-subsection-heading {
  display: grid;
  gap: 5px;
  margin-bottom: 18px;
}

.profile-subsection-heading h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}

.profile-subsection-heading p {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.password-edit-section button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.password-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) 140px;
  gap: 12px;
  align-items: center;
  max-width: 1120px;
}

.password-form > button {
  min-width: 140px;
  width: 100%;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.session-item small {
  display: block;
  margin: 4px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.current-device-empty {
  padding: 18px;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  text-align: center;
}

.subscription-center {
  margin-top: var(--profile-card-gap-lg);
}

.payment-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(12px, 0.83vw, 16px);
  padding: 0 0 clamp(22px, 1.46vw, 28px);
  border-bottom: 1px solid var(--color-line-soft);

  article {
    display: grid;
    gap: 6px;
    padding: clamp(16px, 1.25vw, 20px);
    border: 1px solid var(--color-line-soft);
    border-radius: var(--radius-lg);
    background: var(--color-surface-alt);
  }

  span,
  small {
    color: var(--color-ink-muted);
    font-size: var(--text-xs);
    font-weight: var(--weight-semi);
  }

  strong {
    color: var(--color-ink);
    font-size: clamp(var(--text-xl), 1.5vw, var(--text-2xl));
    font-weight: var(--weight-bold);
  }
}

.record-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(14px, 0.94vw, 18px);
  margin: clamp(22px, 1.46vw, 28px) 0;
}

.record-tabs {
  display: inline-grid;
  grid-template-columns: repeat(4, minmax(78px, 1fr));
  padding: 4px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-hover);

  button {
    height: 30px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-ink-soft);
    font-family: inherit;
    font-size: var(--text-xs);
    font-weight: var(--weight-semi);
    cursor: pointer;
    transition:
      background var(--duration-base) ease,
      color var(--duration-base) ease;

    &.active {
      background: var(--color-ink);
      color: var(--color-ink-inverse);
    }
  }
}

.record-tabs--payment {
  grid-template-columns: repeat(5, minmax(78px, 1fr));
}

.subscription-center .record-toolbar {
  margin: 0 0 clamp(22px, 1.46vw, 28px);
}

.subscription-center .record-tabs {
  border-color: transparent;
  background: var(--color-info-bg);
}

.subscription-center .record-tabs button.active {
  background: var(--color-surface);
  color: var(--color-report-blue);
  box-shadow: var(--shadow-sm);
}

.subscription-sort-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink-soft);
  font-family: inherit;
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition:
    border-color var(--duration-base) ease,
    color var(--duration-base) ease;
}

.subscription-sort-button:hover {
  border-color: var(--color-report-blue);
  color: var(--color-report-blue);
}

.record-sort-hint {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.record-list {
  display: grid;
  gap: clamp(10px, 0.88vw, 14px);
  padding: 0;
}

.record-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--profile-card-gap-lg);
  padding: clamp(16px, 1.38vw, 22px) var(--profile-card-pad-x);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  transition:
    border-color var(--duration-slow) ease,
    box-shadow var(--duration-slow) ease,
    transform var(--duration-slow) ease;
}

.record-card:hover {
  border-color: var(--color-ink);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.subscription-center .record-card {
  min-height: 126px;
  border-color: var(--color-line);
  box-shadow: var(--shadow-sm);
}

.subscription-center .record-card:hover {
  border-color: color-mix(in srgb, var(--color-report-blue) 35%, var(--color-line));
  box-shadow: var(--shadow-md);
}

.subscription-center .record-main p {
  margin-bottom: 0;
}

.subscription-payment-meta {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--color-line-soft);
}

.subscription-center .record-side {
  min-width: 104px;
}

.subscription-center .record-status--active {
  background: color-mix(in srgb, var(--color-report-blue) 12%, var(--color-surface));
  color: var(--color-report-blue);
}

.subscription-center .record-status--expired {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.subscription-center .record-button.button_cancel {
  border-color: transparent;
  background: color-mix(in srgb, var(--color-report-blue) 8%, var(--color-surface));
  color: var(--color-report-blue);
}

.subscription-center .record-button.button_cancel:hover {
  border-color: color-mix(in srgb, var(--color-report-blue) 24%, var(--color-line));
  background: color-mix(in srgb, var(--color-report-blue) 13%, var(--color-surface));
}

.record-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: clamp(28px, 2.5vw, 40px) 24px;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
  text-align: center;
}

.record-empty strong {
  color: var(--color-ink);
  font-size: var(--text-base);
}

.record-empty span {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.record-empty button {
  margin-top: 8px;
}

.record-empty--error strong,
.record-empty--error span {
  color: var(--color-danger);
}

.record-main {
  min-width: 0;

  h3 {
    margin: 0 0 8px;
    color: var(--color-ink);
    font-size: var(--text-base);
    font-weight: var(--weight-semi);
    letter-spacing: var(--tracking-tight);
  }

  p {
    margin: 0 0 28px;
    color: var(--color-ink-muted);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
  }
}

.payment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(24px, 2.19vw, 42px);

  span {
    display: grid;
    gap: 5px;
    color: var(--color-ink-muted);
    font-size: var(--text-xs);
    font-weight: var(--weight-semi);
  }

  strong {
    color: var(--color-ink);
    font-size: var(--text-sm);
    font-weight: var(--weight-semi);
  }
}

.record-side {
  display: grid;
  justify-items: end;
  align-content: space-between;
  gap: clamp(24px, 1.88vw, 36px);
}

.record-status {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.record-status--active {
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}

.record-status--expired {
  background: var(--color-hover);
  color: var(--color-ink-muted);
}

.record-status--cancelled {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.record-status--pending,
.record-status--refunding {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.record-status--paid {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.record-status--failed,
.record-status--refunded {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.record-status--closed {
  background: var(--color-hover);
  color: var(--color-ink-muted);
}

.record-button {
  min-width: auto;
  height: 32px;
  padding: 0 14px;
  font-size: var(--text-xs);
}

.record-button:hover {
  transform: translateY(-1px);
}

.load-warning {
  margin: 16px 0 0;
  color: var(--color-warning);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

/* 报考目标编辑 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.exam-edit-mode {
  display: grid;
  gap: 22px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  color: var(--color-ink);
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
  padding: 8px 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  user-select: none;
  transition: all var(--duration-base) ease;

  &:hover {
    border-color: var(--color-ink);
    color: var(--color-ink);
  }
}

.exam-type-chip--active,
.subject-chip--active {
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  border-color: var(--color-ink);
}

.subject-chip--required {
  cursor: not-allowed;
  opacity: 0.75;
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
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  color: var(--color-ink-muted);
}

.goal-group {
  padding: 16px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.goal-group > strong {
  display: block;
  margin-bottom: 12px;
  font-size: var(--text-sm);
}

.goal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.goal-grid label {
  display: grid;
  gap: 6px;
}

.goal-grid span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.goal-grid input {
  width: 100%;
  height: var(--height-input-sm);
  padding: 0 12px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font-family: inherit;
  outline: none;
}

.goal-grid input:focus {
  border-color: var(--color-ink);
}

.goal-grid :deep(.el-select) {
  width: 100%;
}

/* 个人中心沿用诊断报告功能色建立层次，现有布局尺寸和模块顺序保持不变。 */
.profile-page {
  background:
    radial-gradient(
      circle at 92% 4%,
      color-mix(in srgb, var(--color-report-blue) 9%, transparent) 0,
      transparent 30%
    ),
    radial-gradient(
      circle at 6% 42%,
      color-mix(in srgb, var(--color-report-purple) 6%, transparent) 0,
      transparent 26%
    ),
    var(--color-bg);
}

.page-heading {
  position: relative;
  border-bottom-color: color-mix(in srgb, var(--color-report-blue) 18%, var(--color-line));
}

.page-heading::after {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 112px;
  height: 3px;
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, var(--color-report-blue), var(--color-report-purple));
  content: '';
}

.student-card,
.learning-overview-panel,
.form-panel,
.subscription-panel,
.payment-panel {
  border-color: color-mix(in srgb, var(--color-report-slate) 22%, var(--color-line));
  box-shadow:
    var(--shadow-sm),
    0 12px 32px color-mix(in srgb, var(--color-report-slate) 8%, transparent);
}

.student-card {
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--color-report-purple-soft) 58%, var(--color-surface)) 0%,
    var(--color-surface) 42%
  );
}

.avatar-frame {
  background: linear-gradient(145deg, var(--color-report-blue), var(--color-report-purple));
  box-shadow: 0 10px 24px color-mix(in srgb, var(--color-report-purple) 24%, transparent);
}

.membership-tags :deep(.el-tag) {
  border-color: color-mix(in srgb, var(--color-report-purple) 18%, var(--color-line));
  background: var(--color-report-purple-soft);
  color: var(--color-report-purple);
}

.student-card .diagnostic-quota-button {
  border-color: color-mix(in srgb, var(--color-report-blue) 24%, var(--color-line));
  background: color-mix(in srgb, var(--color-report-blue) 9%, var(--color-surface));
  color: color-mix(in srgb, var(--color-report-blue) 48%, var(--color-ink-soft));
  box-shadow: none;
}

.student-card .diagnostic-quota-button:hover,
.student-card .diagnostic-quota-button:focus {
  border-color: color-mix(in srgb, var(--color-report-blue) 36%, var(--color-line));
  background: color-mix(in srgb, var(--color-report-blue) 14%, var(--color-surface));
  color: color-mix(in srgb, var(--color-report-blue) 58%, var(--color-ink-soft));
}

.diagnostic-quota-panel {
  background: linear-gradient(
    115deg,
    color-mix(in srgb, var(--color-report-blue) 7%, var(--color-surface)) 0%,
    color-mix(in srgb, var(--color-report-purple-soft) 45%, var(--color-surface)) 100%
  );
}

.diagnostic-quota-heading h2 {
  color: var(--color-report-blue);
}

.diagnostic-quota-pill {
  border-color: color-mix(in srgb, var(--color-report-blue) 13%, var(--color-line));
  background: color-mix(in srgb, var(--color-report-blue) 4%, var(--color-surface));
}

.diagnostic-quota-pill:hover {
  border-color: var(--color-report-blue);
  color: var(--color-report-blue);
}

.diagnostic-quota-pill--active {
  border-color: color-mix(in srgb, var(--color-report-blue) 50%, var(--color-ink-soft));
  background: color-mix(in srgb, var(--color-report-blue) 48%, var(--color-ink-soft));
  box-shadow: none;
}

.diagnostic-quota-pill--unavailable,
.diagnostic-quota-pill--unavailable:hover {
  border-color: var(--color-line);
  border-style: dashed;
  background: color-mix(in srgb, var(--color-report-purple-soft) 36%, var(--color-surface));
  color: var(--color-ink-muted);
}

.metric-panel .metric-item:nth-child(1) strong {
  color: var(--color-report-purple);
}

.metric-panel .metric-item:nth-child(2) strong {
  color: var(--color-report-green);
}

.metric-panel .metric-item:nth-child(3) strong {
  color: var(--color-report-orange);
}

.metric-panel,
.member-upgrade-panel {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-report-blue) 5%, var(--color-surface)),
    color-mix(in srgb, var(--color-report-purple-soft) 68%, var(--color-surface))
  );
}

.member-upgrade-panel h2 {
  color: var(--color-report-purple);
}

.member-upgrade-panel .button_primary {
  border-color: color-mix(in srgb, var(--color-report-blue) 52%, var(--color-ink-soft));
  background: color-mix(in srgb, var(--color-report-blue) 52%, var(--color-ink-soft));
}

.free-upgrade-panel {
  background: linear-gradient(
    135deg,
    var(--color-charcoal),
    color-mix(in srgb, var(--color-report-purple) 28%, var(--color-charcoal))
  );
}

.section-title h2 {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.section-title h2::before {
  width: 4px;
  height: 22px;
  border-radius: var(--radius-pill);
  background: var(--color-report-blue);
  content: '';
}

.subscription-panel .section-title h2::before {
  background: var(--color-report-purple);
}

.payment-panel .section-title h2::before {
  background: var(--color-report-green);
}

.form-panel :deep(.el-input__wrapper:hover),
.form-panel :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-report-blue) 45%, var(--color-line)) inset;
}

.form-panel :deep(.el-input__wrapper.is-focus),
.form-panel :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--color-report-blue) inset;
}

.exam-summary-card {
  background: color-mix(in srgb, var(--color-report-blue) 3%, var(--color-surface-alt));
}

.exam-summary-header {
  background: color-mix(in srgb, var(--color-report-blue) 5%, var(--color-surface));
}

.exam-summary-header > span {
  background: linear-gradient(105deg, var(--color-report-blue), var(--color-report-purple));
}

.session-item {
  background: color-mix(in srgb, var(--color-report-blue) 3%, var(--color-surface-alt));
}

.payment-summary article:nth-child(1) strong {
  color: var(--color-report-blue);
}

.payment-summary article:nth-child(2) strong {
  color: var(--color-report-green);
}

.payment-summary article:nth-child(3) strong {
  color: var(--color-report-orange);
}

.payment-panel .record-tabs button.active {
  background: color-mix(in srgb, var(--color-report-blue) 48%, var(--color-ink-soft));
  color: var(--color-ink-inverse);
}

.record-empty {
  background: color-mix(in srgb, var(--color-report-blue) 3%, var(--color-surface-alt));
}

.exam-type-chip--active,
.subject-chip--active {
  border-color: color-mix(in srgb, var(--color-report-blue) 48%, var(--color-ink-soft));
  background: color-mix(in srgb, var(--color-report-blue) 48%, var(--color-ink-soft));
}

.exam-type-chip:hover,
.subject-chip:hover,
.goal-grid input:focus {
  border-color: var(--color-report-blue);
  color: var(--color-report-blue);
}

.exam-type-chip--unavailable,
.exam-type-chip--unavailable:hover {
  gap: 7px;
  border-color: var(--color-line);
  border-style: dashed;
  background: var(--color-surface-alt);
  color: var(--color-ink-muted);
}

.exam-type-chip--unavailable small {
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.goal-group {
  background: color-mix(in srgb, var(--color-report-purple-soft) 32%, var(--color-surface-alt));
}

/* 截图还原：学生档案首页使用冷白画布、紫色权益区和细线目标清单。 */
.profile-page {
  --profile-lilac: #6453f6;
  --profile-lilac-dark: #4938e7;
  --profile-lilac-soft: #f1efff;
  --profile-blue: #5276ff;
  --profile-mint: #3dbb91;
  --profile-orange: #f5a24c;
  --profile-text: #202338;
  --profile-muted: #6d748c;
  --profile-line: #e3e7f1;
  background: #f7f8fd;
  color: var(--profile-text);
}

.profile-shell {
  padding-top: 26px;
}

.page-heading {
  padding-bottom: 16px;
  border-bottom: 0;
}

.page-heading::after {
  display: none;
}

.page-heading h1 {
  margin-bottom: 6px;
  color: var(--profile-text);
  font-size: 30px;
  font-weight: 760;
  letter-spacing: -0.03em;
}

.page-heading p {
  color: var(--profile-muted);
  font-size: 13px;
}

.profile-identity-card,
.profile-membership-panel,
.profile-target-panel,
.form-panel,
.subscription-panel,
.payment-panel {
  border: 1px solid rgba(220, 225, 239, 0.88);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(44, 49, 86, 0.07);
}

.profile-identity-card {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr) minmax(250px, 340px);
  align-items: center;
  min-height: 204px;
  padding: 20px 28px 20px 24px;
}

.profile-identity-card::before {
  position: absolute;
  inset: 0 0 0 auto;
  width: 42%;
  background: linear-gradient(90deg, transparent, rgba(242, 241, 255, 0.76));
  content: '';
  pointer-events: none;
}

.profile-avatar-wrap {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 9px;
  justify-self: start;
}

.profile-identity-card .avatar-frame {
  width: 112px;
  height: 112px;
  border: 8px solid #eeedff;
  background: linear-gradient(145deg, #8d81ff, #5544f7);
  box-shadow: none;
  color: #fff;
  font-size: 38px;
}

.profile-account-edit {
  padding: 0;
  border: 0;
  background: transparent;
  color: #9a9fb0;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  cursor: pointer;
  transition:
    color 160ms ease,
    transform 160ms ease;
}

.profile-account-edit:hover {
  color: #4938e9;
  transform: translateY(-1px);
}

.profile-account-edit:focus-visible {
  outline: 2px solid var(--profile-lilac);
  outline-offset: 3px;
  border-radius: 3px;
}

:global(.profile-account-dialog) {
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  border-radius: 14px;
  box-shadow: 0 24px 64px rgba(44, 49, 86, 0.2);
}

:global(.profile-account-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 22px 24px 16px;
  border-bottom: 1px solid #eceef5;
}

:global(.profile-account-dialog .el-dialog__title) {
  color: #25283b;
  font-size: 19px;
  font-weight: 750;
}

:global(.profile-account-dialog .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.account-dialog-content {
  display: grid;
}

.account-dialog-section {
  display: grid;
  gap: 14px;
  padding: 24px 0;
}

.account-dialog-section + .account-dialog-section {
  border-top: 1px solid #eceef5;
}

.account-dialog-heading {
  display: flex;
  align-items: flex-start;
  gap: 11px;
}

.account-dialog-heading > span {
  display: grid;
  place-items: center;
  flex: 0 0 26px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #eeedff;
  color: #5d4dff;
  font-size: 12px;
  font-weight: 750;
}

.account-dialog-heading > div {
  display: grid;
  gap: 3px;
}

.account-dialog-heading h3 {
  margin: 0;
  color: #25283b;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.5;
}

.account-dialog-heading p {
  margin: 0;
  overflow-wrap: anywhere;
  color: #858aa0;
  font-size: 12px;
  line-height: 1.6;
}

.account-dialog-section :deep(.el-input__wrapper) {
  min-height: 42px;
  padding: 0 13px;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dfe2ec inset;
}

.account-dialog-section :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #7769f8 inset;
}

.account-email-verification {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.account-email-actions {
  display: grid;
  grid-template-columns: repeat(2, 128px);
  gap: 10px;
}

.account-code-button {
  width: 100%;
  min-width: 0;
  height: 42px;
}

.account-password-form {
  grid-template-columns: 1fr;
  gap: 10px;
  max-width: none;
}

.account-dialog-actions {
  display: flex;
  justify-content: flex-end;
}

.account-dialog-actions .button_primary,
.account-email-actions .button_primary {
  min-width: 120px;
  height: 40px;
  padding: 0 20px;
}

.account-dialog-section button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.profile-inline-action:focus-visible,
.membership-plan-action:focus-visible,
.membership-exam-switch button:focus-visible {
  outline: 2px solid var(--profile-lilac);
  outline-offset: 3px;
}

.profile-identity-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
  padding-left: 18px;
}

.profile-name-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.profile-name-line h2 {
  margin: 0;
  color: var(--profile-text);
  font-size: 22px;
  font-weight: 760;
  letter-spacing: -0.02em;
}

.profile-membership-chip {
  min-height: 23px;
  display: inline-flex;
  align-items: center;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--profile-lilac-soft);
  color: var(--profile-lilac-dark);
  font-size: 11px;
  font-weight: 680;
}

.profile-identity-list {
  display: grid;
  gap: 13px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.profile-identity-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: #565e78;
  font-size: 13px;
}

.profile-identity-list .el-icon {
  flex: none;
  color: #707794;
  font-size: 16px;
}

.profile-placeholder-badge {
  min-height: 17px;
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  border-radius: 999px;
  background: #f1f2f7;
  color: #8d92a5;
  font-size: 9px;
  font-style: normal;
  font-weight: 650;
  white-space: nowrap;
}

.profile-study-illustration {
  position: relative;
  z-index: 1;
  justify-self: end;
  width: min(100%, 320px);
}

.profile-study-illustration svg {
  display: block;
  width: 100%;
  height: auto;
}

.profile-dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
  gap: 16px;
  margin-top: 16px;
}

.profile-membership-panel,
.profile-target-panel {
  min-width: 0;
  padding: 18px 20px 16px;
}

.profile-card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.profile-card-heading h2 {
  margin: 0;
  color: var(--profile-text);
  font-size: 16px;
  font-weight: 760;
  letter-spacing: -0.01em;
}

.profile-card-heading > span {
  color: #9a9fb0;
  font-size: 10px;
}

.profile-inline-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 0;
  border: 0;
  background: transparent;
  color: var(--profile-lilac);
  font-family: inherit;
  font-size: 11px;
  font-weight: 680;
  cursor: pointer;
}

.membership-plan-banner {
  position: relative;
  overflow: hidden;
  min-height: 88px;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid rgba(184, 173, 255, 0.8);
  border-radius: 12px;
  background:
    radial-gradient(circle at 98% -12%, rgba(150, 132, 255, 0.45), transparent 38%),
    radial-gradient(circle at 4% 112%, rgba(255, 255, 255, 0.76), transparent 34%),
    linear-gradient(120deg, #e7e0ff 0%, #f9f8ff 51%, #e8edff 100%);
  color: #fff;
  box-shadow: 0 14px 30px rgba(82, 63, 174, 0.13);
}

.membership-plan-banner--member::after {
  position: absolute;
  top: -52px;
  right: 78px;
  width: 142px;
  height: 142px;
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 50%;
  box-shadow:
    0 0 0 18px rgba(255, 255, 255, 0.1),
    0 0 0 42px rgba(255, 255, 255, 0.06);
  content: '';
  pointer-events: none;
}

.membership-plan-banner--free {
  border-color: rgba(190, 202, 224, 0.94);
  background:
    radial-gradient(circle at 94% 0%, rgba(137, 155, 193, 0.36), transparent 38%),
    radial-gradient(circle at 6% 112%, rgba(255, 255, 255, 0.72), transparent 32%),
    linear-gradient(120deg, #eaf0fa 0%, #f9fbff 54%, #e2eaf6 100%);
  box-shadow: 0 13px 28px rgba(76, 87, 120, 0.12);
}

.membership-plan-banner--free::after {
  position: absolute;
  right: -24px;
  bottom: -78px;
  width: 214px;
  height: 164px;
  border-radius: 50%;
  background: repeating-radial-gradient(
    ellipse at 74% 86%,
    transparent 0 18px,
    rgba(111, 130, 168, 0.13) 19px 20px,
    transparent 21px 34px
  );
  content: '';
  opacity: 0.86;
  pointer-events: none;
  transform: rotate(-10deg);
}

.membership-plan-icon {
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.76), rgba(220, 212, 255, 0.72));
  color: #654cff;
  font-size: 28px;
  box-shadow: 0 8px 18px rgba(85, 65, 177, 0.12);
  z-index: 1;
}

.membership-plan-banner--free .membership-plan-icon {
  border-color: rgba(255, 255, 255, 0.92);
  background: linear-gradient(135deg, #ffffff, #e8edf5);
  color: #71809d;
  box-shadow: 0 8px 18px rgba(76, 87, 120, 0.09);
}

.membership-plan-banner > div {
  display: grid;
  gap: 3px;
  min-width: 0;
  z-index: 1;
}

.membership-plan-banner > div > small {
  color: #756f9b;
  font-size: 9px;
}

.membership-plan-banner > div > strong {
  color: #342562;
  font-size: 19px;
  font-weight: 720;
}

.membership-plan-banner > div > span {
  color: #716b94;
  font-size: 10px;
}

.membership-plan-banner--free > div > small,
.membership-plan-banner--free > div > span {
  color: #79849a;
}

.membership-plan-banner--free > div > strong {
  color: #38435c;
}

.membership-plan-action {
  position: relative;
  z-index: 1;
  min-width: 76px;
  height: 31px;
  padding: 0 13px;
  border: 0;
  border-radius: 5px;
  background: linear-gradient(135deg, #735cff, #5940e7);
  color: #fff;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 7px 16px rgba(83, 54, 232, 0.2);
  transition:
    box-shadow 180ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.membership-plan-action:hover {
  box-shadow: 0 8px 18px rgba(83, 54, 232, 0.22);
  transform: translateY(-2px);
}

.membership-plan-banner--free .membership-plan-action {
  border: 1px solid rgba(111, 124, 151, 0.42);
  background: rgba(255, 255, 255, 0.74);
  color: #55627d;
  box-shadow: 0 7px 16px rgba(76, 87, 120, 0.1);
}

.membership-plan-banner--free .membership-plan-action:hover {
  border-color: rgba(96, 109, 139, 0.64);
  box-shadow: 0 9px 18px rgba(76, 87, 120, 0.16);
}

.membership-benefit-board {
  position: relative;
  display: grid;
  gap: 12px;
  margin-top: 0;
  padding: 12px;
  border: 1px solid rgba(221, 218, 246, 0.94);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(249, 248, 255, 0.88) 0%, rgba(255, 255, 255, 0.98) 100%),
    #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.88);
}

.membership-benefit-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--profile-line);
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}

.membership-benefit-grid article {
  min-width: 0;
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 12px 6px 10px;
  text-align: center;
}

.membership-benefit-grid article + article {
  border-left: 1px solid var(--profile-line);
}

.membership-benefit-grid .el-icon {
  color: var(--profile-lilac);
  font-size: 17px;
}

.membership-benefit-grid article > span {
  min-height: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: #60677f;
  font-size: 10px;
}

.membership-benefit-grid article > strong {
  color: var(--profile-lilac);
  font-size: 18px;
  font-weight: 740;
  line-height: 1.15;
}

.membership-benefit-grid article > strong > small {
  margin-left: 3px;
  font-size: 9px;
  font-weight: 600;
}

.membership-benefit-grid .benefit-text-value {
  font-size: 16px;
}

.membership-benefit-grid article > small {
  color: #a0a5b4;
  font-size: 8px;
}

.membership-exam-switch {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  width: fit-content;
  max-width: 100%;
  margin: 10px 0 10px;
  padding: 4px;
  border: 1px solid rgba(225, 222, 245, 0.9);
  border-radius: 14px;
  background: linear-gradient(135deg, #f4f2ff, #fbfbff);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.membership-exam-switch button {
  position: relative;
  min-height: 31px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: #7a7f96;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease,
    color 160ms ease;
}

.membership-exam-switch button strong {
  color: inherit;
  font-size: 11px;
}

.membership-exam-switch button.active {
  border-color: rgba(255, 255, 255, 0.86);
  background: #fff;
  color: var(--profile-lilac-dark);
  box-shadow: 0 4px 12px rgba(71, 59, 147, 0.12);
}

.membership-exam-switch-pointer {
  position: absolute;
  left: 50%;
  bottom: -11px;
  width: 24px;
  height: 12px;
  fill: #fff;
  filter: drop-shadow(0 4px 4px rgba(71, 59, 147, 0.09));
  pointer-events: none;
  transform: translateX(-50%);
}

.membership-exam-switch button.unavailable {
  cursor: not-allowed;
  opacity: 0.52;
}

.membership-summary-note {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 10px;
  border: 1px solid var(--profile-line);
  border-radius: 10px;
  background: #fff9ef;
  color: #8a7559;
  font-size: 9px;
}

.membership-summary-note button {
  flex: none;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: #b87c31;
  font-family: inherit;
  font-size: 9px;
  font-weight: 680;
  cursor: pointer;
}

.profile-target-panel {
  display: flex;
  flex-direction: column;
}

.profile-target-edit-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.profile-target-cancel,
.profile-target-save {
  height: 26px;
  padding: 0 10px;
  border-radius: 5px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 680;
  cursor: pointer;
}

.profile-target-cancel {
  border: 1px solid var(--profile-line);
  background: #fff;
  color: #666d82;
}

.profile-target-save {
  border: 1px solid var(--profile-lilac);
  background: var(--profile-lilac);
  color: #fff;
}

.profile-target-save:disabled {
  cursor: wait;
  opacity: 0.62;
}

.profile-target-cancel:focus-visible,
.profile-target-save:focus-visible {
  outline: 2px solid var(--profile-lilac);
  outline-offset: 2px;
}

.profile-target-row-input {
  width: 100%;
  height: 28px;
  padding: 0 9px;
  border: 1px solid var(--profile-line);
  border-radius: 5px;
  outline: 0;
  background: #fff;
  color: var(--profile-text);
  font-family: inherit;
  font-size: 10px;
  line-height: 28px;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.profile-target-row-input:focus {
  border-color: var(--profile-lilac);
  box-shadow: 0 0 0 2px rgba(105, 85, 255, 0.1);
}

.profile-target-row-select {
  width: 100%;
}

.profile-target-exam-content {
  display: grid;
  gap: 7px;
}

.profile-exam-editor,
.profile-exam-subject-editor {
  display: grid;
  gap: 7px;
}

.profile-exam-type-group,
.profile-exam-subject-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.profile-exam-choice,
.profile-exam-subject-choice {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--profile-line);
  border-radius: 6px;
  background: #fff;
  color: #5f6578;
  font-family: inherit;
  font-size: 9px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  transition:
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

.profile-exam-choice {
  min-width: 52px;
  height: 25px;
  padding: 0 9px;
  gap: 5px;
}

.profile-exam-choice small {
  font-size: 8px;
}

.profile-exam-subject-choice {
  min-height: 23px;
  padding: 0 6px;
}

.profile-exam-subject-choices {
  flex-wrap: nowrap;
  gap: 4px;
}

.profile-exam-choice:hover:not(:disabled),
.profile-exam-subject-choice:hover:not(:disabled) {
  border-color: rgba(105, 85, 255, 0.55);
  background: rgba(105, 85, 255, 0.035);
  color: var(--profile-lilac);
}

.profile-exam-choice.is-active,
.profile-exam-subject-choice.is-active {
  border-color: rgba(105, 85, 255, 0.42);
  background: rgba(105, 85, 255, 0.1);
  color: var(--profile-lilac);
  font-weight: 700;
}

.profile-exam-choice.is-unavailable {
  border-style: dashed;
  cursor: not-allowed;
  opacity: 0.58;
}

.profile-exam-subject-choice:disabled {
  cursor: not-allowed;
  opacity: 1;
}

.profile-exam-subject-editor section {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: center;
  gap: 6px;
}

.profile-exam-editor-label {
  display: block;
  color: #72788c;
  font-size: 9px;
  font-weight: 650;
}

.profile-exam-editor-hint {
  color: #979cad;
  font-size: 9px;
}

.profile-target-subjects {
  display: grid;
  gap: 3px;
}

.profile-subject-group {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 24px;
  min-width: 0;
}

.profile-subject-group + .profile-subject-group {
  border-top: 0;
}

.profile-subject-exam {
  color: var(--profile-lilac);
  font-size: 9px;
  font-weight: 760;
  letter-spacing: 0.02em;
}

.profile-target-subjects > span {
  color: #8a8fa1;
}

.profile-target-row-select :deep(.el-select__wrapper) {
  height: auto;
  min-height: 28px;
  padding: 3px 9px;
  border-radius: 5px;
  box-shadow: 0 0 0 1px var(--profile-line) inset;
}

.profile-target-row-select :deep(.el-select__wrapper.is-focused) {
  box-shadow:
    0 0 0 1px var(--profile-lilac) inset,
    0 0 0 2px rgba(105, 85, 255, 0.1);
}

.profile-target-row-select :deep(.el-select__placeholder),
.profile-target-row-select :deep(.el-select__selected-item) {
  font-size: 10px;
}

.profile-target-row-select :deep(.el-tag) {
  max-width: calc(100% - 22px);
  height: 20px;
  font-size: 9px;
}

.profile-target-row-number {
  width: 100%;
}

.profile-target-row-number :deep(.el-input__wrapper) {
  height: 28px;
  padding: 0 32px 0 9px;
  border-radius: 5px;
  box-shadow: 0 0 0 1px var(--profile-line) inset;
}

.profile-target-row-number :deep(.el-input__inner) {
  font-size: 10px;
  text-align: left;
}

.profile-target-row-number :deep(.el-input-number__increase),
.profile-target-row-number :deep(.el-input-number__decrease) {
  width: 24px;
}

.profile-target-score-content {
  display: grid;
  gap: 3px;
}

.profile-target-score-editor,
.profile-target-score-display {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 24px;
}

.profile-target-score-display > strong {
  color: #555c73;
  font-size: 10px;
  font-weight: 600;
}

.profile-target-list {
  overflow: hidden;
  margin: 0;
  border: 1px solid var(--profile-line);
  border-radius: 8px;
}

.profile-target-list > div {
  height: auto;
  min-height: 42px;
  display: grid;
  grid-template-columns: minmax(145px, 0.85fr) minmax(0, 1.15fr);
  align-items: center;
  gap: 14px;
  padding: 6px 13px;
}

.profile-target-list > .profile-target-exam-row {
  align-items: start;
}

.profile-target-exam-row dt {
  padding-top: 7px;
}

.profile-target-list > div + div {
  border-top: 1px solid var(--profile-line);
}

.profile-target-list dt,
.profile-target-list dd {
  margin: 0;
}

.profile-target-list dt {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #71778e;
  font-size: 10px;
}

.profile-target-list dt .el-icon {
  color: var(--profile-lilac);
  font-size: 16px;
}

.profile-target-list > div:nth-child(3) dt .el-icon {
  color: var(--profile-mint);
}

.profile-target-list > div:nth-child(5) dt .el-icon {
  color: var(--profile-orange);
}

.profile-target-list dd {
  min-width: 0;
  color: #555c73;
  font-size: 10px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.form-panel,
.subscription-panel,
.payment-panel {
  border-color: rgba(220, 225, 239, 0.88);
  background: #fff;
  box-shadow: 0 8px 24px rgba(44, 49, 86, 0.055);
}

.section-title h2::before {
  display: none;
}

.section-title h2 {
  color: var(--profile-text);
  font-size: 17px;
}

.profile-summary-grid article,
.session-item,
.goal-group,
.record-empty,
.exam-summary-card {
  border-color: var(--profile-line);
  background: #fafaff;
}

.record-card {
  border-color: var(--profile-line);
  box-shadow: none;
}

.record-card:hover {
  border-color: #cdc7ff;
  box-shadow: 0 10px 24px rgba(73, 56, 231, 0.08);
}

.profile-legal-links {
  color: #8d92a5;
}

.billing-panel {
  margin-top: 18px;
  padding: clamp(22px, 2vw, 32px);
  border: 1px solid rgba(220, 225, 239, 0.92);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(44, 49, 86, 0.06);
}

.billing-heading {
  margin-bottom: 20px;
}

.billing-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.billing-summary-grid article {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  min-height: 112px;
  padding: 20px;
  border: 1px solid var(--profile-line);
  border-radius: 12px;
  background: #fff;
}

.billing-summary-grid article > div {
  display: grid;
  min-width: 0;
}

.billing-summary-grid article span,
.billing-summary-grid article small {
  color: #747b8f;
  font-size: 12px;
  line-height: 1.5;
}

.billing-summary-grid article strong {
  margin: 2px 0;
  color: #3778f6;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}

.billing-summary-grid article:nth-child(2) strong {
  color: #19ad67;
}

.billing-summary-grid article strong small {
  margin-left: 4px;
  color: currentColor;
  font-size: 14px;
  font-weight: 600;
}

.billing-summary-grid article .billing-paid-total {
  color: #f08422;
}

.billing-summary-icon {
  display: inline-flex;
  flex: 0 0 48px;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  font-size: 25px;
}

.billing-summary-icon--blue {
  color: #3778f6;
  background: #eef5ff;
}

.billing-summary-icon--green {
  color: #19ad67;
  background: #ebf9f1;
}

.billing-summary-icon--orange {
  color: #f08422;
  background: #fff5e9;
}

.billing-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 20px 0 14px;
}

.billing-tabs {
  display: inline-flex;
  gap: 3px;
  padding: 3px;
  border-radius: 9px;
  background: #f4f5f8;
}

.billing-tabs button,
.billing-sort-button,
.billing-record-card footer button,
.billing-empty-state button {
  border: 0;
  font: inherit;
  cursor: pointer;
}

.billing-tabs button {
  min-height: 34px;
  padding: 0 17px;
  border-radius: 7px;
  color: #5f667a;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;
}

.billing-tabs button:hover {
  color: #3778f6;
}

.billing-tabs button.active {
  color: #3778f6;
  background: #fff;
  box-shadow: 0 1px 5px rgba(49, 66, 115, 0.12);
}

.billing-sort-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid var(--profile-line);
  border-radius: 9px;
  color: #5f667a;
  background: #fff;
  font-size: 13px;
}

.billing-sort-button:hover {
  border-color: #b9c9ee;
  color: #3778f6;
}

.billing-tabs button:focus-visible,
.billing-sort-button:focus-visible,
.billing-record-card footer button:focus-visible,
.billing-empty-state button:focus-visible {
  outline: 2px solid #3778f6;
  outline-offset: 2px;
}

.billing-record-list {
  display: grid;
  gap: 10px;
}

.billing-record-card {
  position: relative;
  padding: 16px 18px 14px;
  border: 1px solid var(--profile-line);
  border-radius: 12px;
  background: #fff;
  transition: border-color 160ms ease;
}

.billing-record-card:hover {
  border-color: #c5d2ed;
}

.billing-record-card > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eceef5;
}

.billing-record-card h3 {
  margin: 0;
  color: var(--profile-text);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.45;
}

.billing-record-card header p {
  margin: 4px 0 0;
  color: #7b8295;
  font-size: 12px;
}

.billing-status {
  flex: 0 0 auto;
  min-width: 58px;
  padding: 4px 12px;
  border-radius: 999px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
}

.billing-status--active,
.billing-status--pending {
  color: #2f72e8;
  background: #eaf2ff;
}

.billing-status--paid {
  color: #158b56;
  background: #e9f8f0;
}

.billing-status--expired,
.billing-status--cancelled,
.billing-status--closed {
  color: #72798b;
  background: #f0f1f4;
}

.billing-status--failed {
  color: #db4d4d;
  background: #fff0f0;
}

.billing-status--refunding,
.billing-status--refunded {
  color: #d87a18;
  background: #fff4e8;
}

.billing-record-meta {
  display: grid;
  grid-template-columns: 0.7fr 1.05fr 0.85fr 0.9fr 1.65fr 1.05fr 1.05fr;
  gap: 18px;
  margin: 12px 0 0;
}

.billing-record-meta div {
  min-width: 0;
}

.billing-record-meta dt {
  margin-bottom: 5px;
  color: #83899a;
  font-size: 11px;
  line-height: 1.35;
}

.billing-record-meta dd {
  min-width: 0;
  margin: 0;
  color: #2e354a;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.billing-order-number {
  font-variant-numeric: tabular-nums;
}

.billing-record-card footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.billing-record-card footer button {
  min-width: 88px;
  min-height: 34px;
  padding: 0 16px;
  border: 1px solid #252632;
  border-radius: 8px;
  color: #fff;
  background: #252632;
  font-size: 12px;
  font-weight: 600;
}

.billing-record-card footer button:hover {
  background: #0f1017;
}

.billing-empty-state {
  display: grid;
  justify-items: center;
  gap: 6px;
  min-height: 150px;
  padding: 36px 18px;
  border: 1px dashed var(--profile-line);
  border-radius: 12px;
  color: #7b8295;
  text-align: center;
}

.billing-empty-state strong {
  color: #3f465a;
  font-size: 14px;
}

.billing-empty-state span {
  font-size: 12px;
}

.billing-empty-state button {
  min-height: 32px;
  margin-top: 8px;
  padding: 0 15px;
  border-radius: 7px;
  color: #fff;
  background: #4f46e5;
  font-size: 12px;
  font-weight: 600;
}

.billing-empty-state--error strong {
  color: #cb4545;
}

@media (max-width: 1440px) {
  .profile-identity-card {
    grid-template-columns: 118px minmax(0, 1fr) 270px;
    padding-inline: 22px;
  }

  .profile-study-illustration {
    width: 270px;
  }

  .profile-membership-panel,
  .profile-target-panel {
    padding-inline: 16px;
  }

  .membership-plan-banner {
    grid-template-columns: 48px minmax(0, 1fr) auto;
    gap: 10px;
  }

  .profile-target-list > div {
    grid-template-columns: 130px minmax(0, 1fr);
  }
}

@media (max-width: 1180px) {
  .billing-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .billing-record-meta {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .profile-dashboard-grid {
    grid-template-columns: 1fr;
  }

  .profile-target-list > div {
    grid-template-columns: minmax(118px, 0.8fr) minmax(0, 1.2fr);
  }

  .readonly-form--profile-edit,
  .password-form {
    grid-template-columns: 1fr;
  }

  .password-form > button {
    grid-column: 1;
  }

  .email-verification-row {
    grid-template-columns: 1fr;
  }

  .email-verification-row .button_cancel {
    justify-self: start;
  }

  .billing-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .billing-tabs {
    align-self: flex-start;
    max-width: 100%;
    overflow-x: auto;
  }

  .billing-tabs button {
    flex: 0 0 auto;
  }

  .billing-sort-button {
    align-self: flex-start;
  }

  .billing-record-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .profile-exam-subject-editor section {
    grid-template-columns: 1fr;
    gap: 5px;
  }

  .profile-exam-subject-choices {
    flex-wrap: wrap;
  }

  :global(.profile-account-dialog .el-dialog__header) {
    padding: 18px 18px 14px;
  }

  :global(.profile-account-dialog .el-dialog__body) {
    padding: 0 18px 18px;
  }

  .account-dialog-section {
    padding: 20px 0;
  }

  .account-email-verification {
    grid-template-columns: 1fr;
  }

  .account-email-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .billing-panel {
    padding: 18px 14px;
  }

  .billing-summary-grid {
    grid-template-columns: 1fr;
  }

  .billing-record-card > header {
    align-items: flex-start;
    flex-direction: column;
  }

  .billing-record-meta {
    grid-template-columns: 1fr;
  }
}
</style>
