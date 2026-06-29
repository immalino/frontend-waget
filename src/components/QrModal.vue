<script setup>
import { ref } from 'vue'

const emit = defineEmits(['close'])
const props = defineProps({ device: { type: Object, default: null } })

// Simulate a fake QR code SVG (real implementation uses SSE from backend)
const qrReady = ref(false)
const scanning = ref(false)

setTimeout(() => { qrReady.value = true }, 800)

function handleScanned() {
  scanning.value = true
  setTimeout(() => {
    emit('close')
  }, 1500)
}
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

        <p class="modal-title">
          {{ device ? `Reconnect — ${device.name}` : 'Add New Device' }}
        </p>

        <p class="qr-hint">Scan this QR code with WhatsApp on your phone.</p>

        <div class="qr-wrapper">
          <template v-if="scanning">
            <div class="qr-scanning">
              <svg class="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--clr-accent)" stroke-width="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <p style="margin-top: 12px; font-size: 13px; color: var(--clr-text-muted)">Connecting…</p>
            </div>
          </template>
          <template v-else-if="qrReady">
            <!-- Simulated QR code placeholder -->
            <div class="qr-box" @click="handleScanned" title="Click to simulate scan">
              <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Outer corners -->
                <rect x="10" y="10" width="44" height="44" rx="4" stroke="var(--clr-text)" stroke-width="6" fill="none"/>
                <rect x="20" y="20" width="24" height="24" rx="2" fill="var(--clr-text)"/>
                <rect x="106" y="10" width="44" height="44" rx="4" stroke="var(--clr-text)" stroke-width="6" fill="none"/>
                <rect x="116" y="20" width="24" height="24" rx="2" fill="var(--clr-text)"/>
                <rect x="10" y="106" width="44" height="44" rx="4" stroke="var(--clr-text)" stroke-width="6" fill="none"/>
                <rect x="20" y="116" width="24" height="24" rx="2" fill="var(--clr-text)"/>
                <!-- Data cells -->
                <rect x="62" y="10" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="76" y="10" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="62" y="24" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="76" y="38" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="62" y="52" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="90" y="62" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="10" y="62" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="24" y="62" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="38" y="62" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="52" y="62" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="62" y="62" width="8" height="8" fill="var(--clr-accent)"/>
                <rect x="76" y="62" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="104" y="62" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="118" y="62" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="132" y="62" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="146" y="62" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="62" y="76" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="90" y="76" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="76" y="90" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="62" y="90" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="118" y="90" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="132" y="90" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="146" y="90" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="62" y="104" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="90" y="104" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="104" y="104" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="62" y="118" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="76" y="118" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="90" y="118" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="118" y="118" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="62" y="132" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="104" y="132" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="132" y="132" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="146" y="132" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="62" y="146" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="76" y="146" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="90" y="146" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="118" y="146" width="8" height="8" fill="var(--clr-text)"/>
                <rect x="146" y="146" width="8" height="8" fill="var(--clr-text)"/>
              </svg>
            </div>
            <p class="qr-tip">Waiting for scan… <span class="qr-expires">Expires in 60s</span></p>
          </template>
          <template v-else>
            <div class="qr-loading">
              <div class="qr-skeleton animate-pulse"></div>
            </div>
          </template>
        </div>

        <div class="qr-steps">
          <p class="step"><span class="step-num">1</span> Open WhatsApp on your phone</p>
          <p class="step"><span class="step-num">2</span> Go to Settings → Linked Devices</p>
          <p class="step"><span class="step-num">3</span> Tap "Link a Device" and scan</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.qr-hint {
  font-size: 13px;
  color: var(--clr-text-muted);
  margin-bottom: 20px;
}

.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.qr-box {
  background: white;
  border-radius: var(--radius-md);
  padding: 12px;
  cursor: pointer;
  transition: transform 0.15s;
}
.qr-box:hover { transform: scale(1.02); }

.qr-loading { padding: 12px; }
.qr-skeleton {
  width: 184px; height: 184px;
  background: var(--clr-card);
  border-radius: var(--radius-sm);
}

.qr-scanning {
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-tip {
  margin-top: 10px;
  font-size: 12px;
  color: var(--clr-text-muted);
}
.qr-expires { color: var(--clr-warning); }

.qr-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--clr-surface);
  border-radius: var(--radius-sm);
  padding: 14px;
}
.step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--clr-text-muted);
}
.step-num {
  width: 20px; height: 20px;
  background: var(--clr-accent-dim);
  color: var(--clr-accent);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}
</style>
