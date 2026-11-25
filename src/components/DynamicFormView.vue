<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import {
  apiGetMasterWilayah,
  apiGetDaftarLaporan,
  apiBuatLaporan,
  apiUpdateLaporan,
  apiGetMatriksModul,
  apiSimpanMatriksModul,
  apiGetRekapTriwulan,
  apiFinalkanLaporan,
  apiBukaKembaliLaporan,
  hitungTriwulanDB,
} from '../lib/api'
import { hasActiveUnsavedChanges, bypassUnsavedGuard } from '../lib/unsavedGuard'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
})

const route = useRoute()

// Master Data Wilayah & Pilihan Bulan
const daftarWilayah = ref([])
const bulanList = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
]

const triwulanOptions = [
  { value: 1, romawi: 'I', label: 'Triwulan I (Januari - Maret)', bulanList: [1, 2, 3] },
  { value: 2, romawi: 'II', label: 'Triwulan II (April - Juni)', bulanList: [4, 5, 6] },
  { value: 3, romawi: 'III', label: 'Triwulan III (Juli - September)', bulanList: [7, 8, 9] },
  { value: 4, romawi: 'IV', label: 'Triwulan IV (Oktober - Desember)', bulanList: [10, 11, 12] },
]

// State Filter Periode
const filter = reactive({
  id_wilayah: 1,
  jenis_periode: 'bulanan',
  bulan: 1,
  triwulan: 1,
  tahun: 2026,
})

// Rumus Triwulan sesuai Aturan Bisnis #1 PRD: (bulan + 2) DIV 3
const hitungTriwulan = computed(() => hitungTriwulanDB(filter.bulan))

// Semua modul (K1 s.d. K10) mendukung mode Triwulan langsung dari endpoint REST API /rekap-triwulan/{modul}
const supportsTriwulanMode = computed(() => true)
const isTriwulanMode = computed(() => filter.jenis_periode === 'triwulan')
const activeTriwulanRomawi = computed(() => {
  const tw = activeLaporan.value?.triwulan || filter.triwulan
  return triwulanOptions.find(t => t.value === tw)?.romawi || 'I'
})

// State Dokumen Laporan Aktif
const isFormOpen = ref(false)
const activeLaporan = ref(null)
const rowsData = reactive({})
const isLoading = ref(false)
const isOpeningForm = ref(false)
const showOpenSpinner = ref(false)
const isWorkflowLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const triwulanMeta = ref(null)

// Penandatangan resmi dari data wilayah_pengawasan (REST API /master/wilayah)
const activeWilayahInfo = computed(() => {
  if (!activeLaporan.value) return null
  return daftarWilayah.value.find(w => w.id_wilayah === activeLaporan.value.id_wilayah) || activeLaporan.value.wilayah
})

// Tanggal laporan (kolom `tanggal_laporan` di `laporan_bulanan`)
const tanggalLaporan = ref('')

function defaultEndOfMonthDate(tahun, bulan) {
  const t = Number(tahun) || new Date().getFullYear()
  const b = Number(bulan) || 1
  const lastDay = new Date(t, b, 0).getDate()
  return `${t}-${String(b).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

const isTriwulanView = computed(() => activeLaporan.value?.jenis_periode === 'triwulan')

// Form terkunci bila berstatus Final atau sedang melihat Rekap Triwulan otomatis dari server
const isReadOnly = computed(() => {
  return activeLaporan.value?.status_laporan === 'final' || isTriwulanView.value
})

// Pelacakan perubahan belum disimpan (snapshot perbandingan isi formulir)
const savedSnapshot = ref('')

function serializeFormState() {
  const sortedRowKeys = Object.keys(rowsData).sort()
  const normalizedRows = {}
  sortedRowKeys.forEach(rk => {
    const row = rowsData[rk] || {}
    const sortedFields = Object.keys(row).sort()
    const cleanRow = {}
    sortedFields.forEach(fk => {
      const val = row[fk]
      cleanRow[fk] = val === null || val === undefined ? '' : val
    })
    normalizedRows[rk] = cleanRow
  })

  return JSON.stringify({
    rows: normalizedRows,
    tanggalLaporan: activeLaporan.value?.jenis_periode === 'bulanan' ? (tanggalLaporan.value || '') : '',
  })
}

function markFormSaved() {
  savedSnapshot.value = serializeFormState()
}

const hasUnsavedChanges = computed(() => {
  if (!isFormOpen.value || !activeLaporan.value || isReadOnly.value) return false
  if (!savedSnapshot.value) return false
  return serializeFormState() !== savedSnapshot.value
})

watch(
  hasUnsavedChanges,
  (dirty) => {
    hasActiveUnsavedChanges.value = dirty
  },
  { immediate: true }
)

// Cek apakah form berbasis matriks generik (K2, K3, K4, K5, dst.)
const rowKeyField = computed(() => props.config.keyField || 'id_klui')
const isKluiForm = computed(() => {
  return props.config.keyField === 'id_klui' || props.config.kode === 'K2' || props.config.kode === 'K3'
})
const isGenericMatrixForm = computed(() => {
  return isKluiForm.value || Boolean(props.config.headerRows?.length)
})

function getRowId(row) {
  return row[rowKeyField.value] ?? row.id_klui ?? row.key ?? row.id_jabatan
}

function isAutoField(fieldKey) {
  return Boolean(
    isTriwulanMode.value &&
    activeLaporan.value?.jenis_periode === 'triwulan' &&
    (
      props.config.triwulanConfig?.allLocked ||
      props.config.triwulanConfig?.allNumericLocked ||
      props.config.triwulanConfig?.autoSumFields?.includes(fieldKey)
    )
  )
}

// Buat struktur baris kosong baru tanpa langsung mengosongkan tabel aktif (anti-flicker)
function buildEmptyRows() {
  const fresh = {}

  if (isGenericMatrixForm.value) {
    props.config.rows.forEach(row => {
      const rKey = getRowId(row)
      const rowItem = {
        [rowKeyField.value]: rKey,
      }
      if (props.config.apiRowKey && row[props.config.apiRowKey] !== undefined) {
        rowItem[props.config.apiRowKey] = row[props.config.apiRowKey]
      }
      if (props.config.textField) {
        rowItem[props.config.textField.key] = ''
      }
      if (props.config.staticCell) {
        rowItem[props.config.staticCell.key || 'keterangan'] = props.config.staticCell.text
      }
      props.config.numericFields.forEach(sf => {
        rowItem[sf.key] = 0
      })
      fresh[rKey] = rowItem
    })
  } else {
    props.config.rows.forEach(row => {
      if (!row.isGroup && row.id_jabatan) {
        const rowItem = {
          id_jabatan: row.id_jabatan,
          jml_umum: 0,
          jml_ppns: 0,
          keterangan: '',
        }
        props.config.spesialisFields?.forEach(sf => {
          rowItem[sf.key] = 0
        })
        fresh[row.id_jabatan] = rowItem
      }
    })
  }

  return fresh
}

function applyRowsData(nextRows) {
  Object.keys(rowsData).forEach(k => {
    if (!(k in nextRows)) delete rowsData[k]
  })
  Object.keys(nextRows).forEach(k => {
    rowsData[k] = nextRows[k]
  })
}

function initEmptyRows() {
  applyRowsData(buildEmptyRows())
}

// Helper cari definisi baris dari item respons API
function findConfigRow(item) {
  return props.config.rows.find(r => {
    const rKey = getRowId(r)
    if (item[rowKeyField.value] !== undefined && item[rowKeyField.value] === rKey) return true
    if (
      props.config.apiRowKey &&
      item[props.config.apiRowKey] !== undefined &&
      Number(item[props.config.apiRowKey]) === Number(r[props.config.apiRowKey])
    ) {
      return true
    }
    return false
  })
}

// Buka form isian / Buat dokumen laporan bulanan atau rekap Triwulan
async function bukaFormIsian(force = false) {
  if (isOpeningForm.value) return
  if (force !== true && hasUnsavedChanges.value) {
    const lanjut = await mintaKonfirmasiPerubahanBelumDisimpan({
      title: 'Perubahan Belum Disimpan',
      message: 'Anda memiliki perubahan data yang belum disimpan pada formulir yang sedang dibuka. Membuka wilayah atau periode lain akan membuang perubahan tersebut. Tetap lanjutkan?',
      confirmLabel: 'Ya, Lanjutkan',
      cancelLabel: 'Tetap di Formulir',
    })
    if (!lanjut) return
  }
  errorMessage.value = ''
  successMessage.value = ''
  isOpeningForm.value = true

  // Tampilkan spinner hanya jika proses > 180ms agar tombol tidak berkedip saat respon cepat
  const spinnerTimer = setTimeout(() => {
    if (isOpeningForm.value) showOpenSpinner.value = true
  }, 180)

  try {
    // MODE TRIWULAN OTOMATIS DARI REST API (GET /api/rekap-triwulan/{modul})
    if (isTriwulanMode.value) {
      const twOpt = triwulanOptions.find(t => t.value === Number(filter.triwulan)) || triwulanOptions[0]
      const wilObj = daftarWilayah.value.find(w => w.id_wilayah === Number(filter.id_wilayah)) || null

      const resTw = await apiGetRekapTriwulan(props.config.modul || 'k1', {
        id_wilayah: Number(filter.id_wilayah),
        tahun: Number(filter.tahun),
        triwulan: twOpt.value,
      })

      const nextRows = buildEmptyRows()
      if (Array.isArray(resTw?.data)) {
        resTw.data.forEach(item => {
          if (isGenericMatrixForm.value && props.config.numericFields) {
            const matchedRow = findConfigRow(item)
            const rKey = matchedRow ? getRowId(matchedRow) : (item.id_klui ?? item.id_jabatan)
            if (rKey && nextRows[rKey]) {
              const sourceItem = props.config.fromApiRow ? props.config.fromApiRow(item) : item
              const mapped = { ...nextRows[rKey] }
              props.config.numericFields.forEach(sf => {
                const rawVal = sourceItem[sf.key] ?? (sf.apiKey ? sourceItem[sf.apiKey] : undefined)
                if (rawVal !== undefined && rawVal !== null) {
                  mapped[sf.key] = Number(rawVal) || 0
                }
              })
              nextRows[rKey] = mapped
            }
          } else {
            const key = item.id_jabatan
            if (key && nextRows[key]) {
              nextRows[key] = {
                ...nextRows[key],
                ...item,
              }
            }
          }
        })
      }

      triwulanMeta.value = resTw?.meta || null
      applyRowsData(nextRows)
      activeLaporan.value = {
        id_laporan: null,
        id_wilayah: Number(filter.id_wilayah),
        tahun: Number(filter.tahun),
        bulan: null,
        triwulan: twOpt.value,
        jenis_periode: 'triwulan',
        status_laporan: 'rekap',
        wilayah: wilObj,
      }

      isFormOpen.value = true
      markFormSaved()
      return
    }

    // MODE BULANAN (K1 s.d. K10)
    const list = await apiGetDaftarLaporan({
      id_wilayah: filter.id_wilayah,
      tahun: filter.tahun,
      bulan: filter.bulan,
    })

    let doc = list.find(l => l.id_wilayah === Number(filter.id_wilayah) && l.tahun === Number(filter.tahun) && l.bulan === Number(filter.bulan))

    if (!doc) {
      const defaultTgl = defaultEndOfMonthDate(filter.tahun, filter.bulan)
      doc = await apiBuatLaporan({
        id_wilayah: Number(filter.id_wilayah),
        tahun: Number(filter.tahun),
        bulan: Number(filter.bulan),
        tanggal_laporan: defaultTgl,
      })
    }

    const nextRows = buildEmptyRows()
    const resModul = await apiGetMatriksModul(doc.id_laporan, props.config.modul || 'k1')
    if (resModul?.data && Array.isArray(resModul.data) && resModul.data.length > 0) {
      resModul.data.forEach(item => {
        if (isGenericMatrixForm.value && props.config.numericFields) {
          const matchedRow = findConfigRow(item)
          const rKey = matchedRow ? getRowId(matchedRow) : (item.id_klui ?? item.id_jabatan)
          if (rKey && nextRows[rKey]) {
            const sourceItem = props.config.fromApiRow ? props.config.fromApiRow(item) : item
            const mapped = { ...nextRows[rKey] }
            props.config.numericFields.forEach(sf => {
              const rawVal = sourceItem[sf.key] ?? (sf.apiKey ? sourceItem[sf.apiKey] : undefined)
              if (rawVal !== undefined && rawVal !== null) {
                mapped[sf.key] = Number(rawVal) || 0
              }
            })
            if (props.config.textField) {
              const tk = props.config.textField.key
              const rawText = sourceItem[tk] ?? (props.config.textField.apiKey ? sourceItem[props.config.textField.apiKey] : undefined)
              mapped[tk] = rawText ?? ''
            } else if (props.config.staticCell) {
              const tk = props.config.staticCell.key || 'keterangan'
              mapped[tk] = props.config.staticCell.text
            }
            nextRows[rKey] = mapped
          }
        } else {
          const key = item.id_jabatan
          if (key && nextRows[key]) {
            nextRows[key] = {
              ...nextRows[key],
              ...item,
            }
          }
        }
      })
    }

    // Perbarui semua state sekaligus setelah data siap agar tidak ada glitch/flicker
    triwulanMeta.value = null
    tanggalLaporan.value = doc.tanggal_laporan
      ? String(doc.tanggal_laporan).slice(0, 10)
      : defaultEndOfMonthDate(doc.tahun, doc.bulan)
    applyRowsData(nextRows)
    activeLaporan.value = { ...doc, jenis_periode: 'bulanan' }

    isFormOpen.value = true
    markFormSaved()
  } catch (err) {
    errorMessage.value = 'Gagal membuka formulir: ' + (err.message || err)
  } finally {
    clearTimeout(spinnerTimer)
    isOpeningForm.value = false
    showOpenSpinner.value = false
  }
}

function isDecimalField(fieldKey) {
  return Boolean(props.config.numericFields?.find(f => f.key === fieldKey)?.decimal)
}

// Sanitasi input angka (integer >= 0, atau desimal 2 angka di belakang koma untuk kolom desimal K8c)
function onNumberInput(rowKey, field, event) {
  if (isReadOnly.value || isAutoField(field)) return
  const raw = event.target.value
  if (raw === '' || isNaN(raw)) {
    rowsData[rowKey][field] = 0
    event.target.value = 0
    return
  }
  const num = Number(raw)
  let val = isDecimalField(field) ? Math.round(num * 100) / 100 : Math.floor(num)
  if (val < 0) val = 0
  rowsData[rowKey][field] = val
  if (!isDecimalField(field)) {
    event.target.value = val
  }
}

// Komputasi total per baris dan baris JUMLAH
const summaryTotals = computed(() => {
  if (isGenericMatrixForm.value) {
    const colTotals = {}
    props.config.numericFields?.forEach(sf => {
      colTotals[sf.key] = 0
    })

    props.config.rows?.forEach(row => {
      const rKey = getRowId(row)
      const rowVal = rowsData[rKey] || {}
      props.config.numericFields?.forEach(sf => {
        colTotals[sf.key] += Number(rowVal[sf.key]) || 0
      })
    })

    return { colTotals }
  }

  // Form K1
  const rowTotals = {}
  const colTotals = {
    jml_umum: 0,
    jml_ppns: 0,
  }
  props.config.spesialisFields?.forEach(sf => {
    colTotals[sf.key] = 0
  })

  let grandTotal = 0

  props.config.rows?.forEach(row => {
    if (!row.isGroup && row.id_jabatan) {
      const rowVal = rowsData[row.id_jabatan] || {}
      const rTotal = props.config.hitungJumlahBaris ? props.config.hitungJumlahBaris(rowVal) : 0
      rowTotals[row.id_jabatan] = rTotal
      grandTotal += rTotal

      colTotals.jml_umum += Number(rowVal.jml_umum) || 0
      colTotals.jml_ppns += Number(rowVal.jml_ppns) || 0
      props.config.spesialisFields?.forEach(sf => {
        colTotals[sf.key] += Number(rowVal[sf.key]) || 0
      })
    }
  })

  return { rowTotals, colTotals, grandTotal }
})

// Simpan Matriks ke API (khusus mode Bulanan)
async function simpan() {
  if (!activeLaporan.value || isReadOnly.value || isTriwulanView.value) return
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    let payloadBaris = []
    if (props.config.kode === 'K2') {
      payloadBaris = props.config.rows.map(r => {
        const rowVal = rowsData[r.id_klui] || {}
        const payloadItem = {
          id_klui: r.id_klui,
        }
        props.config.numericFields.forEach(sf => {
          payloadItem[sf.key] = Math.max(0, Math.floor(Number(rowVal[sf.key]) || 0))
        })
        return payloadItem
      })
    } else if (props.config.kode === 'K3') {
      payloadBaris = props.config.rows.map(r => {
        const rowVal = rowsData[r.id_klui] || {}
        const payloadItem = {
          id_klui: r.id_klui,
          keterangan: rowVal.keterangan || null,
        }
        props.config.numericFields.forEach(sf => {
          payloadItem[sf.key] = Math.max(0, Math.floor(Number(rowVal[sf.key]) || 0))
        })
        return payloadItem
      })
    } else if (isGenericMatrixForm.value) {
      payloadBaris = props.config.rows.map(r => {
        const rKey = getRowId(r)
        const rowVal = rowsData[rKey] || {}
        if (props.config.toApiRow) {
          return props.config.toApiRow(r, rowVal)
        }
        const payloadItem = {}
        if (props.config.apiRowKey && r[props.config.apiRowKey] !== undefined) {
          payloadItem[props.config.apiRowKey] = r[props.config.apiRowKey]
        } else {
          payloadItem[rowKeyField.value] = rKey
        }
        if (props.config.textField) {
          const tk = props.config.textField.key
          const apiTk = props.config.textField.apiKey || tk
          payloadItem[apiTk] = rowVal[tk] || null
        } else if (props.config.staticCell) {
          const tk = props.config.staticCell.key || 'keterangan'
          const apiTk = props.config.staticCell.apiKey || tk
          payloadItem[apiTk] = props.config.staticCell.text
        }
        props.config.numericFields.forEach(sf => {
          const rawNum = Number(rowVal[sf.key]) || 0
          payloadItem[sf.apiKey || sf.key] = sf.decimal
            ? Math.max(0, Math.round(rawNum * 100) / 100)
            : Math.max(0, Math.floor(rawNum))
        })
        return payloadItem
      })
    } else {
      payloadBaris = props.config.rows
        .filter(r => !r.isGroup && r.id_jabatan)
        .map(r => {
          const rowVal = rowsData[r.id_jabatan] || {}
          const payloadItem = {
            id_jabatan: r.id_jabatan,
            jml_umum: Math.max(0, Math.floor(Number(rowVal.jml_umum) || 0)),
            jml_ppns: Math.max(0, Math.floor(Number(rowVal.jml_ppns) || 0)),
            keterangan: rowVal.keterangan || null,
          }
          props.config.spesialisFields?.forEach(sf => {
            payloadItem[sf.key] = Math.max(0, Math.floor(Number(rowVal[sf.key]) || 0))
          })
          return payloadItem
        })
    }

    await apiSimpanMatriksModul(activeLaporan.value.id_laporan, props.config.modul || 'k1', payloadBaris)
    if (tanggalLaporan.value !== (activeLaporan.value.tanggal_laporan ? String(activeLaporan.value.tanggal_laporan).slice(0, 10) : '')) {
      await apiUpdateLaporan(activeLaporan.value.id_laporan, { tanggal_laporan: tanggalLaporan.value || null })
      activeLaporan.value.tanggal_laporan = tanggalLaporan.value || null
    }
    markFormSaved()
    successMessage.value = 'Laporan tersimpan.'
    setTimeout(() => {
      if (successMessage.value === 'Laporan tersimpan.') successMessage.value = ''
    }, 5000)
  } catch (err) {
    errorMessage.value = 'Gagal menyimpan: ' + (err.message || err)
  } finally {
    isLoading.value = false
  }
}

async function aksiFinalkan() {
  if (!activeLaporan.value?.id_laporan) return
  isWorkflowLoading.value = true
  errorMessage.value = ''
  try {
    const updated = await apiFinalkanLaporan(activeLaporan.value.id_laporan, tanggalLaporan.value || null)
    activeLaporan.value.status_laporan = 'final'
    if (updated?.tanggal_laporan) {
      activeLaporan.value.tanggal_laporan = updated.tanggal_laporan
      tanggalLaporan.value = String(updated.tanggal_laporan).slice(0, 10)
    }
    successMessage.value = 'Laporan telah difinalkan dan dikunci.'
  } catch (err) {
    errorMessage.value = err.message || 'Gagal memfinalkan laporan.'
  } finally {
    isWorkflowLoading.value = false
  }
}

async function aksiBukaKembali() {
  if (!activeLaporan.value?.id_laporan) return
  isWorkflowLoading.value = true
  errorMessage.value = ''
  try {
    await apiBukaKembaliLaporan(activeLaporan.value.id_laporan)
    activeLaporan.value.status_laporan = 'draf'
    successMessage.value = 'Laporan dibuka kembali ke status Draf.'
  } catch (err) {
    errorMessage.value = err.message || 'Gagal membuka kembali laporan.'
  } finally {
    isWorkflowLoading.value = false
  }
}

// State Pop-up Konfirmasi (Iya / Tidak) untuk tombol aksi form & peringatan perubahan belum disimpan
const confirmModal = reactive({
  open: false,
  action: null,
  title: '',
  message: '',
  danger: false,
  confirmLabel: 'Iya',
  cancelLabel: 'Tidak',
})

let pendingUnsavedResolve = null

function mintaKonfirmasiPerubahanBelumDisimpan({
  title = 'Perubahan Belum Disimpan',
  message = 'Anda memiliki perubahan data yang belum disimpan. Jika meninggalkan halaman sekarang, perubahan tersebut akan hilang. Tetap lanjutkan?',
  confirmLabel = 'Ya, Tinggalkan',
  cancelLabel = 'Tetap di Halaman',
} = {}) {
  return new Promise((resolve) => {
    if (pendingUnsavedResolve) {
      pendingUnsavedResolve(false)
      pendingUnsavedResolve = null
    }
    pendingUnsavedResolve = resolve
    confirmModal.title = title
    confirmModal.message = message
    confirmModal.danger = true
    confirmModal.confirmLabel = confirmLabel
    confirmModal.cancelLabel = cancelLabel
    confirmModal.action = 'unsaved_confirm'
    confirmModal.open = true
  })
}

function mintaKonfirmasiAksi(action) {
  confirmModal.confirmLabel = 'Iya'
  confirmModal.cancelLabel = 'Tidak'

  if (action === 'tutup') {
    if (hasUnsavedChanges.value) {
      confirmModal.title = 'Perubahan Belum Disimpan'
      confirmModal.message = 'Anda memiliki perubahan data yang belum disimpan. Jika formulir ditutup sekarang, perubahan tersebut akan hilang. Tetap tutup formulir?'
      confirmModal.danger = true
      confirmModal.confirmLabel = 'Ya, Tutup'
      confirmModal.cancelLabel = 'Tetap di Formulir'
    } else {
      confirmModal.title = 'Konfirmasi Tutup Formulir'
      confirmModal.message = 'Apakah Anda yakin ingin menutup formulir ini?'
      confirmModal.danger = false
    }
  } else if (action === 'reset') {
    if (isReadOnly.value) return
    confirmModal.title = 'Konfirmasi Reset ke Nol'
    confirmModal.message = 'Apakah Anda yakin ingin mengosongkan semua isian tabel ke angka nol?'
    confirmModal.danger = true
  } else if (action === 'simpan') {
    if (isLoading.value || isReadOnly.value) return
    confirmModal.title = 'Konfirmasi Simpan Laporan'
    confirmModal.message = 'Apakah Anda yakin ingin menyimpan data laporan ini?'
    confirmModal.danger = false
  } else if (action === 'finalkan') {
    if (!activeLaporan.value?.id_laporan || isWorkflowLoading.value) return
    if (hasUnsavedChanges.value) {
      confirmModal.title = 'Perubahan Belum Disimpan'
      confirmModal.message = 'Ada perubahan data yang belum disimpan. Simpan terlebih dahulu jika ingin perubahan ikut masuk sebelum difinalkan, atau lanjutkan finalisasi menggunakan data terakhir yang tersimpan?'
      confirmModal.danger = true
      confirmModal.confirmLabel = 'Tetap Finalkan'
      confirmModal.cancelLabel = 'Kembali ke Formulir'
    } else {
      confirmModal.title = 'Konfirmasi Finalkan Laporan'
      confirmModal.message = 'Apakah Anda yakin ingin memfinalkan laporan ini? Data akan dikunci; pengesahan dilakukan secara manual di luar sistem.'
      confirmModal.danger = false
    }
  } else if (action === 'buka_kembali') {
    if (!activeLaporan.value?.id_laporan || isWorkflowLoading.value) return
    confirmModal.title = 'Konfirmasi Buka Kembali Laporan'
    confirmModal.message = 'Apakah Anda yakin ingin membuka kembali laporan ini ke status Draf? Kunci data akan dibuka kembali.'
    confirmModal.danger = true
  } else {
    return
  }
  confirmModal.action = action
  confirmModal.open = true
}

function batalKonfirmasiAksi() {
  confirmModal.open = false
  confirmModal.action = null
  if (pendingUnsavedResolve) {
    const resolve = pendingUnsavedResolve
    pendingUnsavedResolve = null
    resolve(false)
  }
}

async function lanjutKonfirmasiAksi() {
  const action = confirmModal.action
  confirmModal.open = false
  confirmModal.action = null
  if (action === 'unsaved_confirm') {
    if (pendingUnsavedResolve) {
      const resolve = pendingUnsavedResolve
      pendingUnsavedResolve = null
      resolve(true)
    }
    return
  }
  if (action === 'tutup') {
    tutupForm()
  } else if (action === 'reset') {
    resetKeNol()
  } else if (action === 'simpan') {
    await simpan()
  } else if (action === 'finalkan') {
    await aksiFinalkan()
  } else if (action === 'buka_kembali') {
    await aksiBukaKembali()
  }
}

function resetKeNol() {
  if (isReadOnly.value) return
  if (activeLaporan.value?.jenis_periode === 'triwulan' && props.config.triwulanConfig) {
    const editableFields = props.config.triwulanConfig.editableFields || []
    props.config.rows.forEach(r => {
      const rKey = getRowId(r)
      if (!rowsData[rKey]) return
      editableFields.forEach(ef => {
        rowsData[rKey][ef] = ef === props.config.textField?.key ? '' : 0
      })
    })
  } else {
    initEmptyRows()
  }
  successMessage.value = ''
}

function tutupForm() {
  isFormOpen.value = false
  activeLaporan.value = null
  savedSnapshot.value = ''
  successMessage.value = ''
  errorMessage.value = ''
  triwulanMeta.value = null
}

function handleBeforeUnload(event) {
  if (!hasUnsavedChanges.value) return
  event.preventDefault()
  event.returnValue = ''
}

function handleKeydown(event) {
  if (event.key === 'Escape' && confirmModal.open) {
    batalKonfirmasiAksi()
  }
}

onBeforeRouteLeave(async () => {
  if (bypassUnsavedGuard.value || !hasUnsavedChanges.value) return true
  return await mintaKonfirmasiPerubahanBelumDisimpan({
    title: 'Perubahan Belum Disimpan',
    message: 'Anda memiliki perubahan data pada formulir ini yang belum disimpan. Jika pindah menu sekarang, perubahan tersebut akan hilang. Tetap tinggalkan halaman?',
    confirmLabel: 'Ya, Tinggalkan',
    cancelLabel: 'Tetap di Halaman',
  })
})

onBeforeRouteUpdate(async (to, from) => {
  if (to.fullPath === from.fullPath) return true
  if (bypassUnsavedGuard.value || !hasUnsavedChanges.value) return true
  return await mintaKonfirmasiPerubahanBelumDisimpan({
    title: 'Perubahan Belum Disimpan',
    message: 'Anda memiliki perubahan data pada formulir ini yang belum disimpan. Jika berpindah ke formulir lain sekarang, perubahan tersebut akan hilang. Tetap berpindah?',
    confirmLabel: 'Ya, Pindah Formulir',
    cancelLabel: 'Tetap di Halaman',
  })
})

async function muatMaster() {
  errorMessage.value = ''
  try {
    daftarWilayah.value = await apiGetMasterWilayah()
    if (daftarWilayah.value.length > 0) {
      filter.id_wilayah = daftarWilayah.value[0].id_wilayah
    }

    const q = route.query
    if (q.id_wilayah && q.bulan && q.tahun) {
      filter.id_wilayah = Number(q.id_wilayah)
      filter.bulan = Number(q.bulan)
      filter.tahun = Number(q.tahun)
      bukaFormIsian(true)
    }
  } catch (err) {
    errorMessage.value = 'Gagal memuat data master wilayah: ' + (err.message || err)
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('keydown', handleKeydown)
  muatMaster()
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('keydown', handleKeydown)
  hasActiveUnsavedChanges.value = false
  if (pendingUnsavedResolve) {
    const resolve = pendingUnsavedResolve
    pendingUnsavedResolve = null
    resolve(false)
  }
})
</script>

<template>
  <div class="space-y-6">

    <!-- Pesan Peringatan Error -->
    <div v-if="errorMessage" class="p-4 rounded-xl bg-red-100 border-2 border-red-500 text-black text-sm flex items-start gap-3 shadow-xs">
      <svg class="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <div class="font-bold text-black">{{ errorMessage }}</div>
    </div>

    <!-- Pesan Sukses -->
    <div v-if="successMessage" class="p-4 rounded-xl bg-slate-100 border-2 border-slate-600 text-black text-sm flex items-center gap-3 shadow-xs">
      <svg class="w-5 h-5 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div class="font-black text-black">{{ successMessage }}</div>
    </div>

    <!-- KARTU 1: PILIH WILAYAH DAN PERIODE -->
    <section class="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-xs">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-black text-black flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-slate-500 border border-slate-700"></span>
          1. Pilih Wilayah dan Periode
        </h2>
      </div>

      <div :class="['grid grid-cols-1 sm:grid-cols-2 gap-4', supportsTriwulanMode && !isTriwulanMode ? 'lg:grid-cols-5' : 'lg:grid-cols-4']">
        <!-- Wilayah -->
        <div>
          <label for="form-filter-wilayah" class="block text-xs font-black text-black mb-1.5">Wilayah Pengawasan</label>
          <select
            id="form-filter-wilayah"
            v-model.number="filter.id_wilayah"
            class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-sm focus:border-slate-700"
          >
            <option v-for="w in daftarWilayah" :key="w.id_wilayah" :value="w.id_wilayah">
              {{ w.nama_kabupaten_kota }} ({{ w.kode_wilayah }})
            </option>
          </select>
        </div>

        <!-- Jenis Periode (khusus form yang mendukung Rekap Otomatis 3 Bulan, mis. K5 s.d. K10) -->
        <div v-if="supportsTriwulanMode">
          <label for="form-filter-jenis-periode" class="block text-xs font-black text-black mb-1.5">Jenis Periode</label>
          <select
            id="form-filter-jenis-periode"
            v-model="filter.jenis_periode"
            class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-sm focus:border-slate-700"
          >
            <option value="bulanan">Bulanan</option>
            <option value="triwulan">{{ config.triwulanConfig ? 'Triwulan (Rekap Otomatis 3 Bulan)' : 'Triwulan (Posisi Akhir Triwulan)' }}</option>
          </select>
        </div>

        <!-- Bulan (tampil pada mode Bulanan) -->
        <div v-if="!isTriwulanMode">
          <label for="form-filter-bulan" class="block text-xs font-black text-black mb-1.5">Bulan Laporan</label>
          <select
            id="form-filter-bulan"
            v-model.number="filter.bulan"
            class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-sm focus:border-slate-700"
          >
            <option v-for="b in bulanList" :key="b.value" :value="b.value">
              {{ b.value }}. {{ b.label }}
            </option>
          </select>
        </div>

        <!-- Triwulan (Otomatis pada mode Bulanan; Pilihan I-IV pada mode Triwulan) -->
        <div v-if="!isTriwulanMode">
          <span class="block text-xs font-black text-black mb-1.5">Triwulan (Otomatis)</span>
          <div class="w-full bg-white border-2 border-slate-300 text-black rounded-lg px-3 py-2 text-sm font-black flex items-center justify-between">
            <span>Triwulan {{ hitungTriwulan }}</span>
            <span class="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-900 border border-slate-400 font-black">TW {{ hitungTriwulan }}</span>
          </div>
        </div>
        <div v-else>
          <label for="form-filter-triwulan" class="block text-xs font-black text-black mb-1.5">Triwulan</label>
          <select
            id="form-filter-triwulan"
            v-model.number="filter.triwulan"
            class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-sm focus:border-slate-700"
          >
            <option v-for="tw in triwulanOptions" :key="tw.value" :value="tw.value">
              {{ tw.label }}
            </option>
          </select>
        </div>

        <!-- Tahun -->
        <div>
          <label for="form-filter-tahun" class="block text-xs font-black text-black mb-1.5">Tahun Anggaran</label>
          <input
            id="form-filter-tahun"
            v-model.number="filter.tahun"
            type="number"
            min="2026"
            max="2100"
            class="w-full bg-white border-2 border-slate-300 text-black rounded-lg px-3 py-2 text-sm focus:border-slate-700 font-mono font-black"
          />
        </div>
      </div>

      <!-- Tombol Aksi Buka Form -->
      <div class="mt-5 flex justify-end">
        <button
          type="button"
          @click="bukaFormIsian(false)"
          :disabled="isOpeningForm"
          class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-lg shadow-xs border-2 border-slate-900 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <svg v-if="showOpenSpinner" class="animate-spin w-4 h-4 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <svg v-else class="w-4 h-4 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Buka Formulir
        </button>
      </div>
    </section>

    <!-- KARTU 2: TABEL FORM ISIAN -->
    <section v-if="isFormOpen && activeLaporan" class="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-xs space-y-4">
      
      <!-- Header Kartu & Status -->
      <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b-2 border-slate-300 gap-3">
        <div>
          <h2 class="text-base font-black text-black flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :class="isReadOnly ? 'bg-slate-800' : 'bg-slate-500 border border-slate-700'"></span>
            {{ config.tableCardTitlePrefix || '2. Isi data' }} ({{ activeLaporan.wilayah?.nama_kabupaten_kota || 'Wilayah' }} - {{ activeLaporan.jenis_periode === 'triwulan' ? `Triwulan ${activeTriwulanRomawi}` : bulanList.find(b => b.value === activeLaporan.bulan)?.label }} {{ activeLaporan.tahun }})
          </h2>
          <div class="flex flex-wrap items-center gap-3 mt-1 text-xs text-black font-bold">
            <template v-if="activeLaporan.id_laporan">
              <span>No. Dokumen: <strong class="font-mono text-black">#{{ activeLaporan.id_laporan }}</strong></span>
              <span>&bull;</span>
            </template>
            <span>Triwulan: <strong class="font-mono text-black">TW {{ activeLaporan.triwulan }}</strong></span>
            <template v-if="activeLaporan.jenis_periode === 'triwulan'">
              <span>&bull;</span>
              <span class="px-2 py-0.5 rounded bg-slate-200 text-slate-900 border border-slate-400 text-[11px] font-black">
                {{ triwulanMeta?.mode_agregasi === 'snapshot' ? 'Posisi Akhir Triwulan' : 'Rekap Otomatis 3 Bulan' }}
              </span>
            </template>
          </div>
        </div>

        <!-- Badges, Tanggal Laporan & Status (Draf <-> Final) -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Input Tanggal Laporan (untuk tanda tangan Excel) -->
          <div v-if="activeLaporan.id_laporan && activeLaporan.jenis_periode === 'bulanan'" class="flex items-center gap-1.5">
            <label for="tgl-laporan-input" class="text-[11px] font-black text-slate-700 whitespace-nowrap">
              Tgl Laporan:
            </label>
            <input
              id="tgl-laporan-input"
              type="date"
              v-model="tanggalLaporan"
              :disabled="isReadOnly"
              class="bg-white border-2 border-slate-300 text-black font-mono font-bold rounded-lg px-2 py-1 text-xs focus:border-slate-700 disabled:bg-slate-100"
            />
          </div>

          <!-- Indikator Perubahan Belum Disimpan -->
          <div
            v-if="hasUnsavedChanges"
            role="status"
            class="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-950 border-2 border-amber-500 flex items-center gap-1.5"
          >
            <span class="w-2 h-2 rounded-full bg-amber-600"></span>
            Perubahan belum disimpan
          </div>

          <!-- Status Draf (Abu-abu muda) -->
          <div
            v-if="activeLaporan.status_laporan === 'draf'"
            class="px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-900 border-2 border-slate-400 flex items-center gap-1.5"
          >
            <span class="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
            Status: Draf (Dapat Diubah)
          </div>

          <!-- Status Final (Abu-abu gelap teks putih) -->
          <div
            v-else-if="activeLaporan.status_laporan === 'final'"
            class="px-3 py-1 rounded-full text-xs font-black bg-slate-800 text-white border-2 border-slate-900 flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            FINAL (Terkunci)
          </div>

          <!-- Status Rekap Triwulan -->
          <div
            v-else-if="isTriwulanView"
            class="px-3 py-1 rounded-full text-xs font-black bg-slate-800 text-white border-2 border-slate-900 flex items-center gap-1.5"
          >
            <span>Rekap Triwulan (Terkunci)</span>
            <span v-if="triwulanMeta?.apakah_nihil" class="px-1.5 py-0.2 rounded bg-slate-600 text-white text-[10px]">
              NIHIL
            </span>
          </div>
        </div>
      </div>

      <!-- Banner jika terkunci (Final) -->
      <div v-if="activeLaporan.status_laporan === 'final'" class="p-3.5 rounded-lg bg-slate-100 border-2 border-slate-400 text-black text-xs flex items-center gap-2 font-bold">
        <svg class="w-5 h-5 shrink-0 text-black" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <span class="text-black">
          Laporan berstatus <strong>FINAL (Terkunci)</strong>. Pengesahan dilakukan secara manual di luar sistem. Klik <strong>Buka Kembali</strong> bila perlu mengubah data.
        </span>
      </div>

      <!-- Kotak Info Mode Triwulan (Semua Modul K1 s.d. K10 dari REST API) -->
      <div
        v-if="isTriwulanView"
        class="p-3.5 rounded-lg bg-slate-100 border-2 border-slate-400 text-black text-xs flex items-start gap-2.5 font-bold"
      >
        <svg class="w-5 h-5 shrink-0 text-slate-700 mt-0.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span v-if="triwulanMeta?.mode_agregasi === 'snapshot'">
          Rekap triwulan dihitung otomatis dari posisi bulan terakhir triwulan (Bulan {{ activeLaporan.triwulan * 3 }}). Untuk mengubah data, silakan buka periode <strong>Bulanan</strong>.
        </span>
        <span v-else>
          Rekap otomatis 3 bulan dari seluruh laporan bulanan pada Triwulan {{ activeTriwulanRomawi }}. Untuk mengubah data, silakan buka periode <strong>Bulanan</strong>.
        </span>
      </div>

      <!-- Wadah scroll tabel saja, tidak membuat halaman scroll mendatar -->
      <div class="overflow-x-auto rounded-lg border-2 border-slate-400 max-w-full shadow-xs">
        
        <!-- ============================================== -->
        <!-- TABEL MODUL K1: DATA PEGAWAI PENGAWAS -->
        <!-- ============================================== -->
        <table v-if="config.kode === 'K1'" class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-900 text-white border-b-2 border-slate-700">
              <th
                rowspan="2"
                class="p-2.5 font-black text-center sticky left-0 z-20 bg-slate-900 text-white border-r border-slate-700 w-12 min-w-[48px]"
              >
                No
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-black sticky left-12 z-20 bg-slate-900 text-white border-r border-slate-700 w-48 min-w-[190px]"
              >
                Jabatan
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-black text-center border-r border-slate-700 w-16 min-w-[64px]"
              >
                Umum
              </th>
              <th
                colspan="11"
                class="p-2 font-black text-center border-r border-slate-700 bg-slate-800 text-white"
              >
                Spesialis
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-black text-center border-r border-slate-700 bg-slate-700 text-white w-20 min-w-[80px]"
              >
                Jumlah
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-black text-center border-r border-slate-700 w-16 min-w-[64px]"
              >
                PPNS
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-black w-40 min-w-[160px]"
              >
                Ket.
              </th>
            </tr>
            <tr class="bg-slate-800 text-slate-100 border-b-2 border-slate-700">
              <th
                v-for="sf in config.spesialisFields"
                :key="sf.key"
                class="p-1.5 font-black text-center border-r border-slate-700 w-12 min-w-[48px] text-slate-100"
                :title="sf.text"
              >
                {{ sf.label }}
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-300 text-black">
            <template v-for="(row, rIdx) in config.rows" :key="row.id_jabatan || `grp-${rIdx}`">
              
              <!-- Tipe Baris Grup (Terampil/SLA & Ahli/S1-S2) -->
              <tr v-if="row.isGroup" class="bg-slate-200 font-black text-black border-b-2 border-slate-400">
                <td class="p-2.5 text-center sticky left-0 z-10 bg-slate-200 border-r border-slate-400 text-black font-black">
                  {{ row.no }}
                </td>
                <td class="p-2.5 sticky left-12 z-10 bg-slate-200 border-r border-slate-400 text-black font-black">
                  {{ row.label }}
                </td>
                <td class="p-2 text-center text-black font-black border-r border-slate-400">-</td>
                <td
                  v-for="sf in config.spesialisFields"
                  :key="`grp-${row.no}-${sf.key}`"
                  class="p-2 text-center text-black font-black border-r border-slate-400"
                >
                  -
                </td>
                <td class="p-2 text-center text-black font-black border-r border-slate-400 bg-slate-300">-</td>
                <td class="p-2 text-center text-black font-black border-r border-slate-400">-</td>
                <td class="p-2 text-center text-black font-black">-</td>
              </tr>

              <!-- Tipe Baris Data Isian -->
              <tr v-else class="hover:bg-slate-100/60 transition">
                <td class="p-2.5 text-center sticky left-0 z-10 bg-white border-r-2 border-slate-300 text-black font-mono font-black">
                  {{ row.no }}
                </td>
                <td class="p-2.5 sticky left-12 z-10 bg-white border-r-2 border-slate-300 whitespace-nowrap font-bold text-black">
                  {{ row.label }}
                </td>
                <td class="p-1 border-r border-slate-300">
                  <input
                    type="number"
                    min="0"
                    :disabled="isReadOnly"
                    :value="rowsData[row.id_jabatan]?.jml_umum"
                    @input="onNumberInput(row.id_jabatan, 'jml_umum', $event)"
                    class="w-full text-center bg-white border-2 border-slate-300 text-black font-black rounded py-1 px-1 focus:outline-none focus:border-slate-700 disabled:bg-slate-100 disabled:text-black font-mono"
                  />
                </td>
                <td
                  v-for="sf in config.spesialisFields"
                  :key="`data-${row.id_jabatan}-${sf.key}`"
                  class="p-1 border-r border-slate-300"
                >
                  <input
                    type="number"
                    min="0"
                    :disabled="isReadOnly"
                    :value="rowsData[row.id_jabatan]?.[sf.key]"
                    @input="onNumberInput(row.id_jabatan, sf.key, $event)"
                    class="w-full text-center bg-white border-2 border-slate-300 text-black font-black rounded py-1 px-1 focus:outline-none focus:border-slate-700 disabled:bg-slate-100 disabled:text-black font-mono"
                  />
                </td>
                <td class="p-2 text-center font-black text-black bg-slate-200 border-r-2 border-slate-300 font-mono text-sm">
                  {{ summaryTotals.rowTotals[row.id_jabatan] ?? 0 }}
                </td>
                <td class="p-1 border-r border-slate-300">
                  <input
                    type="number"
                    min="0"
                    :disabled="isReadOnly"
                    :value="rowsData[row.id_jabatan]?.jml_ppns"
                    @input="onNumberInput(row.id_jabatan, 'jml_ppns', $event)"
                    class="w-full text-center bg-white border-2 border-slate-300 text-black font-black rounded py-1 px-1 focus:outline-none focus:border-slate-700 disabled:bg-slate-100 disabled:text-black font-mono"
                  />
                </td>
                <td class="p-1">
                  <input
                    type="text"
                    maxlength="255"
                    :disabled="isReadOnly"
                    v-model="rowsData[row.id_jabatan].keterangan"
                    placeholder="Keterangan..."
                    class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded py-1 px-2 focus:outline-none focus:border-slate-700 text-xs disabled:bg-slate-100 disabled:text-black"
                  />
                </td>
              </tr>
            </template>

            <!-- BARIS JUMLAH TOTAL -->
            <tr class="bg-slate-800 font-black text-white border-t-4 border-slate-900">
              <td class="p-2.5 text-center sticky left-0 z-10 bg-slate-800 border-r border-slate-600 font-black text-white">
                -
              </td>
              <td class="p-2.5 sticky left-12 z-10 bg-slate-800 border-r border-slate-600 tracking-wider uppercase font-black text-white">
                JUMLAH
              </td>
              <td class="p-2.5 text-center border-r border-slate-600 font-mono font-black text-white">
                {{ summaryTotals.colTotals.jml_umum }}
              </td>
              <td
                v-for="sf in config.spesialisFields"
                :key="`tot-${sf.key}`"
                class="p-2.5 text-center border-r border-slate-600 font-mono font-black text-white"
              >
                {{ summaryTotals.colTotals[sf.key] }}
              </td>
              <td class="p-2.5 text-center bg-slate-900 text-white border-r border-slate-600 text-base font-mono font-black">
                {{ summaryTotals.grandTotal }}
              </td>
              <td class="p-2.5 text-center border-r border-slate-600 font-mono font-black text-white">
                {{ summaryTotals.colTotals.jml_ppns }}
              </td>
              <td class="p-2.5 text-center text-white font-black">
                -
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ============================================== -->
        <!-- TABEL MODUL K2: DATA OBYEK PENGAWASAN -->
        <!-- ============================================== -->
        <table v-else-if="config.kode === 'K2'" class="w-full text-left text-xs border-collapse">
          <thead>
            <!-- Header Tingkat 1 -->
            <tr class="bg-slate-900 text-white border-b-2 border-slate-700">
              <th
                rowspan="2"
                class="p-2.5 font-black text-center sticky left-0 z-20 bg-slate-900 text-white border-r border-slate-700 w-12 min-w-[48px]"
              >
                No
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-black text-center sticky left-12 z-20 bg-slate-900 text-white border-r border-slate-700 w-24 min-w-[90px]"
              >
                Sektor/KLUI
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-black text-center border-r border-slate-700 bg-slate-800 text-white w-24 min-w-[90px]"
              >
                Jml Perusahaan
              </th>
              <th
                colspan="2"
                class="p-2 font-black text-center border-r border-slate-700 bg-slate-800 text-white"
              >
                Jml TK
              </th>
              <th
                colspan="3"
                class="p-2 font-black text-center border-r border-slate-700 bg-slate-800 text-white"
              >
                Kategori Prsh
              </th>
              <th
                colspan="4"
                class="p-2 font-black text-center border-r border-slate-700 bg-slate-800 text-white"
              >
                Status Perusahaan
              </th>
              <th
                colspan="4"
                class="p-2 font-black text-center border-r border-slate-700 bg-slate-800 text-white"
              >
                Perangkat Hub. Industrial
              </th>
              <th
                rowspan="2"
                class="p-2.5 font-black text-center border-r border-slate-700 bg-slate-900 text-white w-48 min-w-[190px]"
              >
                Penghargaan K3
              </th>
            </tr>

            <!-- Header Tingkat 2 -->
            <tr class="bg-slate-800 text-slate-100 border-b-2 border-slate-700">
              <!-- Jml TK -->
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-20 min-w-[75px] text-slate-100">WNI</th>
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-20 min-w-[75px] text-slate-100">WNA</th>
              <!-- Kategori Prsh -->
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-20 min-w-[75px] text-slate-100">Kecil</th>
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-20 min-w-[75px] text-slate-100">Sedang</th>
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-20 min-w-[75px] text-slate-100">Besar</th>
              <!-- Status Perusahaan -->
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-20 min-w-[75px] text-slate-100">Swasta</th>
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-20 min-w-[75px] text-slate-100">PMDN</th>
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-20 min-w-[75px] text-slate-100">PMA</th>
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-24 min-w-[95px] text-slate-100">Joint Venture</th>
              <!-- Perangkat Hub. Industrial -->
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-20 min-w-[75px] text-slate-100">PP</th>
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-20 min-w-[75px] text-slate-100">PKB</th>
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-20 min-w-[75px] text-slate-100">SP</th>
              <th class="p-1.5 font-black text-center border-r border-slate-700 w-24 min-w-[95px] text-slate-100">Lemb. Bipartit</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-300 text-black">
            <!-- Tepat 10 Baris: nomor 1 sampai 10, kolom Sektor/KLUI berisi 1, 2, 3, 4, 5, 6, 7, 8, 9, 0 -->
            <tr
              v-for="row in config.rows"
              :key="row.id_klui"
              class="hover:bg-slate-100/60 transition font-bold"
            >
              <!-- No (menempel saat digeser) -->
              <td class="p-2.5 text-center sticky left-0 z-10 bg-white border-r-2 border-slate-300 text-black font-mono font-black">
                {{ row.no }}
              </td>
              <!-- Sektor/KLUI (menempel saat digeser) -->
              <td
                class="p-2.5 text-center sticky left-12 z-10 bg-white border-r-2 border-slate-300 text-black font-mono font-black"
                :title="row.nama_sektor"
              >
                {{ row.sektor_klui }}
              </td>
              <!-- 15 Kolom Kotak Isian Angka K2 (termasuk Penghargaan K3 integer sesuai REST API) -->
              <td
                v-for="f in config.numericFields"
                :key="`k2-${row.id_klui}-${f.key}`"
                class="p-1 border-r border-slate-300"
              >
                <input
                  type="number"
                  min="0"
                  :disabled="isReadOnly"
                  :value="rowsData[row.id_klui]?.[f.key]"
                  @input="onNumberInput(row.id_klui, f.key, $event)"
                  class="w-full text-center bg-white border-2 border-slate-300 text-black font-black rounded py-1 px-1 focus:border-slate-700 disabled:bg-slate-100 disabled:text-black font-mono"
                />
              </td>
            </tr>

            <!-- BARIS JUMLAH TOTAL K2 (Dihitung otomatis untuk 15 kolom angka) -->
            <tr class="bg-slate-800 font-black text-white border-t-4 border-slate-900">
              <td class="p-2.5 text-center sticky left-0 z-10 bg-slate-800 border-r border-slate-600 font-black text-white">
                -
              </td>
              <td class="p-2.5 text-center sticky left-12 z-10 bg-slate-800 border-r border-slate-600 tracking-wider uppercase font-black text-white">
                JUMLAH
              </td>
              <td
                v-for="f in config.numericFields"
                :key="`tot-k2-${f.key}`"
                class="p-2.5 text-center border-r border-slate-600 font-mono font-black text-white"
              >
                {{ summaryTotals.colTotals?.[f.key] ?? 0 }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ============================================== -->
        <!-- TABEL MODUL K3: OBYEK PENGAWASAN K3 -->
        <!-- ============================================== -->
        <table v-else-if="config.kode === 'K3'" class="w-full text-left text-xs border-collapse">
          <thead>
            <!-- Header SATU tingkat (bukan dua tingkat) -->
            <tr class="bg-slate-900 text-white border-b-2 border-slate-700">
              <th
                class="p-2.5 font-black text-center sticky left-0 z-20 bg-slate-900 text-white border-r border-slate-700 w-12 min-w-[48px]"
              >
                No
              </th>
              <th
                class="p-2.5 font-black text-center sticky left-12 z-20 bg-slate-900 text-white border-r border-slate-700 w-24 min-w-[90px]"
              >
                Sektor/KLUI
              </th>
              <!-- 12 Kolom Angka Header SATU tingkat -->
              <th
                v-for="f in config.numericFields"
                :key="`k3-h-${f.key}`"
                class="p-2.5 font-black text-center border-r border-slate-700 bg-slate-800 text-slate-100 text-xs"
                :class="f.width"
                :title="f.fullLabel || f.label"
              >
                {{ f.label }}
              </th>
              <!-- Kolom Ket. -->
              <th
                class="p-2.5 font-black text-center border-r border-slate-700 bg-slate-900 text-white w-48 min-w-[180px]"
              >
                Ket.
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-300 text-black">
            <!-- Tepat 10 Baris: nomor 1 sampai 10, kolom Sektor/KLUI berisi 1, 2, 3, 4, 5, 6, 7, 8, 9, 0 -->
            <tr
              v-for="row in config.rows"
              :key="row.id_klui"
              class="hover:bg-slate-100/60 transition font-bold"
            >
              <!-- No (menempel saat digeser) -->
              <td class="p-2.5 text-center sticky left-0 z-10 bg-white border-r-2 border-slate-300 text-black font-mono font-black">
                {{ row.no }}
              </td>
              <!-- Sektor/KLUI (menempel saat digeser) -->
              <td
                class="p-2.5 text-center sticky left-12 z-10 bg-white border-r-2 border-slate-300 text-black font-mono font-black"
                :title="row.nama_sektor"
              >
                {{ row.sektor_klui }}
              </td>
              <!-- 12 Kolom Kotak Isian Angka (kosong dihitung 0, tidak boleh negatif) -->
              <td
                v-for="f in config.numericFields"
                :key="`k3-${row.id_klui}-${f.key}`"
                class="p-1 border-r border-slate-300"
              >
                <input
                  type="number"
                  min="0"
                  :disabled="isReadOnly"
                  :value="rowsData[row.id_klui]?.[f.key]"
                  @input="onNumberInput(row.id_klui, f.key, $event)"
                  class="w-full text-center bg-white border-2 border-slate-300 text-black font-black rounded py-1 px-1 focus:outline-none focus:border-slate-700 disabled:bg-slate-100 disabled:text-black font-mono"
                />
              </td>
              <!-- Kolom Ket (Kotak Teks) -->
              <td class="p-1">
                <input
                  type="text"
                  maxlength="255"
                  :disabled="isReadOnly"
                  v-model="rowsData[row.id_klui].keterangan"
                  placeholder="Keterangan..."
                  class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded py-1 px-2 focus:outline-none focus:border-slate-700 text-xs disabled:bg-slate-100 disabled:text-black"
                />
              </td>
            </tr>

            <!-- BARIS JUMLAH TOTAL K3 (Dihitung otomatis untuk 12 kolom angka, Ket '-') -->
            <tr class="bg-slate-800 font-black text-white border-t-4 border-slate-900">
              <td class="p-2.5 text-center sticky left-0 z-10 bg-slate-800 border-r border-slate-600 font-black text-white">
                -
              </td>
              <td class="p-2.5 text-center sticky left-12 z-10 bg-slate-800 border-r border-slate-600 tracking-wider uppercase font-black text-white">
                JUMLAH
              </td>
              <td
                v-for="f in config.numericFields"
                :key="`tot-k3-${f.key}`"
                class="p-2.5 text-center border-r border-slate-600 font-mono font-black text-white"
              >
                {{ summaryTotals.colTotals?.[f.key] ?? 0 }}
              </td>
              <td class="p-2.5 text-center text-white font-black bg-slate-800">
                -
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ============================================== -->
        <!-- TABEL UMUM HEADER BERTINGKAT (K4, DST.) -->
        <!-- Mendukung header multi-tingkat (rowspan & colspan) dari konfigurasi -->
        <!-- ============================================== -->
        <table v-else-if="config.headerRows && config.headerRows.length > 0" class="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              v-for="(hRow, hIdx) in config.headerRows"
              :key="`hrow-${hIdx}`"
              class="border-b border-slate-700"
            >
              <th
                v-for="(cell, cIdx) in hRow"
                :key="`hcell-${hIdx}-${cIdx}`"
                :rowspan="cell.rowspan || 1"
                :colspan="cell.colspan || 1"
                :title="cell.fullLabel || cell.label"
                :class="[
                  'font-black text-center border-r border-slate-700',
                  hIdx === 0 ? 'p-2' : 'p-1.5',
                  cell.width || '',
                  cell.sticky === 'left-0' ? 'sticky left-0 z-20 bg-slate-900 text-white' :
                  cell.sticky === 'left-12' ? 'sticky left-12 z-20 bg-slate-900 text-white' :
                  cell.variant === 'primary' ? 'bg-slate-900 text-white' :
                  cell.variant === 'group' ? 'bg-slate-800 text-white' :
                  cell.variant === 'leaf' ? 'bg-slate-700 text-slate-100' :
                  'bg-slate-800 text-slate-100'
                ]"
              >
                {{ cell.label }}
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-300 text-black">
            <tr
              v-for="(row, rIdx) in config.rows"
              :key="getRowId(row)"
              class="hover:bg-slate-100/60 transition font-bold"
            >
              <!-- No (menempel saat digeser) -->
              <td class="p-2.5 text-center sticky left-0 z-10 bg-white border-r-2 border-slate-300 text-black font-mono font-black w-12 min-w-[48px]">
                {{ row.no }}
              </td>
              <!-- Kolom kedua (menempel saat digeser): Jabatan atau Sektor/KLUI -->
              <td
                :class="[
                  'p-2.5 sticky left-12 z-10 bg-white border-r-2 border-slate-300 text-black font-black',
                  config.rowType === 'jabatan'
                    ? 'text-left whitespace-nowrap w-52 min-w-[200px]'
                    : 'text-center font-mono w-24 min-w-[90px]'
                ]"
                :title="row.nama_sektor || row.label"
              >
                {{ config.rowType === 'jabatan' ? row.label : row.sektor_klui }}
              </td>
              <!-- Kolom Kotak Isian Angka -->
              <td
                v-for="f in config.numericFields"
                :key="`gen-${config.kode}-${getRowId(row)}-${f.key}`"
                :class="[
                  'p-1 border-r border-slate-300',
                  f.width || '',
                  isAutoField(f.key) ? 'bg-slate-200/80' : ''
                ]"
              >
                <input
                  type="number"
                  min="0"
                  :step="f.decimal ? '0.01' : '1'"
                  :disabled="isReadOnly || isAutoField(f.key)"
                  :value="rowsData[getRowId(row)]?.[f.key]"
                  @input="onNumberInput(getRowId(row), f.key, $event)"
                  :class="[
                    'w-full text-center border-2 font-black rounded py-1 px-1 font-mono',
                    isAutoField(f.key)
                      ? 'bg-slate-200 border-slate-400 text-slate-700 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-black focus:border-slate-700 disabled:bg-slate-100 disabled:text-black'
                  ]"
                />
              </td>
              <!-- Kolom Teks (Ket / Keterangan) jika textField biasa -->
              <td v-if="config.textField" class="p-1">
                <input
                  type="text"
                  maxlength="255"
                  :disabled="isReadOnly"
                  v-model="rowsData[getRowId(row)][config.textField.key]"
                  :placeholder="config.textField.placeholder || 'Keterangan...'"
                  class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded py-1 px-2 focus:outline-none focus:border-slate-700 text-xs disabled:bg-slate-100 disabled:text-black"
                />
              </td>
              <!-- Kolom Teks Statis Bersatu (rowspan) jika staticCell -->
              <td
                v-else-if="config.staticCell && rIdx === 0"
                :rowspan="config.staticCell.rowspan || config.rows.length"
                :class="[
                  'p-3 text-center align-middle font-bold text-xs bg-white border-l-2 border-slate-300 text-black',
                  config.staticCell.width || 'w-64 min-w-[240px]'
                ]"
              >
                {{ config.staticCell.text }}
              </td>
            </tr>

            <!-- BARIS JUMLAH TOTAL -->
            <tr class="bg-slate-800 font-black text-white border-t-4 border-slate-900">
              <td class="p-2.5 text-center sticky left-0 z-10 bg-slate-800 border-r border-slate-600 font-black text-white">
                -
              </td>
              <td
                :class="[
                  'p-2.5 sticky left-12 z-10 bg-slate-800 border-r border-slate-600 tracking-wider uppercase font-black text-white',
                  config.rowType === 'jabatan' ? 'text-left' : 'text-center'
                ]"
              >
                JUMLAH
              </td>
              <td
                v-for="f in config.numericFields"
                :key="`tot-${config.kode}-${f.key}`"
                class="p-2.5 text-center border-r border-slate-600 font-mono font-black text-white"
              >
                {{ summaryTotals.colTotals?.[f.key] ?? 0 }}
              </td>
              <td v-if="config.textField || config.staticCell" class="p-2.5 text-center text-white font-black bg-slate-800">
                -
              </td>
            </tr>
          </tbody>
        </table>

      </div>

      <!-- INFORMASI PENANDATANGAN RESMI (DARI DATA WILAYAH BALAI DI REST API, MIS. K10) -->
      <div
        v-if="config.signatureConfig && activeWilayahInfo"
        class="pt-4 border-t-2 border-slate-300 space-y-2.5"
      >
        <h3 class="text-sm font-black text-black">
          Penandatangan Resmi (Data Balai)
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-300">
            <div class="text-[11px] font-bold text-slate-600">Kepala Balai</div>
            <div class="font-black text-black mt-0.5">{{ activeWilayahInfo.nama_kepala_balai || '-' }}</div>
            <div class="font-mono text-[11px] font-bold text-slate-700 mt-0.5">NIP. {{ activeWilayahInfo.nip_kepala_balai || '-' }}</div>
          </div>
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-300">
            <div class="text-[11px] font-bold text-slate-600">Pembuat Laporan</div>
            <div class="font-black text-black mt-0.5">{{ activeWilayahInfo.nama_pembuat_laporan || '-' }}</div>
            <div class="font-mono text-[11px] font-bold text-slate-700 mt-0.5">NIP. {{ activeWilayahInfo.nip_pembuat_laporan || '-' }}</div>
          </div>
        </div>
      </div>

      <!-- TOMBOL AKSI -->
      <div class="pt-4 flex flex-wrap items-center justify-end gap-3">
        <!-- Tombol Tutup -->
        <button
          type="button"
          @click="mintaKonfirmasiAksi('tutup')"
          class="px-4 py-2 bg-white hover:bg-slate-100 text-black font-black text-xs sm:text-sm rounded-lg border-2 border-slate-400 transition cursor-pointer"
        >
          Tutup
        </button>

        <!-- Tombol Reset ke Nol (khusus mode Bulanan) -->
        <button
          v-if="!isTriwulanView"
          type="button"
          @click="mintaKonfirmasiAksi('reset')"
          :disabled="isReadOnly"
          class="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-950 font-black text-xs sm:text-sm rounded-lg border-2 border-red-600 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reset ke Nol
        </button>

        <!-- Tombol Simpan (khusus mode Bulanan) -->
        <button
          v-if="!isTriwulanView"
          type="button"
          @click="mintaKonfirmasiAksi('simpan')"
          :disabled="isLoading || isReadOnly"
          class="px-5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs border-2 border-slate-900 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg v-if="isLoading" class="animate-spin w-4 h-4 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <svg v-else class="w-4 h-4 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          {{ isReadOnly ? 'Data Terkunci' : 'Simpan' }}
        </button>

        <!-- Tombol Finalkan Laporan (di kanan Simpan) -->
        <button
          type="button"
          v-if="activeLaporan.id_laporan && activeLaporan.status_laporan === 'draf'"
          @click="mintaKonfirmasiAksi('finalkan')"
          :disabled="isWorkflowLoading"
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs border-2 border-slate-900 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg class="w-4 h-4 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Finalkan Laporan
        </button>

        <!-- Tombol Buka Kembali (di kanan Simpan saat status Final) -->
        <button
          type="button"
          v-if="activeLaporan.id_laporan && activeLaporan.status_laporan === 'final'"
          @click="mintaKonfirmasiAksi('buka_kembali')"
          :disabled="isWorkflowLoading"
          class="px-4 py-2 bg-red-100 hover:bg-red-200 active:scale-95 text-red-950 font-black text-xs sm:text-sm rounded-lg shadow-xs border-2 border-red-600 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg class="w-4 h-4 text-red-700" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
          </svg>
          Buka Kembali
        </button>
      </div>
    </section>

    <!-- POP-UP KONFIRMASI IYA / TIDAK -->
    <div
      v-if="confirmModal.open"
      @click.self="batalKonfirmasiAksi"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-confirm-title"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div class="bg-white border-2 border-slate-400 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div
          :class="[
            'w-12 h-12 rounded-full border-2 flex items-center justify-center',
            confirmModal.danger
              ? 'bg-red-100 border-red-500 text-red-600'
              : 'bg-slate-100 border-slate-400 text-slate-800'
          ]"
        >
          <svg v-if="confirmModal.danger" class="w-6 h-6 text-red-600" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <svg v-else class="w-6 h-6 text-slate-800" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>

        <div>
          <h3 id="form-confirm-title" class="text-lg font-black text-black">{{ confirmModal.title }}</h3>
          <p class="text-xs sm:text-sm text-slate-700 font-bold mt-1.5 leading-relaxed">
            {{ confirmModal.message }}
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="batalKonfirmasiAksi"
            class="px-5 py-2 bg-white hover:bg-slate-100 text-black font-black text-xs sm:text-sm rounded-lg border-2 border-slate-400 transition cursor-pointer"
          >
            {{ confirmModal.cancelLabel }}
          </button>
          <button
            type="button"
            @click="lanjutKonfirmasiAksi"
            :class="[
              'px-5 py-2 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs transition cursor-pointer border-2',
              confirmModal.danger
                ? 'bg-red-600 hover:bg-red-500 border-red-800'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-900'
            ]"
          >
            {{ confirmModal.confirmLabel }}
          </button>
        </div>
      </div>
    </div>

    <!-- KARTU 3: KETERANGAN KOLOM -->
    <section
      v-if="(config.columnDescriptions && config.columnDescriptions.length > 0) || (config.specialistDescriptions && config.specialistDescriptions.length > 0)"
      class="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-xs"
    >
      <h3 class="text-sm font-black text-black mb-3 flex items-center gap-2">
        <svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ config.columnDescriptionTitle || (config.columnDescriptions ? 'Keterangan kolom:' : 'Keterangan kolom spesialis:') }}
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
        <div
          v-for="desc in (config.columnDescriptions || config.specialistDescriptions)"
          :key="desc.label || desc.id"
          class="bg-white border-2 border-slate-300 rounded-lg p-2.5 text-black flex items-start gap-2 shadow-xs"
        >
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-200 text-slate-900 font-black text-[11px] shrink-0 border border-slate-400 min-w-[20px] text-center">
            {{ desc.label || desc.id }}
          </span>
          <span class="leading-relaxed text-black font-bold">{{ desc.text }}</span>
        </div>
      </div>
    </section>

  </div>
</template>
