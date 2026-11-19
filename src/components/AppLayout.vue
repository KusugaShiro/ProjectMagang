<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formList } from '../forms'
import {
  currentUser,
  SEED_ACCOUNTS,
  switchAccount,
  initAuth,
} from '../lib/auth'

const route = useRoute()
const router = useRouter()
const isMobileSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)

onMounted(async () => {
  await initAuth()
})

function toggleMobileSidebar() {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false
}

async function pilihAkun(email) {
  try {
    await switchAccount(email)
    isAccountMenuOpen.value = false
    router.go(0)
  } catch (err) {
    alert('Gagal login ke akun backend: ' + (err.message || err))
  }
}

const currentTitle = computed(() => {
  if (route.path === '/') return 'Beranda'
  if (route.path === '/tersimpan') return 'Laporan Tersimpan'
  if (route.params.kode) {
    const kode = route.params.kode.toUpperCase()
    const found = formList.find(f => f.kode.toUpperCase() === kode)
    return found ? `${found.kode} - ${found.nama}` : `Form ${kode}`
  }
  return 'Laporan Pengawasan'
})

const peranLabel = computed(() => {
  const p = currentUser.value?.peran
  if (p === 'admin') return 'Administrator'
  if (p === 'kepala_balai') return 'Kepala Balai'
  if (p === 'operator_kabupaten') {
    return currentUser.value?.id_wilayah === 1 ? 'Operator BJM' : 'Operator Batola'
  }
  return 'Pengguna'
})
</script>

<template>
  <div class="min-h-screen bg-white text-black font-sans flex flex-col antialiased selection:bg-slate-300 selection:text-black">

    <!-- OVERLAY SIDEBAR MOBILE -->
    <div
      v-if="isMobileSidebarOpen"
      @click="closeMobileSidebar"
      class="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
    ></div>

    <!-- WRAPPER UTAMA -->
    <div class="flex-1 flex overflow-hidden">

      <!-- SIDEBAR KIRI (PUTIH & ABU-ABU BERSIH) -->
      <aside
        :class="[
          'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r-2 border-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        ]"
      >
        <!-- Header Sidebar -->
        <div class="p-5 border-b-2 border-slate-300 flex items-center justify-between bg-white">
          <div class="flex items-center gap-3">
            <!-- Ikon Perisai SVG (Abu-abu Gelap & Putih) -->
            <div class="w-10 h-10 rounded-xl bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-white font-black shadow-xs shrink-0">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.54-3.14 8.78-7 9.88-3.86-1.1-7-5.34-7-9.88V6.3l7-3.12z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-sm font-black text-black leading-tight tracking-wide">
                Laporan Pengawasan
              </h2>
              <p class="text-[11px] text-slate-600 font-bold leading-tight mt-0.5">
                Balai Pengawasan Wilayah I Banjarmasin
              </p>
            </div>
          </div>

          <!-- Tombol Tutup Sidebar di Mobile -->
          <button
            @click="closeMobileSidebar"
            class="lg:hidden p-1 rounded-lg text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Navigasi Menu Sidebar -->
        <nav class="flex-1 overflow-y-auto p-3 space-y-6 text-xs custom-scrollbar bg-white">

          <!-- Menu Beranda -->
          <div>
            <router-link
              to="/"
              @click="closeMobileSidebar"
              :class="[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition',
                route.path === '/'
                  ? 'bg-slate-800 text-white font-black shadow-xs'
                  : 'text-slate-800 font-bold hover:bg-slate-100 hover:text-black'
              ]"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <span>Beranda</span>
            </router-link>
          </div>

          <!-- Grup: INPUT LAPORAN -->
          <div>
            <div class="px-3 mb-2 text-[11px] font-black tracking-wider uppercase text-slate-500 border-b border-slate-200 pb-1">
              INPUT LAPORAN
            </div>
            <div class="space-y-1">
              <router-link
                v-for="item in formList"
                :key="item.kode"
                :to="`/input/${item.kode.toLowerCase()}`"
                @click="closeMobileSidebar"
                :class="[
                  'flex items-start gap-2.5 px-3 py-2 rounded-lg transition text-left',
                  route.path === `/input/${item.kode.toLowerCase()}`
                    ? 'bg-slate-800 text-white font-black shadow-xs'
                    : 'text-slate-800 font-bold hover:bg-slate-100 hover:text-black'
                ]"
              >
                <!-- Kode Tebal di Kiri -->
                <span class="font-mono font-black text-xs shrink-0 w-9">
                  {{ item.kode }}
                </span>
                <!-- Nama Lengkap Termasuk (a), (b), (c) Tidak Terpotong -->
                <span class="break-words leading-snug">
                  {{ item.nama }}
                </span>
              </router-link>
            </div>
          </div>

          <!-- Grup: ARSIP -->
          <div>
            <div class="px-3 mb-2 text-[11px] font-black tracking-wider uppercase text-slate-500 border-b border-slate-200 pb-1">
              ARSIP
            </div>
            <div class="space-y-1">
              <router-link
                to="/tersimpan"
                @click="closeMobileSidebar"
                :class="[
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition',
                  route.path === '/tersimpan'
                    ? 'bg-slate-800 text-white font-black shadow-xs'
                    : 'text-slate-800 font-bold hover:bg-slate-100 hover:text-black'
                ]"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                </svg>
                <span>Laporan Tersimpan</span>
              </router-link>
            </div>
          </div>

        </nav>

        <!-- Footer Sidebar -->
        <div class="p-3 border-t-2 border-slate-200 text-[11px] text-slate-600 font-bold text-center bg-slate-50">
          &copy; 2026 UPTD Balai Pengawasan Kalsel I
        </div>
      </aside>

      <!-- KONTEN AREA KANAN -->
      <div class="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">

        <!-- TOP BAR (PUTIH DENGAN TEKS HITAM/ABU-ABU) -->
        <header class="h-16 bg-white border-b-2 border-slate-300 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
          <div class="flex items-center gap-3 min-w-0">
            <!-- Tombol Hamburger (Mobile) -->
            <button
              @click="toggleMobileSidebar"
              class="lg:hidden p-2 rounded-lg text-slate-800 hover:bg-slate-100 cursor-pointer"
              aria-label="Buka Menu"
            >
              <svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            <!-- Judul Halaman di Top Bar -->
            <h1 class="text-sm sm:text-base font-black text-black truncate">
              {{ currentTitle }}
            </h1>
          </div>

          <!-- USER SESI & ROLE SWITCHER -->
          <div class="relative flex items-center gap-3">
            <button
              @click="isAccountMenuOpen = !isAccountMenuOpen"
              class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border-2 border-slate-400 hover:bg-slate-100 transition cursor-pointer shadow-xs"
            >
              <div class="w-2.5 h-2.5 rounded-full bg-slate-500 ring-2 ring-slate-300"></div>
              <div class="text-left hidden sm:block">
                <div class="text-xs font-black text-black leading-tight">
                  {{ currentUser?.nama_pengguna || 'Pengguna' }}
                </div>
                <div class="text-[10px] text-slate-600 font-bold leading-tight">
                  {{ peranLabel }}
                </div>
              </div>
              <svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <!-- DROPDOWN GANTI AKUN -->
            <div
              v-if="isAccountMenuOpen"
              class="absolute right-0 top-12 w-64 bg-white border-2 border-slate-300 rounded-xl shadow-2xl p-2 z-50 text-xs"
            >
              <div class="px-3 py-2 border-b border-slate-200 text-black text-[11px] font-black">
                Ganti Akun Pengujian:
              </div>
              <div class="space-y-1 mt-1">
                <button
                  v-for="acc in SEED_ACCOUNTS"
                  :key="acc.email"
                  @click="pilihAkun(acc.email)"
                  :class="[
                    'w-full text-left px-3 py-2 rounded-lg transition flex flex-col cursor-pointer',
                    currentUser?.email === acc.email
                      ? 'bg-slate-800 text-white font-black'
                      : 'hover:bg-slate-100 text-slate-800 font-bold'
                  ]"
                >
                  <span class="text-xs">{{ acc.nama_pengguna }}</span>
                  <span class="text-[10px] font-mono opacity-80">
                    {{ acc.peran }} {{ acc.wilayah ? `(${acc.wilayah.kode_wilayah})` : '(Global)' }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <!-- KONTEN HALAMAN -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <router-view />
        </main>
      </div>

    </div>
  </div>
</template>
