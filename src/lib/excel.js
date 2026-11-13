/**
 * Pembuat Berkas Excel untuk Laporan K1
 * Menggunakan paket xlsx (SheetJS) secara dynamic import di sisi frontend.
 */

export async function exportK1ToExcel({ config, meta, rowsData, summaryTotals }) {
  const XLSX = await import('xlsx')

  const { wilayah, jenis, periode, tahun, kode } = meta
  const periodLabel = jenis === 'Bulanan' ? 'Bulan' : 'Triwulan'

  const wsData = [
    // Judul & Metadata
    ['DATA PEGAWAI PENGAWAS KETENAGAKERJAAN'],
    [`${periodLabel} : ${periode}`],
    [`Tahun : ${tahun}`],
    [`Kabupaten/Wilayah : ${wilayah}`],
    [`Kode : ${kode}`],
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
      // Baris grup menampilkan '-'
      const groupRow = [
        rowDef.no || '',
        rowDef.label || '',
        '-',
        '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-',
        '-',
        '-',
        ''
      ]
      wsData.push(groupRow)
    } else {
      const rowVal = rowsData[rowDef.id] || {}
      const rowItem = [
        rowDef.no || '',
        rowDef.label || '',
        rowVal.umum ?? 0,
        rowVal.spesialis_1 ?? 0,
        rowVal.spesialis_2 ?? 0,
        rowVal.spesialis_3 ?? 0,
        rowVal.spesialis_4 ?? 0,
        rowVal.spesialis_5 ?? 0,
        rowVal.spesialis_6 ?? 0,
        rowVal.spesialis_7 ?? 0,
        rowVal.spesialis_8 ?? 0,
        rowVal.spesialis_9 ?? 0,
        rowVal.spesialis_10 ?? 0,
        rowVal.spesialis_11 ?? 0,
        summaryTotals.rowTotals[rowDef.id] ?? 0,
        rowVal.ppns ?? 0,
        rowVal.ket || ''
      ]
      wsData.push(rowItem)
    }
  })

  // Baris JUMLAH Total
  const colTotals = summaryTotals.colTotals || {}
  const totalRow = [
    '',
    'JUMLAH',
    colTotals.umum ?? 0,
    colTotals.spesialis_1 ?? 0,
    colTotals.spesialis_2 ?? 0,
    colTotals.spesialis_3 ?? 0,
    colTotals.spesialis_4 ?? 0,
    colTotals.spesialis_5 ?? 0,
    colTotals.spesialis_6 ?? 0,
    colTotals.spesialis_7 ?? 0,
    colTotals.spesialis_8 ?? 0,
    colTotals.spesialis_9 ?? 0,
    colTotals.spesialis_10 ?? 0,
    colTotals.spesialis_11 ?? 0,
    summaryTotals.grandTotal ?? 0,
    colTotals.ppns ?? 0,
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

  // Atur lebar kolom agar rapi
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 28 }, // Jabatan
    { wch: 10 }, // Umum
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, // 1-11
    { wch: 10 }, // Jumlah
    { wch: 8 },  // PPNS
    { wch: 20 }  // Ket
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'K1')

  const fileName = `K1_${wilayah}_${periode}_${tahun}.xlsx`
  XLSX.writeFile(wb, fileName)
}
