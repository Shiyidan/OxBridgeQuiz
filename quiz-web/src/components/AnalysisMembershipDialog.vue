<!-- 错题与答卷解析共用的会员到期提示，续费后由来源页面恢复原查看意图。 -->
<template>
  <AppDialog
    :model-value="modelValue"
    title="会员已到期"
    cancel-text="暂不续费"
    confirm-text="立即续费"
    close-on-press-escape
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="openPayment"
  >
    <p>当前会员已到期，续费后即可继续查看题目解析。</p>
    <p>你的做题记录和错题均已保留。</p>
  </AppDialog>
  <PaymentModal v-model="paymentVisible" :default-exam-type="examType" @paid="handlePaid" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppDialog from './AppDialog.vue'
import PaymentModal from './PaymentModal.vue'

defineProps<{ modelValue: boolean; examType: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  renewed: []
}>()
const paymentVisible = ref(false)

// 使用来源答卷的考试类型打开现有收银台，不区分日卡和其他会员卡。
function openPayment(): void {
  emit('update:modelValue', false)
  paymentVisible.value = true
}

// 支付确认后由来源重新校验权益，购买其他考试不会错误解锁当前解析。
function handlePaid(): void {
  paymentVisible.value = false
  emit('renewed')
}
</script>
