<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formList } from '../forms'

const route = useRoute()
const router = useRouter()
const isMobileSidebarOpen = ref(false)

function toggleMobileSidebar() {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false
}

// Cek rute aktif untuk styling link
function isActiveRoute(path) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(path + '/')
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
  <div class="min-h-screen bg-[#070E1C] text-[#E6ECF8] font-sans flex flex-col antialiased selection:bg-blue-600 selection:text-white">

    <!-- OVERLAY SIDEBAR MOBILE -->
    <div
      v-if="isMobileSidebarOpen"
      @click="closeMobileSidebar"
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
    ></div>

    <!-- WRAPPER UTAMA -->
    <div class="flex-1 flex overflow-hidden">

      <!-- SIDEBAR KIRI -->
      <aside
        :class="[
          'fixed inset-y-0 left-0 z-50 w-72 bg-[#081331] border-r border-[#1B2A4A] flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        ]"
      >
        <!-- Header Sidebar -->
        <div class="p-5 border-b border-[#1B2A4A] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Ikon Perisai SVG -->
            <div class="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-sm font-bold text-[#E6ECF8] leading-tight tracking-wide">
                Laporan Pengawasan
              </h2>
              <p class="text-[11px] text-[#9AA8C7] leading-tight mt-0.5">
                Balai Pengawasan Wilayah I Banjarmasin
              </p>
            </div>
          </div>

          <!-- Tombol Tutup Sidebar di Mobile -->
          <button
            @click="closeMobileSidebar"
            class="lg:hidden p-1 rounded-lg text-[#9AA8C7] hover:text-white hover:bg-[#0C1730] cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Navigasi Menu Sidebar -->
        <nav class="flex-1 overflow-y-auto p-3 space-y-6 text-xs custom-scrollbar">

          <!-- Menu Beranda -->
          <div>
            <router-link
              to="/"
              @click="closeMobileSidebar"
              :class="[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition font-medium',
                route.path === '/'
                  ? 'bg-[#14306B] text-white shadow-sm font-semibold'
                  : 'text-[#9AA8C7] hover:bg-[#0C1730] hover:text-[#E6ECF8]'
              ]"
            >
              <svg class="w-4 h-4 shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <span>Beranda</span>
            </router-link>
          </div>

          <!-- Grup: INPUT LAPORAN -->
          <div>
            <div class="px-3 mb-2 text-[10px] font-bold tracking-wider uppercase text-blue-400/80">
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
                    ? 'bg-[#14306B] text-white shadow-sm'
                    : 'text-[#9AA8C7] hover:bg-[#0C1730] hover:text-[#E6ECF8]'
                ]"
              >
                <!-- Kode Tebal di Kiri -->
                <span
                  :class="[
                    'font-mono font-bold text-xs shrink-0 w-8',
                    route.path === `/input/${item.kode.toLowerCase()}` ? 'text-sky-300' : 'text-[#E6ECF8]'
                  ]"
                >
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
            <div class="px-3 mb-2 text-[10px] font-bold tracking-wider uppercase text-blue-400/80">
              ARSIP
            </div>
            <div class="space-y-1">
              <router-link
                to="/tersimpan"
                @click="closeMobileSidebar"
                :class="[
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition font-medium',
                  route.path === '/tersimpan'
                    ? 'bg-[#14306B] text-white shadow-sm font-semibold'
                    : 'text-[#9AA8C7] hover:bg-[#0C1730] hover:text-[#E6ECF8]'
                ]"
              >
                <svg class="w-4 h-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                </svg>
                <span>Laporan Tersimpan</span>
              </router-link>
            </div>
          </div>

        </nav>

        <!-- Footer Sidebar -->
        <div class="p-3 border-t border-[#1B2A4A] text-[11px] text-[#9AA8C7] text-center">
          &copy; 2026 Pengawasan Wilayah I
        </div>
      </aside>

      <!-- KONTEN AREA KANAN -->
      <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">

        <!-- TOP BAR -->
        <header class="h-16 bg-[#081331]/90 backdrop-blur-md border-b border-[#1B2A4A] px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div class="flex items-center gap-3 min-w-0">
            <!-- Tombol Hamburger (Hanya HP/Tablet) -->
            <button
              @click="toggleMobileSidebar"
              class="lg:hidden p-2 rounded-lg text-[#9AA8C7] hover:text-white hover:bg-[#0C1730] cursor-pointer"
              aria-label="Buka Menu"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            <!-- Judul Halaman di Top Bar -->
            <h1 class="text-sm sm:text-base font-bold text-[#E6ECF8] truncate">
              {{ currentTitle }}
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-xs text-[#9AA8C7] hidden sm:inline-block">Wilayah I Banjarmasin</span>
            <div class="w-2 h-2 rounded-full bg-emerald-500" title="Sistem Aktif"></div>
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
