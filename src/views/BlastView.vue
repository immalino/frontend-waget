<script setup>
import { ref, computed } from 'vue'

// ── Devices for sender selector ─────────────────────────────────────────────
const devices = [
  { id: 1, name: 'Primary WA', number: '+62 812-3456-7890', status: 'connected' },
  { id: 2, name: 'Support WA',  number: '+62 821-9876-5432', status: 'disconnected' },
]

// ── Form ────────────────────────────────────────────────────────────────────
const senderId  = ref('+62 812-3456-7890')
const numbers   = ref('')
const message   = ref('')
const delay     = ref(7)

// ── Queue state ─────────────────────────────────────────────────────────────
const status   = ref('idle') // idle | running | done
const progress = ref({ sent: 0, failed: 0, total: 0 })
const logs     = ref([])
let   blastTimer = null

const parsedNumbers = computed(() =>
  numbers.value
    .split('\n')
    .map(n => n.trim().replace(/\s+/g, '').replace(/[^\d+]/g, ''))
    .filter(n => n.length >= 8)
)

const isReady = computed(() =>
  parsedNumbers.value.length > 0 &&
  message.value.trim().length > 0 &&
  devices.find(d => d.number === senderId.value)?.status === 'connected'
)

function startBlast() {
  if (!isReady.value) return
  const nums = [...parsedNumbers.value]
  progress.value = { sent: 0, failed: 0, total: nums.length }
  logs.value = []
  status.value = 'running'

  let i = 0
  const randomDelay = () => (delay.value * 1000) + (Math.random() * 3000)

  function sendNext() {
    if (i >= nums.length) {
      status.value = 'done'
      return
    }
    const num = nums[i++]
    const success = Math.random() > 0.1 // 90% mock success
    setTimeout(() => {
      if (success) {
        progress.value.sent++
        logs.value.unshift({ num, ok: true,  time: new Date().toLocaleTimeString() })
      } else {
        progress.value.failed++
        logs.value.unshift({ num, ok: false, time: new Date().toLocaleTimeString() })
      }
      sendNext()
    }, randomDelay())
  }

  sendNext()
}

function stopBlast() {
  clearTimeout(blastTimer)
  status.value = 'idle'
}

function reset() {
  status.value = 'idle'
  progress.value = { sent: 0, failed: 0, total: 0 }
  logs.value = []
}

const progressPct = computed(() =>
  progress.value.total
    ? Math.round(((progress.value.sent + progress.value.failed) / progress.value.total) * 100)
    : 0
)
</script>

<template>
  <div class="animate-fadeIn blast-layout">
    <!-- ── Left: form ── -->
    <div class="blast-form">
      <div class="card" style="display:flex; flex-direction:column; gap:20px;">
        <!-- Sender -->
        <div class="form-group">
          <label class="form-label" for="blast-sender">Send from</label>
          <select id="blast-sender" v-model="senderId" class="input">
            <option v-for="d in devices" :key="d.id" :value="d.number" :disabled="d.status !== 'connected'">
              {{ d.name }} — {{ d.number }}{{ d.status !== 'connected' ? ' (offline)' : '' }}
            </option>
          </select>
        </div>

        <!-- Numbers -->
        <div class="form-group">
          <label class="form-label" for="blast-numbers">
            Recipient numbers
            <span class="form-count" v-if="parsedNumbers.length > 0">{{ parsedNumbers.length }} number{{ parsedNumbers.length !== 1 ? 's' : '' }}</span>
          </label>
          <textarea
            id="blast-numbers"
            v-model="numbers"
            class="textarea"
            placeholder="One number per line:&#10;628123456789&#10;628987654321&#10;+62 812-1111-2222"
            rows="7"
            :disabled="status === 'running'"
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
            :disabled="status === 'running'"
          ></textarea>
          <span class="form-hint" v-if="message.length > 0">{{ message.length }} characters</span>
        </div>

        <!-- Delay -->
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
            :disabled="status === 'running'"
          />
          <div class="delay-labels">
            <span>3s (faster)</span>
            <span>30s (safer)</span>
          </div>
        </div>

        <!-- Warning -->
        <div class="anti-ban-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Anti-ban delay ({{ delay }}–{{ delay + 3 }}s random jitter) applied automatically.
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button
            v-if="status !== 'running'"
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
          <button v-if="status === 'done'" class="btn btn-ghost" @click="reset">Reset</button>
        </div>
      </div>
    </div>

    <!-- ── Right: progress & logs ── -->
    <div class="blast-monitor">
      <!-- Progress -->
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:14px">Queue Status</h3>

        <div v-if="status === 'idle' && progress.total === 0" class="empty-state" style="padding:24px">
          <div class="empty-state-icon" style="font-size:1.8rem">📤</div>
          <p>No blast queued yet.</p>
        </div>

        <template v-else>
          <!-- Progress bar -->
          <div class="prog-header">
            <span class="prog-label">
              <span v-if="status === 'running'" class="dot dot-yellow animate-pulse" style="margin-right:6px"></span>
              <span v-else-if="status === 'done'" class="dot dot-green" style="margin-right:6px"></span>
              {{ status === 'running' ? 'Running…' : status === 'done' ? 'Completed' : 'Stopped' }}
            </span>
            <span class="prog-pct">{{ progressPct }}%</span>
          </div>
          <div class="prog-bar-track">
            <div class="prog-bar-fill" :style="{ width: progressPct + '%' }"></div>
          </div>

          <!-- Stats row -->
          <div class="prog-stats">
            <div class="prog-stat">
              <span class="prog-stat-label">Total</span>
              <span class="prog-stat-val">{{ progress.total }}</span>
            </div>
            <div class="prog-stat">
              <span class="prog-stat-label">Sent</span>
              <span class="prog-stat-val ok">{{ progress.sent }}</span>
            </div>
            <div class="prog-stat">
              <span class="prog-stat-label">Failed</span>
              <span class="prog-stat-val fail">{{ progress.failed }}</span>
            </div>
            <div class="prog-stat">
              <span class="prog-stat-label">Remaining</span>
              <span class="prog-stat-val">{{ progress.total - progress.sent - progress.failed }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Logs -->
      <div class="card log-card">
        <h3 style="margin-bottom:12px">Activity Log</h3>
        <div v-if="logs.length === 0" class="empty-state" style="padding:20px">
          <p style="font-size:12px">Logs will appear here when blast starts.</p>
        </div>
        <div v-else class="log-list">
          <div v-for="(log, i) in logs.slice(0, 50)" :key="i" class="log-row" :class="log.ok ? 'log-ok' : 'log-fail'">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-num">{{ log.num }}</span>
            <span class="log-status">{{ log.ok ? '✓ Sent' : '✗ Failed' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ── */
.blast-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  align-items: start;
}

/* ── Form ── */
.form-count {
  font-weight: 600;
  color: var(--clr-accent);
  margin-left: 6px;
}

.delay-row { gap: 8px; }
.delay-badge {
  display: inline-block;
  background: var(--clr-accent-dim);
  color: var(--clr-accent);
  padding: 1px 7px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 6px;
}
.range-input {
  width: 100%;
  accent-color: var(--clr-accent);
  cursor: pointer;
}
.delay-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--clr-text-dim);
}

.anti-ban-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--clr-warning-dim);
  border: 1px solid rgba(245,158,11,0.2);
  color: var(--clr-warning);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 12px;
}

.form-actions { display: flex; gap: 10px; }

/* ── Progress ── */
.prog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.prog-label { font-size: 13px; display: flex; align-items: center; }
.prog-pct { font-size: 13px; font-weight: 600; }

.prog-bar-track {
  height: 5px;
  background: var(--clr-border);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 16px;
}
.prog-bar-fill {
  height: 100%;
  background: var(--clr-accent);
  border-radius: 99px;
  transition: width 0.5s ease;
}

.prog-stats {
  display: flex;
  gap: 16px;
}
.prog-stat { display: flex; flex-direction: column; gap: 2px; }
.prog-stat-label { font-size: 10px; color: var(--clr-text-dim); text-transform: uppercase; }
.prog-stat-val { font-size: 1.2rem; font-weight: 700; }
.prog-stat-val.ok   { color: var(--clr-accent); }
.prog-stat-val.fail { color: var(--clr-danger); }

/* ── Logs ── */
.log-card { padding: 16px; }
.log-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 340px;
  overflow-y: auto;
  border: 1px solid var(--clr-border);
  border-radius: var(--radius-sm);
}
.log-row {
  display: grid;
  grid-template-columns: 68px 1fr 60px;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-bottom: 1px solid var(--clr-border);
  font-size: 12px;
}
.log-row:last-child { border-bottom: none; }
.log-ok   { color: var(--clr-text); }
.log-fail { color: var(--clr-danger); }
.log-time { color: var(--clr-text-muted); font-size: 11px; }
.log-num  { font-family: monospace; }
.log-status { text-align: right; font-weight: 500; }

/* ── Responsive ── */
@media (max-width: 960px) {
  .blast-layout {
    grid-template-columns: 1fr;
  }
}
</style>
