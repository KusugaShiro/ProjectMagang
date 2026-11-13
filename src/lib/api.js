/**
 * Lapisan API Laporan Pengawasan Ketenagakerjaan
 * 
 * CATATAN PENGEMBANGAN BACKEND:
 * GANTI DENGAN PANGGILAN KE BACKEND SUNGGUHAN (Fetch / Axios).
 * Variabel dasar API membaca dari import.meta.env.VITE_API_URL.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const STORAGE_KEY = 'laporan_pengawasan_db_v1'

// Helper internal storage sementara
function getRawStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    console.error('Gagal membaca storage lokal:', e)
    return {}
  }
}

function saveRawStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Gagal menulis storage lokal:', e)
  }
}

function buatKunciLaporan({ kode, wilayah, jenis, periode, tahun }) {
  const k = (kode || '').toUpperCase().trim()
  const w = (wilayah || '').trim()
  const j = (jenis || '').trim()
  const p = (periode || '').trim()
  const t = String(tahun || '').trim()
  return `${k}__${w}__${j}__${p}__${t}`
}

/**
 * Mengambil data laporan berdasarkan parameter kunci unik.
 * @param {Object} params { kode, wilayah, jenis, periode, tahun }
 * @returns {Promise<Object|null>} data laporan atau null bila belum ada
 */
export async function ambilLaporan({ kode, wilayah, jenis, periode, tahun }) {
  // GANTI DENGAN PANGGILAN KE BACKEND:
  // const res = await fetch(`${API_BASE_URL}/laporan?kode=${kode}&wilayah=${wilayah}&jenis=${jenis}&periode=${periode}&tahun=${tahun}`)
  // if (res.status === 404) return null
  // return await res.json()

  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getRawStorage()
      const key = buatKunciLaporan({ kode, wilayah, jenis, periode, tahun })
      const record = db[key]
      if (!record) {
        resolve(null)
      } else {
        // kembalikan clone data
        resolve(JSON.parse(JSON.stringify(record.data)))
      }
    }, 150)
  })
}

/**
 * Menyimpan atau memperbarui data laporan.
 * @param {Object} params { kode, wilayah, jenis, periode, tahun }
 * @param {Object} data Objek baris dan nilai isian form
 * @returns {Promise<{ success: boolean, updatedAt: string }>}
 */
export async function simpanLaporan({ kode, wilayah, jenis, periode, tahun }, data) {
  // GANTI DENGAN PANGGILAN KE BACKEND:
  // const res = await fetch(`${API_BASE_URL}/laporan`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ kode, wilayah, jenis, periode, tahun, data })
  // })
  // return await res.json()

  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getRawStorage()
      const key = buatKunciLaporan({ kode, wilayah, jenis, periode, tahun })
      const now = new Date().toISOString()

      db[key] = {
        meta: {
          kode: (kode || '').toUpperCase().trim(),
          wilayah: (wilayah || '').trim(),
          jenis: (jenis || '').trim(),
          periode: (periode || '').trim(),
          tahun: Number(tahun),
          updatedAt: now,
        },
        data: JSON.parse(JSON.stringify(data)),
      }

      saveRawStorage(db)
      resolve({ success: true, updatedAt: now })
    }, 200)
  })
}

/**
 * Mengambil daftar ringkas seluruh laporan tersimpan.
 * @returns {Promise<Array<{ kode, wilayah, jenis, periode, tahun, updatedAt, key }>>}
 */
export async function daftarLaporan() {
  // GANTI DENGAN PANGGILAN KE BACKEND:
  // const res = await fetch(`${API_BASE_URL}/laporan/daftar`)
  // return await res.json()

  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getRawStorage()
      const list = Object.keys(db).map((key) => {
        const item = db[key]
        return {
          key,
          ...item.meta,
        }
      })
      // Urutkan dari yang terbaru disimpan
      list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      resolve(list)
    }, 150)
  })
}

/**
 * Menghapus laporan berdasarkan parameter kunci unik.
 * @param {Object} params { kode, wilayah, jenis, periode, tahun }
 * @returns {Promise<{ success: boolean }>}
 */
export async function hapusLaporan({ kode, wilayah, jenis, periode, tahun }) {
  // GANTI DENGAN PANGGILAN KE BACKEND:
  // const res = await fetch(`${API_BASE_URL}/laporan?kode=${kode}&wilayah=${wilayah}&jenis=${jenis}&periode=${periode}&tahun=${tahun}`, {
  //   method: 'DELETE'
  // })
  // return await res.json()

  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getRawStorage()
      const key = buatKunciLaporan({ kode, wilayah, jenis, periode, tahun })
      if (db[key]) {
        delete db[key]
        saveRawStorage(db)
      }
      resolve({ success: true })
    }, 150)
  })
}
