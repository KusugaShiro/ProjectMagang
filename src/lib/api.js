/**
 * Lapisan Klien REST API Sistem Rekapitulasi Pelaporan Pengawasan Ketenagakerjaan & K3
 * Terhubung langsung ke Backend Laravel 12/13 (tanpa penyimpanan lokal/mock)
 * Sesuai dengan:
 * - PRD Database Rekapitulasi Pelaporan Pengawasan & K3 (K1–K10) (MySQL / MariaDB)
 * - Kontrak API Backend (REST API) v1.0.0
 * - UPTD Balai Pengawasan Ketenagakerjaan Daerah Wilayah I Provinsi Kalimantan Selatan
 */

import { authToken, currentUser, setSession, clearSession } from './session'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Helper header standar Laravel API
function getHeaders(isJson = true) {
  const headers = {
    'Accept': 'application/json',
  }
  if (isJson) {
    headers['Content-Type'] = 'application/json'
  }
  if (authToken.value) {
    headers['Authorization'] = `Bearer ${authToken.value}`
  }
  return headers
}

// Wrapper Fetch API terstandarisasi untuk Backend Laravel
async function fetchApi(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const isJson = options.isJson !== false
  const headers = {
    ...getHeaders(isJson),
    ...(options.headers || {}),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Tangani respons bukan 2xx
  if (!response.ok) {
    let errData = {}
    try {
      errData = await response.json()
    } catch (e) {}

    let errorMessage = errData.message || response.statusText || 'Terjadi kesalahan pada komunikasi server backend.'

    // Ekstrak rincian validasi 422 dari Laravel
    if (errData.errors && typeof errData.errors === 'object') {
      const details = Object.values(errData.errors).flat().join('; ')
      if (details) {
        errorMessage += ` (${details})`
      }
    }

    if (response.status === 401) {
      console.warn('Sesi backend 401 Unauthenticated - Token tidak valid atau kedaluwarsa.')
    }

    const error = new Error(errorMessage)
    error.status = response.status
    error.data = errData
    throw error
  }

  // Jika respons 204 No Content
  if (response.status === 204) {
    return null
  }

  return await response.json()
}

// Data Master Referensi (Untuk fallback tampilan UI jika jaringan backend terputus)
export const MASTER_WILAYAH = [
  {
    id_wilayah: 1,
    kode_wilayah: 'BJM',
    nama_kabupaten_kota: 'Kota Banjarmasin',
    nama_provinsi: 'Kalimantan Selatan',
    nama_balai: 'UPTD Balai Pengawasan Ketenagakerjaan Daerah Wilayah I Provinsi Kalimantan Selatan',
    teks_header_kabupaten: 'Banjarmasin',
    nama_kepala_balai: "JUM'AH, S.Kep., M.Kep",
    nip_kepala_balai: '19740315 199803 2 007',
    nama_pembuat_laporan: 'A. RAMADHAN',
    nip_pembuat_laporan: '19780104 200904 1 002'
  },
  {
    id_wilayah: 2,
    kode_wilayah: 'BTL',
    nama_kabupaten_kota: 'Kabupaten Barito Kuala',
    nama_provinsi: 'Kalimantan Selatan',
    nama_balai: 'UPTD Balai Pengawasan Ketenagakerjaan Daerah Wilayah I Provinsi Kalimantan Selatan',
    teks_header_kabupaten: 'Barito Kuala',
    nama_kepala_balai: "JUM'AH, S.Kep., M.Kep",
    nip_kepala_balai: '19740315 199803 2 007',
    nama_pembuat_laporan: 'Operator Batola',
    nip_pembuat_laporan: '19820512 201001 1 015'
  }
]

export const MASTER_SEKTOR_KLUI = [
  { id_klui: 1, nomor_urut: 1, kode_klui: '1', nama_sektor: 'Pertanian, Perburuan, Kehutanan, Perikanan' },
  { id_klui: 2, nomor_urut: 2, kode_klui: '2', nama_sektor: 'Pertambangan dan Penggalian' },
  { id_klui: 3, nomor_urut: 3, kode_klui: '3', nama_sektor: 'Industri Pengolahan' },
  { id_klui: 4, nomor_urut: 4, kode_klui: '4', nama_sektor: 'Listrik, Gas dan Air' },
  { id_klui: 5, nomor_urut: 5, kode_klui: '5', nama_sektor: 'Konstruksi' },
  { id_klui: 6, nomor_urut: 6, kode_klui: '6', nama_sektor: 'Perdagangan Besar, Eceran, Rumah Makan & Hotel' },
  { id_klui: 7, nomor_urut: 7, kode_klui: '7', nama_sektor: 'Angkutan, Pergudangan dan Komunikasi' },
  { id_klui: 8, nomor_urut: 8, kode_klui: '8', nama_sektor: 'Keuangan, Asuransi, Usaha Persewaan & Jasa Perusahaan' },
  { id_klui: 9, nomor_urut: 9, kode_klui: '9', nama_sektor: 'Jasa Kemasyarakatan, Sosial dan Perorangan' },
  { id_klui: 10, nomor_urut: 10, kode_klui: '0', nama_sektor: 'Kegiatan yang Belum Jelas Batasannya' },
]

export const MASTER_JABATAN = [
  { id_jabatan: 1, nomor_kelompok: '1', kategori_pendidikan: 'Terampil/SLA', kode_sub_jabatan: 'a', nama_jabatan: 'Pelaksana', tampil_di_k1: true, tampil_di_k5: false, tampil_di_k6: false, urutan_tampil: 1 },
  { id_jabatan: 2, nomor_kelompok: '1', kategori_pendidikan: 'Terampil/SLA', kode_sub_jabatan: 'b', nama_jabatan: 'Pelaksana Lanjutan', tampil_di_k1: true, tampil_di_k5: false, tampil_di_k6: false, urutan_tampil: 2 },
  { id_jabatan: 3, nomor_kelompok: '1', kategori_pendidikan: 'Terampil/SLA', kode_sub_jabatan: 'c', nama_jabatan: 'Penyelia', tampil_di_k1: true, tampil_di_k5: false, tampil_di_k6: false, urutan_tampil: 3 },
  { id_jabatan: 4, nomor_kelompok: '2', kategori_pendidikan: 'Ahli/S1-S2', kode_sub_jabatan: 'a', nama_jabatan: 'Pertama', tampil_di_k1: true, tampil_di_k5: false, tampil_di_k6: true, urutan_tampil: 4 },
  { id_jabatan: 5, nomor_kelompok: '2', kategori_pendidikan: 'Ahli/S1-S2', kode_sub_jabatan: 'b', nama_jabatan: 'Muda', tampil_di_k1: true, tampil_di_k5: false, tampil_di_k6: true, urutan_tampil: 5 },
  { id_jabatan: 6, nomor_kelompok: '2', kategori_pendidikan: 'Ahli/S1-S2', kode_sub_jabatan: 'c', nama_jabatan: 'Madya', tampil_di_k1: true, tampil_di_k5: false, tampil_di_k6: true, urutan_tampil: 6 },
]

// Rumus Triwulan sesuai Aturan Bisnis #1 PRD Database: (bulan + 2) DIV 3
export function hitungTriwulanDB(bulan) {
  const b = Number(bulan) || 1
  return Math.floor((b + 2) / 3)
}

// ==========================================
// 1. ENDPOINT AUTENTIKASI (POST /login, GET /me, POST /logout)
// ==========================================

export async function apiLogin(email, kata_sandi = 'password') {
  const res = await fetchApi('/login', {
    method: 'POST',
    body: JSON.stringify({ email, kata_sandi }),
  })

  // Format backend: { token, token_type: 'Bearer', data: PenggunaResource }
  if (res?.token && res?.data) {
    setSession(res.token, res.data)
  }
  return res
}

export async function apiGetMe() {
  const res = await fetchApi('/me', {
    method: 'GET',
    isJson: false,
  })

  if (res?.data) {
    setSession(authToken.value, res.data)
    return res.data
  }
  return currentUser.value
}

export async function apiLogout() {
  try {
    await fetchApi('/logout', {
      method: 'POST',
      isJson: false,
    })
  } catch (e) {
    console.warn('Logout backend:', e.message)
  } finally {
    clearSession()
  }
  return { message: 'Berhasil keluar.' }
}

// ==========================================
// 2. ENDPOINT DATA MASTER (GET /master/*)
// ==========================================

export async function apiGetMasterWilayah() {
  try {
    const res = await fetchApi('/master/wilayah', {
      method: 'GET',
      isJson: false,
    })
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data
    }
  } catch (e) {
    console.warn('Gagal memuat master wilayah dari backend, fallback ke master statis:', e.message)
  }

  if (currentUser.value?.peran === 'operator_kabupaten' && currentUser.value.id_wilayah) {
    return MASTER_WILAYAH.filter(w => w.id_wilayah === currentUser.value.id_wilayah)
  }
  return MASTER_WILAYAH
}

export async function apiGetMasterKlui() {
  try {
    const res = await fetchApi('/master/klui', {
      method: 'GET',
      isJson: false,
    })
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data
    }
  } catch (e) {
    console.warn('Gagal memuat master KLUI dari backend, fallback ke master statis:', e.message)
  }
  return MASTER_SEKTOR_KLUI
}

export async function apiGetMasterJabatan(modul = 'k1') {
  try {
    const query = modul ? `?modul=${modul}` : ''
    const res = await fetchApi(`/master/jabatan${query}`, {
      method: 'GET',
      isJson: false,
    })
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data
    }
  } catch (e) {
    console.warn('Gagal memuat master jabatan dari backend, fallback ke master statis:', e.message)
  }

  if (modul === 'k1') {
    return MASTER_JABATAN.filter(j => j.tampil_di_k1)
  }
  return MASTER_JABATAN
}

// ==========================================
// 3. ENDPOINT HEADER LAPORAN BULANAN (CRUD /laporan)
// ==========================================

export async function apiGetDaftarLaporan(params = {}) {
  const q = new URLSearchParams()
  if (params.id_wilayah) q.append('id_wilayah', params.id_wilayah)
  if (params.tahun) q.append('tahun', params.tahun)
  if (params.bulan) q.append('bulan', params.bulan)
  if (params.triwulan) q.append('triwulan', params.triwulan)
  if (params.status_laporan) q.append('status_laporan', params.status_laporan)

  const res = await fetchApi(`/laporan?${q.toString()}`, {
    method: 'GET',
    isJson: false,
  })

  const list = res?.data || []

  // Tambahkan referensi modul K1 s.d. K7 yang aktif agar tombol aksi pada antarmuka dapat dibuka
  return list.map(item => ({
    ...item,
    modul_list: ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8a', 'K8b', 'K8c', 'K9a', 'K9b'],
  }))
}

export async function apiBuatLaporan({ id_wilayah, tahun, bulan }) {
  try {
    const res = await fetchApi('/laporan', {
      method: 'POST',
      body: JSON.stringify({
        id_wilayah: Number(id_wilayah),
        tahun: Number(tahun),
        bulan: Number(bulan),
      }),
    })
    return res?.data || res
  } catch (err) {
    // Jika laporan sudah ada di database backend (unique constraint 422), ambil laporan eksisting
    if (err.status === 422 || err.message?.includes('sudah ada')) {
      const list = await apiGetDaftarLaporan({ id_wilayah, tahun, bulan })
      const found = list.find(l => l.id_wilayah === Number(id_wilayah) && l.tahun === Number(tahun) && l.bulan === Number(bulan))
      if (found) return found
    }
    throw err
  }
}

export async function apiGetDetailLaporan(id_laporan) {
  const res = await fetchApi(`/laporan/${id_laporan}`, {
    method: 'GET',
    isJson: false,
  })
  return res?.data || res
}

export async function apiHapusLaporan(id_laporan) {
  await fetchApi(`/laporan/${id_laporan}`, {
    method: 'DELETE',
    isJson: false,
  })
  return true
}

export async function apiKirimLaporan(id_laporan) {
  const res = await fetchApi(`/laporan/${id_laporan}/kirim`, {
    method: 'POST',
    isJson: false,
  })
  return res?.data || res
}

export async function apiSahkanLaporan(id_laporan) {
  const res = await fetchApi(`/laporan/${id_laporan}/sahkan`, {
    method: 'POST',
    isJson: false,
  })
  return res?.data || res
}

export async function apiKembalikanLaporan(id_laporan) {
  const res = await fetchApi(`/laporan/${id_laporan}/kembalikan`, {
    method: 'POST',
    isJson: false,
  })
  return res?.data || res
}

export async function apiGetLaporanLog(id_laporan) {
  const res = await fetchApi(`/laporan/${id_laporan}/log`, {
    method: 'GET',
    isJson: false,
  })

  const logs = res?.data || []
  return logs.map(l => ({
    id_log: l.id_log,
    aksi: l.aksi,
    tabel_terkait: l.nama_tabel,
    catatan: `${(l.aksi || 'aktivitas').toUpperCase()} pada tabel ${l.nama_tabel || 'laporan'}${l.id_baris ? ` (baris #${l.id_baris})` : ''}`,
    waktu: l.waktu_perubahan,
    pengguna: l.pengguna?.nama_pengguna || 'Sistem',
    data_lama: l.data_lama,
    data_baru: l.data_baru,
  }))
}

// ==========================================
// 4. ENDPOINT MODUL MATRIKS BULANAN (GET /laporan/{id}/{modul}, PUT /laporan/{id}/{modul})
// ==========================================

export async function apiGetMatriksModul(id_laporan, modul = 'k1') {
  const m = modul.toLowerCase()
  const res = await fetchApi(`/laporan/${id_laporan}/${m}`, {
    method: 'GET',
    isJson: false,
  })

  return {
    data: res?.data || [],
    meta: res?.meta || { id_laporan: Number(id_laporan), modul: m, apakah_nihil: true },
  }
}

export async function apiSimpanMatriksModul(id_laporan, modul = 'k1', payloadBaris = []) {
  const m = modul.toLowerCase()
  const res = await fetchApi(`/laporan/${id_laporan}/${m}`, {
    method: 'PUT',
    body: JSON.stringify({ baris: payloadBaris }),
  })
  return res
}

// ==========================================
// 5. AGREGASI REKAPITULASI TRIWULAN (GET /rekap-triwulan/{modul})
// ==========================================

export async function apiGetRekapTriwulan(modul = 'k1', { id_wilayah, tahun, triwulan }) {
  const m = modul.toLowerCase()
  const res = await fetchApi(`/rekap-triwulan/${m}?id_wilayah=${id_wilayah}&tahun=${tahun}&triwulan=${triwulan}`, {
    method: 'GET',
    isJson: false,
  })
  return res
}

/**
 * Ambil laporan bulanan untuk 1 bulan dan 1 modul tertentu (digunakan untuk agregasi Triwulan K5–K10).
 * Mengembalikan { doc, data, meta } bila laporan bulanan dan data modulnya ada, atau null bila belum tersimpan.
 */
export async function ambilLaporan(modul, { id_wilayah, tahun, bulan }) {
  const list = await apiGetDaftarLaporan({
    id_wilayah: Number(id_wilayah),
    tahun: Number(tahun),
    bulan: Number(bulan),
  })
  const doc = list.find(
    l => l.id_wilayah === Number(id_wilayah) && l.tahun === Number(tahun) && l.bulan === Number(bulan)
  )
  if (!doc) return null

  const resModul = await apiGetMatriksModul(doc.id_laporan, modul)
  if (!resModul?.data || !Array.isArray(resModul.data) || resModul.data.length === 0) {
    return null
  }
  return {
    doc,
    data: resModul.data,
    meta: resModul.meta,
  }
}

// Helper penyimpanan khusus kolom editable pada mode Triwulan (mis. Jumlah & Keterangan pada K5)
// Kolom otomatis TIDAK disimpan di sini karena selalu dihitung ulang dari laporan bulanan.
function getTriwulanStorageKey(modul, { id_wilayah, tahun, triwulan }) {
  return `rekap_triwulan_editable:${String(modul).toLowerCase()}:${Number(id_wilayah)}:${Number(tahun)}:TW${Number(triwulan)}`
}

export function ambilSimpananTriwulan(modul, { id_wilayah, tahun, triwulan }) {
  try {
    const raw = localStorage.getItem(getTriwulanStorageKey(modul, { id_wilayah, tahun, triwulan }))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function simpanTriwulan(modul, { id_wilayah, tahun, triwulan }, editableRows) {
  const key = getTriwulanStorageKey(modul, { id_wilayah, tahun, triwulan })
  localStorage.setItem(key, JSON.stringify({
    updated_at: new Date().toISOString(),
    rows: editableRows,
  }))
  return true
}

export function hapusSimpananTriwulan(modul, { id_wilayah, tahun, triwulan }) {
  try {
    localStorage.removeItem(getTriwulanStorageKey(modul, { id_wilayah, tahun, triwulan }))
  } catch {}
}

// ==========================================
// 6. EKSPOR EXCEL BALAI RESMI DARI BACKEND (GET /ekspor/excel)
// ==========================================

export async function apiUnduhExcelResmi(id_wilayah, tahun, triwulan = null) {
  const params = new URLSearchParams({
    id_wilayah: String(id_wilayah),
    tahun: String(tahun),
  })
  if (triwulan) {
    params.append('triwulan', String(triwulan))
  }

  const url = `${BASE_URL}/ekspor/excel?${params.toString()}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': authToken.value ? `Bearer ${authToken.value}` : '',
      'Accept': 'application/json',
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Gagal mengunduh Excel dari backend.')
  }

  const blob = await res.blob()
  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = triwulan
    ? `Rekap_K3_${id_wilayah === 1 ? 'BJM' : 'BTL'}_${tahun}_TW${triwulan}.xlsx`
    : `Rekap_K3_${id_wilayah === 1 ? 'BJM' : 'BTL'}_${tahun}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(blobUrl)
  return true
}
