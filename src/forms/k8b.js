/**
 * Definisi Konfigurasi Form K8b: KECELAKAAN KERJA & PAK (b)
 * Menurut Sumber Kecelakaan (Sumber A s.d. R)
 * Berdasarkan DDL & Model RekapK8bKecelakaanSumber (rekap_k8b_kecelakaan_sumber)
 */

export const K8B_NUMERIC_FIELDS = [
  { key: 'sa', apiKey: 'sumber_a_mesin', label: 'A', width: 'w-14 min-w-[56px]' },
  { key: 'sb', apiKey: 'sumber_b_penggerak_mula_pompa', label: 'B', width: 'w-14 min-w-[56px]' },
  { key: 'sc', apiKey: 'sumber_c_lift', label: 'C', width: 'w-14 min-w-[56px]' },
  { key: 'sd', apiKey: 'sumber_d_pesawat_angkat', label: 'D', width: 'w-14 min-w-[56px]' },
  { key: 'se', apiKey: 'sumber_e_conveyor', label: 'E', width: 'w-14 min-w-[56px]' },
  { key: 'sf', apiKey: 'sumber_f_pesawat_angkut', label: 'F', width: 'w-14 min-w-[56px]' },
  { key: 'sg', apiKey: 'sumber_g_transmisi_mekanik', label: 'G', width: 'w-14 min-w-[56px]' },
  { key: 'sh', apiKey: 'sumber_h_perkakas_tangan', label: 'H', width: 'w-14 min-w-[56px]' },
  { key: 'si', apiKey: 'sumber_i_pesawat_uap_bejana_tekan', label: 'I', width: 'w-14 min-w-[56px]' },
  { key: 'sj', apiKey: 'sumber_j_peralatan_listrik', label: 'J', width: 'w-14 min-w-[56px]' },
  { key: 'sk', apiKey: 'sumber_k_bahan_kimia', label: 'K', width: 'w-14 min-w-[56px]' },
  { key: 'sl', apiKey: 'sumber_l_debu_berbahaya', label: 'L', width: 'w-14 min-w-[56px]' },
  { key: 'sm', apiKey: 'sumber_m_radiasi_radioaktif', label: 'M', width: 'w-14 min-w-[56px]' },
  { key: 'sn', apiKey: 'sumber_n_faktor_lingkungan', label: 'N', width: 'w-14 min-w-[56px]' },
  { key: 'so', apiKey: 'sumber_o_bahan_mudah_terbakar', label: 'O', width: 'w-14 min-w-[56px]' },
  { key: 'sp', apiKey: 'sumber_p_binatang', label: 'P', width: 'w-14 min-w-[56px]' },
  { key: 'sq', apiKey: 'sumber_q_permukaan_lantai_kerja', label: 'Q', width: 'w-14 min-w-[56px]' },
  { key: 'sr', apiKey: 'sumber_r_lain_lain', label: 'R', width: 'w-14 min-w-[56px]' },
]

export const K8B_DESCRIPTIONS = [
  { label: 'A', text: 'Mesin (mesin pons, mesin pres, gergaji, mesin bor, mesin tenun dll.)' },
  { label: 'B', text: 'Penggerak mula dan pompa (motor bakar, pompa angin/kompresor, pompa air, kipas angin, penghisap udara dll.)' },
  { label: 'C', text: 'Lift' },
  { label: 'D', text: 'Pesawat Angkat' },
  { label: 'E', text: 'Conveyor' },
  { label: 'F', text: 'Pesawat Angkut' },
  { label: 'G', text: 'Alat Transmisi Mekanik (rantai, pulley dll.)' },
  { label: 'H', text: 'Perkakas Kerja Tangan' },
  { label: 'I', text: 'Pesawat Uap dan Bejana Tekan' },
  { label: 'J', text: 'Peralatan Listrik' },
  { label: 'K', text: 'Bahan Kimia' },
  { label: 'L', text: 'Debu Berbahaya' },
  { label: 'M', text: 'Radiasi dan Bahan Radio Aktif' },
  { label: 'N', text: 'Faktor Lingkungan (iklim kerja, tekanan udara, getaran, bising, cahaya dll.)' },
  { label: 'O', text: 'Bahan Mudah Terbakar dan Benda Panas (lak film, minyak, kertas kapuk, uap dll.)' },
  { label: 'P', text: 'Binatang' },
  { label: 'Q', text: 'Permukaan Lantai Kerja' },
  { label: 'R', text: 'Lain-lain' },
]

export const formK8b = {
  kode: 'K8b',
  modul: 'k8b',
  tabel_db: 'rekap_k8b_kecelakaan_sumber',
  judul: 'KECELAKAAN KERJA & PAK (b)',
  subjudul: 'Data Kecelakaan Kerja & PAK Menurut Sumber Kecelakaan (Sumber A s.d. R)',
  tableCardTitlePrefix: '2. Isi data kecelakaan kerja dan PAK - K8b',
  keyField: 'id_klui',
  secondColumnHeader: 'Sektor/KLUI',

  // Header DUA tingkat
  headerRows: [
    // Tingkat 1
    [
      { label: 'No', rowspan: 2, sticky: 'left-0', width: 'w-12 min-w-[48px]', variant: 'primary' },
      { label: 'Sektor/KLUI', rowspan: 2, sticky: 'left-12', width: 'w-24 min-w-[90px]', variant: 'primary' },
      { label: 'Sumber Kecelakaan Kerja', colspan: 18, variant: 'group' },
      { label: 'Ket', rowspan: 2, width: 'w-48 min-w-[180px]', variant: 'primary' },
    ],
    // Tingkat 2 (18 sub-kolom A s.d. R)
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
      { label: 'K', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'L', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'M', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'N', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'O', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'P', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'Q', width: 'w-14 min-w-[56px]', variant: 'sub' },
      { label: 'R', width: 'w-14 min-w-[56px]', variant: 'sub' },
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

  numericFields: K8B_NUMERIC_FIELDS,

  textField: {
    key: 'keterangan',
    apiKey: 'keterangan',
    label: 'Ket',
    placeholder: 'Keterangan...',
  },

  // Triwulan: SEMUA kolom angka otomatis dan terkunci; Ket tetap bisa diisi
  triwulanConfig: {
    allNumericLocked: true,
    autoSumFields: ['sa', 'sb', 'sc', 'sd', 'se', 'sf', 'sg', 'sh', 'si', 'sj', 'sk', 'sl', 'sm', 'sn', 'so', 'sp', 'sq', 'sr'],
    editableFields: ['keterangan'],
    infoText: 'Triwulan dihitung otomatis dari laporan bulanan, jadi kolom angka tidak bisa diedit. Kolom Ket tetap bisa diisi.',
  },

  columnDescriptionTitle: 'Keterangan',
  columnDescriptions: K8B_DESCRIPTIONS,
}
