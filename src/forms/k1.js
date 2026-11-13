/**
 * Definisi Konfigurasi Form K1: DATA PEGAWAI PENGAWAS KETENAGAKERJAAN
 */

export const formK1 = {
  kode: 'K1',
  judul: 'DATA PEGAWAI PENGAWAS KETENAGAKERJAAN',
  subjudul: 'Formulir K1 Data Pegawai Pengawas Ketenagakerjaan Berdasarkan Jabatan dan Spesialisasi',

  // Definisi Kolom Tabel
  columns: [
    { key: 'no', label: 'No', type: 'label', width: 'w-14 min-w-[56px]', sticky: true, stickyOffset: 'left-0' },
    { key: 'jabatan', label: 'Jabatan', type: 'label', width: 'w-56 min-w-[220px]', sticky: true, stickyOffset: 'left-14' },
    { key: 'umum', label: 'Umum', type: 'number', width: 'w-20 min-w-[80px]' },
    // Spesialis 1 - 11
    ...Array.from({ length: 11 }, (_, i) => ({
      key: `spesialis_${i + 1}`,
      label: `${i + 1}`,
      subLabel: `Spesialis ${i + 1}`,
      type: 'number',
      width: 'w-16 min-w-[64px]',
      isSpesialis: true,
    })),
    { key: 'jumlah', label: 'Jumlah', type: 'computed', width: 'w-24 min-w-[96px]' },
    { key: 'ppns', label: 'PPNS', type: 'number', width: 'w-20 min-w-[80px]' },
    { key: 'ket', label: 'Ket.', type: 'text', width: 'w-48 min-w-[190px]' },
  ],

  // Grup Header Spesialis di atas kolom 1 - 11
  hasHeaderGroup: true,
  headerGroups: [
    { label: 'No', colspan: 1, rowspan: 2, sticky: true, stickyOffset: 'left-0' },
    { label: 'Jabatan', colspan: 1, rowspan: 2, sticky: true, stickyOffset: 'left-14' },
    { label: 'Umum', colspan: 1, rowspan: 2 },
    { label: 'Spesialis', colspan: 11, rowspan: 1 },
    { label: 'Jumlah', colspan: 1, rowspan: 2 },
    { label: 'PPNS', colspan: 1, rowspan: 2 },
    { label: 'Ket.', colspan: 1, rowspan: 2 },
  ],

  // Definisi Baris Tabel
  rows: [
    // Grup 1
    { id: 'group_terampil', no: '1', label: 'Terampil/SLA', isGroup: true },
    { id: 'pelaksana', no: 'a', label: 'Pelaksana', isGroup: false },
    { id: 'pelaksana_lanjutan', no: 'b', label: 'Pelaksana Lanjutan', isGroup: false },
    { id: 'penyelia', no: 'c', label: 'Penyelia', isGroup: false },

    // Grup 2
    { id: 'group_ahli', no: '2', label: 'Ahli/S1-S2', isGroup: true },
    { id: 'pertama', no: 'a', label: 'Pertama', isGroup: false },
    { id: 'muda', no: 'b', label: 'Muda', isGroup: false },
    { id: 'madya', no: 'c', label: 'Madya', isGroup: false },
  ],

  // Aturan Komputasi Baris: Jumlah = Umum + Spesialis 1 s.d. 11 (PPNS TIDAK ikut)
  hitungJumlahBaris: (rowValues) => {
    const umum = Number(rowValues?.umum) || 0
    let totalSpesialis = 0
    for (let i = 1; i <= 11; i++) {
      totalSpesialis += Number(rowValues?.[`spesialis_${i}`]) || 0
    }
    return umum + totalSpesialis
  },

  // Keterangan nomor kolom spesialis
  specialistDescriptions: [
    { id: 1, text: 'Pesawat Uap, Bejana Tekan' },
    { id: 2, text: 'Pesawat Angkat - Angkut' },
    { id: 3, text: 'Pesawat Tenaga dan Produksi' },
    { id: 4, text: 'Instalasi Listrik, Lift' },
    { id: 5, text: 'Penanggulangan Kebakaran' },
    { id: 6, text: 'Konstruksi Bangunan' },
    { id: 7, text: 'Kesehatan Kerja' },
    { id: 8, text: 'Lingkungan Kerja' },
    { id: 9, text: 'Jamsostek' },
    { id: 10, text: 'Pengupahan dan Waktu Kerja' },
    { id: 11, text: 'Keselamatan Kerja Kimia' },
  ],
}
