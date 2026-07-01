<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { autoReplyApi, uploadApi, type AutoReplyRule } from '../api/client'

// ── State ──────────────────────────────────────────────────────────────────
const rules   = ref<AutoReplyRule[]>([])
const loading = ref(true)
const error   = ref('')

async function fetchRules() {
  loading.value = true
  error.value   = ''
  try {
    rules.value = await autoReplyApi.list()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
onMounted(fetchRules)

// ── Search ─────────────────────────────────────────────────────────────────
const search = ref('')
const filtered = computed(() =>
  rules.value.filter(r =>
    r.keyword.toLowerCase().includes(search.value.toLowerCase()) ||
    r.response.toLowerCase().includes(search.value.toLowerCase())
  )
)

// ── Modal / Form ───────────────────────────────────────────────────────────
const showModal  = ref(false)
const editTarget = ref<AutoReplyRule | null>(null)
const saving     = ref(false)
const saveErr    = ref('')

const form = reactive({
  keyword: '', response: '', sender_id: 'All', enabled: true, mediaUrl: '', mediaType: ''
})

const isUploading = ref(false)
const uploadedFileName = ref('')

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return

  const file = target.files[0]
  isUploading.value = true
  uploadedFileName.value = file.name

  try {
    const res = await uploadApi.upload(file)
    form.mediaUrl = res.url
    uploadedFileName.value = file.name
    
    // Auto-detect media type
    if (res.mimeType.startsWith('image/')) {
      form.mediaType = 'image'
    } else if (res.mimeType.startsWith('video/')) {
      form.mediaType = 'video'
    } else if (res.mimeType.startsWith('audio/')) {
      form.mediaType = 'audio'
    } else {
      form.mediaType = 'document'
    }
  } catch (e) {
    alert('Failed to upload file: ' + (e as Error).message)
    uploadedFileName.value = ''
  } finally {
    isUploading.value = false
    target.value = ''
  }
}

watch(() => form.mediaUrl, (newVal) => {
  if (!newVal) {
    uploadedFileName.value = ''
  }
})

const devices = ['All'] // TODO: populate from devicesApi.list() if needed

function openCreate() {
  editTarget.value      = null
  form.keyword          = ''
  form.response         = ''
  form.sender_id        = 'All'
  form.enabled          = true
  form.mediaUrl         = ''
  form.mediaType        = ''
  uploadedFileName.value = ''
  saveErr.value         = ''
  showModal.value       = true
}

function openEdit(rule: AutoReplyRule) {
  editTarget.value  = rule
  form.keyword      = rule.keyword
  form.response     = rule.response
  form.sender_id    = rule.sender_id
  form.enabled      = rule.enabled
  form.mediaUrl     = rule.media_url ?? ''
  form.mediaType    = rule.media_type ?? ''
  uploadedFileName.value = rule.media_url ? rule.media_url.split('/').pop() || 'Uploaded file' : ''
  saveErr.value     = ''
  showModal.value   = true
}

function closeModal() {
  showModal.value  = false
  editTarget.value = null
}

async function saveRule() {
  saveErr.value = ''
  if (!form.keyword.trim() || !form.response.trim()) return
  saving.value = true
  try {
    const payload = {
      keyword:   form.keyword,
      response:  form.response,
      sender_id: form.sender_id,
      enabled:   form.enabled,
      mediaUrl:  form.mediaUrl.trim() || null,
      mediaType: form.mediaUrl.trim() ? (form.mediaType || null) : null,
    }
    if (editTarget.value) {
      const updated = await autoReplyApi.update(editTarget.value.id, payload)
      const idx = rules.value.findIndex(r => r.id === editTarget.value!.id)
      if (idx !== -1) rules.value[idx] = updated
    } else {
      const created = await autoReplyApi.create(payload)
      rules.value.push(created)
    }
    closeModal()
  } catch (e) {
    saveErr.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

async function deleteRule(rule: AutoReplyRule) {
  if (!confirm(`Delete rule "${rule.keyword}"?`)) return
  try {
    await autoReplyApi.delete(rule.id)
    rules.value = rules.value.filter(r => r.id !== rule.id)
  } catch (e) {
    alert((e as Error).message)
  }
}

async function toggleRule(rule: AutoReplyRule) {
  try {
    const updated = await autoReplyApi.update(rule.id, { enabled: !rule.enabled })
    const idx = rules.value.findIndex(r => r.id === rule.id)
    if (idx !== -1) rules.value[idx] = updated
  } catch (e) {
    alert((e as Error).message)
  }
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
      <button class="btn btn-ghost btn-sm" style="margin-left:auto" @click="fetchRules">Retry</button>
    </div>

    <!-- Header row -->
    <div class="section-header">
      <div class="search-wrap">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="search" class="input search-input" placeholder="Search keywords…" id="input-search-rules"/>
      </div>
      <button class="btn btn-primary btn-sm" @click="openCreate" id="btn-create-rule">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Rule
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card" style="padding:32px; text-align:center; color:var(--clr-text-muted)">
      <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 8px">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/>
      </svg>
      Loading rules…
    </div>

    <!-- Desktop table -->
    <div v-else class="card table-wrap hide-mobile-block">
      <table class="table">
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Response</th>
            <th>Sender</th>
            <th>Status</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in filtered" :key="rule.id">
            <td><code class="keyword-chip">{{ rule.keyword }}</code></td>
            <td class="response-cell">{{ rule.response }}</td>
            <td><span class="badge badge-gray">{{ rule.sender_id }}</span></td>
            <td>
              <button class="toggle-btn" :class="rule.enabled ? 'toggle-on' : 'toggle-off'"
                @click="toggleRule(rule)" :aria-label="rule.enabled ? 'Disable' : 'Enable'">
                <span class="toggle-knob"></span>
              </button>
            </td>
            <td>
              <div class="action-row">
                <button class="btn btn-ghost btn-sm btn-icon" @click="openEdit(rule)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="btn btn-danger btn-sm btn-icon" @click="deleteRule(rule)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5">
              <div class="empty-state" style="padding:32px">
                <div class="empty-state-icon">{{ rules.length === 0 ? '💬' : '🔍' }}</div>
                <h3>{{ rules.length === 0 ? 'No rules yet' : 'No rules found' }}</h3>
                <p>{{ rules.length === 0 ? 'Create your first auto-reply rule.' : 'Try adjusting your search.' }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div v-if="!loading" class="rule-cards show-mobile">
      <div class="card rule-card" v-for="rule in filtered" :key="'m-' + rule.id">
        <div class="rule-card-top">
          <code class="keyword-chip">{{ rule.keyword }}</code>
          <div style="display:flex; gap:8px; align-items:center">
            <button class="toggle-btn" :class="rule.enabled ? 'toggle-on' : 'toggle-off'" @click="toggleRule(rule)"><span class="toggle-knob"></span></button>
            <button class="btn btn-ghost btn-sm btn-icon" @click="openEdit(rule)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-danger btn-sm btn-icon" @click="deleteRule(rule)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
        </div>
        <p class="rule-response">{{ rule.response }}</p>
        <span class="badge badge-gray" style="font-size:11px">{{ rule.sender_id }}</span>
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
          <p class="modal-title">{{ editTarget ? 'Edit Rule' : 'New Auto-Reply Rule' }}</p>

          <div v-if="saveErr" class="save-err">{{ saveErr }}</div>

          <div style="display:flex; flex-direction:column; gap:16px">
            <div class="form-group">
              <label class="form-label" for="rule-keyword">Keyword (trigger)</label>
              <input id="rule-keyword" v-model="form.keyword" class="input" placeholder="e.g. halo, harga, info"/>
              <span class="form-hint">Case-insensitive. Matches if keyword appears anywhere in the message.</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="rule-response">Response text</label>
              <textarea id="rule-response" v-model="form.response" class="textarea" rows="4" placeholder="Enter the auto-reply message…"></textarea>
            </div>
            <div class="two-col">
              <div class="form-group">
                <label class="form-label" for="rule-media">Media URL <span class="form-optional">(optional)</span></label>
                <div class="url-input-wrap">
                  <svg class="url-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  <input id="rule-media" v-model="form.mediaUrl" class="input url-input" placeholder="https://example.com/image.jpg" :disabled="isUploading" />
                </div>
                <!-- File Upload Input -->
                <div style="margin-top: 6px; display: flex; align-items: center; gap: 8px;">
                  <label class="btn btn-ghost btn-sm" style="cursor: pointer; margin: 0; padding: 4px 10px; font-size: 11px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px; display: inline-block; vertical-align: middle;">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                    <span style="display: inline-block; vertical-align: middle;">{{ isUploading ? 'Uploading...' : 'Upload File' }}</span>
                    <input type="file" @change="onFileChange" style="display: none;" :disabled="isUploading" />
                  </label>
                  <span v-if="uploadedFileName" style="font-size: 11px; color: var(--clr-text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px;">
                    {{ uploadedFileName }}
                  </span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="rule-media-type">Media Type</label>
                <select id="rule-media-type" v-model="form.mediaType" class="input" :disabled="!form.mediaUrl">
                  <option value="">Auto (Detect)</option>
                  <option value="image">Image (Gambar)</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="document">Document (Dokumen)</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="rule-sender">Apply to number</label>
              <select id="rule-sender" v-model="form.sender_id" class="input">
                <option v-for="d in devices" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="form-group" style="flex-direction:row; align-items:center; justify-content:space-between">
              <label class="form-label" style="margin:0">Enable rule</label>
              <button class="toggle-btn" :class="form.enabled ? 'toggle-on' : 'toggle-off'" @click="form.enabled = !form.enabled" type="button"><span class="toggle-knob"></span></button>
            </div>
          </div>

          <div style="display:flex; gap:10px; margin-top:24px; justify-content:flex-end">
            <button class="btn btn-ghost" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" @click="saveRule" :disabled="!form.keyword.trim() || !form.response.trim() || saving" id="btn-save-rule">
              <svg v-if="saving" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4"/></svg>
              {{ saving ? 'Saving…' : (editTarget ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.api-error {
  display: flex; align-items: center; gap: 8px;
  background: var(--clr-danger-dim); border: 1px solid rgba(239,68,68,0.2);
  color: var(--clr-danger); padding: 10px 14px; border-radius: var(--radius-sm);
  font-size: 12px; margin-bottom: 20px;
}
.save-err {
  background: var(--clr-danger-dim); border: 1px solid rgba(239,68,68,0.2);
  color: var(--clr-danger); padding: 9px 12px; border-radius: var(--radius-sm);
  font-size: 12px; margin-bottom: 14px;
}
.section-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 180px; max-width: 320px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--clr-text-muted); pointer-events: none; }
.search-input { padding-left: 32px; }
.table-wrap { padding: 0; overflow-x: auto; }
.keyword-chip { background: var(--clr-accent-dim); color: var(--clr-accent); padding: 2px 8px; border-radius: var(--radius-sm); font-size: 12px; }
.response-cell { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--clr-text-muted); font-size: 12px; }
.action-row { display: flex; justify-content: flex-end; gap: 6px; }
.toggle-btn { width: 36px; height: 20px; border-radius: 10px; border: none; cursor: pointer; position: relative; transition: background var(--transition); flex-shrink: 0; }
.toggle-on  { background: var(--clr-accent); }
.toggle-off { background: var(--clr-text-dim); }
.toggle-knob { position: absolute; top: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: left var(--transition); }
.toggle-on  .toggle-knob { left: 18px; }
.toggle-off .toggle-knob { left: 2px; }
.rule-cards { display: none; flex-direction: column; gap: 12px; }
.rule-card { display: flex; flex-direction: column; gap: 10px; }
.rule-card-top { display: flex; align-items: center; justify-content: space-between; }
.rule-response { font-size: 12px; color: var(--clr-text-muted); }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.url-input-wrap { position: relative; }
.url-input-icon {
  position: absolute;
  left: 12px; top: 50%; transform: translateY(-50%);
  color: var(--clr-text-dim);
  pointer-events: none;
}
.url-input { padding-left: 34px; }
.form-optional { color: var(--clr-text-dim); font-weight: 400; font-size: 11px; }

@media (max-width: 768px) {
  .hide-mobile-block { display: none !important; }
  .rule-cards { display: flex !important; }
  .search-wrap { max-width: 100%; }
}
@media (max-width: 640px) {
  .two-col { grid-template-columns: 1fr; }
}
</style>
