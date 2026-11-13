# Dokumentasi Integrasi Frontend & PRD Database Rekapitulasi K3

Dokumen ini merangkum penyelarasan Frontend dengan **PRD Database — Sistem Rekapitulasi Pelaporan Pengawasan Ketenagakerjaan & K3 (K1–K10)** (MySQL 8.0+ / MariaDB 10.5+ InnoDB utf8mb4) dan **Kontrak REST API Laravel 13.x**.

---

## 1. Pemetaan 20 Tabel Model Data (PRD Bagian 4)

| Kategori | Nama Tabel | Keterangan & Peran di Frontend |
|---|---|---|
| **Audit** | `log_perubahan` | Mencatat aksi: `tambah`, `ubah`, `hapus`, `kirim`, `sahkan`, `kembalikan`. |
| **Master** | `pengguna` | Akun pengguna: `admin`, `operator_kabupaten`, `kepala_balai`. |
| **Master** | `wilayah_pengawasan` | ID 1 (Banjarmasin - BJM), ID 2 (Barito Kuala - BTL) + data penandatangan resmi. |
| **Master** | `master_jabatan_pengawas` | 6 jabatan master untuk form K1, K5, K6. |
| **Master** | `master_sektor_klui` | 10 baris sektor KLUI (1 s.d. 9 lalu 0). |
| **Transaksi Header** | `laporan_bulanan` | Header unik per `(id_wilayah, tahun, bulan)`. Kolom generated `triwulan = (bulan + 2) DIV 3`. Status: `draf`, `terkirim`, `disahkan`. |
| **Transaksi Matriks** | `rekap_k1_pegawai` | Matriks K1 Data Pegawai Pengawas (Dimensi: 6 jabatan). |
| **Transaksi Matriks** | `rekap_k2_obyek_pengawasan` | Matriks K2 Data Obyek Pengawasan (Dimensi: 10 KLUI). |
| **Transaksi Matriks** | `rekap_k3_obyek_k3` | Matriks K3 Obyek Pengawasan K3 (Dimensi: 10 KLUI). |
| **Transaksi Matriks** | `rekap_k4_jamsostek_bpjs` | Matriks K4 Jamsostek BPJS (Dimensi: 10 KLUI, auto-fill dari K2). |
| **Transaksi Matriks** | `rekap_k5_pemeriksaan` | Matriks K5 Pemeriksaan APBN (Dimensi: 2 jabatan pengawas). |
| **Transaksi Matriks** | `rekap_k6_pemeriksaan_header` | Matriks 3D K6 Header (4 jabatan pengawas). |
| **Transaksi Matriks** | `rekap_k6_pemeriksaan_detail_klui` | Matriks 3D K6 Detail (10 KLUI x 3 jenis pemeriksaan). |
| **Transaksi Matriks** | `rekap_k7_perizinan_k3` | Matriks K7 Penerbitan Perizinan K3 (Dimensi: 10 KLUI). |
| **Transaksi Matriks** | `rekap_k8a_kecelakaan_tipe` | Matriks K8a Kecelakaan Menurut Tipe (Dimensi: 10 KLUI x Tipe A-J). |
| **Transaksi Matriks** | `rekap_k8b_kecelakaan_sumber` | Matriks K8b Kecelakaan Menurut Sumber (Dimensi: 10 KLUI x Sumber A-R). |
| **Transaksi Matriks** | `rekap_k8c_kecelakaan_akibat` | Matriks K8c Akibat Kecelakaan & Santunan (Dimensi: 10 KLUI). |
| **Transaksi Matriks** | `rekap_k9a_pelanggaran_kerja` | Matriks K9a Pelanggaran Norma Kerja (Dimensi: 10 KLUI). |
| **Transaksi Matriks** | `rekap_k9b_pelanggaran_k3` | Matriks K9b Pelanggaran Norma K3 (Dimensi: 10 KLUI). |
| **Transaksi Matriks** | `rekap_k10_penyidikan` | Matriks K10 Penyidikan PPNS (Dimensi: 10 KLUI). |

---

## 2. Aturan Bisnis & Logika Triwulan (PRD Bagian 2 & 5)

1. **Rumus Triwulan**:
   `triwulan = (bulan + 2) DIV 3`
   - Bulan 1, 2, 3 &rarr; TW 1
   - Bulan 4, 5, 6 &rarr; TW 2
   - Bulan 7, 8, 9 &rarr; TW 3
   - Bulan 10, 11, 12 &rarr; TW 4

2. **Dua Mode Agregasi Triwulan**:
   - **K1 s.d. K4 (Data Keadaan)**: Mengambil posisi **bulan terakhir** triwulan (*snapshot*, yaitu posisi Bulan 3, 6, 9, atau 12).
   - **K5 s.d. K10 (Data Kegiatan/Kasus)**: Menjumlahkan akumulasi nilai **3 bulan** triwulan (*SUM*). Kolom `jumlah_pengawas` pada K5 dan K6 tetap posisi snapshot.

3. **Integritas Read-Only Status Disahkan**:
   - Laporan yang telah berstatus `disahkan` otomatis mencatat `tanggal_pengesahan` dan dikunci menjadi *read-only*. Upaya update (`PUT`) atau delete (`DELETE`) ditolak oleh backend (HTTP 403 Forbidden).

4. **Footer Tanda Tangan Dinamis**:
   - Tanda tangan Kepala Balai dan Pembuat Laporan (nama dan NIP) dimuat secara dinamis dari tabel `wilayah_pengawasan`.

5. **Penanganan Angka Kosong / Nol**:
   - Seluruh sel numerik diisi angka `0` (tidak menyimpan huruf N-I-H-I-L di basis data).
