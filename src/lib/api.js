/**
 * Klien REST API Sistem Rekapitulasi Pelaporan Pengawasan Ketenagakerjaan & K3
 * Terhubung langsung ke backend Laravel (`rekap-laporan-kecelakaan`) melalui `/api`.
 */

import { authToken, currentUser, setSession, clearSession } from './session'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

function getHeaders(isJson = true) {
  const headers = {
    Accept: 'application/json',
  }
  if (isJson) {
    headers['Content-Type'] = 'application/json'
  }
  if (authToken.value) {
    headers.Authorization = `Bearer ${authToken.value}`
  }
  return headers
}

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

  if (!response.ok) {
    let errData = {}
    try {
      errData = await response.json()
    } catch {
      // Abaikan bila respons error bukan JSON
    }

    let errorMessage =
      errData.message ||
      response.statusText ||
      'Gagal terhubung ke layanan data. Silakan coba beberapa saat lagi.'

    if (errData.errors && typeof errData.errors === 'object') {
      const details = Object.values(errData.errors).flat().join('; ')
      if (details && details !== errorMessage) {
        errorMessage += ` (${details})`
      }
    }

    const error = new Error(errorMessage)
    error.status = response.status
    error.data = errData
    throw error
  }

  if (response.status === 204) {
    return null
  }

  return await response.json()
}

// Rumus Triwulan selaras dengan kolom STORED GENERATED `triwulan` di `laporan_bulanan`: (bulan + 2) DIV 3
export function hitungTriwulanDB(bulan) {
  const b = Number(bulan) || 1
  return Math.floor((b + 2) / 3)
}

// ==========================================
// 1. ENDPOINT AUTENTIKASI (POST /login, GET /me, POST /logout)
// ==========================================

export async function apiLogin(username, password) {
  const res = await fetchApi('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

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
  } finally {
    clearSession()
  }
  return { message: 'Berhasil keluar.' }
}

// ==========================================
// 2. ENDPOINT DATA MASTER (GET /master/*)
// ==========================================

export async function apiGetMasterWilayah() {
  const res = await fetchApi('/master/wilayah', {
    method: 'GET',
    isJson: false,
  })
  return Array.isArray(res?.data) ? res.data : []
}

export async function apiGetMasterKlui() {
  const res = await fetchApi('/master/klui', {
    method: 'GET',
    isJson: false,
  })
  return Array.isArray(res?.data) ? res.data : []
}

export async function apiGetMasterJabatan(modul = '') {
  const query = modul ? `?modul=${encodeURIComponent(modul)}` : ''
  const res = await fetchApi(`/master/jabatan${query}`, {
    method: 'GET',
    isJson: false,
  })
  return Array.isArray(res?.data) ? res.data : []
}

// ==========================================
// 3. ENDPOINT HEADER LAPORAN BULANAN (CRUD /laporan)
// ==========================================

const DAFTAR_MODUL_LAPORAN = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8a', 'K8b', 'K8c', 'K9a', 'K9b', 'K10']

export async function apiGetDaftarLaporan(params = {}) {
  const q = new URLSearchParams()
  if (params.id_wilayah) q.append('id_wilayah', params.id_wilayah)
  if (params.tahun) q.append('tahun', params.tahun)
  if (params.bulan) q.append('bulan', params.bulan)
  if (params.triwulan) q.append('triwulan', params.triwulan)
  if (params.status_laporan) q.append('status_laporan', params.status_laporan)

  const qs = q.toString()
  const res = await fetchApi(qs ? `/laporan?${qs}` : '/laporan', {
    method: 'GET',
    isJson: false,
  })

  const list = Array.isArray(res?.data) ? res.data : []

  return list.map(item => ({
    ...item,
    modul_list: DAFTAR_MODUL_LAPORAN,
  }))
}

export async function apiBuatLaporan({ id_wilayah, tahun, bulan, tanggal_laporan = null }) {
  try {
    const payload = {
      id_wilayah: Number(id_wilayah),
      tahun: Number(tahun),
      bulan: Number(bulan),
    }
    if (tanggal_laporan) {
      payload.tanggal_laporan = tanggal_laporan
    }
    const res = await fetchApi('/laporan', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return res?.data || res
  } catch (err) {
    if (err.status === 422 || err.message?.includes('sudah ada')) {
      const list = await apiGetDaftarLaporan({ id_wilayah, tahun, bulan })
      const found = list.find(
        l =>
          Number(l.id_wilayah) === Number(id_wilayah) &&
          Number(l.tahun) === Number(tahun) &&
          Number(l.bulan) === Number(bulan)
      )
      if (found) return found
    }
    throw err
  }
}

export async function apiUpdateLaporan(id_laporan, { tanggal_laporan }) {
  const res = await fetchApi(`/laporan/${id_laporan}`, {
    method: 'PATCH',
    body: JSON.stringify({ tanggal_laporan: tanggal_laporan || null }),
  })
  return res?.data || res
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

export async function apiFinalkanLaporan(id_laporan, tanggal_laporan = null) {
  const options = tanggal_laporan
    ? {
        method: 'POST',
        body: JSON.stringify({ tanggal_laporan }),
      }
    : {
        method: 'POST',
        isJson: false,
      }
  const res = await fetchApi(`/laporan/${id_laporan}/finalkan`, options)
  return res?.data || res
}

export async function apiBukaKembaliLaporan(id_laporan) {
  const res = await fetchApi(`/laporan/${id_laporan}/buka-kembali`, {
    method: 'POST',
    isJson: false,
  })
  return res?.data || res
}

const LABEL_AKSI_LOG = {
  tambah: 'Tambah Data',
  ubah: 'Ubah Data',
  hapus: 'Hapus Data',
  finalkan: 'Finalisasi',
  buka_kembali: 'Buka Kembali',
}

const LABEL_BAGIAN_LOG = {
  laporan_bulanan: 'Dokumen Laporan',
  rekap_k1_pegawai: 'Formulir K1 (Data Pegawai Pengawas)',
  rekap_k2_obyek_pengawasan: 'Formulir K2 (Data Obyek Pengawasan)',
  rekap_k3_obyek_k3: 'Formulir K3 (Obyek Pengawasan K3)',
  rekap_k4_jamsostek_bpjs: 'Formulir K4 (Data Jamsostek - BPJS)',
  rekap_k5_pemeriksaan: 'Formulir K5 (Kegiatan Pemeriksaan APBN)',
  rekap_k6_pemeriksaan_header: 'Formulir K6 (Pemeriksaan Rinci APBN)',
  rekap_k6_pemeriksaan_detail_klui: 'Formulir K6 (Rincian Sektor KLUI)',
  rekap_k7_perizinan_k3: 'Formulir K7 (Penerbitan Perizinan K3)',
  rekap_k8a_kecelakaan_tipe: 'Formulir K8a (Kecelakaan Kerja - Tipe)',
  rekap_k8b_kecelakaan_sumber: 'Formulir K8b (Kecelakaan Kerja - Sumber)',
  rekap_k8c_kecelakaan_akibat: 'Formulir K8c (Kecelakaan Kerja - Akibat)',
  rekap_k9a_pelanggaran_kerja: 'Formulir K9a (Pelanggaran Norma Kerja)',
  rekap_k9b_pelanggaran_k3: 'Formulir K9b (Pelanggaran Norma K3)',
  rekap_k10_penyidikan: 'Formulir K10 (Penyidikan PPNS)',
}

export async function apiGetLaporanLog(id_laporan) {
  const res = await fetchApi(`/laporan/${id_laporan}/log`, {
    method: 'GET',
    isJson: false,
  })

  const logs = Array.isArray(res?.data) ? res.data : []
  return logs.map(l => {
    const aksiKey = String(l.aksi || '').toLowerCase()
    const aksiLabel = LABEL_AKSI_LOG[aksiKey] || (l.aksi ? String(l.aksi) : 'Aktivitas')
    const bagianLabel = LABEL_BAGIAN_LOG[l.nama_tabel] || 'Dokumen Laporan'
    return {
      id_log: l.id_log,
      aksi: aksiLabel,
      tabel_terkait: l.nama_tabel,
      catatan: `${aksiLabel} pada ${bagianLabel}`,
      waktu: l.waktu_perubahan,
      data_lama: l.data_lama,
      data_baru: l.data_baru,
    }
  })
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
    data: Array.isArray(res?.data) ? res.data : [],
    meta: res?.meta || { id_laporan: Number(id_laporan), modul: m, apakah_nihil: true },
  }
}

export async function apiSimpanMatriksModul(id_laporan, modul = 'k1', payloadBaris = []) {
  const m = modul.toLowerCase()
  return await fetchApi(`/laporan/${id_laporan}/${m}`, {
    method: 'PUT',
    body: JSON.stringify({ baris: payloadBaris }),
  })
}

// ==========================================
// 5. REKAPITULASI TRIWULAN (GET /rekap-triwulan/{modul})
// ==========================================

export async function apiGetRekapTriwulan(modul = 'k1', { id_wilayah, tahun, triwulan }) {
  const m = modul.toLowerCase()
  const q = new URLSearchParams({
    id_wilayah: String(Number(id_wilayah)),
    tahun: String(Number(tahun)),
    triwulan: String(Number(triwulan)),
  })
  const res = await fetchApi(`/rekap-triwulan/${m}?${q.toString()}`, {
    method: 'GET',
    isJson: false,
  })

  return {
    data: Array.isArray(res?.data) ? res.data : [],
    meta: res?.meta || { id_wilayah: Number(id_wilayah), tahun: Number(tahun), triwulan: Number(triwulan), modul: m },
  }
}

// ==========================================
// 6. EKSPOR EXCEL BALAI RESMI (GET /ekspor/excel)
// ==========================================

function parseFilenameFromDisposition(disposition) {
  if (!disposition) return null
  const utf8Match = /filename\*=UTF-8''([^;\n]+)/i.exec(disposition)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/["']/g, ''))
    } catch {
      return utf8Match[1].replace(/["']/g, '')
    }
  }
  const simpleMatch = /filename="?([^";\n]+)"?/i.exec(disposition)
  return simpleMatch?.[1] || null
}

export async function apiUnduhExcelResmi({ id_wilayah, tahun, triwulan = null, kodeWilayah = null }) {
  const params = new URLSearchParams({
    id_wilayah: String(Number(id_wilayah)),
    tahun: String(Number(tahun)),
  })
  if (triwulan !== null && triwulan !== undefined && triwulan !== '') {
    params.append('triwulan', String(Number(triwulan)))
  }

  const url = `${BASE_URL}/ekspor/excel?${params.toString()}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: authToken.value ? `Bearer ${authToken.value}` : '',
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
    },
  })

  if (!res.ok) {
    let message = 'Gagal mengunduh berkas Excel.'
    try {
      const err = await res.json()
      if (err?.message) message = err.message
    } catch {
      // Gunakan pesan bawaan jika respons bukan JSON
    }
    throw new Error(message)
  }

  const blob = await res.blob()
  const headerName = parseFilenameFromDisposition(res.headers.get('content-disposition'))
  const kode = kodeWilayah || (Number(id_wilayah) === 1 ? 'BJM' : 'BTL')
  const fallbackName = triwulan
    ? `Rekap_K3_${kode}_${tahun}_TW${triwulan}.xlsx`
    : `Rekap_K3_${kode}_${tahun}.xlsx`
  const fileName = headerName || fallbackName

  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(blobUrl)

  return { fileName }
}
