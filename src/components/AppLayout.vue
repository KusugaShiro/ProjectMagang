<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formList } from '../forms'
import logoDinas from '../assets/logodinas.jpeg'
import {
  currentUser,
  logout,
  initAuth,
} from '../lib/auth'

const route = useRoute()
const router = useRouter()
const isMobileSidebarOpen = ref(false)
const isDesktopSidebarOpen = ref(true)
const isAccountMenuOpen = ref(false)
const isLogoutConfirmOpen = ref(false)

onMounted(async () => {
  const valid = await initAuth()
  if (!valid) {
    router.replace({ name: 'Login' })
  }
})

function toggleSidebar() {
  if (window.innerWidth >= 1024) {
    isDesktopSidebarOpen.value = !isDesktopSidebarOpen.value
  } else {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
  }
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false
}

function mintaKonfirmasiLogout() {
  isAccountMenuOpen.value = false
  isLogoutConfirmOpen.value = true
}

function batalLogout() {
  isLogoutConfirmOpen.value = false
}

async function handleLogout() {
  isLogoutConfirmOpen.value = false
  await logout()
  router.replace({ name: 'Login' })
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
          'fixed inset-y-0 left-0 z-50 bg-white border-r-2 border-slate-300 flex flex-col transition-all duration-200 ease-in-out lg:static shrink-0',
          isMobileSidebarOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full w-72',
          isDesktopSidebarOpen ? 'lg:translate-x-0 lg:w-72' : 'lg:-translate-x-full lg:w-0 lg:border-r-0 lg:overflow-hidden'
        ]"
      >
        <!-- Header Sidebar (Tinggi h-16 sejajar lurus dengan Top Bar) -->
        <div class="h-16 px-4 border-b-2 border-slate-300 flex items-center justify-between gap-2 bg-white shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <!-- Logo Dinas Binwasnaker -->
            <img
              :src="logoDinas"
              alt="Logo Binwasnaker Wilayah I Banjarmasin"
              class="w-10 h-10 rounded-lg bg-white border border-slate-300 object-contain p-0.5 shrink-0"
            />
            <div class="min-w-0">
              <h2 class="text-sm font-black text-black leading-tight tracking-wide truncate">
                Laporan Pengawasan
              </h2>
              <p class="text-[11px] text-slate-600 font-bold leading-tight truncate mt-0.5">
                Balai Wilayah I Banjarmasin
              </p>
            </div>
          </div>

          <!-- Tombol Tutup Sidebar di Mobile -->
          <button
            @click="closeMobileSidebar"
            class="lg:hidden p-1 rounded-lg text-slate-800 hover:bg-slate-100 cursor-pointer shrink-0"
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

        <!-- TOP BAR (Tinggi h-16 sejajar lurus dengan Header Sidebar) -->
        <header class="h-16 bg-white border-b-2 border-slate-300 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div class="flex items-center gap-3 min-w-0">
            <!-- Tombol Garis Tiga (Buka/Tutup Sidebar Desktop & Mobile) -->
            <button
              @click="toggleSidebar"
              class="p-2 rounded-lg text-slate-800 hover:bg-slate-100 border border-slate-300 transition cursor-pointer shrink-0"
              aria-label="Buka atau tutup sidebar"
              title="Buka / Tutup Menu"
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

          <!-- USER SESI & LOGOUT -->
          <div class="relative flex items-center gap-3">
            <button
              @click="isAccountMenuOpen = !isAccountMenuOpen"
              class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border-2 border-slate-400 hover:bg-slate-100 transition cursor-pointer shadow-xs"
            >
              <div class="w-2.5 h-2.5 rounded-full bg-slate-500 ring-2 ring-slate-300"></div>
              <div class="text-left hidden sm:block">
                <div class="text-xs font-black text-black leading-tight">
                  {{ currentUser?.username || 'pengawas' }}
                </div>
                <div class="text-[10px] text-slate-600 font-bold leading-tight">
                  Pengawas Wilayah I
                </div>
              </div>
              <svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <!-- DROPDOWN AKUN & LOGOUT -->
            <div
              v-if="isAccountMenuOpen"
              class="absolute right-0 top-12 w-56 bg-white border-2 border-slate-300 rounded-xl shadow-2xl p-2 z-50 text-xs"
            >
              <div class="px-3 py-2 border-b border-slate-200">
                <div class="text-xs font-black text-black truncate">
                  {{ currentUser?.username || 'pengawas' }}
                </div>
                <div class="text-[10px] text-slate-600 font-bold">
                  UPTD Balai Pengawasan Wilayah I
                </div>
              </div>

              <div class="mt-2">
                <button
                  @click="mintaKonfirmasiLogout"
                  class="w-full px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  <span>Keluar (Logout)</span>
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

    <!-- POP-UP KONFIRMASI LOGOUT (IYA / TIDAK) -->
    <div
      v-if="isLogoutConfirmOpen"
      @click.self="batalLogout"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div class="bg-white border-2 border-slate-400 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="w-12 h-12 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center text-red-600">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </div>

        <div>
          <h3 class="text-lg font-black text-black">Konfirmasi Keluar</h3>
          <p class="text-xs sm:text-sm text-slate-700 font-bold mt-1.5 leading-relaxed">
            Apakah Anda yakin ingin keluar (logout) dari aplikasi?
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="batalLogout"
            class="px-5 py-2 bg-white hover:bg-slate-100 text-black font-black text-xs sm:text-sm rounded-lg border-2 border-slate-400 transition cursor-pointer"
          >
            Tidak
          </button>
          <button
            type="button"
            @click="handleLogout"
            class="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs transition cursor-pointer border-2 border-red-800"
          >
            Iya
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
