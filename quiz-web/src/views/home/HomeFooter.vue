<!-- 首页共享页脚：在访客与登录态首页统一展示品牌、考试入口、协议和备案信息。 -->
<script setup lang="ts">
import brandIconUrl from '@/assets/brand/acemock-icon.png'

withDefaults(
  defineProps<{
    authenticated?: boolean
  }>(),
  {
    authenticated: false,
  },
)

const emit = defineEmits<{
  'scroll-top': []
}>()
</script>

<template>
  <footer class="home-marketing-footer" aria-label="网站页脚">
    <div class="home-page home-footer-layout">
      <div class="home-footer-brand">
        <button
          class="home-footer-brand-button"
          type="button"
          aria-label="返回 AceMock 首页顶部"
          @click="emit('scroll-top')"
        >
          <span class="home-footer-brand-mark" aria-hidden="true">
            <img :src="brandIconUrl" alt="" class="home-footer-brand-logo" />
          </span>
          <strong>AceMock 云舟备考</strong>
        </button>
        <p>基于真题诊断与考纲知识点的智能备考系统。</p>
      </div>

      <nav class="home-footer-links" aria-label="页脚公开链接">
        <div class="home-footer-link-group">
          <h2 class="home-footer-group-title">考试介绍</h2>
          <router-link to="/exam-intro/esat">ESAT 考试</router-link>
          <router-link to="/exam-intro/tmua">TMUA 考试</router-link>
          <router-link to="/exam-intro/step">STEP 考试</router-link>
        </div>
        <div class="home-footer-link-group">
          <h2 class="home-footer-group-title">协议</h2>
          <router-link to="/legal/user-agreement">用户协议</router-link>
          <router-link to="/legal/privacy-policy">隐私政策</router-link>
          <router-link to="/legal/membership-service-agreement">会员服务协议</router-link>
        </div>
      </nav>
    </div>

    <div class="home-footer-bottom">
      <div class="home-page home-footer-bottom-inner">
        <span>© 2026 AceMock 云舟备考 · 上海解航云舟科技有限公司</span>
        <a
          class="home-footer-registration"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
        >
          沪ICP备2026034877号
        </a>
      </div>
    </div>
  </footer>
</template>
