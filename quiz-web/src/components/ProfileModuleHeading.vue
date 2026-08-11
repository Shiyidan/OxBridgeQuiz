<!-- 个人中心一级模块共用标题：统一英文眉题、中文标题、说明文字与右侧操作区。 -->
<template>
  <header class="profile-module-heading">
    <div class="profile-module-heading-copy">
      <span class="profile-module-kicker">{{ kicker }}</span>
      <h2 :id="titleId">{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <slot />
  </header>
</template>

<script setup lang="ts">
defineProps<{
  kicker: string
  title: string
  description: string
  titleId?: string
}>()
</script>

<style scoped lang="scss">
.profile-module-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.profile-module-heading-copy {
  min-width: 0;
}

.profile-module-kicker {
  color: #7163e8;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

h2 {
  margin: 2px 0 0;
  color: #211f35;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}

p {
  margin: 4px 0 0;
  color: #6f6a85;
  font-size: 12px;
  line-height: 1.45;
}

@media (max-width: 760px) {
  .profile-module-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
