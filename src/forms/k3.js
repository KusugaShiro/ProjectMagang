/**
 * Definisi Konfigurasi Form K3: OBYEK PENGAWASAN K3
 * Berdasarkan PRD Database rekap_k3_obyek_k3 & Kontrak REST API Modul K3
 */

// 12 Kolom Angka K3
export const K3_NUMERIC_FIELDS = [
  { key: 'pesawat_uap', label: 'Pesawat Uap', width: 'w-24 min-w-[95px]' },
  { key: 'bejana_tekan', label: 'BT', width: 'w-16 min-w-[65px]', fullLabel: 'Bejana Tekan' },
  { key: 'pesawat_angkat_angkut', label: 'PAA', width: 'w-16 min-w-[65px]', fullLabel: 'Pesawat Angkat - Angkut' },
  { key: 'pesawat_tenaga_produksi', label: 'PTP', width: 'w-16 min-w-[65px]', fullLabel: 'Pesawat Tenaga dan Produksi' },
  { key: 'kelistrikan', label: 'KLISTRKAN', width: 'w-24 min-w-[95px]', fullLabel: 'Instalasi Listrik / Lift' },
  { key: 'pencegahan_kebakaran', label: 'Pencegahan Kebakaran', width: 'w-36 min-w-[145px]', fullLabel: 'Pencegahan dan Penanggulangan Kebakaran' },
  { key: 'kesehatan_kerja', label: 'Kesehatan Kerja', width: 'w-28 min-w-[110px]', fullLabel: 'Kesehatan Kerja' },
  { key: 'konstruksi_bangunan', label: 'Konst. Bangunan', width: 'w-28 min-w-[115px]', fullLabel: 'Konstruksi Bangunan' },
  { key: 'lingkungan_kerja', label: 'Lingk. Kerja', width: 'w-24 min-w-[95px]', fullLabel: 'Lingkungan Kerja' },
  { key: 'sarana_k3', label: 'Sarana K3', width: 'w-20 min-w-[85px]', fullLabel: 'Sarana K3' },
  { key: 'operator_teknisi_petugas', label: 'Operator/Teknisi/Petugas', width: 'w-36 min-w-[155px]', fullLabel: 'Operator / Teknisi / Petugas' },
  { key: 'perusahaan_jasa_k3', label: 'Pers. Jasa K3', width: 'w-24 min-w-[95px]', fullLabel: 'Personil Jasa K3' },
]

export const formK3 = {
  kode: 'K3',
  modul: 'k3',
  tabel_db: 'rekap_k3_obyek_k3',
  judul: 'OBYEK PENGAWASAN K3',
  subjudul: 'Data Obyek Pengawasan Norma Keselamatan dan Kesehatan Kerja (K3)',
  keyField: 'id_klui',
  secondColumnHeader: 'Sektor/KLUI',
  headerMode: 'single', // Header SATU tingkat (bukan dua tingkat)

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

  numericFields: K3_NUMERIC_FIELDS,
  textField: {
    key: 'keterangan',
    label: 'Ket.',
    placeholder: 'Keterangan...',
    width: 'w-48 min-w-[180px]',
  },

  // Keterangan kolom persis sesuai ketentuan instruksi
  columnDescriptions: [
    { label: 'Pesawat Uap', text: 'Pesawat Uap' },
    { label: 'BT', text: 'Bejana Tekan' },
    { label: 'PAA', text: 'Pesawat Angkat - Angkut' },
    { label: 'PTP', text: 'Pesawat Tenaga dan Produksi' },
    { label: 'KLISTRKAN', text: 'Instalasi Listrik / Lift' },
    { label: 'Pencegahan Kebakaran', text: 'Pencegahan dan Penanggulangan Kebakaran' },
    { label: 'Kesehatan Kerja', text: 'Kesehatan Kerja' },
    { label: 'Konst. Bangunan', text: 'Konstruksi Bangunan' },
    { label: 'Lingk. Kerja', text: 'Lingkungan Kerja' },
    { label: 'Sarana K3', text: 'Sarana K3' },
    { label: 'Operator/Teknisi/Petugas', text: 'Operator / Teknisi / Petugas' },
    { label: 'Pers. Jasa K3', text: 'Personil Jasa K3' },
    { label: 'Ket', text: 'Keterangan' },
  ],
}
