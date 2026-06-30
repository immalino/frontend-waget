<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiKeysApi, type ApiKey } from '../api/client'

const keys = ref<ApiKey[]>([])
const loading = ref(true)
const error = ref('')

async function fetchKeys() {
  loading.value = true
  error.value = ''
  try {
    keys.value = await apiKeysApi.list()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

onMounted(fetchKeys)

// ── Copy API Key ───────────────────────────────────────────────────────────
const copiedId = ref<string | null>(null)
function copyKey(key: ApiKey) {
  navigator.clipboard.writeText(key.key)
  copiedId.value = key.id
  setTimeout(() => {
    copiedId.value = null
  }, 2000)
}

// ── Visibility Toggle ───────────────────────────────────────────────────────
const visibleKeys = ref<Record<string, boolean>>({})
function toggleVisibility(id: string) {
  visibleKeys.value[id] = !visibleKeys.value[id]
}

// ── Modal / Form ───────────────────────────────────────────────────────────
const showModal = ref(false)
const keyName = ref('')
const saving = ref(false)
const saveErr = ref('')
const generatedKey = ref<ApiKey | null>(null)

function openCreate() {
  keyName.value = ''
  saveErr.value = ''
  generatedKey.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  generatedKey.value = null
}

async function createKey() {
  saveErr.value = ''
  if (!keyName.value.trim()) return
  saving.value = true
  try {
    const newKey = await apiKeysApi.create(keyName.value)
    keys.value.unshift(newKey)
    generatedKey.value = newKey
  } catch (e) {
    saveErr.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

async function toggleKey(key: ApiKey) {
  try {
    const updated = await apiKeysApi.update(key.id, { enabled: !key.enabled })
    const idx = keys.value.findIndex(k => k.id === key.id)
    if (idx !== -1) keys.value[idx] = updated
  } catch (e) {
    alert((e as Error).message)
  }
}

async function deleteKey(key: ApiKey) {
  if (!confirm(`Revoke and delete API Key "${key.name}"? This cannot be undone.`)) return
  try {
    await apiKeysApi.delete(key.id)
    keys.value = keys.value.filter(k => k.id !== key.id)
  } catch (e) {
    alert((e as Error).message)
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="animate-fadeIn">
    <!-- Error -->
    <div v-if="error" class="api-error">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
      </svg>
      {{ error }}
      <button class="btn btn-ghost btn-sm" style="margin-left:auto" @click="fetchKeys">Retry</button>
    </div>

    <!-- Header Row -->
    <div class="section-header">
      <div>
        <p class="section-desc">Manage API Keys for external apps like attendance, cash registers, or custom scripts.</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="openCreate" id="btn-create-key">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Generate Key
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card" style="padding:32px; text-align:center; color:var(--clr-text-muted)">
      <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 8px">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/>
      </svg>
      Loading API Keys…
    </div>

    <!-- Desktop Table -->
    <div v-else class="card table-wrap hide-mobile-block">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>API Key</th>
            <th>Created At</th>
            <th>Last Used</th>
            <th>Status</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="key in keys" :key="key.id">
            <td style="font-weight:600">{{ key.name }}</td>
            <td>
              <div class="key-container">
                <code class="key-text">{{ visibleKeys[key.id] ? key.key : 'wag_sk_••••••••••••••••••••••••' }}</code>
                <button class="btn btn-ghost btn-xs btn-icon" @click="toggleVisibility(key.id)" title="Toggle visibility">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <button class="btn btn-ghost btn-xs btn-icon" @click="copyKey(key)" :title="copiedId === key.id ? 'Copied!' : 'Copy Key'">
                  <svg v-if="copiedId === key.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              </div>
            </td>
            <td>{{ formatDate(key.created_at) }}</td>
            <td>{{ formatDate(key.last_used_at) }}</td>
            <td>
              <button class="toggle-btn" :class="key.enabled ? 'toggle-on' : 'toggle-off'"
                @click="toggleKey(key)" :aria-label="key.enabled ? 'Disable' : 'Enable'">
                <span class="toggle-knob"></span>
              </button>
            </td>
            <td style="text-align:right">
              <button class="btn btn-danger btn-sm btn-icon" @click="deleteKey(key)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="keys.length === 0">
            <td colspan="6">
              <div class="empty-state" style="padding:32px">
                <div class="empty-state-icon">🔑</div>
                <h3>No API Keys yet</h3>
                <p>Generate an API key to allow external apps to interact with your gateway.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div v-if="!loading" class="rule-cards show-mobile">
      <div class="card rule-card" v-for="key in keys" :key="'m-' + key.id">
        <div class="rule-card-top">
          <span style="font-weight:600">{{ key.name }}</span>
          <div style="display:flex; gap:8px; align-items:center">
            <button class="toggle-btn" :class="key.enabled ? 'toggle-on' : 'toggle-off'" @click="toggleKey(key)"><span class="toggle-knob"></span></button>
            <button class="btn btn-danger btn-sm btn-icon" @click="deleteKey(key)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
        </div>
        <div class="key-container" style="margin: 8px 0;">
          <code class="key-text">{{ visibleKeys[key.id] ? key.key : 'wag_sk_••••••••••••••••••••••••' }}</code>
          <button class="btn btn-ghost btn-xs btn-icon" @click="toggleVisibility(key.id)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn btn-ghost btn-xs btn-icon" @click="copyKey(key)">
            <svg v-if="copiedId === key.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
        <div style="font-size: 11px; color: var(--clr-text-muted);">
          <p>Created: {{ formatDate(key.created_at) }}</p>
          <p>Last Used: {{ formatDate(key.last_used_at) }}</p>
        </div>
      </div>
    </div>

    <!-- ── Modal ── -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay animate-fadeIn" @click.self="closeModal">
        <div class="modal">
          <button class="modal-close" @click="closeModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <p class="modal-title">Generate API Key</p>

          <div v-if="saveErr" class="save-err">{{ saveErr }}</div>

          <div v-if="generatedKey" class="success-panel">
            <p class="success-title">API Key Generated Successfully!</p>
            <p class="success-desc">Copy this key now. For security reasons, you cannot see it again once this modal is closed.</p>
            <div class="key-display-box">
              <code class="generated-key-text">{{ generatedKey.key }}</code>
              <button class="btn btn-primary btn-sm" @click="copyKey(generatedKey)" style="margin-left: 10px;">
                {{ copiedId === generatedKey.id ? 'Copied!' : 'Copy' }}
              </button>
            </div>
            <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
              <button class="btn btn-ghost" @click="closeModal">Done</button>
            </div>
          </div>

          <div v-else style="display:flex; flex-direction:column; gap:16px">
            <div class="form-group">
              <label class="form-label" for="key-name">Application Name / Description</label>
              <input id="key-name" v-model="keyName" class="input" placeholder="e.g. Absensi Sekolah, Aplikasi Kasir" @keyup.enter="createKey"/>
              <span class="form-hint">Used to identify this key in the logs.</span>
            </div>
            <div class="modal-actions" style="margin-top: 16px;">
              <button class="btn btn-ghost btn-sm" @click="closeModal">Cancel</button>
              <button class="btn btn-primary btn-sm" @click="createKey" :disabled="saving || !keyName.trim()">
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
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.section-desc {
  font-size: 13px;
  color: var(--clr-text-muted);
}
.key-container {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.03);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--clr-border);
}
.key-text {
  font-family: monospace;
  font-size: 12px;
}
.btn-xs {
  padding: 2px;
}
.success-panel {
  text-align: center;
  padding: 12px 0;
}
.success-title {
  color: var(--clr-accent);
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 6px;
}
.success-desc {
  font-size: 12px;
  color: var(--clr-text-muted);
  margin-bottom: 16px;
}
.key-display-box {
  background: rgba(37,211,102,0.05);
  border: 1px dashed var(--clr-accent);
  border-radius: var(--radius-sm);
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.generated-key-text {
  font-family: monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--clr-accent);
  word-break: break-all;
  text-align: left;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
