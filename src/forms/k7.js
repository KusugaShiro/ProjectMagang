/**
 * Definisi Konfigurasi Form K7: PENERBITAN PERIZINAN K3
 * Berdasarkan PRD Database rekap_k7_perizinan_k3 & Kontrak REST API Modul K7
 */

// 11 Kolom Angka K7 dengan kunci unik & pemetaan kolom backend
export const K7_NUMERIC_FIELDS = [
  { key: 'pu', apiKey: 'izin_pesawat_uap', label: 'Pes. Uap', width: 'w-20 min-w-[80px]' },
  { key: 'bt', apiKey: 'izin_bejana_tekan', label: 'Bejana Tekan', width: 'w-24 min-w-[95px]' },
  { key: 'paa', apiKey: 'izin_paa', label: 'PAA', width: 'w-16 min-w-[65px]', fullLabel: 'Pesawat Angkat - Angkut' },
  { key: 'ptp', apiKey: 'izin_ptp', label: 'PTP', width: 'w-16 min-w-[65px]', fullLabel: 'Pesawat Tenaga dan Produksi' },
  { key: 'listrik', apiKey: 'izin_listrik', label: 'Listrik', width: 'w-16 min-w-[65px]' },
  { key: 'petir', apiKey: 'izin_petir', label: 'Petir', width: 'w-16 min-w-[65px]' },
  { key: 'kb', apiKey: 'izin_kb', label: 'KB', width: 'w-16 min-w-[65px]' },
  { key: 'klinik', apiKey: 'izin_klinik_perusahaan', label: 'Klinik Persh./Pely.Kes.K', width: 'w-36 min-w-[145px]' },
  { key: 'pestisida', apiKey: 'izin_pengendali_pestisida', label: 'Pengdl. Pestisida', width: 'w-28 min-w-[110px]' },
  { key: 'catering', apiKey: 'izin_catering_makanan_tk', label: 'Catering Makanan TK', width: 'w-32 min-w-[130px]' },
  { key: 'lain', apiKey: 'izin_lain_lain', label: 'Lain-lain', width: 'w-20 min-w-[80px]' },
]

export const formK7 = {
  kode: 'K7',
  modul: 'k7',
  tabel_db: 'rekap_k7_perizinan_k3',
  judul: 'PENERBITAN PERIZINAN K3',
  subjudul: 'Penerbitan Surat Keterangan / Perizinan K3 Menurut Sektor Usaha',
  tableCardTitlePrefix: '2. Isi data penerbitan perizinan K3',
  keyField: 'id_klui',
  secondColumnHeader: 'Sektor/KLUI',

  // Header DUA tingkat
  headerRows: [
    // Tingkat 1
    [
      { label: 'No', rowspan: 2, sticky: 'left-0', width: 'w-12 min-w-[48px]', variant: 'primary' },
      { label: 'Sektor/KLUI', rowspan: 2, sticky: 'left-12', width: 'w-24 min-w-[90px]', variant: 'primary' },
      { label: 'Jumlah Penerbitan Izin K3', colspan: 11, variant: 'group' },
      { label: 'Ket', rowspan: 2, width: 'w-64 min-w-[240px]', variant: 'primary' },
    ],
    // Tingkat 2 (11 sub-kolom)
    [
      { label: 'Pes. Uap', width: 'w-20 min-w-[80px]', variant: 'sub' },
      { label: 'Bejana Tekan', width: 'w-24 min-w-[95px]', variant: 'sub' },
      { label: 'PAA', width: 'w-16 min-w-[65px]', variant: 'sub', fullLabel: 'Pesawat Angkat - Angkut' },
      { label: 'PTP', width: 'w-16 min-w-[65px]', variant: 'sub', fullLabel: 'Pesawat Tenaga dan Produksi' },
      { label: 'Listrik', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'Petir', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'KB', width: 'w-16 min-w-[65px]', variant: 'sub' },
      { label: 'Klinik Persh./Pely.Kes.K', width: 'w-36 min-w-[145px]', variant: 'sub' },
      { label: 'Pengdl. Pestisida', width: 'w-28 min-w-[110px]', variant: 'sub' },
      { label: 'Catering Makanan TK', width: 'w-32 min-w-[130px]', variant: 'sub' },
      { label: 'Lain-lain', width: 'w-20 min-w-[80px]', variant: 'sub' },
    ],
  ],

  // Tepat 9 baris (BUKAN 10), nomor 1 sampai 9, kolom Sektor/KLUI berisi 1, 2, 3, 4, 5, 6, 7, 8, 9 (tidak ada 0)
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

  numericFields: K7_NUMERIC_FIELDS,

  // Kolom Ket BUKAN kotak isian: satu sel teks tetap yang menyatu (rowspan 9)
  staticCell: {
    key: 'keterangan',
    apiKey: 'keterangan',
    text: 'Penerbitan Perijinan K3 Bukan termasuk dalam wewenang dari UPTD',
    rowspan: 9,
    width: 'w-64 min-w-[240px]',
  },

  // Konfigurasi Triwulan: SEMUA 11 kolom angka otomatis dan terkunci, tidak ada yang bisa diisi
  triwulanConfig: {
    allLocked: true,
    autoSumFields: ['pu', 'bt', 'paa', 'ptp', 'listrik', 'petir', 'kb', 'klinik', 'pestisida', 'catering', 'lain'],
    editableFields: [],
    infoText: 'Rekap otomatis 3 bulan dari laporan bulanan, sehingga seluruh kolom terkunci.',
  },

  // K7 TIDAK punya kartu "Keterangan kolom"
}
