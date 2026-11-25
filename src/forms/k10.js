/**
 * Definisi Konfigurasi Form K10: PENYIDIKAN PPNS
 * Laporan Proses Penyidikan Tindak Pidana Ketenagakerjaan oleh PPNS (9 Sektor: 1-9)
 * Mempunyai Blok Tanda Tangan yang dapat diedit dan tersimpan bersama laporan (Bulanan & Triwulan)
 * Berdasarkan DDL & Model RekapK10Penyidikan (rekap_k10_penyidikan)
 */

export const K10_NUMERIC_FIELDS = [
  { key: 'jmlMelanggar', apiKey: 'jml_perusahaan_melanggar', label: 'Jml. Persh. Melanggar', width: 'w-28 min-w-[110px]' },
  { key: 'jmlBap', apiKey: 'jml_perusahaan_diajukan_bap', label: 'Jml. Persh. Diajukan BAP', width: 'w-28 min-w-[110px]' },
  { key: 'henti', apiKey: 'penghentian_penyidikan', label: 'Penghentian Penyidikan', width: 'w-28 min-w-[110px]' },
  { key: 'denda', apiKey: 'putusan_denda', label: 'Denda', width: 'w-24 min-w-[90px]' },
  { key: 'kurung', apiKey: 'putusan_kurungan', label: 'Kurung', width: 'w-24 min-w-[90px]' },
]

// Nilai isi awal blok tanda tangan disimpan di satu tempat konfigurasi agar mudah diganti
export const K10_SIGNATURE_DEFAULTS = {
  tempatKota: 'Banjarmasin',
  kepalaNama: 'JUM’AH, S.Kep., M.Kep',
  kepalaNip: '19740315 199803 2 007',
  pembuatNama: 'ACHMAD ZAKI SUBHAN, ST',
  pembuatNip: '19780104 200904 1 002',
}

export const formK10 = {
  kode: 'K10',
  modul: 'k10',
  tabel_db: 'rekap_k10_penyidikan',
  judul: 'PENYIDIKAN PPNS',
  subjudul: 'Laporan Proses Penyidikan Tindak Pidana Ketenagakerjaan oleh PPNS',
  tableCardTitlePrefix: '2. Isi data penyidikan norma ketenagakerjaan (PPNS) - K10',
  keyField: 'id_klui',
  secondColumnHeader: 'Sektor/KLUI',

  // Header DUA tingkat
  headerRows: [
    // Tingkat 1
    [
      { label: 'No', rowspan: 2, sticky: 'left-0', width: 'w-12 min-w-[48px]', variant: 'primary' },
      { label: 'Sektor/KLUI', rowspan: 2, sticky: 'left-12', width: 'w-24 min-w-[90px]', variant: 'primary' },
      { label: 'Jml. Persh. Melanggar', rowspan: 2, width: 'w-28 min-w-[110px]', variant: 'primary' },
      { label: 'Jml. Persh. Diajukan BAP', rowspan: 2, width: 'w-28 min-w-[110px]', variant: 'primary' },
      { label: 'Penghentian Penyidikan', rowspan: 2, width: 'w-28 min-w-[110px]', variant: 'primary' },
      { label: 'Putusan', colspan: 2, variant: 'group' },
      { label: 'Keterangan', rowspan: 2, width: 'w-52 min-w-[200px]', variant: 'primary' },
    ],
    // Tingkat 2 (2 sub-kolom Putusan)
    [
      { label: 'Denda', width: 'w-24 min-w-[90px]', variant: 'sub' },
      { label: 'Kurung', width: 'w-24 min-w-[90px]', variant: 'sub' },
    ],
  ],

  // Tepat 9 baris KLUI: nomor 1 sampai 9, Sektor/KLUI berisi 1 sampai 9 (tidak ada 0)
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

  numericFields: K10_NUMERIC_FIELDS,

  textField: {
    key: 'keterangan',
    apiKey: 'keterangan',
    label: 'Keterangan',
    placeholder: 'Keterangan...',
  },

  // Triwulan: SEMUA 5 kolom angka otomatis dan terkunci; Keterangan & Blok tanda tangan tetap bisa diisi
  triwulanConfig: {
    allNumericLocked: true,
    autoSumFields: ['jmlMelanggar', 'jmlBap', 'henti', 'denda', 'kurung'],
    editableFields: ['keterangan'],
    infoText: 'Rekap otomatis 3 bulan dari laporan bulanan, sehingga kolom angka terkunci. Kolom Keterangan tetap dapat diisi.',
  },

  // Blok tanda tangan yang dapat diedit di bawah tabel (sebelum tombol aksi)
  signatureConfig: {
    title: 'Penandatangan Laporan',
    defaults: K10_SIGNATURE_DEFAULTS,
  },

  // K10 TIDAK punya kartu "Keterangan"
}
