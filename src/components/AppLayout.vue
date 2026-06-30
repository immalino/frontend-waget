<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { user, logout } from '../stores/auth.js'

const route  = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)

const navItems = [
  { path: '/',            label: 'Dashboard',   icon: 'grid' },
  { path: '/auto-reply',  label: 'Auto-Reply',  icon: 'reply' },
  { path: '/blast',       label: 'Mass Blast',  icon: 'zap' },
  { path: '/scheduled',   label: 'Scheduled',   icon: 'clock' },
  { path: '/api-keys',    label: 'API Keys',    icon: 'key' },
  { path: '/settings',    label: 'Settings',    icon: 'settings' },
]

function closeSidebar() { sidebarOpen.value = false }

const pageTitle = computed(() => {
  const item = navItems.find(n => n.path === route.path)
  return item ? item.label : 'WA Gateway'
})

const userInitial = computed(() =>
  (user.value?.name || user.value?.email || '?')[0].toUpperCase()
)

function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="layout">
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="mobile-overlay" @click="closeSidebar" />

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
      <div class="sidebar-header">
        <div class="logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" class="logo-icon">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.532 5.847L0 24l6.324-1.508A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.369l-.358-.213-3.754.895.929-3.647-.234-.375A9.817 9.817 0 012.182 12C2.182 6.565 6.565 2.182 12 2.182c5.434 0 9.818 4.383 9.818 9.818 0 5.434-4.384 9.818-9.818 9.818z"/>
          </svg>
          <span class="logo-text">WA Gateway</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="nav-item--active"
          exact-active-class="nav-item--active"
          @click="closeSidebar"
        >
          <!-- Grid icon -->
          <svg v-if="item.icon === 'grid'" class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          <!-- Reply icon -->
          <svg v-else-if="item.icon === 'reply'" class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
          </svg>
          <!-- Zap icon -->
          <svg v-else-if="item.icon === 'zap'" class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <!-- Clock icon -->
          <svg v-else-if="item.icon === 'clock'" class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <!-- Key icon -->
          <svg v-else-if="item.icon === 'key'" class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
          <!-- Settings icon -->
          <svg v-else-if="item.icon === 'settings'" class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-info">
            <p class="user-name">{{ user?.name || 'User' }}</p>
            <p class="user-email">{{ user?.email }}</p>
          </div>
          <button class="logout-btn" @click="handleLogout" title="Sign out" aria-label="Sign out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
        <span class="version-tag">v1.0 MVP</span>
      </div>
    </aside>

    <!-- Main area -->
    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
        <button class="topbar-menu btn btn-icon btn-ghost" @click="sidebarOpen = !sidebarOpen" aria-label="Toggle sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <h1 class="topbar-title">{{ pageTitle }}</h1>
        <div class="topbar-right">
          <div class="topbar-status hide-mobile">
            <span class="dot dot-green"></span>
            <span style="font-size:12px; color: var(--clr-text-muted);">Online</span>
          </div>
          <RouterLink to="/settings" class="topbar-avatar" :aria-label="'Settings'">
            {{ userInitial }}
          </RouterLink>
        </div>
      </header>

      <!-- Page content -->
      <main class="content">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ── Sidebar ── */
.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--clr-surface);
  border-right: 1px solid var(--clr-border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: transform var(--transition);
  z-index: 200;
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid var(--clr-border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--clr-accent);
}
.logo-icon { flex-shrink: 0; }
.logo-text { font-size: 15px; font-weight: 700; color: var(--clr-text); }

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  color: var(--clr-text-muted);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: background var(--transition), color var(--transition);
}
.nav-item:hover { background: rgba(255,255,255,0.04); color: var(--clr-text); }
.nav-item--active { background: var(--clr-accent-dim); color: var(--clr-accent); }
.nav-icon { flex-shrink: 0; }

.sidebar-footer {
  padding: 14px 12px;
  border-top: 1px solid var(--clr-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.version-tag { font-size: 11px; color: var(--clr-text-dim); padding-left: 4px; }

/* User chip in sidebar footer */
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--clr-border);
}
.user-avatar {
  width: 30px; height: 30px;
  background: var(--clr-accent-dim);
  color: var(--clr-accent);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  flex-shrink: 0;
}
.user-info { flex: 1; min-width: 0; }
.user-name  { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-email { font-size: 10px; color: var(--clr-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.logout-btn {
  background: none; border: none;
  color: var(--clr-text-muted); cursor: pointer;
  padding: 4px; border-radius: var(--radius-sm);
  display: flex; align-items: center;
  flex-shrink: 0;
  transition: color var(--transition);
}
.logout-btn:hover { color: var(--clr-danger); }

/* ── Main ── */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.topbar {
  height: var(--topbar-h);
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--clr-border);
  background: var(--clr-surface);
  flex-shrink: 0;
}

.topbar-title {
  font-size: 15px;
  font-weight: 600;
  flex: 1;
}

.topbar-menu { display: none; }

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar-status { display: flex; align-items: center; gap: 6px; }
.topbar-avatar {
  width: 30px; height: 30px;
  background: var(--clr-accent-dim);
  color: var(--clr-accent);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  text-decoration: none;
  border: 1.5px solid transparent;
  transition: border-color var(--transition);
  flex-shrink: 0;
}
.topbar-avatar:hover { border-color: var(--clr-accent); }

.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* ── Mobile overlay ── */
.mobile-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 199;
}

/* ── Page transition ── */
.page-enter-active,
.page-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.page-enter-from   { opacity: 0; transform: translateY(6px); }
.page-leave-to     { opacity: 0; transform: translateY(-6px); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    transform: translateX(-100%);
  }
  .sidebar--open {
    transform: translateX(0);
    box-shadow: 20px 0 60px rgba(0,0,0,0.4);
  }
  .topbar-menu { display: inline-flex; }
  .content { padding: 16px; }
}
</style>
