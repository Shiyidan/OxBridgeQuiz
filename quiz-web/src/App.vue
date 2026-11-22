<!-- 应用根层：承接业务路由及邀请权益弹窗。 -->
<script setup lang="ts">
import { RouterView } from 'vue-router'
import InvitationBenefitDialog from '@/components/InvitationBenefitDialog.vue'
import en from 'element-plus/es/locale/lang/en'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useSiteLocale } from '@/locales'

const { isEnglish } = useSiteLocale()
</script>

<template>
  <el-config-provider :locale="isEnglish ? en : zhCn">
    <RouterView />
    <InvitationBenefitDialog />
  </el-config-provider>
</template>

<style>
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: var(--font-sans);
  background: #f0f2f5;
}
#app {
  min-height: 100vh;
}
</style>
