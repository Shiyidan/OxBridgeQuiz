<!-- 会员权益介绍弹窗：在进入支付前说明考试会员可获得的核心学习能力。 -->
<template>
  <el-dialog
    :model-value="modelValue"
    class="membership-benefits-dialog"
    width="620px"
    align-center
    destroy-on-close
    @update:model-value="updateVisible"
  >
    <template #header>
      <div class="benefits-dialog-heading">
        <span class="benefits-dialog-kicker">MEMBERSHIP BENEFITS</span>
        <h2>会员能为备考带来什么？</h2>
        <p>开通 {{ examType }} 会员后，在权益有效期内解锁完整学习路径。</p>
      </div>
    </template>

    <div class="benefits-dialog-content">
      <div class="benefits-dialog-grid">
        <article v-for="(benefit, index) in benefits" :key="benefit.title">
          <span class="benefit-index">0{{ index + 1 }}</span>
          <div>
            <h3>{{ benefit.title }}</h3>
            <p>{{ benefit.description }}</p>
          </div>
        </article>
      </div>

      <div class="benefits-dialog-note">
        <strong>权益说明</strong>
        <p>会员按考试类型分别开通，仅对所选考试生效；会员到期后，已完成的历史报告仍可查看。</p>
      </div>
    </div>

    <template #footer>
      <div class="benefits-dialog-actions">
        <el-button @click="closeDialog">暂不需要</el-button>
        <el-button type="primary" @click="continueToPayment">
          {{ active ? '续费当前会员' : '选择套餐并开通' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
interface MembershipBenefitsDialogProps {
  modelValue: boolean
  examType: string
  active?: boolean
}

defineProps<MembershipBenefitsDialogProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  upgrade: []
}>()

const benefits = [
  {
    title: '解锁全部会员诊断卷',
    description: '使用所选考试的完整诊断内容，更全面地定位当前能力水平。',
  },
  {
    title: '模考中心全真模拟试卷',
    description: '按真实考试结构与限时节奏完成整套模拟，提前熟悉正式考试体验。',
  },
  {
    title: '专项题库不限题量',
    description: '自由选择知识点与难度，使用自由组卷和练习本进行针对性训练。',
  },
  {
    title: '完整解析与错题沉淀',
    description: '查看完整解析、错题记录和历史学习数据，方便反复复盘。',
  },
]

// 同步 Element Plus 弹窗关闭事件，保持父页面 v-model 为唯一可见状态来源。
function updateVisible(visible: boolean): void {
  emit('update:modelValue', visible)
}

// 用户暂不购买时只关闭介绍，不创建支付订单。
function closeDialog(): void {
  emit('update:modelValue', false)
}

// 用户明确选择开通后关闭介绍，并由父页面承接现有支付流程。
function continueToPayment(): void {
  emit('update:modelValue', false)
  emit('upgrade')
}
</script>

<style scoped>
:global(.membership-benefits-dialog.el-dialog) {
  max-width: calc(100vw - 32px);
  overflow: hidden;
  border: 1px solid #e5e7ff;
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(38, 31, 89, 0.2);
}

:global(.membership-benefits-dialog .el-dialog__header) {
  margin: 0;
  padding: 28px 30px 20px;
  background: linear-gradient(135deg, #f7f5ff 0%, #eef4ff 100%);
}

:global(.membership-benefits-dialog .el-dialog__body) {
  padding: 24px 30px 8px;
}

:global(.membership-benefits-dialog .el-dialog__footer) {
  padding: 18px 30px 26px;
}

.benefits-dialog-heading {
  padding-right: 34px;
}

.benefits-dialog-kicker {
  display: block;
  margin-bottom: 8px;
  color: #6858ee;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.benefits-dialog-heading h2 {
  margin: 0;
  color: var(--color-ink);
  font-size: 24px;
  line-height: 1.3;
}

.benefits-dialog-heading p {
  margin: 8px 0 0;
  color: var(--color-ink-soft);
  font-size: 14px;
  line-height: 1.6;
}

.benefits-dialog-content {
  display: grid;
  gap: 20px;
}

.benefits-dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.benefits-dialog-grid article {
  display: flex;
  gap: 12px;
  min-height: 112px;
  padding: 16px;
  border: 1px solid var(--color-line-soft);
  border-radius: 14px;
  background: var(--color-surface);
}

.benefit-index {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  place-items: center;
  border-radius: 9px;
  background: #f0edff;
  color: #6858ee;
  font-size: 11px;
  font-weight: 800;
}

.benefits-dialog-grid h3 {
  margin: 2px 0 6px;
  color: var(--color-ink);
  font-size: 15px;
  line-height: 1.4;
}

.benefits-dialog-grid p {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: 12px;
  line-height: 1.65;
}

.benefits-dialog-note {
  padding: 14px 16px;
  border-radius: 12px;
  background: #fff8ec;
  color: #8a5b13;
}

.benefits-dialog-note strong {
  font-size: 13px;
}

.benefits-dialog-note p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.6;
}

.benefits-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 620px) {
  :global(.membership-benefits-dialog .el-dialog__header) {
    padding: 24px 20px 18px;
  }

  :global(.membership-benefits-dialog .el-dialog__body) {
    padding: 20px 20px 6px;
  }

  :global(.membership-benefits-dialog .el-dialog__footer) {
    padding: 16px 20px 22px;
  }

  .benefits-dialog-grid {
    grid-template-columns: 1fr;
  }

  .benefits-dialog-grid article {
    min-height: 0;
  }
}
</style>
