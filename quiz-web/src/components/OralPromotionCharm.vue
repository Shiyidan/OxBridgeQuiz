<!-- 导航右下方的一对一培训悬挂入口：悬浮介绍、点击咨询，并支持当天关闭。 -->
<template>
  <aside v-if="promotion.charmVisible" class="oral-charm" aria-label="一对一培训推广">
    <span class="oral-charm__cord oral-charm__cord--left" aria-hidden="true"></span>
    <span class="oral-charm__cord oral-charm__cord--right" aria-hidden="true"></span>
    <el-tooltip
      placement="bottom-end"
      effect="light"
      :show-after="180"
      :offset="14"
      :trigger-keys="[]"
      popper-class="oral-charm-tooltip"
    >
      <template #content>
        <div class="oral-charm__tip">
          <strong>一对一培训</strong>
          <span>英国 G5 留学生团队<br />学科辅导 · 面试训练</span>
          <span class="oral-charm__tip-action">点击了解课程</span>
        </div>
      </template>
      <AppButton
        class="oral-charm__trigger"
        type="text"
        aria-label="了解一对一培训"
        @click="promotion.open('charm')"
      >
        <span class="oral-charm__art" aria-hidden="true">
          <span class="oral-charm__spark">✦</span>
          <span class="oral-charm__bubble"
            ><el-icon><Reading /></el-icon
          ></span>
          <span class="oral-charm__hello">1v1</span>
        </span>
        <span class="oral-charm__label">一对一<br />培训</span>
      </AppButton>
    </el-tooltip>
    <AppButton
      class="oral-charm__close"
      type="text"
      size="small"
      :icon="Close"
      icon-only
      aria-label="今天不再显示培训推广"
      @click="promotion.dismiss"
    />
  </aside>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { Close, Reading } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import { useOralPromotionStore } from '@/stores/oralPromotion'

const promotion = useOralPromotionStore()
let dayTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  promotion.refreshDay()
  dayTimer = setInterval(promotion.refreshDay, 60_000)
  window.addEventListener('focus', promotion.refreshDay)
  window.addEventListener('storage', promotion.syncDismissal)
})

onBeforeUnmount(() => {
  clearInterval(dayTimer)
  window.removeEventListener('focus', promotion.refreshDay)
  window.removeEventListener('storage', promotion.syncDismissal)
})
</script>

<style scoped>
.oral-charm {
  position: fixed;
  top: var(--nav-height, 72px);
  right: 24px;
  z-index: 90;
  width: 64px;
  padding-top: 30px;
  color: #65509b;
}
.oral-charm__cord {
  position: absolute;
  top: 0;
  width: 1px;
  height: 38px;
  background: linear-gradient(#b4a3d8, #d6c9eb);
}
.oral-charm__cord--left {
  left: 14px;
}
.oral-charm__cord--right {
  right: 14px;
}
.oral-charm__trigger.app-button.el-button {
  display: flex;
  width: 64px;
  min-width: 0;
  height: 96px;
  padding: 10px 4px 8px;
  border: 1px solid #d6c8ef;
  border-radius: 18px 18px 22px 22px;
  background: linear-gradient(155deg, #fcfaff 4%, #eee5ff 100%);
  color: #594381;
  box-shadow: 0 6px 16px rgb(92 67 134 / 12%);
  transform-origin: 50% -30px;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}
.oral-charm__trigger.app-button.el-button:hover {
  background: linear-gradient(155deg, #fcfaff 4%, #e4d5fd 100%);
  color: #594381;
  border-color: #bda6de;
  transform: rotate(-4deg);
  box-shadow: 0 9px 20px rgb(92 67 134 / 18%);
}
.oral-charm__trigger :deep(.app-button__label) {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}
.oral-charm__art {
  position: relative;
  display: block;
  width: 48px;
  height: 38px;
}
.oral-charm__bubble {
  position: absolute;
  left: 5px;
  top: 0;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1.5px solid #b4a0d2;
  border-radius: 13px 13px 13px 3px;
  background: #fff;
  transform: rotate(-8deg);
}
.oral-charm__bubble .el-icon {
  font-size: 22px;
  color: #8363af;
}
.oral-charm__spark {
  position: absolute;
  top: -3px;
  right: 0;
  font-size: 14px;
  color: #cb9840;
}
.oral-charm__hello {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 3px 5px;
  border-radius: 7px 7px 2px 7px;
  background: #f7cf79;
  color: #72511e;
  font-size: 11px;
  font-weight: 700;
  transform: rotate(8deg);
}
.oral-charm__label {
  font-size: 11px;
  letter-spacing: 0.5px;
  line-height: 1.35;
  text-align: center;
}
.oral-charm__close.app-button.el-button {
  position: absolute;
  top: 20px;
  right: -10px;
  width: 24px;
  min-width: 24px;
  height: 24px;
  border: 1px solid #e9e2f1;
  border-radius: 50%;
  background: #fff;
  color: #9687ad;
  opacity: 0;
  transition: opacity 150ms ease;
}
.oral-charm:hover .oral-charm__close,
.oral-charm:focus-within .oral-charm__close {
  opacity: 1;
}
.oral-charm__tip {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 88px;
  min-height: 142px;
  gap: 14px;
  padding: 6px 0;
  font-size: 12px;
  line-height: 1.7;
  white-space: normal;
  text-align: center;
  color: #736780;
}
:global(.oral-charm-tooltip.el-popper) {
  padding: 12px;
}
.oral-charm__tip strong {
  font-size: 14px;
  color: #51406c;
}
.oral-charm__tip-action {
  color: #8060a9;
}
@media (max-width: 860px) {
  .oral-charm {
    top: 64px;
    right: 12px;
    width: 48px;
    padding-top: 10px;
  }
  .oral-charm__cord {
    height: 17px;
  }
  .oral-charm__trigger.app-button.el-button {
    width: 48px;
    height: 70px;
    padding: 8px 4px;
    border-radius: 14px;
  }
  .oral-charm__art {
    transform: scale(0.62);
    transform-origin: center top;
    height: 24px;
  }
  .oral-charm__trigger :deep(.app-button__label) {
    gap: 3px;
  }
  .oral-charm__label {
    font-size: 9px;
    letter-spacing: 0;
  }
  .oral-charm__close.app-button.el-button {
    opacity: 1;
    right: -5px;
    top: 2px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .oral-charm__trigger.app-button.el-button,
  .oral-charm__close.app-button.el-button {
    transition: none;
  }
  .oral-charm__trigger.app-button.el-button:hover {
    transform: none;
  }
}
</style>
