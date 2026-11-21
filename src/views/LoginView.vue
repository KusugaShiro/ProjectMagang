<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login, SEED_ACCOUNTS } from '../lib/auth'
import logoDinas from '../assets/logodinas.jpeg'

const route = useRoute()
const router = useRouter()

const email = ref('')
const kataSandi = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const showDemoAccounts = ref(false)

async function handleLogin() {
  errorMessage.value = ''
  const trimmedEmail = email.value.trim()
  if (!trimmedEmail || !kataSandi.value) {
    errorMessage.value = 'Email dan kata sandi wajib diisi.'
    return
  }

  isLoading.value = true
  try {
    await login(trimmedEmail, kataSandi.value)
    const redirectTarget = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/'
    router.replace(redirectTarget)
  } catch (err) {
    errorMessage.value = err.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.'
  } finally {
    isLoading.value = false
  }
}

function isiAkunDemo(acc) {
  email.value = acc.email
  kataSandi.value = 'password'
  errorMessage.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 antialiased">
    <div class="w-full max-w-md bg-white border-2 border-slate-300 rounded-2xl shadow-lg overflow-hidden">
      <!-- Garis Aksen Atas -->
      <div class="h-2 bg-slate-800"></div>

      <div class="p-6 sm:p-8 space-y-6">
        <!-- Header Logo & Instansi -->
        <div class="text-center space-y-3">
          <div class="flex items-center justify-center">
            <img
              :src="logoDinas"
              alt="Logo Binwasnaker Wilayah I Banjarmasin"
              class="h-20 w-20 object-contain rounded-xl border border-slate-200 bg-white p-1 shadow-xs"
            />
          </div>

          <div>
            <h1 class="text-lg sm:text-xl font-black text-black tracking-tight">
              Laporan Pengawasan
            </h1>
            <p class="text-xs font-bold text-slate-600 mt-0.5">
              UPTD Balai Pengawasan Wilayah I Banjarmasin
            </p>
            <p class="text-[11px] font-semibold text-slate-500">
              Dinas Tenaga Kerja dan Transmigrasi Prov. Kalimantan Selatan
            </p>
          </div>
        </div>

        <!-- Pesan Error -->
        <div
          v-if="errorMessage"
          class="p-3.5 rounded-xl bg-red-100 border-2 border-red-500 text-red-950 text-xs font-bold flex items-start gap-2.5"
        >
          <svg class="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Form Login -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="login-email" class="block text-xs font-black text-black mb-1.5">
              Email
            </label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              autocomplete="username"
              required
              placeholder="contoh: operator.bjm@k3.local"
              class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-800 transition"
            />
          </div>

          <div>
            <label for="login-password" class="block text-xs font-black text-black mb-1.5">
              Kata Sandi
            </label>
            <div class="relative">
              <input
                id="login-password"
                v-model="kataSandi"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                placeholder="Masukkan kata sandi"
                class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg pl-3.5 pr-11 py-2.5 text-sm focus:outline-none focus:border-slate-800 transition"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-black cursor-pointer"
                :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
              >
                <svg v-if="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-black text-sm rounded-lg border-2 border-slate-900 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg v-if="isLoading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>{{ isLoading ? 'Memproses...' : 'Masuk' }}</span>
          </button>
        </form>

        <!-- Bantuan Akun Demo / Pengujian (bisa dibuka/tutup) -->
        <div class="pt-3 border-t border-slate-200">
          <button
            type="button"
            @click="showDemoAccounts = !showDemoAccounts"
            class="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
          >
            <span>Akun Pengujian (Klik untuk isi otomatis)</span>
            <svg
              :class="['w-4 h-4 transition-transform', showDemoAccounts ? 'rotate-180' : '']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <div v-if="showDemoAccounts" class="mt-2.5 space-y-1.5">
            <button
              v-for="acc in SEED_ACCOUNTS"
              :key="acc.email"
              type="button"
              @click="isiAkunDemo(acc)"
              class="w-full text-left px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex items-center justify-between gap-2"
            >
              <div class="min-w-0">
                <div class="text-xs font-black text-black truncate">{{ acc.nama_pengguna }}</div>
                <div class="text-[11px] font-mono text-slate-600 truncate">{{ acc.email }}</div>
              </div>
              <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300 shrink-0">
                {{ acc.peran === 'operator_kabupaten' ? (acc.wilayah?.kode_wilayah || 'Operator') : acc.peran.replace('_', ' ') }}
              </span>
            </button>
            <p class="text-[11px] text-slate-500 font-semibold text-center pt-1">
              Kata sandi bawaan: <code class="font-mono font-bold text-slate-800">password</code>
            </p>
          </div>
        </div>
      </div>
    </div>

    <p class="mt-5 text-[11px] text-slate-500 font-bold text-center">
      &copy; 2026 UPTD Balai Pengawasan Ketenagakerjaan Wilayah I Kalimantan Selatan
    </p>
  </div>
</template>
