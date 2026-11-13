# Dokumentasi Keselarasan Frontend & Kontrak REST API Backend (v1.0.0)

Aplikasi frontend ini telah sepenuhnya diselaraskan dengan **Dokumentasi Kontrak API Backend (REST API) v1.0.0 (OpenAPI 3.1.0)** untuk UPTD Balai Pengawasan Ketenagakerjaan Daerah Wilayah I Provinsi Kalimantan Selatan (Kota Banjarmasin & Kab. Barito Kuala).

---

## 1. Konfigurasi Lingkungan
- Variabel dasar di `.env`:
  ```env
  VITE_API_URL=http://localhost:8000/api
  ```
- Header HTTP Wajib pada setiap permintaan ke Laravel:
  - `Accept: application/json`
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`

---

## 2. Autentikasi & Akun Seeder (RBAC)
Frontend menyediakan pemilih akun seeder bawaan (dari Dokumen Kontrak Hal 14) untuk pengujian:
1. `operator.bjm@k3.local` — Peran: `operator_kabupaten`, Wilayah: 1 (BJM - Banjarmasin)
2. `operator.btl@k3.local` — Peran: `operator_kabupaten`, Wilayah: 2 (BTL - Barito Kuala)
3. `kepala.balai@k3.local` — Peran: `kepala_balai`, Wilayah: Global
4. `admin@k3.local` — Peran: `admin`, Wilayah: Global

---

## 3. Siklus Hidup & Status Laporan Bulanan (Alur Kerja)
Sesuai Dokumen Kontrak Bagian 2.2:
1. **Draf**: Dokumen dibuat via `POST /api/laporan` (`id_wilayah`, `tahun`, `bulan`). Modul K1 s.d. K10 dapat diisi atau diperbarui (`PUT /api/laporan/{id}/k1`), dan laporan dapat dihapus (`DELETE /api/laporan/{id}`).
2. **Terkirim**: Operator / Admin mengirim laporan via `POST /api/laporan/{id}/kirim` untuk diperiksa Kepala Balai.
3. **Disahkan**: Kepala Balai / Admin mengesahkan via `POST /api/laporan/{id}/sahkan`. Sistem mencatat `tanggal_pengesahan` dan **MENGUNCI (Read-Only)** seluruh modul K1 s.d. K10. Segala percobaan update atau delete ditolak dengan HTTP 403 Forbidden.
4. **Kembalikan ke Draf**: Kepala Balai / Admin dapat membatalkan pengesahan via `POST /api/laporan/{id}/kembalikan` untuk membuka kembali kunci data.

---

## 4. Spesifikasi Modul K1
- Endpoint Ambil: `GET /api/laporan/{id}/k1`
- Endpoint Simpan: `PUT /api/laporan/{id}/k1`
- Format Payload Simpan:
  ```json
  {
    "baris": [
      {
        "id_jabatan": 1,
        "jml_umum": 0,
        "spesialis_1_pesawat_uap_bejana_tekan": 0,
        "spesialis_2_pesawat_angkat_angkut": 0,
        "spesialis_3_pesawat_tenaga_produksi": 0,
        "spesialis_4_instalasi_listrik_lift": 0,
        "spesialis_5_penanggulangan_kebakaran": 0,
        "spesialis_6_konstruksi_bangunan": 0,
        "spesialis_7_kesehatan_kerja": 0,
        "spesialis_8_lingkungan_kerja": 0,
        "spesialis_9_jamsostek": 0,
        "spesialis_10_pengupahan_waktu_kerja": 0,
        "spesialis_11_keselamatan_kerja_kimia": 0,
        "jml_ppns": 0,
        "keterangan": null
      }
    ]
  }
  ```
- Kolom Jumlah per baris dihitung otomatis: `jml_umum` + seluruh `spesialis_1` s.d. `spesialis_11` (`jml_ppns` tidak ikut).

---

## 5. Ekspor Excel
- Endpoint Backend: `GET /api/ekspor/excel?id_wilayah={id}&tahun={tahun}&triwulan={1..4}` (menghasilkan binary stream `.xlsx`).
- Frontend secara otomatis mencoba mengunduh dari endpoint backend di atas. Jika server backend sedang luring/offline, frontend otomatis beralih ke pembuatan berkas Excel K1 via pustaka SheetJS lokal.
