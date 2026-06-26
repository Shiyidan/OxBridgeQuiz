<template>
  <div class="landing">
    <NavBar />
    <div class="scroll-rail" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>

    <section id="hero" class="hero">
      <div class="hero-body">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>Oxbridge AI</span>
          <span class="badge-sep">·</span>
          <span>G5 入学笔试训练系统</span>
        </div>
        <h1 class="hero-title">
          把 G5 笔试备考<br />
          <span class="gradient-text">训练成一条清晰路径</span>
        </h1>
        <p class="hero-desc">
          从真题诊断开始，定位知识缺口、生成练习节奏、追踪错题攻克。Oxbridge AI
          让 TMUA 与英本顶尖院校入学考试不再只是刷题，而是可复盘、可推进的系统训练。
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
      <div class="hero-caption">
        <span>Oxford · Cambridge · Imperial · UCL</span>
        <span>Diagnostic practice for high-stakes entrance exams</span>
      </div>
    </section>

    <section id="features" class="method-section">
      <div class="section-kicker">Learning Method</div>
      <div class="method-layout">
        <div class="section-head section-head--left">
          <h2>不是多做几套题，而是知道下一题为什么该做。</h2>
          <p class="section-sub">
            首页重新组织成三段学习动作：先诊断真实水平，再规划每日训练，最后把错题变成稳定得分点。
          </p>
        </div>
        <div class="method-note">
          <span class="note-number">60</span>
          <span class="note-label">分钟完成一次真题能力诊断</span>
        </div>
      </div>
      <div class="feature-grid">
        <div class="feature-card">
          <span class="feature-index">01</span>
          <h3>看见真实水平</h3>
          <p>用真题结构做起点，快速拆出知识点掌握度、题型稳定性和容易失分的思维环节。</p>
        </div>
        <div class="feature-card">
          <span class="feature-index">02</span>
          <h3>安排训练顺序</h3>
          <p>根据诊断结果和目标考试，把刷题、模考、复盘拆成每天能执行的提分路径。</p>
        </div>
        <div class="feature-card">
          <span class="feature-index">03</span>
          <h3>攻克错题闭环</h3>
          <p>错题不只被收录，还会被归因、标注知识点，并通过同类练习反复验证是否真正掌握。</p>
        </div>
      </div>
    </section>

    <section class="journey-section">
      <div class="journey-panel">
        <div>
          <div class="section-kicker">Student Journey</div>
          <h2>一次备考，从上传试卷到生成诊断报告。</h2>
        </div>
        <ol class="journey-list">
          <li>
            <span>上传 PDF / 图片试卷</span>
            <p>系统识别题干、选项、公式与图形，整理成可在线作答的结构化题目。</p>
          </li>
          <li>
            <span>在线答题与自动判题</span>
            <p>练习、真题测试和模考在同一条记录链路里沉淀，方便长期追踪。</p>
          </li>
          <li>
            <span>诊断薄弱点与错题</span>
            <p>报告把分数背后的知识点、题型和错因拆开，形成下一轮训练依据。</p>
          </li>
        </ol>
      </div>
    </section>

    <section id="about" class="social-proof">
      <div class="proof-copy">
        <div class="section-kicker">G5 Focus</div>
        <h2>围绕英本顶尖院校笔试，把练习资料、能力诊断和错题复盘放在同一张桌面上。</h2>
      </div>
      <div class="schools">
        <span class="school">Cambridge</span>
        <span class="school">Oxford</span>
        <span class="school">Imperial</span>
        <span class="school">UCL</span>
      </div>
    </section>

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
  --c-bg: #eef1ea;
  --c-white: #ffffff;
  --c-paper: #f7f4ec;
  --c-ink: #171a16;
  --c-ink-soft: #363b33;
  --c-muted: #72786e;
  --c-line: rgba(37, 42, 34, 0.16);
  --c-glass: rgba(247, 244, 236, 0.76);
  --c-gold: #b89454;
  --c-moss: #53624b;
  --c-deep: #10150f;
  --hero-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/1_oxford_aerial_panorama_2016_%28cropped%29.jpg/1920px-1_oxford_aerial_panorama_2016_%28cropped%29.jpg');
  --font-serif: Georgia, 'Times New Roman', 'Songti SC', serif;
  --container: 1280px;
  position: relative;
  isolation: isolate;
  background: #10150f;
  color: var(--c-ink);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Roboto,
    sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
}

.landing::before {
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(180deg, rgba(8, 11, 7, 0.28) 0%, rgba(8, 11, 7, 0.16) 35%, rgba(8, 11, 7, 0.42) 100%),
    var(--hero-image) center 26% / cover no-repeat;
  content: '';
  transform: translateZ(0);
}

.landing::after {
  position: fixed;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(ellipse at 50% 45%, rgba(8, 11, 7, 0.48) 0%, rgba(8, 11, 7, 0.3) 28%, transparent 58%),
    linear-gradient(90deg, rgba(7, 11, 7, 0.42), rgba(7, 11, 7, 0.12) 50%, rgba(7, 11, 7, 0.36)),
    linear-gradient(180deg, rgba(7, 11, 7, 0.18) 0%, transparent 28%, rgba(238, 241, 234, 0.2) 64%, rgba(238, 241, 234, 0.5) 100%);
  content: '';
  pointer-events: none;
}

.landing :deep(.navbar) {
  position: fixed;
  width: 100%;
  background: rgba(13, 17, 12, 0.24);
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(18px);
}

.landing :deep(.logo),
.landing :deep(.nav-link),
.landing :deep(.btn-ghost),
.landing :deep(.user-name) {
  color: rgba(255, 255, 255, 0.9);
}

.landing :deep(.logo-mark) {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.landing :deep(.nav-link:hover),
.landing :deep(.nav-link--active) {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}

.landing :deep(.btn-primary-sm) {
  background: rgba(255, 255, 255, 0.9);
  color: #172016;
}

.landing :deep(.user-meta) {
  color: rgba(255, 255, 255, 0.64);
}

.scroll-rail {
  position: fixed;
  top: 50%;
  right: 1.4rem;
  z-index: 20;
  display: grid;
  gap: 0.55rem;
  transform: translateY(-50%);
  pointer-events: none;
}

.scroll-rail span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 0 18px rgba(255, 255, 255, 0.36);
}

.scroll-rail span:nth-child(2),
.scroll-rail span:nth-child(3) {
  background: rgba(231, 200, 120, 0.82);
}

.hero {
  position: relative;
  z-index: 2;
  display: grid;
  min-height: 96svh;
  place-items: center;
  overflow: hidden;
  padding: 8rem 2rem 6rem;
  color: #fff;
  text-align: center;
}

.hero-body {
  position: sticky;
  top: 21vh;
  z-index: 2;
  max-width: 780px;
  margin: 0 auto;
  padding: 2rem 2rem 2.2rem;
  border-radius: 8px;
  background: radial-gradient(ellipse at center, rgba(8, 11, 7, 0.24), rgba(8, 11, 7, 0.08) 70%, transparent);
  animation: heroFloat 1s ease-out both;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  margin-bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(14, 18, 12, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  backdrop-filter: blur(14px);
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d8bd7a;
}
.badge-sep {
  opacity: 0.48;
}
.hero-title {
  margin: 0 0 1.4rem;
  font-family: var(--font-serif);
  font-size: clamp(2.8rem, 6.2vw, 5.2rem);
  font-weight: 500;
  line-height: 1.14;
  letter-spacing: 0;
  text-shadow:
    0 3px 18px rgba(0, 0, 0, 0.72),
    0 18px 54px rgba(0, 0, 0, 0.52);
}
.gradient-text {
  color: #e7c878;
  text-shadow:
    0 2px 14px rgba(33, 23, 9, 0.72),
    0 18px 48px rgba(74, 48, 18, 0.48);
}
.hero-desc {
  max-width: 680px;
  margin: 0 auto 2.2rem;
  color: rgba(255, 255, 255, 0.92);
  font-size: clamp(0.98rem, 1.35vw, 1.14rem);
  line-height: 1.85;
  text-shadow:
    0 2px 10px rgba(0, 0, 0, 0.74),
    0 10px 36px rgba(0, 0, 0, 0.5);
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  justify-content: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.95rem 1.6rem;
  color: #151913;
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 999px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.24);
  transition:
    transform 0.25s ease,
    background 0.25s ease;
  backdrop-filter: blur(14px);
}
.btn-primary:hover {
  background: #fff;
  transform: translateY(-2px);
}
.btn-arrow {
  font-size: 1.18rem;
}

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.95rem 1.6rem;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 999px;
  transition:
    transform 0.25s ease,
    background 0.25s ease;
  backdrop-filter: blur(14px);
}
.btn-glass:hover {
  background: rgba(255, 255, 255, 0.16);
  transform: translateY(-2px);
}

.hero-caption {
  position: absolute;
  right: 2rem;
  bottom: 1.5rem;
  left: 2rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.method-section {
  position: relative;
  z-index: 3;
  max-width: var(--container);
  margin: -2rem auto 0;
  padding: 4.25rem 2rem 3.25rem;
  background: rgba(247, 244, 236, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.48);
  border-radius: 8px;
  box-shadow: 0 28px 80px rgba(7, 11, 7, 0.28);
  backdrop-filter: blur(22px);
}

@media (min-width: 900px) {
  .method-section,
  .journey-section,
  .social-proof {
    position: sticky;
    top: 5.75rem;
    transform-origin: center top;
  }

  .method-section {
    margin-bottom: 5rem;
  }

  .journey-section {
    margin-bottom: 5rem;
  }

  .social-proof {
    margin-bottom: 5rem;
  }
}

.section-kicker {
  margin-bottom: 1.1rem;
  color: var(--c-gold);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.method-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 320px);
  gap: 2.5rem;
  align-items: end;
  margin-bottom: 3rem;
}

.section-head {
  max-width: 720px;
  text-align: center;
}

.section-head--left {
  margin: 0;
  text-align: left;
}

.section-head h2 {
  margin: 0 0 0.9rem;
  color: var(--c-ink);
  font-family: var(--font-serif);
  font-size: clamp(2rem, 3.35vw, 3.35rem);
  font-weight: 500;
  line-height: 1.24;
  letter-spacing: 0;
}
.section-sub {
  margin: 0;
  color: var(--c-muted);
  font-size: 1rem;
  line-height: 1.85;
}

.method-note {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.38);
  border: 1px solid var(--c-line);
  border-radius: 8px;
  box-shadow: 0 18px 54px rgba(7, 11, 7, 0.1);
}

.note-number {
  display: block;
  color: var(--c-ink);
  font-family: var(--font-serif);
  font-size: 3.8rem;
  font-weight: 500;
  line-height: 1;
}

.note-label {
  display: block;
  margin-top: 0.8rem;
  color: var(--c-muted);
  font-size: 0.95rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--c-line);
  border-radius: 8px;
}
.feature-card {
  min-height: 260px;
  padding: clamp(1.35rem, 2.4vw, 2.2rem);
  background: rgba(255, 255, 255, 0.34);
  transition:
    background 0.35s ease,
    transform 0.35s ease;
}
.feature-card:hover {
  background: rgba(255, 255, 255, 0.56);
  transform: translateY(-3px);
}

.feature-index {
  display: block;
  margin-bottom: 3.2rem;
  color: var(--c-gold);
  font-family: var(--font-serif);
  font-size: 1.1rem;
}

.feature-card h3 {
  margin: 0 0 0.9rem;
  color: var(--c-ink);
  font-family: var(--font-serif);
  font-size: 1.45rem;
  font-weight: 500;
  line-height: 1.28;
  letter-spacing: 0;
}
.feature-card p {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: 0.98rem;
  line-height: 1.85;
}

.journey-section {
  position: relative;
  z-index: 4;
  max-width: var(--container);
  margin: 1rem auto 0;
  padding: 0 2rem;
  background: rgba(238, 241, 234, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 8px;
  backdrop-filter: blur(18px);
}

.journey-panel {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 3rem;
  padding: 4rem 0;
  border-top: 0;
}

.journey-panel h2 {
  max-width: 520px;
  margin: 0;
  color: var(--c-ink);
  font-family: var(--font-serif);
  font-size: clamp(1.9rem, 3vw, 3rem);
  font-weight: 500;
  line-height: 1.24;
  letter-spacing: 0;
}

.journey-list {
  display: grid;
  gap: 1px;
  padding: 0;
  margin: 0;
  overflow: hidden;
  list-style: none;
  border: 1px solid var(--c-line);
  border-radius: 8px;
}

.journey-list li {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.34);
  transition:
    background 0.28s ease,
    transform 0.28s ease;
}

.journey-list li:hover {
  background: rgba(255, 255, 255, 0.52);
  transform: translateX(6px);
}

.journey-list span {
  display: block;
  color: var(--c-ink);
  font-weight: 700;
}

.journey-list p {
  margin: 0.45rem 0 0;
  color: var(--c-muted);
  line-height: 1.8;
}

.social-proof {
  position: relative;
  z-index: 5;
  max-width: var(--container);
  margin: 1rem auto 0;
  padding: 4rem 2rem 4.5rem;
  overflow: hidden;
  color: #fff;
  text-align: center;
  background: rgba(16, 21, 15, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  box-shadow: 0 24px 80px rgba(7, 11, 7, 0.3);
  backdrop-filter: blur(12px);
}

.proof-copy {
  max-width: 820px;
  margin: 0 auto 2.5rem;
}

.social-proof h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.85rem, 3.2vw, 3.25rem);
  font-weight: 500;
  line-height: 1.24;
  letter-spacing: 0;
}
.schools {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  justify-content: center;
  max-width: 860px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 8px;
}
.school {
  min-width: 180px;
  padding: 1rem 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
}

/* ========== 底部 ========== */
.footer {
  position: relative;
  z-index: 8;
  padding: 2.5rem 2rem;
  background: var(--c-deep);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@supports (animation-timeline: view()) {
  .hero-body {
    animation:
      heroFloat 1s ease-out both,
      heroDrift linear both;
    animation-timeline: auto, view();
    animation-range: normal, exit 0% exit 80%;
  }

  .feature-card,
  .journey-list li,
  .school {
    animation: riseIn linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 62%;
  }

  .feature-card:nth-child(2),
  .journey-list li:nth-child(2),
  .school:nth-child(2) {
    animation-range: entry 8% entry 70%;
  }

  .feature-card:nth-child(3),
  .journey-list li:nth-child(3),
  .school:nth-child(3) {
    animation-range: entry 14% entry 76%;
  }
}
.footer-inner {
  display: flex;
  max-width: var(--container);
  margin: 0 auto;
  align-items: center;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.875rem;
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
}
.footer .logo-mark {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
}
.footer-icp {
  color: rgba(255, 255, 255, 0.44);
  font-size: 0.75rem;
}
.footer-copy {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.875rem;
}

@keyframes heroFloat {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes heroDrift {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0.18;
    transform: translateY(-42px) scale(0.96);
  }
}

@keyframes riseIn {
  from {
    opacity: 0.18;
    transform: translateY(34px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .hero {
    min-height: 92svh;
    padding: 6rem 1.25rem 4rem;
  }
  .hero-body {
    top: 16vh;
  }
  .hero-badge {
    max-width: 100%;
    flex-wrap: wrap;
    justify-content: center;
    text-transform: none;
  }
  .hero-title {
    font-size: clamp(2.4rem, 12vw, 3.5rem);
  }
  .hero-desc {
    font-size: 1rem;
  }
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .hero-caption {
    display: none;
  }
  .scroll-rail {
    display: none;
  }
  .btn-primary,
  .btn-glass {
    justify-content: center;
  }
  .method-section {
    margin: -1.5rem 1rem 0;
    padding: 2.75rem 1.25rem;
  }
  .method-layout,
  .journey-panel {
    grid-template-columns: 1fr;
  }
  .section-head,
  .section-head--left {
    margin-bottom: 2.4rem;
    text-align: left;
  }
  .feature-grid {
    grid-template-columns: 1fr;
  }
  .feature-card {
    min-height: auto;
  }
  .feature-index {
    margin-bottom: 1.6rem;
  }
  .journey-section {
    margin: 1rem;
    padding: 0 1.25rem;
  }
  .journey-panel {
    gap: 2rem;
    padding: 3rem 0;
  }
  .social-proof {
    margin: 1rem;
    padding: 3.5rem 1.25rem;
  }
  .schools {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .school {
    min-width: 0;
    padding: 0.9rem;
    font-size: 1rem;
  }
  .footer-inner {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>
