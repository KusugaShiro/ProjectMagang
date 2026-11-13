<script setup>
import { formList } from '../forms'
</script>

<template>
  <div class="space-y-6">
    <!-- Hero Banner (Putih dengan aksen Kuning & Hitam) -->
    <section class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
      <!-- Aksen garis kuning di atas kartu -->
      <div class="absolute top-0 left-0 right-0 h-1.5 bg-yellow-400"></div>

      <div class="max-w-2xl pt-1">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 border border-yellow-300 text-amber-900 text-xs font-bold mb-4">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          Sistem Rekapitulasi Pelaporan Pengawasan Ketenagakerjaan & K3
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mb-3">
          UPTD Balai Pengawasan Wilayah I Kalimantan Selatan
        </h1>
        <p class="text-sm text-slate-600 leading-relaxed mb-6">
          Portal pelaporan terintegrasi untuk Wilayah Kota Banjarmasin dan Kabupaten Barito Kuala. Mendukung alur kerja dokumen bulanan (Draf &rarr; Terkirim &rarr; Disahkan/Terkunci), matriks K1 s.d. K10, dan ekspor berkas buku kerja Excel resmi Balai.
        </p>
        <div class="flex flex-wrap gap-3">
          <router-link
            to="/input/k1"
            class="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-bold text-sm rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer border border-yellow-500/40"
          >
            <span>Input Form K1</span>
            <svg class="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </router-link>
          <router-link
            to="/tersimpan"
            class="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm rounded-lg transition flex items-center gap-2 cursor-pointer"
          >
            <span>Lihat Laporan Tersimpan</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Ringkasan Formulir -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
          Daftar Modul Matriks (K1 s.d. K10)
        </h2>
        <span class="text-xs text-slate-500 font-medium">13 Modul Laporan</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <router-link
          v-for="f in formList"
          :key="f.kode"
          :to="`/input/${f.kode.toLowerCase()}`"
          class="bg-white border border-slate-200 hover:border-yellow-400 hover:shadow-md transition p-4 rounded-xl group block shadow-xs"
        >
          <div class="flex items-start justify-between mb-2">
            <span class="px-2.5 py-1 rounded text-xs font-black bg-slate-100 group-hover:bg-yellow-400 text-slate-900 border border-slate-200 group-hover:border-yellow-500/50 transition">
              {{ f.kode }}
            </span>
            <span
              v-if="f.kode === 'K1'"
              class="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full"
            >
              Aktif
            </span>
            <span
              v-else
              class="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-medium"
            >
              Tahap Berikutnya
            </span>
          </div>
          <h3 class="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition mb-1">
            {{ f.nama }}
          </h3>
          <p class="text-xs text-slate-500 line-clamp-2">
            {{ f.detail }}
          </p>
        </router-link>
      </div>
    </section>
  </div>
</template>
