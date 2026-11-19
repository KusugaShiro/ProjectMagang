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
