<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
    <div class="max-w-xl w-full bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 border border-slate-700 shadow-2xl text-center">
      
      <!-- Badges -->
      <div class="flex items-center justify-center gap-2 mb-6">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Vue 3
        </span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
          Vite
        </span>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
          Tailwind CSS
        </span>
      </div>

      <!-- Title -->
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400 bg-clip-text text-transparent mb-3">
        Project Frontend Siap!
      </h1>
      <p class="text-slate-400 text-sm md:text-base mb-8">
        Template Vite + Vue.js + Tailwind CSS telah berhasil dikonfigurasi dan siap digunakan untuk pengembangan.
      </p>

      <!-- Counter Interactive Demo -->
      <div class="p-6 bg-slate-900/60 rounded-xl border border-slate-700/60 mb-6 flex flex-col items-center">
        <p class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Test State Reaktif Vue</p>
        <div class="text-4xl font-black text-white mb-4">{{ count }}</div>
        <div class="flex items-center gap-3">
          <button
            @click="count--"
            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 active:scale-95 transition rounded-lg font-medium text-sm text-slate-200 cursor-pointer"
          >
            - Kurang
          </button>
          <button
            @click="count = 0"
            class="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 active:scale-95 transition rounded-lg font-medium text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Reset
          </button>
          <button
            @click="count++"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition rounded-lg font-medium text-sm text-white shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            + Tambah
          </button>
        </div>
      </div>

      <!-- Quick Tips -->
      <div class="text-left text-xs text-slate-400 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
        <p class="font-semibold text-slate-300 mb-1">Perintah yang tersedia:</p>
        <ul class="space-y-1 font-mono">
          <li><span class="text-sky-400">npm run dev</span> : Menjalankan development server</li>
          <li><span class="text-sky-400">npm run build</span> : Melakukan compile/build production</li>
          <li><span class="text-sky-400">npm run preview</span> : Meninjau hasil build lokal</li>
        </ul>
      </div>

    </div>
  </div>
</template>
