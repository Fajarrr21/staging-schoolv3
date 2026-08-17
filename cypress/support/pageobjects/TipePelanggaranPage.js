// TipePelanggaranPage.js — POM modul Tipe Pelanggaran
// Menu: PENGATURAN > Kesiswaan > Tipe Pelanggaran
//
// ⚠️ STATUS: KERANGKA — belum lewat checkpoint element analysis.
// Nilai bertanda (?) masih HIPOTESIS (sumber: repo qa-cazh, app yang sama).
//
// Perlu dikonfirmasi saat element analysis:
//   (?) addButtonText, titles, emptyState
//   (?) fields.*.name  — nama input Min/Max Poin (qa-cazh menebaknya lewat
//       input[type=number] .first()/.last(), pola posisional yang kita tolak:
//       kalau field number-nya cuma satu, keduanya menunjuk elemen yang sama
//       tanpa error apa pun)
//   (?) columns, api
//
// Aturan bisnis dari qa-cazh yang PERLU divalidasi ke PRD (bukan diasumsikan benar):
//   - min < max, max <= 999, angka negatif ditolak
//   - range poin antar tipe tidak boleh bertumpuk (overlap)
//   - nama unik per instansi, maksimal 100 karakter
//   - hanya tipe berstatus Aktif yang muncul di form Buat Pelanggaran
// Semua itu masuk kolom `Sumber` di TC sheet sebagai PRD / PRD-ambigu / Asumsi.

import CrudListPage from './base/CrudListPage';

class TipePelanggaranPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/student-affairs/violation-type', // (?)
      modul: 'Tipe Pelanggaran',
      addButtonText: 'Tambah Tipe Pelanggaran', // (?)
      titles: {
        add: 'Tambah Tipe Pelanggaran', // (?)
        edit: 'Edit Tipe Pelanggaran', // (?)
        delete: 'Hapus Tipe Pelanggaran', // (?)
      },
      emptyState: 'Data Tipe Pelanggaran tidak ditemukan', // (?)
      fields: {
        instansi: { type: 'select', label: 'Instansi', placeholder: 'Pilih Instansi' },
        nama: { type: 'text', label: 'Tipe Pelanggaran', name: 'name' }, // (?)
        minPoin: { type: 'number', label: 'Poin Minimum', name: 'min_point' }, // (?)
        maxPoin: { type: 'number', label: 'Poin Maksimum', name: 'max_point' }, // (?)
        status: { type: 'select', label: 'Status' },
      },
      columns: {
        instansi: 0, // (?)
        nama: 1, // (?)
        minPoin: 2, // (?)
        maxPoin: 3, // (?)
        status: 4, // (?)
      },
      api: { list: null, save: null },
    });
  }

  tambah({ instansi, nama, minPoin, maxPoin, status } = {}) {
    this.openAddModal();
    this.fillForm({ instansi, nama, minPoin, maxPoin, status });
    this.save();
    return this;
  }
}

export default new TipePelanggaranPage();
