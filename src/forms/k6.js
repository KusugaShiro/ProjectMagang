/**
 * Definisi Konfigurasi Form K6: PEMERIKSAAN RINCI (APBN)
 * Berdasarkan PRD Database rekap_k6_pemeriksaan_header & rekap_k6_pemeriksaan_detail_klui
 */

const pkFields = Array.from({ length: 9 }, (_, i) => ({
  key: `pk${i + 1}`,
  label: `${i + 1}`,
  width: 'w-14 min-w-[56px]',
  fullLabel: `Pertama-Khusus Sektor ${i + 1}`,
}))

const bkFields = Array.from({ length: 9 }, (_, i) => ({
  key: `bk${i + 1}`,
  label: `${i + 1}`,
  width: 'w-14 min-w-[56px]',
  fullLabel: `Berkala Sektor ${i + 1}`,
}))

const ulFields = Array.from({ length: 9 }, (_, i) => ({
  key: `ul${i + 1}`,
  label: `${i + 1}`,
  width: 'w-14 min-w-[56px]',
  fullLabel: `Ulang Sektor ${i + 1}`,
}))

// 32 Kolom Angka K6 dengan kunci unik
export const K6_NUMERIC_FIELDS = [
  { key: 'jumlah', apiKey: 'jumlah_pengawas', label: 'JML', width: 'w-14 min-w-[56px]' },
  ...pkFields,
  ...bkFields,
  ...ulFields,
  { key: 'nket', apiKey: 'norma_ketenagakerjaan', label: 'N. KET', width: 'w-14 min-w-[58px]' },
  { key: 'nk3', apiKey: 'norma_k3', label: 'N. K3', width: 'w-14 min-w-[58px]' },
  { key: 'np1', apiKey: 'np_1', label: 'NP I', width: 'w-14 min-w-[56px]' },
  { key: 'np2', apiKey: 'np_2', label: 'NP II', width: 'w-14 min-w-[56px]' },
]

const K6_AUTO_SUM_FIELDS = K6_NUMERIC_FIELDS.filter(f => f.key !== 'jumlah').map(f => f.key)

export const formK6 = {
  kode: 'K6',
  modul: 'k6',
  tabel_db: 'rekap_k6_pemeriksaan_header',
  judul: 'PEMERIKSAAN RINCI (APBN)',
  subjudul: 'Laporan Rincian Pemeriksaan APBN (Matriks Jabatan x Sektor x Jenis Pemeriksaan)',
  tableCardTitlePrefix: '2. Isi data pemeriksaan rinci',
  rowType: 'jabatan',
  keyField: 'key',
  apiRowKey: 'id_jabatan',
  secondColumnHeader: 'Jabatan Pengawas',

  // Header DUA tingkat (rowspan & colspan)
  headerRows: [
    // Tingkat 1
    [
      { label: 'No', rowspan: 2, sticky: 'left-0', width: 'w-12 min-w-[48px]', variant: 'primary' },
      { label: 'Jabatan Pengawas', rowspan: 2, sticky: 'left-12', width: 'w-44 min-w-[170px]', variant: 'primary' },
      { label: 'JML', rowspan: 2, width: 'w-14 min-w-[56px]', variant: 'group' },
      { label: 'Pertama-Khusus', colspan: 9, variant: 'group' },
      { label: 'Berkala', colspan: 9, variant: 'group' },
      { label: 'Ulang', colspan: 9, variant: 'group' },
      { label: 'N. KET', rowspan: 2, width: 'w-14 min-w-[58px]', variant: 'group' },
      { label: 'N. K3', rowspan: 2, width: 'w-14 min-w-[58px]', variant: 'group' },
      { label: 'NP I', rowspan: 2, width: 'w-14 min-w-[56px]', variant: 'group' },
      { label: 'NP II', rowspan: 2, width: 'w-14 min-w-[56px]', variant: 'group' },
      { label: 'Ket', rowspan: 2, width: 'w-44 min-w-[170px]', variant: 'primary' },
    ],
    // Tingkat 2 (1..9 untuk Pertama-Khusus, 1..9 untuk Berkala, 1..9 untuk Ulang)
    [
      ...pkFields.map(f => ({ label: f.label, width: f.width, variant: 'sub', fullLabel: f.fullLabel })),
      ...bkFields.map(f => ({ label: f.label, width: f.width, variant: 'sub', fullLabel: f.fullLabel })),
      ...ulFields.map(f => ({ label: f.label, width: f.width, variant: 'sub', fullLabel: f.fullLabel })),
    ],
  ],

  // Tepat 4 baris berdasarkan jabatan: 1 = Pertama, 2 = Muda, 3 = Madya, 4 = Terampil
  rows: [
    { key: 'pertama', id_jabatan: 4, no: 1, label: 'Pertama' },
    { key: 'muda', id_jabatan: 5, no: 2, label: 'Muda' },
    { key: 'madya', id_jabatan: 6, no: 3, label: 'Madya' },
    { key: 'terampil', id_jabatan: 7, no: 4, label: 'Terampil' },
  ],

  numericFields: K6_NUMERIC_FIELDS,
  textField: {
    key: 'keterangan',
    label: 'Ket',
    placeholder: 'Keterangan...',
    width: 'w-44 min-w-[170px]',
  },

  // Memakai ulang mekanisme kolom otomatis Triwulan dari K5
  triwulanConfig: {
    autoSumFields: K6_AUTO_SUM_FIELDS,
    lastNonZeroFields: ['jumlah'],
    editableFields: ['jumlah', 'keterangan'],
  },

  // Adapter dari format respons API K6 (3D nested detail_klui atau flat) ke format baris datar 32 kolom
  fromApiRow(item) {
    const flat = {
      jumlah: Number(item.jumlah ?? item.jumlah_pengawas) || 0,
      nket: Number(item.nket ?? item.norma_ketenagakerjaan) || 0,
      nk3: Number(item.nk3 ?? item.norma_k3) || 0,
      np1: Number(item.np1 ?? item.np_1) || 0,
      np2: Number(item.np2 ?? item.np_2) || 0,
      keterangan: item.keterangan ?? '',
    }

    for (let i = 1; i <= 9; i++) {
      flat[`pk${i}`] = Number(item[`pk${i}`]) || 0
      flat[`bk${i}`] = Number(item[`bk${i}`]) || 0
      flat[`ul${i}`] = Number(item[`ul${i}`]) || 0
    }

    if (Array.isArray(item.detail_klui)) {
      item.detail_klui.forEach(d => {
        const idx = Number(d.id_klui)
        if (idx >= 1 && idx <= 9) {
          flat[`pk${idx}`] = Number(d.jml_pertama_khusus) || 0
          flat[`bk${idx}`] = Number(d.jml_berkala) || 0
          flat[`ul${idx}`] = Number(d.jml_ulang) || 0
        }
      })
    }

    return flat
  },

  // Adapter dari format baris datar 32 kolom ke payload backend PUT /api/laporan/{id}/k6
  toApiRow(rowDef, rowVal) {
    const detail_klui = []
    for (let i = 1; i <= 9; i++) {
      detail_klui.push({
        id_klui: i,
        jml_pertama_khusus: Number(rowVal[`pk${i}`]) || 0,
        jml_berkala: Number(rowVal[`bk${i}`]) || 0,
        jml_ulang: Number(rowVal[`ul${i}`]) || 0,
      })
    }

    return {
      id_jabatan: rowDef.id_jabatan,
      jumlah_pengawas: Number(rowVal.jumlah) || 0,
      norma_ketenagakerjaan: Number(rowVal.nket) || 0,
      norma_k3: Number(rowVal.nk3) || 0,
      np_1: Number(rowVal.np1) || 0,
      np_2: Number(rowVal.np2) || 0,
      keterangan: rowVal.keterangan || null,
      detail_klui,
    }
  },
}
