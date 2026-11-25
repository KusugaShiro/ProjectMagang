/**
 * Definisi Konfigurasi Form K8c: KECELAKAAN KERJA & PAK (c)
 * Data Akibat Kecelakaan Kerja, Kerugian Jam Kerja & Santunan Biaya
 * Berdasarkan DDL & Model RekapK8cKecelakaanAkibat (rekap_k8c_kecelakaan_akibat)
 */

export const K8C_NUMERIC_FIELDS = [
  { key: 'kk', apiKey: 'jml_kasus_kk', label: 'KK', width: 'w-16 min-w-[65px]' },
  { key: 'pak', apiKey: 'jml_kasus_pak', label: 'PAK', width: 'w-16 min-w-[65px]' },
  { key: 'sembuh', apiKey: 'akibat_sembuh', label: 'Sembuh', width: 'w-20 min-w-[75px]' },
  { key: 'stmb', apiKey: 'akibat_stmb', label: 'STMB', width: 'w-16 min-w-[65px]' },
  { key: 'cacat', apiKey: 'akibat_cacat', label: 'Cacat', width: 'w-16 min-w-[65px]' },
  { key: 'md', apiKey: 'akibat_meninggal_dunia', label: 'MD', width: 'w-16 min-w-[65px]' },
  { key: 'berkala', apiKey: 'santunan_berkala', label: 'Berkala', decimal: true, width: 'w-24 min-w-[90px]' },
  { key: 'sekaligus', apiKey: 'santunan_sekaligus', label: 'Sekaligus', decimal: true, width: 'w-24 min-w-[90px]' },
  { key: 'kerg', apiKey: 'kerugian_material', label: 'Kerg Matrl', decimal: true, width: 'w-24 min-w-[95px]' },
  { key: 'hrhlg', apiKey: 'hari_hilang', label: 'Hr Hlg', width: 'w-20 min-w-[80px]' },
  { key: 'lain', apiKey: 'lain_lain', label: 'Lain2', width: 'w-20 min-w-[80px]' },
]

export const K8C_DESCRIPTIONS = [
  { label: 'KK', text: 'Kecelakaan Kerja' },
  { label: 'PAK', text: 'Penyakit Akibat Kerja' },
  { label: 'STMB', text: 'Sementara Tidak Mampu Bekerja' },
  { label: 'MD', text: 'Meninggal Dunia' },
]

export const formK8c = {
  kode: 'K8c',
  modul: 'k8c',
  tabel_db: 'rekap_k8c_kecelakaan_akibat',
  judul: 'KECELAKAAN KERJA & PAK (c)',
  subjudul: 'Data Akibat Kecelakaan Kerja, Kerugian Jam Kerja & Santunan Biaya',
  tableCardTitlePrefix: '2. Isi data kecelakaan kerja dan PAK - K8c',
  keyField: 'id_klui',
  secondColumnHeader: 'Sektor/KLUI',

  // Header DUA tingkat
  headerRows: [
    // Tingkat 1
    [
      { label: 'No', rowspan: 2, sticky: 'left-0', width: 'w-12 min-w-[48px]', variant: 'primary' },
      { label: 'Sektor/KLUI', rowspan: 2, sticky: 'left-12', width: 'w-24 min-w-[90px]', variant: 'primary' },
      { label: 'Jml Kasus', colspan: 2, variant: 'group' },
      { label: 'Akibat Kecelakaan Kerja', colspan: 4, variant: 'group' },
      { label: 'Santunan yang Dibayarkan', colspan: 2, variant: 'group' },
      { label: 'Kerg Matrl', rowspan: 2, width: 'w-24 min-w-[95px]', variant: 'primary' },
      { label: 'Hr Hlg', rowspan: 2, width: 'w-20 min-w-[80px]', variant: 'primary' },
      { label: 'Lain2', rowspan: 2, width: 'w-20 min-w-[80px]', variant: 'primary' },
      { label: 'Ket', rowspan: 2, width: 'w-48 min-w-[180px]', variant: 'primary' },
    ],
    // Tingkat 2 (8 sub-kolom dari 3 grup)
    [
      { label: 'KK', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'PAK', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'Sembuh', width: 'w-20 min-w-[75px]', variant: 'sub' },
      { label: 'STMB', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'Cacat', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'MD', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'Berkala', width: 'w-24 min-w-[90px]', variant: 'sub' },
      { label: 'Sekaligus', width: 'w-24 min-w-[90px]', variant: 'sub' },
    ],
  ],

  // Tepat 9 baris KLUI: nomor 1 sampai 9 (tidak ada 0)
  rows: [
    { id_klui: 1, no: 1, sektor_klui: '1', label: '1', nama_sektor: 'Pertanian, Perburuan, Kehutanan, Perikanan' },
    { id_klui: 2, no: 2, sektor_klui: '2', label: '2', nama_sektor: 'Pertambangan dan Penggalian' },
    { id_klui: 3, no: 3, sektor_klui: '3', label: '3', nama_sektor: 'Industri Pengolahan' },
    { id_klui: 4, no: 4, sektor_klui: '4', label: '4', nama_sektor: 'Listrik, Gas dan Air' },
    { id_klui: 5, no: 5, sektor_klui: '5', label: '5', nama_sektor: 'Konstruksi' },
    { id_klui: 6, no: 6, sektor_klui: '6', label: '6', nama_sektor: 'Perdagangan Besar, Eceran, Rumah Makan & Hotel' },
    { id_klui: 7, no: 7, sektor_klui: '7', label: '7', nama_sektor: 'Angkutan, Pergudangan dan Komunikasi' },
    { id_klui: 8, no: 8, sektor_klui: '8', label: '8', nama_sektor: 'Keuangan, Asuransi, Usaha Persewaan & Jasa Perusahaan' },
    { id_klui: 9, no: 9, sektor_klui: '9', label: '9', nama_sektor: 'Jasa Kemasyarakatan, Sosial dan Perorangan' },
  ],

  numericFields: K8C_NUMERIC_FIELDS,

  textField: {
    key: 'keterangan',
    apiKey: 'keterangan',
    label: 'Ket',
    placeholder: 'Keterangan...',
  },

  // Triwulan: SEMUA kolom angka otomatis dan terkunci; Ket tetap bisa diisi
  triwulanConfig: {
    allNumericLocked: true,
    autoSumFields: ['kk', 'pak', 'sembuh', 'stmb', 'cacat', 'md', 'berkala', 'sekaligus', 'kerg', 'hrhlg', 'lain'],
    editableFields: ['keterangan'],
    infoText: 'Rekap otomatis 3 bulan dari laporan bulanan, sehingga kolom angka terkunci. Kolom Keterangan tetap dapat diisi.',
  },

  columnDescriptionTitle: 'Keterangan',
  columnDescriptions: K8C_DESCRIPTIONS,
}
