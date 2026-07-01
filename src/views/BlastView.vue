<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { devicesApi, blastApi, type Device } from '../api/client'

// ── Devices (for sender selector) ─────────────────────────────────────────
const devices      = ref<Device[]>([])
const devicesError = ref('')
onMounted(async () => {
  try { devices.value = await devicesApi.list() }
  catch (e) { devicesError.value = (e as Error).message }
})

// ── Form ───────────────────────────────────────────────────────────────────
const senderId = ref('')
const numbers  = ref('')
const message  = ref('')
const delay    = ref(7)
const mediaUrl = ref('')
const mediaType = ref('')

const connectedDevices = computed(() => devices.value.filter(d => d.status === 'connected'))

// Auto-select first connected device
const selectedDevice = computed(() =>
  connectedDevices.value.find(d => d.id === senderId.value) ||
  connectedDevices.value[0] ||
  null
)

const parsedNumbers = computed(() =>
  numbers.value
    .split('\n')
    .map(n => n.trim().replace(/\s+/g, '').replace(/[^\d+]/g, ''))
    .filter(n => n.length >= 8)
)

const isReady = computed(() =>
  parsedNumbers.value.length > 0 &&
  message.value.trim().length > 0 &&
  selectedDevice.value !== null
)

// ── Blast state ────────────────────────────────────────────────────────────
const blastId   = ref<string | null>(null)
const blastStatus = ref<{
  status: 'running' | 'completed' | 'stopped'
  sent: number
  failed: number
  total: number
} | null>(null)
const logs = ref<Array<{ num: string; ok: boolean; time: string }>>([])
const pollTimer = ref<ReturnType<typeof setInterval> | null>(null)
const startErr  = ref('')

async function startBlast() {
  if (!isReady.value || !selectedDevice.value) return
  startErr.value = ''
  try {
    const res = await blastApi.start(
      selectedDevice.value.id,
      parsedNumbers.value,
      message.value,
      delay.value,
      mediaUrl.value.trim() || undefined,
      mediaUrl.value.trim() ? (mediaType.value || undefined) : undefined
    )
    blastId.value     = res.blastId
    blastStatus.value = { status: 'running', sent: 0, failed: 0, total: parsedNumbers.value.length }
    logs.value        = []

    // Poll for progress every 2 seconds
    pollTimer.value = setInterval(pollStatus, 2000)
  } catch (e) {
    startErr.value = (e as Error).message
  }
}

async function pollStatus() {
  if (!blastId.value) return
  try {
    const s = await blastApi.status(blastId.value)
    blastStatus.value = s
    if (s.status !== 'running') {
      clearInterval(pollTimer.value!)
      pollTimer.value = null
    }
  } catch { /* ignore transient errors */ }
}

async function stopBlast() {
  if (!blastId.value) return
  try {
    await blastApi.stop(blastId.value)
    blastStatus.value = blastStatus.value
      ? { ...blastStatus.value, status: 'stopped' }
      : null
    clearInterval(pollTimer.value!)
    pollTimer.value = null
  } catch (e) {
    alert((e as Error).message)
  }
}

function reset() {
  blastId.value     = null
  blastStatus.value = null
  logs.value        = []
  mediaUrl.value    = ''
  mediaType.value   = ''
  clearInterval(pollTimer.value!)
  pollTimer.value   = null
}

onUnmounted(() => { if (pollTimer.value) clearInterval(pollTimer.value) })

const progressPct = computed(() =>
  blastStatus.value?.total
    ? Math.round(((blastStatus.value.sent + blastStatus.value.failed) / blastStatus.value.total) * 100)
    : 0
)
</script>

<template>
  <div class="animate-fadeIn blast-layout">

    <!-- ── Left: config form ── -->
    <div class="blast-form">
      <div class="card" style="display:flex; flex-direction:column; gap:20px;">

        <!-- API error -->
        <div v-if="devicesError" class="api-error">{{ devicesError }}</div>

        <!-- No connected devices -->
        <div v-if="!devicesError && connectedDevices.length === 0" class="no-device-warn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          No connected devices. Go to Dashboard and link a WhatsApp account first.
        </div>

        <!-- Sender -->
        <div class="form-group">
          <label class="form-label" for="blast-sender">Send from</label>
          <select id="blast-sender" v-model="senderId" class="input" :disabled="blastStatus?.status === 'running'">
            <option v-if="connectedDevices.length === 0" value="" disabled>No devices connected</option>
            <option v-for="d in connectedDevices" :key="d.id" :value="d.id">
              {{ d.name }} — {{ d.number || d.id }}
            </option>
          </select>
        </div>

        <!-- Numbers -->
        <div class="form-group">
          <label class="form-label" for="blast-numbers">
            Recipient numbers
            <span class="form-count" v-if="parsedNumbers.length > 0">
              {{ parsedNumbers.length }} number{{ parsedNumbers.length !== 1 ? 's' : '' }}
            </span>
          </label>
          <textarea
            id="blast-numbers"
            v-model="numbers"
            class="textarea"
            placeholder="One number per line:&#10;628123456789&#10;628987654321&#10;+62 812-1111-2222"
            rows="7"
            :disabled="blastStatus?.status === 'running'"
          ></textarea>
          <span class="form-hint">Include country code. Spaces and dashes are stripped automatically.</span>
        </div>

        <!-- Message -->
        <div class="form-group">
          <label class="form-label" for="blast-message">Message</label>
          <textarea
            id="blast-message"
            v-model="message"
            class="textarea"
            placeholder="Type your blast message here…"
            rows="5"
            :disabled="blastStatus?.status === 'running'"
          ></textarea>
          <span class="form-hint" v-if="message.length > 0">{{ message.length }} characters</span>
        </div>

        <!-- Media URL & Media Type -->
        <div class="two-col">
          <div class="form-group">
            <label class="form-label" for="blast-media">Media URL <span class="form-optional">(optional)</span></label>
            <div class="url-input-wrap">
              <svg class="url-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              <input id="blast-media" v-model="mediaUrl" class="input url-input" placeholder="https://example.com/image.jpg" :disabled="blastStatus?.status === 'running'" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="blast-media-type">Media Type</label>
            <select id="blast-media-type" v-model="mediaType" class="input" :disabled="!mediaUrl || blastStatus?.status === 'running'">
              <option value="">Auto (Detect)</option>
              <option value="image">Image (Gambar)</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Document (Dokumen)</option>
            </select>
          </div>
        </div>

        <!-- Delay slider -->
        <div class="form-group delay-row">
          <label class="form-label" for="blast-delay">
            Delay between messages
            <span class="delay-badge">{{ delay }}s</span>
          </label>
          <input
            id="blast-delay"
            type="range"
            v-model.number="delay"
            min="3" max="30" step="1"
            class="range-input"
            :disabled="blastStatus?.status === 'running'"
          />
          <div class="delay-labels">
            <span>3s (faster)</span>
            <span>30s (safer)</span>
          </div>
        </div>

        <!-- Anti-ban notice -->
        <div class="anti-ban-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Anti-ban delay ({{ delay }}–{{ delay + 3 }}s random jitter) applied automatically by backend.
        </div>

        <!-- Start error -->
        <div v-if="startErr" class="api-error">{{ startErr }}</div>

        <!-- Actions -->
        <div class="form-actions">
          <button
            v-if="blastStatus?.status !== 'running'"
            class="btn btn-primary"
            @click="startBlast"
            :disabled="!isReady"
            id="btn-start-blast"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Start Blast
          </button>
          <button v-else class="btn btn-danger" @click="stopBlast" id="btn-stop-blast">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
            Stop
          </button>
          <button v-if="blastStatus && blastStatus.status !== 'running'" class="btn btn-ghost" @click="reset">Reset</button>
        </div>
      </div>
    </div>

    <!-- ── Right: progress ── -->
    <div class="blast-monitor">
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:14px">Queue Status</h3>

        <div v-if="!blastStatus" class="empty-state" style="padding:24px">
          <div class="empty-state-icon" style="font-size:1.8rem">📤</div>
          <p>No blast queued yet.</p>
        </div>

        <template v-else>
          <div class="prog-header">
            <span class="prog-label">
              <span v-if="blastStatus.status === 'running'" class="dot dot-yellow animate-pulse" style="margin-right:6px"></span>
              <span v-else-if="blastStatus.status === 'completed'" class="dot dot-green" style="margin-right:6px"></span>
              {{ blastStatus.status === 'running' ? 'Running…' : blastStatus.status === 'completed' ? 'Completed' : 'Stopped' }}
            </span>
            <span class="prog-pct">{{ progressPct }}%</span>
          </div>
          <div class="prog-bar-track">
            <div class="prog-bar-fill" :style="{ width: progressPct + '%' }"></div>
          </div>
          <div class="prog-stats">
            <div class="prog-stat"><span class="prog-stat-label">Total</span><span class="prog-stat-val">{{ blastStatus.total }}</span></div>
            <div class="prog-stat"><span class="prog-stat-label">Sent</span><span class="prog-stat-val ok">{{ blastStatus.sent }}</span></div>
            <div class="prog-stat"><span class="prog-stat-label">Failed</span><span class="prog-stat-val fail">{{ blastStatus.failed }}</span></div>
            <div class="prog-stat"><span class="prog-stat-label">Remaining</span><span class="prog-stat-val">{{ blastStatus.total - blastStatus.sent - blastStatus.failed }}</span></div>
          </div>
        </template>
      </div>

      <!-- Blast ID chip -->
      <div v-if="blastId" class="blast-id-chip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Blast ID: <code>{{ blastId }}</code>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blast-layout { display: grid; grid-template-columns: 1fr 380px; gap: 20px; align-items: start; }
.api-error { display: flex; align-items: center; gap: 8px; background: var(--clr-danger-dim); border: 1px solid rgba(239,68,68,0.2); color: var(--clr-danger); padding: 10px 12px; border-radius: var(--radius-sm); font-size: 12px; }
.no-device-warn { display: flex; align-items: center; gap: 8px; background: var(--clr-warning-dim); border: 1px solid rgba(245,158,11,0.2); color: var(--clr-warning); padding: 10px 12px; border-radius: var(--radius-sm); font-size: 12px; }
.form-count { font-weight: 600; color: var(--clr-accent); margin-left: 6px; }
.delay-row { gap: 8px; }
.delay-badge { display: inline-block; background: var(--clr-accent-dim); color: var(--clr-accent); padding: 1px 7px; border-radius: 99px; font-size: 11px; font-weight: 600; margin-left: 6px; }
.range-input { width: 100%; accent-color: var(--clr-accent); cursor: pointer; }
.delay-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--clr-text-dim); }
.anti-ban-notice { display: flex; align-items: center; gap: 8px; background: var(--clr-warning-dim); border: 1px solid rgba(245,158,11,0.2); color: var(--clr-warning); border-radius: var(--radius-sm); padding: 10px 12px; font-size: 12px; }
.form-actions { display: flex; gap: 10px; }
.prog-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.prog-label { font-size: 13px; display: flex; align-items: center; }
.prog-pct { font-size: 13px; font-weight: 600; }
.prog-bar-track { height: 5px; background: var(--clr-border); border-radius: 99px; overflow: hidden; margin-bottom: 16px; }
.prog-bar-fill { height: 100%; background: var(--clr-accent); border-radius: 99px; transition: width 0.5s ease; }
.prog-stats { display: flex; gap: 16px; }
.prog-stat { display: flex; flex-direction: column; gap: 2px; }
.prog-stat-label { font-size: 10px; color: var(--clr-text-dim); text-transform: uppercase; }
.prog-stat-val { font-size: 1.2rem; font-weight: 700; }
.prog-stat-val.ok   { color: var(--clr-accent); }
.prog-stat-val.fail { color: var(--clr-danger); }
.blast-id-chip { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--clr-text-muted); padding: 8px 12px; background: var(--clr-surface); border-radius: var(--radius-sm); border: 1px solid var(--clr-border); }
.blast-id-chip code { color: var(--clr-text); font-size: 11px; }
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

@media (max-width: 960px) {
  .blast-layout { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .two-col { grid-template-columns: 1fr; }
}
</style>
