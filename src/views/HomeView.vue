<script setup>
import { formList } from '../forms'
</script>

<template>
  <div class="space-y-6">
    <!-- Hero Banner -->
    <section class="bg-gradient-to-r from-[#0C1730] to-[#0E1E45] border border-[#1B2A4A] rounded-2xl p-6 sm:p-8 shadow-xl">
      <div class="max-w-2xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-semibold mb-4">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          Sistem Informasi Pengawasan Ketenagakerjaan
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#E6ECF8] tracking-tight mb-3">
          Laporan Pengawasan Ketenagakerjaan
        </h1>
        <p class="text-sm text-[#9AA8C7] leading-relaxed mb-6">
          Selamat datang di portal pelaporan Balai Pengawasan Ketenagakerjaan Wilayah I Banjarmasin. Sistem ini digunakan untuk pencatatan, pemantauan data pegawai pengawas, obyek pengawasan norma kerja, serta keselamatan dan kesehatan kerja (K3).
        </p>
        <div class="flex flex-wrap gap-3">
          <router-link
            to="/input/k1"
            class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium text-sm rounded-lg shadow-md shadow-blue-900/40 transition flex items-center gap-2 cursor-pointer"
          >
            <span>Input Form K1</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </router-link>
          <router-link
            to="/tersimpan"
            class="px-5 py-2.5 bg-[#070E1C] hover:bg-[#142852] border border-[#1B2A4A] text-[#E6ECF8] font-medium text-sm rounded-lg transition flex items-center gap-2 cursor-pointer"
          >
            <span>Lihat Laporan Tersimpan</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Ringkasan Formulir -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-[#E6ECF8] flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          Daftar Formulir Laporan
        </h2>
        <span class="text-xs text-[#9AA8C7]">13 Formulir Tersedia</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <router-link
          v-for="f in formList"
          :key="f.kode"
          :to="`/input/${f.kode.toLowerCase()}`"
          class="bg-[#0C1730] border border-[#1B2A4A] hover:border-blue-500/50 hover:bg-[#101F42] transition p-4 rounded-xl group block shadow-md"
        >
          <div class="flex items-start justify-between mb-2">
            <span class="px-2.5 py-1 rounded text-xs font-bold bg-[#070E1C] group-hover:bg-blue-600/30 text-blue-300 border border-[#1B2A4A] group-hover:border-blue-500/40 transition">
              {{ f.kode }}
            </span>
            <span
              v-if="f.kode === 'K1'"
              class="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded-full"
            >
              Aktif
            </span>
            <span
              v-else
              class="text-[10px] text-slate-500 bg-[#070E1C] px-2 py-0.5 rounded-full border border-slate-800"
            >
              Tahap Berikutnya
            </span>
          </div>
          <h3 class="text-sm font-semibold text-[#E6ECF8] group-hover:text-blue-200 transition mb-1">
            {{ f.nama }}
          </h3>
          <p class="text-xs text-[#9AA8C7] line-clamp-2">
            {{ f.detail }}
          </p>
        </router-link>
      </div>
    </section>
  </div>
</template>
