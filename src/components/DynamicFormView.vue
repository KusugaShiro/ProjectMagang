<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  apiGetMasterWilayah,
  apiGetDaftarLaporan,
  apiBuatLaporan,
  apiGetMatriksModul,
  apiSimpanMatriksModul,
  apiKirimLaporan,
  apiSahkanLaporan,
  apiKembalikanLaporan,
} from '../lib/api'
import {
  currentUser,
  isOperator,
  isKepalaBalai,
  isAdmin,
} from '../lib/auth'
import { exportK1ToExcel } from '../lib/excel'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
})

const route = useRoute()

// Master Data Wilayah & Pilihan Bulan
const daftarWilayah = ref([])
const bulanList = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
]

// State Filter Periode
const filter = reactive({
  id_wilayah: 1,
  bulan: 1,
  tahun: 2026,
})

const hitungTriwulan = computed(() => Math.ceil(filter.bulan / 3))

// State Dokumen Laporan Aktif
const isFormOpen = ref(false)
const activeLaporan = ref(null)
const rowsData = reactive({})
const isLoading = ref(false)
const isWorkflowLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const infoMessage = ref('')

// Cek apakah form berstatus terkunci (read-only)
const isReadOnly = computed(() => {
  return activeLaporan.value?.status_laporan === 'disahkan'
})

// Inisialisasi baris kosong untuk 6 jabatan K1
function initEmptyRows() {
  Object.keys(rowsData).forEach(k => delete rowsData[k])

  props.config.rows.forEach(row => {
    if (!row.isGroup && row.id_jabatan) {
      const rowItem = {
        id_jabatan: row.id_jabatan,
        jml_umum: 0,
        jml_ppns: 0,
        keterangan: '',
      }
      props.config.spesialisFields.forEach(sf => {
        rowItem[sf.key] = 0
      })
      rowsData[row.id_jabatan] = rowItem
    }
  })
}

// Buka form isian / Buat dokumen laporan bulanan
async function bukaFormIsian() {
  errorMessage.value = ''
  successMessage.value = ''
  infoMessage.value = ''
  isLoading.value = true

  try {
    const list = await apiGetDaftarLaporan({
      id_wilayah: filter.id_wilayah,
      tahun: filter.tahun,
      bulan: filter.bulan,
    })

    let doc = list.find(l => l.id_wilayah === Number(filter.id_wilayah) && l.tahun === Number(filter.tahun) && l.bulan === Number(filter.bulan))

    if (!doc) {
      doc = await apiBuatLaporan({
        id_wilayah: Number(filter.id_wilayah),
        tahun: Number(filter.tahun),
        bulan: Number(filter.bulan),
      })
      infoMessage.value = 'Dokumen laporan baru telah dibuat (Status: Draf).'
    } else {
      if (doc.status_laporan === 'disahkan') {
        infoMessage.value = `Laporan ini telah disahkan pada ${doc.tanggal_pengesahan} dan berstatus terkunci (Read-Only).`
      } else if (doc.status_laporan === 'terkirim') {
        infoMessage.value = 'Laporan ini telah dikirim ke Kepala Balai dan sedang menunggu pengesahan.'
      } else {
        infoMessage.value = 'Dokumen laporan draf dimuat. Menyimpan akan memperbarui data matriks.'
      }
    }

    activeLaporan.value = doc
    initEmptyRows()

    const resModul = await apiGetMatriksModul(doc.id_laporan, props.config.modul || 'k1')
    if (resModul?.data && Array.isArray(resModul.data) && resModul.data.length > 0) {
      resModul.data.forEach(item => {
        if (item.id_jabatan && rowsData[item.id_jabatan]) {
          rowsData[item.id_jabatan] = {
            ...rowsData[item.id_jabatan],
            ...item,
          }
        }
      })
    }

    isFormOpen.value = true
  } catch (err) {
    errorMessage.value = 'Gagal membuka form: ' + (err.message || err)
  } finally {
    isLoading.value = false
  }
}

// Sanitasi input angka (int >= 0)
function onNumberInput(idJabatan, field, event) {
  if (isReadOnly.value) return
  const raw = event.target.value
  if (raw === '' || isNaN(raw)) {
    rowsData[idJabatan][field] = 0
    event.target.value = 0
    return
  }
  let val = Math.floor(Number(raw))
  if (val < 0) val = 0
  rowsData[idJabatan][field] = val
  event.target.value = val
}

// Komputasi total per baris dan baris JUMLAH
const summaryTotals = computed(() => {
  const rowTotals = {}
  const colTotals = {
    jml_umum: 0,
    jml_ppns: 0,
  }
  props.config.spesialisFields.forEach(sf => {
    colTotals[sf.key] = 0
  })

  let grandTotal = 0

  props.config.rows.forEach(row => {
    if (!row.isGroup && row.id_jabatan) {
      const rowVal = rowsData[row.id_jabatan] || {}
      const rTotal = props.config.hitungJumlahBaris(rowVal)
      rowTotals[row.id_jabatan] = rTotal
      grandTotal += rTotal

      colTotals.jml_umum += Number(rowVal.jml_umum) || 0
      colTotals.jml_ppns += Number(rowVal.jml_ppns) || 0
      props.config.spesialisFields.forEach(sf => {
        colTotals[sf.key] += Number(rowVal[sf.key]) || 0
      })
    }
  })

  return { rowTotals, colTotals, grandTotal }
})

// Simpan Matriks ke API (PUT /api/laporan/{id}/k1)
async function simpan() {
  if (!activeLaporan.value || isReadOnly.value) return
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  const payloadBaris = props.config.rows
    .filter(r => !r.isGroup && r.id_jabatan)
    .map(r => {
      const rowVal = rowsData[r.id_jabatan] || {}
      const payloadItem = {
        id_jabatan: r.id_jabatan,
        jml_umum: Number(rowVal.jml_umum) || 0,
        jml_ppns: Number(rowVal.jml_ppns) || 0,
        keterangan: rowVal.keterangan || null,
      }
      props.config.spesialisFields.forEach(sf => {
        payloadItem[sf.key] = Number(rowVal[sf.key]) || 0
      })
      return payloadItem
    })

  try {
    await apiSimpanMatriksModul(activeLaporan.value.id_laporan, props.config.modul || 'k1', payloadBaris)
    successMessage.value = 'Laporan tersimpan.'
    setTimeout(() => {
      if (successMessage.value === 'Laporan tersimpan.') successMessage.value = ''
    }, 5000)
  } catch (err) {
    errorMessage.value = 'Gagal menyimpan: ' + (err.message || err)
  } finally {
    isLoading.value = false
  }
}

async function aksiKirim() {
  if (!activeLaporan.value) return
  if (!confirm('Kirim laporan ini ke Kepala Balai untuk diperiksa?')) return
  isWorkflowLoading.value = true
  errorMessage.value = ''
  try {
    await apiKirimLaporan(activeLaporan.value.id_laporan)
    activeLaporan.value.status_laporan = 'terkirim'
    successMessage.value = 'Laporan berhasil dikirim ke Kepala Balai.'
    infoMessage.value = 'Status laporan kini: Terkirim.'
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengirim laporan.'
  } finally {
    isWorkflowLoading.value = false
  }
}

async function aksiSahkan() {
  if (!activeLaporan.value) return
  if (!confirm('Sahkan laporan ini? Data akan dikunci (read-only).')) return
  isWorkflowLoading.value = true
  errorMessage.value = ''
  try {
    await apiSahkanLaporan(activeLaporan.value.id_laporan)
    activeLaporan.value.status_laporan = 'disahkan'
    activeLaporan.value.tanggal_pengesahan = new Date().toISOString().slice(0, 10)
    successMessage.value = 'Laporan telah disahkan.'
    infoMessage.value = `Laporan telah disahkan pada ${activeLaporan.value.tanggal_pengesahan} dan data dikunci.`
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengesahkan laporan.'
  } finally {
    isWorkflowLoading.value = false
  }
}

async function aksiKembalikan() {
  if (!activeLaporan.value) return
  if (!confirm('Kembalikan laporan ini ke status Draf? Kunci data akan dibuka kembali.')) return
  isWorkflowLoading.value = true
  errorMessage.value = ''
  try {
    await apiKembalikanLaporan(activeLaporan.value.id_laporan)
    activeLaporan.value.status_laporan = 'draf'
    activeLaporan.value.tanggal_pengesahan = null
    successMessage.value = 'Laporan dikembalikan ke status draf.'
    infoMessage.value = 'Kunci data dibuka kembali. Anda dapat mengedit isian form.'
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengembalikan laporan.'
  } finally {
    isWorkflowLoading.value = false
  }
}

function resetKeNol() {
  if (isReadOnly.value) return
  if (!confirm('Kosongkan semua isian tabel ke angka nol?')) return
  initEmptyRows()
  successMessage.value = ''
}

function tutupForm() {
  isFormOpen.value = false
  activeLaporan.value = null
  successMessage.value = ''
  infoMessage.value = ''
  errorMessage.value = ''
}

async function downloadExcel() {
  if (!activeLaporan.value) return
  try {
    const wilObj = daftarWilayah.value.find(w => w.id_wilayah === activeLaporan.value.id_wilayah)
    const namaBulan = bulanList.find(b => b.value === activeLaporan.value.bulan)?.label || `Bulan ${activeLaporan.value.bulan}`

    await exportK1ToExcel({
      config: props.config,
      meta: {
        id_wilayah: activeLaporan.value.id_wilayah,
        wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
        bulan: namaBulan,
        triwulan: activeLaporan.value.triwulan,
        tahun: activeLaporan.value.tahun,
        kode: props.config.kode || 'K1',
      },
      rowsData,
      summaryTotals: summaryTotals.value,
    })
  } catch (err) {
    alert('Gagal mengekspor berkas Excel: ' + (err.message || err))
  }
}

async function muatMaster() {
  daftarWilayah.value = await apiGetMasterWilayah()
  if (daftarWilayah.value.length > 0) {
    if (isOperator.value && currentUser.value?.id_wilayah) {
      filter.id_wilayah = currentUser.value.id_wilayah
    } else {
      filter.id_wilayah = daftarWilayah.value[0].id_wilayah
    }
  }

  const q = route.query
  if (q.id_wilayah && q.bulan && q.tahun) {
    filter.id_wilayah = Number(q.id_wilayah)
    filter.bulan = Number(q.bulan)
    filter.tahun = Number(q.tahun)
    bukaFormIsian()
  }
}

onMounted(() => {
  muatMaster()
})
</script>

<template>
  <div class="space-y-6">

    <!-- Pesan Peringatan Error (Merah) -->
    <div v-if="errorMessage" class="p-4 rounded-xl bg-red-50 border border-red-300 text-red-800 text-sm flex items-start gap-3 shadow-xs">
      <svg class="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <div class="font-medium">{{ errorMessage }}</div>
    </div>

    <!-- Pesan Sukses (Kuning/Hijau) -->
    <div v-if="successMessage" class="p-4 rounded-xl bg-amber-50 border border-yellow-400 text-amber-950 text-sm flex items-center gap-3 shadow-xs">
      <svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div class="font-bold">{{ successMessage }}</div>
    </div>

    <!-- Pesan Info Status -->
    <div v-if="infoMessage" class="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm flex items-center gap-3 shadow-xs">
      <svg class="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div>{{ infoMessage }}</div>
    </div>

    <!-- KARTU 1: PILIH WILAYAH DAN PERIODE -->
    <section class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-bold text-slate-950 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
          1. Pilih wilayah dan periode
        </h2>
        <span class="text-xs text-slate-500 font-medium">
          Standar REST API Laravel (Bulan 1-12 & Tahun)
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Wilayah -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">Wilayah Pengawasan</label>
          <select
            v-model.number="filter.id_wilayah"
            :disabled="isOperator"
            class="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option v-for="w in daftarWilayah" :key="w.id_wilayah" :value="w.id_wilayah">
              {{ w.nama_kabupaten_kota }} ({{ w.kode_wilayah }})
            </option>
          </select>
          <p v-if="isOperator" class="text-[11px] text-amber-700 font-medium mt-1">Terkunci untuk operator kabupaten</p>
        </div>

        <!-- Bulan -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">Bulan Laporan</label>
          <select
            v-model.number="filter.bulan"
            class="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
          >
            <option v-for="b in bulanList" :key="b.value" :value="b.value">
              {{ b.value }}. {{ b.label }}
            </option>
          </select>
        </div>

        <!-- Triwulan (Auto-calculated) -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">Triwulan (Otomatis)</label>
          <div class="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm font-bold flex items-center justify-between">
            <span>Triwulan {{ hitungTriwulan }}</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-yellow-400 text-slate-950 font-black">TW {{ hitungTriwulan }}</span>
          </div>
        </div>

        <!-- Tahun -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">Tahun Anggaran</label>
          <input
            v-model.number="filter.tahun"
            type="number"
            min="2026"
            max="2100"
            class="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 font-mono"
          />
        </div>
      </div>

      <!-- Tombol Aksi Buka Form (Kuning) -->
      <div class="mt-5 flex justify-end">
        <button
          @click="bukaFormIsian"
          :disabled="isLoading"
          class="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-bold text-sm rounded-lg shadow-sm border border-yellow-500/50 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="isLoading" class="animate-spin w-4 h-4 text-black" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <svg v-else class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Buka form isian
        </button>
      </div>
    </section>

    <!-- KARTU 2: TABEL FORM ISIAN -->
    <section v-if="isFormOpen && activeLaporan" class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      
      <!-- Header Kartu & Status Workflow -->
      <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 class="text-base font-black text-slate-950 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" :class="isReadOnly ? 'bg-emerald-500' : 'bg-yellow-400'"></span>
            2. Isi data ({{ activeLaporan.wilayah?.nama_kabupaten_kota || 'Wilayah' }} - {{ bulanList.find(b => b.value === activeLaporan.bulan)?.label }} {{ activeLaporan.tahun }})
          </h2>
          <p class="text-xs text-slate-500 mt-0.5 font-medium">
            ID Dokumen: <span class="font-mono font-bold text-slate-900">#{{ activeLaporan.id_laporan }}</span> &bull; 
            Triwulan: <span class="font-mono font-bold text-slate-900">TW {{ activeLaporan.triwulan }}</span>
          </p>
        </div>

        <!-- Badges & Tombol Workflow -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Status Draf (Kuning) -->
          <div
            v-if="activeLaporan.status_laporan === 'draf'"
            class="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-amber-950 border border-yellow-300 flex items-center gap-1.5"
          >
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Status: DRAF (Dapat Diedit)
          </div>

          <!-- Status Terkirim (Biru) -->
          <div
            v-else-if="activeLaporan.status_laporan === 'terkirim'"
            class="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-950 border border-sky-300 flex items-center gap-1.5"
          >
            <span class="w-2 h-2 rounded-full bg-sky-600"></span>
            Status: TERKIRIM (Menunggu Pengesahan)
          </div>

          <!-- Status Disahkan (Hijau / Kunci) -->
          <div
            v-else-if="activeLaporan.status_laporan === 'disahkan'"
            class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            DISAHKAN (Terkunci / Read-Only)
          </div>

          <!-- Tombol Kirim (Kuning/Biru) -->
          <button
            v-if="activeLaporan.status_laporan === 'draf' && (isOperator || isAdmin)"
            @click="aksiKirim"
            :disabled="isWorkflowLoading"
            class="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-yellow-500/50 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
            Kirim ke Kepala Balai
          </button>

          <!-- Tombol Sahkan (Hitam) -->
          <button
            v-if="activeLaporan.status_laporan === 'terkirim' && (isKepalaBalai || isAdmin)"
            @click="aksiSahkan"
            :disabled="isWorkflowLoading"
            class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Sahkan Laporan
          </button>

          <!-- Tombol Kembalikan ke Draf (Merah/Oranye) -->
          <button
            v-if="(activeLaporan.status_laporan === 'terkirim' || activeLaporan.status_laporan === 'disahkan') && (isKepalaBalai || isAdmin)"
            @click="aksiKembalikan"
            :disabled="isWorkflowLoading"
            class="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
            </svg>
            Kembalikan ke Draf
          </button>
        </div>
      </div>

      <!-- Banner jika terkunci (Read-Only) -->
      <div v-if="isReadOnly" class="p-3 rounded-lg bg-yellow-50 border border-yellow-300 text-amber-950 text-xs flex items-center gap-2">
        <svg class="w-4 h-4 shrink-0 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <span>
          Laporan telah disahkan pada <strong>{{ activeLaporan.tanggal_pengesahan }}</strong>. Modul K1 s.d. K10 berstatus <strong>read-only</strong> dan perubahan data dikunci (HTTP 403 Forbidden).
        </span>
      </div>

      <!-- Wadah scroll tabel saja, tidak membuat halaman scroll mendatar -->
      <div class="overflow-x-auto rounded-lg border border-slate-300 max-w-full shadow-xs">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <!-- Header Baris 1 (Hitam Elegan dengan teks putih) -->
            <tr class="bg-slate-900 text-white border-b border-slate-800">
              <th
                rowspan="2"
                class="p-2.5 font-bold text-center sticky left-0 z-20 bg-slate-900 border-r border-slate-800 w-12 min-w-[48px]"
              >
                No
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-bold sticky left-12 z-20 bg-slate-900 border-r border-slate-800 w-48 min-w-[190px]"
              >
                Jabatan
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-bold text-center border-r border-slate-800 w-16 min-w-[64px]"
              >
                Umum
              </th>
              <th
                colspan="11"
                class="p-2 font-bold text-center border-r border-slate-800 bg-slate-800 text-yellow-300"
              >
                Spesialis
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-black text-center border-r border-slate-800 bg-yellow-400 text-slate-950 w-20 min-w-[80px]"
              >
                Jumlah
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-bold text-center border-r border-slate-800 w-16 min-w-[64px]"
              >
                PPNS
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-bold w-40 min-w-[160px]"
              >
                Ket.
              </th>
            </tr>
            <!-- Header Baris 2 (Spesialis 1-11) -->
            <tr class="bg-slate-800 text-slate-200 border-b border-slate-700">
              <th
                v-for="sf in config.spesialisFields"
                :key="sf.key"
                class="p-1.5 font-bold text-center border-r border-slate-700 w-12 min-w-[48px] text-yellow-300"
                :title="sf.text"
              >
                {{ sf.label }}
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-200 text-slate-900">
            <template v-for="(row, rIdx) in config.rows" :key="row.id_jabatan || `grp-${rIdx}`">
              
              <!-- Tipe Baris Grup (Terampil/SLA & Ahli/S1-S2) - Aksen Kuning Lembut -->
              <tr v-if="row.isGroup" class="bg-yellow-50 font-bold text-amber-950 border-b border-yellow-200">
                <td class="p-2.5 text-center sticky left-0 z-10 bg-yellow-50 border-r border-yellow-200">
                  {{ row.no }}
                </td>
                <td class="p-2.5 sticky left-12 z-10 bg-yellow-50 border-r border-yellow-200">
                  {{ row.label }}
                </td>
                <td class="p-2 text-center text-slate-400 border-r border-yellow-200">-</td>
                <td
                  v-for="sf in config.spesialisFields"
                  :key="`grp-${row.no}-${sf.key}`"
                  class="p-2 text-center text-slate-400 border-r border-yellow-200"
                >
                  -
                </td>
                <td class="p-2 text-center text-slate-400 border-r border-yellow-200 bg-amber-100/60">-</td>
                <td class="p-2 text-center text-slate-400 border-r border-yellow-200">-</td>
                <td class="p-2 text-center text-slate-400">-</td>
              </tr>

              <!-- Tipe Baris Data Isian -->
              <tr v-else class="hover:bg-slate-50 transition">
                <!-- No (Sticky 1) -->
                <td class="p-2.5 text-center sticky left-0 z-10 bg-white border-r border-slate-200 text-slate-500 font-mono font-bold">
                  {{ row.no }}
                </td>
                <!-- Jabatan (Sticky 2) -->
                <td class="p-2.5 sticky left-12 z-10 bg-white border-r border-slate-200 whitespace-nowrap font-medium text-slate-900">
                  {{ row.label }}
                </td>
                <!-- Umum -->
                <td class="p-1 border-r border-slate-200">
                  <input
                    type="number"
                    min="0"
                    :disabled="isReadOnly"
                    :value="rowsData[row.id_jabatan]?.jml_umum"
                    @input="onNumberInput(row.id_jabatan, 'jml_umum', $event)"
                    class="w-full text-center bg-white border border-slate-300 text-slate-900 rounded py-1 px-1 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 disabled:bg-slate-100 disabled:text-slate-400 font-mono"
                  />
                </td>
                <!-- Spesialis 1 - 11 -->
                <td
                  v-for="sf in config.spesialisFields"
                  :key="`data-${row.id_jabatan}-${sf.key}`"
                  class="p-1 border-r border-slate-200"
                >
                  <input
                    type="number"
                    min="0"
                    :disabled="isReadOnly"
                    :value="rowsData[row.id_jabatan]?.[sf.key]"
                    @input="onNumberInput(row.id_jabatan, sf.key, $event)"
                    class="w-full text-center bg-white border border-slate-300 text-slate-900 rounded py-1 px-1 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 disabled:bg-slate-100 disabled:text-slate-400 font-mono"
                  />
                </td>
                <!-- Jumlah (Otomatis & Aksen Kuning Emas) -->
                <td class="p-2 text-center font-black text-amber-950 bg-yellow-100 border-r border-slate-200 font-mono">
                  {{ summaryTotals.rowTotals[row.id_jabatan] ?? 0 }}
                </td>
                <!-- PPNS -->
                <td class="p-1 border-r border-slate-200">
                  <input
                    type="number"
                    min="0"
                    :disabled="isReadOnly"
                    :value="rowsData[row.id_jabatan]?.jml_ppns"
                    @input="onNumberInput(row.id_jabatan, 'jml_ppns', $event)"
                    class="w-full text-center bg-white border border-slate-300 text-slate-900 rounded py-1 px-1 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 disabled:bg-slate-100 disabled:text-slate-400 font-mono"
                  />
                </td>
                <!-- Keterangan -->
                <td class="p-1">
                  <input
                    type="text"
                    maxlength="255"
                    :disabled="isReadOnly"
                    v-model="rowsData[row.id_jabatan].keterangan"
                    placeholder="Keterangan..."
                    class="w-full bg-white border border-slate-300 text-slate-900 rounded py-1 px-2 focus:outline-none focus:border-yellow-500 text-xs disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </td>
              </tr>
            </template>

            <!-- BARIS JUMLAH TOTAL (KUNING HITAM BOLD) -->
            <tr class="bg-yellow-400 font-black text-slate-950 border-t-2 border-yellow-500">
              <td class="p-2.5 text-center sticky left-0 z-10 bg-yellow-400 border-r border-yellow-500/50">
                -
              </td>
              <td class="p-2.5 sticky left-12 z-10 bg-yellow-400 border-r border-yellow-500/50 tracking-wider uppercase">
                JUMLAH
              </td>
              <td class="p-2.5 text-center border-r border-yellow-500/50 font-mono">
                {{ summaryTotals.colTotals.jml_umum }}
              </td>
              <td
                v-for="sf in config.spesialisFields"
                :key="`tot-${sf.key}`"
                class="p-2.5 text-center border-r border-yellow-500/50 font-mono"
              >
                {{ summaryTotals.colTotals[sf.key] }}
              </td>
              <td class="p-2.5 text-center bg-slate-950 text-yellow-400 border-r border-slate-800 text-sm font-mono font-black">
                {{ summaryTotals.grandTotal }}
              </td>
              <td class="p-2.5 text-center border-r border-yellow-500/50 font-mono">
                {{ summaryTotals.colTotals.jml_ppns }}
              </td>
              <td class="p-2.5 text-center text-slate-800">
                -
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- EMPAT TOMBOL AKSI -->
      <div class="pt-4 flex flex-wrap items-center justify-end gap-3">
        <!-- Tombol Tutup (Netral) -->
        <button
          @click="tutupForm"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm rounded-lg border border-slate-300 transition cursor-pointer"
        >
          Tutup
        </button>

        <!-- Tombol Reset ke Nol (Merah) -->
        <button
          @click="resetKeNol"
          :disabled="isReadOnly"
          class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs sm:text-sm rounded-lg border border-red-300 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reset ke nol
        </button>

        <!-- Tombol Download Excel (Hijau/Emerald) -->
        <button
          @click="downloadExcel"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Download Excel
        </button>

        <!-- Tombol Simpan (Kuning & Hitam) -->
        <button
          @click="simpan"
          :disabled="isLoading || isReadOnly"
          class="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-lg shadow-sm border border-yellow-500/50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg v-if="isLoading" class="animate-spin w-4 h-4 text-black" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <svg v-else class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          {{ isReadOnly ? 'Data Terkunci' : 'Simpan' }}
        </button>
      </div>
    </section>

    <!-- KARTU 3: KETERANGAN KOLOM SPESIALIS (PUTIH DENGAN AKSEN KUNING) -->
    <section
      v-if="config.specialistDescriptions && config.specialistDescriptions.length > 0"
      class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs"
    >
      <h3 class="text-sm font-bold text-slate-950 mb-3 flex items-center gap-2">
        <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Keterangan kolom spesialis:
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
        <div
          v-for="desc in config.specialistDescriptions"
          :key="desc.id"
          class="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 flex items-start gap-2"
        >
          <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-yellow-400 text-slate-950 font-black text-[11px] shrink-0 border border-yellow-500/50">
            {{ desc.id }}
          </span>
          <span class="leading-relaxed text-slate-900 font-medium">{{ desc.text }}</span>
        </div>
      </div>
    </section>

  </div>
</template>
