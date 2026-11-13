<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getFormConfig, getFormMeta } from '../forms'
import DynamicFormView from '../components/DynamicFormView.vue'

const route = useRoute()
const kodeParam = computed(() => (route.params.kode || '').toUpperCase())

const formConfig = computed(() => getFormConfig(kodeParam.value))
const formMeta = computed(() => getFormMeta(kodeParam.value))
</script>

<template>
  <div>
    <!-- Judul Header Halaman Form -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-1">
        <span class="px-2.5 py-0.5 rounded text-xs font-black bg-yellow-400 text-slate-950 border border-yellow-500/50">
          FORM {{ kodeParam }}
        </span>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900">
          {{ formMeta?.nama || 'Formulir Pengawasan' }}
        </h1>
      </div>
      <p class="text-xs sm:text-sm text-slate-500">
        {{ formMeta?.detail || 'Sistem Pelaporan Pengawasan Ketenagakerjaan Wilayah I Banjarmasin' }}
      </p>
    </div>

    <!-- Jika form config sudah tersedia (misal K1) -->
    <DynamicFormView
      v-if="formConfig"
      :config="formConfig"
    />

    <!-- Jika form belum dibuat (K2 s.d K10) -->
    <div
      v-else
      class="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs my-8 max-w-2xl mx-auto"
    >
      <div class="w-16 h-16 rounded-full bg-yellow-100 border border-yellow-300 flex items-center justify-center mx-auto mb-4 text-amber-700">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      </div>
      <h3 class="text-lg font-black text-slate-900 mb-2">
        Halaman ini dibuat berikutnya
      </h3>
      <p class="text-sm text-slate-600 max-w-md mx-auto mb-6">
        Formulir <span class="font-bold text-amber-900 bg-yellow-100 px-1 rounded">{{ kodeParam }} - {{ formMeta?.nama || 'Laporan Pengawasan' }}</span> sedang dalam tahap persiapan dan akan tersedia pada pembaruan berikutnya.
      </p>
      <router-link
        to="/input/k1"
        class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-lg text-sm font-bold transition cursor-pointer border border-yellow-500/50 shadow-xs"
      >
        <span>Buka Form K1</span>
        <svg class="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
        </svg>
      </router-link>
    </div>
  </div>
</template>
