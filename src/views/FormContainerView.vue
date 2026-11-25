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
        <span class="px-2.5 py-0.5 rounded text-xs font-black bg-slate-800 text-white border-2 border-slate-900">
          FORMULIR {{ kodeParam }}
        </span>
        <h1 class="text-xl sm:text-2xl font-black text-black">
          {{ formMeta?.nama || 'Formulir Pengawasan' }}
        </h1>
      </div>
      <p class="text-xs sm:text-sm text-slate-700 font-bold">
        {{ formMeta?.detail || 'Sistem Pelaporan Pengawasan Ketenagakerjaan Wilayah I Banjarmasin' }}
      </p>
    </div>

    <!-- Jika form config sudah tersedia (misal K1) -->
    <DynamicFormView
      v-if="formConfig"
      :key="kodeParam"
      :config="formConfig"
    />

    <!-- Jika form belum dibuat (K4 s.d K10) -->
    <div
      v-else
      class="bg-white border-2 border-slate-300 rounded-xl p-12 text-center shadow-xs my-8 max-w-2xl mx-auto"
    >
      <div class="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-500 flex items-center justify-center mx-auto mb-4 text-slate-800">
        <svg class="w-8 h-8 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      </div>
      <h3 class="text-lg font-black text-black mb-2">
        Halaman ini dibuat berikutnya
      </h3>
      <p class="text-sm text-slate-700 font-semibold max-w-md mx-auto mb-6">
        Formulir <span class="font-black text-slate-900 bg-slate-200 px-1 rounded border border-slate-400">{{ kodeParam }} - {{ formMeta?.nama || 'Laporan Pengawasan' }}</span> sedang dalam tahap persiapan dan akan tersedia pada pembaruan berikutnya.
      </p>
      <router-link
        to="/input/k1"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-black transition cursor-pointer border-2 border-slate-900 shadow-xs"
      >
        <span>Buka Form K1</span>
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
        </svg>
      </router-link>
    </div>
  </div>
</template>
