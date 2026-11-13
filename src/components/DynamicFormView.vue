<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ambilLaporan, simpanLaporan } from '../lib/api'
import { exportK1ToExcel } from '../lib/excel'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
})

const route = useRoute()

// Pilihan wilayah & periode
const wilayahOptions = ['Banjarmasin', 'Batola']
const jenisPeriodeOptions = ['Bulanan', 'Triwulan']
const bulanOptions = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]
const triwulanOptions = ['Triwulan I', 'Triwulan II', 'Triwulan III', 'Triwulan IV']

// State Form Filter
const filter = reactive({
  wilayah: 'Banjarmasin',
  jenis: 'Bulanan',
  periode: 'Januari',
  tahun: 2026,
})

// Ketika jenis periode berganti, sesuaikan nilai default periode
watch(() => filter.jenis, (newVal) => {
  if (newVal === 'Bulanan') {
    filter.periode = 'Januari'
  } else {
    filter.periode = 'Triwulan I'
  }
})

// State Aktif Form Isian
const isFormOpen = ref(false)
const activeMeta = ref(null)
const rowsData = reactive({})
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const infoMessage = ref('')

// Inisialisasi struktur baris kosong
function initEmptyRows() {
  // Bersihkan data lama
  Object.keys(rowsData).forEach(k => delete rowsData[k])

  props.config.rows.forEach(row => {
    if (!row.isGroup) {
      const rowItem = {
        umum: 0,
        ppns: 0,
        ket: '',
      }
      for (let i = 1; i <= 11; i++) {
        rowItem[`spesialis_${i}`] = 0
      }
      rowsData[row.id] = rowItem
    }
  })
}

// Buka form & muat dari API
async function bukaFormIsian() {
  errorMessage.value = ''
  successMessage.value = ''
  infoMessage.value = ''
  isLoading.value = true

  const metaTarget = {
    kode: props.config.kode,
    wilayah: filter.wilayah,
    jenis: filter.jenis,
    periode: filter.periode,
    tahun: Number(filter.tahun),
  }

  try {
    const existing = await ambilLaporan(metaTarget)
    initEmptyRows()

    if (existing && typeof existing === 'object') {
      // Salin data tersimpan ke rowsData
      Object.keys(existing).forEach(rowId => {
        if (rowsData[rowId]) {
          rowsData[rowId] = { ...rowsData[rowId], ...existing[rowId] }
        }
      })
      infoMessage.value = 'Laporan periode ini sudah pernah disimpan. Data lama sudah dimuat; menyimpan akan memperbarui.'
    } else {
      infoMessage.value = ''
    }

    activeMeta.value = { ...metaTarget }
    isFormOpen.value = true
  } catch (err) {
    errorMessage.value = 'Gagal memuat data laporan dari penyimpanan: ' + (err.message || err)
  } finally {
    isLoading.value = false
  }
}

// Sanitasi angka: kosong dihitung 0, tidak boleh negatif
function onNumberInput(rowId, field, event) {
  const raw = event.target.value
  if (raw === '' || isNaN(raw)) {
    rowsData[rowId][field] = 0
    event.target.value = 0
    return
  }
  let val = Math.floor(Number(raw))
  if (val < 0) val = 0
  rowsData[rowId][field] = val
  event.target.value = val
}

// Komputasi Total per Baris & Total Kolom (JUMLAH)
const summaryTotals = computed(() => {
  const rowTotals = {}
  const colTotals = {
    umum: 0,
    ppns: 0,
  }
  for (let i = 1; i <= 11; i++) {
    colTotals[`spesialis_${i}`] = 0
  }

  let grandTotal = 0

  props.config.rows.forEach(row => {
    if (!row.isGroup) {
      const rowVal = rowsData[row.id] || {}
      // Hitung per baris
      const rTotal = props.config.hitungJumlahBaris
        ? props.config.hitungJumlahBaris(rowVal)
        : (Number(rowVal.umum) || 0)
      rowTotals[row.id] = rTotal
      grandTotal += rTotal

      // Akumulasi per kolom
      colTotals.umum += Number(rowVal.umum) || 0
      colTotals.ppns += Number(rowVal.ppns) || 0
      for (let i = 1; i <= 11; i++) {
        colTotals[`spesialis_${i}`] += Number(rowVal[`spesialis_${i}`]) || 0
      }
    }
  })

  return { rowTotals, colTotals, grandTotal }
})

// Simpan laporan ke API
async function simpan() {
  if (!activeMeta.value) return
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    await simpanLaporan(activeMeta.value, rowsData)
    successMessage.value = 'Laporan tersimpan.'
    infoMessage.value = ''
    // Auto hilangkan pesan berhasil setelah 5 detik
    setTimeout(() => {
      if (successMessage.value === 'Laporan tersimpan.') {
        successMessage.value = ''
      }
    }, 5000)
  } catch (err) {
    errorMessage.value = 'Gagal menyimpan laporan: ' + (err.message || err)
  } finally {
    isLoading.value = false
  }
}

// Reset semua isian angka ke nol & ket ke kosong
function resetKeNol() {
  if (!confirm('Kosongkan semua isian tabel ke angka nol?')) return
  initEmptyRows()
  successMessage.value = ''
}

// Tutup form isian
function tutupForm() {
  isFormOpen.value = false
  activeMeta.value = null
  successMessage.value = ''
  infoMessage.value = ''
  errorMessage.value = ''
}

// Download Excel
async function downloadExcel() {
  if (!activeMeta.value) return
  try {
    await exportK1ToExcel({
      config: props.config,
      meta: activeMeta.value,
      rowsData,
      summaryTotals: summaryTotals.value,
    })
  } catch (err) {
    alert('Gagal mengekspor berkas Excel: ' + (err.message || err))
  }
}

// Cek jika rute membawa query param untuk preload (misal dari menu Laporan Tersimpan)
onMounted(() => {
  const q = route.query
  if (q.wilayah && q.periode && q.tahun) {
    filter.wilayah = q.wilayah
    filter.jenis = q.jenis || (q.periode.includes('Triwulan') ? 'Triwulan' : 'Bulanan')
    filter.periode = q.periode
    filter.tahun = Number(q.tahun)
    bukaFormIsian()
  }
})
</script>

<template>
  <div class="space-y-6">

    <!-- Pesan Peringatan Error -->
    <div v-if="errorMessage" class="p-4 rounded-lg bg-red-950/60 border border-red-700/60 text-red-200 text-sm flex items-start gap-3">
      <svg class="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <div>{{ errorMessage }}</div>
    </div>

    <!-- Pesan Sukses -->
    <div v-if="successMessage" class="p-4 rounded-lg bg-emerald-950/70 border border-emerald-600/70 text-emerald-200 text-sm flex items-center gap-3">
      <svg class="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div class="font-medium">{{ successMessage }}</div>
    </div>

    <!-- Pesan Info Data Lama -->
    <div v-if="infoMessage" class="p-4 rounded-lg bg-sky-950/60 border border-sky-600/60 text-sky-200 text-sm flex items-center gap-3">
      <svg class="w-5 h-5 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div>{{ infoMessage }}</div>
    </div>

    <!-- KARTU 1: FILTER WILAYAH & PERIODE -->
    <section class="bg-[#0C1730] border border-[#1B2A4A] rounded-xl p-5 shadow-lg">
      <h2 class="text-base font-semibold text-[#E6ECF8] mb-4 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-blue-500"></span>
        1. Pilih wilayah dan periode
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Wilayah -->
        <div>
          <label class="block text-xs font-medium text-[#9AA8C7] mb-1.5">Wilayah</label>
          <select
            v-model="filter.wilayah"
            class="w-full bg-[#070E1C] border border-[#1B2A4A] text-[#E6ECF8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option v-for="w in wilayahOptions" :key="w" :value="w">{{ w }}</option>
          </select>
        </div>

        <!-- Jenis Periode -->
        <div>
          <label class="block text-xs font-medium text-[#9AA8C7] mb-1.5">Jenis Periode</label>
          <select
            v-model="filter.jenis"
            class="w-full bg-[#070E1C] border border-[#1B2A4A] text-[#E6ECF8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option v-for="j in jenisPeriodeOptions" :key="j" :value="j">{{ j }}</option>
          </select>
        </div>

        <!-- Bulan / Triwulan -->
        <div>
          <label class="block text-xs font-medium text-[#9AA8C7] mb-1.5">
            {{ filter.jenis === 'Bulanan' ? 'Bulan' : 'Triwulan' }}
          </label>
          <select
            v-if="filter.jenis === 'Bulanan'"
            v-model="filter.periode"
            class="w-full bg-[#070E1C] border border-[#1B2A4A] text-[#E6ECF8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option v-for="b in bulanOptions" :key="b" :value="b">{{ b }}</option>
          </select>
          <select
            v-else
            v-model="filter.periode"
            class="w-full bg-[#070E1C] border border-[#1B2A4A] text-[#E6ECF8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option v-for="t in triwulanOptions" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <!-- Tahun -->
        <div>
          <label class="block text-xs font-medium text-[#9AA8C7] mb-1.5">Tahun</label>
          <input
            v-model.number="filter.tahun"
            type="number"
            min="2000"
            max="2099"
            class="w-full bg-[#070E1C] border border-[#1B2A4A] text-[#E6ECF8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Tombol Aksi Buka Form -->
      <div class="mt-5 flex justify-end">
        <button
          @click="bukaFormIsian"
          :disabled="isLoading"
          class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium text-sm rounded-lg shadow-md shadow-blue-900/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="isLoading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Buka form isian
        </button>
      </div>
    </section>

    <!-- KARTU 2: TABEL FORM ISIAN -->
    <section v-if="isFormOpen" class="bg-[#0C1730] border border-[#1B2A4A] rounded-xl p-5 shadow-lg space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1B2A4A] gap-2">
        <h2 class="text-base font-semibold text-[#E6ECF8] flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          2. Isi data ({{ activeMeta.wilayah }} - {{ activeMeta.periode }} {{ activeMeta.tahun }})
        </h2>
        <span class="text-xs text-[#9AA8C7] bg-[#070E1C] px-3 py-1 rounded-full border border-[#1B2A4A]">
          Kode: <strong class="text-[#E6ECF8]">{{ activeMeta.kode }}</strong>
        </span>
      </div>

      <!-- Wadah scroll tabel saja, tidak membuat halaman scroll mendatar -->
      <div class="overflow-x-auto rounded-lg border border-[#1B2A4A] max-w-full">
        <table class="w-full text-left text-xs border-collapse">
          <!-- THEAD -->
          <thead>
            <!-- Baris Header 1 -->
            <tr class="bg-[#081331] text-[#9AA8C7] border-b border-[#1B2A4A]">
              <th
                rowspan="2"
                class="p-2.5 font-semibold text-center sticky left-0 z-20 bg-[#081331] border-r border-[#1B2A4A] w-12 min-w-[48px]"
              >
                No
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-semibold sticky left-12 z-20 bg-[#081331] border-r border-[#1B2A4A] w-48 min-w-[190px]"
              >
                Jabatan
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-semibold text-center border-r border-[#1B2A4A] w-16 min-w-[64px]"
              >
                Umum
              </th>
              <th
                colspan="11"
                class="p-2 font-semibold text-center border-r border-[#1B2A4A] bg-[#0A1738]"
              >
                Spesialis
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-semibold text-center border-r border-[#1B2A4A] bg-[#142852] text-sky-200 w-20 min-w-[80px]"
              >
                Jumlah
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-semibold text-center border-r border-[#1B2A4A] w-16 min-w-[64px]"
              >
                PPNS
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-semibold w-40 min-w-[160px]"
              >
                Ket.
              </th>
            </tr>
            <!-- Baris Header 2 (Angka 1-11) -->
            <tr class="bg-[#081331] text-[#9AA8C7] border-b border-[#1B2A4A]">
              <th
                v-for="i in 11"
                :key="`h-sp-${i}`"
                class="p-1.5 font-semibold text-center border-r border-[#1B2A4A] w-12 min-w-[48px]"
                :title="`Spesialis ${i}`"
              >
                {{ i }}
              </th>
            </tr>
          </thead>

          <!-- TBODY -->
          <tbody class="divide-y divide-[#1B2A4A] text-[#E6ECF8]">
            <template v-for="row in config.rows" :key="row.id">
              
              <!-- Tipe Baris Grup (Tidak bisa diisi, tampil '-') -->
              <tr v-if="row.isGroup" class="bg-[#091536]/80 font-semibold text-blue-300">
                <td class="p-2.5 text-center sticky left-0 z-10 bg-[#091536] border-r border-[#1B2A4A]">
                  {{ row.no }}
                </td>
                <td class="p-2.5 sticky left-12 z-10 bg-[#091536] border-r border-[#1B2A4A]">
                  {{ row.label }}
                </td>
                <td class="p-2 text-center text-slate-500 border-r border-[#1B2A4A]">-</td>
                <td
                  v-for="i in 11"
                  :key="`grp-${row.id}-${i}`"
                  class="p-2 text-center text-slate-500 border-r border-[#1B2A4A]"
                >
                  -
                </td>
                <td class="p-2 text-center text-slate-500 border-r border-[#1B2A4A] bg-[#0E1F42]">-</td>
                <td class="p-2 text-center text-slate-500 border-r border-[#1B2A4A]">-</td>
                <td class="p-2 text-center text-slate-500">-</td>
              </tr>

              <!-- Tipe Baris Data Isian -->
              <tr v-else class="hover:bg-[#101F42]/40 transition">
                <!-- No (Sticky Kolom 1) -->
                <td class="p-2.5 text-center sticky left-0 z-10 bg-[#0C1730] border-r border-[#1B2A4A] text-[#9AA8C7]">
                  {{ row.no }}
                </td>
                <!-- Jabatan (Sticky Kolom 2) -->
                <td class="p-2.5 sticky left-12 z-10 bg-[#0C1730] border-r border-[#1B2A4A] whitespace-nowrap">
                  {{ row.label }}
                </td>
                <!-- Umum -->
                <td class="p-1 border-r border-[#1B2A4A]">
                  <input
                    type="number"
                    min="0"
                    :value="rowsData[row.id]?.umum"
                    @input="onNumberInput(row.id, 'umum', $event)"
                    class="w-full text-center bg-[#070E1C] border border-[#1B2A4A] text-[#E6ECF8] rounded py-1 px-1 focus:outline-none focus:border-blue-500"
                  />
                </td>
                <!-- Spesialis 1 - 11 -->
                <td
                  v-for="i in 11"
                  :key="`data-${row.id}-${i}`"
                  class="p-1 border-r border-[#1B2A4A]"
                >
                  <input
                    type="number"
                    min="0"
                    :value="rowsData[row.id]?.[`spesialis_${i}`]"
                    @input="onNumberInput(row.id, `spesialis_${i}`, $event)"
                    class="w-full text-center bg-[#070E1C] border border-[#1B2A4A] text-[#E6ECF8] rounded py-1 px-1 focus:outline-none focus:border-blue-500"
                  />
                </td>
                <!-- Jumlah (Otomatis & Diberi Warna Beda) -->
                <td class="p-2 text-center font-bold text-sky-300 bg-[#12244C] border-r border-[#1B2A4A]">
                  {{ summaryTotals.rowTotals[row.id] ?? 0 }}
                </td>
                <!-- PPNS -->
                <td class="p-1 border-r border-[#1B2A4A]">
                  <input
                    type="number"
                    min="0"
                    :value="rowsData[row.id]?.ppns"
                    @input="onNumberInput(row.id, 'ppns', $event)"
                    class="w-full text-center bg-[#070E1C] border border-[#1B2A4A] text-[#E6ECF8] rounded py-1 px-1 focus:outline-none focus:border-blue-500"
                  />
                </td>
                <!-- Keterangan -->
                <td class="p-1">
                  <input
                    type="text"
                    v-model="rowsData[row.id].ket"
                    placeholder="Keterangan..."
                    class="w-full bg-[#070E1C] border border-[#1B2A4A] text-[#E6ECF8] rounded py-1 px-2 focus:outline-none focus:border-blue-500 text-xs"
                  />
                </td>
              </tr>
            </template>

            <!-- BARIS JUMLAH TOTAL -->
            <tr class="bg-[#142650] font-bold text-[#E6ECF8] border-t-2 border-blue-500/50">
              <td class="p-2.5 text-center sticky left-0 z-10 bg-[#142650] border-r border-[#1B2A4A]">
                -
              </td>
              <td class="p-2.5 sticky left-12 z-10 bg-[#142650] border-r border-[#1B2A4A] tracking-wider uppercase">
                JUMLAH
              </td>
              <td class="p-2.5 text-center border-r border-[#1B2A4A]">
                {{ summaryTotals.colTotals.umum }}
              </td>
              <td
                v-for="i in 11"
                :key="`tot-sp-${i}`"
                class="p-2.5 text-center border-r border-[#1B2A4A]"
              >
                {{ summaryTotals.colTotals[`spesialis_${i}`] }}
              </td>
              <td class="p-2.5 text-center bg-blue-700/50 text-white border-r border-[#1B2A4A] text-sm">
                {{ summaryTotals.grandTotal }}
              </td>
              <td class="p-2.5 text-center border-r border-[#1B2A4A]">
                {{ summaryTotals.colTotals.ppns }}
              </td>
              <td class="p-2.5 text-center text-slate-400">
                -
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- EMPAT TOMBOL AKSI -->
      <div class="pt-4 flex flex-wrap items-center justify-end gap-3">
        <!-- Tombol Tutup -->
        <button
          @click="tutupForm"
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs sm:text-sm rounded-lg border border-slate-700 transition cursor-pointer"
        >
          Tutup
        </button>

        <!-- Tombol Reset ke Nol -->
        <button
          @click="resetKeNol"
          class="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-medium text-xs sm:text-sm rounded-lg border border-rose-800/60 transition cursor-pointer"
        >
          Reset ke nol
        </button>

        <!-- Tombol Download Excel -->
        <button
          @click="downloadExcel"
          class="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-medium text-xs sm:text-sm rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Download Excel
        </button>

        <!-- Tombol Simpan -->
        <button
          @click="simpan"
          :disabled="isLoading"
          class="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium text-xs sm:text-sm rounded-lg shadow-md shadow-blue-900/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="isLoading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          Simpan
        </button>
      </div>
    </section>

    <!-- KARTU 3: KETERANGAN KOLOM SPESIALIS -->
    <section
      v-if="config.specialistDescriptions && config.specialistDescriptions.length > 0"
      class="bg-[#0C1730] border border-[#1B2A4A] rounded-xl p-5 shadow-lg"
    >
      <h3 class="text-sm font-semibold text-[#E6ECF8] mb-3 flex items-center gap-2">
        <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Keterangan kolom spesialis:
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
        <div
          v-for="desc in config.specialistDescriptions"
          :key="desc.id"
          class="bg-[#070E1C] border border-[#1B2A4A] rounded-lg p-2.5 text-[#9AA8C7] flex items-start gap-2"
        >
          <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-900/60 text-blue-300 font-bold text-[11px] shrink-0 border border-blue-700/50">
            {{ desc.id }}
          </span>
          <span class="leading-relaxed text-[#E6ECF8]">{{ desc.text }}</span>
        </div>
      </div>
    </section>

  </div>
</template>
