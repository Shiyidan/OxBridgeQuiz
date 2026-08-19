<script setup lang="ts">
import { RouterView } from 'vue-router'
import InvitationBenefitDialog from '@/components/InvitationBenefitDialog.vue'
</script>

<template>
  <RouterView />
  <InvitationBenefitDialog />
</template>

<style>
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f0f2f5;
}
#app {
  min-height: 100vh;
}
</style>
