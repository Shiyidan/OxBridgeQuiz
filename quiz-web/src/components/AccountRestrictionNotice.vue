<!-- 账号封禁说明及客服入口，供登录表单与访问受限页面复用。 -->
<template>
  <section class="account-restriction-notice" role="alert">
    <el-alert title="该账号已被暂停使用" type="warning" :closable="false" show-icon>
      检测到账号存在异常访问行为，已暂停登录及学习功能。如有疑问，请联系客服申请复核。
    </el-alert>
    <el-button class="contact-button" type="primary" plain @click="contactVisible = true"
      >联系客服</el-button
    >
    <AppDialog
      v-model="contactVisible"
      title="联系客服申请复核"
      :show-cancel="false"
      confirm-text="我知道了"
      @confirm="contactVisible = false"
    >
      <p>请使用微信扫码，提供注册邮箱或用户名，说明需要复核的账号。</p>
      <img class="contact-qr" :src="wechatQrUrl" alt="客服微信二维码" />
    </AppDialog>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppDialog from './AppDialog.vue'
import wechatQrUrl from '@/assets/home/wechat-qr.png'
const contactVisible = ref(false)
</script>

<style scoped>
.contact-button {
  margin-top: 16px;
}
.contact-qr {
  display: block;
  width: min(240px, 100%);
  margin: 20px auto;
}
</style>
