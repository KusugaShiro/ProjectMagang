<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  apiGetMasterWilayah,
  apiGetDaftarLaporan,
  apiBuatLaporan,
  apiGetMatriksModul,
  apiSimpanMatriksModul,
  apiKirimLaporan,
  apiSahkanLaporan,
  apiKembalikanLaporan,
  hitungTriwulanDB,
  ambilLaporan,
  ambilSimpananTriwulan,
  simpanTriwulan,
} from '../lib/api'
import {
  currentUser,
  isOperator,
  isKepalaBalai,
  isAdmin,
} from '../lib/auth'
import { exportK1ToExcel, exportK2ToExcel, exportK3ToExcel, exportK4ToExcel, exportK5ToExcel, exportK6ToExcel, exportK7ToExcel, exportK8aToExcel, exportK8bToExcel, exportK8cToExcel, exportK9aToExcel, exportK9bToExcel } from '../lib/excel'

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

// Dukungan mode Triwulan otomatis (untuk K5 s.d. K10 yang memiliki triwulanConfig)
const supportsTriwulanMode = computed(() => Boolean(props.config.triwulanConfig))
const isTriwulanMode = computed(() => supportsTriwulanMode.value && filter.jenis_periode === 'triwulan')
const activeTriwulanRomawi = computed(() => {
  const tw = activeLaporan.value?.triwulan || filter.triwulan
  return triwulanOptions.find(t => t.value === tw)?.romawi || 'I'
})

// State Dokumen Laporan Aktif
const isFormOpen = ref(false)
const activeLaporan = ref(null)
const rowsData = reactive({})
const isLoading = ref(false)
const isWorkflowLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const infoMessage = ref('')
const triwulanBulanDipakai = ref([])
const triwulanBulanBelumTersimpan = ref([])

// Penandatangan dari wilayah_pengawasan (Aturan Bisnis #5 PRD)
const activeWilayahInfo = computed(() => {
  if (!activeLaporan.value) return null
  return daftarWilayah.value.find(w => w.id_wilayah === activeLaporan.value.id_wilayah) || activeLaporan.value.wilayah
})

// Cek apakah form berstatus terkunci (read-only)
const isReadOnly = computed(() => {
  return activeLaporan.value?.status_laporan === 'disahkan'
})

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

// Inisialisasi baris kosong untuk form K1, K2, K3, K4, K5, dst.
function initEmptyRows() {
  Object.keys(rowsData).forEach(k => delete rowsData[k])

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
      rowsData[rKey] = rowItem
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
        rowsData[row.id_jabatan] = rowItem
      }
    })
  }
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

// Buka form isian / Buat dokumen laporan bulanan atau agregasi Triwulan
async function bukaFormIsian() {
  errorMessage.value = ''
  successMessage.value = ''
  infoMessage.value = ''
  triwulanBulanDipakai.value = []
  triwulanBulanBelumTersimpan.value = []
  isLoading.value = true

  try {
    // MODE TRIWULAN OTOMATIS (K5 s.d. K10)
    if (isTriwulanMode.value) {
      const twOpt = triwulanOptions.find(t => t.value === Number(filter.triwulan)) || triwulanOptions[0]
      const wilObj = daftarWilayah.value.find(w => w.id_wilayah === Number(filter.id_wilayah)) || null
      const twCfg = props.config.triwulanConfig

      initEmptyRows()

      const dipakai = []
      const belumTersimpan = []

      for (const b of twOpt.bulanList) {
        const namaBulan = bulanList.find(bl => bl.value === b)?.label || `Bulan ${b}`
        const resBulan = await ambilLaporan(props.config.modul, {
          id_wilayah: Number(filter.id_wilayah),
          tahun: Number(filter.tahun),
          bulan: b,
        })

        if (!resBulan || !resBulan.data || resBulan.data.length === 0) {
          belumTersimpan.push(namaBulan)
          continue
        }

        dipakai.push(namaBulan)

        resBulan.data.forEach(item => {
          const matchedRow = findConfigRow(item)
          if (!matchedRow) return
          const rKey = getRowId(matchedRow)
          if (!rowsData[rKey]) return

          const sourceItem = props.config.fromApiRow ? props.config.fromApiRow(item) : item

          props.config.numericFields.forEach(sf => {
            const rawVal = sourceItem[sf.key] ?? (sf.apiKey ? sourceItem[sf.apiKey] : undefined)
            const numVal = Number(rawVal) || 0

            if (twCfg.autoSumFields?.includes(sf.key)) {
              rowsData[rKey][sf.key] = (Number(rowsData[rKey][sf.key]) || 0) + numVal
            } else if (twCfg.lastNonZeroFields?.includes(sf.key)) {
              if (numVal !== 0) {
                rowsData[rKey][sf.key] = numVal
              }
            }
          })
        })
      }

      // Jika laporan triwulan sudah pernah disimpan, pakai nilai editable (Jumlah & Keterangan) yang tersimpan
      const savedTriwulan = ambilSimpananTriwulan(props.config.modul, {
        id_wilayah: Number(filter.id_wilayah),
        tahun: Number(filter.tahun),
        triwulan: twOpt.value,
      })
      if (savedTriwulan?.rows) {
        props.config.rows.forEach(r => {
          const rKey = getRowId(r)
          const savedRow = savedTriwulan.rows[rKey]
          if (!savedRow || !rowsData[rKey]) return
          ;(twCfg.editableFields || []).forEach(ef => {
            if (savedRow[ef] !== undefined && savedRow[ef] !== null) {
              rowsData[rKey][ef] = ef === props.config.textField?.key ? String(savedRow[ef]) : (Number(savedRow[ef]) || 0)
            }
          })
        })
      }

      triwulanBulanDipakai.value = dipakai
      triwulanBulanBelumTersimpan.value = belumTersimpan

      activeLaporan.value = {
        id_laporan: null,
        id_wilayah: Number(filter.id_wilayah),
        tahun: Number(filter.tahun),
        bulan: null,
        triwulan: twOpt.value,
        jenis_periode: 'triwulan',
        status_laporan: 'draf',
        wilayah: wilObj,
      }

      isFormOpen.value = true
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
      doc = await apiBuatLaporan({
        id_wilayah: Number(filter.id_wilayah),
        tahun: Number(filter.tahun),
        bulan: Number(filter.bulan),
      })
      infoMessage.value = 'Dokumen laporan baru telah dibuat (Status: Draf).'
    } else {
      if (doc.status_laporan === 'disahkan') {
        infoMessage.value = `Laporan ini telah disahkan pada ${doc.tanggal_pengesahan} dan berstatus terkunci (Read-Only).`
      } else if (doc.status_laporan === 'terkirim') {
        infoMessage.value = 'Laporan ini telah dikirim ke Kepala Balai dan sedang menunggu pengesahan.'
      } else {
        infoMessage.value = 'Dokumen laporan draf dimuat. Menyimpan akan memperbarui data matriks.'
      }
    }

    activeLaporan.value = { ...doc, jenis_periode: 'bulanan' }
    initEmptyRows()

    const resModul = await apiGetMatriksModul(doc.id_laporan, props.config.modul || 'k1')
    if (resModul?.data && Array.isArray(resModul.data) && resModul.data.length > 0) {
      resModul.data.forEach(item => {
        if (isGenericMatrixForm.value && props.config.numericFields) {
          const matchedRow = findConfigRow(item)
          const rKey = matchedRow ? getRowId(matchedRow) : (item.id_klui ?? item.id_jabatan)
          if (rKey && rowsData[rKey]) {
            const sourceItem = props.config.fromApiRow ? props.config.fromApiRow(item) : item
            const mapped = { ...rowsData[rKey] }
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
            rowsData[rKey] = mapped
          }
        } else {
          const key = item.id_jabatan
          if (key && rowsData[key]) {
            rowsData[key] = {
              ...rowsData[key],
              ...item,
            }
          }
        }
      })
    }

    isFormOpen.value = true
  } catch (err) {
    errorMessage.value = 'Gagal membuka form: ' + (err.message || err)
  } finally {
    isLoading.value = false
  }
}

// Sanitasi input angka (int >= 0)
function onNumberInput(rowKey, field, event) {
  if (isReadOnly.value || isAutoField(field)) return
  const raw = event.target.value
  if (raw === '' || isNaN(raw)) {
    rowsData[rowKey][field] = 0
    event.target.value = 0
    return
  }
  let val = Math.floor(Number(raw))
  if (val < 0) val = 0
  rowsData[rowKey][field] = val
  event.target.value = val
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

// Simpan Matriks ke API
async function simpan() {
  if (!activeLaporan.value || isReadOnly.value) return
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    // MODE TRIWULAN: simpan hanya kolom editable (mis. Jumlah dan Keterangan); kolom otomatis tidak ikut disimpan
    if (activeLaporan.value.jenis_periode === 'triwulan' && props.config.triwulanConfig) {
      const editableFields = props.config.triwulanConfig.editableFields || []
      const editableRows = {}
      props.config.rows.forEach(r => {
        const rKey = getRowId(r)
        const rowVal = rowsData[rKey] || {}
        const item = {}
        editableFields.forEach(ef => {
          item[ef] = ef === props.config.textField?.key ? (rowVal[ef] || '') : (Number(rowVal[ef]) || 0)
        })
        editableRows[rKey] = item
      })

      simpanTriwulan(props.config.modul, {
        id_wilayah: activeLaporan.value.id_wilayah,
        tahun: activeLaporan.value.tahun,
        triwulan: activeLaporan.value.triwulan,
      }, editableRows)

      successMessage.value = 'Laporan tersimpan.'
      setTimeout(() => {
        if (successMessage.value === 'Laporan tersimpan.') successMessage.value = ''
      }, 5000)
      return
    }

    let payloadBaris = []
    if (props.config.kode === 'K2') {
      payloadBaris = props.config.rows.map(r => {
        const rowVal = rowsData[r.id_klui] || {}
        const payloadItem = {
          id_klui: r.id_klui,
          penghargaan_k3: Number(rowVal.penghargaan_k3) || 0,
        }
        props.config.numericFields.forEach(sf => {
          payloadItem[sf.key] = Number(rowVal[sf.key]) || 0
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
          payloadItem[sf.key] = Number(rowVal[sf.key]) || 0
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
          payloadItem[sf.apiKey || sf.key] = Number(rowVal[sf.key]) || 0
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
            jml_umum: Number(rowVal.jml_umum) || 0,
            jml_ppns: Number(rowVal.jml_ppns) || 0,
            keterangan: rowVal.keterangan || null,
          }
          props.config.spesialisFields?.forEach(sf => {
            payloadItem[sf.key] = Number(rowVal[sf.key]) || 0
          })
          return payloadItem
        })
    }

    await apiSimpanMatriksModul(activeLaporan.value.id_laporan, props.config.modul || 'k1', payloadBaris)
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

async function aksiKirim() {
  if (!activeLaporan.value) return
  if (!confirm('Kirim laporan ini ke Kepala Balai untuk diperiksa?')) return
  isWorkflowLoading.value = true
  errorMessage.value = ''
  try {
    await apiKirimLaporan(activeLaporan.value.id_laporan)
    activeLaporan.value.status_laporan = 'terkirim'
    successMessage.value = 'Laporan berhasil dikirim ke Kepala Balai.'
    infoMessage.value = 'Status laporan kini: Terkirim.'
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengirim laporan.'
  } finally {
    isWorkflowLoading.value = false
  }
}

async function aksiSahkan() {
  if (!activeLaporan.value) return
  if (!confirm('Sahkan laporan ini? Data akan dikunci (read-only).')) return
  isWorkflowLoading.value = true
  errorMessage.value = ''
  try {
    await apiSahkanLaporan(activeLaporan.value.id_laporan)
    activeLaporan.value.status_laporan = 'disahkan'
    activeLaporan.value.tanggal_pengesahan = new Date().toISOString().slice(0, 10)
    successMessage.value = 'Laporan telah disahkan.'
    infoMessage.value = `Laporan telah disahkan pada ${activeLaporan.value.tanggal_pengesahan} dan data dikunci.`
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengesahkan laporan.'
  } finally {
    isWorkflowLoading.value = false
  }
}

async function aksiKembalikan() {
  if (!activeLaporan.value) return
  if (!confirm('Kembalikan laporan ini ke status Draf? Kunci data akan dibuka kembali.')) return
  isWorkflowLoading.value = true
  errorMessage.value = ''
  try {
    await apiKembalikanLaporan(activeLaporan.value.id_laporan)
    activeLaporan.value.status_laporan = 'draf'
    activeLaporan.value.tanggal_pengesahan = null
    successMessage.value = 'Laporan dikembalikan ke status draf.'
    infoMessage.value = 'Kunci data dibuka kembali. Anda dapat mengedit isian form.'
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengembalikan laporan.'
  } finally {
    isWorkflowLoading.value = false
  }
}

function resetKeNol() {
  if (isReadOnly.value) return
  if (!confirm('Kosongkan semua isian tabel ke angka nol?')) return
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
  successMessage.value = ''
  infoMessage.value = ''
  errorMessage.value = ''
  triwulanBulanDipakai.value = []
  triwulanBulanBelumTersimpan.value = []
}

async function downloadExcel() {
  if (!activeLaporan.value) return
  try {
    const wilObj = activeWilayahInfo.value
    const namaBulan = bulanList.find(b => b.value === activeLaporan.value.bulan)?.label || `Bulan ${activeLaporan.value.bulan}`

    if (props.config.kode === 'K9b') {
      await exportK9bToExcel({
        config: props.config,
        meta: {
          id_wilayah: activeLaporan.value.id_wilayah,
          wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
          jenisPeriode: activeLaporan.value.jenis_periode || 'bulanan',
          bulan: namaBulan,
          triwulan: activeLaporan.value.triwulan,
          triwulanRomawi: activeTriwulanRomawi.value,
          tahun: activeLaporan.value.tahun,
          kode: 'K9b',
          wilayahObj: wilObj,
        },
        rowsData,
        summaryTotals: summaryTotals.value,
      })
    } else if (props.config.kode === 'K9a') {
      await exportK9aToExcel({
        config: props.config,
        meta: {
          id_wilayah: activeLaporan.value.id_wilayah,
          wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
          jenisPeriode: activeLaporan.value.jenis_periode || 'bulanan',
          bulan: namaBulan,
          triwulan: activeLaporan.value.triwulan,
          triwulanRomawi: activeTriwulanRomawi.value,
          tahun: activeLaporan.value.tahun,
          kode: 'K9a',
          wilayahObj: wilObj,
        },
        rowsData,
        summaryTotals: summaryTotals.value,
      })
    } else if (props.config.kode === 'K8c') {
      await exportK8cToExcel({
        config: props.config,
        meta: {
          id_wilayah: activeLaporan.value.id_wilayah,
          wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
          jenisPeriode: activeLaporan.value.jenis_periode || 'bulanan',
          bulan: namaBulan,
          triwulan: activeLaporan.value.triwulan,
          triwulanRomawi: activeTriwulanRomawi.value,
          tahun: activeLaporan.value.tahun,
          kode: 'K8c',
          wilayahObj: wilObj,
        },
        rowsData,
        summaryTotals: summaryTotals.value,
      })
    } else if (props.config.kode === 'K8b') {
      await exportK8bToExcel({
        config: props.config,
        meta: {
          id_wilayah: activeLaporan.value.id_wilayah,
          wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
          jenisPeriode: activeLaporan.value.jenis_periode || 'bulanan',
          bulan: namaBulan,
          triwulan: activeLaporan.value.triwulan,
          triwulanRomawi: activeTriwulanRomawi.value,
          tahun: activeLaporan.value.tahun,
          kode: 'K8b',
          wilayahObj: wilObj,
        },
        rowsData,
        summaryTotals: summaryTotals.value,
      })
    } else if (props.config.kode === 'K8a') {
      await exportK8aToExcel({
        config: props.config,
        meta: {
          id_wilayah: activeLaporan.value.id_wilayah,
          wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
          jenisPeriode: activeLaporan.value.jenis_periode || 'bulanan',
          bulan: namaBulan,
          triwulan: activeLaporan.value.triwulan,
          triwulanRomawi: activeTriwulanRomawi.value,
          tahun: activeLaporan.value.tahun,
          kode: 'K8a',
          wilayahObj: wilObj,
        },
        rowsData,
        summaryTotals: summaryTotals.value,
      })
    } else if (props.config.kode === 'K7') {
      await exportK7ToExcel({
        config: props.config,
        meta: {
          id_wilayah: activeLaporan.value.id_wilayah,
          wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
          jenisPeriode: activeLaporan.value.jenis_periode || 'bulanan',
          bulan: namaBulan,
          triwulan: activeLaporan.value.triwulan,
          triwulanRomawi: activeTriwulanRomawi.value,
          tahun: activeLaporan.value.tahun,
          kode: 'K7',
          wilayahObj: wilObj,
        },
        rowsData,
        summaryTotals: summaryTotals.value,
      })
    } else if (props.config.kode === 'K6') {
      await exportK6ToExcel({
        config: props.config,
        meta: {
          id_wilayah: activeLaporan.value.id_wilayah,
          wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
          jenisPeriode: activeLaporan.value.jenis_periode || 'bulanan',
          bulan: namaBulan,
          triwulan: activeLaporan.value.triwulan,
          triwulanRomawi: activeTriwulanRomawi.value,
          tahun: activeLaporan.value.tahun,
          kode: 'K6',
          wilayahObj: wilObj,
        },
        rowsData,
        summaryTotals: summaryTotals.value,
      })
    } else if (props.config.kode === 'K5') {
      await exportK5ToExcel({
        config: props.config,
        meta: {
          id_wilayah: activeLaporan.value.id_wilayah,
          wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
          jenisPeriode: activeLaporan.value.jenis_periode || 'bulanan',
          bulan: namaBulan,
          triwulan: activeLaporan.value.triwulan,
          triwulanRomawi: activeTriwulanRomawi.value,
          tahun: activeLaporan.value.tahun,
          kode: 'K5',
          wilayahObj: wilObj,
        },
        rowsData,
        summaryTotals: summaryTotals.value,
      })
    } else if (props.config.kode === 'K4') {
      await exportK4ToExcel({
        config: props.config,
        meta: {
          id_wilayah: activeLaporan.value.id_wilayah,
          wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
          bulan: namaBulan,
          triwulan: activeLaporan.value.triwulan,
          tahun: activeLaporan.value.tahun,
          kode: 'K4',
          wilayahObj: wilObj,
        },
        rowsData,
        summaryTotals: summaryTotals.value,
      })
    } else if (props.config.kode === 'K3') {
      await exportK3ToExcel({
        config: props.config,
        meta: {
          id_wilayah: activeLaporan.value.id_wilayah,
          wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
          bulan: namaBulan,
          triwulan: activeLaporan.value.triwulan,
          tahun: activeLaporan.value.tahun,
          kode: 'K3',
          wilayahObj: wilObj,
        },
        rowsData,
        summaryTotals: summaryTotals.value,
      })
    } else if (props.config.kode === 'K2') {
      await exportK2ToExcel({
        config: props.config,
        meta: {
          id_wilayah: activeLaporan.value.id_wilayah,
          wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
          bulan: namaBulan,
          triwulan: activeLaporan.value.triwulan,
          tahun: activeLaporan.value.tahun,
          kode: 'K2',
          wilayahObj: wilObj,
        },
        rowsData,
        summaryTotals: summaryTotals.value,
      })
    } else {
      await exportK1ToExcel({
        config: props.config,
        meta: {
          id_wilayah: activeLaporan.value.id_wilayah,
          wilayahName: wilObj?.teks_header_kabupaten || wilObj?.nama_kabupaten_kota || 'Banjarmasin',
          bulan: namaBulan,
          triwulan: activeLaporan.value.triwulan,
          tahun: activeLaporan.value.tahun,
          kode: props.config.kode || 'K1',
          wilayahObj: wilObj,
        },
        rowsData,
        summaryTotals: summaryTotals.value,
      })
    }
  } catch (err) {
    alert('Gagal mengekspor berkas Excel: ' + (err.message || err))
  }
}

async function muatMaster() {
  daftarWilayah.value = await apiGetMasterWilayah()
  if (daftarWilayah.value.length > 0) {
    if (isOperator.value && currentUser.value?.id_wilayah) {
      filter.id_wilayah = currentUser.value.id_wilayah
    } else {
      filter.id_wilayah = daftarWilayah.value[0].id_wilayah
    }
  }

  const q = route.query
  if (q.id_wilayah && q.bulan && q.tahun) {
    filter.id_wilayah = Number(q.id_wilayah)
    filter.bulan = Number(q.bulan)
    filter.tahun = Number(q.tahun)
    bukaFormIsian()
  }
}

onMounted(() => {
  muatMaster()
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

    <!-- Pesan Info Status -->
    <div v-if="infoMessage" class="p-4 rounded-xl bg-slate-50 border-2 border-slate-400 text-black text-sm flex items-center gap-3 shadow-xs font-bold">
      <svg class="w-5 h-5 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div class="text-black">{{ infoMessage }}</div>
    </div>

    <!-- KARTU 1: PILIH WILAYAH DAN PERIODE -->
    <section class="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-xs">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-black text-black flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-slate-500 border border-slate-700"></span>
          1. Pilih wilayah dan periode
        </h2>
        <span class="text-xs text-black font-bold">
          PRD: Header (wilayah, tahun, bulan) unik &bull; triwulan = (bulan + 2) DIV 3
        </span>
      </div>

      <div :class="['grid grid-cols-1 sm:grid-cols-2 gap-4', supportsTriwulanMode && !isTriwulanMode ? 'lg:grid-cols-5' : 'lg:grid-cols-4']">
        <!-- Wilayah -->
        <div>
          <label class="block text-xs font-black text-black mb-1.5">Wilayah Pengawasan</label>
          <select
            v-model.number="filter.id_wilayah"
            :disabled="isOperator"
            class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-700 disabled:bg-slate-200 disabled:text-black"
          >
            <option v-for="w in daftarWilayah" :key="w.id_wilayah" :value="w.id_wilayah">
              {{ w.nama_kabupaten_kota }} ({{ w.kode_wilayah }})
            </option>
          </select>
          <p v-if="isOperator" class="text-[11px] text-black font-bold mt-1">Terkunci untuk operator kabupaten</p>
        </div>

        <!-- Jenis Periode (khusus form yang mendukung agregasi Triwulan, mis. K5 s.d. K10) -->
        <div v-if="supportsTriwulanMode">
          <label class="block text-xs font-black text-black mb-1.5">Jenis Periode</label>
          <select
            v-model="filter.jenis_periode"
            class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-700"
          >
            <option value="bulanan">Bulanan</option>
            <option value="triwulan">Triwulan</option>
          </select>
        </div>

        <!-- Bulan (tampil pada mode Bulanan) -->
        <div v-if="!isTriwulanMode">
          <label class="block text-xs font-black text-black mb-1.5">Bulan Laporan</label>
          <select
            v-model.number="filter.bulan"
            class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-700"
          >
            <option v-for="b in bulanList" :key="b.value" :value="b.value">
              {{ b.value }}. {{ b.label }}
            </option>
          </select>
        </div>

        <!-- Triwulan (Otomatis pada mode Bulanan; Pilihan I–IV pada mode Triwulan) -->
        <div v-if="!isTriwulanMode">
          <label class="block text-xs font-black text-black mb-1.5">Triwulan (Otomatis)</label>
          <div class="w-full bg-white border-2 border-slate-300 text-black rounded-lg px-3 py-2 text-sm font-black flex items-center justify-between">
            <span>Triwulan {{ hitungTriwulan }}</span>
            <span class="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-900 border border-slate-400 font-black">TW {{ hitungTriwulan }}</span>
          </div>
        </div>
        <div v-else>
          <label class="block text-xs font-black text-black mb-1.5">Triwulan</label>
          <select
            v-model.number="filter.triwulan"
            class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-700"
          >
            <option v-for="tw in triwulanOptions" :key="tw.value" :value="tw.value">
              {{ tw.label }}
            </option>
          </select>
        </div>

        <!-- Tahun -->
        <div>
          <label class="block text-xs font-black text-black mb-1.5">Tahun Anggaran</label>
          <input
            v-model.number="filter.tahun"
            type="number"
            min="2026"
            max="2100"
            class="w-full bg-white border-2 border-slate-300 text-black rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-700 font-mono font-black"
          />
        </div>
      </div>

      <!-- Tombol Aksi Buka Form -->
      <div class="mt-5 flex justify-end">
        <button
          @click="bukaFormIsian"
          :disabled="isLoading"
          class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-sm rounded-lg shadow-xs border-2 border-slate-900 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg v-if="isLoading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Buka form isian
        </button>
      </div>
    </section>

    <!-- KARTU 2: TABEL FORM ISIAN -->
    <section v-if="isFormOpen && activeLaporan" class="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-xs space-y-4">
      
      <!-- Header Kartu & Status Workflow -->
      <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b-2 border-slate-300 gap-3">
        <div>
          <h2 class="text-base font-black text-black flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :class="isReadOnly ? 'bg-slate-800' : 'bg-slate-500 border border-slate-700'"></span>
            {{ config.tableCardTitlePrefix || '2. Isi data' }} ({{ activeLaporan.wilayah?.nama_kabupaten_kota || 'Wilayah' }} - {{ activeLaporan.jenis_periode === 'triwulan' ? `Triwulan ${activeTriwulanRomawi}` : bulanList.find(b => b.value === activeLaporan.bulan)?.label }} {{ activeLaporan.tahun }})
          </h2>
          <div class="flex flex-wrap items-center gap-3 mt-1 text-xs text-black font-bold">
            <template v-if="activeLaporan.id_laporan">
              <span>ID Dokumen: <strong class="font-mono text-black">#{{ activeLaporan.id_laporan }}</strong></span>
              <span>&bull;</span>
            </template>
            <span>Triwulan: <strong class="font-mono text-black">TW {{ activeLaporan.triwulan }}</strong></span>
            <span>&bull;</span>
            <span class="bg-slate-100 px-2 py-0.5 rounded border border-slate-400 text-[11px]">
              Tabel DB: <strong>{{ config.tabel_db || 'rekap_' + (config.modul || 'k1') }}</strong> ({{ config.triwulanConfig ? 'Agregasi SUM 3 Bulan' : 'Snapshot Akhir TW' }})
            </span>
          </div>
        </div>

        <!-- Badges & Tombol Workflow -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Status Draf (Abu-abu muda) -->
          <div
            v-if="activeLaporan.status_laporan === 'draf'"
            class="px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-900 border-2 border-slate-400 flex items-center gap-1.5"
          >
            <span class="w-2.5 h-2.5 rounded-full bg-slate-700 animate-pulse"></span>
            Status: DRAF (Dapat Diedit)
          </div>

          <!-- Status Terkirim (Putih border abu-abu) -->
          <div
            v-else-if="activeLaporan.status_laporan === 'terkirim'"
            class="px-3 py-1 rounded-full text-xs font-black bg-white text-black border-2 border-slate-500 flex items-center gap-1.5"
          >
            <span class="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-600"></span>
            Status: TERKIRIM (Menunggu Pengesahan)
          </div>

          <!-- Status Disahkan (Abu-abu gelap teks putih) -->
          <div
            v-else-if="activeLaporan.status_laporan === 'disahkan'"
            class="px-3 py-1 rounded-full text-xs font-black bg-slate-800 text-white border-2 border-slate-900 flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            DISAHKAN (Terkunci / Read-Only)
          </div>

          <!-- Tombol Kirim -->
          <button
            v-if="activeLaporan.id_laporan && activeLaporan.status_laporan === 'draf' && (isOperator || isAdmin)"
            @click="aksiKirim"
            :disabled="isWorkflowLoading"
            class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-900 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
            Kirim ke Kepala Balai
          </button>

          <!-- Tombol Sahkan -->
          <button
            v-if="activeLaporan.status_laporan === 'terkirim' && (isKepalaBalai || isAdmin)"
            @click="aksiSahkan"
            :disabled="isWorkflowLoading"
            class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Sahkan Laporan
          </button>

          <!-- Tombol Kembalikan ke Draf -->
          <button
            v-if="(activeLaporan.status_laporan === 'terkirim' || activeLaporan.status_laporan === 'disahkan') && (isKepalaBalai || isAdmin)"
            @click="aksiKembalikan"
            :disabled="isWorkflowLoading"
            class="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-950 border-2 border-red-500 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
            </svg>
            Kembalikan ke Draf
          </button>
        </div>
      </div>

      <!-- Banner jika terkunci (Read-Only) -->
      <div v-if="isReadOnly" class="p-3.5 rounded-lg bg-slate-100 border-2 border-slate-400 text-black text-xs flex items-center gap-2 font-bold">
        <svg class="w-5 h-5 shrink-0 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <span class="text-black">
          Laporan telah disahkan pada <strong>{{ activeLaporan.tanggal_pengesahan }}</strong>. Modul K1 s.d. K10 berstatus <strong>read-only</strong> dan perubahan data dikunci (HTTP 403 Forbidden).
        </span>
      </div>

      <!-- Kotak Info Mode Triwulan (K5 s.d. K10) -->
      <div
        v-if="activeLaporan.jenis_periode === 'triwulan' && config.triwulanConfig"
        class="p-3.5 rounded-lg bg-slate-100 border-2 border-slate-400 text-black text-xs flex items-start gap-2.5 font-bold"
      >
        <svg class="w-5 h-5 shrink-0 text-slate-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span v-if="config.triwulanConfig.allLocked">
          Triwulan dihitung otomatis dari laporan bulanan, jadi semua kolom tidak bisa diedit. Bulan yang dipakai: {{ triwulanBulanDipakai.length > 0 ? triwulanBulanDipakai.join(', ') : 'belum ada' }}.
        </span>
        <span v-else-if="config.triwulanConfig.infoText">
          {{ config.triwulanConfig.infoText }} Bulan yang dipakai: {{ triwulanBulanDipakai.length > 0 ? triwulanBulanDipakai.join(', ') : 'belum ada' }}.
        </span>
        <span v-else>
          Triwulan dihitung otomatis dari laporan bulanan, jadi kolom kegiatan tidak bisa diedit. Kolom Jumlah dan Keterangan tetap bisa diisi. Bulan yang dipakai: {{ triwulanBulanDipakai.length > 0 ? triwulanBulanDipakai.join(', ') : 'belum ada' }}.
        </span>
      </div>

      <!-- Kotak Peringatan Merah jika ada bulan belum tersimpan pada mode Triwulan -->
      <div
        v-if="activeLaporan.jenis_periode === 'triwulan' && config.triwulanConfig && triwulanBulanBelumTersimpan.length > 0"
        class="p-3.5 rounded-lg bg-red-100 border-2 border-red-500 text-red-950 text-xs flex items-start gap-2.5 font-bold"
      >
        <svg class="w-5 h-5 shrink-0 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>
          Laporan bulan {{ triwulanBulanBelumTersimpan.join(', ') }} belum tersimpan, jadi dihitung 0.
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
              <!-- 14 Kolom Kotak Isian Angka (kosong dihitung 0, tidak boleh negatif) -->
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
                  class="w-full text-center bg-white border-2 border-slate-300 text-black font-black rounded py-1 px-1 focus:outline-none focus:border-slate-700 disabled:bg-slate-100 disabled:text-black font-mono"
                />
              </td>
              <!-- Kolom Penghargaan K3 (Kotak Teks) -->
              <td class="p-1">
                <input
                  type="text"
                  maxlength="255"
                  :disabled="isReadOnly"
                  v-model="rowsData[row.id_klui].penghargaan_k3"
                  placeholder="Penghargaan K3..."
                  class="w-full bg-white border-2 border-slate-300 text-black font-bold rounded py-1 px-2 focus:outline-none focus:border-slate-700 text-xs disabled:bg-slate-100 disabled:text-black"
                />
              </td>
            </tr>

            <!-- BARIS JUMLAH TOTAL K2 (Dihitung otomatis untuk 14 kolom angka, Penghargaan K3 '-') -->
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
              <td class="p-2.5 text-center text-white font-black bg-slate-800">
                -
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
                  :disabled="isReadOnly || isAutoField(f.key)"
                  :value="rowsData[getRowId(row)]?.[f.key]"
                  @input="onNumberInput(getRowId(row), f.key, $event)"
                  :class="[
                    'w-full text-center border-2 font-black rounded py-1 px-1 focus:outline-none font-mono',
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

      <!-- BLOK TANDA TANGAN DINAMIS DARI wilayah_pengawasan (ATURAN BISNIS #5 PRD) -->
      <div v-if="activeWilayahInfo" class="pt-4 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-black font-bold">
        <div class="text-center p-3 bg-slate-50 border-2 border-slate-200 rounded-lg">
          <p class="font-normal">Mengetahui,</p>
          <p class="font-black text-sm">KEPALA BALAI PENGAWASAN</p>
          <div class="h-14"></div>
          <p class="font-black underline text-sm">{{ activeWilayahInfo.nama_kepala_balai || "JUM'AH, S.Kep., M.Kep" }}</p>
          <p class="text-[11px] font-mono">NIP. {{ activeWilayahInfo.nip_kepala_balai || '19740315 199803 2 007' }}</p>
        </div>

        <div class="text-center p-3 bg-slate-50 border-2 border-slate-200 rounded-lg">
          <p class="font-normal">{{ activeWilayahInfo.teks_header_kabupaten }}, 2026</p>
          <p class="font-black text-sm">PEMBUAT LAPORAN</p>
          <div class="h-14"></div>
          <p class="font-black underline text-sm">
            {{ activeWilayahInfo.nama_pembuat_laporan || currentUser?.nama_pengguna || 'PETUGAS PENGAWAS' }}
          </p>
          <p class="text-[11px] font-mono">
            NIP. {{ activeWilayahInfo.nip_pembuat_laporan || currentUser?.nip_pegawai || '-' }}
          </p>
        </div>
      </div>

      <!-- EMPAT TOMBOL AKSI -->
      <div class="pt-4 flex flex-wrap items-center justify-end gap-3">
        <!-- Tombol Tutup -->
        <button
          @click="tutupForm"
          class="px-4 py-2 bg-white hover:bg-slate-100 text-black font-black text-xs sm:text-sm rounded-lg border-2 border-slate-400 transition cursor-pointer"
        >
          Tutup
        </button>

        <!-- Tombol Reset ke Nol -->
        <button
          @click="resetKeNol"
          :disabled="isReadOnly"
          class="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-950 font-black text-xs sm:text-sm rounded-lg border-2 border-red-600 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reset ke nol
        </button>

        <!-- Tombol Download Excel -->
        <button
          @click="downloadExcel"
          class="px-4 py-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer border-2 border-slate-800"
        >
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Download Excel
        </button>

        <!-- Tombol Simpan -->
        <button
          @click="simpan"
          :disabled="isLoading || isReadOnly"
          class="px-5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs border-2 border-slate-900 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg v-if="isLoading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          {{ isReadOnly ? 'Data Terkunci' : 'Simpan' }}
        </button>
      </div>
    </section>

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
