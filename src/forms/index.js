import { formK1 } from './k1'
import { formK2 } from './k2'
import { formK3 } from './k3'
import { formK4 } from './k4'

/**
 * Daftar Modul Matriks K1 s.d. K10
 * Disesuaikan dengan PRD Database Rekapitulasi Pengawasan & K3:
 * - 20 Tabel Model Data (DDL schema_rekap_k3.sql)
 * - 2 Logika Agregasi Triwulan: Snapshot (K1-K4) vs SUM 3 Bulan (K5-K10)
 */
export const formList = [
  {
    kode: 'K1',
    nama: 'Data Pegawai Pengawas',
    detail: 'Data Pegawai Pengawas Ketenagakerjaan Berdasarkan Jabatan & Spesialisasi',
    tabel_db: 'rekap_k1_pegawai',
    dimensi: 'jabatan (6 baris)',
    mode_triwulan: 'snapshot',
    deskripsi_triwulan: 'Posisi bulan terakhir triwulan (Bulan 3/6/9/12)',
  },
  {
    kode: 'K2',
    nama: 'Data Obyek Pengawasan',
    detail: 'Data Obyek Pengawasan Ketenagakerjaan Menurut Sektor KLUI',
    tabel_db: 'rekap_k2_obyek_pengawasan',
    dimensi: 'klui (10 baris)',
    mode_triwulan: 'snapshot',
    deskripsi_triwulan: 'Posisi bulan terakhir triwulan',
  },
  {
    kode: 'K3',
    nama: 'Obyek Pengawasan K3',
    detail: 'Data Obyek Pengawasan Norma Keselamatan dan Kesehatan Kerja (K3)',
    tabel_db: 'rekap_k3_obyek_k3',
    dimensi: 'klui (10 baris)',
    mode_triwulan: 'snapshot',
    deskripsi_triwulan: 'Posisi bulan terakhir triwulan',
  },
  {
    kode: 'K4',
    nama: 'Data Jamsostek - BPJS',
    detail: 'Data Kepesertaan Jaminan Sosial Tenaga Kerja & BPJS Kesehatan',
    tabel_db: 'rekap_k4_jamsostek_bpjs',
    dimensi: 'klui (10 baris)',
    mode_triwulan: 'snapshot',
    deskripsi_triwulan: 'Posisi bulan terakhir triwulan (auto-fill dari K2)',
  },
  {
    kode: 'K5',
    nama: 'Kegiatan Pemeriksaan (APBN)',
    detail: 'Laporan Kegiatan Pemeriksaan Sumber Dana APBN',
    tabel_db: 'rekap_k5_pemeriksaan',
    dimensi: 'jabatan (2 baris)',
    mode_triwulan: 'sum',
    deskripsi_triwulan: 'Jumlah akumulasi 3 bulan (pengawas = snapshot)',
  },
  {
    kode: 'K6',
    nama: 'Pemeriksaan Rinci (APBN)',
    detail: 'Laporan Rincian Pemeriksaan APBN (Matriks 3D Jabatan x KLUI x 3 Pemeriksaan)',
    tabel_db: 'rekap_k6_pemeriksaan_header',
    tabel_detail: 'rekap_k6_pemeriksaan_detail_klui',
    dimensi: '3D (4 jabatan x 10 KLUI)',
    mode_triwulan: 'sum',
    deskripsi_triwulan: 'Jumlah akumulasi 3 bulan',
  },
  {
    kode: 'K7',
    nama: 'Penerbitan Perizinan K3',
    detail: 'Penerbitan Surat Keterangan / Perizinan K3 Menurut Sektor Usaha',
    tabel_db: 'rekap_k7_perizinan_k3',
    dimensi: 'klui (10 baris)',
    mode_triwulan: 'sum',
    deskripsi_triwulan: 'Jumlah akumulasi 3 bulan',
  },
  {
    kode: 'K8a',
    nama: 'Kecelakaan Kerja & PAK (a)',
    detail: 'Data Kecelakaan Kerja & PAK Menurut Tipe Kecelakaan (Tipe A s.d. J)',
    tabel_db: 'rekap_k8a_kecelakaan_tipe',
    dimensi: 'klui (10 baris)',
    mode_triwulan: 'sum',
    deskripsi_triwulan: 'Jumlah akumulasi 3 bulan',
  },
  {
    kode: 'K8b',
    nama: 'Kecelakaan Kerja & PAK (b)',
    detail: 'Data Kecelakaan Kerja & PAK Menurut Sumber Kecelakaan (Sumber A s.d. R)',
    tabel_db: 'rekap_k8b_kecelakaan_sumber',
    dimensi: 'klui (10 baris)',
    mode_triwulan: 'sum',
    deskripsi_triwulan: 'Jumlah akumulasi 3 bulan',
  },
  {
    kode: 'K8c',
    nama: 'Kecelakaan Kerja & PAK (c)',
    detail: 'Data Akibat Kecelakaan Kerja, Kerugian Jam Kerja & Santunan Biaya',
    tabel_db: 'rekap_k8c_kecelakaan_akibat',
    dimensi: 'klui (10 baris)',
    mode_triwulan: 'sum',
    deskripsi_triwulan: 'Jumlah akumulasi 3 bulan',
  },
  {
    kode: 'K9a',
    nama: 'Pelanggaran Norma Kerja',
    detail: 'Rekapitulasi Pelanggaran Norma Ketenagakerjaan per Sektor KLUI',
    tabel_db: 'rekap_k9a_pelanggaran_kerja',
    dimensi: 'klui (10 baris)',
    mode_triwulan: 'sum',
    deskripsi_triwulan: 'Jumlah akumulasi 3 bulan',
  },
  {
    kode: 'K9b',
    nama: 'Pelanggaran Norma K3',
    detail: 'Rekapitulasi Pelanggaran Norma Keselamatan & Kesehatan Kerja',
    tabel_db: 'rekap_k9b_pelanggaran_k3',
    dimensi: 'klui (10 baris)',
    mode_triwulan: 'sum',
    deskripsi_triwulan: 'Jumlah akumulasi 3 bulan',
  },
  {
    kode: 'K10',
    nama: 'Penyidikan PPNS',
    detail: 'Laporan Proses Penyidikan Tindak Pidana Ketenagakerjaan oleh PPNS',
    tabel_db: 'rekap_k10_penyidikan',
    dimensi: 'klui (10 baris)',
    mode_triwulan: 'sum',
    deskripsi_triwulan: 'Jumlah akumulasi 3 bulan',
  },
]

export const formConfigs = {
  K1: formK1,
  K2: formK2,
  K3: formK3,
  K4: formK4,
}

export function getFormConfig(kode) {
  if (!kode) return null
  return formConfigs[kode.toUpperCase()] || null
}

export function getFormMeta(kode) {
  if (!kode) return null
  return formList.find(f => f.kode.toUpperCase() === kode.toUpperCase()) || null
}
