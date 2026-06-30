<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiKeysApi, type ApiKey } from '../api/client'

const keys    = ref<ApiKey[]>([])
const loading = ref(true)
const error   = ref('')

async function fetchKeys() {
  loading.value = true
  error.value   = ''
  try { keys.value = await apiKeysApi.list() }
  catch (e) { error.value = (e as Error).message }
  finally { loading.value = false }
}
onMounted(fetchKeys)

// ── Visibility & Copy ────────────────────────────────────────────────────────
const visibleKeys = ref<Record<string, boolean>>({})
const copiedId    = ref<string | null>(null)

function toggleVisibility(id: string) {
  visibleKeys.value[id] = !visibleKeys.value[id]
}
function copyKey(k: ApiKey) {
  navigator.clipboard.writeText(k.key)
  copiedId.value = k.id
  setTimeout(() => (copiedId.value = null), 2000)
}

// ── Toggle / Delete ──────────────────────────────────────────────────────────
async function toggleKey(k: ApiKey) {
  try {
    const updated = await apiKeysApi.update(k.id, { enabled: !k.enabled })
    const idx = keys.value.findIndex(x => x.id === k.id)
    if (idx !== -1) keys.value[idx] = updated
  } catch (e) { alert((e as Error).message) }
}
async function deleteKey(k: ApiKey) {
  if (!confirm(`Revoke "${k.name}"? This cannot be undone.`)) return
  try {
    await apiKeysApi.delete(k.id)
    keys.value = keys.value.filter(x => x.id !== k.id)
  } catch (e) { alert((e as Error).message) }
}

// ── Create Modal ─────────────────────────────────────────────────────────────
const showModal    = ref(false)
const keyName      = ref('')
const saving       = ref(false)
const saveErr      = ref('')
const generatedKey = ref<ApiKey | null>(null)
const copyNewId    = ref(false)

function openCreate() {
  keyName.value      = ''
  saveErr.value      = ''
  generatedKey.value = null
  copyNewId.value    = false
  showModal.value    = true
}
function closeModal() {
  showModal.value    = false
  generatedKey.value = null
}
async function createKey() {
  if (!keyName.value.trim()) return
  saving.value  = true
  saveErr.value = ''
  try {
    const newKey = await apiKeysApi.create(keyName.value.trim())
    keys.value.unshift(newKey)
    generatedKey.value = newKey
  } catch (e) { saveErr.value = (e as Error).message }
  finally { saving.value = false }
}
function copyGenerated() {
  if (!generatedKey.value) return
  navigator.clipboard.writeText(generatedKey.value.key)
  copyNewId.value = true
  setTimeout(() => (copyNewId.value = false), 2000)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div class="animate-fadeIn ak-page">

    <!-- ── Error ── -->
    <div v-if="error" class="api-error">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
      </svg>
      {{ error }}
      <button class="btn btn-ghost btn-sm" style="margin-left:auto" @click="fetchKeys">Retry</button>
    </div>

    <!-- ── Page Header ── -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
        </div>
        <div>
          <h2 class="page-title">API Keys</h2>
          <p class="page-subtitle">Allow external apps to send messages without login</p>
        </div>
      </div>
      <button class="btn btn-primary" @click="openCreate" id="btn-create-key">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Generate Key
      </button>
    </div>

    <!-- ── How-to Banner ── -->
    <div class="info-banner">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <p>External apps use the header <code class="inline-code">X-API-Key: wag_sk_…</code> to send messages without a login session.</p>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="card loading-card">
      <svg class="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/>
      </svg>
      <span>Loading API Keys…</span>
    </div>

    <!-- ── Empty state ── -->
    <div v-else-if="keys.length === 0" class="card empty-state">
      <div class="empty-state-icon">🔑</div>
      <h3>No API Keys yet</h3>
      <p>Generate your first API key to start integrating external applications.</p>
      <button class="btn btn-primary btn-sm" @click="openCreate" style="margin-top:16px">Generate Key</button>
    </div>

    <!-- ── Key Cards ── -->
    <div v-else class="keys-list">
      <div
        v-for="k in keys"
        :key="k.id"
        class="key-card"
        :class="{ 'key-card--disabled': !k.enabled }"
      >
        <!-- Card header -->
        <div class="key-card-header">
          <div class="key-info">
            <div class="key-status-dot" :class="k.enabled ? 'dot-green' : 'dot-disabled'"></div>
            <span class="key-name">{{ k.name }}</span>
            <span class="badge" :class="k.enabled ? 'badge-green' : 'badge-gray'">
              {{ k.enabled ? 'Active' : 'Disabled' }}
            </span>
          </div>
          <div class="key-actions">
            <button
              class="toggle-btn"
              :class="k.enabled ? 'toggle-on' : 'toggle-off'"
              @click="toggleKey(k)"
              :title="k.enabled ? 'Disable key' : 'Enable key'"
            >
              <span class="toggle-knob"></span>
            </button>
            <button class="btn btn-danger btn-sm btn-icon" @click="deleteKey(k)" title="Revoke key">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M5 6l1-3h12l1 3"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Key value row -->
        <div class="key-value-row">
          <div class="key-value-box">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="key-icon-small">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
            <code class="key-value-text">
              {{ visibleKeys[k.id] ? k.key : 'wag_sk_' + '•'.repeat(32) }}
            </code>
          </div>
          <div class="key-value-actions">
            <button class="icon-btn" @click="toggleVisibility(k.id)" :title="visibleKeys[k.id] ? 'Hide' : 'Reveal'">
              <svg v-if="visibleKeys[k.id]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button
              class="icon-btn"
              :class="{ 'icon-btn--success': copiedId === k.id }"
              @click="copyKey(k)"
              :title="copiedId === k.id ? 'Copied!' : 'Copy to clipboard'"
            >
              <svg v-if="copiedId === k.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Metadata -->
        <div class="key-meta">
          <span class="meta-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Created {{ fmtDate(k.created_at) }}
          </span>
          <span class="meta-dot">·</span>
          <span class="meta-item" :class="{ 'meta-never': !k.last_used_at }">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            {{ k.last_used_at ? 'Last used ' + fmtDate(k.last_used_at) : 'Never used' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Modal ── -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay animate-fadeIn" @click.self="closeModal">
        <div class="modal modal--wide">
          <button class="modal-close" @click="closeModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <!-- Success panel after creation -->
          <div v-if="generatedKey" class="generated-panel">
            <div class="generated-icon">✅</div>
            <h3 class="generated-title">Key Generated!</h3>
            <p class="generated-hint">Copy this key now — you won't be able to see it again once you close this modal.</p>
            <div class="generated-key-box">
              <code class="generated-key-text">{{ generatedKey.key }}</code>
            </div>
            <div class="generated-actions">
              <button
                class="btn"
                :class="copyNewId ? 'btn-primary' : 'btn-ghost'"
                @click="copyGenerated"
              >
                <svg v-if="copyNewId" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                {{ copyNewId ? 'Copied!' : 'Copy Key' }}
              </button>
              <button class="btn btn-ghost" @click="closeModal">Done</button>
            </div>
          </div>

          <!-- Create form -->
          <div v-else>
            <div class="modal-icon-header">
              <div class="modal-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
              </div>
              <div>
                <p class="modal-title" style="margin-bottom:2px">Generate API Key</p>
                <p style="font-size:12px; color:var(--clr-text-muted)">Create a new key for an external application</p>
              </div>
            </div>

            <div v-if="saveErr" class="save-err" style="margin-bottom:16px">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
              {{ saveErr }}
            </div>

            <div class="form-group" style="margin-bottom:20px">
              <label class="form-label" for="key-name">Application name</label>
              <input
                id="key-name"
                v-model="keyName"
                class="input"
                placeholder="e.g. Absensi Sekolah, Aplikasi Kasir"
                @keyup.enter="createKey"
                autofocus
              />
              <span class="form-hint">Used to identify where requests are coming from.</span>
            </div>

            <div style="display:flex; gap:10px; justify-content:flex-end">
              <button class="btn btn-ghost" @click="closeModal">Cancel</button>
              <button
                class="btn btn-primary"
                @click="createKey"
                :disabled="saving || !keyName.trim()"
              >
                <svg v-if="saving" class="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/></svg>
                {{ saving ? 'Generating…' : 'Generate Key' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── Page layout ── */
.ak-page { max-width: 760px; display: flex; flex-direction: column; gap: 20px; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.page-header-left { display: flex; align-items: center; gap: 14px; }
.page-icon {
  width: 40px; height: 40px;
  background: var(--clr-accent-dim);
  border: 1px solid rgba(37,211,102,0.2);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--clr-accent);
  flex-shrink: 0;
}
.page-title   { font-size: 1.1rem; font-weight: 700; margin: 0; }
.page-subtitle { font-size: 12px; color: var(--clr-text-muted); margin: 0; }

/* ── Info Banner ── */
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: var(--clr-info-dim);
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: var(--radius-sm);
  color: var(--clr-info);
  font-size: 12px;
  line-height: 1.5;
}
.inline-code {
  font-family: monospace;
  background: rgba(59,130,246,0.15);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}

/* ── Loading ── */
.loading-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: var(--clr-text-muted);
}

/* ── Keys list ── */
.keys-list { display: flex; flex-direction: column; gap: 12px; }

.key-card {
  background: var(--clr-card);
  border: 1px solid var(--clr-border);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.key-card:hover {
  border-color: var(--clr-border-hover);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.key-card--disabled { opacity: 0.55; }

.key-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.key-info  { display: flex; align-items: center; gap: 10px; min-width: 0; }
.key-name  { font-weight: 600; font-size: 14px; }
.key-status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-green    { background: var(--clr-accent); box-shadow: 0 0 6px var(--clr-accent); }
.dot-disabled { background: var(--clr-text-dim); }

.key-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

/* ── Key Value Row ── */
.key-value-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--clr-surface);
  border: 1px solid var(--clr-border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
}
.key-value-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.key-icon-small { color: var(--clr-text-muted); flex-shrink: 0; }
.key-value-text {
  font-family: monospace;
  font-size: 12px;
  color: var(--clr-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.03em;
}
.key-value-actions { display: flex; gap: 4px; flex-shrink: 0; }

/* ── Icon Buttons ── */
.icon-btn {
  width: 28px; height: 28px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--clr-border);
  background: transparent;
  color: var(--clr-text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition);
}
.icon-btn:hover { background: rgba(255,255,255,0.06); color: var(--clr-text); border-color: var(--clr-border-hover); }
.icon-btn--success { color: var(--clr-accent); border-color: rgba(37,211,102,0.3); background: var(--clr-accent-dim); }

/* ── Metadata ── */
.key-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--clr-text-dim);
  flex-wrap: wrap;
}
.meta-item { display: flex; align-items: center; gap: 5px; }
.meta-dot  { color: var(--clr-border-hover); }
.meta-never { color: var(--clr-warning); }

/* ── Toggle ── */
.toggle-btn {
  width: 36px; height: 20px;
  border-radius: 10px; border: none;
  cursor: pointer; position: relative;
  transition: background var(--transition);
  flex-shrink: 0;
}
.toggle-on  { background: var(--clr-accent); }
.toggle-off { background: var(--clr-text-dim); }
.toggle-knob {
  position: absolute; top: 2px;
  width: 16px; height: 16px;
  background: white; border-radius: 50%;
  transition: left var(--transition);
}
.toggle-on .toggle-knob  { left: 18px; }
.toggle-off .toggle-knob { left: 2px; }

/* ── Modal extensions ── */
.modal--wide { max-width: 500px; }

.modal-icon-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}
.modal-icon-wrap {
  width: 44px; height: 44px;
  background: var(--clr-accent-dim);
  border: 1px solid rgba(37,211,102,0.2);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--clr-accent);
  flex-shrink: 0;
}

/* ── Generated key panel ── */
.generated-panel { text-align: center; padding: 8px 0; }
.generated-icon  { font-size: 2.5rem; margin-bottom: 12px; }
.generated-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; }
.generated-hint  { font-size: 12px; color: var(--clr-text-muted); margin-bottom: 20px; line-height: 1.6; }
.generated-key-box {
  background: var(--clr-surface);
  border: 1.5px dashed rgba(37,211,102,0.4);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 20px;
  word-break: break-all;
  text-align: left;
}
.generated-key-text {
  font-family: monospace;
  font-size: 13px;
  color: var(--clr-accent);
  line-height: 1.6;
  font-weight: 600;
  letter-spacing: 0.03em;
}
.generated-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* ── Error ── */
.api-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--clr-danger-dim);
  border: 1px solid rgba(239,68,68,0.2);
  color: var(--clr-danger);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}
.save-err {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--clr-danger-dim);
  border: 1px solid rgba(239,68,68,0.2);
  color: var(--clr-danger);
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
}
</style>
