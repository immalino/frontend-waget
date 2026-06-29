// Central API client — reads base URL from localStorage (set in Settings page)
// Automatically attaches Authorization header from stored JWT token.

function getBase(): string {
  return localStorage.getItem('wa_api_url') || 'http://localhost:3000'
}

function getToken(): string | null {
  return localStorage.getItem('wa_token')
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${getBase()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))

    // If 401, clear auth state so router guard redirects to /login
    if (res.status === 401) {
      localStorage.removeItem('wa_token')
      localStorage.removeItem('wa_user')
      localStorage.removeItem('wa_refresh_token')
      localStorage.removeItem('wa_token_exp')
      window.location.href = '/login'
    }

    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ── Devices ──────────────────────────────────────────────────────────────────

export interface Device {
  id: string
  name: string
  number: string | null
  status: 'pending' | 'connecting' | 'connected' | 'disconnected'
  last_seen: string | null
  created_at: string
}

export const devicesApi = {
  list: ()                             => request<Device[]>('GET', '/api/devices'),
  create: (id: string, name: string)  => request<{ ok: boolean; id: string }>('POST', '/api/devices', { id, name }),
  delete: (id: string)                 => request<{ ok: boolean }>('DELETE', `/api/devices/${id}`),
  disconnect: (id: string)             => request<{ ok: boolean }>('POST', `/api/devices/${id}/disconnect`),
  reconnect: (id: string)              => request<{ ok: boolean }>('POST', `/api/devices/${id}/reconnect`),
  qrUrl: (id: string)                  => `${getBase()}/api/devices/${id}/qr?token=${getToken() ?? ''}`,
}

// ── Auto-Reply Rules ──────────────────────────────────────────────────────────

export interface AutoReplyRule {
  id: number
  keyword: string
  response: string
  sender_id: string
  enabled: boolean
  created_at: string
}

export const autoReplyApi = {
  list:   ()          => request<AutoReplyRule[]>('GET', '/api/auto-reply'),
  create: (data: Omit<AutoReplyRule, 'id' | 'created_at'>) =>
    request<AutoReplyRule>('POST', '/api/auto-reply', data),
  update: (id: number, data: Partial<Omit<AutoReplyRule, 'id' | 'created_at'>>) =>
    request<AutoReplyRule>('PUT', `/api/auto-reply/${id}`, data),
  delete: (id: number) => request<{ ok: boolean }>('DELETE', `/api/auto-reply/${id}`),
}

// ── Blast ─────────────────────────────────────────────────────────────────────

export interface BlastStatus {
  id: string
  deviceId: string
  status: 'running' | 'completed' | 'stopped'
  sent: number
  failed: number
  total: number
}

export const blastApi = {
  start: (deviceId: string, numbers: string[], message: string, delay: number) =>
    request<{ ok: boolean; blastId: string }>('POST', '/api/blast', { deviceId, numbers, message, delay }),
  status: (blastId: string) => request<BlastStatus>('GET', `/api/blast/${blastId}/status`),
  stop:   (blastId: string) => request<{ ok: boolean }>('DELETE', `/api/blast/${blastId}`),
}

// ── Messaging ─────────────────────────────────────────────────────────────────

export const messagingApi = {
  send: (deviceId: string, to: string, message: string) =>
    request<{ ok: boolean; to: string }>('POST', '/api/send-message', { deviceId, to, message }),
}

// ── Health ────────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => request<{ ok: boolean; uptime: number; sessions: number; connected: number }>('GET', '/api/health'),
}

// ── Auth Settings ─────────────────────────────────────────────────────────────

export const authSettingsApi = {
  updateProfile: (name: string, email?: string) =>
    request<{ ok: boolean; user: { id: string; email: string; name: string } }>('PUT', '/api/auth/profile', { name, email }),
  updatePassword: (password: string) =>
    request<{ ok: boolean }>('PUT', '/api/auth/password', { password }),
}

