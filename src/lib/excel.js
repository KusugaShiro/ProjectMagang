/**
 * Pembuat Berkas Excel untuk Laporan K1 & Rekapitulasi Balai
 * Mendukung download stream backend dan fallback SheetJS lokal di browser.
 */

import { apiUnduhExcelResmi } from './api'

export async function exportK1ToExcel({ config, meta, rowsData, summaryTotals }) {
  const { id_wilayah, wilayahName, bulan, triwulan, tahun, kode } = meta

  // 1. Coba download dari backend jika tersedia
  try {
    const successBackend = await apiUnduhExcelResmi(id_wilayah, tahun, triwulan)
    if (successBackend) {
      return
    }
  } catch (e) {
    console.warn('Backend download tidak tersedia, membuat Excel via SheetJS lokal...')
  }

  // 2. Fallback: Buat Excel K1 via SheetJS
  const XLSX = await import('xlsx')

  const wsData = [
    // Judul & Metadata Resmi
    ['DATA PEGAWAI PENGAWAS KETENAGAKERJAAN'],
    [`Bulan : ${bulan}`],
    [`Triwulan : TW ${triwulan}`],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayahName}`],
    [`Kode : ${kode || 'K1'}`],
    [], // Baris kosong
    // Header Kolom
    [
      'No',
      'Jabatan',
      'Umum',
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
      'Jumlah',
      'PPNS',
      'Ket.'
    ]
  ]

  // Baris Data
  config.rows.forEach((rowDef) => {
    if (rowDef.isGroup) {
      wsData.push([
        rowDef.no || '',
        rowDef.label || '',
        '-',
        '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-',
        '-',
        '-',
        ''
      ])
    } else {
      const rowVal = rowsData[rowDef.id_jabatan] || {}
      const rowItem = [
        rowDef.no || '',
        rowDef.label || '',
        rowVal.jml_umum ?? 0,
        ...config.spesialisFields.map(sf => rowVal[sf.key] ?? 0),
        summaryTotals.rowTotals[rowDef.id_jabatan] ?? 0,
        rowVal.jml_ppns ?? 0,
        rowVal.keterangan || ''
      ]
      wsData.push(rowItem)
    }
  })

  // Baris JUMLAH Total
  const colTotals = summaryTotals.colTotals || {}
  const totalRow = [
    '',
    'JUMLAH',
    colTotals.jml_umum ?? 0,
    ...config.spesialisFields.map(sf => colTotals[sf.key] ?? 0),
    summaryTotals.grandTotal ?? 0,
    colTotals.jml_ppns ?? 0,
    ''
  ]
  wsData.push(totalRow)

  // Baris kosong
  wsData.push([])

  // Keterangan Kolom Spesialis
  wsData.push(['Keterangan Kolom Spesialis :'])
  if (config.specialistDescriptions && config.specialistDescriptions.length > 0) {
    config.specialistDescriptions.forEach((desc) => {
      wsData.push([`${desc.id} = ${desc.text}`])
    })
  }

  // Buat Sheet & Workbook
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 28 }, // Jabatan
    { wch: 10 }, // Umum
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, // 1-11
    { wch: 10 }, // Jumlah
    { wch: 8 },  // PPNS
    { wch: 24 }  // Ket
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K1')

  const fileName = `K1_${wilayahName}_Bulan${bulan}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}
