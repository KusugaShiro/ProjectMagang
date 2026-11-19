/**
 * Definisi Konfigurasi Form K4: DATA JAMSOSTEK - BPJS
 * Berdasarkan PRD Database rekap_k4_jamsostek_bpjs & Kontrak REST API Modul K4
 */

// 14 Kolom Angka K4 dengan nama kunci unik & pemetaan ke kolom backend
export const K4_NUMERIC_FIELDS = [
  { key: 'jmlWajib', apiKey: 'jml_perusahaan_wajib', label: 'Wajib', width: 'w-20 min-w-[76px]' },
  { key: 'jmlTerdaftar', apiKey: 'jml_perusahaan_terdaftar', label: 'Terdaftar', width: 'w-20 min-w-[82px]' },
  { key: 'tkWajibWni', apiKey: 'jml_tk_wajib_wni', label: 'WNI', width: 'w-20 min-w-[74px]' },
  { key: 'tkWajibWna', apiKey: 'jml_tk_wajib_wna', label: 'WNA', width: 'w-20 min-w-[74px]' },
  { key: 'tkTerdaftarWni', apiKey: 'jml_tk_terdaftar_wni', label: 'WNI', width: 'w-20 min-w-[74px]' },
  { key: 'tkTerdaftarWna', apiKey: 'jml_tk_terdaftar_wna', label: 'WNA', width: 'w-20 min-w-[74px]' },
  { key: 'jkk', apiKey: 'prog_jkk', label: 'JKK', width: 'w-16 min-w-[68px]' },
  { key: 'jkm', apiKey: 'prog_jkm', label: 'JKM', width: 'w-16 min-w-[68px]' },
  { key: 'jht', apiKey: 'prog_jht', label: 'JHT', width: 'w-16 min-w-[68px]' },
  { key: 'jpkLajang', apiKey: 'prog_jpk_lajang', label: 'Lajang', width: 'w-20 min-w-[74px]' },
  { key: 'jpkKel', apiKey: 'prog_jpk_keluarga', label: 'Kel', width: 'w-20 min-w-[74px]' },
  { key: 'bpjsJumlah', apiKey: 'bpjs_kesehatan_jumlah', label: 'Jumlah', width: 'w-20 min-w-[76px]' },
  { key: 'bpjsLajang', apiKey: 'bpjs_kesehatan_lajang', label: 'Lajang', width: 'w-20 min-w-[74px]' },
  { key: 'bpjsKel', apiKey: 'bpjs_kesehatan_keluarga', label: 'Kel', width: 'w-20 min-w-[74px]' },
]

export const formK4 = {
  kode: 'K4',
  modul: 'k4',
  tabel_db: 'rekap_k4_jamsostek_bpjs',
  judul: 'DATA JAMSOSTEK - BPJS',
  subjudul: 'Data Kepesertaan Jaminan Sosial Tenaga Kerja & BPJS Kesehatan',
  tableCardTitlePrefix: '2. Isi data Jamsostek - BPJS',
  keyField: 'id_klui',
  secondColumnHeader: 'Sektor/KLUI',

  // Header TIGA tingkat (rowspan & colspan)
  headerRows: [
    // Tingkat 1
    [
      { label: 'No', rowspan: 3, sticky: 'left-0', width: 'w-12 min-w-[48px]', variant: 'primary' },
      { label: 'Sektor/KLUI', rowspan: 3, sticky: 'left-12', width: 'w-24 min-w-[90px]', variant: 'primary' },
      { label: 'Jml Perusahaan', colspan: 2, variant: 'group' },
      { label: 'Jumlah TK', colspan: 4, variant: 'group' },
      { label: 'Program Terdaftar', colspan: 5, variant: 'group' },
      { label: 'BPJS Kesehatan', colspan: 3, variant: 'group' },
      { label: 'Ket', rowspan: 3, width: 'w-48 min-w-[180px]', variant: 'primary' },
    ],
    // Tingkat 2
    [
      { label: 'Wajib', rowspan: 2, width: 'w-20 min-w-[76px]', variant: 'sub' },
      { label: 'Terdaftar', rowspan: 2, width: 'w-20 min-w-[82px]', variant: 'sub' },
      { label: 'Wajib', colspan: 2, variant: 'sub' },
      { label: 'Terdaftar', colspan: 2, variant: 'sub' },
      { label: 'JKK', rowspan: 2, width: 'w-16 min-w-[68px]', variant: 'sub' },
      { label: 'JKM', rowspan: 2, width: 'w-16 min-w-[68px]', variant: 'sub' },
      { label: 'JHT', rowspan: 2, width: 'w-16 min-w-[68px]', variant: 'sub' },
      { label: 'JPK', colspan: 2, variant: 'sub' },
      { label: 'Jumlah', rowspan: 2, width: 'w-20 min-w-[76px]', variant: 'sub' },
      { label: 'Lajang', rowspan: 2, width: 'w-20 min-w-[74px]', variant: 'sub' },
      { label: 'Kel', rowspan: 2, width: 'w-20 min-w-[74px]', variant: 'sub' },
    ],
    // Tingkat 3
    [
      { label: 'WNI', width: 'w-20 min-w-[74px]', variant: 'leaf' },
      { label: 'WNA', width: 'w-20 min-w-[74px]', variant: 'leaf' },
      { label: 'WNI', width: 'w-20 min-w-[74px]', variant: 'leaf' },
      { label: 'WNA', width: 'w-20 min-w-[74px]', variant: 'leaf' },
      { label: 'Lajang', width: 'w-20 min-w-[74px]', variant: 'leaf' },
      { label: 'Kel', width: 'w-20 min-w-[74px]', variant: 'leaf' },
    ],
  ],

  // Tepat 10 baris, nomor 1 sampai 10, kolom Sektor/KLUI berisi 1, 2, 3, 4, 5, 6, 7, 8, 9, 0
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

  numericFields: K4_NUMERIC_FIELDS,
  textField: {
    key: 'keterangan',
    label: 'Ket',
    placeholder: 'Keterangan...',
    width: 'w-48 min-w-[180px]',
  },

  // Keterangan kolom persis sesuai ketentuan
  columnDescriptions: [
    { label: 'JKK', text: 'Jaminan Kecelakaan Kerja' },
    { label: 'JKM', text: 'Jaminan Kematian' },
    { label: 'JHT', text: 'Jaminan Hari Tua' },
    { label: 'JPK', text: 'Jaminan Pemeliharaan Kesehatan' },
    { label: 'Lajang', text: 'Peserta lajang (tanpa tanggungan)' },
    { label: 'Kel', text: 'Peserta dengan keluarga' },
  ],
}
