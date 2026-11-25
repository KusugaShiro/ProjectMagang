/**
 * Definisi Konfigurasi Form K9b: PELANGGARAN NORMA K3
 * Rekapitulasi Pelanggaran Norma Keselamatan & Kesehatan Kerja (10 Sektor: 1-9 & 0)
 * Header TIGA tingkat, tanpa kartu Keterangan
 * Berdasarkan DDL & Model RekapK9bPelanggaranK3 (rekap_k9b_pelanggaran_k3)
 */

export const K9B_NUMERIC_FIELDS = [
  { key: 'p2k3', apiKey: 'pelanggaran_p2k3', label: 'P2K3', width: 'w-16 min-w-[65px]' },
  { key: 'ahli', apiKey: 'pelanggaran_ahli_k3', label: 'Ahli K3', width: 'w-16 min-w-[68px]' },
  { key: 'pjk3', apiKey: 'pelanggaran_pjk3', label: 'PJK3', width: 'w-16 min-w-[65px]' },
  { key: 'klinik', apiKey: 'pelanggaran_klinik_perusahaan', label: 'Klinik Persh./Pely. Kes. K', width: 'w-32 min-w-[130px]' },
  { key: 'katering', apiKey: 'pelanggaran_katering_makanan', label: 'Katering Pengelola Makanan', width: 'w-32 min-w-[130px]' },
  { key: 'pestisida', apiKey: 'pelanggaran_pestisida', label: 'Pengl. Pestisida', width: 'w-24 min-w-[95px]' },
  { key: 'operator', apiKey: 'pelanggaran_operator_teknisi', label: 'Operator/Teknisi/Petugas', width: 'w-32 min-w-[130px]' },
  { key: 'dokter', apiKey: 'pelanggaran_dokter_perusahaan', label: 'Dokter Persh', width: 'w-24 min-w-[95px]' },
  { key: 'paramedis', apiKey: 'pelanggaran_paramedis', label: 'Paramedis Perusahaan', width: 'w-28 min-w-[115px]' },
  { key: 'dokterPktk', apiKey: 'pelanggaran_dokter_pktk', label: 'Dokter PKTK', width: 'w-24 min-w-[95px]' },
  { key: 'kesAwal', apiKey: 'rikkes_k3_awal', label: 'Awal', width: 'w-16 min-w-[68px]' },
  { key: 'kesBerkala', apiKey: 'rikkes_k3_berkala', label: 'Berkala', width: 'w-20 min-w-[75px]' },
  { key: 'kesKhusus', apiKey: 'rikkes_k3_khusus', label: 'Khusus', width: 'w-20 min-w-[75px]' },
  { key: 'lain', apiKey: 'pelanggaran_lain_lain', label: 'Lain-lain', width: 'w-20 min-w-[80px]' },
]

export const formK9b = {
  kode: 'K9b',
  modul: 'k9b',
  tabel_db: 'rekap_k9b_pelanggaran_k3',
  judul: 'PELANGGARAN NORMA K3',
  subjudul: 'Rekapitulasi Pelanggaran Norma Keselamatan & Kesehatan Kerja',
  tableCardTitlePrefix: '2. Isi data pelanggaran norma - K9b',
  keyField: 'id_klui',
  secondColumnHeader: 'Sektor/KLUI',

  // Header TIGA tingkat
  headerRows: [
    // Tingkat 1
    [
      { label: 'No', rowspan: 3, sticky: 'left-0', width: 'w-12 min-w-[48px]', variant: 'primary' },
      { label: 'Sektor/KLUI', rowspan: 3, sticky: 'left-12', width: 'w-24 min-w-[90px]', variant: 'primary' },
      { label: 'Jenis Pelanggaran Norma K3', colspan: 14, variant: 'group' },
      { label: 'Ket', rowspan: 3, width: 'w-48 min-w-[180px]', variant: 'primary' },
    ],
    // Tingkat 2
    [
      { label: 'P2K3', rowspan: 2, width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'Ahli K3', rowspan: 2, width: 'w-16 min-w-[68px]', variant: 'sub' },
      { label: 'PJK3', rowspan: 2, width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'Klinik Persh./Pely. Kes. K', rowspan: 2, width: 'w-32 min-w-[130px]', variant: 'sub' },
      { label: 'Katering Pengelola Makanan', rowspan: 2, width: 'w-32 min-w-[130px]', variant: 'sub' },
      { label: 'Pengl. Pestisida', rowspan: 2, width: 'w-24 min-w-[95px]', variant: 'sub' },
      { label: 'Operator/Teknisi/Petugas', rowspan: 2, width: 'w-32 min-w-[130px]', variant: 'sub' },
      { label: 'Dokter Persh', rowspan: 2, width: 'w-24 min-w-[95px]', variant: 'sub' },
      { label: 'Paramedis Perusahaan', rowspan: 2, width: 'w-28 min-w-[115px]', variant: 'sub' },
      { label: 'Dokter PKTK', rowspan: 2, width: 'w-24 min-w-[95px]', variant: 'sub' },
      { label: 'Pemeriksaan Kesehatan K3', colspan: 3, variant: 'group' },
      { label: 'Lain-lain', rowspan: 2, width: 'w-20 min-w-[80px]', variant: 'sub' },
    ],
    // Tingkat 3 (di bawah Pemeriksaan Kesehatan K3)
    [
      { label: 'Awal', width: 'w-16 min-w-[68px]', variant: 'leaf' },
      { label: 'Berkala', width: 'w-20 min-w-[75px]', variant: 'leaf' },
      { label: 'Khusus', width: 'w-20 min-w-[75px]', variant: 'leaf' },
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

  numericFields: K9B_NUMERIC_FIELDS,

  textField: {
    key: 'keterangan',
    apiKey: 'keterangan',
    label: 'Ket',
    placeholder: 'Keterangan...',
  },

  // Triwulan: SEMUA 14 kolom angka otomatis dan terkunci; Ket tetap bisa diisi
  triwulanConfig: {
    allNumericLocked: true,
    autoSumFields: [
      'p2k3', 'ahli', 'pjk3', 'klinik', 'katering', 'pestisida', 'operator',
      'dokter', 'paramedis', 'dokterPktk', 'kesAwal', 'kesBerkala', 'kesKhusus', 'lain',
    ],
    editableFields: ['keterangan'],
    infoText: 'Rekap otomatis 3 bulan dari laporan bulanan, sehingga kolom angka terkunci. Kolom Keterangan tetap dapat diisi.',
  },

  // K9b TIDAK punya kartu "Keterangan"
}
