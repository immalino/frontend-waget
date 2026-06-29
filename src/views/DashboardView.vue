<script setup>
import { ref, computed } from 'vue'
import QrModal from '../components/QrModal.vue'

// ── Mock data (replace with real API calls later) ──────────────────────────
const devices = ref([
  {
    id: 1,
    name: 'Primary WA',
    number: '+62 812-3456-7890',
    status: 'connected',
    lastSeen: 'Just now',
    messagesOut: 142,
    messagesIn: 89,
  },
  {
    id: 2,
    name: 'Support WA',
    number: '+62 821-9876-5432',
    status: 'disconnected',
    lastSeen: '2 hours ago',
    messagesOut: 0,
    messagesIn: 0,
  },
  {
    id: 3,
    name: 'Marketing WA',
    number: 'Not linked',
    status: 'pending',
    lastSeen: '—',
    messagesOut: 0,
    messagesIn: 0,
  },
])

const showQr = ref(false)
const qrTarget = ref(null)

function openAddDevice() {
  qrTarget.value = null
  showQr.value = true
}

function openReconnect(device) {
  qrTarget.value = device
  showQr.value = true
}

function disconnectDevice(device) {
  device.status = 'disconnected'
}

const connectedCount = computed(() => devices.value.filter(d => d.status === 'connected').length)
const totalMessages  = computed(() => devices.value.reduce((s, d) => s + d.messagesOut, 0))

function statusBadge(status) {
  if (status === 'connected')    return { cls: 'badge-green',  dot: 'dot-green',  label: 'Connected' }
  if (status === 'disconnected') return { cls: 'badge-red',    dot: 'dot-red',    label: 'Disconnected' }
  return                                { cls: 'badge-yellow', dot: 'dot-yellow', label: 'Pending QR' }
}
</script>

<template>
  <div class="animate-fadeIn">
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
        <p class="stat-label">Messages Sent Today</p>
        <p class="stat-value">{{ totalMessages }}</p>
      </div>
    </div>

    <!-- ── Devices section ── -->
    <div class="section-header">
      <h2 class="section-title">Devices</h2>
      <button class="btn btn-primary btn-sm" @click="openAddDevice" id="btn-add-device">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Device
      </button>
    </div>

    <!-- Desktop table -->
    <div class="card device-table-wrap hide-mobile-block">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Number</th>
            <th>Status</th>
            <th>Last Seen</th>
            <th>Sent</th>
            <th>Received</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="device in devices" :key="device.id">
            <td><span class="device-name">{{ device.name }}</span></td>
            <td><span class="device-number">{{ device.number }}</span></td>
            <td>
              <span class="badge" :class="statusBadge(device.status).cls">
                <span class="dot" :class="statusBadge(device.status).dot"></span>
                {{ statusBadge(device.status).label }}
              </span>
            </td>
            <td style="color: var(--clr-text-muted)">{{ device.lastSeen }}</td>
            <td>{{ device.messagesOut }}</td>
            <td>{{ device.messagesIn }}</td>
            <td>
              <div class="action-row">
                <button
                  v-if="device.status !== 'connected'"
                  class="btn btn-ghost btn-sm"
                  @click="openReconnect(device)"
                  :id="`btn-reconnect-${device.id}`"
                >
                  Scan QR
                </button>
                <button
                  v-else
                  class="btn btn-danger btn-sm"
                  @click="disconnectDevice(device)"
                  :id="`btn-disconnect-${device.id}`"
                >
                  Disconnect
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="device-cards show-mobile">
      <div class="card device-card" v-for="device in devices" :key="'m-' + device.id">
        <div class="device-card-top">
          <div>
            <p class="device-name">{{ device.name }}</p>
            <p class="device-number-muted">{{ device.number }}</p>
          </div>
          <span class="badge" :class="statusBadge(device.status).cls">
            <span class="dot" :class="statusBadge(device.status).dot"></span>
            {{ statusBadge(device.status).label }}
          </span>
        </div>
        <div class="device-card-stats">
          <div class="mini-stat">
            <span class="mini-stat-label">Sent</span>
            <span class="mini-stat-val">{{ device.messagesOut }}</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat-label">Received</span>
            <span class="mini-stat-val">{{ device.messagesIn }}</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat-label">Last Seen</span>
            <span class="mini-stat-val">{{ device.lastSeen }}</span>
          </div>
        </div>
        <div class="device-card-actions">
          <button v-if="device.status !== 'connected'" class="btn btn-ghost btn-sm" @click="openReconnect(device)">Scan QR</button>
          <button v-else class="btn btn-danger btn-sm" @click="disconnectDevice(device)">Disconnect</button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="devices.length === 0" class="card empty-state">
      <div class="empty-state-icon">📱</div>
      <h3>No devices yet</h3>
      <p>Add your first WhatsApp account to get started.</p>
      <button class="btn btn-primary" style="margin-top:16px" @click="openAddDevice">Add Device</button>
    </div>

    <!-- QR Modal -->
    <QrModal v-if="showQr" :device="qrTarget" @close="showQr = false" />
  </div>
</template>

<style scoped>
/* ── Stats ── */
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

/* ── Section header ── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.section-title { font-size: 1rem; font-weight: 600; }

/* ── Table wrap ── */
.device-table-wrap { overflow-x: auto; padding: 0; }
.device-name { font-weight: 500; }
.device-number { color: var(--clr-text-muted); font-size: 12px; }
.action-row { display: flex; justify-content: flex-end; gap: 8px; }

/* ── Mobile cards ── */
.device-cards { display: none; flex-direction: column; gap: 12px; }
.device-card { display: flex; flex-direction: column; gap: 14px; }
.device-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.device-number-muted { font-size: 12px; color: var(--clr-text-muted); margin-top: 2px; }
.device-card-stats { display: flex; gap: 20px; }
.mini-stat { display: flex; flex-direction: column; gap: 2px; }
.mini-stat-label { font-size: 10px; color: var(--clr-text-dim); text-transform: uppercase; }
.mini-stat-val { font-size: 13px; font-weight: 600; }
.device-card-actions { display: flex; gap: 8px; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
  .stats-row .stat-card:last-child { grid-column: 1 / -1; }
  .hide-mobile-block { display: none !important; }
  .device-cards { display: flex !important; }
}
</style>
