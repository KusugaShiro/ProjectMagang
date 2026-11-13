<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { daftarLaporan, hapusLaporan } from '../lib/api'
import { getFormMeta } from '../forms'

const router = useRouter()
const items = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const feedbackMessage = ref('')

// State modal konfirmasi hapus buatan sendiri
const isConfirmOpen = ref(false)
const itemToDelete = ref(null)

async function muatDaftar() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    items.value = await daftarLaporan()
  } catch (err) {
    errorMessage.value = 'Gagal memuat arsip laporan: ' + (err.message || err)
  } finally {
    isLoading.value = false
  }
}

function bukaLaporan(item) {
  router.push({
    path: `/input/${item.kode.toLowerCase()}`,
    query: {
      wilayah: item.wilayah,
      jenis: item.jenis,
      periode: item.periode,
      tahun: item.tahun,
    },
  })
}

function mintaKonfirmasiHapus(item) {
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
    await hapusLaporan({
      kode: target.kode,
      wilayah: target.wilayah,
      jenis: target.jenis,
      periode: target.periode,
      tahun: target.tahun,
    })
    feedbackMessage.value = `Laporan ${target.kode} (${target.wilayah} - ${target.periode} ${target.tahun}) berhasil dihapus.`
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
        <h1 class="text-xl sm:text-2xl font-bold text-[#E6ECF8]">Laporan Tersimpan</h1>
        <p class="text-xs sm:text-sm text-[#9AA8C7]">Daftar seluruh laporan pengawasan yang telah tersimpan dalam sistem.</p>
      </div>

      <button
        @click="muatDaftar"
        :disabled="isLoading"
        class="self-start sm:self-auto px-3.5 py-1.5 bg-[#0C1730] hover:bg-[#142852] border border-[#1B2A4A] text-[#E6ECF8] text-xs font-medium rounded-lg transition flex items-center gap-2 cursor-pointer"
      >
        <svg :class="['w-3.5 h-3.5', isLoading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Segarkan
      </button>
    </div>

    <!-- Feedback Message -->
    <div v-if="feedbackMessage" class="p-4 rounded-lg bg-emerald-950/70 border border-emerald-600/70 text-emerald-200 text-sm flex items-center gap-2">
      <svg class="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      {{ feedbackMessage }}
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="p-4 rounded-lg bg-red-950/70 border border-red-700/70 text-red-200 text-sm flex items-center gap-2">
      <svg class="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {{ errorMessage }}
    </div>

    <!-- Kartu Konten Tabel Laporan Tersimpan -->
    <section class="bg-[#0C1730] border border-[#1B2A4A] rounded-xl p-5 shadow-lg">
      <div v-if="isLoading" class="py-16 text-center text-[#9AA8C7]">
        <svg class="animate-spin w-8 h-8 text-blue-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <p class="text-sm">Memuat arsip laporan...</p>
      </div>

      <!-- Jika Kosong -->
      <div v-else-if="items.length === 0" class="py-16 text-center text-[#9AA8C7]">
        <div class="w-12 h-12 rounded-full bg-[#070E1C] border border-[#1B2A4A] flex items-center justify-center mx-auto mb-3 text-slate-500">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
        </div>
        <p class="text-sm font-medium text-[#E6ECF8] mb-1">Belum ada laporan tersimpan</p>
        <p class="text-xs text-[#9AA8C7] mb-4">Silakan buat dan simpan laporan pertama Anda melalui menu input.</p>
        <router-link
          to="/input/k1"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition cursor-pointer"
        >
          <span>Input Form K1</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </router-link>
      </div>

      <!-- Tabel Daftar Laporan -->
      <div v-else class="overflow-x-auto rounded-lg border border-[#1B2A4A]">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-[#081331] text-[#9AA8C7] border-b border-[#1B2A4A]">
              <th class="p-3 font-semibold text-center w-12">No</th>
              <th class="p-3 font-semibold">Formulir</th>
              <th class="p-3 font-semibold">Wilayah</th>
              <th class="p-3 font-semibold">Jenis / Periode</th>
              <th class="p-3 font-semibold text-center">Tahun</th>
              <th class="p-3 font-semibold">Waktu Simpan</th>
              <th class="p-3 font-semibold text-center w-36">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#1B2A4A] text-[#E6ECF8]">
            <tr
              v-for="(item, idx) in items"
              :key="item.key"
              class="hover:bg-[#101F42]/40 transition"
            >
              <td class="p-3 text-center text-[#9AA8C7]">{{ idx + 1 }}</td>
              <td class="p-3 font-medium">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-600/30 text-blue-300 border border-blue-500/40">
                    {{ item.kode }}
                  </span>
                  <span class="text-xs text-[#E6ECF8]">
                    {{ getFormMeta(item.kode)?.nama || item.kode }}
                  </span>
                </div>
              </td>
              <td class="p-3 text-[#E6ECF8] font-semibold">{{ item.wilayah }}</td>
              <td class="p-3 text-[#9AA8C7]">
                <span class="text-[#E6ECF8]">{{ item.periode }}</span>
                <span class="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-[#070E1C] border border-[#1B2A4A]">
                  {{ item.jenis }}
                </span>
              </td>
              <td class="p-3 text-center font-mono">{{ item.tahun }}</td>
              <td class="p-3 text-[#9AA8C7] text-[11px]">{{ formatWaktu(item.updatedAt) }}</td>
              <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <!-- Tombol Buka -->
                  <button
                    @click="bukaLaporan(item)"
                    class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition cursor-pointer flex items-center gap-1"
                    title="Buka laporan ini"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    Buka
                  </button>

                  <!-- Tombol Hapus -->
                  <button
                    @click="mintaKonfirmasiHapus(item)"
                    class="px-2.5 py-1 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1"
                    title="Hapus laporan ini"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MODAL KONFIRMASI HAPUS BUATAN SENDIRI -->
    <div
      v-if="isConfirmOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div class="bg-[#0C1730] border border-[#1B2A4A] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-700/60 flex items-center justify-center text-rose-400">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>

        <div>
          <h3 class="text-lg font-bold text-[#E6ECF8]">Konfirmasi Hapus Laporan</h3>
          <p class="text-xs sm:text-sm text-[#9AA8C7] mt-1.5">
            Apakah Anda yakin ingin menghapus arsip laporan:
          </p>
          <div class="mt-2.5 p-3 rounded-lg bg-[#070E1C] border border-[#1B2A4A] text-xs space-y-1">
            <div><strong class="text-[#E6ECF8]">Formulir:</strong> {{ itemToDelete?.kode }} - {{ getFormMeta(itemToDelete?.kode)?.nama }}</div>
            <div><strong class="text-[#E6ECF8]">Wilayah:</strong> {{ itemToDelete?.wilayah }}</div>
            <div><strong class="text-[#E6ECF8]">Periode:</strong> {{ itemToDelete?.periode }} {{ itemToDelete?.tahun }} ({{ itemToDelete?.jenis }})</div>
          </div>
          <p class="text-xs text-rose-400 mt-2">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            @click="batalHapus"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs sm:text-sm rounded-lg border border-slate-700 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="prosesHapus"
            class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs sm:text-sm rounded-lg shadow-md transition cursor-pointer"
          >
            Ya, Hapus Laporan
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
