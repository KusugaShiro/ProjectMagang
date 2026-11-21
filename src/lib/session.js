import { ref, computed } from 'vue'

// Akun seeder bawaan dari dokumentasi API (hal 14 PDF & PenggunaSeeder backend)
export const SEED_ACCOUNTS = [
  {
    email: 'operator.bjm@k3.local',
    nama_pengguna: 'Operator Kota Banjarmasin',
    nip_pegawai: '19780104 200904 1 002',
    peran: 'operator_kabupaten',
    id_wilayah: 1,
    wilayah: {
      id_wilayah: 1,
      kode_wilayah: 'BJM',
      nama_kabupaten_kota: 'Kota Banjarmasin',
      teks_header_kabupaten: 'Banjarmasin',
    },
  },
  {
    email: 'operator.btl@k3.local',
    nama_pengguna: 'Operator Kab. Barito Kuala',
    nip_pegawai: '19820512 201001 1 015',
    peran: 'operator_kabupaten',
    id_wilayah: 2,
    wilayah: {
      id_wilayah: 2,
      kode_wilayah: 'BTL',
      nama_kabupaten_kota: 'Kabupaten Barito Kuala',
      teks_header_kabupaten: 'Barito Kuala',
    },
  },
  {
    email: 'kepala.balai@k3.local',
    nama_pengguna: "JUM'AH, S.Kep., M.Kep",
    nip_pegawai: '19740315 199803 2 007',
    peran: 'kepala_balai',
    id_wilayah: null,
    wilayah: null,
  },
  {
    email: 'admin@k3.local',
    nama_pengguna: 'Administrator Sistem K3',
    nip_pegawai: '19850101 200801 1 001',
    peran: 'admin',
    id_wilayah: null,
    wilayah: null,
  },
]

export const TOKEN_KEY = 'k3_auth_token'
export const USER_KEY = 'k3_auth_user'

function loadSavedAuth() {
  const token = localStorage.getItem(TOKEN_KEY)
  const userJson = localStorage.getItem(USER_KEY)

  // Bersihkan mock token lama agar tidak terkirim ke backend
  if (token && (token.startsWith('mock_token_') || token.startsWith('token_seeder_'))) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return { token: null, user: null }
  }

  if (token && userJson) {
    try {
      return { token, user: JSON.parse(userJson) }
    } catch (e) {
      console.error(e)
    }
  }
  return { token: null, user: null }
}

const initial = loadSavedAuth()
export const authToken = ref(initial.token)
export const currentUser = ref(initial.user || null)

export const isAuthenticated = computed(() => !!authToken.value && !!currentUser.value)
export const userRole = computed(() => currentUser.value?.peran || 'guest')
export const isOperator = computed(() => userRole.value === 'operator_kabupaten')
export const isKepalaBalai = computed(() => userRole.value === 'kepala_balai')
export const isAdmin = computed(() => userRole.value === 'admin')
export const userWilayahId = computed(() => currentUser.value?.id_wilayah || null)

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
