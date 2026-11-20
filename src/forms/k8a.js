/**
 * Definisi Konfigurasi Form K8a: KECELAKAAN KERJA & PAK (a)
 * Menurut Tipe Kecelakaan (Tipe A s.d. J)
 * Berdasarkan DDL & Model RekapK8aKecelakaanTipe (rekap_k8a_kecelakaan_tipe)
 */

export const K8A_NUMERIC_FIELDS = [
  { key: 'jmlKecl', apiKey: 'jml_kecelakaan', label: 'Jml. Kecl.', width: 'w-24 min-w-[90px]' },
  { key: 'jmlKorban', apiKey: 'jml_korban', label: 'Jml. Korban', width: 'w-24 min-w-[90px]' },
  { key: 'keracunan', apiKey: 'jml_keracunan', label: 'Keracunan', width: 'w-24 min-w-[90px]' },
  { key: 'pak', apiKey: 'jml_pak', label: 'PAK', width: 'w-20 min-w-[80px]' },
  { key: 'ta', apiKey: 'tipe_a_terbentur', label: 'A', width: 'w-14 min-w-[56px]' },
  { key: 'tb', apiKey: 'tipe_b_terpukul', label: 'B', width: 'w-14 min-w-[56px]' },
  { key: 'tc', apiKey: 'tipe_c_tertangkap_terjepit', label: 'C', width: 'w-14 min-w-[56px]' },
  { key: 'td', apiKey: 'tipe_d_jatuh_ketinggian_sama', label: 'D', width: 'w-14 min-w-[56px]' },
  { key: 'te', apiKey: 'tipe_e_jatuh_ketinggian_beda', label: 'E', width: 'w-14 min-w-[56px]' },
  { key: 'tf', apiKey: 'tipe_f_tergelincir', label: 'F', width: 'w-14 min-w-[56px]' },
  { key: 'tg', apiKey: 'tipe_g_terpapar', label: 'G', width: 'w-14 min-w-[56px]' },
  { key: 'th', apiKey: 'tipe_h_penghisapan_penyerapan', label: 'H', width: 'w-14 min-w-[56px]' },
  { key: 'ti', apiKey: 'tipe_i_tersentuh_listrik', label: 'I', width: 'w-14 min-w-[56px]' },
  { key: 'tj', apiKey: 'tipe_j_lain_lain', label: 'J', width: 'w-14 min-w-[56px]' },
]

export const K8A_DESCRIPTIONS = [
  { label: 'A', text: 'Terbentur (pada umumnya menunjukkan kontak atau persinggungan dengan benda tajam atau benda keras yang mengakibatkan tergores, terpotong, tertusuk dll.)' },
  { label: 'B', text: 'Terpukul (pada umumnya karena jatuh, meluncur, melayang, bergerak dll.)' },
  { label: 'C', text: 'Tertangkap pada, dalam dan diantara benda (terjepit, tergigit, tertimbun, tenggelam dll.)' },
  { label: 'D', text: 'Jatuh karena ketinggian yang sama' },
  { label: 'E', text: 'Jatuh karena ketinggian yang berbeda' },
  { label: 'F', text: 'Tergelincir' },
  { label: 'G', text: 'Terpapar (pada umumnya berhubungan dengan temperatur, tekanan udara, getaran, radiasi suara, cahaya dll.)' },
  { label: 'H', text: 'Penghisapan, penyerapan (menunjukkan proses masuknya bahan atau zat berbahaya kedalam tubuh baik melalui pernapasan ataupun kulit dan yang pada umumnya berakibat sesak nafas, keracunan, mati lemas dll.)' },
  { label: 'I', text: 'Tersentuh aliran listrik' },
  { label: 'J', text: 'Dan lain-lain' },
]

export const formK8a = {
  kode: 'K8a',
  modul: 'k8a',
  tabel_db: 'rekap_k8a_kecelakaan_tipe',
  judul: 'KECELAKAAN KERJA & PAK (a)',
  subjudul: 'Data Kecelakaan Kerja & PAK Menurut Tipe Kecelakaan (Tipe A s.d. J)',
  tableCardTitlePrefix: '2. Isi data kecelakaan kerja dan PAK - K8a',
  keyField: 'id_klui',
  secondColumnHeader: 'Sektor/KLUI',

  // Header DUA tingkat
  headerRows: [
    // Tingkat 1
    [
      { label: 'No', rowspan: 2, sticky: 'left-0', width: 'w-12 min-w-[48px]', variant: 'primary' },
      { label: 'Sektor/KLUI', rowspan: 2, sticky: 'left-12', width: 'w-24 min-w-[90px]', variant: 'primary' },
      { label: 'Jml. Kecl.', rowspan: 2, width: 'w-24 min-w-[90px]', variant: 'primary' },
      { label: 'Jml. Korban', rowspan: 2, width: 'w-24 min-w-[90px]', variant: 'primary' },
      { label: 'Keracunan', rowspan: 2, width: 'w-24 min-w-[90px]', variant: 'primary' },
      { label: 'PAK', rowspan: 2, width: 'w-20 min-w-[80px]', variant: 'primary' },
      { label: 'Tipe Kecelakaan Kerja', colspan: 10, variant: 'group' },
      { label: 'Ket', rowspan: 2, width: 'w-48 min-w-[180px]', variant: 'primary' },
    ],
    // Tingkat 2 (10 sub-kolom A s.d. J)
    [
      { label: 'A', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'B', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'C', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'D', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'E', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'F', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'G', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'H', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'I', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'J', width: 'w-14 min-w-[56px]', variant: 'sub' },
    ],
  ],

  // Tepat 9 baris KLUI: nomor 1 sampai 9, Sektor/KLUI 1 sampai 9 (tidak ada 0)
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

  numericFields: K8A_NUMERIC_FIELDS,

  textField: {
    key: 'keterangan',
    apiKey: 'keterangan',
    label: 'Ket',
    placeholder: 'Keterangan...',
  },

  // Konfigurasi Triwulan K8a: SEMUA kolom angka otomatis dan terkunci; Ket tetap bisa diisi
  triwulanConfig: {
    allNumericLocked: true,
    autoSumFields: ['jmlKecl', 'jmlKorban', 'keracunan', 'pak', 'ta', 'tb', 'tc', 'td', 'te', 'tf', 'tg', 'th', 'ti', 'tj'],
    editableFields: ['keterangan'],
    infoText: 'Triwulan dihitung otomatis dari laporan bulanan, jadi kolom angka tidak bisa diedit. Kolom Ket tetap bisa diisi.',
  },

  // Kartu Keterangan di bagian bawah tabel
  columnDescriptionTitle: 'Keterangan',
  columnDescriptions: K8A_DESCRIPTIONS,
}
