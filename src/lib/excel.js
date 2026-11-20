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

export async function exportK3ToExcel({ config, meta, rowsData, summaryTotals }) {
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

  // 2. Fallback: Buat Excel K3 via SheetJS
  const XLSX = await import('xlsx')

  const wsData = [
    ['OBYEK PENGAWASAN K3'],
    [`Bulan : ${bulan}`],
    [`Triwulan : TW ${triwulan}`],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayahName}`],
    [`Kode : ${kode || 'K3'}`],
    [], // Baris kosong
    // Header SATU tingkat (bukan dua tingkat)
    [
      'No',
      'Sektor/KLUI',
      'Pesawat Uap',
      'BT',
      'PAA',
      'PTP',
      'KLISTRKAN',
      'Pencegahan Kebakaran',
      'Kesehatan Kerja',
      'Konst. Bangunan',
      'Lingk. Kerja',
      'Sarana K3',
      'Operator/Teknisi/Petugas',
      'Pers. Jasa K3',
      'Ket.'
    ]
  ]

  // 10 baris data
  config.rows.forEach((rowDef) => {
    const rowVal = rowsData[rowDef.id_klui] || {}
    const rowItem = [
      rowDef.no,
      rowDef.sektor_klui,
      ...config.numericFields.map(f => rowVal[f.key] ?? 0),
      rowVal.keterangan || ''
    ]
    wsData.push(rowItem)
  })

  // Baris JUMLAH Total (12 kolom angka dijumlah, kolom Ket berisi "-")
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

  // Daftar Keterangan Kolom (Pesawat Uap = Pesawat Uap sampai Ket = Keterangan)
  wsData.push(['Keterangan Kolom :'])
  if (config.columnDescriptions && config.columnDescriptions.length > 0) {
    config.columnDescriptions.forEach(desc => {
      wsData.push([`${desc.label || desc.id} = ${desc.text}`])
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

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Sektor/KLUI
    { wch: 14 }, // Pesawat Uap
    { wch: 10 }, // BT
    { wch: 10 }, // PAA
    { wch: 10 }, // PTP
    { wch: 14 }, // KLISTRKAN
    { wch: 22 }, // Pencegahan Kebakaran
    { wch: 16 }, // Kesehatan Kerja
    { wch: 16 }, // Konst. Bangunan
    { wch: 14 }, // Lingk. Kerja
    { wch: 12 }, // Sarana K3
    { wch: 24 }, // Operator/Teknisi/Petugas
    { wch: 16 }, // Pers. Jasa K3
    { wch: 24 }, // Ket.
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K3')

  const fileName = `K3_${wilayahName}_${bulan}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export async function exportK4ToExcel({ config, meta, rowsData, summaryTotals }) {
  const { wilayahName, bulan, triwulan, tahun, kode, wilayahObj } = meta

  const XLSX = await import('xlsx')

  const wsData = [
    ['DATA JAMSOSTEK - BPJS'],
    [`Bulan : ${bulan}`],
    [`Triwulan : TW ${triwulan}`],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayahName}`],
    [`Kode : ${kode || 'K4'}`],
    [], // Baris kosong
    // Baris 1 Header (nama grup di kolom pertama grupnya, kolom berikutnya dikosongkan)
    [
      'No',
      'Sektor/KLUI',
      'Jml Perusahaan', '',
      'Jumlah TK Wajib', '',
      'Jumlah TK Terdaftar', '',
      'Program Terdaftar', '', '', '', '',
      'BPJS Kesehatan', '', '',
      'Ket',
    ],
    // Baris 2 Header (nama kolom)
    [
      '',
      '',
      'Wajib', 'Terdaftar',
      'WNI', 'WNA',
      'WNI', 'WNA',
      'JKK', 'JKM', 'JHT', 'JPK Lajang', 'JPK Kel',
      'Jumlah', 'Lajang', 'Kel',
      '',
    ],
  ]

  // 10 baris data
  config.rows.forEach((rowDef) => {
    const rowVal = rowsData[rowDef.id_klui] || {}
    const rowItem = [
      rowDef.no,
      rowDef.sektor_klui,
      ...config.numericFields.map(f => rowVal[f.key] ?? 0),
      rowVal.keterangan || '',
    ]
    wsData.push(rowItem)
  })

  // Baris JUMLAH Total (14 kolom angka dijumlah, kolom Ket berisi "-")
  const colTotals = summaryTotals.colTotals || {}
  const totalRow = [
    '',
    'JUMLAH',
    ...config.numericFields.map(f => colTotals[f.key] ?? 0),
    '-',
  ]
  wsData.push(totalRow)

  // Baris kosong
  wsData.push([])

  // Daftar keterangan dengan format: 1 | JKK | = Jaminan Kecelakaan Kerja, dst. sampai 6
  if (config.columnDescriptions && config.columnDescriptions.length > 0) {
    config.columnDescriptions.forEach((desc, idx) => {
      wsData.push([idx + 1, desc.label, `= ${desc.text}`])
    })
  }

  // Baris kosong sebelum tanda tangan
  wsData.push([])
  wsData.push([])

  // Footer Tanda Tangan dari wilayah_pengawasan
  const namaBalai = wilayahObj?.teks_header_kabupaten || wilayahName
  const namaKepala = wilayahObj?.nama_kepala_balai || "JUM'AH, S.Kep., M.Kep"
  const nipKepala = wilayahObj?.nip_kepala_balai ? `NIP. ${wilayahObj.nip_kepala_balai}` : 'NIP. 19740315 199803 2 007'
  const namaPembuat = wilayahObj?.nama_pembuat_laporan || 'PETUGAS PENGAWAS'
  const nipPembuat = wilayahObj?.nip_pembuat_laporan ? `NIP. ${wilayahObj.nip_pembuat_laporan}` : '-'

  wsData.push(['', 'Mengetahui,', '', '', '', '', '', '', '', '', '', '', '', `${namaBalai}, ${tahun}`])
  wsData.push(['', 'KEPALA BALAI PENGAWASAN,', '', '', '', '', '', '', '', '', '', '', '', 'PEMBUAT LAPORAN,'])
  wsData.push([])
  wsData.push([])
  wsData.push([])
  wsData.push(['', namaKepala, '', '', '', '', '', '', '', '', '', '', '', namaPembuat])
  wsData.push(['', nipKepala, '', '', '', '', '', '', '', '', '', '', '', nipPembuat])

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Merges untuk 2 baris header
  ws['!merges'] = [
    { s: { r: 7, c: 0 }, e: { r: 8, c: 0 } },   // No
    { s: { r: 7, c: 1 }, e: { r: 8, c: 1 } },   // Sektor/KLUI
    { s: { r: 7, c: 2 }, e: { r: 7, c: 3 } },   // Jml Perusahaan
    { s: { r: 7, c: 4 }, e: { r: 7, c: 5 } },   // Jumlah TK Wajib
    { s: { r: 7, c: 6 }, e: { r: 7, c: 7 } },   // Jumlah TK Terdaftar
    { s: { r: 7, c: 8 }, e: { r: 7, c: 12 } },  // Program Terdaftar
    { s: { r: 7, c: 13 }, e: { r: 7, c: 15 } }, // BPJS Kesehatan
    { s: { r: 7, c: 16 }, e: { r: 8, c: 16 } }, // Ket
  ]

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Sektor/KLUI
    { wch: 10 }, { wch: 11 }, // Jml Perusahaan: Wajib, Terdaftar
    { wch: 10 }, { wch: 10 }, // Jumlah TK Wajib: WNI, WNA
    { wch: 10 }, { wch: 10 }, // Jumlah TK Terdaftar: WNI, WNA
    { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 12 }, { wch: 10 }, // Program Terdaftar
    { wch: 10 }, { wch: 10 }, { wch: 10 }, // BPJS Kesehatan
    { wch: 24 }, // Ket
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K4')

  const fileName = `K4_${wilayahName}_${bulan}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export async function exportK5ToExcel({ config, meta, rowsData, summaryTotals }) {
  const { wilayahName, jenisPeriode, bulan, triwulanRomawi, tahun, kode, wilayahObj } = meta

  const XLSX = await import('xlsx')

  const isTriwulan = jenisPeriode === 'triwulan'
  const periodeLine = isTriwulan ? `Triwulan : ${triwulanRomawi}` : `Bulan : ${bulan}`
  const periodeFile = isTriwulan ? `Triwulan_${triwulanRomawi}` : bulan

  const wsData = [
    ['KEGIATAN PEMERIKSAAN KETENAGAKERJAAN'],
    [periodeLine],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayahName}`],
    [`Kode : ${kode || 'K5'}`],
    [], // Baris kosong
    // Baris 1 Header
    [
      'No',
      'Jabatan Pengawas Ketenagakerjaan',
      'Data Pengawas',
      'Kegiatan Pemeriksaan', '', '', '',
      'Kegiatan Pembinaan', '',
      'Keterangan',
    ],
    // Baris 2 Header
    [
      '',
      '',
      'Jumlah',
      'Pertama', 'Berkala', 'Ulang', 'Khusus',
      'NP. I', 'NP. II',
      '',
    ],
  ]

  // 2 baris data jabatan (Pertama, Muda)
  config.rows.forEach((rowDef) => {
    const rowVal = rowsData[rowDef.key] || {}
    const rowItem = [
      rowDef.no,
      rowDef.label,
      ...config.numericFields.map(f => rowVal[f.key] ?? 0),
      rowVal.keterangan || '',
    ]
    wsData.push(rowItem)
  })

  // Baris JUMLAH Total (7 kolom angka dijumlah, kolom Keterangan berisi "-")
  const colTotals = summaryTotals.colTotals || {}
  const totalRow = [
    '',
    'JUMLAH',
    ...config.numericFields.map(f => colTotals[f.key] ?? 0),
    '-',
  ]
  wsData.push(totalRow)

  // Baris kosong
  wsData.push([])

  // Keterangan :
  wsData.push(['Keterangan :'])
  if (config.columnDescriptions && config.columnDescriptions.length > 0) {
    config.columnDescriptions.forEach((desc, idx) => {
      wsData.push([idx + 1, desc.label, `= ${desc.text}`])
    })
  }

  // Baris kosong sebelum tanda tangan
  wsData.push([])
  wsData.push([])

  // Footer Tanda Tangan
  const namaBalai = wilayahObj?.teks_header_kabupaten || wilayahName
  const namaKepala = wilayahObj?.nama_kepala_balai || "JUM'AH, S.Kep., M.Kep"
  const nipKepala = wilayahObj?.nip_kepala_balai ? `NIP. ${wilayahObj.nip_kepala_balai}` : 'NIP. 19740315 199803 2 007'
  const namaPembuat = wilayahObj?.nama_pembuat_laporan || 'PETUGAS PENGAWAS'
  const nipPembuat = wilayahObj?.nip_pembuat_laporan ? `NIP. ${wilayahObj.nip_pembuat_laporan}` : '-'

  wsData.push(['', 'Mengetahui,', '', '', '', '', '', `${namaBalai}, ${tahun}`])
  wsData.push(['', 'KEPALA BALAI PENGAWASAN,', '', '', '', '', '', 'PEMBUAT LAPORAN,'])
  wsData.push([])
  wsData.push([])
  wsData.push([])
  wsData.push(['', namaKepala, '', '', '', '', '', namaPembuat])
  wsData.push(['', nipKepala, '', '', '', '', '', nipPembuat])

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Merges untuk 2 baris header (indeks baris 6 & 7 karena 6 baris awal: 0..5)
  ws['!merges'] = [
    { s: { r: 6, c: 0 }, e: { r: 7, c: 0 } }, // No
    { s: { r: 6, c: 1 }, e: { r: 7, c: 1 } }, // Jabatan Pengawas Ketenagakerjaan
    { s: { r: 6, c: 3 }, e: { r: 6, c: 6 } }, // Kegiatan Pemeriksaan
    { s: { r: 6, c: 7 }, e: { r: 6, c: 8 } }, // Kegiatan Pembinaan
    { s: { r: 6, c: 9 }, e: { r: 7, c: 9 } }, // Keterangan
  ]

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 30 }, // Jabatan Pengawas Ketenagakerjaan
    { wch: 14 }, // Jumlah
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, // Kegiatan Pemeriksaan
    { wch: 10 }, { wch: 10 }, // Kegiatan Pembinaan
    { wch: 24 }, // Keterangan
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K5')

  const fileName = `K5_${wilayahName}_${periodeFile}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export async function exportK6ToExcel({ config, meta, rowsData, summaryTotals }) {
  const { wilayahName, jenisPeriode, bulan, triwulanRomawi, tahun, kode } = meta

  const XLSX = await import('xlsx')

  const isTriwulan = jenisPeriode === 'triwulan'
  const periodeLine = isTriwulan ? `Triwulan : ${triwulanRomawi}` : `Bulan : ${bulan}`
  const periodeFile = isTriwulan ? `Triwulan_${triwulanRomawi}` : bulan
  const nums1to9 = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  const wsData = [
    ['KEGIATAN PEMERIKSAAN KETENAGAKERJAAN'],
    [periodeLine],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayahName}`],
    [`Kode : ${kode || 'K6'}`],
    [], // Baris kosong
    // Baris 1 Header (35 kolom)
    [
      'No',
      'Jabatan Pengawas',
      'JML',
      'Pertama-Khusus', '', '', '', '', '', '', '', '',
      'Berkala', '', '', '', '', '', '', '', '',
      'Ulang', '', '', '', '', '', '', '', '',
      '', '',
      'NP I',
      'NP II',
      'Ket',
    ],
    // Baris 2 Header (35 kolom)
    [
      '',
      '',
      '',
      ...nums1to9,
      ...nums1to9,
      ...nums1to9,
      'N. KET',
      'N. K3',
      '',
      '',
      '',
    ],
  ]

  // 4 baris data jabatan (Pertama, Muda, Madya, Terampil)
  config.rows.forEach((rowDef) => {
    const rowVal = rowsData[rowDef.key] || {}
    const rowItem = [
      rowDef.no,
      rowDef.label,
      ...config.numericFields.map(f => rowVal[f.key] ?? 0),
      rowVal.keterangan || '',
    ]
    wsData.push(rowItem)
  })

  // Baris JUMLAH Total (32 kolom angka dijumlah, kolom Ket berisi "-")
  const colTotals = summaryTotals.colTotals || {}
  const totalRow = [
    '',
    'JUMLAH',
    ...config.numericFields.map(f => colTotals[f.key] ?? 0),
    '-',
  ]
  wsData.push(totalRow)

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Merges untuk 2 baris header (baris indeks 6 & 7)
  ws['!merges'] = [
    { s: { r: 6, c: 0 }, e: { r: 7, c: 0 } },   // No
    { s: { r: 6, c: 1 }, e: { r: 7, c: 1 } },   // Jabatan Pengawas
    { s: { r: 6, c: 2 }, e: { r: 7, c: 2 } },   // JML
    { s: { r: 6, c: 3 }, e: { r: 6, c: 11 } },  // Pertama-Khusus (9 kolom)
    { s: { r: 6, c: 12 }, e: { r: 6, c: 20 } }, // Berkala (9 kolom)
    { s: { r: 6, c: 21 }, e: { r: 6, c: 29 } }, // Ulang (9 kolom)
    { s: { r: 6, c: 32 }, e: { r: 7, c: 32 } }, // NP I
    { s: { r: 6, c: 33 }, e: { r: 7, c: 33 } }, // NP II
    { s: { r: 6, c: 34 }, e: { r: 7, c: 34 } }, // Ket
  ]

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 22 }, // Jabatan Pengawas
    { wch: 8 },  // JML
    ...Array.from({ length: 27 }, () => ({ wch: 6 })), // Pertama-Khusus, Berkala, Ulang (1..9)
    { wch: 8 },  // N. KET
    { wch: 8 },  // N. K3
    { wch: 8 },  // NP I
    { wch: 8 },  // NP II
    { wch: 22 }, // Ket
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K6')

  const fileName = `K6_${wilayahName}_${periodeFile}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export async function exportK7ToExcel({ config, meta, rowsData, summaryTotals }) {
  const { wilayahName, jenisPeriode, bulan, triwulanRomawi, tahun, kode } = meta

  const XLSX = await import('xlsx')

  const isTriwulan = jenisPeriode === 'triwulan'
  const periodeLine = isTriwulan ? `Triwulan : ${triwulanRomawi}` : `Bulan : ${bulan}`
  const periodeFile = isTriwulan ? `Triwulan_${triwulanRomawi}` : bulan
  const staticKet = 'Penerbitan Perijinan K3 Bukan termasuk dalam wewenang dari UPTD'

  const wsData = [
    ['DATA PENERBITAN PERIZINAN K3'],
    [periodeLine],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayahName}`],
    [`Kode : ${kode || 'K7'}`],
    [], // Baris kosong
    // Baris 1 Header (14 kolom total)
    [
      'No',
      'Sektor/KLUI',
      'Jumlah Penerbitan Izin K3', '', '', '', '', '', '', '', '', '', '',
      'Ket',
    ],
    // Baris 2 Header (14 kolom total)
    [
      '',
      '',
      'Pes. Uap',
      'Bejana Tekan',
      'PAA',
      'PTP',
      'Listrik',
      'Petir',
      'KB',
      'Klinik Persh./Pely.Kes.K',
      'Pengdl. Pestisida',
      'Catering Makanan TK',
      'Lain-lain',
      '',
    ],
  ]

  // 9 baris data
  config.rows.forEach((rowDef, idx) => {
    const rowVal = rowsData[rowDef.id_klui] || {}
    const rowItem = [
      rowDef.no,
      rowDef.sektor_klui,
      ...config.numericFields.map(f => rowVal[f.key] ?? 0),
      idx === 0 ? staticKet : '',
    ]
    wsData.push(rowItem)
  })

  // Baris JUMLAH Total (11 kolom angka dijumlah, kolom Ket berisi "-")
  const colTotals = summaryTotals.colTotals || {}
  const totalRow = [
    '',
    'JUMLAH',
    ...config.numericFields.map(f => colTotals[f.key] ?? 0),
    '-',
  ]
  wsData.push(totalRow)

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Merges untuk 2 baris header dan kolom Ket (baris indeks 6 & 7 untuk header, baris 8 s.d. 16 untuk data Ket)
  ws['!merges'] = [
    { s: { r: 6, c: 0 }, e: { r: 7, c: 0 } },   // No
    { s: { r: 6, c: 1 }, e: { r: 7, c: 1 } },   // Sektor/KLUI
    { s: { r: 6, c: 2 }, e: { r: 6, c: 12 } },  // Jumlah Penerbitan Izin K3 (11 kolom)
    { s: { r: 6, c: 13 }, e: { r: 7, c: 13 } }, // Ket Header
    { s: { r: 8, c: 13 }, e: { r: 16, c: 13 } }, // Ket Data 9 baris menyatu
  ]

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Sektor/KLUI
    { wch: 10 }, // Pes. Uap
    { wch: 12 }, // Bejana Tekan
    { wch: 8 },  // PAA
    { wch: 8 },  // PTP
    { wch: 8 },  // Listrik
    { wch: 8 },  // Petir
    { wch: 8 },  // KB
    { wch: 22 }, // Klinik Persh./Pely.Kes.K
    { wch: 16 }, // Pengdl. Pestisida
    { wch: 20 }, // Catering Makanan TK
    { wch: 10 }, // Lain-lain
    { wch: 45 }, // Ket
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K7')

  const fileName = `K7_${wilayahName}_${periodeFile}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}


export async function exportK8aToExcel({ config, meta, rowsData, summaryTotals }) {
  const { wilayahName, jenisPeriode, bulan, triwulanRomawi, tahun, kode } = meta

  const XLSX = await import('xlsx')

  const isTriwulan = jenisPeriode === 'triwulan'
  const periodeLine = isTriwulan ? `Triwulan : ${triwulanRomawi}` : `Bulan : ${bulan}`
  const periodeFile = isTriwulan ? `Triwulan_${triwulanRomawi}` : bulan

  // Kolom: No, Sektor/KLUI, Jml.Kecl., Jml.Korban, Keracunan, PAK, A-J (10), Ket = 16 kolom total
  const wsData = [
    ['DATA KECELAKAAN KERJA DAN PENYAKIT AKIBAT KERJA'],
    [periodeLine],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayahName}`],
    [`Kode : ${kode || 'K8a'}`],
    [], // Baris kosong
    // Header Baris 1
    [
      'No', 'Sektor/KLUI', 'Jml. Kecl.', 'Jml. Korban', 'Keracunan', 'PAK',
      'Tipe Kecelakaan Kerja', '', '', '', '', '', '', '', '', '',
      'Ket',
    ],
    // Header Baris 2
    [
      '', '', '', '', '', '',
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
      '',
    ],
  ]

  // 9 baris data
  config.rows.forEach((rowDef) => {
    const rowVal = rowsData[rowDef.id_klui] || {}
    wsData.push([
      rowDef.no,
      rowDef.sektor_klui,
      ...config.numericFields.map(f => rowVal[f.key] ?? 0),
      rowVal.keterangan || '',
    ])
  })

  // Baris JUMLAH
  const colTotals = summaryTotals.colTotals || {}
  wsData.push([
    '', 'JUMLAH',
    ...config.numericFields.map(f => colTotals[f.key] ?? 0),
    '-',
  ])

  // Baris kosong + judul keterangan
  wsData.push([])
  wsData.push(['Keterangan :'])

  // Daftar keterangan A s.d. J
  if (config.columnDescriptions && config.columnDescriptions.length > 0) {
    config.columnDescriptions.forEach(desc => {
      wsData.push([desc.label, '=', desc.text])
    })
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Merges untuk header 2 baris
  ws['!merges'] = [
    { s: { r: 6, c: 0 }, e: { r: 7, c: 0 } },   // No
    { s: { r: 6, c: 1 }, e: { r: 7, c: 1 } },   // Sektor/KLUI
    { s: { r: 6, c: 2 }, e: { r: 7, c: 2 } },   // Jml. Kecl.
    { s: { r: 6, c: 3 }, e: { r: 7, c: 3 } },   // Jml. Korban
    { s: { r: 6, c: 4 }, e: { r: 7, c: 4 } },   // Keracunan
    { s: { r: 6, c: 5 }, e: { r: 7, c: 5 } },   // PAK
    { s: { r: 6, c: 6 }, e: { r: 6, c: 15 } },  // Tipe Kecelakaan Kerja (10 kolom A-J)
    { s: { r: 6, c: 16 }, e: { r: 7, c: 16 } }, // Ket
  ]

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Sektor/KLUI
    { wch: 11 }, // Jml. Kecl.
    { wch: 11 }, // Jml. Korban
    { wch: 10 }, // Keracunan
    { wch: 8 },  // PAK
    // A-J: 10 kolom
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 24 }, // Ket
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K8a')

  const fileName = `K8a_${wilayahName}_${periodeFile}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}


export async function exportK8bToExcel({ config, meta, rowsData, summaryTotals }) {
  const { wilayahName, jenisPeriode, bulan, triwulanRomawi, tahun, kode } = meta

  const XLSX = await import('xlsx')

  const isTriwulan = jenisPeriode === 'triwulan'
  const periodeLine = isTriwulan ? `Triwulan : ${triwulanRomawi}` : `Bulan : ${bulan}`
  const periodeFile = isTriwulan ? `Triwulan_${triwulanRomawi}` : bulan

  // Kolom: No, Sektor/KLUI, A-R (18 kolom), Ket = 21 kolom total
  const wsData = [
    ['DATA KECELAKAAN KERJA DAN PENYAKIT AKIBAT KERJA'],
    [periodeLine],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayahName}`],
    [`Kode : ${kode || 'K8b'}`],
    [], // Baris kosong
    // Header Baris 1
    [
      'No', 'Sektor/KLUI',
      'Sumber Kecelakaan Kerja', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      'Ket',
    ],
    // Header Baris 2
    [
      '', '',
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
      '',
    ],
  ]

  // 9 baris data
  config.rows.forEach((rowDef) => {
    const rowVal = rowsData[rowDef.id_klui] || {}
    wsData.push([
      rowDef.no,
      rowDef.sektor_klui,
      ...config.numericFields.map(f => rowVal[f.key] ?? 0),
      rowVal.keterangan || '',
    ])
  })

  // Baris JUMLAH
  const colTotals = summaryTotals.colTotals || {}
  wsData.push([
    '', 'JUMLAH',
    ...config.numericFields.map(f => colTotals[f.key] ?? 0),
    '-',
  ])

  // Baris kosong + judul keterangan
  wsData.push([])
  wsData.push(['Keterangan :'])

  // Daftar keterangan A s.d. R
  if (config.columnDescriptions && config.columnDescriptions.length > 0) {
    config.columnDescriptions.forEach(desc => {
      wsData.push([desc.label, '=', desc.text])
    })
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Merges untuk header 2 baris
  ws['!merges'] = [
    { s: { r: 6, c: 0 }, e: { r: 7, c: 0 } },   // No
    { s: { r: 6, c: 1 }, e: { r: 7, c: 1 } },   // Sektor/KLUI
    { s: { r: 6, c: 2 }, e: { r: 6, c: 19 } },  // Sumber Kecelakaan Kerja (18 kolom A-R)
    { s: { r: 6, c: 20 }, e: { r: 7, c: 20 } }, // Ket
  ]

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Sektor/KLUI
    // A-R: 18 kolom
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 24 }, // Ket
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K8b')

  const fileName = `K8b_${wilayahName}_${periodeFile}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}


export async function exportK8cToExcel({ config, meta, rowsData, summaryTotals }) {
  const { wilayahName, jenisPeriode, bulan, triwulanRomawi, tahun, kode } = meta

  const XLSX = await import('xlsx')

  const isTriwulan = jenisPeriode === 'triwulan'
  const periodeLine = isTriwulan ? `Triwulan : ${triwulanRomawi}` : `Bulan : ${bulan}`
  const periodeFile = isTriwulan ? `Triwulan_${triwulanRomawi}` : bulan

  // Kolom: No, Sektor/KLUI, KK, PAK, Sembuh, STMB, Cacat, MD, Berkala, Sekaligus, Kerg Matrl, Hr Hlg, Lain2, Ket = 14 kolom total
  const wsData = [
    ['DATA KECELAKAAN KERJA DAN PENYAKIT AKIBAT KERJA'],
    [periodeLine],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayahName}`],
    [`Kode : ${kode || 'K8c'}`],
    [], // Baris kosong
    // Header Baris 1
    [
      'No', 'Sektor/KLUI',
      'Jml Kasus', '',
      'Akibat Kecelakaan Kerja', '', '', '',
      'Santunan yang Dibayarkan', '',
      'Kerg Matrl', 'Hr Hlg', 'Lain2', 'Ket',
    ],
    // Header Baris 2
    [
      '', '',
      'KK', 'PAK',
      'Sembuh', 'STMB', 'Cacat', 'MD',
      'Berkala', 'Sekaligus',
      '', '', '', '',
    ],
  ]

  // 9 baris data
  config.rows.forEach((rowDef) => {
    const rowVal = rowsData[rowDef.id_klui] || {}
    wsData.push([
      rowDef.no,
      rowDef.sektor_klui,
      ...config.numericFields.map(f => rowVal[f.key] ?? 0),
      rowVal.keterangan || '',
    ])
  })

  // Baris JUMLAH
  const colTotals = summaryTotals.colTotals || {}
  wsData.push([
    '', 'JUMLAH',
    ...config.numericFields.map(f => colTotals[f.key] ?? 0),
    '-',
  ])

  // Baris kosong + judul keterangan
  wsData.push([])
  wsData.push(['Keterangan :'])

  // Daftar keterangan KK, PAK, STMB, MD
  if (config.columnDescriptions && config.columnDescriptions.length > 0) {
    config.columnDescriptions.forEach(desc => {
      wsData.push([desc.label, '=', desc.text])
    })
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Merges untuk header 2 baris
  ws['!merges'] = [
    { s: { r: 6, c: 0 }, e: { r: 7, c: 0 } },   // No
    { s: { r: 6, c: 1 }, e: { r: 7, c: 1 } },   // Sektor/KLUI
    { s: { r: 6, c: 2 }, e: { r: 6, c: 3 } },   // Jml Kasus (KK, PAK)
    { s: { r: 6, c: 4 }, e: { r: 6, c: 7 } },   // Akibat Kecelakaan Kerja (Sembuh, STMB, Cacat, MD)
    { s: { r: 6, c: 8 }, e: { r: 6, c: 9 } },   // Santunan yang Dibayarkan (Berkala, Sekaligus)
    { s: { r: 6, c: 10 }, e: { r: 7, c: 10 } }, // Kerg Matrl
    { s: { r: 6, c: 11 }, e: { r: 7, c: 11 } }, // Hr Hlg
    { s: { r: 6, c: 12 }, e: { r: 7, c: 12 } }, // Lain2
    { s: { r: 6, c: 13 }, e: { r: 7, c: 13 } }, // Ket
  ]

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Sektor/KLUI
    { wch: 8 },  // KK
    { wch: 8 },  // PAK
    { wch: 10 }, // Sembuh
    { wch: 8 },  // STMB
    { wch: 8 },  // Cacat
    { wch: 8 },  // MD
    { wch: 12 }, // Berkala
    { wch: 12 }, // Sekaligus
    { wch: 12 }, // Kerg Matrl
    { wch: 10 }, // Hr Hlg
    { wch: 10 }, // Lain2
    { wch: 24 }, // Ket
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K8c')

  const fileName = `K8c_${wilayahName}_${periodeFile}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}


export async function exportK9aToExcel({ config, meta, rowsData, summaryTotals }) {
  const { wilayahName, jenisPeriode, bulan, triwulanRomawi, tahun, kode } = meta

  const XLSX = await import('xlsx')

  const isTriwulan = jenisPeriode === 'triwulan'
  const periodeLine = isTriwulan ? `Triwulan : ${triwulanRomawi}` : `Bulan : ${bulan}`
  const periodeFile = isTriwulan ? `Triwulan_${triwulanRomawi}` : bulan

  // Kolom: No, Sektor/KLUI, Jml Prsh Melanggar, Jml Perush Di Nota, 17 sub-kolom, Ket = 22 kolom total
  const wsData = [
    ['DATA PELANGGARAN NORMA KERJA'],
    [periodeLine],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayahName}`],
    [`Kode : ${kode || 'K9a'}`],
    [], // Baris kosong
    // Header Baris 1 (22 kolom)
    [
      'No', 'Sektor/KLUI', 'Jml Prsh Melanggar', 'Jml Perush Di Nota',
      'Jenis Pelanggaran Norma Ketenagakerjaan',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      'Ket',
    ],
    // Header Baris 2 (22 kolom)
    [
      '', '', '', '',
      'WLK', 'WKWI', 'TKA', 'TKI', 'UMP', 'Upah Lemb', 'THR',
      'Cuti Tahun', 'Cuti Haid', 'PP/PKB', 'P4D/P4P', 'PWBD',
      'PDS TK', 'PDS Upah', 'PDS Prog', 'Persh Menggk Iuran', 'Lain-lain',
      '',
    ],
  ]

  // 10 baris data (sektor 1-9, lalu 0)
  config.rows.forEach((rowDef) => {
    const rowVal = rowsData[rowDef.id_klui] || {}
    wsData.push([
      rowDef.no,
      rowDef.sektor_klui,
      ...config.numericFields.map(f => rowVal[f.key] ?? 0),
      rowVal.keterangan || '',
    ])
  })

  // Baris JUMLAH
  const colTotals = summaryTotals.colTotals || {}
  wsData.push([
    '', 'JUMLAH',
    ...config.numericFields.map(f => colTotals[f.key] ?? 0),
    '-',
  ])

  // Baris kosong + judul keterangan
  wsData.push([])
  wsData.push(['Keterangan :'])

  // 12 butir keterangan (WLK sampai PDS PROG)
  if (config.columnDescriptions && config.columnDescriptions.length > 0) {
    config.columnDescriptions.forEach(desc => {
      wsData.push([desc.label, '=', desc.text])
    })
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Merges untuk header 2 baris
  ws['!merges'] = [
    { s: { r: 6, c: 0 }, e: { r: 7, c: 0 } },   // No
    { s: { r: 6, c: 1 }, e: { r: 7, c: 1 } },   // Sektor/KLUI
    { s: { r: 6, c: 2 }, e: { r: 7, c: 2 } },   // Jml Prsh Melanggar
    { s: { r: 6, c: 3 }, e: { r: 7, c: 3 } },   // Jml Perush Di Nota
    { s: { r: 6, c: 4 }, e: { r: 6, c: 20 } },  // Jenis Pelanggaran Norma Ketenagakerjaan (17 kolom)
    { s: { r: 6, c: 21 }, e: { r: 7, c: 21 } }, // Ket
  ]

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Sektor/KLUI
    { wch: 18 }, // Jml Prsh Melanggar
    { wch: 18 }, // Jml Perush Di Nota
    { wch: 8 },  // WLK
    { wch: 8 },  // WKWI
    { wch: 8 },  // TKA
    { wch: 8 },  // TKI
    { wch: 8 },  // UMP
    { wch: 11 }, // Upah Lemb
    { wch: 8 },  // THR
    { wch: 11 }, // Cuti Tahun
    { wch: 10 }, // Cuti Haid
    { wch: 10 }, // PP/PKB
    { wch: 10 }, // P4D/P4P
    { wch: 8 },  // PWBD
    { wch: 9 },  // PDS TK
    { wch: 10 }, // PDS Upah
    { wch: 10 }, // PDS Prog
    { wch: 18 }, // Persh Menggk Iuran
    { wch: 10 }, // Lain-lain
    { wch: 24 }, // Ket
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K9a')

  const fileName = `K9a_${wilayahName}_${periodeFile}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}


export async function exportK9bToExcel({ config, meta, rowsData, summaryTotals }) {
  const { wilayahName, jenisPeriode, bulan, triwulanRomawi, tahun, kode } = meta

  const XLSX = await import('xlsx')

  const isTriwulan = jenisPeriode === 'triwulan'
  const periodeLine = isTriwulan ? `Triwulan : ${triwulanRomawi}` : `Bulan : ${bulan}`
  const periodeFile = isTriwulan ? `Triwulan_${triwulanRomawi}` : bulan

  // Kolom: No, Sektor/KLUI, 14 kolom angka, Ket = 17 kolom total (c0..c16)
  const wsData = [
    ['DATA PELANGGARAN NORMA K3'],
    [periodeLine],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayahName}`],
    [`Kode : ${kode || 'K9b'}`],
    [], // Baris kosong
    // Header Baris 1 (r6, 17 kolom)
    [
      'No', 'Sektor/KLUI',
      'Jenis Pelanggaran Norma K3', '', '', '', '', '', '', '', '', '', '', '', '', '',
      'Ket',
    ],
    // Header Baris 2 (r7, 17 kolom)
    [
      '', '',
      'P2K3', 'Ahli K3', 'PJK3', 'Klinik Persh./Pely. Kes. K',
      'Katering Pengelola Makanan', 'Pengl. Pestisida', 'Operator/Teknisi/Petugas',
      'Dokter Persh', 'Paramedis Perusahaan', 'Dokter PKTK',
      'Pemeriksaan Kesehatan K3', '', '',
      'Lain-lain',
      '',
    ],
    // Header Baris 3 (r8, 17 kolom)
    [
      '', '', '', '', '', '', '', '', '', '', '', '',
      'Awal', 'Berkala', 'Khusus',
      '', '',
    ],
  ]

  // 10 baris data (sektor 1-9, lalu 0)
  config.rows.forEach((rowDef) => {
    const rowVal = rowsData[rowDef.id_klui] || {}
    wsData.push([
      rowDef.no,
      rowDef.sektor_klui,
      ...config.numericFields.map(f => rowVal[f.key] ?? 0),
      rowVal.keterangan || '',
    ])
  })

  // Baris JUMLAH (tanpa daftar keterangan di bawahnya)
  const colTotals = summaryTotals.colTotals || {}
  wsData.push([
    '', 'JUMLAH',
    ...config.numericFields.map(f => colTotals[f.key] ?? 0),
    '-',
  ])

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Merges untuk header 3 baris (r6, r7, r8)
  ws['!merges'] = [
    { s: { r: 6, c: 0 }, e: { r: 8, c: 0 } },   // No
    { s: { r: 6, c: 1 }, e: { r: 8, c: 1 } },   // Sektor/KLUI
    { s: { r: 6, c: 2 }, e: { r: 6, c: 15 } },  // Jenis Pelanggaran Norma K3 (14 kolom)
    { s: { r: 6, c: 16 }, e: { r: 8, c: 16 } }, // Ket
    { s: { r: 7, c: 2 }, e: { r: 8, c: 2 } },   // P2K3
    { s: { r: 7, c: 3 }, e: { r: 8, c: 3 } },   // Ahli K3
    { s: { r: 7, c: 4 }, e: { r: 8, c: 4 } },   // PJK3
    { s: { r: 7, c: 5 }, e: { r: 8, c: 5 } },   // Klinik Persh./Pely. Kes. K
    { s: { r: 7, c: 6 }, e: { r: 8, c: 6 } },   // Katering Pengelola Makanan
    { s: { r: 7, c: 7 }, e: { r: 8, c: 7 } },   // Pengl. Pestisida
    { s: { r: 7, c: 8 }, e: { r: 8, c: 8 } },   // Operator/Teknisi/Petugas
    { s: { r: 7, c: 9 }, e: { r: 8, c: 9 } },   // Dokter Persh
    { s: { r: 7, c: 10 }, e: { r: 8, c: 10 } }, // Paramedis Perusahaan
    { s: { r: 7, c: 11 }, e: { r: 8, c: 11 } }, // Dokter PKTK
    { s: { r: 7, c: 12 }, e: { r: 7, c: 14 } }, // Pemeriksaan Kesehatan K3 (Awal, Berkala, Khusus)
    { s: { r: 7, c: 15 }, e: { r: 8, c: 15 } }, // Lain-lain
  ]

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Sektor/KLUI
    { wch: 8 },  // P2K3
    { wch: 9 },  // Ahli K3
    { wch: 8 },  // PJK3
    { wch: 24 }, // Klinik Persh./Pely. Kes. K
    { wch: 24 }, // Katering Pengelola Makanan
    { wch: 16 }, // Pengl. Pestisida
    { wch: 24 }, // Operator/Teknisi/Petugas
    { wch: 14 }, // Dokter Persh
    { wch: 20 }, // Paramedis Perusahaan
    { wch: 14 }, // Dokter PKTK
    { wch: 8 },  // Awal
    { wch: 10 }, // Berkala
    { wch: 10 }, // Khusus
    { wch: 10 }, // Lain-lain
    { wch: 24 }, // Ket
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K9b')

  const fileName = `K9b_${wilayahName}_${periodeFile}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}
