// KategoriPengumumanPage.js — POM modul Kategori Pengumuman
// Menu: PENGATURAN > Administrasi > Kategori Pengumuman
//
// ✅ STATUS: TERVERIFIKASI 19 Agustus 2026 (DOM + Network asli), MENGGANTIKAN
// kerangka lama. ⚠️ Kerangka lama SALAH menebak Add/Edit = halaman terpisah
// (/create). REALITA: keduanya DIALOG biasa (base CrudListPage cocok).
//
// Modul PALING unik. Empat kejutan yang membentuk POM ini:
//   1. TIDAK ada field/kolom Instansi — kategori GLOBAL. Form Tambah 1 field saja.
//   2. Add != Edit (asimetris): dialog TAMBAH = 1 field (Nama Kategori); dialog
//      EDIT = 2 field (Nama Kategori + Status select). Status hanya saat EDIT;
//      create default Aktif. → cfg.fields = {nama} saja; status ditangani manual
//      lewat editStatus() supaya kontrak form-Tambah (S-00) tidak salah.
//   3. Duplikat DITOLAK 400 (create POST & edit PUT). Beda dari Jenis Tagihan (409).
//   4. Edit = PUT /{id} → saveEditExpectSuccess() intercept PUT + assert 200.
//   Plus: wording "harus diisi" (bukan "wajib diisi"), toast title spesifik +
//   description, empty state "Belum Ada Kategori" (h3).

import CrudListPage from './base/CrudListPage';
import { DIALOG, formItem } from './helpers';

class KategoriPengumumanPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/administration/announcement-category',
      modul: 'Kategori Pengumuman',
      addButtonText: 'Tambah Kategori',
      titles: {
        add: 'Tambah Kategori',
        edit: 'Edit Kategori',
        // delete: judul dialog konfirmasi belum ter-capture — dibiarkan kosong.
      },
      emptyState: 'Belum Ada Kategori', // h3, BUKAN "Data ... tidak ditemukan"
      fields: {
        // HANYA field dialog TAMBAH (1 field). Status dialog EDIT ditangani manual.
        nama: { type: 'text', label: 'Nama Kategori', name: 'name', placeholder: 'Nama Kategori' },
      },
      columns: {
        nama: 0, // "Informasi Kegiatan Sekolah"
        status: 1, // badge Aktif/Tidak Aktif → shared cy.assertRowStatus
        dibuatPada: 2, // "Selasa, 04 Agustus 2026 16:56"
        // aksi: edit = kolom 3, hapus = kolom 4 (dicari lewat ikon).
      },
      api: {
        list: '**/api/proxy/announcement-categories*', // GET
        save: '**/api/proxy/announcement-categories', // POST create -> 200/201 (400 duplikat)
        update: '**/api/proxy/announcement-categories/*', // PUT /{id} -> 200 (400 duplikat)
        delete: '**/api/proxy/announcement-categories/*', // DELETE /{id}
      },
    });
  }

  // =========================================================================
  // ELEMENTS
  // =========================================================================
  get elements() {
    return {
      ...super.elements,
      emptyHeading: () => cy.contains('h3', this.cfg.emptyState),
      toastDesc: () => cy.get('[data-sonner-toast][data-type="success"] [data-description]', { timeout: this.t.toast }),
      errorToast: () => cy.get('[data-sonner-toast][data-type="error"]', { timeout: this.t.toast }),
      errorToastDesc: () => cy.get('[data-sonner-toast][data-type="error"] [data-description]', { timeout: this.t.toast }),
    };
  }

  // =========================================================================
  // CREATE — POST, sukses 200 ATAU 201.
  // =========================================================================
  saveExpectSuccess() {
    this.save(); // base: intercept @saveAPI (POST api.save) + klik saveButton
    cy.wait('@saveAPI', { timeout: this.t.api }).its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.get(DIALOG, { timeout: this.t.dialog }).should('not.exist');
    return this;
  }

  /** Duplikat saat CREATE = POST 400, dialog tetap terbuka, error toast + pesan. */
  saveExpectDuplicate(message) {
    this.save();
    cy.wait('@saveAPI', { timeout: this.t.api }).its('response.statusCode').should('eq', 400);
    this.elements.errorToast().should('be.visible');
    if (message) this.elements.errorToastDesc().should('contain.text', message);
    cy.get(DIALOG, { timeout: this.t.dialog }).should('be.visible');
    return this;
  }

  // =========================================================================
  // EDIT — Status select (hanya ada di dialog Edit) + save via PUT.
  // =========================================================================
  /** Pilih Status di dialog Edit (Aktif / Tidak Aktif). */
  editStatus(value) {
    this.openSelectAndPick(() => formItem('Status').find('[data-slot="select-trigger"]'), value);
    formItem('Status').find('[data-slot="select-value"]').should('contain.text', value);
    return this;
  }

  _editSave() {
    cy.intercept('PUT', this.cfg.api.update).as('updateAPI');
    this.elements.saveButton().click();
    return this;
  }

  /** Simpan EDIT sukses = PUT 200 lalu dialog tertutup. */
  saveEditExpectSuccess() {
    this._editSave();
    cy.wait('@updateAPI', { timeout: this.t.api }).its('response.statusCode').should('eq', 200);
    cy.get(DIALOG, { timeout: this.t.dialog }).should('not.exist');
    return this;
  }

  /** Duplikat saat EDIT = PUT 400, dialog tetap terbuka, error toast + pesan. */
  saveEditExpectDuplicate(message) {
    this._editSave();
    cy.wait('@updateAPI', { timeout: this.t.api }).its('response.statusCode').should('eq', 400);
    this.elements.errorToast().should('be.visible');
    if (message) this.elements.errorToastDesc().should('contain.text', message);
    cy.get(DIALOG, { timeout: this.t.dialog }).should('be.visible');
    return this;
  }

  // =========================================================================
  // ASSERTIONS
  // =========================================================================
  /** Toast sukses: title spesifik + (opsional) description. */
  assertToast(title, desc) {
    this.assertSuccessToast(title);
    if (desc) this.elements.toastDesc().should('contain.text', desc);
    return this;
  }

  assertEmptyState() {
    this.elements.emptyHeading().should('be.visible');
    return this;
  }

  // =========================================================================
  // KOMPOSISI
  // =========================================================================
  tambah({ nama } = {}) {
    this.openAddModal();
    this.fillForm({ nama });
    this.saveExpectSuccess();
    return this;
  }
}

export default new KategoriPengumumanPage();
