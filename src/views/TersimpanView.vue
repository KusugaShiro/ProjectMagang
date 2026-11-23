<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  apiGetMasterWilayah,
  apiGetDaftarLaporan,
  apiHapusLaporan,
  apiFinalkanLaporan,
  apiBukaKembaliLaporan,
  apiGetLaporanLog,
  hapusTandaTangan,
} from '../lib/api'
import { exportRekapK1K10ToExcel } from '../lib/excelRekap'
import { formList } from '../forms'

const router = useRouter()
const items = ref([])
const daftarWilayah = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const feedbackMessage = ref('')

// State Ekspor Excel Gabungan (K1 s.d. K10 dalam 1 berkas)
const isExporting = ref(false)
const exportingRowId = ref(null)
const eksporFilter = reactive({
  id_wilayah: 1,
  tahun: new Date().getFullYear(),
  bulan: 1,
})

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

// State Modal Audit Trail Log
const isLogOpen = ref(false)
const activeLogs = ref([])
const activeLogTitle = ref('')
const isLogLoading = ref(false)

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

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
      eksporFilter.bulan = Number(daftarRes[0].bulan) || 1
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
    const bulanVal = Number(eksporFilter.bulan)

    const result = await exportRekapK1K10ToExcel({
      id_wilayah: Number(eksporFilter.id_wilayah),
      wilayahObj: wilObj,
      tahun: Number(eksporFilter.tahun),
      jenisPeriode: 'bulanan',
      bulan: bulanVal,
    })

    const infoBulan = result.bulanTerpakai.length > 0
      ? `data bulan ${bulanNames[bulanVal]}`
      : `belum ada laporan tersimpan untuk ${bulanNames[bulanVal]}, seluruh sel diisi 0`

    feedbackMessage.value = `Berhasil mengunduh ${result.fileName} (${result.sheetNames.length} sheet K1–K10; ${infoBulan}).`
    setTimeout(() => {
      if (feedbackMessage.value.startsWith('Berhasil mengunduh')) feedbackMessage.value = ''
    }, 6000)
  } catch (err) {
    errorMessage.value = 'Gagal mengunduh Excel gabungan: ' + (err.message || err)
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
    const result = await exportRekapK1K10ToExcel({
      id_wilayah: Number(item.id_wilayah),
      wilayahObj: wilObj,
      tahun: Number(item.tahun),
      jenisPeriode: 'bulanan',
      bulan: Number(item.bulan),
      laporanDoc: item,
    })

    feedbackMessage.value = `Berhasil mengunduh ${result.fileName} (${result.sheetNames.length} sheet K1–K10 untuk ${bulanNames[item.bulan]} ${item.tahun}).`
    setTimeout(() => {
      if (feedbackMessage.value.startsWith('Berhasil mengunduh')) feedbackMessage.value = ''
    }, 6000)
  } catch (err) {
    errorMessage.value = 'Gagal mengunduh Excel bulan ini: ' + (err.message || err)
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
  return found ? `${found.kode} — ${found.nama}` : kode
}

function pilihDanBuka(item, event) {
  const modul = event.target.value
  if (!modul) return
  event.target.value = ''
  bukaLaporan(item, modul)
}

function mintaKonfirmasiHapus(item) {
  if (item.status_laporan === 'final') {
    alert('Laporan yang sudah berstatus final (terkunci) tidak dapat dihapus. Buka kembali terlebih dahulu bila perlu menghapus.')
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
    hapusTandaTangan('k10', {
      id_wilayah: target.id_wilayah,
      tahun: target.tahun,
      jenis_periode: 'bulanan',
      bulan: target.bulan,
    })
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

async function prosesFinalkan(item) {
  if (!confirm(`Finalkan laporan #${item.id_laporan}? Data akan dikunci (read-only).`)) return
  try {
    await apiFinalkanLaporan(item.id_laporan)
    feedbackMessage.value = `Laporan #${item.id_laporan} telah difinalkan dan dikunci.`
    await muatDaftar()
  } catch (err) {
    errorMessage.value = err.message || 'Gagal memfinalkan laporan.'
  }
}

async function prosesBukaKembali(item) {
  if (!confirm(`Buka kembali laporan #${item.id_laporan} ke status draf?`)) return
  try {
    await apiBukaKembaliLaporan(item.id_laporan)
    feedbackMessage.value = `Laporan #${item.id_laporan} dibuka kembali ke status draf.`
    await muatDaftar()
  } catch (err) {
    errorMessage.value = err.message || 'Gagal membuka kembali laporan.'
  }
}

async function lihatLog(item) {
  activeLogTitle.value = `Audit Log #${item.id_laporan} - ${item.wilayah?.nama_kabupaten_kota} (${bulanNames[item.bulan]} ${item.tahun})`
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
  muatDaftar()
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

    <!-- KARTU DOWNLOAD EXCEL GABUNGAN (K1 s.d. K10 DALAM 1 FILE) -->
    <section class="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 class="text-sm sm:text-base font-black text-black flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-900 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Download Excel Gabungan (K1–K10)
          </h2>
          <p class="text-xs text-slate-700 font-bold mt-0.5">
            1 file Excel langsung terbagi menjadi semua sheet K1 s.d. K10 (K1, K2, K3, K4, K5, K6, K7, K8a, K8b, K8c, K9a, K9b, K10).
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <!-- Wilayah -->
        <div>
          <label class="block text-xs font-black text-black mb-1">Wilayah Pengawasan</label>
          <select
            v-model.number="eksporFilter.id_wilayah"
            class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-700"
          >
            <option v-for="w in daftarWilayah" :key="w.id_wilayah" :value="w.id_wilayah">
              {{ w.nama_kabupaten_kota }} ({{ w.kode_wilayah }})
            </option>
          </select>
        </div>

        <!-- Tahun -->
        <div>
          <label class="block text-xs font-black text-black mb-1">Tahun</label>
          <select
            v-model.number="eksporFilter.tahun"
            class="w-full bg-white border-2 border-slate-300 text-black font-mono font-black rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-700"
          >
            <option v-for="th in tahunTersedia" :key="th" :value="th">
              {{ th }}
            </option>
          </select>
        </div>

        <!-- Bulan -->
        <div>
          <label class="block text-xs font-black text-black mb-1">Bulan</label>
          <select
            v-model.number="eksporFilter.bulan"
            class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-700"
          >
            <option v-for="b in 12" :key="b" :value="b">
              {{ bulanNames[b] }} (K1–K10)
            </option>
          </select>
        </div>

        <!-- Tombol Download -->
        <div>
          <button
            @click="downloadExcelRekap"
            :disabled="isExporting || isLoading"
            class="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs rounded-lg shadow-xs border-2 border-slate-900 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg v-if="isExporting" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span>{{ isExporting ? 'Menyiapkan Excel...' : `Download Excel ${bulanNames[eksporFilter.bulan]}` }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Tabel Dokumen Laporan Bulanan (Putih) -->
    <section class="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-xs">
      <div v-if="isLoading" class="py-16 text-center text-black font-bold">
        <svg class="animate-spin w-8 h-8 text-black mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <p class="text-sm">Memuat dokumen laporan...</p>
      </div>

      <!-- Jika Kosong -->
      <div v-else-if="items.length === 0" class="py-16 text-center text-black">
        <div class="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-400 flex items-center justify-center mx-auto mb-3 text-slate-700">
          <svg class="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
        </div>
        <p class="text-base font-black text-black mb-1">Belum ada dokumen laporan bulanan</p>
        <p class="text-xs text-slate-600 font-bold mb-4">Buat laporan bulanan melalui menu Form K1.</p>
        <router-link
          to="/input/k1"
          class="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black transition cursor-pointer border-2 border-slate-900 shadow-xs"
        >
          <span>Input Form K1</span>
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </router-link>
      </div>

      <!-- Tabel Daftar Laporan -->
      <div v-else class="overflow-x-auto rounded-lg border-2 border-slate-400 shadow-xs">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-900 text-white border-b-2 border-slate-900">
              <th class="p-3 font-black text-center w-14">ID</th>
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
              v-for="item in items"
              :key="item.id_laporan"
              class="hover:bg-slate-50/70 transition font-bold"
            >
              <!-- ID -->
              <td class="p-3 text-center font-mono text-black font-black">
                #{{ item.id_laporan }}
              </td>

              <!-- Wilayah -->
              <td class="p-3">
                <div class="font-black text-black">
                  {{ item.wilayah?.nama_kabupaten_kota || 'Wilayah ' + item.id_wilayah }}
                </div>
                <div class="text-[10px] text-black font-mono font-bold">
                  Kode: {{ item.wilayah?.kode_wilayah || (item.id_wilayah === 1 ? 'BJM' : 'BTL') }}
                </div>
              </td>

              <!-- Formulir -->
              <td class="p-3 text-center">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-black bg-slate-200 text-slate-900 border border-slate-400 whitespace-nowrap"
                  :title="(item.modul_list?.length ? item.modul_list : [item.kode || 'K1']).join(', ')"
                >
                  K1 – K10
                  <span class="text-[10px] text-slate-600 font-bold">({{ item.modul_list?.length || 1 }})</span>
                </span>
              </td>

              <!-- Periode -->
              <td class="p-3">
                <span class="text-black font-black">{{ bulanNames[item.bulan] || `Bulan ${item.bulan}` }}</span>
                <span class="text-[10px] ml-1.5 px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-400 font-black">
                  TW {{ item.triwulan }}
                </span>
              </td>

              <!-- Tahun -->
              <td class="p-3 text-center font-mono font-black text-black">{{ item.tahun }}</td>

              <!-- Status Badge (draf | final) -->
              <td class="p-3 text-center">
                <!-- Draf (Abu-abu muda) -->
                <span
                  v-if="item.status_laporan === 'draf'"
                  class="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-200 text-slate-900 border border-slate-400 inline-flex items-center gap-1"
                >
                  <span class="w-2 h-2 rounded-full bg-slate-600"></span>
                  draf
                </span>
                <!-- Final (Abu-abu gelap teks putih, terkunci) -->
                <span
                  v-else-if="item.status_laporan === 'final'"
                  class="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-800 text-white border-2 border-slate-900 inline-flex items-center gap-1"
                  title="Terkunci (pengesahan dilakukan manual di luar sistem)"
                >
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  final
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
                  <!-- Dropdown Buka Form (K1 s.d. K10) -->
                  <select
                    @change="pilihDanBuka(item, $event)"
                    aria-label="Pilih formulir untuk dibuka"
                    class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-black transition cursor-pointer border-2 border-slate-900 shadow-xs focus:outline-none"
                  >
                    <option value="" selected>Buka Form ▾</option>
                    <option
                      v-for="m in (item.modul_list?.length ? item.modul_list : [item.kode || 'K1'])"
                      :key="m"
                      :value="m"
                      class="bg-white text-black font-bold"
                    >
                      {{ getNamaModul(m) }}
                    </option>
                  </select>

                  <!-- Download Excel Gabungan K1-K10 untuk bulan ini -->
                  <button
                    @click="downloadExcelBaris(item)"
                    :disabled="exportingRowId === item.id_laporan"
                    class="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-black transition cursor-pointer border-2 border-slate-800 shadow-xs inline-flex items-center gap-1 disabled:opacity-50"
                    :title="`Download 1 file Excel berisi semua sheet K1–K10 untuk ${bulanNames[item.bulan]} ${item.tahun}`"
                  >
                    <svg v-if="exportingRowId === item.id_laporan" class="animate-spin w-3 h-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <svg v-else class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    <span>Excel</span>
                  </button>

                  <!-- Finalkan (Jika Draf) -->
                  <button
                    v-if="item.status_laporan === 'draf'"
                    @click="prosesFinalkan(item)"
                    class="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 rounded text-xs font-black transition cursor-pointer shadow-xs"
                    title="Finalkan dan kunci laporan"
                  >
                    Finalkan
                  </button>

                  <!-- Buka Kembali (Jika Final) -->
                  <button
                    v-if="item.status_laporan === 'final'"
                    @click="prosesBukaKembali(item)"
                    class="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-950 border border-red-500 rounded text-xs font-black transition cursor-pointer"
                    title="Buka kembali laporan ke status Draf"
                  >
                    Buka Kembali
                  </button>

                  <!-- Log (Putih border abu-abu) -->
                  <button
                    @click="lihatLog(item)"
                    class="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-400 text-black rounded text-xs font-bold transition cursor-pointer"
                    title="Lihat Log Perubahan"
                  >
                    Log
                  </button>

                  <!-- Hapus (Merah pekat, hanya saat Draf) -->
                  <button
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

    <!-- MODAL KONFIRMASI HAPUS (MERAH) -->
    <div
      v-if="isConfirmOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div class="bg-white border-2 border-slate-400 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="w-12 h-12 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center text-red-600">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>

        <div>
          <h3 class="text-lg font-black text-black">Konfirmasi Hapus Laporan</h3>
          <p class="text-xs sm:text-sm text-black font-bold mt-1.5">
            Apakah Anda yakin ingin menghapus dokumen laporan bulanan ini:
          </p>
          <div class="mt-2.5 p-3 rounded-lg bg-slate-50 border-2 border-slate-300 text-xs space-y-1 font-bold">
            <div><strong class="text-black">ID Laporan:</strong> #{{ itemToDelete?.id_laporan }}</div>
            <div><strong class="text-black">Wilayah:</strong> {{ itemToDelete?.wilayah?.nama_kabupaten_kota }}</div>
            <div><strong class="text-black">Periode:</strong> {{ bulanNames[itemToDelete?.bulan] }} {{ itemToDelete?.tahun }} (TW {{ itemToDelete?.triwulan }})</div>
          </div>
          <p class="text-xs text-red-700 font-black mt-2">
            Seluruh data matriks K1 s.d. K10 di dalam laporan ini akan terhapus secara permanen.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            @click="batalHapus"
            class="px-4 py-2 bg-white hover:bg-slate-100 text-black font-black text-xs sm:text-sm rounded-lg border-2 border-slate-400 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="prosesHapus"
            class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs transition cursor-pointer border-2 border-red-800"
          >
            Ya, Hapus Laporan
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL AUDIT TRAIL LOG -->
    <div
      v-if="isLogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div class="bg-white border-2 border-slate-400 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b-2 border-slate-300">
          <h3 class="text-sm font-black text-black flex items-center gap-2">
            <svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ activeLogTitle }}
          </h3>
          <button
            @click="isLogOpen = false"
            class="text-black font-black hover:bg-slate-200 p-1 rounded border border-slate-400"
          >
            ✕
          </button>
        </div>

        <div v-if="isLogLoading" class="py-8 text-center text-black font-black text-xs">
          Memuat riwayat log...
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
            @click="isLogOpen = false"
            class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
