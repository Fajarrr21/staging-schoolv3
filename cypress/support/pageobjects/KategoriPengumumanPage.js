// KategoriPengumumanPage.js — POM modul Kategori Pengumuman
// Menu: PENGATURAN > Administrasi > Kategori Pengumuman
//
// ⚠️ STATUS: KERANGKA — belum lewat checkpoint element analysis.
//
// BEDA BENTUK dari modul lain: tambah & edit lewat HALAMAN TERPISAH
// (.../announcement-category/create), bukan dialog. Karena itu method
// openAddModal/openEditByText di CrudListPage di-OVERRIDE di sini menjadi
// navigasi halaman, dan scope form-nya bukan [data-slot="dialog-content"].
//
// Konsekuensi yang harus diingat saat menulis spec:
//   - assertDialogClosed() TIDAK relevan; yang dicek adalah URL kembali ke list.
//   - Modal yang tersisa cuma konfirmasi HAPUS — itu tetap dialog biasa.
//
// Perlu dikonfirmasi saat element analysis:
//   (?) route create/edit, teks tombol, judul halaman
//   (?) scope form di halaman create (form-item-nya masih shadcn? kemungkinan besar ya)
//   (?) columns, api
//
// Teks validasi versi qa-cazh (paling lengkap di antara fixture mereka) sudah
// dicatat di docs/REFERENSI_ELEMEN.md §4.3 — masih berstatus unverified,
// jangan dikunci ke fixture sebelum dilihat sendiri di UI.

import CrudListPage from './base/CrudListPage';

const CREATE_ROUTE = '/setting/administration/announcement-category/create'; // (?)

class KategoriPengumumanPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/administration/announcement-category', // (?)
      modul: 'Kategori Pengumuman',
      addButtonText: 'Tambah Kategori', // (?)
      titles: {
        add: 'Tambah Kategori', // (?) judul HALAMAN, bukan dialog
        edit: 'Edit Kategori', // (?)
        delete: 'Hapus Kategori', // (?) ini dialog beneran
      },
      emptyState: 'Kategori tidak ditemukan', // (?) qa-cazh mencatatnya pakai titik di akhir
      fields: {
        nama: { type: 'text', label: 'Nama Kategori', name: 'name' }, // (?)
        status: { type: 'select', label: 'Status' },
      },
      columns: {
        nama: 0, // (?)
        status: 1, // (?)
      },
      api: { list: null, save: null },
    });
  }

  // ---- OVERRIDE: form berupa halaman, bukan dialog -------------------------
  openAddModal() {
    this.waitBodyUnlocked();
    this.elements.addButton().click();
    cy.url({ timeout: this.t.dialog }).should('include', CREATE_ROUTE);
    cy.get(`input[name="${this.cfg.fields.nama.name}"]`, { timeout: this.t.dialog })
      .should('be.visible')
      .and('not.be.disabled');
    return this;
  }

  openEditByText(text) {
    this.waitBodyUnlocked();
    this.elements.rowByText(text).should('be.visible');
    this.elements.editIcon(text).scrollIntoView().should('be.visible').click();
    cy.url({ timeout: this.t.dialog }).should('not.eq', this.cfg.route);
    cy.get(`input[name="${this.cfg.fields.nama.name}"]`, { timeout: this.t.dialog })
      .should('be.visible')
      .and(($el) => {
        expect($el.val(), 'form edit harus sudah ter-prefill').to.have.length.gt(0);
      });
    return this;
  }

  /** Form di halaman: setelah simpan yang dicek balik ke list, bukan dialog hilang. */
  saveExpectSuccess() {
    this.save();
    cy.url({ timeout: this.t.dialog }).should('include', this.cfg.route);
    return this;
  }

  tambah({ nama, status } = {}) {
    this.openAddModal();
    this.fillForm({ nama, status });
    this.save();
    return this;
  }
}

export default new KategoriPengumumanPage();
