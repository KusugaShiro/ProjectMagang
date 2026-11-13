<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  apiGetDaftarLaporan,
  apiHapusLaporan,
  apiKirimLaporan,
  apiSahkanLaporan,
  apiKembalikanLaporan,
  apiGetLaporanLog,
} from '../lib/api'
import {
  currentUser,
  isOperator,
  isKepalaBalai,
  isAdmin,
} from '../lib/auth'

const router = useRouter()
const items = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const feedbackMessage = ref('')

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
    items.value = await apiGetDaftarLaporan()
  } catch (err) {
    errorMessage.value = 'Gagal memuat arsip laporan: ' + (err.message || err)
  } finally {
    isLoading.value = false
  }
}

function bukaLaporan(item) {
  router.push({
    path: '/input/k1',
    query: {
      id_wilayah: item.id_wilayah,
      bulan: item.bulan,
      tahun: item.tahun,
    },
  })
}

function mintaKonfirmasiHapus(item) {
  if (item.status_laporan === 'disahkan') {
    alert('Laporan yang sudah berstatus disahkan tidak dapat dihapus.')
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

async function prosesKirim(item) {
  if (!confirm(`Kirim laporan #${item.id_laporan} ke Kepala Balai?`)) return
  try {
    await apiKirimLaporan(item.id_laporan)
    feedbackMessage.value = `Laporan #${item.id_laporan} berhasil dikirim ke Kepala Balai.`
    await muatDaftar()
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengirim laporan.'
  }
}

async function prosesSahkan(item) {
  if (!confirm(`Sahkan laporan #${item.id_laporan}? Data akan dikunci.`)) return
  try {
    await apiSahkanLaporan(item.id_laporan)
    feedbackMessage.value = `Laporan #${item.id_laporan} telah disahkan dan dikunci.`
    await muatDaftar()
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengesahkan laporan.'
  }
}

async function prosesKembalikan(item) {
  if (!confirm(`Kembalikan laporan #${item.id_laporan} ke draf?`)) return
  try {
    await apiKembalikanLaporan(item.id_laporan)
    feedbackMessage.value = `Laporan #${item.id_laporan} dikembalikan ke status draf.`
    await muatDaftar()
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengembalikan laporan.'
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
        <h1 class="text-xl sm:text-2xl font-black text-slate-950">Laporan Tersimpan</h1>
        <p class="text-xs sm:text-sm text-slate-600">Daftar dokumen laporan bulanan dan status pengesahan (UPTD Balai Wilayah I).</p>
      </div>

      <button
        @click="muatDaftar"
        :disabled="isLoading"
        class="self-start sm:self-auto px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg transition flex items-center gap-2 cursor-pointer shadow-xs"
      >
        <svg :class="['w-3.5 h-3.5', isLoading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Segarkan
      </button>
    </div>

    <!-- Feedback Message (Kuning/Hijau) -->
    <div v-if="feedbackMessage" class="p-4 rounded-xl bg-amber-50 border border-yellow-400 text-amber-950 text-sm flex items-center gap-2 shadow-xs">
      <svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      <span class="font-bold">{{ feedbackMessage }}</span>
    </div>

    <!-- Error Message (Merah) -->
    <div v-if="errorMessage" class="p-4 rounded-xl bg-red-50 border border-red-300 text-red-800 text-sm flex items-center gap-2 shadow-xs">
      <svg class="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="font-medium">{{ errorMessage }}</span>
    </div>

    <!-- Tabel Dokumen Laporan Bulanan (Putih) -->
    <section class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div v-if="isLoading" class="py-16 text-center text-slate-500">
        <svg class="animate-spin w-8 h-8 text-yellow-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <p class="text-sm font-medium">Memuat dokumen laporan...</p>
      </div>

      <!-- Jika Kosong -->
      <div v-else-if="items.length === 0" class="py-16 text-center text-slate-500">
        <div class="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
        </div>
        <p class="text-sm font-bold text-slate-900 mb-1">Belum ada dokumen laporan bulanan</p>
        <p class="text-xs text-slate-500 mb-4">Buat laporan bulanan melalui menu Form K1.</p>
        <router-link
          to="/input/k1"
          class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-lg text-xs font-bold transition cursor-pointer border border-yellow-500/50 shadow-xs"
        >
          <span>Input Form K1</span>
          <svg class="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </router-link>
      </div>

      <!-- Tabel Daftar Laporan -->
      <div v-else class="overflow-x-auto rounded-lg border border-slate-200 shadow-xs">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-900 text-white border-b border-slate-800">
              <th class="p-3 font-bold text-center w-14">ID</th>
              <th class="p-3 font-bold">Wilayah</th>
              <th class="p-3 font-bold">Periode (Bulan & TW)</th>
              <th class="p-3 font-bold text-center">Tahun</th>
              <th class="p-3 font-bold text-center">Status</th>
              <th class="p-3 font-bold">Pembuat</th>
              <th class="p-3 font-bold text-center w-48">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 text-slate-900">
            <tr
              v-for="item in items"
              :key="item.id_laporan"
              class="hover:bg-slate-50 transition"
            >
              <!-- ID -->
              <td class="p-3 text-center font-mono text-amber-700 font-black">
                #{{ item.id_laporan }}
              </td>

              <!-- Wilayah -->
              <td class="p-3">
                <div class="font-bold text-slate-950">
                  {{ item.wilayah?.nama_kabupaten_kota || 'Wilayah ' + item.id_wilayah }}
                </div>
                <div class="text-[10px] text-slate-500 font-mono">
                  Kode: {{ item.wilayah?.kode_wilayah || (item.id_wilayah === 1 ? 'BJM' : 'BTL') }}
                </div>
              </td>

              <!-- Periode -->
              <td class="p-3">
                <span class="text-slate-900 font-bold">{{ bulanNames[item.bulan] || `Bulan ${item.bulan}` }}</span>
                <span class="text-[10px] ml-1.5 px-2 py-0.5 rounded bg-yellow-100 text-amber-950 border border-yellow-300 font-black">
                  TW {{ item.triwulan }}
                </span>
              </td>

              <!-- Tahun -->
              <td class="p-3 text-center font-mono font-bold">{{ item.tahun }}</td>

              <!-- Status Badge -->
              <td class="p-3 text-center">
                <!-- Draf (Kuning) -->
                <span
                  v-if="item.status_laporan === 'draf'"
                  class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-100 text-amber-950 border border-yellow-300 inline-flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  draf
                </span>
                <!-- Terkirim (Biru) -->
                <span
                  v-else-if="item.status_laporan === 'terkirim'"
                  class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-950 border border-sky-300 inline-flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                  terkirim
                </span>
                <!-- Disahkan (Hijau / Kunci) -->
                <span
                  v-else-if="item.status_laporan === 'disahkan'"
                  class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 inline-flex items-center gap-1"
                  :title="`Disahkan pada: ${item.tanggal_pengesahan}`"
                >
                  <svg class="w-3 h-3 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  disahkan
                </span>
              </td>

              <!-- Pembuat -->
              <td class="p-3 text-xs text-slate-600">
                <div class="text-slate-900 font-semibold">{{ item.pengguna?.nama_pengguna || 'Operator' }}</div>
                <div class="text-[10px] text-slate-400 font-mono">{{ formatWaktu(item.waktu_input) }}</div>
              </td>

              <!-- Aksi -->
              <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-1.5 flex-wrap">
                  <!-- Buka (Kuning) -->
                  <button
                    @click="bukaLaporan(item)"
                    class="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded text-xs font-bold transition cursor-pointer border border-yellow-500/50 shadow-2xs"
                    title="Buka Form K1"
                  >
                    Buka
                  </button>

                  <!-- Kirim (Jika Draf) -->
                  <button
                    v-if="item.status_laporan === 'draf' && (isOperator || isAdmin)"
                    @click="prosesKirim(item)"
                    class="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold transition cursor-pointer shadow-2xs"
                    title="Kirim ke Kepala Balai"
                  >
                    Kirim
                  </button>

                  <!-- Sahkan (Jika Terkirim - Hitam) -->
                  <button
                    v-if="item.status_laporan === 'terkirim' && (isKepalaBalai || isAdmin)"
                    @click="prosesSahkan(item)"
                    class="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded text-xs font-bold transition cursor-pointer shadow-2xs"
                    title="Sahkan Laporan"
                  >
                    Sahkan
                  </button>

                  <!-- Kembalikan ke Draf (Merah/Oranye) -->
                  <button
                    v-if="(item.status_laporan === 'terkirim' || item.status_laporan === 'disahkan') && (isKepalaBalai || isAdmin)"
                    @click="prosesKembalikan(item)"
                    class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded text-xs font-bold transition cursor-pointer"
                    title="Kembalikan ke status Draf"
                  >
                    Kembali
                  </button>

                  <!-- Log (Netral) -->
                  <button
                    @click="lihatLog(item)"
                    class="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded text-xs font-medium transition cursor-pointer"
                    title="Lihat Log Perubahan"
                  >
                    Log
                  </button>

                  <!-- Hapus (Merah - Dilarang jika disahkan) -->
                  <button
                    v-if="item.status_laporan !== 'disahkan'"
                    @click="mintaKonfirmasiHapus(item)"
                    class="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition cursor-pointer shadow-2xs"
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
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="w-12 h-12 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>

        <div>
          <h3 class="text-lg font-black text-slate-900">Konfirmasi Hapus Laporan</h3>
          <p class="text-xs sm:text-sm text-slate-600 mt-1.5">
            Apakah Anda yakin ingin menghapus dokumen laporan bulanan ini:
          </p>
          <div class="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div><strong class="text-slate-900">ID Laporan:</strong> #{{ itemToDelete?.id_laporan }}</div>
            <div><strong class="text-slate-900">Wilayah:</strong> {{ itemToDelete?.wilayah?.nama_kabupaten_kota }}</div>
            <div><strong class="text-slate-900">Periode:</strong> {{ bulanNames[itemToDelete?.bulan] }} {{ itemToDelete?.tahun }} (TW {{ itemToDelete?.triwulan }})</div>
          </div>
          <p class="text-xs text-red-600 font-semibold mt-2">
            Seluruh data matriks K1 s.d. K10 di dalam laporan ini akan terhapus secara permanen.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            @click="batalHapus"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-lg border border-slate-300 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="prosesHapus"
            class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition cursor-pointer"
          >
            Ya, Hapus Laporan
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL AUDIT TRAIL LOG -->
    <div
      v-if="isLogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ activeLogTitle }}
          </h3>
          <button
            @click="isLogOpen = false"
            class="text-slate-400 hover:text-black p-1 rounded hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div v-if="isLogLoading" class="py-8 text-center text-slate-500 text-xs font-medium">
          Memuat riwayat log...
        </div>

        <div v-else-if="activeLogs.length === 0" class="py-8 text-center text-slate-500 text-xs">
          Belum ada riwayat aktivitas pada laporan ini.
        </div>

        <div v-else class="space-y-3 max-h-80 overflow-y-auto pr-1">
          <div
            v-for="(log, idx) in activeLogs"
            :key="idx"
            class="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-amber-900 bg-yellow-200/70 px-1.5 py-0.5 rounded">{{ log.aksi }}</span>
              <span class="text-[10px] text-slate-500 font-mono">{{ formatWaktu(log.waktu) }}</span>
            </div>
            <p class="text-slate-900 font-medium">{{ log.catatan }}</p>
            <div class="text-[10px] text-slate-500">Oleh: {{ log.pengguna || 'Sistem' }}</div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            @click="isLogOpen = false"
            class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
