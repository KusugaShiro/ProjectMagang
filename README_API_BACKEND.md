# Dokumentasi Integrasi Backend & API Laporan Pengawasan

Berkas ini ditujukan untuk pengembang Backend yang akan menghubungkan database sungguhan ke frontend aplikasi Laporan Pengawasan Ketenagakerjaan.

Frontend saat ini menggunakan modul perantara [src/lib/api.js](file:///d:/aa%20file%20tugas/semester%205/ProjectMagang/src/lib/api.js). Seluruh komponen UI hanya berinteraksi melalui 4 fungsi asynchronous di bawah ini.

Variabel alamat dasar API disimpan di `.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

---

## Identifikasi Unik Laporan

Satu laporan diidentifikasi secara unik oleh kombinasi 5 parameter:
1. `kode` (string): Kode formulir (contoh: `"K1"`, `"K2"`, dst.)
2. `wilayah` (string): Wilayah tugas (contoh: `"Banjarmasin"`, `"Batola"`)
3. `jenis` (string): Jenis periode (contoh: `"Bulanan"` atau `"Triwulan"`)
4. `periode` (string): Nama bulan atau triwulan (contoh: `"Januari"`, `"Februari"`, atau `"Triwulan I"`, dst.)
5. `tahun` (number): Tahun laporan (contoh: `2026`)

---

## 4 Fungsi API

### 1. `ambilLaporan({ kode, wilayah, jenis, periode, tahun })`
- **Fungsi**: Mengambil isi baris data laporan yang sudah pernah disimpan.
- **HTTP Rekomendasi**: `GET /api/laporan?kode=K1&wilayah=Banjarmasin&jenis=Bulanan&periode=Januari&tahun=2026`
- **Hasil Return**:
  - Mengembalikan `Object` data baris jika ditemukan.
  - Mengembalikan `null` jika data belum ada (status 404 pada backend).

#### Bentuk JSON Data Laporan (Contoh K1):
```json
{
  "pelaksana": {
    "umum": 2,
    "spesialis_1": 1,
    "spesialis_2": 0,
    "spesialis_3": 0,
    "spesialis_4": 0,
    "spesialis_5": 0,
    "spesialis_6": 0,
    "spesialis_7": 0,
    "spesialis_8": 0,
    "spesialis_9": 0,
    "spesialis_10": 0,
    "spesialis_11": 0,
    "ppns": 1,
    "ket": "Keterangan tambahan"
  },
  "pelaksana_lanjutan": {
    "umum": 1,
    "spesialis_1": 0,
    "...": 0,
    "ppns": 0,
    "ket": ""
  },
  "penyelia": { "...": 0 },
  "pertama": { "...": 0 },
  "muda": { "...": 0 },
  "madya": { "...": 0 }
}
```

---

### 2. `simpanLaporan({ kode, wilayah, jenis, periode, tahun }, data)`
- **Fungsi**: Menyimpan atau memperbarui (*upsert*) isi formulir laporan.
- **HTTP Rekomendasi**: `POST /api/laporan` atau `PUT /api/laporan`
- **Payload Request**:
```json
{
  "kode": "K1",
  "wilayah": "Banjarmasin",
  "jenis": "Bulanan",
  "periode": "Januari",
  "tahun": 2026,
  "data": {
    "pelaksana": { "umum": 2, "...": 0 },
    "pelaksana_lanjutan": { "...": 0 },
    "penyelia": { "...": 0 },
    "pertama": { "...": 0 },
    "muda": { "...": 0 },
    "madya": { "...": 0 }
  }
}
```
- **Hasil Return**:
```json
{
  "success": true,
  "updatedAt": "2026-11-13T06:30:00.000Z"
}
```

---

### 3. `daftarLaporan()`
- **Fungsi**: Mengambil ringkasan semua laporan tersimpan untuk ditampilkan di halaman Arsip / Laporan Tersimpan.
- **HTTP Rekomendasi**: `GET /api/laporan/daftar`
- **Hasil Return (Array of Objects)**:
```json
[
  {
    "key": "K1__Banjarmasin__Bulanan__Januari__2026",
    "kode": "K1",
    "wilayah": "Banjarmasin",
    "jenis": "Bulanan",
    "periode": "Januari",
    "tahun": 2026,
    "updatedAt": "2026-11-13T06:30:00.000Z"
  }
]
```

---

### 4. `hapusLaporan({ kode, wilayah, jenis, periode, tahun })`
- **Fungsi**: Menghapus satu arsip laporan dari sistem.
- **HTTP Rekomendasi**: `DELETE /api/laporan?kode=K1&wilayah=Banjarmasin&jenis=Bulanan&periode=Januari&tahun=2026`
- **Hasil Return**:
```json
{
  "success": true
}
```
