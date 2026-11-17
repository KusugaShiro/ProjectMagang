/**
 * Pembuat Berkas Excel untuk Laporan K1, K2 & Rekapitulasi Balai
 * Selaras dengan PRD Database:
 * - Mengutamakan stream resmi endpoint backend /api/ekspor/excel
 * - Fallback SheetJS lokal menyertakan footer tanda tangan wilayah_pengawasan (Aturan Bisnis #5 PRD)
 */

import { apiUnduhExcelResmi } from './api'

export async function exportK1ToExcel({ config, meta, rowsData, summaryTotals }) {
  const { id_wilayah, wilayahName, bulan, triwulan, tahun, kode, wilayahObj } = meta

  // 1. Coba download dari backend resmi jika tersedia
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

  // Baris kosong sebelum tanda tangan
  wsData.push([])
  wsData.push([])

  // Footer Tanda Tangan dari wilayah_pengawasan (Aturan Bisnis #5 PRD)
  const namaBalai = wilayahObj?.teks_header_kabupaten || wilayahName
  const namaKepala = wilayahObj?.nama_kepala_balai || "JUM'AH, S.Kep., M.Kep"
  const nipKepala = wilayahObj?.nip_kepala_balai ? `NIP. ${wilayahObj.nip_kepala_balai}` : 'NIP. 19740315 199803 2 007'
  const namaPembuat = wilayahObj?.nama_pembuat_laporan || 'PETUGAS PENGAWAS'
  const nipPembuat = wilayahObj?.nip_pembuat_laporan ? `NIP. ${wilayahObj.nip_pembuat_laporan}` : '-'

  wsData.push(['', 'Mengetahui,', '', '', '', '', '', '', '', '', '', '', '', '', `${namaBalai}, 2026`])
  wsData.push(['', 'KEPALA BALAI PENGAWASAN,', '', '', '', '', '', '', '', '', '', '', '', '', 'PEMBUAT LAPORAN,'])
  wsData.push([])
  wsData.push([])
  wsData.push([])
  wsData.push(['', namaKepala, '', '', '', '', '', '', '', '', '', '', '', '', namaPembuat])
  wsData.push(['', nipKepala, '', '', '', '', '', '', '', '', '', '', '', '', nipPembuat])

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

  const fileName = `K1_${wilayahName}_${bulan}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export async function exportK2ToExcel({ config, meta, rowsData, summaryTotals }) {
  const { id_wilayah, wilayahName, bulan, triwulan, tahun, kode, wilayahObj } = meta

  // 1. Coba download dari backend resmi jika tersedia
  try {
    const successBackend = await apiUnduhExcelResmi(id_wilayah, tahun, triwulan)
    if (successBackend) {
      return
    }
  } catch (e) {
    console.warn('Backend download tidak tersedia, membuat Excel via SheetJS lokal...')
  }

  // 2. Fallback: Buat Excel K2 via SheetJS
  const XLSX = await import('xlsx')

  const wsData = [
    ['DATA OBYEK PENGAWASAN'],
    [`Bulan : ${bulan}`],
    [`Triwulan : TW ${triwulan}`],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayahName}`],
    [`Kode : ${kode || 'K2'}`],
    [], // Baris kosong
    // Header Tingkat 1
    [
      'No',
      'Sektor/KLUI',
      'Jml Perusahaan',
      'Jml TK', '',
      'Kategori Prsh', '', '',
      'Status Perusahaan', '', '', '',
      'Perangkat Hub. Industrial', '', '', '',
      'Penghargaan K3'
    ],
    // Header Tingkat 2
    [
      '',
      '',
      '',
      'WNI', 'WNA',
      'Kecil', 'Sedang', 'Besar',
      'Swasta', 'PMDN', 'PMA', 'Joint Venture',
      'PP', 'PKB', 'SP', 'Lemb. Bipartit',
      ''
    ]
  ]

  // 10 baris data
  config.rows.forEach((rowDef) => {
    const rowVal = rowsData[rowDef.id_klui] || {}
    const rowItem = [
      rowDef.no,
      rowDef.sektor_klui,
      ...config.numericFields.map(f => rowVal[f.key] ?? 0),
      rowVal.penghargaan_k3 || ''
    ]
    wsData.push(rowItem)
  })

  // Baris JUMLAH Total (14 kolom angka dijumlah, kolom Penghargaan K3 berisi "-")
  const colTotals = summaryTotals.colTotals || {}
  const totalRow = [
    '',
    'JUMLAH',
    ...config.numericFields.map(f => colTotals[f.key] ?? 0),
    '-'
  ]
  wsData.push(totalRow)

  // Baris kosong
  wsData.push([])

  // Daftar Keterangan Kolom (1 = ... s.d. 17 = ...)
  wsData.push(['Keterangan Kolom :'])
  if (config.columnDescriptions && config.columnDescriptions.length > 0) {
    config.columnDescriptions.forEach(desc => {
      wsData.push([`${desc.id} = ${desc.text}`])
    })
  }

  // Baris kosong sebelum tanda tangan
  wsData.push([])
  wsData.push([])

  // Footer Tanda Tangan dari wilayah_pengawasan (Aturan Bisnis #5 PRD)
  const namaBalai = wilayahObj?.teks_header_kabupaten || wilayahName
  const namaKepala = wilayahObj?.nama_kepala_balai || "JUM'AH, S.Kep., M.Kep"
  const nipKepala = wilayahObj?.nip_kepala_balai ? `NIP. ${wilayahObj.nip_kepala_balai}` : 'NIP. 19740315 199803 2 007'
  const namaPembuat = wilayahObj?.nama_pembuat_laporan || 'PETUGAS PENGAWAS'
  const nipPembuat = wilayahObj?.nip_pembuat_laporan ? `NIP. ${wilayahObj.nip_pembuat_laporan}` : '-'

  wsData.push(['', 'Mengetahui,', '', '', '', '', '', '', '', '', '', '', '', `${namaBalai}, 2026`])
  wsData.push(['', 'KEPALA BALAI PENGAWASAN,', '', '', '', '', '', '', '', '', '', '', '', 'PEMBUAT LAPORAN,'])
  wsData.push([])
  wsData.push([])
  wsData.push([])
  wsData.push(['', namaKepala, '', '', '', '', '', '', '', '', '', '', '', namaPembuat])
  wsData.push(['', nipKepala, '', '', '', '', '', '', '', '', '', '', '', nipPembuat])

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Merges untuk header dua tingkat
  ws['!merges'] = [
    { s: { r: 7, c: 0 }, e: { r: 8, c: 0 } }, // No
    { s: { r: 7, c: 1 }, e: { r: 8, c: 1 } }, // Sektor/KLUI
    { s: { r: 7, c: 2 }, e: { r: 8, c: 2 } }, // Jml Perusahaan
    { s: { r: 7, c: 3 }, e: { r: 7, c: 4 } }, // Jml TK
    { s: { r: 7, c: 5 }, e: { r: 7, c: 7 } }, // Kategori Prsh
    { s: { r: 7, c: 8 }, e: { r: 7, c: 11 } }, // Status Perusahaan
    { s: { r: 7, c: 12 }, e: { r: 7, c: 15 } }, // Perangkat Hub. Industrial
    { s: { r: 7, c: 16 }, e: { r: 8, c: 16 } }, // Penghargaan K3
  ]

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Sektor/KLUI
    { wch: 14 }, // Jml Perusahaan
    { wch: 10 }, { wch: 10 }, // Jml TK WNI, WNA
    { wch: 10 }, { wch: 10 }, { wch: 10 }, // Kategori Kecil, Sedang, Besar
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, // Status Swasta, PMDN, PMA, Joint Venture
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, // Perangkat PP, PKB, SP, Lemb. Bipartit
    { wch: 28 }, // Penghargaan K3
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K2')

  const fileName = `K2_${wilayahName}_${bulan}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}
