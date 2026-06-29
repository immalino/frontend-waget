<script setup>
import { ref, reactive } from 'vue'
import { user, updateUser, logout } from '../stores/auth.js'
import { useRouter } from 'vue-router'

const router = useRouter()

// ── Profile ─────────────────────────────────────────────────────────────────
const profile = reactive({
  name:   user.value?.name  ?? '',
  email:  user.value?.email ?? '',
})
const profileSaved  = ref(false)
const profileSaving = ref(false)

function saveProfile() {
  profileSaving.value = true
  setTimeout(() => {
    updateUser({ name: profile.name, email: profile.email })
    profileSaving.value = false
    profileSaved.value  = true
    setTimeout(() => profileSaved.value = false, 2500)
  }, 500)
}

// ── API Connection ───────────────────────────────────────────────────────────
const apiUrl  = ref(localStorage.getItem('wa_api_url') || 'http://localhost:3000')
const apiSaved = ref(false)
const apiTesting = ref(false)
const apiStatus  = ref(null) // null | 'ok' | 'error'

function saveApiUrl() {
  localStorage.setItem('wa_api_url', apiUrl.value)
  apiSaved.value = true
  setTimeout(() => apiSaved.value = false, 2500)
}

function testConnection() {
  apiTesting.value = true
  apiStatus.value  = null
  setTimeout(() => {
    // Mock: succeed if URL looks valid
    apiStatus.value  = apiUrl.value.startsWith('http') ? 'ok' : 'error'
    apiTesting.value = false
  }, 1200)
}

// ── Notifications ────────────────────────────────────────────────────────────
const notif = reactive({
  onDisconnect: JSON.parse(localStorage.getItem('wa_notif_disconnect') ?? 'true'),
  onBlastDone:  JSON.parse(localStorage.getItem('wa_notif_blast')      ?? 'true'),
  onIncoming:   JSON.parse(localStorage.getItem('wa_notif_incoming')   ?? 'false'),
})
const notifSaved = ref(false)
function saveNotifications() {
  localStorage.setItem('wa_notif_disconnect', notif.onDisconnect)
  localStorage.setItem('wa_notif_blast',      notif.onBlastDone)
  localStorage.setItem('wa_notif_incoming',   notif.onIncoming)
  notifSaved.value = true
  setTimeout(() => notifSaved.value = false, 2500)
}

// ── Change Password ──────────────────────────────────────────────────────────
const pw = reactive({ current: '', next: '', confirm: '' })
const pwError  = ref('')
const pwSaved  = ref(false)
const pwSaving = ref(false)
function changePassword() {
  pwError.value = ''
  if (!pw.current || !pw.next || !pw.confirm) { pwError.value = 'All fields required.'; return }
  if (pw.next.length < 6) { pwError.value = 'New password must be ≥ 6 characters.'; return }
  if (pw.next !== pw.confirm) { pwError.value = 'Passwords do not match.'; return }
  pwSaving.value = true
  setTimeout(() => {
    pw.current = pw.next = pw.confirm = ''
    pwSaving.value = false
    pwSaved.value  = true
    setTimeout(() => pwSaved.value = false, 2500)
  }, 600)
}

// ── Logout / Danger ──────────────────────────────────────────────────────────
function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="settings-page animate-fadeIn">

    <!-- ── Profile ── -->
    <section class="settings-section">
      <div class="section-head">
        <div>
          <h2 class="section-title">Profile</h2>
          <p class="section-desc">Your display name and login email.</p>
        </div>
        <div v-if="profileSaved" class="saved-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Saved
        </div>
      </div>

      <div class="card settings-card">
        <!-- Avatar -->
        <div class="avatar-row">
          <div class="avatar">{{ (profile.name || profile.email || '?')[0].toUpperCase() }}</div>
          <div>
            <p class="avatar-name">{{ profile.name || '—' }}</p>
            <p class="avatar-email">{{ profile.email }}</p>
          </div>
        </div>

        <hr class="divider" style="margin: 16px 0" />

        <div class="two-col">
          <div class="form-group">
            <label class="form-label" for="s-name">Display name</label>
            <input id="s-name" v-model="profile.name" class="input" placeholder="Your name" />
          </div>
          <div class="form-group">
            <label class="form-label" for="s-email">Email address</label>
            <input id="s-email" v-model="profile.email" type="email" class="input" placeholder="admin@example.com" />
          </div>
        </div>

        <div class="card-footer">
          <button class="btn btn-primary btn-sm" @click="saveProfile" :disabled="profileSaving" id="btn-save-profile">
            <svg v-if="profileSaving" class="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/>
            </svg>
            {{ profileSaving ? 'Saving…' : 'Save profile' }}
          </button>
        </div>
      </div>
    </section>

    <!-- ── API Connection ── -->
    <section class="settings-section">
      <div class="section-head">
        <div>
          <h2 class="section-title">API Connection</h2>
          <p class="section-desc">URL of the backend Hono server running on your STB.</p>
        </div>
        <div v-if="apiSaved" class="saved-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Saved
        </div>
      </div>

      <div class="card settings-card">
        <div class="form-group">
          <label class="form-label" for="s-api-url">Backend URL</label>
          <div class="url-row">
            <input id="s-api-url" v-model="apiUrl" class="input" placeholder="https://your-tunnel.trycloudflare.com" />
            <button class="btn btn-ghost btn-sm" @click="testConnection" :disabled="apiTesting" id="btn-test-api">
              <svg v-if="apiTesting" class="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/>
              </svg>
              {{ apiTesting ? 'Testing…' : 'Test' }}
            </button>
          </div>
          <span class="form-hint">Set this to your Cloudflare Tunnel URL in production.</span>
        </div>

        <!-- Test result -->
        <div v-if="apiStatus" class="api-status" :class="apiStatus === 'ok' ? 'api-ok' : 'api-err'">
          <svg v-if="apiStatus === 'ok'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ apiStatus === 'ok' ? 'Connection successful — backend is reachable.' : 'Could not reach the backend. Check the URL.' }}
        </div>

        <div class="card-footer">
          <button class="btn btn-primary btn-sm" @click="saveApiUrl" id="btn-save-api">Save URL</button>
        </div>
      </div>
    </section>

    <!-- ── Notifications ── -->
    <section class="settings-section">
      <div class="section-head">
        <div>
          <h2 class="section-title">Notifications</h2>
          <p class="section-desc">Browser notification preferences.</p>
        </div>
        <div v-if="notifSaved" class="saved-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Saved
        </div>
      </div>

      <div class="card settings-card">
        <div class="notif-list">
          <div class="notif-row">
            <div>
              <p class="notif-label">Device disconnected</p>
              <p class="notif-hint">Alert when a WA session drops.</p>
            </div>
            <button class="toggle-btn" :class="notif.onDisconnect ? 'toggle-on' : 'toggle-off'" @click="notif.onDisconnect = !notif.onDisconnect" :aria-label="notif.onDisconnect ? 'Disable' : 'Enable'">
              <span class="toggle-knob"></span>
            </button>
          </div>
          <hr class="divider" />
          <div class="notif-row">
            <div>
              <p class="notif-label">Blast queue completed</p>
              <p class="notif-hint">Alert when a mass blast finishes.</p>
            </div>
            <button class="toggle-btn" :class="notif.onBlastDone ? 'toggle-on' : 'toggle-off'" @click="notif.onBlastDone = !notif.onBlastDone">
              <span class="toggle-knob"></span>
            </button>
          </div>
          <hr class="divider" />
          <div class="notif-row">
            <div>
              <p class="notif-label">New incoming message</p>
              <p class="notif-hint">Alert on every inbound message (high volume).</p>
            </div>
            <button class="toggle-btn" :class="notif.onIncoming ? 'toggle-on' : 'toggle-off'" @click="notif.onIncoming = !notif.onIncoming">
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>

        <div class="card-footer">
          <button class="btn btn-primary btn-sm" @click="saveNotifications" id="btn-save-notif">Save preferences</button>
        </div>
      </div>
    </section>

    <!-- ── Password ── -->
    <section class="settings-section">
      <div class="section-head">
        <div>
          <h2 class="section-title">Change Password</h2>
          <p class="section-desc">Update your login password.</p>
        </div>
        <div v-if="pwSaved" class="saved-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Saved
        </div>
      </div>

      <div class="card settings-card">
        <div v-if="pwError" class="pw-error">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ pwError }}
        </div>

        <div class="three-col">
          <div class="form-group">
            <label class="form-label" for="s-pw-cur">Current password</label>
            <input id="s-pw-cur" v-model="pw.current" type="password" class="input" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label class="form-label" for="s-pw-new">New password</label>
            <input id="s-pw-new" v-model="pw.next" type="password" class="input" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label class="form-label" for="s-pw-confirm">Confirm password</label>
            <input id="s-pw-confirm" v-model="pw.confirm" type="password" class="input" placeholder="••••••••" />
          </div>
        </div>

        <div class="card-footer">
          <button class="btn btn-primary btn-sm" @click="changePassword" :disabled="pwSaving" id="btn-change-pw">
            <svg v-if="pwSaving" class="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/>
            </svg>
            {{ pwSaving ? 'Updating…' : 'Update password' }}
          </button>
        </div>
      </div>
    </section>

    <!-- ── Danger Zone ── -->
    <section class="settings-section">
      <h2 class="section-title" style="color: var(--clr-danger)">Danger Zone</h2>
      <div class="card settings-card danger-card">
        <div class="danger-row">
          <div>
            <p class="notif-label">Sign out</p>
            <p class="notif-hint">End your current session on this device.</p>
          </div>
          <button class="btn btn-danger btn-sm" @click="handleLogout" id="btn-logout">Sign out</button>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.settings-page {
  max-width: 760px;
}

.settings-section {
  margin-bottom: 32px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}
.section-title { font-size: 0.95rem; font-weight: 600; margin-bottom: 2px; }
.section-desc  { font-size: 12px; color: var(--clr-text-muted); }

.saved-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  color: var(--clr-accent);
  background: var(--clr-accent-dim);
  border: 1px solid rgba(37,211,102,0.2);
  padding: 3px 10px;
  border-radius: 99px;
  white-space: nowrap;
  flex-shrink: 0;
}

.settings-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

/* Avatar */
.avatar-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.avatar {
  width: 44px; height: 44px;
  background: var(--clr-accent-dim);
  border: 1.5px solid rgba(37,211,102,0.25);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; font-weight: 700; color: var(--clr-accent);
  flex-shrink: 0;
}
.avatar-name  { font-weight: 600; font-size: 14px; }
.avatar-email { font-size: 12px; color: var(--clr-text-muted); }

/* Grid layouts */
.two-col   { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

/* Card footer */
.card-footer { display: flex; justify-content: flex-end; padding-top: 4px; }

/* URL test row */
.url-row { display: flex; gap: 8px; }
.url-row .input { flex: 1; }

/* API status */
.api-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
}
.api-ok  { background: var(--clr-accent-dim); color: var(--clr-accent);  border-color: rgba(37,211,102,0.2); }
.api-err { background: var(--clr-danger-dim);  color: var(--clr-danger); border-color: rgba(239,68,68,0.2); }

/* Notifications */
.notif-list { display: flex; flex-direction: column; gap: 14px; }
.notif-row  { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.notif-label { font-size: 13px; font-weight: 500; }
.notif-hint  { font-size: 11px; color: var(--clr-text-muted); margin-top: 2px; }

/* Toggle (reused from AutoReply) */
.toggle-btn {
  width: 36px; height: 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: background var(--transition);
  flex-shrink: 0;
}
.toggle-on  { background: var(--clr-accent); }
.toggle-off { background: var(--clr-text-dim); }
.toggle-knob {
  position: absolute;
  top: 2px;
  width: 16px; height: 16px;
  background: white;
  border-radius: 50%;
  transition: left var(--transition);
}
.toggle-on  .toggle-knob { left: 18px; }
.toggle-off .toggle-knob { left: 2px; }

/* Password error */
.pw-error {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--clr-danger-dim);
  border: 1px solid rgba(239,68,68,0.2);
  color: var(--clr-danger);
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
}

/* Danger zone */
.danger-card { border-color: rgba(239,68,68,0.2); }
.danger-row  { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

/* Responsive */
@media (max-width: 640px) {
  .two-col   { grid-template-columns: 1fr; }
  .three-col { grid-template-columns: 1fr; }
  .url-row   { flex-direction: column; }
}
</style>
