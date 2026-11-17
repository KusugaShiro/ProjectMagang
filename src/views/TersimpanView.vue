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
        <h1 class="text-xl sm:text-2xl font-black text-black">Laporan Tersimpan</h1>
        <p class="text-xs sm:text-sm text-black font-bold">Daftar dokumen laporan bulanan dan status pengesahan (UPTD Balai Wilayah I).</p>
      </div>

      <button
        @click="muatDaftar"
        :disabled="isLoading"
        class="self-start sm:self-auto px-4 py-2 bg-white hover:bg-yellow-100 border-2 border-black text-black text-xs font-black rounded-lg transition flex items-center gap-2 cursor-pointer shadow-xs"
      >
        <svg :class="['w-3.5 h-3.5 text-black', isLoading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Segarkan
      </button>
    </div>

    <!-- Feedback Message (Kuning Cerah & Teks Hitam) -->
    <div v-if="feedbackMessage" class="p-4 rounded-xl bg-yellow-300 border-2 border-black text-black text-sm flex items-center gap-2 shadow-xs">
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
        <div class="w-12 h-12 rounded-full bg-yellow-100 border-2 border-black flex items-center justify-center mx-auto mb-3 text-black">
          <svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
        </div>
        <p class="text-base font-black text-black mb-1">Belum ada dokumen laporan bulanan</p>
        <p class="text-xs text-black font-bold mb-4">Buat laporan bulanan melalui menu Form K1.</p>
        <router-link
          to="/input/k1"
          class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg text-xs font-black transition cursor-pointer border-2 border-black shadow-xs"
        >
          <span>Input Form K1</span>
          <svg class="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </router-link>
      </div>

      <!-- Tabel Daftar Laporan -->
      <div v-else class="overflow-x-auto rounded-lg border-2 border-black shadow-xs">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-black text-white border-b-2 border-black">
              <th class="p-3 font-black text-center w-14">ID</th>
              <th class="p-3 font-black">Wilayah</th>
              <th class="p-3 font-black text-center">Formulir</th>
              <th class="p-3 font-black">Periode (Bulan & TW)</th>
              <th class="p-3 font-black text-center">Tahun</th>
              <th class="p-3 font-black text-center">Status</th>
              <th class="p-3 font-black">Pembuat</th>
              <th class="p-3 font-black text-center w-52">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-300 text-black">
            <tr
              v-for="item in items"
              :key="item.id_laporan"
              class="hover:bg-yellow-50/50 transition font-bold"
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
                <div class="flex items-center justify-center gap-1 flex-wrap">
                  <span
                    v-for="m in (item.modul_list?.length ? item.modul_list : [item.kode || 'K1'])"
                    :key="m"
                    class="px-2 py-0.5 rounded text-[11px] font-black bg-yellow-400 text-black border border-black"
                  >
                    {{ m }}
                  </span>
                </div>
              </td>

              <!-- Periode -->
              <td class="p-3">
                <span class="text-black font-black">{{ bulanNames[item.bulan] || `Bulan ${item.bulan}` }}</span>
                <span class="text-[10px] ml-1.5 px-2 py-0.5 rounded bg-yellow-300 text-black border border-black font-black">
                  TW {{ item.triwulan }}
                </span>
              </td>

              <!-- Tahun -->
              <td class="p-3 text-center font-mono font-black text-black">{{ item.tahun }}</td>

              <!-- Status Badge -->
              <td class="p-3 text-center">
                <!-- Draf (Kuning) -->
                <span
                  v-if="item.status_laporan === 'draf'"
                  class="px-2.5 py-1 rounded-full text-[11px] font-black bg-yellow-300 text-black border border-black inline-flex items-center gap-1"
                >
                  <span class="w-2 h-2 rounded-full bg-black"></span>
                  draf
                </span>
                <!-- Terkirim (Putih border hitam) -->
                <span
                  v-else-if="item.status_laporan === 'terkirim'"
                  class="px-2.5 py-1 rounded-full text-[11px] font-black bg-white text-black border-2 border-black inline-flex items-center gap-1"
                >
                  <span class="w-2 h-2 rounded-full bg-yellow-400 border border-black"></span>
                  terkirim
                </span>
                <!-- Disahkan (Hijau Terang border hitam) -->
                <span
                  v-else-if="item.status_laporan === 'disahkan'"
                  class="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-200 text-black border-2 border-black inline-flex items-center gap-1"
                  :title="`Disahkan pada: ${item.tanggal_pengesahan}`"
                >
                  <svg class="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  disahkan
                </span>
              </td>

              <!-- Pembuat -->
              <td class="p-3 text-xs text-black">
                <div class="text-black font-black">{{ item.pengguna?.nama_pengguna || 'Operator' }}</div>
                <div class="text-[10px] text-black font-mono font-semibold">{{ formatWaktu(item.waktu_input) }}</div>
              </td>

              <!-- Aksi -->
              <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-1.5 flex-wrap">
                  <!-- Buka -->
                  <template v-if="item.modul_list && item.modul_list.length > 1">
                    <button
                      v-for="m in item.modul_list"
                      :key="m"
                      @click="bukaLaporan(item, m)"
                      class="px-2 py-1 bg-yellow-400 hover:bg-yellow-300 text-black rounded text-xs font-black transition cursor-pointer border-2 border-black shadow-xs"
                      :title="`Buka Form ${m}`"
                    >
                      Buka {{ m }}
                    </button>
                  </template>
                  <button
                    v-else
                    @click="bukaLaporan(item, item.kode || 'k1')"
                    class="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-black rounded text-xs font-black transition cursor-pointer border-2 border-black shadow-xs"
                    :title="`Buka Form ${item.kode || 'K1'}`"
                  >
                    Buka {{ item.kode ? item.kode : '' }}
                  </button>

                  <!-- Kirim (Jika Draf - Putih border hitam) -->
                  <button
                    v-if="item.status_laporan === 'draf' && (isOperator || isAdmin)"
                    @click="prosesKirim(item)"
                    class="px-2 py-1 bg-white hover:bg-yellow-100 text-black border-2 border-black rounded text-xs font-black transition cursor-pointer shadow-xs"
                    title="Kirim ke Kepala Balai"
                  >
                    Kirim
                  </button>

                  <!-- Sahkan (Jika Terkirim - Hitam teks Kuning) -->
                  <button
                    v-if="item.status_laporan === 'terkirim' && (isKepalaBalai || isAdmin)"
                    @click="prosesSahkan(item)"
                    class="px-2 py-1 bg-black hover:bg-slate-800 text-yellow-300 border-2 border-black rounded text-xs font-black transition cursor-pointer shadow-xs"
                    title="Sahkan Laporan"
                  >
                    Sahkan
                  </button>

                  <!-- Kembalikan ke Draf (Merah muda) -->
                  <button
                    v-if="(item.status_laporan === 'terkirim' || item.status_laporan === 'disahkan') && (isKepalaBalai || isAdmin)"
                    @click="prosesKembalikan(item)"
                    class="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-950 border border-red-500 rounded text-xs font-black transition cursor-pointer"
                    title="Kembalikan ke status Draf"
                  >
                    Kembali
                  </button>

                  <!-- Log (Putih border hitam) -->
                  <button
                    @click="lihatLog(item)"
                    class="px-2 py-1 bg-white hover:bg-slate-100 border border-black text-black rounded text-xs font-bold transition cursor-pointer"
                    title="Lihat Log Perubahan"
                  >
                    Log
                  </button>

                  <!-- Hapus (Merah pekat) -->
                  <button
                    v-if="item.status_laporan !== 'disahkan'"
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
      <div class="bg-white border-2 border-black rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
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
          <div class="mt-2.5 p-3 rounded-lg bg-yellow-50 border-2 border-black text-xs space-y-1 font-bold">
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
            class="px-4 py-2 bg-white hover:bg-slate-100 text-black font-black text-xs sm:text-sm rounded-lg border-2 border-black transition cursor-pointer"
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
      <div class="bg-white border-2 border-black rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b-2 border-black">
          <h3 class="text-sm font-black text-black flex items-center gap-2">
            <svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ activeLogTitle }}
          </h3>
          <button
            @click="isLogOpen = false"
            class="text-black font-black hover:bg-yellow-200 p-1 rounded border border-black"
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
            class="p-3 rounded-lg bg-yellow-50 border-2 border-black text-xs space-y-1"
          >
            <div class="flex items-center justify-between">
              <span class="font-black text-black bg-yellow-300 px-2 py-0.5 rounded border border-black">{{ log.aksi }}</span>
              <span class="text-[10px] text-black font-mono font-bold">{{ formatWaktu(log.waktu) }}</span>
            </div>
            <p class="text-black font-bold">{{ log.catatan }}</p>
            <div class="text-[10px] text-black font-semibold">Oleh: {{ log.pengguna || 'Sistem' }}</div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            @click="isLogOpen = false"
            class="px-4 py-2 bg-black hover:bg-slate-800 text-white text-xs font-black rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
