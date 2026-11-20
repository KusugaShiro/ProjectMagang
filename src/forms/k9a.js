/**
 * Definisi Konfigurasi Form K9a: PELANGGARAN NORMA KERJA
 * Rekapitulasi Pelanggaran Norma Ketenagakerjaan per Sektor KLUI (10 Sektor: 1-9 & 0)
 * Berdasarkan DDL & Model RekapK9aPelanggaranKerja (rekap_k9a_pelanggaran_kerja)
 */

export const K9A_NUMERIC_FIELDS = [
  { key: 'jmlMelanggar', apiKey: 'jml_perusahaan_melanggar', label: 'Jml Prsh Melanggar', width: 'w-24 min-w-[95px]' },
  { key: 'jmlNota', apiKey: 'jml_perusahaan_di_nota', label: 'Jml Perush Di Nota', width: 'w-24 min-w-[95px]' },
  { key: 'wlk', apiKey: 'pelanggaran_wlk', label: 'WLK', width: 'w-16 min-w-[65px]' },
  { key: 'wkwi', apiKey: 'pelanggaran_wkwi', label: 'WKWI', width: 'w-16 min-w-[65px]' },
  { key: 'tka', apiKey: 'pelanggaran_tka', label: 'TKA', width: 'w-16 min-w-[65px]' },
  { key: 'tki', apiKey: 'pelanggaran_tki', label: 'TKI', width: 'w-16 min-w-[65px]' },
  { key: 'ump', apiKey: 'pelanggaran_ump', label: 'UMP', width: 'w-16 min-w-[65px]' },
  { key: 'upahLemb', apiKey: 'pelanggaran_upah_lembur', label: 'Upah Lemb', width: 'w-20 min-w-[80px]' },
  { key: 'thr', apiKey: 'pelanggaran_thr', label: 'THR', width: 'w-16 min-w-[65px]' },
  { key: 'cutiTahun', apiKey: 'pelanggaran_cuti_tahunan', label: 'Cuti Tahun', width: 'w-20 min-w-[80px]' },
  { key: 'cutiHaid', apiKey: 'pelanggaran_cuti_haid', label: 'Cuti Haid', width: 'w-20 min-w-[80px]' },
  { key: 'ppPkb', apiKey: 'pelanggaran_pp_pkb', label: 'PP/PKB', width: 'w-20 min-w-[75px]' },
  { key: 'p4', apiKey: 'pelanggaran_p4d_p4p', label: 'P4D/P4P', width: 'w-20 min-w-[75px]' },
  { key: 'pwbd', apiKey: 'pelanggaran_pwbd', label: 'PWBD', width: 'w-16 min-w-[65px]' },
  { key: 'pdsTk', apiKey: 'pelanggaran_pds_tk', label: 'PDS TK', width: 'w-20 min-w-[75px]' },
  { key: 'pdsUpah', apiKey: 'pelanggaran_pds_upah', label: 'PDS Upah', width: 'w-20 min-w-[80px]' },
  { key: 'pdsProg', apiKey: 'pelanggaran_pds_prog', label: 'PDS Prog', width: 'w-20 min-w-[80px]' },
  { key: 'menggkIuran', apiKey: 'pelanggaran_menunggak_iuran', label: 'Persh Menggk Iuran', width: 'w-28 min-w-[110px]' },
  { key: 'lain', apiKey: 'pelanggaran_lain_lain', label: 'Lain-lain', width: 'w-20 min-w-[80px]' },
]

export const K9A_DESCRIPTIONS = [
  { label: 'WLK', text: 'Wajib Lapor Ketenagakerjaan' },
  { label: 'WKWI', text: 'Waktu Kerja Waktu Istirahat' },
  { label: 'TKA', text: 'Tenaga Kerja Asing' },
  { label: 'TKI', text: 'Tenaga Kerja Indonesia' },
  { label: 'UMP', text: 'Upah Minimum Provinsi' },
  { label: 'THR', text: 'Tunjangan Hari Raya' },
  { label: 'PP/PKB', text: 'Peraturan Perusahaan/Perjanjian Kerja Bersama' },
  { label: 'P4D/P4P', text: 'Pelaksanaan Putusan P4D/P4P' },
  { label: 'PWBD', text: 'Perusahaan Wajib Daftar' },
  { label: 'PDSTK', text: 'Perusahaan Daftar Sebagian Tenaga Kerja' },
  { label: 'PDS UPAH', text: 'Perusahaan Daftar Sebagian Upah' },
  { label: 'PDS PROG', text: 'Perusahaan Daftar Sebagian Program' },
]

export const formK9a = {
  kode: 'K9a',
  modul: 'k9a',
  tabel_db: 'rekap_k9a_pelanggaran_kerja',
  judul: 'PELANGGARAN NORMA KERJA',
  subjudul: 'Rekapitulasi Pelanggaran Norma Ketenagakerjaan per Sektor KLUI',
  tableCardTitlePrefix: '2. Isi data pelanggaran norma - K9a',
  keyField: 'id_klui',
  secondColumnHeader: 'Sektor/KLUI',

  // Header DUA tingkat
  headerRows: [
    // Tingkat 1
    [
      { label: 'No', rowspan: 2, sticky: 'left-0', width: 'w-12 min-w-[48px]', variant: 'primary' },
      { label: 'Sektor/KLUI', rowspan: 2, sticky: 'left-12', width: 'w-24 min-w-[90px]', variant: 'primary' },
      { label: 'Jml Prsh Melanggar', rowspan: 2, width: 'w-24 min-w-[95px]', variant: 'primary' },
      { label: 'Jml Perush Di Nota', rowspan: 2, width: 'w-24 min-w-[95px]', variant: 'primary' },
      { label: 'Jenis Pelanggaran Norma Ketenagakerjaan', colspan: 17, variant: 'group' },
      { label: 'Ket', rowspan: 2, width: 'w-48 min-w-[180px]', variant: 'primary' },
    ],
    // Tingkat 2 (17 sub-kolom)
    [
      { label: 'WLK', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'WKWI', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'TKA', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'TKI', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'UMP', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'Upah Lemb', width: 'w-20 min-w-[80px]', variant: 'sub' },
      { label: 'THR', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'Cuti Tahun', width: 'w-20 min-w-[80px]', variant: 'sub' },
      { label: 'Cuti Haid', width: 'w-20 min-w-[80px]', variant: 'sub' },
      { label: 'PP/PKB', width: 'w-20 min-w-[75px]', variant: 'sub' },
      { label: 'P4D/P4P', width: 'w-20 min-w-[75px]', variant: 'sub' },
      { label: 'PWBD', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'PDS TK', width: 'w-20 min-w-[75px]', variant: 'sub' },
      { label: 'PDS Upah', width: 'w-20 min-w-[80px]', variant: 'sub' },
      { label: 'PDS Prog', width: 'w-20 min-w-[80px]', variant: 'sub' },
      { label: 'Persh Menggk Iuran', width: 'w-28 min-w-[110px]', variant: 'sub' },
      { label: 'Lain-lain', width: 'w-20 min-w-[80px]', variant: 'sub' },
    ],
  ],

  // Tepat 10 baris KLUI: nomor 1 sampai 10, Sektor/KLUI berisi 1, 2, 3, 4, 5, 6, 7, 8, 9, 0
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
    { id_klui: 10, no: 10, sektor_klui: '0', label: '0', nama_sektor: 'Kegiatan yang Belum Jelas Batasannya' },
  ],

  numericFields: K9A_NUMERIC_FIELDS,

  textField: {
    key: 'keterangan',
    apiKey: 'keterangan',
    label: 'Ket',
    placeholder: 'Keterangan...',
  },

  // Triwulan: SEMUA 19 kolom angka otomatis dan terkunci; Ket tetap bisa diisi
  triwulanConfig: {
    allNumericLocked: true,
    autoSumFields: [
      'jmlMelanggar', 'jmlNota', 'wlk', 'wkwi', 'tka', 'tki', 'ump',
      'upahLemb', 'thr', 'cutiTahun', 'cutiHaid', 'ppPkb', 'p4', 'pwbd',
      'pdsTk', 'pdsUpah', 'pdsProg', 'menggkIuran', 'lain',
    ],
    editableFields: ['keterangan'],
    infoText: 'Triwulan dihitung otomatis dari laporan bulanan, jadi kolom angka tidak bisa diedit. Kolom Ket tetap bisa diisi.',
  },

  columnDescriptionTitle: 'Keterangan',
  columnDescriptions: K9A_DESCRIPTIONS,
}
