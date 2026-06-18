---
description: Tambah temuan bug baru ke bugs.csv (lalu regenerate xlsx)
---

Kamu mencatat bug QA ke file `bugs.csv` di root repo ini. Ikuti aturan:

## Langkah
1. Baca `bugs.csv`. Cari `Bug ID` terakhir, increment (BUG-014 -> BUG-015, selalu 3 digit, zero-padded).
2. Cari `Priority` tertinggi yang dipakai (Pxx), increment untuk default — KECUALI user menyebut prioritas eksplisit.
3. Append SATU baris baru dengan kolom persis urutan ini:
   `Bug ID, Module, Title, Steps to Reproduce, Expected Result, Actual Result, Severity, Priority, Reporter, Status, Date Found`
4. Tulis ulang `bugs.csv` (pakai csv module Python, quoting otomatis untuk field bernewline). JANGAN edit xlsx langsung.
5. Jalankan `python scripts/build_bug_tracker.py` untuk regenerate `Bug_Tracker_QA_CARDS.xlsx`.
6. Tampilkan ringkasan baris yang baru ditambahkan ke user.

## Aturan isi kolom
- **Module**: format `Modul (Aksi)` jika relevan, cth `Kamar (Tambah)`, `Kamar (List / Filter)`, `Kamar (Edit)`.
- **Steps to Reproduce**: bernomor, mulai dari `1. Login sebagai admin`, multi-line (pakai newline asli dalam sel). Sertakan langkah monitor Network (XHR) bila bug terkait API.
- **Expected Result** & **Actual Result**: deskriptif, sebutkan response body / status code bila ada (cth `{ status: false, message: '...', data: null }`).
- **Severity**: salah satu dari `High` / `Medium` / `Low`.
  - High = rusak integritas data / blocker / security/info-leak.
  - Medium = fungsional salah tapi ada workaround / proteksi BE jalan.
  - Low = kosmetik / layout / edge case minor.
- **Priority**: `Pxx`.
- **Reporter**: default `Fajar Ardiansyah`.
- **Status**: default `Open` (opsi lain: `In Progress`, `Fixed`, `Closed`, `Won't Fix`).
- **Date Found**: tanggal hari ini format `DD Bulan YYYY` Bahasa Indonesia (cth `18 Juni 2026`).

## Pola yang sering muncul (referensi)
Banyak bug bertema "frontend silent" — BE mengembalikan error dengan benar tapi FE tidak menampilkan toast/inline (lihat BUG-003, 006, 007, 008, 010, 013). Bila bug baru sepola, sebutkan keterkaitannya di Actual Result.

Detail bug dari user: $ARGUMENTS
