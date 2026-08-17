// JenisGuruPage.js — POM modul Jenis Guru
// Menu: PENGATURAN > Kepegawaian > Jenis Guru
//
// ⚠️ STATUS: KERANGKA — paling banyak hipotesisnya di antara modul kerangka.
// qa-cazh TIDAK punya POM maupun fixture untuk modul ini; mereka menavigasi
// dengan klik sidebar berurutan (PENGATURAN > Kepegawaian > Jenis Guru) dan
// tidak pernah cy.visit ke route-nya. Jadi ROUTE DI BAWAH MURNI DUGAAN dari
// pola route modul lain — WAJIB dibuka manual dulu sebelum dipakai.
//
// Yang justru berharga dari mereka untuk modul ini: judul it()-nya memuat
// Skenario + Expected Result lengkap, jadi bisa langsung jadi bahan TC sheet
// (43 TC). Itu urusan tahap PRD/TC, bukan file ini.
//
// Perlu dikonfirmasi saat element analysis:
//   (?) SEMUA nilai di config, terutama route.

import CrudListPage from './base/CrudListPage';

class JenisGuruPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/staffing/teacher-type', // (?) DUGAAN — belum pernah dibuka
      modul: 'Jenis Guru',
      addButtonText: 'Tambah Jenis Guru', // (?)
      titles: {
        add: 'Tambah Jenis Guru', // (?)
        edit: 'Edit Jenis Guru', // (?)
        delete: 'Hapus Jenis Guru', // (?)
      },
      emptyState: 'Data Jenis Guru tidak ditemukan', // (?)
      fields: {
        instansi: { type: 'select', label: 'Instansi', placeholder: 'Pilih Instansi' },
        nama: { type: 'text', label: 'Nama Jenis Guru', name: 'name' }, // (?)
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

export default new JenisGuruPage();
