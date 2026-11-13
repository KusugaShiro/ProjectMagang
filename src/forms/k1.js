/**
 * Definisi Konfigurasi Form K1: DATA PEGAWAI PENGAWAS KETENAGAKERJAAN
 * Menyesuaikan Tabel Spesifikasi Kolom Modul K1 (Dokumentasi Kontrak API Backend Halaman 8-9)
 */

export const SPESIALIS_FIELDS = [
  { id: 1, key: 'spesialis_1_pesawat_uap_bejana_tekan', label: '1', text: 'Pesawat Uap, Bejana Tekan' },
  { id: 2, key: 'spesialis_2_pesawat_angkat_angkut', label: '2', text: 'Pesawat Angkat - Angkut' },
  { id: 3, key: 'spesialis_3_pesawat_tenaga_produksi', label: '3', text: 'Pesawat Tenaga dan Produksi' },
  { id: 4, key: 'spesialis_4_instalasi_listrik_lift', label: '4', text: 'Instalasi Listrik, Lift' },
  { id: 5, key: 'spesialis_5_penanggulangan_kebakaran', label: '5', text: 'Penanggulangan Kebakaran' },
  { id: 6, key: 'spesialis_6_konstruksi_bangunan', label: '6', text: 'Konstruksi Bangunan' },
  { id: 7, key: 'spesialis_7_kesehatan_kerja', label: '7', text: 'Kesehatan Kerja' },
  { id: 8, key: 'spesialis_8_lingkungan_kerja', label: '8', text: 'Lingkungan Kerja' },
  { id: 9, key: 'spesialis_9_jamsostek', label: '9', text: 'Jamsostek' },
  { id: 10, key: 'spesialis_10_pengupahan_waktu_kerja', label: '10', text: 'Pengupahan dan Waktu Kerja' },
  { id: 11, key: 'spesialis_11_keselamatan_kerja_kimia', label: '11', text: 'Keselamatan Kerja Kimia' },
]

export const formK1 = {
  kode: 'K1',
  modul: 'k1',
  judul: 'DATA PEGAWAI PENGAWAS KETENAGAKERJAAN',
  subjudul: 'Formulir K1 Data Pegawai Pengawas Ketenagakerjaan Berdasarkan Jabatan dan Spesialisasi',

  // Master baris jabatan (6 baris untuk K1 + 2 baris grup)
  rows: [
    // Grup 1: Terampil/SLA
    { id_jabatan: null, no: '1', label: 'Terampil/SLA', isGroup: true },
    { id_jabatan: 1, no: 'a', label: 'Pelaksana', isGroup: false },
    { id_jabatan: 2, no: 'b', label: 'Pelaksana Lanjutan', isGroup: false },
    { id_jabatan: 3, no: 'c', label: 'Penyelia', isGroup: false },

    // Grup 2: Ahli/S1-S2
    { id_jabatan: null, no: '2', label: 'Ahli/S1-S2', isGroup: true },
    { id_jabatan: 4, no: 'a', label: 'Pertama', isGroup: false },
    { id_jabatan: 5, no: 'b', label: 'Muda', isGroup: false },
    { id_jabatan: 6, no: 'c', label: 'Madya', isGroup: false },
  ],

  // Kolom-kolom spesialis
  spesialisFields: SPESIALIS_FIELDS,

  // Aturan Komputasi Baris: Jumlah = jml_umum + seluruh spesialis 1 s.d. 11 (jml_ppns TIDAK ikut)
  hitungJumlahBaris: (rowValues) => {
    const umum = Number(rowValues?.jml_umum) || 0
    let totalSpesialis = 0
    SPESIALIS_FIELDS.forEach(sf => {
      totalSpesialis += Number(rowValues?.[sf.key]) || 0
    })
    return umum + totalSpesialis
  },

  // Keterangan nomor kolom spesialis
  specialistDescriptions: SPESIALIS_FIELDS.map(f => ({ id: f.id, text: f.text })),
}
