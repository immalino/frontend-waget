// Real auth store — integrates with backend /api/auth/* endpoints
import { ref, computed } from 'vue'

const TOKEN_KEY = 'wa_token'
const USER_KEY  = 'wa_user'

const _token = ref(localStorage.getItem(TOKEN_KEY) || null)
const _user  = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))

export const user     = computed(() => _user.value)
export const isAuthed = computed(() => !!_token.value && !!_user.value)
export const token    = computed(() => _token.value)

function getApiBase() {
  return localStorage.getItem('wa_api_url') || 'http://localhost:3000'
}

export async function login(email, password) {
  const res = await fetch(`${getApiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Login failed')
  }

  // Persist token + user
  _token.value = data.token
  _user.value  = data.user

  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(data.user))

  // Also persist refresh token for later silent refresh
  if (data.refresh_token) {
    localStorage.setItem('wa_refresh_token', data.refresh_token)
  }
  if (data.expires_at) {
    localStorage.setItem('wa_token_exp', String(data.expires_at))
  }
}

export async function logout() {
  // Notify backend to revoke session (best-effort)
  if (_token.value) {
    fetch(`${getApiBase()}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${_token.value}` },
    }).catch(() => null)
  }

  _token.value = null
  _user.value  = null

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem('wa_refresh_token')
  localStorage.removeItem('wa_token_exp')
}

export function updateUser(patch) {
  _user.value = { ..._user.value, ...patch }
  localStorage.setItem(USER_KEY, JSON.stringify(_user.value))
}

/**
 * Returns true if the stored token has expired (based on expires_at timestamp).
 * Supabase JWTs expire after 1 hour by default.
 */
export function isTokenExpired() {
  const exp = localStorage.getItem('wa_token_exp')
  if (!exp) return false
  // expires_at is a Unix timestamp (seconds)
  return Date.now() / 1000 > Number(exp) - 60 // treat as expired 60s early
}
