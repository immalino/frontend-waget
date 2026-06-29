// Simple reactive auth store (no Pinia needed for MVP)
import { ref, computed } from 'vue'

const _user = ref(JSON.parse(localStorage.getItem('wa_user') || 'null'))

export const user     = computed(() => _user.value)
export const isAuthed = computed(() => !!_user.value)

export function login(email, password) {
  // Mock auth — replace with real API call later
  if (password.length < 4) throw new Error('Invalid credentials')
  const u = { email, name: email.split('@')[0], avatar: email[0].toUpperCase() }
  _user.value = u
  localStorage.setItem('wa_user', JSON.stringify(u))
}

export function logout() {
  _user.value = null
  localStorage.removeItem('wa_user')
}

export function updateUser(patch) {
  _user.value = { ..._user.value, ...patch }
  localStorage.setItem('wa_user', JSON.stringify(_user.value))
}
