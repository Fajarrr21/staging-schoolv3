// KategoriInventarisPage.js — POM modul Kategori Inventaris
// Menu: PENGATURAN > Inventaris > Kategori Inventaris
//
// ⚠️ STATUS: KERANGKA — belum lewat checkpoint element analysis.
// Nilai di CONFIG di bawah masih HIPOTESIS (sumber: repo qa-cazh, app yang sama).
// Sebelum spec ditulis, semua yang bertanda (?) WAJIB dikonfirmasi ke HTML asli.
// Kalau salah, yang diperbaiki cuma baris config-nya — bukan menulis ulang POM.
//
// Perlu dikonfirmasi saat element analysis:
//   (?) route              — apakah benar /setting/inventory
//   (?) addButtonText      — teks persis tombol tambah
//   (?) titles.add/edit/delete — judul dialog
//   (?) fields.nama.name   — atribut name pada <input>
//   (?) columns            — urutan kolom <td> di tabel
//   (?) emptyState         — teks empty state (qa-cazh sendiri tidak konsisten:
//                            POM mereka "Data inventaris tidak ditemukan",
//                            fixture mereka "Tidak ada data yang ditemukan")
//   (?) api.list/save      — endpoint XHR, dilihat dari tab Network
//
// Yang SUDAH pasti (crosschecked di app.json): struktur dialog/form/select/toast
// shadcn-Radix dan ikon aksi baris — itu diurus CrudListPage, bukan file ini.

import CrudListPage from './base/CrudListPage';

class KategoriInventarisPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/inventory', // (?)
      modul: 'Kategori Inventaris',
      addButtonText: 'Tambah Kategori', // (?)
      titles: {
        add: 'Tambah Kategori', // (?)
        edit: 'Edit Kategori', // (?)
        delete: 'Hapus Kategori', // (?)
      },
      emptyState: 'Data Kategori Inventaris tidak ditemukan', // (?) ikut pola "Data {Modul} tidak ditemukan"
      fields: {
        instansi: { type: 'select', label: 'Instansi', placeholder: 'Pilih Instansi' },
        nama: { type: 'text', label: 'Nama Kategori', name: 'name' }, // (?) name
      },
      columns: {
        instansi: 0, // (?)
        nama: 1, // (?)
      },
      api: {
        // (?) isi setelah dilihat di Network. Selama kosong, waitAlias() no-op
        // dan TIDAK diam-diam diganti jeda angka.
        list: null,
        save: null,
      },
    });
  }

  // Ringkasan alur tambah — dipakai spec supaya langkahnya tidak diulang-ulang.
  tambah(instansi, nama) {
    this.openAddModal();
    this.fillForm({ instansi, nama });
    this.save();
    return this;
  }
}

export default new KategoriInventarisPage();
