<template>
  <div class="home">
    <header class="home-header">
      <div class="header-inner">
        <div class="logo">
          <span class="logo-icon">📝</span>
          <span class="logo-text">QuizMaster</span>
        </div>
      </div>
    </header>

    <main class="home-main">
      <div class="hero">
        <h1 class="hero-title">在线试卷解析与答题系统</h1>
        <p class="hero-desc">上传PDF试卷，AI自动解析题目，在线答题评估</p>
      </div>

      <div class="entry-cards">
        <router-link to="/exam" class="entry-card card-exam">
          <div class="card-icon">✏️</div>
          <h2 class="card-title">在线答题</h2>
          <p class="card-desc">进入答题界面，选择试卷开始作答</p>
          <div class="card-features">
            <span>实时评分</span>
            <span>公式渲染</span>
            <span>图形展示</span>
          </div>
          <div class="card-action">开始答题 →</div>
        </router-link>

        <router-link to="/admin/papers" class="entry-card card-admin">
          <div class="card-icon">⚙️</div>
          <h2 class="card-title">后台管理</h2>
          <p class="card-desc">上传试卷、AI解析、题目校对与管理</p>
          <div class="card-features">
            <span>PDF上传</span>
            <span>AI解析</span>
            <span>题目管理</span>
          </div>
          <div class="card-action">进入管理 →</div>
        </router-link>
      </div>
    </main>

    <footer class="home-footer">
      <p>OxBridge Quiz © 2026</p>
    </footer>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.home-header {
  padding: 0 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
}

.home-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 40px;
}

.hero {
  text-align: center;
  margin-bottom: 64px;
}

.hero-title {
  font-size: 36px;
  font-weight: 700;
  color: white;
  margin: 0 0 16px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.hero-desc {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.entry-cards {
  display: flex;
  gap: 32px;
  max-width: 900px;
  width: 100%;
}

.entry-card {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 48px 36px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.entry-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
}

.card-icon {
  font-size: 52px;
  margin-bottom: 24px;
}

.card-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px;
  color: #1a1a2e;
}

.card-desc {
  font-size: 15px;
  color: #666;
  margin: 0 0 24px;
  line-height: 1.6;
}

.card-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 32px;
}

.card-features span {
  padding: 4px 14px;
  background: #f0f0f5;
  border-radius: 20px;
  font-size: 13px;
  color: #555;
}

.card-action {
  margin-top: auto;
  font-size: 15px;
  font-weight: 600;
}

.card-exam .card-action {
  color: #667eea;
}

.card-admin .card-action {
  color: #764ba2;
}

.home-footer {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

@media (max-width: 768px) {
  .entry-cards {
    flex-direction: column;
  }
  .hero-title {
    font-size: 26px;
  }
}
</style>
