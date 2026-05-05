<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">试卷管理系统</div>
      <nav class="nav-menu">
        <router-link to="/admin/papers" class="nav-item" active-class="active">
          <span class="nav-icon">📋</span> 试卷列表
        </router-link>
        <router-link to="/admin/papers/upload" class="nav-item" active-class="active">
          <span class="nav-icon">📤</span> 上传试卷
        </router-link>
        <div class="nav-divider"></div>
        <router-link to="/" class="nav-item">
          <span class="nav-icon">🏠</span> 返回首页
        </router-link>
      </nav>
    </aside>
    <main class="main-content">
      <div class="breadcrumb">
        <router-link to="/admin/papers">试卷管理</router-link>
        <template v-if="$route.path.includes('/upload')">
          <span class="sep">/</span><span>上传试卷</span>
        </template>
        <template v-if="$route.params.id && !$route.path.includes('/edit')">
          <span class="sep">/</span><span>试卷预览</span>
        </template>
        <template v-if="$route.path.includes('/edit')">
          <span class="sep">/</span>
          <router-link :to="`/admin/papers/${$route.params.id}`">试卷详情</router-link>
          <span class="sep">/</span><span>编辑</span>
        </template>
      </div>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; background: #f0f2f5; }
.sidebar {
  width: 200px; background: #001529; color: white; flex-shrink: 0;
  display: flex; flex-direction: column; min-height: 100vh;
}
.logo { padding: 20px 24px; font-size: 16px; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,.1); }
.nav-menu { padding: 12px 0; flex: 1; }
.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 12px 24px;
  color: rgba(255,255,255,.65); text-decoration: none; font-size: 14px;
  transition: all .2s;
}
.nav-item:hover { color: white; background: rgba(255,255,255,.08); }
.nav-item.active { color: white; background: #1890ff; }
.nav-icon { font-size: 16px; }
.nav-divider { height: 1px; background: rgba(255,255,255,.1); margin: 8px 16px; }
.main-content { flex: 1; display: flex; flex-direction: column; min-height: 100vh; overflow: auto; }
.breadcrumb { padding: 16px 24px; font-size: 14px; color: #595959; background: white; border-bottom: 1px solid #e8e8e8; }
.breadcrumb a { color: #1890ff; text-decoration: none; }
.breadcrumb .sep { margin: 0 8px; color: #ccc; }
</style>
