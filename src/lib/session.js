import { ref, computed } from 'vue'

export const TOKEN_KEY = 'k3_auth_token'
export const USER_KEY = 'k3_auth_user'

function loadSavedAuth() {
  const token = localStorage.getItem(TOKEN_KEY)
  const userJson = localStorage.getItem(USER_KEY)

  // Bersihkan token lama agar tidak terkirim ke backend
  if (token && (token.startsWith('mock_token_') || token.startsWith('token_seeder_'))) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return { token: null, user: null }
  }

  if (token && userJson) {
    try {
      const parsed = JSON.parse(userJson)
      // Pastikan sesuai skema baru tabel pengguna (punya username)
      if (parsed && parsed.username) {
        return { token, user: parsed }
      }
    } catch (e) {
      console.error(e)
    }
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
  return { token: null, user: null }
}

const initial = loadSavedAuth()
export const authToken = ref(initial.token)
export const currentUser = ref(initial.user || null)

export const isAuthenticated = computed(() => !!authToken.value && !!currentUser.value)

export function setSession(token, user) {
  authToken.value = token
  currentUser.value = user
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

export function clearSession() {
  setSession(null, null)
}
