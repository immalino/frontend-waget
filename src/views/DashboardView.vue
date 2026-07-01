<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import QrModal from '../components/QrModal.vue'
import { devicesApi, type Device } from '../api/client'

// ── State ──────────────────────────────────────────────────────────────────
const devices  = ref<Device[]>([])
const loading  = ref(true)
const error    = ref('')

const showQr    = ref(false)
const qrTarget  = ref<Device | null>(null)

// ── Data fetching ──────────────────────────────────────────────────────────
async function fetchDevices() {
  try {
    devices.value = await devicesApi.list()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

onMounted(fetchDevices)

// ── Actions ────────────────────────────────────────────────────────────────
function openAddDevice() {
  qrTarget.value = null
  showQr.value   = true
}

function openReconnect(device: Device) {
  qrTarget.value = device
  showQr.value   = true
}

async function disconnectDevice(device: Device) {
  try {
    await devicesApi.disconnect(device.id)
    device.status = 'disconnected'
  } catch (e) {
    alert((e as Error).message)
  }
}

async function deleteDevice(device: Device) {
  if (!confirm(`Remove "${device.name}" completely? This will delete all session files.`)) return
  try {
    await devicesApi.delete(device.id)
    devices.value = devices.value.filter(d => d.id !== device.id)
  } catch (e) {
    alert((e as Error).message)
  }
}

function onDeviceAdded(device: Device) {
  devices.value.push(device)
  showQr.value = true
}

// ── Computed stats ─────────────────────────────────────────────────────────
const connectedCount = computed(() => devices.value.filter(d => d.status === 'connected').length)

function statusBadge(status: string) {
  if (status === 'connected')    return { cls: 'badge-green',  dot: 'dot-green',  label: 'Connected' }
  if (status === 'disconnected') return { cls: 'badge-red',    dot: 'dot-red',    label: 'Disconnected' }
  if (status === 'connecting')   return { cls: 'badge-yellow', dot: 'dot-yellow', label: 'Connecting…' }
  return                                { cls: 'badge-yellow', dot: 'dot-yellow', label: 'Pending QR' }
}

function formatLastSeen(ts: string | null) {
  if (!ts) return '—'
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return d.toLocaleDateString()
}
</script>

<template>
  <div class="animate-fadeIn">

    <!-- Error banner -->
    <div v-if="error" class="api-error">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      Cannot reach backend: {{ error }}
      <button class="btn btn-ghost btn-sm" style="margin-left:auto" @click="fetchDevices">Retry</button>
    </div>

    <!-- ── Stat cards ── -->
    <div class="stats-row">
      <div class="stat-card card">
        <p class="stat-label">Total Devices</p>
        <p class="stat-value">{{ devices.length }}</p>
      </div>
      <div class="stat-card card">
        <p class="stat-label">Connected</p>
        <p class="stat-value accent">{{ connectedCount }}</p>
      </div>
      <div class="stat-card card">
        <p class="stat-label">Offline</p>
        <p class="stat-value">{{ devices.length - connectedCount }}</p>
      </div>
    </div>

    <!-- ── Header ── -->
    <div class="section-header">
      <h2 class="section-title">Devices</h2>
      <div style="display:flex; gap:8px">
        <button class="btn btn-ghost btn-sm" @click="fetchDevices" :disabled="loading" title="Refresh">
          <svg :class="loading ? 'animate-spin' : ''" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
        <button class="btn btn-primary btn-sm" @click="openAddDevice" id="btn-add-device">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Device
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
       <div v-if="loading" class="card loading-card">
      <svg class="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83"/>
      </svg>
      <span>Loading devices…</span>
    </div>

    <!-- Desktop table -->
    <div v-else-if="devices.length > 0" class="card device-table-wrap hide-mobile-block">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Number</th>
            <th>Status</th>
            <th>Last Seen</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="device in devices" :key="device.id">
            <td><span class="device-name">{{ device.name }}</span><br/><span class="device-id">{{ device.id }}</span></td>
            <td><span class="device-number">{{ device.number || '—' }}</span></td>
            <td>
              <span class="badge" :class="statusBadge(device.status).cls">
                <span class="dot" :class="statusBadge(device.status).dot"></span>
                {{ statusBadge(device.status).label }}
              </span>
            </td>
            <td style="color:var(--clr-text-muted)">{{ formatLastSeen(device.last_seen) }}</td>
            <td>
              <div class="action-row">
                <button v-if="device.status !== 'connected'" class="btn btn-ghost btn-sm" @click="openReconnect(device)" :id="`btn-reconnect-${device.id}`">Scan QR</button>
                <button v-else class="btn btn-danger btn-sm" @click="disconnectDevice(device)" :id="`btn-disconnect-${device.id}`">Disconnect</button>
                <button class="btn btn-ghost btn-sm btn-icon" @click="deleteDevice(device)" title="Remove device" style="color:var(--clr-danger)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div v-else-if="devices.length > 0" class="device-cards show-mobile">
      <div class="card device-card" v-for="device in devices" :key="'m-' + device.id">
        <div class="device-card-top">
          <div>
            <p class="device-name">{{ device.name }}</p>
            <p class="device-number-muted">{{ device.number || device.id }}</p>
          </div>
          <span class="badge" :class="statusBadge(device.status).cls">
            <span class="dot" :class="statusBadge(device.status).dot"></span>
            {{ statusBadge(device.status).label }}
          </span>
        </div>
        <div class="device-card-actions">
          <button v-if="device.status !== 'connected'" class="btn btn-ghost btn-sm" @click="openReconnect(device)">Scan QR</button>
          <button v-else class="btn btn-danger btn-sm" @click="disconnectDevice(device)">Disconnect</button>
          <button class="btn btn-ghost btn-sm" @click="deleteDevice(device)" style="color:var(--clr-danger)">Remove</button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && !error" class="card empty-state">
      <div class="empty-state-icon">📱</div>
      <h3>No devices yet</h3>
      <p>Add your first WhatsApp account to get started.</p>
      <button class="btn btn-primary" style="margin-top:16px" @click="openAddDevice">Add Device</button>
    </div>

    <!-- QR Modal -->
    <QrModal
      v-if="showQr"
      :device="qrTarget"
      @close="showQr = false; fetchDevices()"
      @added="onDeviceAdded"
    />
  </div>
</template>

<style scoped>
.api-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--clr-danger-dim);
  border: 1px solid rgba(239,68,68,0.2);
  color: var(--clr-danger);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  margin-bottom: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}
.stat-card { text-align: center; }
.stat-label { font-size: 11px; color: var(--clr-text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
.stat-value { font-size: 2rem; font-weight: 700; }
.stat-value.accent { color: var(--clr-accent); }

.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.section-title { font-size: 1rem; font-weight: 600; }

.device-table-wrap { overflow-x: auto; padding: 0; }
.device-name { font-weight: 500; }
.device-id   { font-size: 11px; color: var(--clr-text-dim); font-family: monospace; }
.device-number { color: var(--clr-text-muted); font-size: 12px; }
.action-row { display: flex; justify-content: flex-end; gap: 6px; }

.device-cards { display: none; flex-direction: column; gap: 12px; }
.device-card { display: flex; flex-direction: column; gap: 14px; }
.device-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.device-number-muted { font-size: 12px; color: var(--clr-text-muted); margin-top: 2px; }
.device-card-actions { display: flex; gap: 8px; }

@media (max-width: 768px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
  .stats-row .stat-card:last-child { grid-column: 1 / -1; }
  .hide-mobile-block { display: none !important; }
  .device-cards { display: flex !important; }
}
</style>
