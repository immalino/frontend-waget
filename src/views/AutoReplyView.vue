<script setup>
import { ref, computed } from 'vue'

// ── Mock data ──────────────────────────────────────────────────────────────
const rules = ref([
  { id: 1, keyword: 'halo', response: 'Halo juga! Ada yang bisa kami bantu?', senderId: 'All', enabled: true },
  { id: 2, keyword: 'harga', response: 'Silakan cek katalog kami di link berikut: example.com/catalog', senderId: '+62 812-3456-7890', enabled: true },
  { id: 3, keyword: 'jam buka', response: 'Kami buka setiap hari pukul 08.00 – 20.00 WIB.', senderId: 'All', enabled: false },
  { id: 4, keyword: 'lokasi', response: 'Kami beralamat di Jl. Contoh No. 123, Jakarta Selatan.', senderId: 'All', enabled: true },
])

let nextId = 5

const devices = ['All', '+62 812-3456-7890', '+62 821-9876-5432']

// ── Form ───────────────────────────────────────────────────────────────────
const showModal  = ref(false)
const editTarget = ref(null)
const form = ref({ keyword: '', response: '', senderId: 'All', enabled: true })
const saving = ref(false)

function openCreate() {
  editTarget.value = null
  form.value = { keyword: '', response: '', senderId: 'All', enabled: true }
  showModal.value = true
}

function openEdit(rule) {
  editTarget.value = rule
  form.value = { ...rule }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editTarget.value = null
}

function saveRule() {
  if (!form.value.keyword.trim() || !form.value.response.trim()) return
  saving.value = true
  setTimeout(() => {
    if (editTarget.value) {
      const idx = rules.value.findIndex(r => r.id === editTarget.value.id)
      if (idx !== -1) rules.value[idx] = { ...form.value, id: editTarget.value.id }
    } else {
      rules.value.push({ ...form.value, id: nextId++ })
    }
    saving.value = false
    closeModal()
  }, 400)
}

function deleteRule(rule) {
  if (confirm(`Delete rule "${rule.keyword}"?`)) {
    rules.value = rules.value.filter(r => r.id !== rule.id)
  }
}

function toggleRule(rule) {
  rule.enabled = !rule.enabled
}

// ── Search ─────────────────────────────────────────────────────────────────
const search = ref('')
const filtered = computed(() =>
  rules.value.filter(r =>
    r.keyword.toLowerCase().includes(search.value.toLowerCase()) ||
    r.response.toLowerCase().includes(search.value.toLowerCase())
  )
)
</script>

<template>
  <div class="animate-fadeIn">
    <!-- Header row -->
    <div class="section-header">
      <div class="search-wrap">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="search"
          class="input search-input"
          placeholder="Search keywords…"
          id="input-search-rules"
        />
      </div>
      <button class="btn btn-primary btn-sm" @click="openCreate" id="btn-create-rule">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Rule
      </button>
    </div>

    <!-- Desktop table -->
    <div class="card table-wrap hide-mobile-block">
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
            <td>
              <span class="badge badge-gray">{{ rule.senderId }}</span>
            </td>
            <td>
              <button
                class="toggle-btn"
                :class="rule.enabled ? 'toggle-on' : 'toggle-off'"
                @click="toggleRule(rule)"
                :aria-label="rule.enabled ? 'Disable rule' : 'Enable rule'"
              >
                <span class="toggle-knob"></span>
              </button>
            </td>
            <td>
              <div class="action-row">
                <button class="btn btn-ghost btn-sm btn-icon" @click="openEdit(rule)" :aria-label="`Edit ${rule.keyword}`">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="btn btn-danger btn-sm btn-icon" @click="deleteRule(rule)" :aria-label="`Delete ${rule.keyword}`">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5">
              <div class="empty-state" style="padding: 32px">
                <div class="empty-state-icon">🔍</div>
                <h3>No rules found</h3>
                <p>Try adjusting your search or create a new rule.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="rule-cards show-mobile">
      <div class="card rule-card" v-for="rule in filtered" :key="'m-' + rule.id">
        <div class="rule-card-top">
          <code class="keyword-chip">{{ rule.keyword }}</code>
          <div style="display:flex; gap:8px; align-items:center">
            <button class="toggle-btn" :class="rule.enabled ? 'toggle-on' : 'toggle-off'" @click="toggleRule(rule)">
              <span class="toggle-knob"></span>
            </button>
            <button class="btn btn-ghost btn-sm btn-icon" @click="openEdit(rule)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn btn-danger btn-sm btn-icon" @click="deleteRule(rule)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </button>
          </div>
        </div>
        <p class="rule-response">{{ rule.response }}</p>
        <span class="badge badge-gray" style="font-size:11px">{{ rule.senderId }}</span>
      </div>
      <div v-if="filtered.length === 0" class="card empty-state">
        <div class="empty-state-icon">💬</div>
        <h3>No rules yet</h3>
        <p>Create your first auto-reply rule.</p>
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

          <div style="display:flex; flex-direction:column; gap:16px">
            <div class="form-group">
              <label class="form-label" for="rule-keyword">Keyword (trigger)</label>
              <input id="rule-keyword" v-model="form.keyword" class="input" placeholder="e.g. halo, harga, info" />
              <span class="form-hint">Case-insensitive match in incoming message</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="rule-response">Response text</label>
              <textarea id="rule-response" v-model="form.response" class="textarea" placeholder="Enter the auto-reply message…" rows="4"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label" for="rule-sender">Apply to number</label>
              <select id="rule-sender" v-model="form.senderId" class="input">
                <option v-for="d in devices" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>

            <div class="form-group" style="flex-direction:row; align-items:center; justify-content:space-between">
              <label class="form-label" style="margin:0">Enable rule</label>
              <button
                class="toggle-btn"
                :class="form.enabled ? 'toggle-on' : 'toggle-off'"
                @click="form.enabled = !form.enabled"
                type="button"
              >
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>

          <div style="display:flex; gap:10px; margin-top:24px; justify-content:flex-end">
            <button class="btn btn-ghost" @click="closeModal">Cancel</button>
            <button
              class="btn btn-primary"
              @click="saveRule"
              :disabled="!form.keyword.trim() || !form.response.trim() || saving"
              id="btn-save-rule"
            >
              <svg v-if="saving" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/>
              </svg>
              {{ saving ? 'Saving…' : (editTarget ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── Header row ── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.search-wrap {
  position: relative;
  flex: 1;
  min-width: 180px;
  max-width: 320px;
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--clr-text-muted);
  pointer-events: none;
}
.search-input { padding-left: 32px; }

/* ── Table ── */
.table-wrap { padding: 0; overflow-x: auto; }
.keyword-chip {
  background: var(--clr-accent-dim);
  color: var(--clr-accent);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: 'Inter', monospace;
}
.response-cell {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--clr-text-muted);
  font-size: 12px;
}
.action-row { display: flex; justify-content: flex-end; gap: 6px; }

/* ── Toggle ── */
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

/* ── Mobile cards ── */
.rule-cards { display: none; flex-direction: column; gap: 12px; }
.rule-card { display: flex; flex-direction: column; gap: 10px; }
.rule-card-top { display: flex; align-items: center; justify-content: space-between; }
.rule-response { font-size: 12px; color: var(--clr-text-muted); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .hide-mobile-block { display: none !important; }
  .rule-cards { display: flex !important; }
  .search-wrap { max-width: 100%; }
}
</style>
