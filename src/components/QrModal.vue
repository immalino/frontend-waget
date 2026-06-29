<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { devicesApi, type Device } from '../api/client'

const props = defineProps<{ device: Device | null }>()
const emit  = defineEmits<{
  (e: 'close'): void
  (e: 'added', device: Device): void
}>()

// ── Add-device form (only when device is null) ────────────────────────────
const newId   = ref('')
const newName = ref('')
const adding  = ref(false)
const addErr  = ref('')

async function submitAddDevice() {
  addErr.value = ''
  if (!newId.value || !newName.value) { addErr.value = 'Both fields are required.'; return }
  if (!/^[a-z0-9-]+$/.test(newId.value)) { addErr.value = 'ID: lowercase letters, numbers, hyphens only.'; return }
  adding.value = true
  try {
    await devicesApi.create(newId.value, newName.value)
    // Start listening for QR from the new device
    connectingDeviceId.value = newId.value
    startSseStream(newId.value)
  } catch (e) {
    addErr.value = (e as Error).message
    adding.value = false
  }
}

// ── SSE QR stream ─────────────────────────────────────────────────────────
const connectingDeviceId = ref<string | null>(props.device?.id || null)
const qrDataUri  = ref<string | null>(null)
const sseStatus  = ref<'waiting' | 'streaming' | 'connected' | 'error'>('waiting')
const sseError   = ref('')
let   es: EventSource | null = null

function startSseStream(deviceId: string) {
  sseStatus.value = 'streaming'
  es?.close()
  es = new EventSource(devicesApi.qrUrl(deviceId))

  es.addEventListener('qr', (e) => {
    const data = JSON.parse(e.data)
    qrDataUri.value = data.qr
  })

  es.addEventListener('status', (e) => {
    const data = JSON.parse(e.data)
    if (data.status === 'connected') {
      sseStatus.value = 'connected'
      es?.close()
      setTimeout(() => emit('close'), 1500)
    }
  })

  es.onerror = () => {
    sseStatus.value = 'error'
    sseError.value  = 'Lost connection to backend. Check that the server is running.'
    es?.close()
  }
}

// If reconnecting an existing device, start streaming immediately
if (props.device) {
  startSseStream(props.device.id)
}

onUnmounted(() => { es?.close() })
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay animate-fadeIn" @click.self="$emit('close')">
      <div class="modal">
        <button class="modal-close" @click="$emit('close')" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <!-- ── Step 1: Add device form (new device only) ── -->
        <template v-if="!device && !connectingDeviceId">
          <p class="modal-title">Add New Device</p>

          <div v-if="addErr" class="add-error">{{ addErr }}</div>

          <div style="display:flex; flex-direction:column; gap:14px">
            <div class="form-group">
              <label class="form-label" for="qr-device-id">Device ID</label>
              <input id="qr-device-id" v-model="newId" class="input" placeholder="e.g. primary-wa" :disabled="adding" />
              <span class="form-hint">Lowercase letters, numbers and hyphens. Cannot be changed.</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="qr-device-name">Display name</label>
              <input id="qr-device-name" v-model="newName" class="input" placeholder="e.g. Primary WA" :disabled="adding" />
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px">
            <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
            <button class="btn btn-primary" @click="submitAddDevice" :disabled="adding" id="btn-submit-add-device">
              <svg v-if="adding" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/>
              </svg>
              {{ adding ? 'Creating…' : 'Continue' }}
            </button>
          </div>
        </template>

        <!-- ── Step 2: QR Code stream ── -->
        <template v-else>
          <p class="modal-title">
            {{ device ? `Reconnect — ${device.name}` : `Connect — ${connectingDeviceId}` }}
          </p>
          <p class="qr-hint">Scan this QR code with WhatsApp on your phone.</p>

          <!-- Connected! -->
          <div v-if="sseStatus === 'connected'" class="qr-connected">
            <div class="qr-check">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--clr-accent)" stroke-width="2.5" stroke-linecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p style="margin-top:10px; font-weight:600; color:var(--clr-accent)">Connected!</p>
            <p style="font-size:12px; color:var(--clr-text-muted); margin-top:4px">Closing…</p>
          </div>

          <!-- Error -->
          <div v-else-if="sseStatus === 'error'" class="qr-error-state">
            <p>{{ sseError }}</p>
            <button class="btn btn-ghost btn-sm" style="margin-top:12px"
              @click="startSseStream(connectingDeviceId || device!.id)">Retry</button>
          </div>

          <!-- Loading / waiting for QR -->
          <div v-else-if="!qrDataUri" class="qr-wrapper">
            <div class="qr-loading">
              <div class="qr-skeleton animate-pulse"></div>
            </div>
            <p class="qr-tip">Generating QR code…</p>
          </div>

          <!-- QR ready -->
          <div v-else class="qr-wrapper">
            <div class="qr-box">
              <img :src="qrDataUri" width="200" height="200" alt="WhatsApp QR Code" />
            </div>
            <p class="qr-tip">Waiting for scan… <span class="qr-expires">Expires in 60s</span></p>
          </div>

          <!-- Steps -->
          <div v-if="sseStatus !== 'connected'" class="qr-steps">
            <p class="step"><span class="step-num">1</span> Open WhatsApp on your phone</p>
            <p class="step"><span class="step-num">2</span> Go to Settings → Linked Devices</p>
            <p class="step"><span class="step-num">3</span> Tap "Link a Device" and scan</p>
          </div>
        </template>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.qr-hint { font-size: 13px; color: var(--clr-text-muted); margin-bottom: 20px; }
.qr-wrapper { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }

.qr-box {
  background: white;
  border-radius: var(--radius-md);
  padding: 12px;
  line-height: 0;
}
.qr-loading { padding: 12px; }
.qr-skeleton {
  width: 200px; height: 200px;
  background: var(--clr-surface);
  border-radius: var(--radius-sm);
}

.qr-connected {
  text-align: center;
  padding: 40px 24px;
}
.qr-check {
  width: 60px; height: 60px;
  background: var(--clr-accent-dim);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto;
}

.qr-error-state {
  text-align: center;
  color: var(--clr-danger);
  font-size: 13px;
  padding: 20px;
  background: var(--clr-danger-dim);
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
}

.qr-tip { margin-top: 10px; font-size: 12px; color: var(--clr-text-muted); }
.qr-expires { color: var(--clr-warning); }

.qr-steps {
  display: flex; flex-direction: column; gap: 8px;
  background: var(--clr-surface);
  border-radius: var(--radius-sm);
  padding: 14px;
}
.step { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--clr-text-muted); }
.step-num {
  width: 20px; height: 20px;
  background: var(--clr-accent-dim); color: var(--clr-accent);
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}

.add-error {
  background: var(--clr-danger-dim);
  border: 1px solid rgba(239,68,68,0.2);
  color: var(--clr-danger);
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  margin-bottom: 14px;
}
</style>
