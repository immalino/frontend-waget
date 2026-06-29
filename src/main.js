import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

import { isAuthed } from './stores/auth.js'

import LoginView    from './views/LoginView.vue'
import DashboardView from './views/DashboardView.vue'
import AutoReplyView from './views/AutoReplyView.vue'
import BlastView     from './views/BlastView.vue'
import SettingsView  from './views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login',       component: LoginView,    meta: { title: 'Sign In',     public: true } },
    { path: '/',            component: DashboardView, meta: { title: 'Dashboard' } },
    { path: '/auto-reply',  component: AutoReplyView, meta: { title: 'Auto-Reply' } },
    { path: '/blast',       component: BlastView,     meta: { title: 'Mass Blast' } },
    { path: '/settings',    component: SettingsView,  meta: { title: 'Settings'   } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Auth guard
router.beforeEach((to) => {
  if (!to.meta.public && !isAuthed.value) return '/login'
  if (to.path === '/login' && isAuthed.value) return '/'
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} — WA Gateway` : 'WA Gateway'
})

createApp(App).use(router).mount('#app')
