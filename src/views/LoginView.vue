<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../stores/auth.js'

const router = useRouter()

const email    = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)
const showPw   = ref(false)

async function handleLogin() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields.'
    return
  }
  loading.value = true
  try {
    await new Promise(r => setTimeout(r, 700)) // simulate network
    login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.message || 'Login failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Background grid decoration -->
    <div class="bg-grid" aria-hidden="true"></div>

    <div class="login-card">
      <!-- Logo -->
      <div class="login-logo">
        <div class="logo-mark">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.532 5.847L0 24l6.324-1.508A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.369l-.358-.213-3.754.895.929-3.647-.234-.375A9.817 9.817 0 012.182 12C2.182 6.565 6.565 2.182 12 2.182c5.434 0 9.818 4.383 9.818 9.818 0 5.434-4.384 9.818-9.818 9.818z"/>
          </svg>
        </div>
        <div>
          <h1 class="login-title">WA Gateway</h1>
          <p class="login-subtitle">Sign in to your dashboard</p>
        </div>
      </div>

      <!-- Form -->
      <form class="login-form" @submit.prevent="handleLogin" novalidate>
        <!-- Error banner -->
        <div v-if="error" class="login-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
        </div>

        <!-- Email -->
        <div class="form-group">
          <label class="form-label" for="login-email">Email address</label>
          <div class="input-icon-wrap">
            <svg class="input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <input
              id="login-email"
              v-model="email"
              type="email"
              class="input input-with-icon"
              placeholder="admin@example.com"
              autocomplete="email"
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <div class="input-icon-wrap">
            <svg class="input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              id="login-password"
              v-model="password"
              :type="showPw ? 'text' : 'password'"
              class="input input-with-icon input-with-suffix"
              placeholder="••••••••"
              autocomplete="current-password"
              :disabled="loading"
            />
            <button
              type="button"
              class="pw-toggle"
              @click="showPw = !showPw"
              :aria-label="showPw ? 'Hide password' : 'Show password'"
            >
              <!-- Eye / Eye-off -->
              <svg v-if="!showPw" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="btn btn-primary login-btn"
          :disabled="loading"
          id="btn-login"
        >
          <svg v-if="loading" class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
          </svg>
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="login-hint">
        Internal use only. Contact your administrator for access.
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--clr-bg);
  position: relative;
  overflow: hidden;
  padding: 24px;
}

/* Subtle dot-grid background */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle, rgba(37,211,102,0.06) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}

/* Soft radial glow */
.login-page::before {
  content: '';
  position: absolute;
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(37,211,102,0.07) 0%, transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.login-card {
  background: var(--clr-card);
  border: 1px solid var(--clr-border);
  border-radius: var(--radius-lg);
  padding: 36px 32px 28px;
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
  animation: fadeIn 0.25s ease;
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.logo-mark {
  width: 48px; height: 48px;
  background: var(--clr-accent-dim);
  border: 1px solid rgba(37,211,102,0.2);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--clr-accent);
  flex-shrink: 0;
}
.login-title    { font-size: 1.2rem; font-weight: 700; line-height: 1.2; }
.login-subtitle { font-size: 12px; color: var(--clr-text-muted); margin-top: 2px; }

.login-form { display: flex; flex-direction: column; gap: 16px; }

.login-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--clr-danger-dim);
  border: 1px solid rgba(239,68,68,0.2);
  color: var(--clr-danger);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
}

/* Input with icon */
.input-icon-wrap { position: relative; }
.input-icon {
  position: absolute; left: 11px; top: 50%;
  transform: translateY(-50%);
  color: var(--clr-text-muted);
  pointer-events: none;
}
.input-with-icon  { padding-left: 34px; }
.input-with-suffix { padding-right: 36px; }

.pw-toggle {
  position: absolute; right: 10px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  color: var(--clr-text-muted); cursor: pointer;
  display: flex; align-items: center; padding: 4px;
  border-radius: var(--radius-sm);
  transition: color var(--transition);
}
.pw-toggle:hover { color: var(--clr-text); }

.login-btn {
  width: 100%;
  justify-content: center;
  padding: 11px;
  font-size: 14px;
  margin-top: 4px;
}

.login-hint {
  margin-top: 20px;
  font-size: 11px;
  color: var(--clr-text-dim);
  text-align: center;
}

@media (max-width: 440px) {
  .login-card { padding: 24px 20px 20px; }
}
</style>
