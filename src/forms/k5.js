/**
 * Definisi Konfigurasi Form K5: KEGIATAN PEMERIKSAAN (APBN)
 * Berdasarkan PRD Database rekap_k5_pemeriksaan & Kontrak REST API Modul K5
 */

// 7 Kolom Angka K5 dengan kunci unik & pemetaan kolom backend
export const K5_NUMERIC_FIELDS = [
  { key: 'jumlah', apiKey: 'jumlah_pengawas', label: 'Jumlah', width: 'w-20 min-w-[80px]' },
  { key: 'pertama', apiKey: 'periksa_pertama', label: 'Pertama', width: 'w-20 min-w-[80px]' },
  { key: 'berkala', apiKey: 'periksa_berkala', label: 'Berkala', width: 'w-20 min-w-[80px]' },
  { key: 'ulang', apiKey: 'periksa_ulang', label: 'Ulang', width: 'w-20 min-w-[80px]' },
  { key: 'khusus', apiKey: 'periksa_khusus', label: 'Khusus', width: 'w-20 min-w-[80px]' },
  { key: 'np1', apiKey: 'bina_np_1', label: 'NP. I', width: 'w-20 min-w-[76px]', fullLabel: 'Nota Pemeriksaan I' },
  { key: 'np2', apiKey: 'bina_np_2', label: 'NP. II', width: 'w-20 min-w-[76px]', fullLabel: 'Nota Pemeriksaan II' },
]

export const formK5 = {
  kode: 'K5',
  modul: 'k5',
  tabel_db: 'rekap_k5_pemeriksaan',
  judul: 'KEGIATAN PEMERIKSAAN (APBN)',
  subjudul: 'Laporan Kegiatan Pemeriksaan Sumber Dana APBN',
  tableCardTitlePrefix: '2. Isi data kegiatan pemeriksaan',
  rowType: 'jabatan',
  keyField: 'key',
  apiRowKey: 'id_jabatan',
  secondColumnHeader: 'Jabatan Pengawas Ketenagakerjaan',

  // Header DUA tingkat (rowspan & colspan)
  headerRows: [
    // Tingkat 1
    [
      { label: 'No', rowspan: 2, sticky: 'left-0', width: 'w-12 min-w-[48px]', variant: 'primary' },
      { label: 'Jabatan Pengawas Ketenagakerjaan', rowspan: 2, sticky: 'left-12', width: 'w-52 min-w-[200px]', variant: 'primary' },
      { label: 'Jumlah', rowspan: 2, width: 'w-20 min-w-[80px]', variant: 'group' },
      { label: 'Kegiatan Pemeriksaan', colspan: 4, variant: 'group' },
      { label: 'Kegiatan Pembinaan', colspan: 2, variant: 'group' },
      { label: 'Keterangan', rowspan: 2, width: 'w-48 min-w-[180px]', variant: 'primary' },
    ],
    // Tingkat 2
    [
      { label: 'Pertama', width: 'w-20 min-w-[80px]', variant: 'sub' },
      { label: 'Berkala', width: 'w-20 min-w-[80px]', variant: 'sub' },
      { label: 'Ulang', width: 'w-20 min-w-[80px]', variant: 'sub' },
      { label: 'Khusus', width: 'w-20 min-w-[80px]', variant: 'sub' },
      { label: 'NP. I', width: 'w-20 min-w-[76px]', variant: 'sub', fullLabel: 'Nota Pemeriksaan I' },
      { label: 'NP. II', width: 'w-20 min-w-[76px]', variant: 'sub', fullLabel: 'Nota Pemeriksaan II' },
    ],
  ],

  // Tepat 2 baris berdasarkan jabatan: nomor 1 = "Pertama", nomor 2 = "Muda"
  rows: [
    { key: 'pertama', id_jabatan: 4, no: 1, label: 'Pertama' },
    { key: 'muda', id_jabatan: 5, no: 2, label: 'Muda' },
  ],

  numericFields: K5_NUMERIC_FIELDS,
  textField: {
    key: 'keterangan',
    label: 'Keterangan',
    placeholder: 'Keterangan...',
    width: 'w-48 min-w-[180px]',
  },

  // Konfigurasi generik periode Triwulan (dapat dipakai ulang oleh K6 s.d. K10)
  triwulanConfig: {
    autoSumFields: ['pertama', 'berkala', 'ulang', 'khusus', 'np1', 'np2'],
    lastNonZeroFields: ['jumlah'],
    editableFields: ['jumlah', 'keterangan'],
  },

  // Keterangan kolom persis sesuai ketentuan
  columnDescriptions: [
    { label: 'NP. I', text: 'Nota Pemeriksaan I' },
    { label: 'NP. II', text: 'Nota Pemeriksaan II' },
  ],
}
