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
import { apiLogin, apiGetMe, apiLogout } from './api'

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

// Login menggunakan email & kata sandi ke Backend Laravel
export async function login(email, kata_sandi) {
  return await apiLogin(email, kata_sandi)
}

// Keluar dari sesi aktif & hapus token lokal
export async function logout() {
  return await apiLogout()
}

// Berpindah akun seeder dan login langsung ke Backend Laravel
export async function switchAccount(email, kata_sandi = 'password') {
  return await apiLogin(email, kata_sandi)
}

// Verifikasi token tersimpan ke backend (tidak auto-login agar pengguna wajib masuk lewat halaman Login)
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
