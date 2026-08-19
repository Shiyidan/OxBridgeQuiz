<!-- 邀请福利弹窗：供注册成功和普通登录成功后统一展示活动规则。 -->
<template>
  <el-dialog
    v-model="visible"
    title="邀请有礼"
    class="invitation-reward-celebration"
    width="720px"
    align-center
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :before-close="handleClose"
  >
    <div class="invitation-celebration">
      <div class="invitation-celebration__confetti" aria-hidden="true">
        <i v-for="(pieceStyle, index) in confettiStyles" :key="index" :style="pieceStyle"></i>
      </div>

      <div class="invitation-celebration__art" aria-hidden="true">
        <div class="invitation-celebration__ribbon invitation-celebration__ribbon--left"></div>
        <div class="invitation-celebration__ribbon invitation-celebration__ribbon--right"></div>
        <div class="invitation-celebration__mascot">
          <div class="invitation-celebration__hat"><span></span></div>
          <div class="invitation-celebration__cat">
            <span class="invitation-celebration__eye invitation-celebration__eye--left"></span>
            <span class="invitation-celebration__eye invitation-celebration__eye--right"></span>
            <span class="invitation-celebration__nose"></span>
            <span class="invitation-celebration__whiskers"></span>
          </div>
        </div>
        <div class="invitation-celebration__badge"><span>✓</span> INVITE REWARD</div>
      </div>

      <div class="invitation-celebration__copy">
        <p class="invitation-celebration__eyebrow">邀请有礼</p>
        <h2>邀请好友，双方享七天会员</h2>
        <p class="invitation-celebration__description">
          使用好友邀请码注册，或分享自己的专属邀请码邀请好友。受邀用户完成首次有效会员购买后，双方各获得一张七天会员卡。
        </p>
        <p class="invitation-celebration__notice">卡券到账后，请在 30 天内启用</p>
      </div>

      <div class="invitation-celebration__actions">
        <el-button @click="resolve(false)">我知道了</el-button>
        <el-button type="primary" @click="resolve(true)">查看邀请福利</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInvitationBenefitStore } from '@/stores/invitationBenefit'

const router = useRouter()
const invitationBenefit = useInvitationBenefitStore()
const visible = computed({
  get: () => invitationBenefit.visible,
  set: (value: boolean) => {
    if (!value) invitationBenefit.hide()
  },
})

const confettiStyles = [
  '--left: 4%; --delay: -0.8s; --duration: 4.6s; --drift: 34px; --color: #ffd43b',
  '--left: 12%; --delay: -3.1s; --duration: 5.2s; --drift: -28px; --color: #ff5c8a',
  '--left: 20%; --delay: -1.9s; --duration: 4.2s; --drift: 22px; --color: #22c55e',
  '--left: 30%; --delay: -4.2s; --duration: 5.7s; --drift: -34px; --color: #6657e8',
  '--left: 39%; --delay: -2.6s; --duration: 4.9s; --drift: 38px; --color: #ff7a1a',
  '--left: 49%; --delay: -0.4s; --duration: 5.5s; --drift: -20px; --color: #00b8a9',
  '--left: 59%; --delay: -3.6s; --duration: 4.4s; --drift: 30px; --color: #ffd43b',
  '--left: 68%; --delay: -1.3s; --duration: 5.1s; --drift: -38px; --color: #ff4fb3',
  '--left: 77%; --delay: -4.7s; --duration: 5.8s; --drift: 26px; --color: #6657e8',
  '--left: 86%; --delay: -2.2s; --duration: 4.7s; --drift: -24px; --color: #22c55e',
  '--left: 94%; --delay: -0.9s; --duration: 5.4s; --drift: 18px; --color: #ff7a1a',
]

// 两个操作按钮分别关闭提示或进入个人中心查看邀请福利。
function resolve(viewBenefits: boolean): void {
  invitationBenefit.hide()
  if (viewBenefits) void router.push('/profile')
}

// 右上角关闭和 Esc 与“我知道了”一致，只关闭本次提示。
function handleClose(done: () => void): void {
  invitationBenefit.hide()
  done()
}
</script>

<style scoped lang="scss">
:global(.invitation-reward-celebration.el-dialog) {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  width: min(720px, calc(100vw - 32px)) !important;
  height: 360px !important;
  min-height: 360px !important;
  max-height: 360px !important;
  margin: 0 !important;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 28px;
  box-shadow: 0 28px 80px rgb(15 23 42 / 28%);
  transform: translate(-50%, -50%) !important;
}

:global(.invitation-reward-celebration .el-dialog__header) {
  height: 0;
  padding: 0;
}

:global(.invitation-reward-celebration .el-dialog__title) {
  display: none;
}

:global(.invitation-reward-celebration .el-dialog__headerbtn) {
  top: 18px;
  right: 18px;
  z-index: 5;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: #64748b;
  background: rgb(255 255 255 / 82%);
}

:global(.invitation-reward-celebration .el-dialog__headerbtn:hover) {
  color: #111827;
  background: #ffffff;
}

:global(.invitation-reward-celebration .el-dialog__body) {
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
}

:global(.invitation-celebration__actions) {
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-column: 1 / -1;
  gap: 14px;
  padding: 0 32px 24px;
}

:global(.invitation-celebration__actions .el-button) {
  width: 100%;
  height: 46px;
  margin: 0;
  border-color: #e5e7eb;
  border-radius: 12px;
  color: #334155;
  background: #f3f4f6;
  font-size: 15px;
  font-weight: 700;
}

:global(.invitation-celebration__actions .el-button--primary) {
  border-color: #151515;
  color: #ffffff;
  background: #151515;
}

:global(.invitation-celebration__actions .el-button--primary:hover) {
  border-color: #2f2f2f;
  background: #2f2f2f;
}

:global(.invitation-celebration) {
  position: relative;
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) 70px;
  width: 100%;
  height: 360px;
  overflow: hidden;
  background:
    radial-gradient(circle at 8% 8%, rgb(255 214 59 / 18%), transparent 26%),
    radial-gradient(circle at 92% 84%, rgb(102 87 232 / 11%), transparent 30%), #ffffff;
}

:global(.invitation-celebration__confetti) {
  position: absolute;
  z-index: 3;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

:global(.invitation-celebration__confetti i) {
  position: absolute;
  top: -24px;
  left: var(--left);
  width: 8px;
  height: 15px;
  border-radius: 2px;
  background: var(--color);
  opacity: 0;
  animation: invitation-confetti-fall var(--duration) linear var(--delay) infinite;
}

:global(.invitation-celebration__confetti i:nth-child(3n)) {
  width: 13px;
  height: 7px;
  border-radius: 50%;
}

:global(.invitation-celebration__confetti i:nth-child(4n)) {
  width: 7px;
  height: 7px;
}

:global(.invitation-celebration__art) {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 38px 20px 24px 30px;
}

:global(.invitation-celebration__mascot) {
  position: relative;
  width: 120px;
  height: 118px;
  margin-top: 6px;
}

:global(.invitation-celebration__cat) {
  position: absolute;
  bottom: 5px;
  left: 5px;
  width: 110px;
  height: 76px;
  border-radius: 48% 48% 44% 44%;
  background: #111318;
  transform: rotate(-2deg);
}

:global(.invitation-celebration__cat::before),
:global(.invitation-celebration__cat::after) {
  position: absolute;
  top: -14px;
  width: 34px;
  height: 34px;
  background: #111318;
  content: '';
  transform: rotate(45deg);
}

:global(.invitation-celebration__cat::before) {
  left: 10px;
  border-radius: 7px 0 0;
}

:global(.invitation-celebration__cat::after) {
  right: 10px;
  border-radius: 0 7px 0 0;
}

:global(.invitation-celebration__eye) {
  position: absolute;
  z-index: 1;
  top: 28px;
  width: 18px;
  height: 8px;
  border-bottom: 3px solid #ffffff;
  border-radius: 50%;
}

:global(.invitation-celebration__eye--left) {
  left: 24px;
  transform: rotate(8deg);
}

:global(.invitation-celebration__eye--right) {
  right: 24px;
  transform: rotate(-8deg);
}

:global(.invitation-celebration__nose) {
  position: absolute;
  z-index: 2;
  top: 44px;
  left: 49px;
  width: 14px;
  height: 11px;
  border-radius: 50% 50% 55% 55%;
  background: #ff5c8a;
}

:global(.invitation-celebration__whiskers),
:global(.invitation-celebration__whiskers::before),
:global(.invitation-celebration__whiskers::after) {
  position: absolute;
  z-index: 1;
  top: 52px;
  width: 28px;
  height: 2px;
  border-radius: 999px;
  background: #ffffff;
  content: '';
}

:global(.invitation-celebration__whiskers) {
  left: 9px;
  box-shadow: 64px 0 0 #ffffff;
}

:global(.invitation-celebration__whiskers::before) {
  top: -7px;
  left: 1px;
  transform: rotate(12deg);
  box-shadow: 63px -13px 0 #ffffff;
}

:global(.invitation-celebration__whiskers::after) {
  top: 7px;
  left: 1px;
  transform: rotate(-12deg);
  box-shadow: 63px 13px 0 #ffffff;
}

:global(.invitation-celebration__hat) {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 42px;
  width: 52px;
  height: 63px;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  background: repeating-linear-gradient(155deg, #ff5c8a 0 12px, #ffd43b 12px 24px);
  transform: rotate(-8deg);
}

:global(.invitation-celebration__hat span) {
  position: absolute;
  top: -4px;
  left: 21px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #6657e8;
}

:global(.invitation-celebration__badge) {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 10px;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

:global(.invitation-celebration__badge span) {
  display: grid;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  color: #ffffff;
  background: #22a699;
  place-items: center;
}

:global(.invitation-celebration__copy) {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 46px 42px 28px 12px;
}

:global(.invitation-celebration__eyebrow) {
  margin: 0 0 9px;
  color: #6657e8;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

:global(.invitation-celebration__copy h2) {
  margin: 0;
  color: #111827;
  font-size: 27px;
  font-weight: 800;
  line-height: 1.25;
}

:global(.invitation-celebration__description) {
  margin: 16px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.75;
}

:global(.invitation-celebration__notice) {
  align-self: flex-start;
  margin: 14px 0 0;
  padding: 7px 12px;
  border-radius: 999px;
  color: #7c3d0a;
  background: #fff5d6;
  font-size: 13px;
  font-weight: 700;
}

:global(.invitation-celebration__ribbon) {
  position: absolute;
  width: 14px;
  height: 82px;
  border-radius: 999px;
}

:global(.invitation-celebration__ribbon--left) {
  top: -18px;
  left: 25px;
  background: #d8e500;
  transform: rotate(13deg);
}

:global(.invitation-celebration__ribbon--right) {
  top: -24px;
  right: 7px;
  background: #ff7a1a;
  transform: rotate(-28deg);
}

@keyframes invitation-confetti-fall {
  0% {
    opacity: 0;
    transform: translate3d(0, -32px, 0) rotate(0deg);
  }

  12%,
  78% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate3d(var(--drift), 330px, 0) rotate(560deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  :global(.invitation-celebration__confetti i) {
    animation: none;
  }
}

@media (max-width: 640px) {
  :global(.invitation-reward-celebration.el-dialog) {
    height: auto !important;
    min-height: 0 !important;
    max-height: calc(100vh - 24px) !important;
    border-radius: 22px;
  }

  :global(.invitation-celebration) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 70px;
    height: auto;
  }

  :global(.invitation-celebration__art) {
    padding: 26px 20px 0;
  }

  :global(.invitation-celebration__mascot) {
    transform: scale(0.82);
  }

  :global(.invitation-celebration__copy) {
    align-items: center;
    padding: 0 28px 24px;
    text-align: center;
  }

  :global(.invitation-celebration__copy h2) {
    font-size: 23px;
  }

  :global(.invitation-celebration__notice) {
    align-self: center;
  }

  :global(.invitation-celebration__actions) {
    padding: 0 24px 24px;
  }
}
</style>
