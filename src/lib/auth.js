/**
 * Modul Manajemen Autentikasi Pengguna & Sesi K3
 * Berkomunikasi dengan Endpoint Backend Laravel (POST /api/login, GET /api/me, POST /api/logout)
 */

import {
  authToken,
  currentUser,
  setSession,
  clearSession,
  SEED_ACCOUNTS,
  TOKEN_KEY,
  USER_KEY,
  isAuthenticated,
  userRole,
  isOperator,
  isKepalaBalai,
  isAdmin,
  userWilayahId,
} from './session'
import { apiLogin, apiGetMe } from './api'

export {
  authToken,
  currentUser,
  setSession,
  clearSession,
  SEED_ACCOUNTS,
  isAuthenticated,
  userRole,
  isOperator,
  isKepalaBalai,
  isAdmin,
  userWilayahId,
}

// Berpindah akun seeder dan login langsung ke Backend Laravel
export async function switchAccount(email, kata_sandi = 'password') {
  return await apiLogin(email, kata_sandi)
}

// Inisialisasi status autentikasi backend saat aplikasi pertama kali dimuat
export async function initAuth() {
  const token = localStorage.getItem(TOKEN_KEY)

  // Jika belum ada token atau token mock lama
  if (!token || token.startsWith('mock_token_') || token.startsWith('token_seeder_')) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    authToken.value = null

    // Lakukan login default ke backend dengan akun seeder Operator BJM
    try {
      await apiLogin('operator.bjm@k3.local', 'password')
    } catch (e) {
      console.warn('Auto-login backend ditangguhkan (server backend belum aktif):', e.message)
      currentUser.value = SEED_ACCOUNTS[0]
    }
    return
  }

  // Jika token tersimpan ada, verifikasi ke backend
  try {
    await apiGetMe()
  } catch (e) {
    if (e.status === 401) {
      console.warn('Token sesi tidak lagi valid pada backend, mencoba login ulang...')
      try {
        const targetEmail = currentUser.value?.email || 'operator.bjm@k3.local'
        await apiLogin(targetEmail, 'password')
      } catch (err) {
        console.warn('Gagal login ulang ke backend:', err.message)
      }
    }
  }
}
