<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { scheduledApi, devicesApi, type ScheduledMessage, type Device } from '../api/client'

const messages = ref<ScheduledMessage[]>([])
const devices  = ref<Device[]>([])
const loading  = ref(true)
const error    = ref('')

async function fetchData() {
  loading.value = true
  error.value   = ''
  try {
    const [msgsRes, devsRes] = await Promise.all([scheduledApi.list(), devicesApi.list()])
    messages.value = msgsRes
    devices.value  = devsRes
  } catch (e) { error.value = (e as Error).message }
  finally { loading.value = false }
}
onMounted(fetchData)

// ── Filter ───────────────────────────────────────────────────────────────────
const statusFilter = ref<'all' | 'pending' | 'sent' | 'failed'>('all')

const filtered = computed(() =>
  messages.value.filter(m =>
    statusFilter.value === 'all' || m.status === statusFilter.value
  )
)

const countByStatus = computed(() => ({
  all:     messages.value.length,
  pending: messages.value.filter(m => m.status === 'pending').length,
  sent:    messages.value.filter(m => m.status === 'sent').length,
  failed:  messages.value.filter(m => m.status === 'failed').length,
}))

// ── Modal / Form ─────────────────────────────────────────────────────────────
const showModal  = ref(false)
const editTarget = ref<ScheduledMessage | null>(null)
const saving     = ref(false)
const saveErr    = ref('')

const form = reactive({
  deviceId:   '',
  to:         '',
  message:    '',
  mediaUrl:   '',
  mediaType:  '',
  scheduledAt: '',
  repeat:     null as 'daily' | 'weekly' | 'monthly' | null,
})

function toLocalInput(isoStr: string): string {
  const d = new Date(isoStr)
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 16)
}
function defaultScheduledAt(): string {
  return toLocalInput(new Date(Date.now() + 60 * 60 * 1000).toISOString())
}

function openCreate() {
  editTarget.value    = null
  form.deviceId       = devices.value.find(d => d.status === 'connected')?.id ?? devices.value[0]?.id ?? ''
  form.to             = ''
  form.message        = ''
  form.mediaUrl       = ''
  form.mediaType      = ''
  form.scheduledAt    = defaultScheduledAt()
  form.repeat         = null
  saveErr.value       = ''
  showModal.value     = true
}
function openEdit(m: ScheduledMessage) {
  editTarget.value    = m
  form.deviceId       = m.device_id
  form.to             = m.to
  form.message        = m.message
  form.mediaUrl       = m.media_url ?? ''
  form.mediaType      = m.media_type ?? ''
  form.scheduledAt    = toLocalInput(m.scheduled_at)
  form.repeat         = m.repeat
  saveErr.value       = ''
  showModal.value     = true
}
function closeModal() { showModal.value = false; editTarget.value = null }

async function saveMsg() {
  saveErr.value = ''
  if (!form.deviceId || !form.to.trim() || !form.message.trim() || !form.scheduledAt) return
  saving.value = true
  try {
    const payload = {
      deviceId:   form.deviceId,
      to:         form.to.trim(),
      message:    form.message.trim(),
      mediaUrl:   form.mediaUrl.trim() || undefined,
      mediaType:  form.mediaUrl.trim() ? (form.mediaType || undefined) : undefined,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      repeat:      form.repeat,
    }
    if (editTarget.value) {
      const updated = await scheduledApi.update(editTarget.value.id, payload)
      const idx = messages.value.findIndex(m => m.id === editTarget.value!.id)
      if (idx !== -1) messages.value[idx] = updated
    } else {
      const created = await scheduledApi.create(payload)
      messages.value.unshift(created)
    }
    closeModal()
  } catch (e) { saveErr.value = (e as Error).message }
  finally { saving.value = false }
}
async function deleteMsg(m: ScheduledMessage) {
  if (!confirm('Delete this scheduled message?')) return
  try {
    await scheduledApi.delete(m.id)
    messages.value = messages.value.filter(x => x.id !== m.id)
  } catch (e) { alert((e as Error).message) }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
function repeatLabel(r: string | null) {
  if (!r) return 'Once'
  return { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[r] ?? r
}
function statusColor(s: string) {
  if (s === 'pending') return 'badge-yellow'
  if (s === 'sent')    return 'badge-green'
  return 'badge-red'
}
function statusIcon(s: string) {
  if (s === 'pending') return '⏳'
  if (s === 'sent')    return '✅'
  return '❌'
}
</script>

<template>
  <div class="animate-fadeIn sched-page">

    <!-- ── Error ── -->
    <div v-if="error" class="api-error">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
      </svg>
      {{ error }}
      <button class="btn btn-ghost btn-sm" style="margin-left:auto" @click="fetchData">Retry</button>
    </div>

    <!-- ── Page Header ── -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div>
          <h2 class="page-title">Scheduled Messages</h2>
          <p class="page-subtitle">Schedule messages to be sent automatically at a chosen time</p>
        </div>
      </div>
      <button class="btn btn-primary" @click="openCreate" id="btn-create-scheduled">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Schedule Message
      </button>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="card loading-card">
      <svg class="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/>
      </svg>
      <span>Loading scheduled messages…</span>
    </div>

    <template v-else>

      <!-- ── Stat Tabs ── -->
      <div class="stat-tabs">
        <button
          v-for="tab in (['all', 'pending', 'sent', 'failed'] as const)"
          :key="tab"
          class="stat-tab"
          :class="{ 'stat-tab--active': statusFilter === tab, [`stat-tab--${tab}`]: statusFilter === tab }"
          @click="statusFilter = tab"
        >
          <span class="stat-tab-count">{{ countByStatus[tab] }}</span>
          <span class="stat-tab-label">{{ tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1) }}</span>
        </button>
      </div>

      <!-- ── Empty state ── -->
      <div v-if="filtered.length === 0" class="card empty-state">
        <div class="empty-state-icon">{{ statusFilter === 'all' ? '⏰' : (statusFilter === 'pending' ? '⏳' : statusFilter === 'sent' ? '✅' : '❌') }}</div>
        <h3>{{ statusFilter === 'all' ? 'No scheduled messages' : `No ${statusFilter} messages` }}</h3>
        <p>{{ statusFilter === 'all' ? 'Schedule your first automated message below.' : `There are no ${statusFilter} messages to display.` }}</p>
        <button v-if="statusFilter === 'all'" class="btn btn-primary btn-sm" @click="openCreate" style="margin-top:16px">
          Schedule Message
        </button>
      </div>

      <!-- ── Message Cards ── -->
      <div v-else class="msg-list">
        <div v-for="m in filtered" :key="m.id" class="msg-card">

          <!-- Card header -->
          <div class="msg-card-header">
            <!-- Left: time + status -->
            <div class="msg-header-left">
              <div class="msg-time-block">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span class="msg-time">{{ fmtDate(m.scheduled_at) }}</span>
              </div>
              <span class="badge" :class="statusColor(m.status)">
                {{ statusIcon(m.status) }} {{ m.status.charAt(0).toUpperCase() + m.status.slice(1) }}
              </span>
              <span v-if="m.repeat" class="badge badge-gray repeat-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                {{ repeatLabel(m.repeat) }}
              </span>
            </div>

            <!-- Right: actions -->
            <div class="msg-card-actions">
              <button v-if="m.status === 'pending'" class="icon-btn" @click="openEdit(m)" title="Edit schedule">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="icon-btn icon-btn--danger" @click="deleteMsg(m)" title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M5 6l1-3h12l1 3"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Message body -->
          <div class="msg-body">
            <span v-if="m.media_url" class="media-chip">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              Media
            </span>
            <p class="msg-text">{{ m.message }}</p>
          </div>

          <!-- Meta row -->
          <div class="msg-meta">
            <span class="meta-pill">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              {{ m.device_id }}
            </span>
            <span class="meta-pill">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.11 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.09a16 16 0 0 0 6 6l.45-.45a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></svg>
              {{ m.to }}
            </span>
            <span v-if="m.last_sent_at" class="meta-pill meta-pill--muted">
              Sent {{ fmtDate(m.last_sent_at) }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Modal ── -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay animate-fadeIn" @click.self="closeModal">
        <div class="modal modal--sched">
          <button class="modal-close" @click="closeModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <div class="modal-icon-header">
            <div class="modal-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <p class="modal-title" style="margin-bottom:2px">
                {{ editTarget ? 'Edit Schedule' : 'Schedule a Message' }}
              </p>
              <p style="font-size:12px; color:var(--clr-text-muted)">
                {{ editTarget ? 'Update the delivery details below' : 'Set up an automated message for a future time' }}
              </p>
            </div>
          </div>

          <div v-if="saveErr" class="save-err" style="margin-bottom:16px">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
            {{ saveErr }}
          </div>

          <div class="modal-form">

            <!-- Row 1: Device + Recipient -->
            <div class="two-col">
              <div class="form-group">
                <label class="form-label" for="sched-device">Send from device</label>
                <select id="sched-device" v-model="form.deviceId" class="input">
                  <option v-if="devices.length === 0" value="" disabled>No devices found</option>
                  <option v-for="d in devices" :key="d.id" :value="d.id">
                    {{ d.name }} ({{ d.id }})
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sched-to">Recipient number</label>
                <input id="sched-to" v-model="form.to" class="input" placeholder="e.g. 08123456789" />
              </div>
            </div>

            <!-- Row 2: Time + Repeat -->
            <div class="two-col">
              <div class="form-group">
                <label class="form-label" for="sched-time">Date & Time</label>
                <input id="sched-time" v-model="form.scheduledAt" type="datetime-local" class="input" />
              </div>
              <div class="form-group">
                <label class="form-label" for="sched-repeat">Repeat</label>
                <select id="sched-repeat" v-model="form.repeat" class="input">
                  <option :value="null">Once</option>
                  <option value="daily">Every Day</option>
                  <option value="weekly">Every Week</option>
                  <option value="monthly">Every Month</option>
                </select>
              </div>
            </div>

            <!-- Media URL & Media Type -->
            <div class="two-col">
              <div class="form-group">
                <label class="form-label" for="sched-media">Media URL <span class="form-optional">(optional)</span></label>
                <div class="url-input-wrap">
                  <svg class="url-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  <input id="sched-media" v-model="form.mediaUrl" class="input url-input" placeholder="https://example.com/image.jpg" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="sched-media-type">Media Type</label>
                <select id="sched-media-type" v-model="form.mediaType" class="input" :disabled="!form.mediaUrl">
                  <option value="">Auto (Detect)</option>
                  <option value="image">Image (Gambar)</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="document">Document (Dokumen)</option>
                </select>
              </div>
            </div>

            <!-- Message -->
            <div class="form-group">
              <label class="form-label" for="sched-message">Message</label>
              <textarea id="sched-message" v-model="form.message" class="textarea" rows="4" placeholder="Type your message here…"></textarea>
            </div>

            <div class="modal-actions">
              <button class="btn btn-ghost" @click="closeModal">Cancel</button>
              <button
                class="btn btn-primary"
                @click="saveMsg"
                :disabled="saving || !form.deviceId || !form.to.trim() || !form.message.trim() || !form.scheduledAt"
              >
                <svg v-if="saving" class="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/></svg>
                {{ saving ? 'Saving…' : (editTarget ? 'Update Schedule' : 'Schedule Message') }}
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
.sched-page { max-width: 820px; display: flex; flex-direction: column; gap: 20px; }

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

/* ── Loading ── */
.loading-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: var(--clr-text-muted);
}

/* ── Stat Tabs ── */
.stat-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.stat-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--clr-border);
  background: var(--clr-card);
  cursor: pointer;
  transition: all var(--transition);
  min-width: 72px;
}
.stat-tab:hover { border-color: var(--clr-border-hover); background: rgba(255,255,255,0.04); }
.stat-tab--active { border-color: var(--clr-accent); background: var(--clr-accent-dim); }
.stat-tab--pending.stat-tab--active { border-color: var(--clr-warning); background: var(--clr-warning-dim); }
.stat-tab--failed.stat-tab--active  { border-color: var(--clr-danger);  background: var(--clr-danger-dim); }
.stat-tab-count {
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1;
  color: var(--clr-text);
}
.stat-tab--active         .stat-tab-count { color: var(--clr-accent); }
.stat-tab--pending.stat-tab--active .stat-tab-count { color: var(--clr-warning); }
.stat-tab--failed.stat-tab--active  .stat-tab-count { color: var(--clr-danger); }
.stat-tab-label { font-size: 11px; color: var(--clr-text-muted); font-weight: 500; }

/* ── Message Cards ── */
.msg-list { display: flex; flex-direction: column; gap: 10px; }

.msg-card {
  background: var(--clr-card);
  border: 1px solid var(--clr-border);
  border-radius: var(--radius-md);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.msg-card:hover {
  border-color: var(--clr-border-hover);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.msg-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.msg-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}
.msg-time-block {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--clr-text-muted);
}
.msg-time { font-size: 13px; font-weight: 600; color: var(--clr-text); }
.repeat-badge { display: flex; align-items: center; gap: 5px; }

.msg-card-actions { display: flex; gap: 6px; flex-shrink: 0; }

.msg-body { display: flex; flex-direction: column; gap: 6px; }
.media-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  color: var(--clr-info);
  background: var(--clr-info-dim);
  border: 1px solid rgba(59,130,246,0.2);
  padding: 2px 8px;
  border-radius: 99px;
  width: fit-content;
}
.msg-text {
  font-size: 13px;
  color: var(--clr-text);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.msg-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--clr-text-muted);
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--clr-border);
  padding: 3px 8px;
  border-radius: 99px;
}
.meta-pill--muted { color: var(--clr-text-dim); }

/* ── Icon Buttons ── */
.icon-btn {
  width: 30px; height: 30px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--clr-border);
  background: transparent;
  color: var(--clr-text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition);
}
.icon-btn:hover { background: rgba(255,255,255,0.06); color: var(--clr-text); border-color: var(--clr-border-hover); }
.icon-btn--danger:hover { background: var(--clr-danger-dim); color: var(--clr-danger); border-color: rgba(239,68,68,0.3); }

/* ── Modal ── */
.modal--sched { max-width: 560px; }
.modal-icon-header {
  display: flex; align-items: center; gap: 14px;
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
.modal-form { display: flex; flex-direction: column; gap: 16px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.url-input-wrap { position: relative; }
.url-input-icon {
  position: absolute;
  left: 12px; top: 50%; transform: translateY(-50%);
  color: var(--clr-text-dim);
  pointer-events: none;
}
.url-input { padding-left: 34px; }

.modal-actions {
  display: flex; justify-content: flex-end;
  gap: 10px; padding-top: 4px;
}
.form-optional { color: var(--clr-text-dim); font-weight: 400; }

/* ── Error ── */
.api-error {
  display: flex; align-items: center; gap: 8px;
  background: var(--clr-danger-dim); border: 1px solid rgba(239,68,68,0.2);
  color: var(--clr-danger); padding: 10px 14px;
  border-radius: var(--radius-sm); font-size: 13px;
}
.save-err {
  display: flex; align-items: center; gap: 8px;
  background: var(--clr-danger-dim); border: 1px solid rgba(239,68,68,0.2);
  color: var(--clr-danger); padding: 9px 12px;
  border-radius: var(--radius-sm); font-size: 12px;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .two-col { grid-template-columns: 1fr; }
  .stat-tabs { gap: 6px; }
  .stat-tab { padding: 8px 14px; min-width: 60px; }
}
</style>
