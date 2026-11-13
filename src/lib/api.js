/**
 * Lapisan Klien REST API Sistem Rekapitulasi Pelaporan Pengawasan Ketenagakerjaan & K3
 * Selaras dengan:
 * - PRD Database Rekapitulasi Pelaporan Pengawasan & K3 (K1–K10) (MySQL 8.0+ / MariaDB 10.5+)
 * - Kontrak API Backend (REST API) v1.0.0 Laravel 13.x
 * - UPTD Balai Pengawasan Ketenagakerjaan Daerah Wilayah I Provinsi Kalimantan Selatan
 */

import { authToken, currentUser, setSession, SEED_ACCOUNTS } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Helper header standar Laravel
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

// ==========================================
// MOCK STORAGE ENGINE (SESUAI DDL schema_rekap_k3.sql)
// ==========================================
const MOCK_STORAGE_KEY = 'k3_prd_database_v3'

// Tabel Master: wilayah_pengawasan (FR-DB-02 & Aturan Bisnis 5)
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

// Tabel Master: master_sektor_klui (FR-DB-02 & Temuan 1)
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

// Tabel Master: master_jabatan_pengawas (FR-DB-02 & Temuan 1)
export const MASTER_JABATAN = [
  { id_jabatan: 1, nomor_kelompok: '1', kategori_pendidikan: 'Terampil/SLA', kode_sub_jabatan: 'a', nama_jabatan: 'Pelaksana', tampil_di_k1: true, tampil_di_k5: false, tampil_di_k6: false, urutan_tampil: 1 },
  { id_jabatan: 2, nomor_kelompok: '1', kategori_pendidikan: 'Terampil/SLA', kode_sub_jabatan: 'b', nama_jabatan: 'Pelaksana Lanjutan', tampil_di_k1: true, tampil_di_k5: false, tampil_di_k6: false, urutan_tampil: 2 },
  { id_jabatan: 3, nomor_kelompok: '1', kategori_pendidikan: 'Terampil/SLA', kode_sub_jabatan: 'c', nama_jabatan: 'Penyelia', tampil_di_k1: true, tampil_di_k5: false, tampil_di_k6: false, urutan_tampil: 3 },
  { id_jabatan: 4, nomor_kelompok: '2', kategori_pendidikan: 'Ahli/S1-S2', kode_sub_jabatan: 'a', nama_jabatan: 'Pertama', tampil_di_k1: true, tampil_di_k5: false, tampil_di_k6: true, urutan_tampil: 4 },
  { id_jabatan: 5, nomor_kelompok: '2', kategori_pendidikan: 'Ahli/S1-S2', kode_sub_jabatan: 'b', nama_jabatan: 'Muda', tampil_di_k1: true, tampil_di_k5: false, tampil_di_k6: true, urutan_tampil: 5 },
  { id_jabatan: 6, nomor_kelompok: '2', kategori_pendidikan: 'Ahli/S1-S2', kode_sub_jabatan: 'c', nama_jabatan: 'Madya', tampil_di_k1: true, tampil_di_k5: false, tampil_di_k6: true, urutan_tampil: 6 },
]

function getMockDb() {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error(e)
  }
  const initialDb = {
    laporanSeq: 1,
    laporanList: [], // Tabel laporan_bulanan
    matriksData: {}, // Tabel rekap_k1_pegawai s.d. rekap_k10_penyidikan
    logs: {}, // Tabel log_perubahan
  }
  saveMockDb(initialDb)
  return initialDb
}

function saveMockDb(db) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db))
  } catch (e) {
    console.error(e)
  }
}

// Rumus Triwulan sesuai Aturan Bisnis #1 PRD Database: (bulan + 2) DIV 3
export function hitungTriwulanDB(bulan) {
  const b = Number(bulan) || 1
  return Math.floor((b + 2) / 3)
}

// ==========================================
// 1. ENDPOINT AUTENTIKASI
// ==========================================

export async function apiLogin(email, kata_sandi) {
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ email, kata_sandi }),
    })
    if (res.ok) {
      const data = await res.json()
      setSession(data.token, data.data)
      return data
    }
    const errData = await res.json()
    throw new Error(errData.message || 'Login gagal.')
  } catch (e) {
    const found = SEED_ACCOUNTS.find(a => a.email === email)
    if (found) {
      const token = 'mock_token_' + found.peran + '_' + Date.now()
      setSession(token, found)
      return { token, token_type: 'Bearer', data: found }
    }
    throw new Error('Akun seeder tidak ditemukan atau server backend belum aktif.')
  }
}

export async function apiGetMe() {
  try {
    const res = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
      headers: getHeaders(false),
    })
    if (res.ok) {
      const data = await res.json()
      setSession(authToken.value, data.data)
      return data.data
    }
  } catch (e) {}
  return currentUser.value
}

export async function apiLogout() {
  try {
    await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: getHeaders(false),
    })
  } catch (e) {} finally {
    setSession(null, null)
  }
  return { message: 'Berhasil keluar.' }
}

// ==========================================
// 2. ENDPOINT DATA MASTER (FR-DB-02)
// ==========================================

export async function apiGetMasterWilayah() {
  try {
    const res = await fetch(`${BASE_URL}/master/wilayah`, {
      method: 'GET',
      headers: getHeaders(false),
    })
    if (res.ok) {
      const json = await res.json()
      return json.data
    }
  } catch (e) {}

  if (currentUser.value?.peran === 'operator_kabupaten' && currentUser.value.id_wilayah) {
    return MASTER_WILAYAH.filter(w => w.id_wilayah === currentUser.value.id_wilayah)
  }
  return MASTER_WILAYAH
}

export async function apiGetMasterKlui() {
  try {
    const res = await fetch(`${BASE_URL}/master/klui`, {
      method: 'GET',
      headers: getHeaders(false),
    })
    if (res.ok) {
      const json = await res.json()
      return json.data
    }
  } catch (e) {}
  return MASTER_SEKTOR_KLUI
}

export async function apiGetMasterJabatan(modul = 'k1') {
  try {
    const query = modul ? `?modul=${modul}` : ''
    const res = await fetch(`${BASE_URL}/master/jabatan${query}`, {
      method: 'GET',
      headers: getHeaders(false),
    })
    if (res.ok) {
      const json = await res.json()
      return json.data
    }
  } catch (e) {}

  if (modul === 'k1') {
    return MASTER_JABATAN.filter(j => j.tampil_di_k1)
  }
  return MASTER_JABATAN
}

// ==========================================
// 3. ENDPOINT HEADER LAPORAN BULANAN (FR-DB-03 & ALUR KERJA)
// ==========================================

export async function apiGetDaftarLaporan(params = {}) {
  try {
    const q = new URLSearchParams()
    if (params.id_wilayah) q.append('id_wilayah', params.id_wilayah)
    if (params.tahun) q.append('tahun', params.tahun)
    if (params.bulan) q.append('bulan', params.bulan)
    if (params.triwulan) q.append('triwulan', params.triwulan)
    if (params.status_laporan) q.append('status_laporan', params.status_laporan)

    const res = await fetch(`${BASE_URL}/laporan?${q.toString()}`, {
      method: 'GET',
      headers: getHeaders(false),
    })
    if (res.ok) {
      const json = await res.json()
      return json.data
    }
  } catch (e) {}

  const db = getMockDb()
  let list = [...db.laporanList]

  if (currentUser.value?.peran === 'operator_kabupaten' && currentUser.value.id_wilayah) {
    list = list.filter(item => item.id_wilayah === currentUser.value.id_wilayah)
  } else if (params.id_wilayah) {
    list = list.filter(item => item.id_wilayah === Number(params.id_wilayah))
  }

  if (params.tahun) list = list.filter(i => i.tahun === Number(params.tahun))
  if (params.bulan) list = list.filter(i => i.bulan === Number(params.bulan))
  if (params.triwulan) list = list.filter(i => i.triwulan === Number(params.triwulan))
  if (params.status_laporan) list = list.filter(i => i.status_laporan === params.status_laporan)

  list.sort((a, b) => {
    if (b.tahun !== a.tahun) return b.tahun - a.tahun
    return b.bulan - a.bulan
  })
  return list
}

export async function apiBuatLaporan({ id_wilayah, tahun, bulan }) {
  try {
    const res = await fetch(`${BASE_URL}/laporan`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ id_wilayah, tahun, bulan }),
    })
    if (res.ok) {
      const json = await res.json()
      return json.data
    }
    const err = await res.json()
    throw new Error(err.message || 'Gagal membuat laporan.')
  } catch (e) {
    if (e.message && e.message !== 'Failed to fetch') throw e
  }

  const db = getMockDb()
  const idWil = Number(id_wilayah)
  const thn = Number(tahun)
  const bln = Number(bulan)

  const existing = db.laporanList.find(l => l.id_wilayah === idWil && l.tahun === thn && l.bulan === bln)
  if (existing) {
    return existing
  }

  const newId = db.laporanSeq++
  const wilObj = MASTER_WILAYAH.find(w => w.id_wilayah === idWil) || MASTER_WILAYAH[0]
  const userObj = currentUser.value || SEED_ACCOUNTS[0]

  const newLaporan = {
    id_laporan: newId,
    id_wilayah: idWil,
    id_pengguna: userObj.id_pengguna || 1,
    tahun: thn,
    bulan: bln,
    triwulan: hitungTriwulanDB(bln),
    tanggal_pengesahan: null,
    status_laporan: 'draf',
    waktu_input: new Date().toISOString(),
    wilayah: wilObj,
    pengguna: {
      nama_pengguna: userObj.nama_pengguna,
      nip_pegawai: userObj.nip_pegawai,
      email: userObj.email,
      peran: userObj.peran,
    },
  }

  db.laporanList.unshift(newLaporan)

  // Audit log sesuai Bagian 6a PRD (aksi: 'tambah')
  if (!db.logs[newId]) db.logs[newId] = []
  db.logs[newId].push({
    aksi: 'tambah',
    tabel_terkait: 'laporan_bulanan',
    catatan: 'Dokumen header laporan bulanan dibuat dengan status draf.',
    waktu: new Date().toISOString(),
    pengguna: userObj.nama_pengguna,
  })

  saveMockDb(db)
  return newLaporan
}

export async function apiGetDetailLaporan(id_laporan) {
  try {
    const res = await fetch(`${BASE_URL}/laporan/${id_laporan}`, {
      method: 'GET',
      headers: getHeaders(false),
    })
    if (res.ok) {
      const json = await res.json()
      return json.data
    }
  } catch (e) {}

  const db = getMockDb()
  const found = db.laporanList.find(l => l.id_laporan === Number(id_laporan))
  if (!found) throw new Error('Dokumen laporan tidak ditemukan.')
  return found
}

export async function apiHapusLaporan(id_laporan) {
  try {
    const res = await fetch(`${BASE_URL}/laporan/${id_laporan}`, {
      method: 'DELETE',
      headers: getHeaders(false),
    })
    if (res.ok) return true
    const err = await res.json()
    throw new Error(err.message || 'Gagal menghapus laporan.')
  } catch (e) {
    if (e.message && e.message !== 'Failed to fetch') throw e
  }

  const db = getMockDb()
  const idx = db.laporanList.findIndex(l => l.id_laporan === Number(id_laporan))
  if (idx !== -1) {
    if (db.laporanList[idx].status_laporan === 'disahkan') {
      throw new Error('Akses Ditolak (403): Laporan yang sudah berstatus disahkan tidak boleh dihapus.')
    }
    db.laporanList.splice(idx, 1)
    delete db.logs[id_laporan]
    Object.keys(db.matriksData).forEach(k => {
      if (k.startsWith(`${id_laporan}_`)) delete db.matriksData[k]
    })
    saveMockDb(db)
  }
  return true
}

export async function apiKirimLaporan(id_laporan) {
  try {
    const res = await fetch(`${BASE_URL}/laporan/${id_laporan}/kirim`, {
      method: 'POST',
      headers: getHeaders(false),
    })
    if (res.ok) return await res.json()
    const err = await res.json()
    throw new Error(err.message || 'Gagal mengirim laporan.')
  } catch (e) {
    if (e.message && e.message !== 'Failed to fetch') throw e
  }

  const db = getMockDb()
  const lap = db.laporanList.find(l => l.id_laporan === Number(id_laporan))
  if (!lap) throw new Error('Laporan tidak ditemukan.')
  if (lap.status_laporan !== 'draf') throw new Error('Hanya laporan berstatus draf yang dapat dikirim.')

  lap.status_laporan = 'terkirim'
  if (!db.logs[id_laporan]) db.logs[id_laporan] = []
  db.logs[id_laporan].push({
    aksi: 'kirim',
    tabel_terkait: 'laporan_bulanan',
    catatan: 'Laporan dikirim dari draf ke status terkirim untuk diperiksa Kepala Balai.',
    waktu: new Date().toISOString(),
    pengguna: currentUser.value?.nama_pengguna || 'Operator',
  })
  saveMockDb(db)
  return { message: 'Laporan berhasil dikirim.' }
}

export async function apiSahkanLaporan(id_laporan) {
  try {
    const res = await fetch(`${BASE_URL}/laporan/${id_laporan}/sahkan`, {
      method: 'POST',
      headers: getHeaders(false),
    })
    if (res.ok) return await res.json()
    const err = await res.json()
    throw new Error(err.message || 'Gagal mengesahkan laporan.')
  } catch (e) {
    if (e.message && e.message !== 'Failed to fetch') throw e
  }

  const db = getMockDb()
  const lap = db.laporanList.find(l => l.id_laporan === Number(id_laporan))
  if (!lap) throw new Error('Laporan tidak ditemukan.')
  if (lap.status_laporan !== 'terkirim' && currentUser.value?.peran !== 'admin') {
    throw new Error('Laporan harus berstatus terkirim sebelum disahkan.')
  }

  lap.status_laporan = 'disahkan'
  lap.tanggal_pengesahan = new Date().toISOString().slice(0, 10)
  if (!db.logs[id_laporan]) db.logs[id_laporan] = []
  db.logs[id_laporan].push({
    aksi: 'sahkan',
    tabel_terkait: 'laporan_bulanan',
    catatan: `Laporan disahkan oleh ${currentUser.value?.nama_pengguna || 'Kepala Balai'}. Seluruh modul K1 s.d K10 dikunci (read-only).`,
    waktu: new Date().toISOString(),
    pengguna: currentUser.value?.nama_pengguna || 'Kepala Balai',
  })
  saveMockDb(db)
  return { message: 'Laporan berhasil disahkan.' }
}

export async function apiKembalikanLaporan(id_laporan) {
  try {
    const res = await fetch(`${BASE_URL}/laporan/${id_laporan}/kembalikan`, {
      method: 'POST',
      headers: getHeaders(false),
    })
    if (res.ok) return await res.json()
    const err = await res.json()
    throw new Error(err.message || 'Gagal mengembalikan laporan ke draf.')
  } catch (e) {
    if (e.message && e.message !== 'Failed to fetch') throw e
  }

  const db = getMockDb()
  const lap = db.laporanList.find(l => l.id_laporan === Number(id_laporan))
  if (!lap) throw new Error('Laporan tidak ditemukan.')

  lap.status_laporan = 'draf'
  lap.tanggal_pengesahan = null
  if (!db.logs[id_laporan]) db.logs[id_laporan] = []
  db.logs[id_laporan].push({
    aksi: 'kembalikan',
    tabel_terkait: 'laporan_bulanan',
    catatan: 'Laporan dikembalikan ke status draf oleh Kepala Balai/Admin. Kunci data dibuka.',
    waktu: new Date().toISOString(),
    pengguna: currentUser.value?.nama_pengguna || 'Kepala Balai',
  })
  saveMockDb(db)
  return { message: 'Laporan berhasil dikembalikan ke draf.' }
}

export async function apiGetLaporanLog(id_laporan) {
  try {
    const res = await fetch(`${BASE_URL}/laporan/${id_laporan}/log`, {
      method: 'GET',
      headers: getHeaders(false),
    })
    if (res.ok) {
      const json = await res.json()
      return json.data
    }
  } catch (e) {}

  const db = getMockDb()
  return db.logs[id_laporan] || []
}

// ==========================================
// 4. ENDPOINT MODUL MATRIKS K1 s.d. K10 (FR-DB-04)
// ==========================================

export async function apiGetMatriksModul(id_laporan, modul = 'k1') {
  const m = modul.toLowerCase()
  try {
    const res = await fetch(`${BASE_URL}/laporan/${id_laporan}/${m}`, {
      method: 'GET',
      headers: getHeaders(false),
    })
    if (res.ok) {
      const json = await res.json()
      return json
    }
  } catch (e) {}

  const db = getMockDb()
  const key = `${id_laporan}_${m}`
  const existing = db.matriksData[key]
  if (existing) return existing

  return { data: [], meta: { id_laporan: Number(id_laporan), modul: m, apakah_nihil: true } }
}

export async function apiSimpanMatriksModul(id_laporan, modul = 'k1', payloadBaris = []) {
  const m = modul.toLowerCase()
  try {
    const res = await fetch(`${BASE_URL}/laporan/${id_laporan}/${m}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ baris: payloadBaris }),
    })
    if (res.ok) {
      return await res.json()
    }
    const err = await res.json()
    throw new Error(err.message || 'Gagal menyimpan modul.')
  } catch (e) {
    if (e.message && e.message !== 'Failed to fetch') throw e
  }

  const db = getMockDb()
  const lap = db.laporanList.find(l => l.id_laporan === Number(id_laporan))
  if (lap && lap.status_laporan === 'disahkan') {
    throw new Error('Akses Ditolak (403): Laporan sudah berstatus disahkan dan berstatus read-only.')
  }

  const key = `${id_laporan}_${m}`
  const totalObj = {}
  let isNihil = true

  payloadBaris.forEach(row => {
    Object.keys(row).forEach(k => {
      if (k !== 'id_jabatan' && k !== 'id_klui' && k !== 'keterangan') {
        const val = Number(row[k]) || 0
        totalObj[k] = (totalObj[k] || 0) + val
        if (val > 0) isNihil = false
      }
    })
  })

  const savedResult = {
    data: payloadBaris.map((b, idx) => ({
      id_k1: 100 + idx,
      id_laporan: Number(id_laporan),
      ...b,
    })),
    meta: {
      id_laporan: Number(id_laporan),
      modul: m,
      total: totalObj,
      apakah_nihil: isNihil,
    },
  }

  db.matriksData[key] = savedResult

  // Audit log sesuai Bagian 6a PRD (aksi: 'ubah')
  if (!db.logs[id_laporan]) db.logs[id_laporan] = []
  db.logs[id_laporan].push({
    aksi: 'ubah',
    tabel_terkait: `rekap_${m}_${m === 'k1' ? 'pegawai' : 'matriks'}`,
    catatan: `Modul ${m.toUpperCase()} diperbarui (${payloadBaris.length} baris data).`,
    waktu: new Date().toISOString(),
    pengguna: currentUser.value?.nama_pengguna || 'Operator',
  })

  saveMockDb(db)
  return savedResult
}

// ==========================================
// 5. AGREGASI REKAPITULASI TRIWULAN (FR-DB-05 & Temuan 3)
// ==========================================

export async function apiGetRekapTriwulan(modul = 'k1', { id_wilayah, tahun, triwulan }) {
  const m = modul.toLowerCase()
  try {
    const res = await fetch(`${BASE_URL}/rekap-triwulan/${m}?id_wilayah=${id_wilayah}&tahun=${tahun}&triwulan=${triwulan}`, {
      method: 'GET',
      headers: getHeaders(false),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (e) {}

  // Logika Agregasi Triwulan PRD Database:
  // K1-K4 (data keadaan) = posisi bulan terakhir triwulan (TW 1: Bulan 3, TW 2: Bulan 6, TW 3: Bulan 9, TW 4: Bulan 12)
  // K5-K10 (data kegiatan) = jumlah 3 bulan (SUM)
  const db = getMockDb()
  const tw = Number(triwulan)
  const bulanAkhirTW = tw * 3 // 3, 6, 9, 12

  const laporanTarget = db.laporanList.find(
    l => l.id_wilayah === Number(id_wilayah) && l.tahun === Number(tahun) && l.bulan === bulanAkhirTW
  )

  if (!laporanTarget) {
    return { data: [], meta: { id_wilayah, tahun, triwulan, modul: m, apakah_nihil: true } }
  }

  return await apiGetMatriksModul(laporanTarget.id_laporan, m)
}

// ==========================================
// 6. EKSPOR EXCEL BALAI (Temuan 1 & 4)
// ==========================================

export async function apiUnduhExcelResmi(id_wilayah, tahun, triwulan = null) {
  const params = new URLSearchParams({
    id_wilayah: String(id_wilayah),
    tahun: String(tahun),
  })
  if (triwulan) {
    params.append('triwulan', String(triwulan))
  }

  try {
    const res = await fetch(`${BASE_URL}/ekspor/excel?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken.value}`,
        'Accept': 'application/json',
      },
    })

    if (res.ok) {
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = triwulan
        ? `Rekap_K3_${id_wilayah === 1 ? 'BJM' : 'BTL'}_${tahun}_TW${triwulan}.xlsx`
        : `Rekap_K3_${id_wilayah === 1 ? 'BJM' : 'BTL'}_${tahun}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      return true
    }
  } catch (e) {
    console.warn('Ekspor backend gagal atau offline, fallback ke SheetJS lokal:', e)
  }
  return false
}
