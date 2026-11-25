/**
 * Modul Manajemen Autentikasi Pengguna & Sesi
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

export async function login(username, password) {
  return await apiLogin(username, password)
}

export async function logout() {
  return await apiLogout()
}

export async function initAuth() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
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
