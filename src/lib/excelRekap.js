/**
 * Ekspor Excel Multi-Sheet Gabungan (K1 s.d. K10 dalam 1 Berkas .xlsx)
 * Mendukung:
 * - Mode Bulanan: 1 file berisi semua sheet K1–K10 untuk bulan tertentu (mis. Januari 2026)
 * - Mode Tahunan: 1 file berisi semua sheet K1–K10 untuk 1 tahun penuh
 *   (K1–K4: snapshot bulan terakhir tersimpan; K5–K10: akumulasi total Jan–Des)
 */

import { formConfigs } from '../forms'
import { apiGetDaftarLaporan, apiGetMatriksModul, ambilTandaTangan } from './api'
import {
  exportK1ToExcel,
  exportK2ToExcel,
  exportK3ToExcel,
  exportK4ToExcel,
  exportK5ToExcel,
  exportK6ToExcel,
  exportK7ToExcel,
  exportK8aToExcel,
  exportK8bToExcel,
  exportK8cToExcel,
  exportK9aToExcel,
  exportK9bToExcel,
  exportK10ToExcel,
} from './excel'

const BULAN_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const SNAPSHOT_MODULES = new Set(['K1', 'K2', 'K3', 'K4'])

export const MODULE_EXPORT_ORDER = [
  { key: 'K1', exporter: exportK1ToExcel },
  { key: 'K2', exporter: exportK2ToExcel },
  { key: 'K3', exporter: exportK3ToExcel },
  { key: 'K4', exporter: exportK4ToExcel },
  { key: 'K5', exporter: exportK5ToExcel },
  { key: 'K6', exporter: exportK6ToExcel },
  { key: 'K7', exporter: exportK7ToExcel },
  { key: 'K8A', exporter: exportK8aToExcel },
  { key: 'K8B', exporter: exportK8bToExcel },
  { key: 'K8C', exporter: exportK8cToExcel },
  { key: 'K9A', exporter: exportK9aToExcel },
  { key: 'K9B', exporter: exportK9bToExcel },
  { key: 'K10', exporter: exportK10ToExcel },
]

function getRowKeyField(config) {
  return config.keyField || 'id_klui'
}

function getRowId(config, row) {
  const kf = getRowKeyField(config)
  return row[kf] ?? row.id_klui ?? row.key ?? row.id_jabatan
}

function findConfigRow(config, apiItem) {
  const kf = getRowKeyField(config)
  return config.rows.find(r => {
    if (config.apiRowKey && apiItem[config.apiRowKey] !== undefined && r[config.apiRowKey] !== undefined) {
      return Number(r[config.apiRowKey]) === Number(apiItem[config.apiRowKey])
    }
    if (apiItem[kf] !== undefined && r[kf] !== undefined) {
      return String(r[kf]) === String(apiItem[kf])
    }
    if (apiItem.id_klui !== undefined && r.id_klui !== undefined) {
      return Number(r.id_klui) === Number(apiItem.id_klui)
    }
    if (apiItem.id_jabatan !== undefined && r.id_jabatan !== undefined) {
      return Number(r.id_jabatan) === Number(apiItem.id_jabatan)
    }
    return false
  })
}

function initEmptyRows(config) {
  const rowsData = {}

  if (config.kode === 'K1') {
    config.rows.forEach(row => {
      if (!row.isGroup && row.id_jabatan) {
        const rowItem = {
          id_jabatan: row.id_jabatan,
          jml_umum: 0,
          jml_ppns: 0,
          keterangan: '',
        }
        config.spesialisFields?.forEach(sf => {
          rowItem[sf.key] = 0
        })
        rowsData[row.id_jabatan] = rowItem
      }
    })
    return rowsData
  }

  const kf = getRowKeyField(config)
  config.rows.forEach(row => {
    const rKey = getRowId(config, row)
    const rowItem = { [kf]: rKey }
    if (config.apiRowKey && row[config.apiRowKey] !== undefined) {
      rowItem[config.apiRowKey] = row[config.apiRowKey]
    }
    if (config.kode === 'K2') {
      rowItem.penghargaan_k3 = ''
    } else if (config.textField) {
      rowItem[config.textField.key] = ''
    } else if (config.kode === 'K3') {
      rowItem.keterangan = ''
    }
    if (config.staticCell) {
      rowItem[config.staticCell.key || 'keterangan'] = config.staticCell.text
    }
    config.numericFields?.forEach(sf => {
      rowItem[sf.key] = 0
    })
    rowsData[rKey] = rowItem
  })

  return rowsData
}

function applySingleMonthData(config, rowsData, apiData) {
  if (!Array.isArray(apiData) || apiData.length === 0) return

  if (config.kode === 'K1') {
    apiData.forEach(item => {
      const key = item.id_jabatan
      if (key && rowsData[key]) {
        rowsData[key] = { ...rowsData[key], ...item }
      }
    })
    return
  }

  apiData.forEach(item => {
    const matchedRow = findConfigRow(config, item)
    const rKey = matchedRow ? getRowId(config, matchedRow) : (item.id_klui ?? item.id_jabatan)
    if (!rKey || !rowsData[rKey]) return

    const sourceItem = config.fromApiRow ? config.fromApiRow(item) : item
    const mapped = { ...rowsData[rKey] }

    config.numericFields?.forEach(sf => {
      const rawVal = sourceItem[sf.key] ?? (sf.apiKey ? sourceItem[sf.apiKey] : undefined)
      if (rawVal !== undefined && rawVal !== null) {
        mapped[sf.key] = Number(rawVal) || 0
      }
    })

    if (config.kode === 'K2') {
      mapped.penghargaan_k3 = sourceItem.penghargaan_k3 ?? ''
    } else if (config.textField) {
      const tk = config.textField.key
      const rawText = sourceItem[tk] ?? (config.textField.apiKey ? sourceItem[config.textField.apiKey] : undefined)
      mapped[tk] = rawText ?? ''
    } else if (config.kode === 'K3') {
      mapped.keterangan = sourceItem.keterangan ?? ''
    } else if (config.staticCell) {
      mapped[config.staticCell.key || 'keterangan'] = config.staticCell.text
    }

    rowsData[rKey] = mapped
  })
}

function accumulateMonthData(config, rowsData, apiData) {
  if (!Array.isArray(apiData) || apiData.length === 0) return
  const twCfg = config.triwulanConfig || {}
  const lastNonZeroFields = twCfg.lastNonZeroFields || []

  apiData.forEach(item => {
    const matchedRow = findConfigRow(config, item)
    if (!matchedRow) return
    const rKey = getRowId(config, matchedRow)
    if (!rowsData[rKey]) return

    const sourceItem = config.fromApiRow ? config.fromApiRow(item) : item

    config.numericFields?.forEach(sf => {
      const rawVal = sourceItem[sf.key] ?? (sf.apiKey ? sourceItem[sf.apiKey] : undefined)
      const numVal = Number(rawVal) || 0

      if (lastNonZeroFields.includes(sf.key)) {
        if (numVal !== 0) {
          rowsData[rKey][sf.key] = numVal
        }
      } else {
        rowsData[rKey][sf.key] = (Number(rowsData[rKey][sf.key]) || 0) + numVal
      }
    })

    if (config.textField) {
      const tk = config.textField.key
      const rawText = sourceItem[tk] ?? (config.textField.apiKey ? sourceItem[config.textField.apiKey] : undefined)
      if (rawText && String(rawText).trim()) {
        rowsData[rKey][tk] = String(rawText).trim()
      }
    }
  })
}

function computeSummaryTotals(config, rowsData) {
  if (config.kode === 'K1') {
    const rowTotals = {}
    const colTotals = { jml_umum: 0, jml_ppns: 0 }
    config.spesialisFields?.forEach(sf => {
      colTotals[sf.key] = 0
    })
    let grandTotal = 0

    config.rows.forEach(row => {
      if (!row.isGroup && row.id_jabatan) {
        const rowVal = rowsData[row.id_jabatan] || {}
        const rTotal = config.hitungJumlahBaris ? config.hitungJumlahBaris(rowVal) : 0
        rowTotals[row.id_jabatan] = rTotal
        grandTotal += rTotal
        colTotals.jml_umum += Number(rowVal.jml_umum) || 0
        colTotals.jml_ppns += Number(rowVal.jml_ppns) || 0
        config.spesialisFields?.forEach(sf => {
          colTotals[sf.key] += Number(rowVal[sf.key]) || 0
        })
      }
    })
    return { rowTotals, colTotals, grandTotal }
  }

  const colTotals = {}
  config.numericFields?.forEach(sf => {
    colTotals[sf.key] = 0
  })
  config.rows.forEach(row => {
    const rKey = getRowId(config, row)
    const rowVal = rowsData[rKey] || {}
    config.numericFields?.forEach(sf => {
      colTotals[sf.key] += Number(rowVal[sf.key]) || 0
    })
  })
  return { colTotals }
}

function buildK10SignatureData({ config, id_wilayah, tahun, jenisPeriode, bulan, latestBulan }) {
  const defaults = config.signatureConfig?.defaults || {}
  const kota = defaults.tempatKota || 'Banjarmasin'

  const targetBulan = jenisPeriode === 'bulanan' ? Number(bulan) : (latestBulan ? Number(latestBulan) : 12)
  const lastDay = new Date(Number(tahun), targetBulan, 0).getDate()
  const namaBulan = BULAN_NAMES[targetBulan] || 'Desember'
  const defaultTempatTanggal = jenisPeriode === 'tahunan'
    ? `${kota}, 31 Desember ${tahun}`
    : `${kota}, ${lastDay} ${namaBulan} ${tahun}`

  const saved = ambilTandaTangan('k10', {
    id_wilayah,
    tahun,
    jenis_periode: 'bulanan',
    bulan: targetBulan,
  })

  if (saved) {
    return {
      tempatTanggal: saved.tempatTanggal ?? defaultTempatTanggal,
      kepalaNama: saved.kepalaNama ?? (defaults.kepalaNama || ''),
      kepalaNip: saved.kepalaNip ?? (defaults.kepalaNip || ''),
      pembuatNama: saved.pembuatNama ?? (defaults.pembuatNama || ''),
      pembuatNip: saved.pembuatNip ?? (defaults.pembuatNip || ''),
    }
  }

  return {
    tempatTanggal: defaultTempatTanggal,
    kepalaNama: defaults.kepalaNama || '',
    kepalaNip: defaults.kepalaNip || '',
    pembuatNama: defaults.pembuatNama || '',
    pembuatNip: defaults.pembuatNip || '',
  }
}

/**
 * Ekspor 1 file Excel berisi seluruh sheet K1 s.d. K10.
 *
 * @param {Object} params
 * @param {number} params.id_wilayah
 * @param {Object} [params.wilayahObj]
 * @param {number} params.tahun
 * @param {'bulanan'|'tahunan'} [params.jenisPeriode='tahunan']
 * @param {number|null} [params.bulan=null] - Wajib jika jenisPeriode === 'bulanan'
 * @param {Object|null} [params.laporanDoc=null] - Opsional: dokumen laporan bulanan langsung dari baris tabel
 * @param {boolean} [params.writeFile=true] - Set false untuk pengujian programmatic
 */
export async function exportRekapK1K10ToExcel({
  id_wilayah,
  wilayahObj = null,
  tahun,
  jenisPeriode = 'tahunan',
  bulan = null,
  laporanDoc = null,
  writeFile = true,
}) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  let docs = []
  if (jenisPeriode === 'bulanan') {
    if (laporanDoc) {
      docs = [laporanDoc]
    } else {
      const list = await apiGetDaftarLaporan({
        id_wilayah: Number(id_wilayah),
        tahun: Number(tahun),
        bulan: Number(bulan),
      })
      docs = list.filter(
        l => l.id_wilayah === Number(id_wilayah) && l.tahun === Number(tahun) && l.bulan === Number(bulan)
      )
    }
  } else {
    const list = await apiGetDaftarLaporan({
      id_wilayah: Number(id_wilayah),
      tahun: Number(tahun),
    })
    docs = list
      .filter(l => l.id_wilayah === Number(id_wilayah) && l.tahun === Number(tahun))
      .sort((a, b) => Number(a.bulan) - Number(b.bulan))
  }

  const resolvedWilayahObj = wilayahObj || docs[0]?.wilayah || null
  const wilayahName = resolvedWilayahObj?.nama_kabupaten_kota || (Number(id_wilayah) === 2 ? 'Kabupaten Barito Kuala' : 'Kota Banjarmasin')
  const namaBulan = bulan ? (BULAN_NAMES[Number(bulan)] || `Bulan ${bulan}`) : 'Tahunan'
  const triwulan = bulan ? Math.floor((Number(bulan) + 2) / 3) : 'I - IV'
  const latestBulan = docs.length > 0 ? docs[docs.length - 1].bulan : null

  for (const { key, exporter } of MODULE_EXPORT_ORDER) {
    const cfg = formConfigs[key]
    if (!cfg) continue

    const rowsData = initEmptyRows(cfg)

    if (jenisPeriode === 'bulanan') {
      const doc = docs[0]
      if (doc) {
        try {
          const resModul = await apiGetMatriksModul(doc.id_laporan, cfg.modul)
          applySingleMonthData(cfg, rowsData, resModul?.data || [])
        } catch (err) {
          console.warn(`Gagal memuat data modul ${cfg.kode} untuk laporan #${doc.id_laporan}:`, err)
        }
      }
    } else {
      const isSnapshot = SNAPSHOT_MODULES.has(key)
      for (const doc of docs) {
        try {
          const resModul = await apiGetMatriksModul(doc.id_laporan, cfg.modul)
          const apiRows = resModul?.data || []
          if (apiRows.length === 0) continue

          if (isSnapshot) {
            // Snapshot: posisi bulan terakhir yang memiliki data tersimpan
            applySingleMonthData(cfg, rowsData, apiRows)
          } else {
            // Akumulasi: jumlahkan seluruh bulan tersimpan pada tahun tersebut
            accumulateMonthData(cfg, rowsData, apiRows)
          }
        } catch (err) {
          console.warn(`Gagal memuat data modul ${cfg.kode} untuk bulan ${doc.bulan}:`, err)
        }
      }
    }

    const summaryTotals = computeSummaryTotals(cfg, rowsData)
    const meta = {
      id_wilayah: Number(id_wilayah),
      wilayahName,
      jenisPeriode,
      bulan: namaBulan,
      triwulan,
      triwulanRomawi: 'I - IV',
      tahun: Number(tahun),
      kode: cfg.kode,
      wilayahObj: resolvedWilayahObj,
    }

    const extra = cfg.kode === 'K10'
      ? {
          signatureData: buildK10SignatureData({
            config: cfg,
            id_wilayah: Number(id_wilayah),
            tahun: Number(tahun),
            jenisPeriode,
            bulan,
            latestBulan,
          }),
        }
      : {}

    await exporter({
      config: cfg,
      meta,
      rowsData,
      summaryTotals,
      ...extra,
      targetWorkbook: wb,
    })
  }

  const fileName = jenisPeriode === 'tahunan'
    ? `Rekap_K1-K10_${wilayahName}_Tahun_${tahun}.xlsx`
    : `Rekap_K1-K10_${wilayahName}_${namaBulan}_${tahun}.xlsx`

  if (writeFile) {
    XLSX.writeFile(wb, fileName)
  }

  return {
    workbook: wb,
    fileName,
    sheetNames: [...wb.SheetNames],
    bulanTerpakai: docs.map(d => BULAN_NAMES[Number(d.bulan)] || `Bulan ${d.bulan}`),
  }
}
