/**
 * Definisi Konfigurasi Form K2: DATA OBYEK PENGAWASAN
 * Berdasarkan PRD Database rekap_k2_obyek_pengawasan & Kontrak REST API Modul K2
 */

// 15 Kolom Angka K2 (sesuai RekapK2ObyekPengawasan::KOLOM_ANGKA di REST API)
export const K2_NUMERIC_FIELDS = [
  // Jml Perusahaan
  { key: 'jumlah_perusahaan', label: 'Jml Prsh', group: 'jml_perusahaan', type: 'number', width: 'w-24 min-w-[90px]' },
  // Jml TK: WNI, WNA
  { key: 'jml_tk_wni', label: 'WNI', group: 'jml_tk', type: 'number', width: 'w-20 min-w-[75px]' },
  { key: 'jml_tk_wna', label: 'WNA', group: 'jml_tk', type: 'number', width: 'w-20 min-w-[75px]' },
  // Kategori Prsh: Kecil, Sedang, Besar
  { key: 'kategori_kecil', label: 'Kecil', group: 'kategori_prsh', type: 'number', width: 'w-20 min-w-[75px]' },
  { key: 'kategori_sedang', label: 'Sedang', group: 'kategori_prsh', type: 'number', width: 'w-20 min-w-[75px]' },
  { key: 'kategori_besar', label: 'Besar', group: 'kategori_prsh', type: 'number', width: 'w-20 min-w-[75px]' },
  // Status Perusahaan: Swasta, PMDN, PMA, Joint Venture
  { key: 'status_swasta', label: 'Swasta', group: 'status_perusahaan', type: 'number', width: 'w-20 min-w-[75px]' },
  { key: 'status_pmdn', label: 'PMDN', group: 'status_perusahaan', type: 'number', width: 'w-20 min-w-[75px]' },
  { key: 'status_pma', label: 'PMA', group: 'status_perusahaan', type: 'number', width: 'w-20 min-w-[75px]' },
  { key: 'status_joint_venture', label: 'Joint Venture', group: 'status_perusahaan', type: 'number', width: 'w-24 min-w-[95px]' },
  // Perangkat Hub. Industrial: PP, PKB, SP, Lemb. Bipartit
  { key: 'phi_pp', label: 'PP', group: 'phi', type: 'number', width: 'w-20 min-w-[75px]' },
  { key: 'phi_pkb', label: 'PKB', group: 'phi', type: 'number', width: 'w-20 min-w-[75px]' },
  { key: 'phi_sp', label: 'SP', group: 'phi', type: 'number', width: 'w-20 min-w-[75px]' },
  { key: 'phi_lembaga_bipartit', label: 'Lemb. Bipartit', group: 'phi', type: 'number', width: 'w-24 min-w-[95px]' },
  // Penghargaan K3 (kolom integer sesuai RekapK2ObyekPengawasan)
  { key: 'penghargaan_k3', label: 'Penghargaan K3', group: 'penghargaan_k3', type: 'number', width: 'w-28 min-w-[110px]' },
]

export const formK2 = {
  kode: 'K2',
  modul: 'k2',
  tabel_db: 'rekap_k2_obyek_pengawasan',
  judul: 'DATA OBYEK PENGAWASAN',
  subjudul: 'Data Obyek Pengawasan Ketenagakerjaan Menurut Sektor KLUI',
  keyField: 'id_klui',
  secondColumnHeader: 'Sektor/KLUI',

  // 10 baris tetap: nomor 1 sampai 10, kolom Sektor/KLUI berisi 1, 2, 3, 4, 5, 6, 7, 8, 9, 0
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

  numericFields: K2_NUMERIC_FIELDS,

  // Keterangan kolom persis sesuai ketentuan
  columnDescriptions: [
    { id: 1, text: 'Nomor Urut' },
    { id: 2, text: 'KLUI 1 s.d. 0' },
    { id: 3, text: 'Jumlah Perusahaan' },
    { id: 4, text: 'Jumlah TK WNI' },
    { id: 5, text: 'Jumlah TK WNA' },
    { id: 6, text: 'Kategori Perusahaan Kecil' },
    { id: 7, text: 'Kategori Perusahaan Sedang' },
    { id: 8, text: 'Kategori Perusahaan Besar' },
    { id: 9, text: 'Status Perusahaan Swasta' },
    { id: 10, text: 'Status Perusahaan PMDN' },
    { id: 11, text: 'Status Perusahaan PMA' },
    { id: 12, text: 'Status Perusahaan Joint Venture' },
    { id: 13, text: 'Perangkat Hubungan Industrial (PP)' },
    { id: 14, text: 'Perangkat Hubungan Industrial (PKB)' },
    { id: 15, text: 'Perangkat Hubungan Industrial (SP)' },
    { id: 16, text: 'Perangkat Hubungan Industrial (Lembaga Bipartit)' },
    { id: 17, text: 'Penghargaan K3 yang dimiliki Perusahaan' },
  ],
}
