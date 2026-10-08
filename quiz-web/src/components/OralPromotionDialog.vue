<!-- 一对一培训介绍弹窗：展示英国 G5 留学生教学团队、辅导范围与扫码咨询入口。 -->
<template>
  <AppDialog
    v-model="promotion.dialogVisible"
    class="oral-promotion-dialog"
    title="一对一培训"
    :width="620"
    :show-footer="false"
    close-on-press-escape
  >
    <div class="oral-course">
      <div class="oral-course__hero">
        <p class="oral-course__eyebrow">英国 G5 留学生教学团队 · 一对一辅导</p>
        <h3>在英学长一对一辅导<br /><span>连接英国本土资源</span></h3>
        <p>
          以<strong>牛津、剑桥、IC、UCL 在读学长学姐</strong
          >为主，可协助联系<strong>英国本土老师、学生</strong>。
        </p>
      </div>
      <section class="oral-course__contact" aria-labelledby="oral-contact-title">
        <div class="oral-course__invitation">
          <h4 id="oral-contact-title">感兴趣？<span>扫码咨询</span></h4>
          <p>英语口语、数学、物理、面试及其他训练，都可以来聊聊。</p>
          <span class="oral-course__hint">微信扫码 · 手机可保存图片后识别</span>
        </div>
        <figure class="oral-course__qr">
          <img :src="consultationQr" alt="一对一培训微信咨询群二维码" width="792" height="792" />
          <figcaption>有效期：2026 年 10 月 16 日前</figcaption>
        </figure>
      </section>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import AppDialog from '@/components/AppDialog.vue'
import consultationQr from '@/assets/oral-consultation-qr.png'
import { useOralPromotionStore } from '@/stores/oralPromotion'

const promotion = useOralPromotionStore()
const route = useRoute()

// 返回或跳转页面时结束本次课程浏览，避免弹窗跟入答题等关键页面。
watch(
  () => route.fullPath,
  () => {
    promotion.dialogVisible = false
  },
)
</script>

<style scoped>
:global(.oral-promotion-dialog.app-dialog.el-dialog) {
  background: #fffdf9;
  border-radius: 18px;
}
:global(.oral-promotion-dialog.app-dialog .el-dialog__header) {
  border-bottom-color: #ebe9e1;
}
:global(.oral-promotion-dialog .app-dialog__title) {
  color: #203b52;
}
.oral-course {
  padding-bottom: 10px;
}
.oral-course__hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 20px 24px;
  border: 1px solid #294d66;
  border-radius: 14px;
  background:
    radial-gradient(ellipse at 100% 0%, #39787380, transparent 65%),
    linear-gradient(125deg, #192d49, #244961);
  box-shadow: 0 8px 22px rgb(25 45 73 / 12%);
  color: #dce6ef;
}
.oral-course__hero::after {
  position: absolute;
  z-index: -1;
  top: -110px;
  right: -70px;
  width: 270px;
  height: 270px;
  border: 1px solid rgb(236 208 154 / 18%);
  border-radius: 50%;
  box-shadow:
    0 0 0 32px rgb(236 208 154 / 4%),
    0 0 0 64px rgb(236 208 154 / 3%);
  content: '';
  pointer-events: none;
}
.oral-course__hero p {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
}
.oral-course__hero .oral-course__eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f2d8a7;
  font-size: 11px;
  letter-spacing: 1px;
  font-weight: 600;
}
.oral-course__eyebrow::before {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #edc77e;
  box-shadow: 0 0 0 4px rgb(237 199 126 / 12%);
  content: '';
}
.oral-course__hero h3 {
  margin: 12px 0;
  color: #fff;
  font-size: 24px;
  line-height: 1.4;
  letter-spacing: -0.5px;
}
.oral-course__hero h3 span {
  color: #f4d59b;
}
.oral-course__hero strong {
  color: #fff;
  font-weight: 600;
}
.oral-course__contact {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  align-items: center;
  gap: 20px;
  margin-top: 14px;
  padding: 14px 18px;
  border: 1px solid #dceae4;
  border-radius: 14px;
  background: linear-gradient(135deg, #eff7f2, #fffdf8 80%);
}
.oral-course__invitation h4 {
  margin: 0 0 10px;
  color: #233c4b;
  font-size: 20px;
  line-height: 1.5;
}
.oral-course__invitation h4 span {
  color: #28725d;
}
.oral-course__invitation p {
  margin: 0 0 14px;
  color: #4e6265;
  font-size: 13px;
  line-height: 1.8;
}
.oral-course__hint {
  display: block;
  padding-left: 10px;
  border-left: 2px solid #cfb47f;
  color: #667676;
  font-size: 12px;
  line-height: 1.7;
}
.oral-course__qr {
  margin: 0;
  text-align: center;
}
.oral-course__qr img {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid #dce5df;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 5px 16px rgb(34 75 61 / 8%);
}
.oral-course__qr figcaption {
  margin-top: 8px;
  color: #6c746e;
  font-size: 11px;
  line-height: 1.6;
}
@media (max-width: 600px) {
  .oral-course__hero {
    padding: 18px;
  }
  .oral-course__hero h3 {
    font-size: 22px;
  }
  .oral-course__contact {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 14px;
  }
  .oral-course__qr {
    width: 220px;
    max-width: 100%;
    justify-self: center;
  }
}
</style>
