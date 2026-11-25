<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  apiGetMasterWilayah,
  apiGetDaftarLaporan,
  apiHapusLaporan,
  apiFinalkanLaporan,
  apiBukaKembaliLaporan,
  apiGetLaporanLog,
  apiUnduhExcelResmi,
} from '../lib/api'
import { formList } from '../forms'

const route = useRoute()
const router = useRouter()
const items = ref([])
const daftarWilayah = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const feedbackMessage = ref('')

// State Filter & Pencarian Daftar Laporan Tersimpan
const daftarFilter = reactive({
  q: '',
  id_wilayah: '',
  tahun: '',
  status: 'semua',
})

// State Ekspor Excel Resmi Balai (GET /api/ekspor/excel: K1 s.d. K10)
const isExporting = ref(false)
const exportingRowId = ref(null)
const eksporFilter = reactive({
  id_wilayah: 1,
  tahun: new Date().getFullYear(),
  triwulan: '',
})

const triwulanEksporOptions = [
  { value: '', label: 'Satu Tahun Penuh (Jan - Des)' },
  { value: 1, label: 'Triwulan I (Jan - Mar)' },
  { value: 2, label: 'Triwulan II (Apr - Jun)' },
  { value: 3, label: 'Triwulan III (Jul - Sep)' },
  { value: 4, label: 'Triwulan IV (Okt - Des)' },
]

// Daftar tahun tersedia dari arsip laporan + tahun default
const tahunTersedia = computed(() => {
  const set = new Set([new Date().getFullYear(), 2026])
  items.value.forEach(it => {
    if (it.tahun) set.add(Number(it.tahun))
  })
  return Array.from(set).sort((a, b) => b - a)
})

// State Modal Konfirmasi Hapus
const isConfirmOpen = ref(false)
const itemToDelete = ref(null)

// State Modal Riwayat Perubahan
const isLogOpen = ref(false)
const activeLogs = ref([])
const activeLogTitle = ref('')
const isLogLoading = ref(false)

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

function matchesNonStatusFilter(item) {
  if (daftarFilter.id_wilayah !== '' && Number(item.id_wilayah) !== Number(daftarFilter.id_wilayah)) {
    return false
  }
  if (daftarFilter.tahun !== '' && Number(item.tahun) !== Number(daftarFilter.tahun)) {
    return false
  }
  const keyword = daftarFilter.q.trim().toLowerCase()
  if (keyword) {
    const namaWil = (item.wilayah?.nama_kabupaten_kota || '').toLowerCase()
    const kodeWil = (item.wilayah?.kode_wilayah || (item.id_wilayah === 1 ? 'bjm' : 'btl')).toLowerCase()
    const namaBulan = (bulanNames[item.bulan] || '').toLowerCase()
    const twText = `tw ${item.triwulan} triwulan ${item.triwulan}`.toLowerCase()
    const idText = `#${item.id_laporan} ${item.id_laporan}`
    const tahunText = String(item.tahun || '')
    const statusText = (item.status_laporan || '').toLowerCase()
    const tanggalText = String(item.tanggal_laporan || '').slice(0, 10)
    const haystack = `${namaWil} ${kodeWil} ${namaBulan} ${twText} ${idText} ${tahunText} ${statusText} ${tanggalText}`
    if (!haystack.includes(keyword)) {
      return false
    }
  }
  return true
}

const baseFilteredItems = computed(() => items.value.filter(matchesNonStatusFilter))

const statusCounts = computed(() => {
  const list = baseFilteredItems.value
  let draf = 0
  let finalCount = 0
  list.forEach(it => {
    if (it.status_laporan === 'final') finalCount += 1
    else draf += 1
  })
  return {
    semua: list.length,
    draf,
    final: finalCount,
  }
})

const filteredItems = computed(() => {
  if (daftarFilter.status === 'semua') return baseFilteredItems.value
  return baseFilteredItems.value.filter(it => it.status_laporan === daftarFilter.status)
})

const hasActiveFilter = computed(() => {
  return Boolean(
    daftarFilter.q.trim() ||
    daftarFilter.id_wilayah !== '' ||
    daftarFilter.tahun !== '' ||
    daftarFilter.status !== 'semua'
  )
})

function resetFilterDaftar() {
  daftarFilter.q = ''
  daftarFilter.id_wilayah = ''
  daftarFilter.tahun = ''
  daftarFilter.status = 'semua'
}

function handleKeydown(event) {
  if (event.key !== 'Escape') return
  if (confirmModal.open) {
    batalKonfirmasiAksi()
  } else if (isConfirmOpen.value) {
    batalHapus()
  } else if (isLogOpen.value) {
    isLogOpen.value = false
  }
}

async function muatDaftar() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [wilayahRes, daftarRes] = await Promise.all([
      apiGetMasterWilayah(),
      apiGetDaftarLaporan(),
    ])
    daftarWilayah.value = wilayahRes
    items.value = daftarRes

    if (daftarWilayah.value.length > 0 && !daftarWilayah.value.some(w => w.id_wilayah === eksporFilter.id_wilayah)) {
      eksporFilter.id_wilayah = daftarWilayah.value[0].id_wilayah
    }
    if (daftarRes.length > 0 && !daftarRes.some(d => Number(d.tahun) === Number(eksporFilter.tahun))) {
      eksporFilter.tahun = Number(daftarRes[0].tahun)
    }
  } catch (err) {
    errorMessage.value = 'Gagal memuat arsip laporan: ' + (err.message || err)
  } finally {
    isLoading.value = false
  }
}

async function downloadExcelRekap() {
  isExporting.value = true
  errorMessage.value = ''
  feedbackMessage.value = ''
  try {
    const wilObj = daftarWilayah.value.find(w => w.id_wilayah === Number(eksporFilter.id_wilayah)) || null
    const twVal = eksporFilter.triwulan === '' ? null : Number(eksporFilter.triwulan)

    const result = await apiUnduhExcelResmi({
      id_wilayah: Number(eksporFilter.id_wilayah),
      tahun: Number(eksporFilter.tahun),
      triwulan: twVal,
      kodeWilayah: wilObj?.kode_wilayah || null,
    })

    const labelPeriode = twVal ? `Triwulan ${twVal}` : 'Satu Tahun Penuh'
    feedbackMessage.value = `Berhasil mengunduh ${result.fileName} (Rekap resmi K1 s.d. K10, ${labelPeriode} ${eksporFilter.tahun}).`
    setTimeout(() => {
      if (feedbackMessage.value.startsWith('Berhasil mengunduh')) feedbackMessage.value = ''
    }, 6000)
  } catch (err) {
    errorMessage.value = 'Gagal mengunduh berkas Excel resmi: ' + (err.message || err)
  } finally {
    isExporting.value = false
  }
}

async function downloadExcelBaris(item) {
  exportingRowId.value = item.id_laporan
  errorMessage.value = ''
  feedbackMessage.value = ''
  try {
    const wilObj = item.wilayah || daftarWilayah.value.find(w => w.id_wilayah === Number(item.id_wilayah)) || null
    const result = await apiUnduhExcelResmi({
      id_wilayah: Number(item.id_wilayah),
      tahun: Number(item.tahun),
      triwulan: Number(item.triwulan),
      kodeWilayah: wilObj?.kode_wilayah || null,
    })

    feedbackMessage.value = `Berhasil mengunduh ${result.fileName} (Rekap resmi K1 s.d. K10 Triwulan ${item.triwulan} ${item.tahun}).`
    setTimeout(() => {
      if (feedbackMessage.value.startsWith('Berhasil mengunduh')) feedbackMessage.value = ''
    }, 6000)
  } catch (err) {
    errorMessage.value = 'Gagal mengunduh berkas Excel: ' + (err.message || err)
  } finally {
    exportingRowId.value = null
  }
}

function bukaLaporan(item, targetModul) {
  const modul = (targetModul || item.kode || item.modul || 'k1').toLowerCase()
  router.push({
    path: `/input/${modul}`,
    query: {
      id_wilayah: item.id_wilayah,
      bulan: item.bulan,
      tahun: item.tahun,
    },
  })
}

function getNamaModul(kode) {
  const found = formList.find(f => f.kode.toUpperCase() === String(kode).toUpperCase())
  return found ? `${found.kode} - ${found.nama}` : kode
}

function pilihDanBuka(item, event) {
  const modul = event.target.value
  if (!modul) return
  event.target.value = ''
  bukaLaporan(item, modul)
}

function mintaKonfirmasiHapus(item) {
  if (item.status_laporan === 'final') {
    errorMessage.value = 'Laporan berstatus Final (Terkunci) tidak dapat dihapus. Buka kembali terlebih dahulu bila perlu menghapus.'
    return
  }
  itemToDelete.value = item
  isConfirmOpen.value = true
}

function batalHapus() {
  itemToDelete.value = null
  isConfirmOpen.value = false
}

async function prosesHapus() {
  if (!itemToDelete.value) return
  const target = itemToDelete.value
  isConfirmOpen.value = false
  isLoading.value = true

  try {
    await apiHapusLaporan(target.id_laporan)
    feedbackMessage.value = `Laporan #${target.id_laporan} (${target.wilayah?.nama_kabupaten_kota} - ${bulanNames[target.bulan]} ${target.tahun}) berhasil dihapus.`
    setTimeout(() => {
      feedbackMessage.value = ''
    }, 4000)
    await muatDaftar()
  } catch (err) {
    errorMessage.value = 'Gagal menghapus laporan: ' + (err.message || err)
  } finally {
    isLoading.value = false
    itemToDelete.value = null
  }
}

// State Pop-up Konfirmasi Iya / Tidak (Download Excel, Finalkan, Buka Kembali)
const confirmModal = reactive({
  open: false,
  action: null,
  item: null,
  title: '',
  message: '',
  danger: false,
})

function mintaKonfirmasiAksi(action, item = null) {
  if (action === 'excel_rekap') {
    const wilObj = daftarWilayah.value.find(w => w.id_wilayah === Number(eksporFilter.id_wilayah))
    const namaWil = wilObj?.nama_kabupaten_kota || 'Wilayah terpilih'
    const periodeLabel =
      triwulanEksporOptions.find(opt => String(opt.value) === String(eksporFilter.triwulan))?.label ||
      'Satu Tahun Penuh'
    confirmModal.title = 'Konfirmasi Unduh Excel'
    confirmModal.message = `Apakah Anda yakin ingin mengunduh berkas Excel resmi K1 s.d. K10 untuk ${namaWil} periode ${periodeLabel} ${eksporFilter.tahun}?`
    confirmModal.danger = false
  } else if (action === 'excel_baris' && item) {
    const namaWil = item.wilayah?.nama_kabupaten_kota || `Wilayah ${item.id_wilayah}`
    confirmModal.title = 'Konfirmasi Unduh Excel'
    confirmModal.message = `Apakah Anda yakin ingin mengunduh berkas Excel resmi K1 s.d. K10 untuk ${namaWil} Triwulan ${item.triwulan} tahun ${item.tahun}?`
    confirmModal.danger = false
  } else if (action === 'finalkan' && item) {
    confirmModal.title = 'Konfirmasi Finalkan Laporan'
    confirmModal.message = `Apakah Anda yakin ingin memfinalkan laporan #${item.id_laporan}? Data akan dikunci dan tidak dapat diubah sebelum dibuka kembali.`
    confirmModal.danger = false
  } else if (action === 'buka_kembali' && item) {
    confirmModal.title = 'Konfirmasi Buka Kembali Laporan'
    confirmModal.message = `Apakah Anda yakin ingin membuka kembali laporan #${item.id_laporan} ke status Draf?`
    confirmModal.danger = true
  } else {
    return
  }
  confirmModal.action = action
  confirmModal.item = item
  confirmModal.open = true
}

function batalKonfirmasiAksi() {
  confirmModal.open = false
  confirmModal.action = null
  confirmModal.item = null
}

async function lanjutKonfirmasiAksi() {
  const action = confirmModal.action
  const item = confirmModal.item
  confirmModal.open = false
  confirmModal.action = null
  confirmModal.item = null

  if (action === 'excel_rekap') {
    await downloadExcelRekap()
  } else if (action === 'excel_baris' && item) {
    await downloadExcelBaris(item)
  } else if (action === 'finalkan' && item) {
    await prosesFinalkan(item)
  } else if (action === 'buka_kembali' && item) {
    await prosesBukaKembali(item)
  }
}

async function prosesFinalkan(item) {
  try {
    await apiFinalkanLaporan(item.id_laporan)
    feedbackMessage.value = `Laporan #${item.id_laporan} telah difinalkan dan dikunci.`
    await muatDaftar()
  } catch (err) {
    errorMessage.value = err.message || 'Gagal memfinalkan laporan.'
  }
}

async function prosesBukaKembali(item) {
  try {
    await apiBukaKembaliLaporan(item.id_laporan)
    feedbackMessage.value = `Laporan #${item.id_laporan} dibuka kembali ke status draf.`
    await muatDaftar()
  } catch (err) {
    errorMessage.value = err.message || 'Gagal membuka kembali laporan.'
  }
}

async function lihatLog(item) {
  activeLogTitle.value = `Riwayat Perubahan #${item.id_laporan} - ${item.wilayah?.nama_kabupaten_kota} (${bulanNames[item.bulan]} ${item.tahun})`
  isLogOpen.value = true
  isLogLoading.value = true
  try {
    activeLogs.value = await apiGetLaporanLog(item.id_laporan)
  } catch (err) {
    activeLogs.value = []
  } finally {
    isLogLoading.value = false
  }
}

function formatWaktu(isoString) {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return isoString
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  const qStatus = String(route.query.status || '').toLowerCase()
  if (qStatus === 'draf' || qStatus === 'final') {
    daftarFilter.status = qStatus
  }
  muatDaftar()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Judul Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-black">Laporan Tersimpan</h1>
        <p class="text-xs sm:text-sm text-black font-bold">Daftar dokumen laporan bulanan dan status finalisasi (UPTD Balai Wilayah I).</p>
      </div>

      <button
        @click="muatDaftar"
        :disabled="isLoading"
        class="self-start sm:self-auto px-4 py-2 bg-white hover:bg-slate-100 border-2 border-slate-400 text-slate-900 text-xs font-black rounded-lg transition flex items-center gap-2 cursor-pointer shadow-xs"
      >
        <svg :class="['w-3.5 h-3.5 text-black', isLoading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Segarkan
      </button>
    </div>

    <!-- Feedback Message (Abu-abu & Teks Hitam) -->
    <div v-if="feedbackMessage" class="p-4 rounded-xl bg-slate-100 border-2 border-slate-600 text-black text-sm flex items-center gap-2 shadow-xs">
      <svg class="w-5 h-5 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
      </svg>
      <span class="font-black text-black">{{ feedbackMessage }}</span>
    </div>

    <!-- Error Message (Merah & Teks Hitam) -->
    <div v-if="errorMessage" class="p-4 rounded-xl bg-red-100 border-2 border-red-500 text-black text-sm flex items-center gap-2 shadow-xs">
      <svg class="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="font-bold text-black">{{ errorMessage }}</span>
    </div>

    <!-- KARTU UNDUH EXCEL GABUNGAN (K1 s.d. K10 DALAM 1 BERKAS) -->
    <section class="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 class="text-sm sm:text-base font-black text-black flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-900 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Unduh Rekap Excel Gabungan (K1 s.d. K10)
          </h2>
          <p class="text-xs text-slate-700 font-bold mt-0.5">
            Satu berkas Excel lengkap berisi seluruh formulir K1 s.d. K10 (K1, K2, K3, K4, K5, K6, K7, K8a, K8b, K8c, K9a, K9b, K10).
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <!-- Wilayah -->
        <div>
          <label for="ekspor-wilayah" class="block text-xs font-black text-black mb-1">Wilayah Pengawasan</label>
          <select
            id="ekspor-wilayah"
            v-model.number="eksporFilter.id_wilayah"
            class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-xs focus:border-slate-700"
          >
            <option v-for="w in daftarWilayah" :key="w.id_wilayah" :value="w.id_wilayah">
              {{ w.nama_kabupaten_kota }} ({{ w.kode_wilayah }})
            </option>
          </select>
        </div>

        <!-- Tahun -->
        <div>
          <label for="ekspor-tahun" class="block text-xs font-black text-black mb-1">Tahun</label>
          <select
            id="ekspor-tahun"
            v-model.number="eksporFilter.tahun"
            class="w-full bg-white border-2 border-slate-300 text-black font-mono font-black rounded-lg px-3 py-2 text-xs focus:border-slate-700"
          >
            <option v-for="th in tahunTersedia" :key="th" :value="th">
              {{ th }}
            </option>
          </select>
        </div>

        <!-- Periode (Satu Tahun Penuh atau Triwulan I-IV) -->
        <div>
          <label for="ekspor-periode" class="block text-xs font-black text-black mb-1">Periode Rekap</label>
          <select
            id="ekspor-periode"
            v-model="eksporFilter.triwulan"
            class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-xs focus:border-slate-700"
          >
            <option v-for="opt in triwulanEksporOptions" :key="String(opt.value)" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Tombol Unduh -->
        <div>
          <button
            type="button"
            @click="mintaKonfirmasiAksi('excel_rekap')"
            :disabled="isExporting || isLoading || daftarWilayah.length === 0"
            class="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs rounded-lg shadow-xs border-2 border-slate-900 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg v-if="isExporting" class="animate-spin w-4 h-4 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <svg v-else class="w-4 h-4 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span>{{ isExporting ? 'Menyiapkan Excel...' : (eksporFilter.triwulan ? `Unduh Excel TW ${eksporFilter.triwulan}` : `Unduh Excel ${eksporFilter.tahun}`) }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Tabel Dokumen Laporan Bulanan (Putih) -->
    <section class="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-xs space-y-4">
      <!-- Bar Filter & Pencarian -->
      <div class="pb-4 border-b-2 border-slate-200 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 class="text-sm sm:text-base font-black text-black">
            Daftar Dokumen Laporan
          </h2>
          <div class="flex items-center gap-2.5 text-xs font-bold text-slate-700">
            <span v-if="!isLoading">
              Menampilkan <strong class="text-black">{{ filteredItems.length }}</strong> dari <strong class="text-black">{{ items.length }}</strong> laporan
            </span>
            <button
              v-if="hasActiveFilter"
              type="button"
              @click="resetFilterDaftar"
              class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-400 rounded-lg text-xs font-black transition cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <!-- Pencarian -->
          <div class="lg:col-span-4">
            <label for="filter-pencarian" class="block text-xs font-black text-black mb-1">Pencarian</label>
            <div class="relative">
              <svg
                class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/>
              </svg>
              <input
                id="filter-pencarian"
                v-model="daftarFilter.q"
                type="search"
                placeholder="Cari wilayah, bulan, atau no. dokumen..."
                class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg pl-9 pr-8 py-2 text-xs focus:border-slate-700"
              />
              <button
                v-if="daftarFilter.q"
                type="button"
                @click="daftarFilter.q = ''"
                aria-label="Hapus kata kunci pencarian"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-black rounded cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Filter Wilayah -->
          <div class="lg:col-span-3">
            <label for="filter-wilayah" class="block text-xs font-black text-black mb-1">Wilayah</label>
            <select
              id="filter-wilayah"
              v-model="daftarFilter.id_wilayah"
              class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-xs focus:border-slate-700"
            >
              <option value="">Semua Wilayah</option>
              <option v-for="w in daftarWilayah" :key="w.id_wilayah" :value="w.id_wilayah">
                {{ w.nama_kabupaten_kota }} ({{ w.kode_wilayah }})
              </option>
            </select>
          </div>

          <!-- Filter Tahun -->
          <div class="lg:col-span-2">
            <label for="filter-tahun" class="block text-xs font-black text-black mb-1">Tahun</label>
            <select
              id="filter-tahun"
              v-model="daftarFilter.tahun"
              class="w-full bg-white border-2 border-slate-300 text-black font-mono font-black rounded-lg px-3 py-2 text-xs focus:border-slate-700"
            >
              <option value="">Semua Tahun</option>
              <option v-for="th in tahunTersedia" :key="th" :value="th">
                {{ th }}
              </option>
            </select>
          </div>

          <!-- Filter Status -->
          <div class="lg:col-span-3">
            <span class="block text-xs font-black text-black mb-1">Status</span>
            <div
              role="group"
              aria-label="Filter status laporan"
              class="grid grid-cols-3 rounded-lg border-2 border-slate-300 overflow-hidden bg-slate-100"
            >
              <button
                type="button"
                @click="daftarFilter.status = 'semua'"
                :aria-pressed="daftarFilter.status === 'semua'"
                :class="[
                  'py-2 px-2 text-xs font-black transition cursor-pointer',
                  daftarFilter.status === 'semua'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-800 hover:bg-slate-100'
                ]"
              >
                Semua ({{ statusCounts.semua }})
              </button>
              <button
                type="button"
                @click="daftarFilter.status = 'draf'"
                :aria-pressed="daftarFilter.status === 'draf'"
                :class="[
                  'py-2 px-2 text-xs font-black border-l border-slate-300 transition cursor-pointer',
                  daftarFilter.status === 'draf'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-800 hover:bg-slate-100'
                ]"
              >
                Draf ({{ statusCounts.draf }})
              </button>
              <button
                type="button"
                @click="daftarFilter.status = 'final'"
                :aria-pressed="daftarFilter.status === 'final'"
                :class="[
                  'py-2 px-2 text-xs font-black border-l border-slate-300 transition cursor-pointer',
                  daftarFilter.status === 'final'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-800 hover:bg-slate-100'
                ]"
              >
                Final ({{ statusCounts.final }})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="py-16 text-center text-black font-bold">
        <svg class="animate-spin w-8 h-8 text-black mx-auto mb-3" aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <p class="text-sm">Memuat dokumen laporan...</p>
      </div>

      <!-- Jika Kosong Total -->
      <div v-else-if="items.length === 0" class="py-16 text-center text-black">
        <div class="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-400 flex items-center justify-center mx-auto mb-3 text-slate-700">
          <svg class="w-6 h-6 text-slate-700" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
        </div>
        <p class="text-base font-black text-black mb-1">Belum ada dokumen laporan bulanan</p>
        <p class="text-xs text-slate-600 font-bold mb-4">Buat laporan bulanan melalui menu Formulir K1.</p>
        <router-link
          to="/input/k1"
          class="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black transition cursor-pointer border-2 border-slate-900 shadow-xs"
        >
          <span>Isi Formulir K1</span>
        </router-link>
      </div>

      <!-- Jika Hasil Filter Kosong -->
      <div v-else-if="filteredItems.length === 0" class="py-14 text-center text-black">
        <div class="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-400 flex items-center justify-center mx-auto mb-3 text-slate-700">
          <svg class="w-6 h-6 text-slate-700" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/>
          </svg>
        </div>
        <p class="text-base font-black text-black mb-1">Tidak ada laporan yang cocok dengan filter</p>
        <p class="text-xs text-slate-600 font-bold mb-4">Coba ubah pilihan wilayah, tahun, status, atau kata kunci pencarian.</p>
        <button
          type="button"
          @click="resetFilterDaftar"
          class="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black transition cursor-pointer border-2 border-slate-900 shadow-xs"
        >
          Tampilkan Semua Laporan
        </button>
      </div>

      <!-- Tabel Daftar Laporan -->
      <div v-else class="overflow-x-auto rounded-lg border-2 border-slate-400 shadow-xs">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-900 text-white border-b-2 border-slate-900">
              <th class="p-3 font-black text-center w-16">No. Dok</th>
              <th class="p-3 font-black">Wilayah</th>
              <th class="p-3 font-black text-center">Formulir</th>
              <th class="p-3 font-black">Periode (Bulan & TW)</th>
              <th class="p-3 font-black text-center">Tahun</th>
              <th class="p-3 font-black text-center">Status</th>
              <th class="p-3 font-black">Tanggal Laporan</th>
              <th class="p-3 font-black text-center min-w-[280px]">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-300 text-black">
            <tr
              v-for="item in filteredItems"
              :key="item.id_laporan"
              class="hover:bg-slate-50/70 transition font-bold"
            >
              <!-- No. Dok -->
              <td class="p-3 text-center font-mono text-black font-black">
                #{{ item.id_laporan }}
              </td>

              <!-- Wilayah -->
              <td class="p-3">
                <div class="font-black text-black">
                  {{ item.wilayah?.nama_kabupaten_kota || 'Wilayah ' + item.id_wilayah }}
                </div>
                <div class="text-[10px] text-slate-700 font-mono font-bold">
                  Kode: {{ item.wilayah?.kode_wilayah || (item.id_wilayah === 1 ? 'BJM' : 'BTL') }}
                </div>
              </td>

              <!-- Formulir -->
              <td class="p-3 text-center">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-black bg-slate-200 text-slate-900 border border-slate-400 whitespace-nowrap"
                  :title="(item.modul_list?.length ? item.modul_list : [item.kode || 'K1']).join(', ')"
                >
                  K1 s.d. K10
                  <span class="text-[10px] text-slate-600 font-bold">({{ item.modul_list?.length || 1 }})</span>
                </span>
              </td>

              <!-- Periode -->
              <td class="p-3 whitespace-nowrap">
                <span class="text-black font-black">{{ bulanNames[item.bulan] || `Bulan ${item.bulan}` }}</span>
                <span class="text-[10px] ml-1.5 px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-400 font-black inline-block whitespace-nowrap">
                  TW {{ item.triwulan }}
                </span>
              </td>

              <!-- Tahun -->
              <td class="p-3 text-center font-mono font-black text-black">{{ item.tahun }}</td>

              <!-- Status Badge (Draf | Final) -->
              <td class="p-3 text-center">
                <!-- Draf (Abu-abu muda) -->
                <span
                  v-if="item.status_laporan === 'draf'"
                  class="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-200 text-slate-900 border border-slate-400 inline-flex items-center gap-1"
                >
                  <span class="w-2 h-2 rounded-full bg-slate-600"></span>
                  Draf
                </span>
                <!-- Final (Abu-abu gelap teks putih, terkunci) -->
                <span
                  v-else-if="item.status_laporan === 'final'"
                  class="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-800 text-white border-2 border-slate-900 inline-flex items-center gap-1"
                  title="Terkunci (pengesahan dilakukan secara manual di luar sistem)"
                >
                  <svg class="w-3 h-3 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  Final
                </span>
              </td>

              <!-- Tanggal Laporan & Waktu Input -->
              <td class="p-3 text-xs text-black">
                <div class="text-black font-mono font-black">{{ item.tanggal_laporan ? String(item.tanggal_laporan).slice(0, 10) : '-' }}</div>
                <div class="text-[10px] text-slate-600 font-mono font-semibold">{{ formatWaktu(item.waktu_input) }}</div>
              </td>

              <!-- Aksi -->
              <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-1.5 flex-wrap">
                  <!-- Dropdown Buka Formulir (K1 s.d. K10) -->
                  <select
                    @change="pilihDanBuka(item, $event)"
                    aria-label="Pilih formulir untuk dibuka"
                    class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-black transition cursor-pointer border-2 border-slate-900 shadow-xs"
                  >
                    <option value="" selected>Buka Formulir ▾</option>
                    <option
                      v-for="m in (item.modul_list?.length ? item.modul_list : [item.kode || 'K1'])"
                      :key="m"
                      :value="m"
                      class="bg-white text-black font-bold"
                    >
                      {{ getNamaModul(m) }}
                    </option>
                  </select>

                  <!-- Unduh Excel Gabungan K1-K10 untuk bulan ini -->
                  <button
                    type="button"
                    @click="mintaKonfirmasiAksi('excel_baris', item)"
                    :disabled="exportingRowId === item.id_laporan"
                    class="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-black transition cursor-pointer border-2 border-slate-800 shadow-xs inline-flex items-center gap-1 disabled:opacity-50"
                    :title="`Unduh berkas Excel resmi K1 s.d. K10 untuk Triwulan ${item.triwulan} ${item.tahun}`"
                  >
                    <svg v-if="exportingRowId === item.id_laporan" class="animate-spin w-3 h-3 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <svg v-else class="w-3 h-3 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    <span>Excel</span>
                  </button>

                  <!-- Finalkan (Jika Draf) -->
                  <button
                    type="button"
                    v-if="item.status_laporan === 'draf'"
                    @click="mintaKonfirmasiAksi('finalkan', item)"
                    class="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 rounded text-xs font-black transition cursor-pointer shadow-xs"
                    title="Finalkan dan kunci laporan"
                  >
                    Finalkan
                  </button>

                  <!-- Buka Kembali (Jika Final) -->
                  <button
                    type="button"
                    v-if="item.status_laporan === 'final'"
                    @click="mintaKonfirmasiAksi('buka_kembali', item)"
                    class="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-950 border border-red-500 rounded text-xs font-black transition cursor-pointer"
                    title="Buka kembali laporan ke status Draf"
                  >
                    Buka Kembali
                  </button>

                  <!-- Riwayat -->
                  <button
                    type="button"
                    @click="lihatLog(item)"
                    class="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-400 text-black rounded text-xs font-bold transition cursor-pointer"
                    title="Lihat Riwayat Perubahan"
                  >
                    Riwayat
                  </button>

                  <!-- Hapus (Merah pekat, hanya saat Draf) -->
                  <button
                    type="button"
                    v-if="item.status_laporan !== 'final'"
                    @click="mintaKonfirmasiHapus(item)"
                    class="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-black transition cursor-pointer shadow-xs border border-red-800"
                    title="Hapus Laporan"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- POP-UP KONFIRMASI IYA / TIDAK (EXCEL, FINALKAN, BUKA KEMBALI) -->
    <div
      v-if="confirmModal.open"
      @click.self="batalKonfirmasiAksi"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tersimpan-confirm-title"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div class="bg-white border-2 border-slate-400 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div
          :class="[
            'w-12 h-12 rounded-full border-2 flex items-center justify-center',
            confirmModal.danger
              ? 'bg-red-100 border-red-500 text-red-600'
              : 'bg-slate-100 border-slate-400 text-slate-800'
          ]"
        >
          <svg v-if="confirmModal.danger" class="w-6 h-6 text-red-600" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <svg v-else class="w-6 h-6 text-slate-800" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>

        <div>
          <h3 id="tersimpan-confirm-title" class="text-lg font-black text-black">{{ confirmModal.title }}</h3>
          <p class="text-xs sm:text-sm text-slate-700 font-bold mt-1.5 leading-relaxed">
            {{ confirmModal.message }}
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="batalKonfirmasiAksi"
            class="px-5 py-2 bg-white hover:bg-slate-100 text-black font-black text-xs sm:text-sm rounded-lg border-2 border-slate-400 transition cursor-pointer"
          >
            Tidak
          </button>
          <button
            type="button"
            @click="lanjutKonfirmasiAksi"
            :class="[
              'px-5 py-2 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs transition cursor-pointer border-2',
              confirmModal.danger
                ? 'bg-red-600 hover:bg-red-500 border-red-800'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-900'
            ]"
          >
            Iya
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL KONFIRMASI HAPUS (MERAH) -->
    <div
      v-if="isConfirmOpen"
      @click.self="batalHapus"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hapus-dialog-title"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div class="bg-white border-2 border-slate-400 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="w-12 h-12 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center text-red-600">
          <svg class="w-6 h-6 text-red-600" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>

        <div>
          <h3 id="hapus-dialog-title" class="text-lg font-black text-black">Konfirmasi Hapus Laporan</h3>
          <p class="text-xs sm:text-sm text-black font-bold mt-1.5">
            Apakah Anda yakin ingin menghapus dokumen laporan bulanan ini:
          </p>
          <div class="mt-2.5 p-3 rounded-lg bg-slate-50 border-2 border-slate-300 text-xs space-y-1 font-bold">
            <div><strong class="text-black">No. Dokumen:</strong> #{{ itemToDelete?.id_laporan }}</div>
            <div><strong class="text-black">Wilayah:</strong> {{ itemToDelete?.wilayah?.nama_kabupaten_kota }}</div>
            <div><strong class="text-black">Periode:</strong> {{ bulanNames[itemToDelete?.bulan] }} {{ itemToDelete?.tahun }} (TW {{ itemToDelete?.triwulan }})</div>
          </div>
          <p class="text-xs text-red-700 font-black mt-2">
            Seluruh data formulir K1 s.d. K10 di dalam laporan ini akan terhapus secara permanen.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="batalHapus"
            class="px-4 py-2 bg-white hover:bg-slate-100 text-black font-black text-xs sm:text-sm rounded-lg border-2 border-slate-400 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            @click="prosesHapus"
            class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs transition cursor-pointer border-2 border-red-800"
          >
            Ya, Hapus Laporan
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL RIWAYAT PERUBAHAN -->
    <div
      v-if="isLogOpen"
      @click.self="isLogOpen = false"
      role="dialog"
      aria-modal="true"
      aria-labelledby="riwayat-dialog-title"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div class="bg-white border-2 border-slate-400 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b-2 border-slate-300">
          <h3 id="riwayat-dialog-title" class="text-sm font-black text-black flex items-center gap-2">
            <svg class="w-4 h-4 text-black" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ activeLogTitle }}
          </h3>
          <button
            type="button"
            @click="isLogOpen = false"
            aria-label="Tutup jendela riwayat perubahan"
            class="text-black font-black hover:bg-slate-200 px-2 py-1 rounded border border-slate-400 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div v-if="isLogLoading" class="py-8 text-center text-black font-black text-xs">
          Memuat riwayat perubahan...
        </div>

        <div v-else-if="activeLogs.length === 0" class="py-8 text-center text-black font-bold text-xs">
          Belum ada riwayat aktivitas pada laporan ini.
        </div>

        <div v-else class="space-y-3 max-h-80 overflow-y-auto pr-1">
          <div
            v-for="(log, idx) in activeLogs"
            :key="idx"
            class="p-3 rounded-lg bg-slate-50 border-2 border-slate-300 text-xs space-y-1"
          >
            <div class="flex items-center justify-between">
              <span class="font-black text-black bg-slate-200 px-2 py-0.5 rounded border border-slate-400">{{ log.aksi }}</span>
              <span class="text-[10px] text-black font-mono font-bold">{{ formatWaktu(log.waktu) }}</span>
            </div>
            <p class="text-black font-bold">{{ log.catatan }}</p>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="button"
            @click="isLogOpen = false"
            class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-lg transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
