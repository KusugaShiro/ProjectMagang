import { formList, formConfigs } from '../forms'
import { apiGetMatriksModul } from './api'

const MODUL_METRIC_META = {
  K1: {
    indikator: 'Total Pegawai Pengawas',
    satuan: 'orang',
    modeLabel: 'Posisi bulan terakhir',
  },
  K2: {
    indikator: 'Perusahaan Obyek Pengawasan',
    satuan: 'perusahaan',
    modeLabel: 'Posisi bulan terakhir',
  },
  K3: {
    indikator: 'Total Obyek Pengawasan K3',
    satuan: 'obyek',
    modeLabel: 'Posisi bulan terakhir',
  },
  K4: {
    indikator: 'Perusahaan Terdaftar Jamsostek',
    satuan: 'perusahaan',
    modeLabel: 'Posisi bulan terakhir',
  },
  K5: {
    indikator: 'Total Kegiatan Pemeriksaan',
    satuan: 'kegiatan',
    modeLabel: 'Akumulasi tahunan',
  },
  K6: {
    indikator: 'Total Pemeriksaan Rinci',
    satuan: 'pemeriksaan',
    modeLabel: 'Akumulasi tahunan',
  },
  K7: {
    indikator: 'Total Perizinan K3 Terbit',
    satuan: 'izin',
    modeLabel: 'Akumulasi tahunan',
  },
  K8a: {
    indikator: 'Kasus Kecelakaan Kerja',
    satuan: 'kasus',
    modeLabel: 'Akumulasi tahunan',
  },
  K8b: {
    indikator: 'Sumber Kecelakaan Kerja',
    satuan: 'kasus',
    modeLabel: 'Akumulasi tahunan',
  },
  K8c: {
    indikator: 'Kasus KK & PAK',
    satuan: 'kasus',
    modeLabel: 'Akumulasi tahunan',
  },
  K9a: {
    indikator: 'Perusahaan Melanggar Norma Kerja',
    satuan: 'perusahaan',
    modeLabel: 'Akumulasi tahunan',
  },
  K9b: {
    indikator: 'Total Pelanggaran Norma K3',
    satuan: 'temuan',
    modeLabel: 'Akumulasi tahunan',
  },
  K10: {
    indikator: 'Perusahaan Melanggar (PPNS)',
    satuan: 'perusahaan',
    modeLabel: 'Akumulasi tahunan',
  },
}

function readNum(row, key, apiKey) {
  if (!row) return 0
  const raw = row[key] ?? (apiKey ? row[apiKey] : undefined)
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function normalizeRows(kode, rawRows) {
  const cfg = formConfigs[kode.toUpperCase()]
  if (!Array.isArray(rawRows) || rawRows.length === 0) return []
  if (cfg?.fromApiRow) {
    return rawRows.map(r => cfg.fromApiRow(r))
  }
  return rawRows
}

function sumAllNumericFields(kode, rows) {
  const cfg = formConfigs[kode.toUpperCase()]
  if (!cfg || !rows.length) return 0

  if (kode === 'K1') {
    let total = 0
    rows.forEach(r => {
      total += readNum(r, 'jml_umum') + readNum(r, 'jml_ppns')
      cfg.spesialisFields?.forEach(sf => {
        total += readNum(r, sf.key)
      })
    })
    return total
  }

  let total = 0
  rows.forEach(r => {
    cfg.numericFields?.forEach(f => {
      total += readNum(r, f.key, f.apiKey)
    })
  })
  return total
}

function computePrimaryMetric(kode, rows) {
  const cfg = formConfigs[kode.toUpperCase()]
  if (!cfg || !rows.length) return { nilai: 0, catatan: '' }

  if (kode === 'K1') {
    let total = 0
    let ppns = 0
    rows.forEach(r => {
      total += cfg.hitungJumlahBaris ? cfg.hitungJumlahBaris(r) : readNum(r, 'jml_umum')
      ppns += readNum(r, 'jml_ppns')
    })
    return {
      nilai: total,
      catatan: ppns > 0 ? `Termasuk ${ppns} PPNS` : '',
    }
  }

  if (kode === 'K2') {
    let prsh = 0
    let tk = 0
    rows.forEach(r => {
      prsh += readNum(r, 'jumlah_perusahaan')
      tk += readNum(r, 'jml_tk_wni') + readNum(r, 'jml_tk_wna')
    })
    return {
      nilai: prsh,
      catatan: tk > 0 ? `Tenaga kerja: ${tk.toLocaleString('id-ID')}` : '',
    }
  }

  if (kode === 'K3') {
    return { nilai: sumAllNumericFields('K3', rows), catatan: '' }
  }

  if (kode === 'K4') {
    let terdaftar = 0
    let wajib = 0
    rows.forEach(r => {
      terdaftar += readNum(r, 'jmlTerdaftar', 'jml_perusahaan_terdaftar')
      wajib += readNum(r, 'jmlWajib', 'jml_perusahaan_wajib')
    })
    return {
      nilai: terdaftar,
      catatan: wajib > 0 ? `Dari ${wajib.toLocaleString('id-ID')} wajib` : '',
    }
  }

  if (kode === 'K5') {
    let kegiatan = 0
    let nota = 0
    rows.forEach(r => {
      kegiatan +=
        readNum(r, 'pertama', 'periksa_pertama') +
        readNum(r, 'berkala', 'periksa_berkala') +
        readNum(r, 'ulang', 'periksa_ulang') +
        readNum(r, 'khusus', 'periksa_khusus')
      nota += readNum(r, 'np1', 'bina_np_1') + readNum(r, 'np2', 'bina_np_2')
    })
    return {
      nilai: kegiatan,
      catatan: nota > 0 ? `Nota pemeriksaan: ${nota.toLocaleString('id-ID')}` : '',
    }
  }

  if (kode === 'K6') {
    let totalPeriksa = 0
    rows.forEach(r => {
      for (let i = 1; i <= 9; i += 1) {
        totalPeriksa += readNum(r, `pk${i}`) + readNum(r, `bk${i}`) + readNum(r, `ul${i}`)
      }
    })
    return { nilai: totalPeriksa, catatan: '' }
  }

  if (kode === 'K7') {
    return { nilai: sumAllNumericFields('K7', rows), catatan: '' }
  }

  if (kode === 'K8a') {
    let kecl = 0
    let korban = 0
    rows.forEach(r => {
      kecl += readNum(r, 'jmlKecl', 'jml_kecelakaan')
      korban += readNum(r, 'jmlKorban', 'jml_korban')
    })
    return {
      nilai: kecl,
      catatan: korban > 0 ? `Korban: ${korban.toLocaleString('id-ID')}` : '',
    }
  }

  if (kode === 'K8b') {
    return { nilai: sumAllNumericFields('K8b', rows), catatan: '' }
  }

  if (kode === 'K8c') {
    let kasus = 0
    rows.forEach(r => {
      kasus += readNum(r, 'kk', 'jml_kasus_kk') + readNum(r, 'pak', 'jml_kasus_pak')
    })
    return { nilai: kasus, catatan: '' }
  }

  if (kode === 'K9a') {
    let melanggar = 0
    let diNota = 0
    rows.forEach(r => {
      melanggar += readNum(r, 'jmlMelanggar', 'jml_perusahaan_melanggar')
      diNota += readNum(r, 'jmlNota', 'jml_perusahaan_di_nota')
    })
    return {
      nilai: melanggar,
      catatan: diNota > 0 ? `Di nota: ${diNota.toLocaleString('id-ID')}` : '',
    }
  }

  if (kode === 'K9b') {
    return { nilai: sumAllNumericFields('K9b', rows), catatan: '' }
  }

  if (kode === 'K10') {
    let melanggar = 0
    let bap = 0
    rows.forEach(r => {
      melanggar += readNum(r, 'jmlMelanggar', 'jml_perusahaan_melanggar')
      bap += readNum(r, 'jmlBap', 'jml_perusahaan_diajukan_bap')
    })
    return {
      nilai: melanggar,
      catatan: bap > 0 ? `Diajukan BAP: ${bap.toLocaleString('id-ID')}` : '',
    }
  }

  return { nilai: sumAllNumericFields(kode, rows), catatan: '' }
}

async function runWithConcurrency(tasks, limit = 8) {
  const results = new Array(tasks.length)
  let nextIdx = 0

  async function worker() {
    while (nextIdx < tasks.length) {
      const idx = nextIdx
      nextIdx += 1
      results[idx] = await tasks[idx]()
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker())
  await Promise.all(workers)
  return results
}

/**
 * Mengambil dan menghitung statistik keseluruhan formulir K1 s.d. K10
 * untuk daftar laporan pada tahun terpilih.
 */
export async function muatStatistikFormulirK1K10(laporanList) {
  const docs = Array.isArray(laporanList) ? laporanList : []
  const totalLaporan = docs.length

  // Tentukan dokumen bulan terakhir per wilayah (untuk formulir snapshot K1-K4)
  const latestDocByWilayah = new Map()
  docs.forEach(doc => {
    const key = Number(doc.id_wilayah)
    const prev = latestDocByWilayah.get(key)
    if (!prev || Number(doc.bulan) > Number(prev.bulan)) {
      latestDocByWilayah.set(key, doc)
    }
  })
  const latestIds = new Set(Array.from(latestDocByWilayah.values()).map(d => d.id_laporan))

  if (totalLaporan === 0) {
    return formList.map(f => {
      const meta = MODUL_METRIC_META[f.kode] || {
        indikator: f.nama,
        satuan: 'data',
        modeLabel: f.mode_triwulan === 'snapshot' ? 'Posisi bulan terakhir' : 'Akumulasi tahunan',
      }
      return {
        kode: f.kode,
        modul: f.kode.toLowerCase(),
        nama: f.nama,
        mode: f.mode_triwulan,
        modeLabel: meta.modeLabel,
        indikator: meta.indikator,
        satuan: meta.satuan,
        nilai: 0,
        catatan: '',
        terisiCount: 0,
        totalLaporan: 0,
        persenTerisi: 0,
      }
    })
  }

  // Ambil matriks setiap (dokumen x formulir) dengan batas konkurensi aman
  const matrixMap = new Map()
  const tasks = []

  docs.forEach(doc => {
    formList.forEach(f => {
      const modul = f.kode.toLowerCase()
      tasks.push(async () => {
        try {
          const res = await apiGetMatriksModul(doc.id_laporan, modul)
          matrixMap.set(`${doc.id_laporan}:${f.kode}`, normalizeRows(f.kode, res?.data || []))
        } catch {
          matrixMap.set(`${doc.id_laporan}:${f.kode}`, [])
        }
      })
    })
  })

  await runWithConcurrency(tasks, 8)

  return formList.map(f => {
    const meta = MODUL_METRIC_META[f.kode] || {
      indikator: f.nama,
      satuan: 'data',
      modeLabel: f.mode_triwulan === 'snapshot' ? 'Posisi bulan terakhir' : 'Akumulasi tahunan',
    }

    let terisiCount = 0
    const rowsUntukAgregasi = []

    docs.forEach(doc => {
      const rows = matrixMap.get(`${doc.id_laporan}:${f.kode}`) || []
      const anyVal = sumAllNumericFields(f.kode, rows) > 0
      if (anyVal) {
        terisiCount += 1
      }

      if (f.mode_triwulan === 'snapshot') {
        if (latestIds.has(doc.id_laporan)) {
          rowsUntukAgregasi.push(...rows)
        }
      } else {
        rowsUntukAgregasi.push(...rows)
      }
    })

    const { nilai, catatan } = computePrimaryMetric(f.kode, rowsUntukAgregasi)
    const persenTerisi = totalLaporan > 0 ? Math.round((terisiCount / totalLaporan) * 100) : 0

    return {
      kode: f.kode,
      modul: f.kode.toLowerCase(),
      nama: f.nama,
      mode: f.mode_triwulan,
      modeLabel: meta.modeLabel,
      indikator: meta.indikator,
      satuan: meta.satuan,
      nilai,
      catatan,
      terisiCount,
      totalLaporan,
      persenTerisi,
    }
  })
}
