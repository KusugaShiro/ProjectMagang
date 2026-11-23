/**
 * Modul Manajemen Autentikasi Pengguna & Sesi K3
 * Selaras dengan tabel `pengguna` (id_pengguna, username, password)
 * Endpoint: POST /api/login, GET /api/me, POST /api/logout
 */

import {
  authToken,
  currentUser,
  setSession,
  clearSession,
  TOKEN_KEY,
  USER_KEY,
  isAuthenticated,
} from './session'
import { apiLogin, apiGetMe, apiLogout } from './api'

export {
  authToken,
  currentUser,
  setSession,
  clearSession,
  TOKEN_KEY,
  USER_KEY,
  isAuthenticated,
}

// Login menggunakan username & password sesuai skema tabel `pengguna`
export async function login(username, password) {
  return await apiLogin(username, password)
}

// Keluar dari sesi aktif & hapus token lokal
export async function logout() {
  return await apiLogout()
}

// Verifikasi token tersimpan ke backend (tidak auto-login)
export async function initAuth() {
  const token = localStorage.getItem(TOKEN_KEY)

  if (!token || token.startsWith('mock_token_') || token.startsWith('token_seeder_')) {
    clearSession()
    return false
  }

  try {
    await apiGetMe()
    return true
  } catch (e) {
    if (e.status === 401) {
      clearSession()
      return false
    }
    return Boolean(authToken.value && currentUser.value)
  }
}
