import { formK1 } from './k1'

export const formList = [
  { kode: 'K1', nama: 'Data Pegawai Pengawas', detail: 'Data Pegawai Pengawas Ketenagakerjaan' },
  { kode: 'K2', nama: 'Data Obyek Pengawasan', detail: 'Data Obyek Pengawasan Ketenagakerjaan' },
  { kode: 'K3', nama: 'Obyek Pengawasan K3', detail: 'Data Obyek Pengawasan K3' },
  { kode: 'K4', nama: 'Data Jamsostek - BPJS', detail: 'Data Kepesertaan Jamsostek - BPJS' },
  { kode: 'K5', nama: 'Kegiatan Pemeriksaan (APBN)', detail: 'Laporan Kegiatan Pemeriksaan Sumber Dana APBN' },
  { kode: 'K6', nama: 'Pemeriksaan Rinci (APBN)', detail: 'Laporan Rincian Pemeriksaan APBN' },
  { kode: 'K7', nama: 'Penerbitan Perizinan K3', detail: 'Penerbitan Surat Keterangan / Perizinan K3' },
  { kode: 'K8a', nama: 'Kecelakaan Kerja & PAK (a)', detail: 'Laporan Kecelakaan Kerja & PAK Bagian (a)' },
  { kode: 'K8b', nama: 'Kecelakaan Kerja & PAK (b)', detail: 'Laporan Kecelakaan Kerja & PAK Bagian (b)' },
  { kode: 'K8c', nama: 'Kecelakaan Kerja & PAK (c)', detail: 'Laporan Kecelakaan Kerja & PAK Bagian (c)' },
  { kode: 'K9a', nama: 'Pelanggaran Norma Kerja', detail: 'Data Pelanggaran Norma Kerja' },
  { kode: 'K9b', nama: 'Pelanggaran Norma K3', detail: 'Data Pelanggaran Norma K3' },
  { kode: 'K10', nama: 'Penyidikan PPNS', detail: 'Laporan Proses Penyidikan Tindak Pidana Ketenagakerjaan PPNS' },
]

export const formConfigs = {
  K1: formK1,
  // Form K2 s.d K10 dapat ditambahkan di sini saat implementasi berikutnya
}

export function getFormConfig(kode) {
  if (!kode) return null
  return formConfigs[kode.toUpperCase()] || null
}

export function getFormMeta(kode) {
  if (!kode) return null
  return formList.find(f => f.kode.toUpperCase() === kode.toUpperCase()) || null
}
