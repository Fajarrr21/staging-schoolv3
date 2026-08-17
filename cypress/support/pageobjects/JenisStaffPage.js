// JenisStaffPage.js — POM modul Jenis Staff
// Menu: PENGATURAN > Kepegawaian > Jenis Staff
//
// ⚠️ STATUS: KERANGKA. Sama seperti JenisGuruPage — qa-cazh tidak punya POM
// maupun fixture untuk modul ini, jadi ROUTE DI BAWAH MURNI DUGAAN.
//
// Modul ini KEMBAR dengan Jenis Guru (44 TC vs 43 TC, skenarionya paralel).
// Kerjakan berurutan tepat setelah Jenis Guru: begitu satu modul terverifikasi,
// yang lain praktis tinggal menyesuaikan label. Jangan dipisah jauh — kalau
// terpisah, hasil element analysis Jenis Guru keburu basi.

import CrudListPage from './base/CrudListPage';

class JenisStaffPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/staffing/staff-type', // (?) DUGAAN — belum pernah dibuka
      modul: 'Jenis Staff',
      addButtonText: 'Tambah Jenis Staff', // (?)
      titles: {
        add: 'Tambah Jenis Staff', // (?)
        edit: 'Edit Jenis Staff', // (?)
        delete: 'Hapus Jenis Staff', // (?)
      },
      emptyState: 'Data Jenis Staff tidak ditemukan', // (?)
      fields: {
        instansi: { type: 'select', label: 'Instansi', placeholder: 'Pilih Instansi' },
        nama: { type: 'text', label: 'Nama Jenis Staff', name: 'name' }, // (?)
        status: { type: 'select', label: 'Status' },
      },
      columns: {
        instansi: 0, // (?)
        nama: 1, // (?)
        status: 2, // (?)
      },
      api: { list: null, save: null },
    });
  }

  tambah({ instansi, nama, status } = {}) {
    this.openAddModal();
    this.fillForm({ instansi, nama, status });
    this.save();
    return this;
  }
}

export default new JenisStaffPage();
