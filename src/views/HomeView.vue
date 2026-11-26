<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiGetDaftarLaporan, apiGetMasterWilayah, hitungTriwulanDB } from '../lib/api'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const bulanShort = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]
const romawiTriwulan = ['', 'I', 'II', 'III', 'IV']

const laporanList = ref([])
const daftarWilayah = ref([])
const isLoadingSummary = ref(true)
const summaryError = ref('')

const now = new Date()
const selectedTahun = ref(now.getFullYear())
const selectedBulanDetail = ref(null)

const periodeAktif = computed(() => {
  const bulanNum = now.getMonth() + 1
  const tahunNum = now.getFullYear()
  const tw = hitungTriwulanDB(bulanNum)
  return {
    label: `${bulanNames[bulanNum]} ${tahunNum}`,
    triwulan: `Triwulan ${romawiTriwulan[tw] || tw}`,
  }
})

const tahunTersedia = computed(() => {
  const set = new Set([now.getFullYear(), 2026])
  laporanList.value.forEach(item => {
    if (item.tahun) set.add(Number(item.tahun))
  })
  return Array.from(set).sort((a, b) => b - a)
})

const ringkasan = computed(() => {
  const total = laporanList.value.length
  let draf = 0
  let finalCount = 0
  const wilayahSet = new Set()

  laporanList.value.forEach(item => {
    if (item.status_laporan === 'final') finalCount += 1
    else draf += 1
    if (item.id_wilayah) wilayahSet.add(item.id_wilayah)
  })

  return {
    total,
    draf,
    final: finalCount,
    wilayahCount: wilayahSet.size,
  }
})

const laporanTahunAktif = computed(() => {
  return laporanList.value.filter(item => Number(item.tahun) === Number(selectedTahun.value))
})

// Data Diagram Batang (12 Bulan)
const maxBarY = computed(() => Math.max(daftarWilayah.value.length, 2))
const yAxisTicks = computed(() => {
  const ticks = []
  for (let v = 0; v <= maxBarY.value; v += 1) {
    ticks.push({
      value: v,
      y: 220 - (v / maxBarY.value) * 190,
    })
  }
  return ticks
})

const chartBulanan = computed(() => {
  const slotWidth = 576 / 12
  const barWidth = 26

  return Array.from({ length: 12 }, (_, idx) => {
    const bulanNum = idx + 1
    const docs = laporanTahunAktif.value.filter(it => Number(it.bulan) === bulanNum)
    const finalDocs = docs.filter(it => it.status_laporan === 'final')
    const drafDocs = docs.filter(it => it.status_laporan !== 'final')

    const finalCount = finalDocs.length
    const drafCount = drafDocs.length
    const total = finalCount + drafCount

    const finalH = Math.min(190, (finalCount / maxBarY.value) * 190)
    const drafH = Math.min(190 - finalH, (drafCount / maxBarY.value) * 190)
    const totalH = finalH + drafH

    const xCenter = 48 + idx * slotWidth + slotWidth / 2
    const xBar = xCenter - barWidth / 2

    return {
      bulan: bulanNum,
      short: bulanShort[bulanNum],
      full: bulanNames[bulanNum],
      finalCount,
      drafCount,
      total,
      docs,
      xCenter,
      xBar,
      barWidth,
      finalY: 220 - finalH,
      finalH,
      drafY: 220 - finalH - drafH,
      drafH,
      labelY: Math.max(18, 220 - totalH - 8),
    }
  })
})

const activeMonthInfo = computed(() => {
  if (selectedBulanDetail.value) {
    return chartBulanan.value.find(b => b.bulan === selectedBulanDetail.value) || null
  }
  // Tampilkan bulan terakhir yang punya data secara default agar langsung informatif
  const withData = [...chartBulanan.value].reverse().find(b => b.total > 0)
  return withData || chartBulanan.value[0] || null
})

// Data Diagram Donat (Proporsi Status Kelengkapan Tahunan)
const DONUT_RADIUS = 72
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS

const donutData = computed(() => {
  const jumlahWilayah = Math.max(daftarWilayah.value.length, 1)
  const target = jumlahWilayah * 12
  const finalCount = laporanTahunAktif.value.filter(it => it.status_laporan === 'final').length
  const drafCount = laporanTahunAktif.value.filter(it => it.status_laporan !== 'final').length
  const terisi = Math.min(target, finalCount + drafCount)
  const belum = Math.max(0, target - terisi)

  const persenTerisi = target > 0 ? Math.round((terisi / target) * 100) : 0
  const persenFinal = target > 0 ? Math.round((finalCount / target) * 100) : 0
  const persenDraf = target > 0 ? Math.round((drafCount / target) * 100) : 0
  const persenBelum = Math.max(0, 100 - persenFinal - persenDraf)

  const finalLen = target > 0 ? (Math.min(target, finalCount) / target) * DONUT_CIRCUMFERENCE : 0
  const drafLen = target > 0 ? (Math.min(target - finalCount, drafCount) / target) * DONUT_CIRCUMFERENCE : 0

  return {
    target,
    terisi,
    finalCount,
    drafCount,
    belum,
    persenTerisi,
    persenFinal,
    persenDraf,
    persenBelum,
    finalLen,
    drafLen,
  }
})

// Perbandingan Wilayah (Diagram Batang Horizontal Ringkas)
const perbandinganWilayah = computed(() => {
  return daftarWilayah.value.map(w => {
    const itemsW = laporanTahunAktif.value.filter(it => Number(it.id_wilayah) === Number(w.id_wilayah))
    const finalCount = itemsW.filter(it => it.status_laporan === 'final').length
    const drafCount = itemsW.filter(it => it.status_laporan !== 'final').length
    const total = Math.min(12, finalCount + drafCount)
    const persenFinal = Math.round((Math.min(12, finalCount) / 12) * 100)
    const persenDraf = Math.min(100 - persenFinal, Math.round((drafCount / 12) * 100))

    return {
      ...w,
      finalCount,
      drafCount,
      total,
      persenFinal,
      persenDraf,
    }
  })
})

function pilihBulan(bulanNum) {
  selectedBulanDetail.value = bulanNum
}

async function muatRingkasan() {
  isLoadingSummary.value = true
  summaryError.value = ''
  try {
    const [wilayahRes, daftarRes] = await Promise.all([
      apiGetMasterWilayah(),
      apiGetDaftarLaporan(),
    ])
    daftarWilayah.value = wilayahRes
    laporanList.value = daftarRes

    if (daftarRes.length > 0 && !daftarRes.some(d => Number(d.tahun) === Number(selectedTahun.value))) {
      selectedTahun.value = Number(daftarRes[0].tahun)
    }
  } catch (err) {
    summaryError.value = err.message || 'Gagal memuat ringkasan laporan.'
  } finally {
    isLoadingSummary.value = false
  }
}

onMounted(() => {
  muatRingkasan()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Banner Instansi -->
    <section class="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-2 bg-slate-800"></div>

      <div class="max-w-2xl pt-1">
        <p class="text-xs font-black uppercase tracking-wide text-slate-600 mb-2">
          Sistem Rekapitulasi Pelaporan Pengawasan Ketenagakerjaan &amp; K3
        </p>
        <h1 class="text-2xl sm:text-3xl font-black text-black tracking-tight mb-5">
          UPTD Balai Pengawasan Wilayah I Kalimantan Selatan
        </h1>
        <div class="flex flex-wrap gap-3">
          <router-link
            to="/input/k1"
            class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-sm rounded-lg shadow-xs transition inline-flex items-center gap-2 cursor-pointer border-2 border-slate-900"
          >
            <span>Isi Formulir K1</span>
          </router-link>
          <router-link
            to="/tersimpan"
            class="px-5 py-2.5 bg-white hover:bg-slate-100 border-2 border-slate-400 text-slate-900 font-black text-sm rounded-lg transition inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Lihat Laporan Tersimpan</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Ringkasan Laporan -->
    <section aria-labelledby="ringkasan-beranda-heading" class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h2 id="ringkasan-beranda-heading" class="text-base font-black text-black">
          Ringkasan Laporan
        </h2>
        <button
          v-if="summaryError"
          type="button"
          @click="muatRingkasan"
          class="px-3 py-1 bg-white hover:bg-slate-100 border-2 border-slate-400 text-slate-900 text-xs font-black rounded-lg transition cursor-pointer"
        >
          Muat Ulang
        </button>
      </div>

      <div
        v-if="summaryError"
        class="p-3 rounded-xl bg-red-100 border-2 border-red-500 text-black text-xs font-bold flex items-center gap-2"
      >
        <svg class="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>{{ summaryError }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <!-- Kartu 1 (Anchor Utama): Total Laporan Tersimpan -->
        <router-link
          to="/tersimpan"
          class="bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 rounded-xl p-4 shadow-xs transition flex flex-col justify-between gap-2"
        >
          <span class="text-xs font-bold text-slate-300">Total Laporan Tersimpan</span>
          <div class="text-3xl font-black font-mono tracking-tight">
            {{ isLoadingSummary ? '...' : (summaryError ? '-' : ringkasan.total) }}
          </div>
          <span class="text-[11px] font-bold text-slate-300">
            <template v-if="isLoadingSummary">Memuat arsip laporan...</template>
            <template v-else-if="summaryError">Data tidak tersedia</template>
            <template v-else-if="ringkasan.total === 0">Belum ada dokumen tersimpan</template>
            <template v-else>{{ ringkasan.wilayahCount }} wilayah tercatat</template>
          </span>
        </router-link>

        <!-- Kartu 2: Status Draf -->
        <router-link
          to="/tersimpan?status=draf"
          class="bg-white hover:border-slate-500 hover:bg-slate-50 text-black border-2 border-slate-300 rounded-xl p-4 shadow-xs transition flex flex-col justify-between gap-2"
        >
          <span class="text-xs font-black text-slate-700">Status Draf</span>
          <div class="text-3xl font-black font-mono tracking-tight text-black">
            {{ isLoadingSummary ? '...' : (summaryError ? '-' : ringkasan.draf) }}
          </div>
          <span class="text-[11px] font-bold text-slate-600">Masih dapat diubah</span>
        </router-link>

        <!-- Kartu 3: Status Final -->
        <router-link
          to="/tersimpan?status=final"
          class="bg-white hover:border-slate-500 hover:bg-slate-50 text-black border-2 border-slate-300 rounded-xl p-4 shadow-xs transition flex flex-col justify-between gap-2"
        >
          <span class="text-xs font-black text-slate-700">Status Final</span>
          <div class="text-3xl font-black font-mono tracking-tight text-black">
            {{ isLoadingSummary ? '...' : (summaryError ? '-' : ringkasan.final) }}
          </div>
          <span class="text-[11px] font-bold text-slate-600">Sudah terkunci</span>
        </router-link>

        <!-- Kartu 4: Periode Aktif -->
        <div
          class="bg-white text-black border-2 border-slate-300 rounded-xl p-4 shadow-xs flex flex-col justify-between gap-2"
        >
          <span class="text-xs font-black text-slate-700">Periode Aktif</span>
          <div class="text-xl sm:text-2xl font-black tracking-tight text-black leading-snug">
            {{ periodeAktif.label }}
          </div>
          <span class="text-[11px] font-bold text-slate-600">
            {{ periodeAktif.triwulan }}
          </span>
        </div>
      </div>
    </section>

    <!-- Diagram Statistik Pelaporan -->
    <section aria-labelledby="statistik-beranda-heading" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="statistik-beranda-heading" class="text-base font-black text-black">
            Statistik Pelaporan
          </h2>
          <p class="text-xs font-bold text-slate-600">
            Gambaran visual jumlah laporan bulanan dan persentase kelengkapan tahun {{ selectedTahun }}.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <label for="statistik-tahun" class="text-xs font-black text-black">Tahun</label>
          <select
            id="statistik-tahun"
            v-model.number="selectedTahun"
            @change="selectedBulanDetail = null"
            class="bg-white border-2 border-slate-300 text-black font-mono font-black rounded-lg px-3 py-1.5 text-xs focus:border-slate-700"
          >
            <option v-for="th in tahunTersedia" :key="th" :value="th">
              {{ th }}
            </option>
          </select>
        </div>
      </div>

      <!-- State Loading -->
      <div
        v-if="isLoadingSummary"
        class="bg-white border-2 border-slate-300 rounded-xl p-10 text-center text-xs font-bold text-slate-700"
      >
        Memuat diagram statistik...
      </div>

      <!-- State Error -->
      <div
        v-else-if="summaryError"
        class="bg-white border-2 border-slate-300 rounded-xl p-8 text-center space-y-3"
      >
        <p class="text-sm font-black text-black">Diagram statistik belum dapat ditampilkan</p>
        <p class="text-xs font-bold text-slate-600">Periksa koneksi layanan data lalu coba muat ulang.</p>
        <button
          type="button"
          @click="muatRingkasan"
          class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-lg border-2 border-slate-900 transition cursor-pointer"
        >
          Muat Ulang Diagram
        </button>
      </div>

      <!-- Grid 2 Diagram Utama -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <!-- DIAGRAM 1: Diagram Batang Laporan Bulanan (Jan s.d. Des) -->
        <div class="lg:col-span-7 bg-white border-2 border-slate-300 rounded-xl p-5 shadow-xs flex flex-col justify-between gap-4">
          <div class="flex flex-wrap items-start justify-between gap-2 pb-3 border-b-2 border-slate-200">
            <div>
              <h3 class="text-sm font-black text-black">
                Diagram Laporan Masuk per Bulan ({{ selectedTahun }})
              </h3>
              <p class="text-[11px] font-bold text-slate-600 mt-0.5">
                Jumlah laporan masuk tiap bulan (maksimal {{ maxBarY }} wilayah per bulan)
              </p>
            </div>
            <div class="flex items-center gap-3 text-[11px] font-bold text-slate-700">
              <span class="inline-flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-xs bg-slate-900 inline-block"></span>
                Final
              </span>
              <span class="inline-flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-xs bg-amber-600 inline-block"></span>
                Draf
              </span>
            </div>
          </div>

          <!-- SVG Diagram Batang Responsif -->
          <div class="w-full">
            <svg
              viewBox="0 0 640 260"
              class="w-full h-auto block"
              role="img"
              :aria-label="`Diagram batang laporan masuk per bulan tahun ${selectedTahun}`"
            >
              <!-- Garis bantu horizontal & angka sumbu Y -->
              <g v-for="tick in yAxisTicks" :key="`y-${tick.value}`">
                <line
                  x1="44"
                  :y1="tick.y"
                  x2="626"
                  :y2="tick.y"
                  :stroke="tick.value === 0 ? '#94a3b8' : '#e2e8f0'"
                  :stroke-width="tick.value === 0 ? 1.5 : 1"
                  :stroke-dasharray="tick.value === 0 ? '' : '4 4'"
                />
                <text
                  x="34"
                  :y="tick.y + 4"
                  text-anchor="end"
                  fill="#475569"
                  font-size="11"
                  font-weight="700"
                >
                  {{ tick.value }}
                </text>
              </g>

              <!-- Batang tiap bulan -->
              <g
                v-for="bar in chartBulanan"
                :key="`bar-${bar.bulan}`"
                class="cursor-pointer"
                tabindex="0"
                role="button"
                :aria-label="`${bar.full} ${selectedTahun}: ${bar.finalCount} Final, ${bar.drafCount} Draf`"
                @click="pilihBulan(bar.bulan)"
                @mouseenter="pilihBulan(bar.bulan)"
                @focus="pilihBulan(bar.bulan)"
                @keydown.enter.prevent="pilihBulan(bar.bulan)"
                @keydown.space.prevent="pilihBulan(bar.bulan)"
              >
                <!-- Latar kapasitas batang -->
                <rect
                  :x="bar.xBar"
                  y="30"
                  :width="bar.barWidth"
                  height="190"
                  rx="4"
                  :fill="activeMonthInfo?.bulan === bar.bulan ? '#e2e8f0' : '#f1f5f9'"
                />

                <!-- Segmen Final (bawah, gelap) -->
                <rect
                  v-if="bar.finalH > 0"
                  :x="bar.xBar"
                  :y="bar.finalY"
                  :width="bar.barWidth"
                  :height="bar.finalH"
                  rx="4"
                  fill="#0f172a"
                />

                <!-- Segmen Draf (atas, amber) -->
                <rect
                  v-if="bar.drafH > 0"
                  :x="bar.xBar"
                  :y="bar.drafY"
                  :width="bar.barWidth"
                  :height="bar.drafH"
                  rx="4"
                  fill="#d97706"
                />

                <!-- Angka total di atas batang -->
                <text
                  v-if="bar.total > 0"
                  :x="bar.xCenter"
                  :y="bar.labelY"
                  text-anchor="middle"
                  fill="#0f172a"
                  font-size="12"
                  font-weight="900"
                >
                  {{ bar.total }}
                </text>

                <!-- Label bulan sumbu X -->
                <text
                  :x="bar.xCenter"
                  y="244"
                  text-anchor="middle"
                  :fill="activeMonthInfo?.bulan === bar.bulan ? '#0f172a' : '#475569'"
                  font-size="11"
                  :font-weight="activeMonthInfo?.bulan === bar.bulan ? '900' : '700'"
                >
                  {{ bar.short }}
                </text>
              </g>
            </svg>
          </div>

          <!-- Ringkasan Bulan yang Disorot/Dipilih -->
          <div
            v-if="activeMonthInfo"
            class="p-3 rounded-lg bg-slate-50 border border-slate-300 flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <div>
              <span class="font-black text-black">{{ activeMonthInfo.full }} {{ selectedTahun }}:</span>
              <span v-if="activeMonthInfo.total === 0" class="ml-1.5 font-bold text-slate-600">
                Belum ada laporan masuk.
              </span>
              <span v-else class="ml-1.5 font-bold text-slate-700">
                {{ activeMonthInfo.finalCount }} Final, {{ activeMonthInfo.drafCount }} Draf
                ({{ activeMonthInfo.docs.map(d => d.wilayah?.nama_kabupaten_kota || `Wilayah ${d.id_wilayah}`).join(', ') }})
              </span>
            </div>

            <router-link
              v-if="activeMonthInfo.docs.length > 0"
              :to="{
                path: '/input/k1',
                query: {
                  id_wilayah: activeMonthInfo.docs[0].id_wilayah,
                  bulan: activeMonthInfo.bulan,
                  tahun: selectedTahun,
                }
              }"
              class="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-400 text-black text-[11px] font-black transition shrink-0"
            >
              Buka Bulan Ini
            </router-link>
          </div>
        </div>

        <!-- DIAGRAM 2: Diagram Lingkaran (Donat) Status Kelengkapan & Perbandingan Wilayah -->
        <div class="lg:col-span-5 bg-white border-2 border-slate-300 rounded-xl p-5 shadow-xs flex flex-col justify-between gap-5">
          <div class="pb-3 border-b-2 border-slate-200">
            <h3 class="text-sm font-black text-black">
              Proporsi Kelengkapan Tahun {{ selectedTahun }}
            </h3>
            <p class="text-[11px] font-bold text-slate-600 mt-0.5">
              Target {{ donutData.target }} laporan ({{ Math.max(daftarWilayah.length, 1) }} wilayah x 12 bulan)
            </p>
          </div>

          <!-- Diagram Donat + Keterangan Angka -->
          <div class="flex flex-col items-center gap-4">
            <svg
              viewBox="0 0 200 200"
              width="160"
              height="160"
              class="shrink-0"
              role="img"
              :aria-label="`Diagram lingkaran kelengkapan tahun ${selectedTahun}: ${donutData.persenTerisi}% terisi (${donutData.finalCount} Final, ${donutData.drafCount} Draf, ${donutData.belum} Belum diisi)`"
            >
              <!-- Lingkaran latar (Belum Diisi) -->
              <circle
                cx="100"
                cy="100"
                :r="DONUT_RADIUS"
                fill="none"
                stroke="#e2e8f0"
                stroke-width="26"
              />
              <!-- Busur Final (Slate-900) -->
              <circle
                v-if="donutData.finalLen > 0"
                cx="100"
                cy="100"
                :r="DONUT_RADIUS"
                fill="none"
                stroke="#0f172a"
                stroke-width="26"
                :stroke-dasharray="`${donutData.finalLen} ${DONUT_CIRCUMFERENCE}`"
                stroke-dashoffset="0"
                transform="rotate(-90 100 100)"
              />
              <!-- Busur Draf (Amber-600) -->
              <circle
                v-if="donutData.drafLen > 0"
                cx="100"
                cy="100"
                :r="DONUT_RADIUS"
                fill="none"
                stroke="#d97706"
                stroke-width="26"
                :stroke-dasharray="`${donutData.drafLen} ${DONUT_CIRCUMFERENCE}`"
                :stroke-dashoffset="-donutData.finalLen"
                transform="rotate(-90 100 100)"
              />
              <!-- Persentase Tengah -->
              <text
                x="100"
                y="96"
                text-anchor="middle"
                fill="#0f172a"
                font-size="28"
                font-weight="900"
              >
                {{ donutData.persenTerisi }}%
              </text>
              <text
                x="100"
                y="116"
                text-anchor="middle"
                fill="#475569"
                font-size="11"
                font-weight="700"
              >
                {{ donutData.terisi }} / {{ donutData.target }} terisi
              </text>
            </svg>

            <!-- Legenda Angka Jelas untuk Orang Awam -->
            <div class="w-full space-y-2 text-xs">
              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-2 font-black text-black whitespace-nowrap">
                  <span class="w-3 h-3 rounded-xs bg-slate-900 shrink-0"></span>
                  Final (Terkunci)
                </span>
                <span class="font-mono font-black text-black whitespace-nowrap">
                  {{ donutData.finalCount }} laporan <span class="text-slate-600 font-bold">({{ donutData.persenFinal }}%)</span>
                </span>
              </div>

              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-2 font-black text-black whitespace-nowrap">
                  <span class="w-3 h-3 rounded-xs bg-amber-600 shrink-0"></span>
                  Draf
                </span>
                <span class="font-mono font-black text-black whitespace-nowrap">
                  {{ donutData.drafCount }} laporan <span class="text-slate-600 font-bold">({{ donutData.persenDraf }}%)</span>
                </span>
              </div>

              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-2 font-bold text-slate-700 whitespace-nowrap">
                  <span class="w-3 h-3 rounded-xs bg-slate-200 border border-slate-400 shrink-0"></span>
                  Belum Diisi
                </span>
                <span class="font-mono font-bold text-slate-700 whitespace-nowrap">
                  {{ donutData.belum }} laporan <span class="text-slate-500">({{ donutData.persenBelum }}%)</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Perbandingan Singkat per Wilayah -->
          <div class="pt-4 border-t-2 border-slate-200 space-y-3">
            <h4 class="text-xs font-black text-black">
              Perbandingan per Wilayah ({{ selectedTahun }})
            </h4>
            <div class="space-y-2.5">
              <div
                v-for="w in perbandinganWilayah"
                :key="w.id_wilayah"
                class="space-y-1"
              >
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-black truncate">{{ w.nama_kabupaten_kota }}</span>
                  <span class="font-mono font-black text-black shrink-0 ml-2">{{ w.total }}/12 bulan</span>
                </div>
                <div
                  class="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden flex"
                  role="img"
                  :aria-label="`${w.nama_kabupaten_kota}: ${w.finalCount} Final dan ${w.drafCount} Draf dari 12 bulan`"
                >
                  <div
                    v-if="w.persenFinal > 0"
                    class="bg-slate-900 h-full"
                    :style="{ width: `${w.persenFinal}%` }"
                  ></div>
                  <div
                    v-if="w.persenDraf > 0"
                    class="bg-amber-600 h-full"
                    :style="{ width: `${w.persenDraf}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
