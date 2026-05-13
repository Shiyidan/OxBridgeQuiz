<template>
  <div class="landing">
    <NavBar />

    <!-- ========== Hero ========== -->
    <section id="hero" class="hero">
      <div class="hero-glow hero-glow-left"></div>
      <div class="hero-glow hero-glow-right"></div>
      <div class="hero-body">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>Oxbridge AI</span>
          <span class="badge-sep">·</span>
          <span>G5 备考 AI 导师</span>
        </div>
        <h1 class="hero-title">
          冲刺牛剑帝国理工<br />
          <span class="gradient-text">由顶尖 AI 领航</span>
        </h1>
        <p class="hero-desc">
          专为 TMUA 和其他顶尖名校入学考试打造。个性化评估、AI 智能判题、弱点靶向训练，助力英本申请者轻松突破高分。
        </p>
        <div class="hero-actions">
          <router-link to="/exam" class="btn-primary">
            进入学习中心
            <span class="btn-arrow">→</span>
          </router-link>
          <router-link to="/admin/papers" class="btn-glass">
            免费能力评估
          </router-link>
        </div>
      </div>
    </section>

    <!-- ========== 功能卡片 ========== -->
    <section id="features" class="features">
      <div class="section-head">
        <h2>为什么选择 Oxbridge AI？</h2>
        <p class="section-sub">源自 G5 入学测试规律，基于前沿大语言模型</p>
      </div>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon icon-indigo">🛡️</div>
          <h3>精准的能力诊断</h3>
          <p>基于往年真题算法，只需 60 分钟，即可准确评估您在各个考察模组的实际水平。</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon icon-blue">🎓</div>
          <h3>专属备考计划</h3>
          <p>不再盲目刷题。AI 导师将根据您的诊断结果和目标院校，自动生成提分路径和每日学习内容。</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon icon-emerald">📖</div>
          <h3>智能错题解析</h3>
          <p>每一道错题都会被记录分析。AI 深挖您的思维盲点，并推送同类型的易错题直到完全掌握。</p>
        </div>
      </div>
    </section>

    <!-- ========== Social Proof ========== -->
    <section id="about" class="social-proof">
      <h2>已有数百位同学通过我们收获了 G5 笔试高分，拿到面邀</h2>
      <div class="schools">
        <span class="school">Cambridge</span>
        <span class="school">Oxford</span>
        <span class="school">Imperial</span>
        <span class="school">UCL</span>
      </div>
    </section>

    <!-- ========== 订阅方案 ========== -->
    <PricingSection />

    <!-- ========== 底部 ========== -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="logo-mark">G5</span> Oxbridge AI
        </div>
        <span class="footer-icp">ICP备XXXXXXXX号-1</span>
        <span class="footer-copy">© 2026 OxBridge Quiz</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// 首页（落地页：Hero + 定价 + 功能介绍）
import NavBar from '@/components/NavBar.vue'
import PricingSection from '@/components/PricingSection.vue'
</script>

<style scoped>
.landing {
  --c-bg: #f8fafc;
  --c-white: #ffffff;
  --c-hero: #0f172a;
  --c-gray-50: #f1f5f9;
  --c-gray-100: #f1f5f9;
  --c-gray-200: #e2e8f0;
  --c-gray-300: #cbd5e1;
  --c-gray-500: #64748b;
  --c-gray-600: #475569;
  --c-gray-800: #1e293b;
  --c-gray-900: #0f172a;
  --c-indigo-300: #a5b4fc;
  --c-indigo-400: #818cf8;
  --c-indigo-500: #6366f1;
  --c-indigo-600: #4f46e5;
  --c-indigo-700: #4338ca;
  --c-purple-600: #9333ea;
  --c-teal-300: #5eead4;
  --c-teal-600: #0d9488;
  --c-red-600: #dc2626;
  --font-serif: Georgia, 'Times New Roman', serif;
  --container: 1280px;
  background: var(--c-bg);
  color: var(--c-gray-800);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
}

/* ========== Hero ========== */
.hero {
  position: relative; overflow: hidden;
  background: var(--c-hero); color: white;
  border-radius: 24px; margin: 2rem auto 4rem; padding: 5rem 2rem;
  max-width: var(--container); text-align: center;
}
.hero-glow {
  position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.2;
  pointer-events: none;
}
.hero-glow-left { top: -20%; left: -10%; width: 50%; height: 50%; background: var(--c-indigo-600); }
.hero-glow-right { bottom: -20%; right: -10%; width: 40%; height: 40%; background: var(--c-teal-600); }
.hero-body { position: relative; z-index: 10; max-width: 720px; margin: 0 auto; }
.hero-badge {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 1rem; background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 999px;
  font-size: 0.875rem; font-weight: 600; letter-spacing: 0.02em;
  margin-bottom: 2rem; backdrop-filter: blur(8px);
}
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-teal-300); }
.badge-sep { opacity: 0.4; }
.hero-title { font-family: var(--font-serif); font-size: 3.5rem; font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 1.5rem; }
.gradient-text { background: linear-gradient(135deg, var(--c-indigo-300), var(--c-teal-300)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero-desc { font-size: 1.25rem; color: var(--c-gray-300); line-height: 1.7; margin: 0 auto 2.5rem; max-width: 560px; }
.hero-actions { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.875rem 2rem; background: var(--c-indigo-600); color: white;
  border-radius: 12px; font-size: 1.125rem; font-weight: 700; text-decoration: none;
  transition: all 0.2s; box-shadow: 0 4px 16px rgba(79,70,229,0.35);
}
.btn-primary:hover { background: var(--c-indigo-500); transform: translateY(-1px); }
.btn-arrow { font-size: 1.25rem; }

.btn-glass {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.875rem 2rem; background: rgba(255,255,255,0.08);
  color: white; border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px; font-size: 1.125rem; font-weight: 700; text-decoration: none;
  transition: all 0.2s; backdrop-filter: blur(8px);
}
.btn-glass:hover { background: rgba(255,255,255,0.15); }

/* ========== 功能卡片 ========== */
.features { max-width: var(--container); margin: 0 auto; padding: 3rem 2rem 5rem; }
.section-head { text-align: center; margin-bottom: 4rem; }
.section-head h2 { font-size: 2rem; font-weight: 700; color: var(--c-gray-800); margin: 0 0 0.75rem; }
.section-sub { font-size: 1.125rem; color: var(--c-gray-500); margin: 0; }
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
.feature-card {
  background: var(--c-white); padding: 2rem; border-radius: 16px;
  border: 1px solid var(--c-gray-200); box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all 0.3s;
}
.feature-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }
.feature-icon {
  width: 56px; height: 56px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; margin-bottom: 1.5rem;
}
.icon-indigo { background: #eef2ff; color: var(--c-indigo-600); }
.icon-blue { background: #eff6ff; color: #2563eb; }
.icon-emerald { background: #ecfdf5; color: var(--c-teal-600); }
.feature-card h3 { font-size: 1.25rem; font-weight: 700; margin: 0 0 0.75rem; color: var(--c-gray-900); }
.feature-card p { font-size: 0.938rem; line-height: 1.6; color: var(--c-gray-600); margin: 0; }

/* ========== Social Proof ========== */
.social-proof {
  max-width: var(--container); margin: 0 auto 3rem;
  background: var(--c-gray-100); border: 1px solid var(--c-gray-200);
  border-radius: 24px; padding: 3rem 2rem; text-align: center;
}
.social-proof h2 { font-size: 1.5rem; font-weight: 700; margin: 0 0 2rem; }
.schools {
  display: flex; justify-content: center; flex-wrap: wrap;
  gap: 2rem 3rem; opacity: 0.6;
}
.school { font-family: var(--font-serif); font-size: 1.25rem; font-weight: 700; }

/* ========== 底部 ========== */
.footer { border-top: 1px solid var(--c-gray-200); padding: 2.5rem 2rem; }
.footer-inner {
  max-width: var(--container); margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 0.875rem; color: var(--c-gray-500);
}
.footer-brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 1rem; color: var(--c-gray-900); }
.footer-icp { font-size: 0.75rem; color: var(--c-gray-400); }
.footer-copy { font-size: 0.875rem; color: var(--c-gray-500); }

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .nav-links { display: none; }
  .hero { padding: 3rem 1.25rem; border-radius: 16px; }
  .hero-title { font-size: 2.25rem; }
  .hero-desc { font-size: 1rem; }
  .feature-grid { grid-template-columns: 1fr; }
  .cta { padding: 2.5rem 1.25rem; }
  .footer-inner { flex-direction: column; gap: 1rem; text-align: center; }
}
</style>
