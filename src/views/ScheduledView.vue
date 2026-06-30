<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { scheduledApi, devicesApi, type ScheduledMessage, type Device } from '../api/client'

const messages = ref<ScheduledMessage[]>([])
const devices = ref<Device[]>([])
const loading = ref(true)
const error = ref('')

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const [msgsRes, devsRes] = await Promise.all([
      scheduledApi.list(),
      devicesApi.list()
    ])
    messages.value = msgsRes
    devices.value = devsRes
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// ── Search & Filter ────────────────────────────────────────────────────────
const search = ref('')
const statusFilter = ref('all') // all, pending, sent, failed

const filtered = computed(() => {
  return messages.value.filter(m => {
    const matchesSearch =
      m.to.includes(search.value) ||
      m.message.toLowerCase().includes(search.value.toLowerCase())

    const matchesStatus =
      statusFilter.value === 'all' || m.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

// ── Modal / Form ───────────────────────────────────────────────────────────
const showModal = ref(false)
const editTarget = ref<ScheduledMessage | null>(null)
const saving = ref(false)
const saveErr = ref('')

const form = reactive({
  deviceId: '',
  to: '',
  message: '',
  mediaUrl: '',
  scheduledAt: '',
  repeat: null as 'daily' | 'weekly' | 'monthly' | null
})

function openCreate() {
  editTarget.value = null
  form.deviceId = devices.value.find(d => d.status === 'connected')?.id || devices.value[0]?.id || ''
  form.to = ''
  form.message = ''
  form.mediaUrl = ''
  // Set default scheduled time to 1 hour from now
  const oneHourLater = new Date(Date.now() + 60 * 60 * 1000)
  // Format as YYYY-MM-DDThh:mm for input datetime-local
  const offset = oneHourLater.getTimezoneOffset()
  const localTime = new Date(oneHourLater.getTime() - offset * 60 * 1000)
  form.scheduledAt = localTime.toISOString().slice(0, 16)
  form.repeat = null
  saveErr.value = ''
  showModal.value = true
}

function openEdit(msg: ScheduledMessage) {
  editTarget.value = msg
  form.deviceId = msg.device_id
  form.to = msg.to
  form.message = msg.message
  form.mediaUrl = msg.media_url || ''
  // Parse scheduled_at back to local timezone string format for input
  const scheduledTime = new Date(msg.scheduled_at)
  const offset = scheduledTime.getTimezoneOffset()
  const localTime = new Date(scheduledTime.getTime() - offset * 60 * 1000)
  form.scheduledAt = localTime.toISOString().slice(0, 16)
  form.repeat = msg.repeat
  saveErr.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editTarget.value = null
}

async function saveMessage() {
  saveErr.value = ''
  if (!form.deviceId || !form.to.trim() || !form.message.trim() || !form.scheduledAt) return
  saving.value = true
  try {
    const payload = {
      deviceId: form.deviceId,
      to: form.to,
      message: form.message,
      mediaUrl: form.mediaUrl.trim() || undefined,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      repeat: form.repeat
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
  } catch (e) {
    saveErr.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

async function deleteMessage(msg: ScheduledMessage) {
  if (!confirm(`Cancel and delete this scheduled message?`)) return
  try {
    await scheduledApi.delete(msg.id)
    messages.value = messages.value.filter(m => m.id !== msg.id)
  } catch (e) {
    alert((e as Error).message)
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
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
      <button class="btn btn-ghost btn-sm" style="margin-left:auto" @click="fetchData">Retry</button>
    </div>

    <!-- Header Row -->
    <div class="section-header">
      <div class="filter-row">
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="search" class="input search-input" placeholder="Search number or message…" />
        </div>
        <select v-model="statusFilter" class="select select-inline">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <button class="btn btn-primary btn-sm" @click="openCreate" id="btn-create-scheduled">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Schedule
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card" style="padding:32px; text-align:center; color:var(--clr-text-muted)">
      <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 8px">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/>
      </svg>
      Loading Scheduled Messages…
    </div>

    <!-- Desktop Table -->
    <div v-else class="card table-wrap hide-mobile-block">
      <table class="table">
        <thead>
          <tr>
            <th>Scheduled Time</th>
            <th>Sender Device</th>
            <th>Recipient</th>
            <th>Message</th>
            <th>Repeat</th>
            <th>Status</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="msg in filtered" :key="msg.id">
            <td style="font-weight:600">{{ formatDate(msg.scheduled_at) }}</td>
            <td><span class="badge badge-gray">{{ msg.device_id }}</span></td>
            <td><code>{{ msg.to }}</code></td>
            <td class="message-cell">
              <div class="message-cell-content">
                <span v-if="msg.media_url" class="media-indicator" title="Media attached">📎</span>
                {{ msg.message }}
              </div>
            </td>
            <td>
              <span v-if="msg.repeat" class="badge badge-gray">{{ msg.repeat }}</span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>
              <span v-if="msg.status === 'pending'" class="badge badge-warning">Pending</span>
              <span v-else-if="msg.status === 'sent'" class="badge badge-success">Sent</span>
              <span v-else class="badge badge-danger">Failed</span>
            </td>
            <td>
              <div class="action-row">
                <button v-if="msg.status === 'pending'" class="btn btn-ghost btn-sm btn-icon" @click="openEdit(msg)" title="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="btn btn-danger btn-sm btn-icon" @click="deleteMessage(msg)" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="7">
              <div class="empty-state" style="padding:32px">
                <div class="empty-state-icon">⏰</div>
                <h3>No scheduled messages</h3>
                <p>Plan ahead by scheduling a message to be sent automatically.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div v-if="!loading" class="rule-cards show-mobile">
      <div class="card rule-card" v-for="msg in filtered" :key="'m-' + msg.id">
        <div class="rule-card-top">
          <span style="font-weight:600">{{ formatDate(msg.scheduled_at) }}</span>
          <div style="display:flex; gap:8px; align-items:center">
            <span v-if="msg.status === 'pending'" class="badge badge-warning">Pending</span>
            <span v-else-if="msg.status === 'sent'" class="badge badge-success">Sent</span>
            <span v-else class="badge badge-danger">Failed</span>
            <button v-if="msg.status === 'pending'" class="btn btn-ghost btn-sm btn-icon" @click="openEdit(msg)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-danger btn-sm btn-icon" @click="deleteMessage(msg)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
        </div>
        <p class="rule-response">
          <span v-if="msg.media_url" class="media-indicator" title="Media attached">📎 </span>
          {{ msg.message }}
        </p>
        <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap">
          <span class="badge badge-gray" style="font-size:10px">Device: {{ msg.device_id }}</span>
          <span class="badge badge-gray" style="font-size:10px">To: {{ msg.to }}</span>
          <span v-if="msg.repeat" class="badge badge-gray" style="font-size:10px">Repeat: {{ msg.repeat }}</span>
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
          <p class="modal-title">{{ editTarget ? 'Edit Scheduled Message' : 'Schedule New Message' }}</p>

          <div v-if="saveErr" class="save-err">{{ saveErr }}</div>

          <div style="display:flex; flex-direction:column; gap:16px">
            <div class="two-col">
              <div class="form-group">
                <label class="form-label" for="sched-device">Sender Device</label>
                <select id="sched-device" v-model="form.deviceId" class="select">
                  <option v-for="dev in devices" :key="dev.id" :value="dev.id">
                    {{ dev.name }} ({{ dev.id }})
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sched-to">Recipient Number</label>
                <input id="sched-to" v-model="form.to" class="input" placeholder="e.g. 08123456789" />
              </div>
            </div>

            <div class="two-col">
              <div class="form-group">
                <label class="form-label" for="sched-time">Schedule Date & Time</label>
                <input id="sched-time" v-model="form.scheduledAt" type="datetime-local" class="input" />
              </div>
              <div class="form-group">
                <label class="form-label" for="sched-repeat">Repeat Cycle</label>
                <select id="sched-repeat" v-model="form.repeat" class="select">
                  <option :value="null">Once (One-time)</option>
                  <option value="daily">Daily (Every Day)</option>
                  <option value="weekly">Weekly (Every Week)</option>
                  <option value="monthly">Monthly (Every Month)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="sched-media">Media URL (Optional)</label>
              <input id="sched-media" v-model="form.mediaUrl" class="input" placeholder="https://example.com/image.jpg" />
              <span class="form-hint">Public URL of an image, video, audio or document.</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="sched-message">Message text</label>
              <textarea id="sched-message" v-model="form.message" class="textarea" rows="4" placeholder="Enter message text…"></textarea>
            </div>

            <div class="modal-actions" style="margin-top: 16px;">
              <button class="btn btn-ghost btn-sm" @click="closeModal">Cancel</button>
              <button class="btn btn-primary btn-sm" @click="saveMessage" :disabled="saving || !form.deviceId || !form.to.trim() || !form.message.trim() || !form.scheduledAt">
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
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}
.filter-row {
  display: flex;
  gap: 10px;
  flex: 1;
  max-width: 480px;
}
.select-inline {
  width: auto;
  min-width: 140px;
}
.message-cell {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.message-cell-content {
  display: flex;
  align-items: center;
  gap: 4px;
}
.media-indicator {
  font-size: 14px;
}
.text-muted {
  color: var(--clr-text-muted);
}
.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.2);
}
.badge-success {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.2);
}
.badge-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
@media (max-width: 640px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
