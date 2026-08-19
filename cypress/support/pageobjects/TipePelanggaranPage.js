// TipePelanggaranPage.js — POM modul Tipe Pelanggaran
// Menu: PENGATURAN > Kesiswaan > Tipe Pelanggaran
//
// ✅ STATUS: TERVERIFIKASI 19 Agustus 2026 (inti — DOM + Network asli),
// MENGGANTIKAN kerangka lama (API null). Master data tipe pelanggaran + range poin.
// Modul terberat: 4 field (2 number), dialog scrollable, duplikat ditolak 400.
//
// Lima hal khas yang membentuk POM ini:
//   1. 4 field: Instansi (select) + Tipe Pelanggaran (text, max 100) +
//      Poin Minimum + Poin Maksimum (number).
//   2. Endpoint FLAT + hyphen: `/api/proxy/violation-types` (tidak nurut URL
//      `/setting/student-affairs/`). POST **201** sukses / **400** gagal.
//   3. DUPLIKAT DITOLAK (400), pesan d.messages.duplicate. Beda dari Jenis
//      Tagihan (409) → saveExpectDuplicate() assert 400 + error toast.
//   4. Toast: title KONSTAN "Berhasil!", pesan sukses di [data-description].
//   5. Dialog SCROLLABLE (blok Catatan + 4 field). Cypress auto-scroll saat
//      action; fill() poin tetap scrollIntoView() biar aman.
//
// ⚠️ name field poin (min_point/max_point) BELUM verified → fill() di-override
//    scope by LABEL (formItem(label).find('input')), name-independent. Skeleton
//    lama sengaja TIDAK ditiru: qa-cazh pakai input[type=number].first()/.last()
//    (posisional) yang gagal senyap kalau field number cuma satu.

import CrudListPage from './base/CrudListPage';
import { DIALOG } from './helpers';

class TipePelanggaranPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/student-affairs/violation-type',
      modul: 'Tipe Pelanggaran',
      addButtonText: 'Tambah Tipe', // tombol pendek "Tambah Tipe"
      titles: {
        add: 'Tambah Tipe', // judul dialog "Tambah Tipe" (bukan "Tambah Tipe Pelanggaran")
        // edit/delete: judul dialog belum ter-capture — dibiarkan kosong.
      },
      emptyState: 'Data tipe pelanggaran tidak ditemukan', // (?) belum ter-capture eksplisit — tidak dipakai assert aktif
      fields: {
        instansi: { type: 'select', label: 'Instansi', placeholder: 'Pilih Instansi' }, // combobox, NO name
        nama: { type: 'text', label: 'Tipe Pelanggaran', name: 'name', maxLength: 100, placeholder: 'Contoh: Ringan, Sedang, Berat' },
        poinMin: { type: 'number', label: 'Poin Minimum', placeholder: '1' }, // name BELUM verified → scope by label
        poinMax: { type: 'number', label: 'Poin Maksimum', placeholder: '999' }, // name BELUM verified → scope by label
      },
      columns: {
        instansi: 0,
        nama: 1, // badge/chip nama tipe
        rangePoin: 2, // "51 - 66 poin"
        // TIDAK memetakan kolom Status (belum dipastikan ada). aksi via ikon.
      },
      api: {
        list: '**/api/proxy/violation-types*', // GET -> 200
        save: '**/api/proxy/violation-types', // POST -> 201 sukses / 400 gagal
      },
    });
  }

  // =========================================================================
  // ELEMENTS — override kecil di atas warisan base.
  // =========================================================================
  get elements() {
    return {
      ...super.elements,
      emptyHeading: () => cy.contains('h3', this.cfg.emptyState),
      // Toast sukses: pesan di description (title cuma "Berhasil!").
      toastDesc: () => cy.get('[data-sonner-toast][data-type="success"] [data-description]', { timeout: this.t.toast }),
      // Toast error (duplikat / validasi server).
      errorToast: () => cy.get('[data-sonner-toast][data-type="error"]', { timeout: this.t.toast }),
      errorToastDesc: () => cy.get('[data-sonner-toast][data-type="error"] [data-description]', { timeout: this.t.toast }),
    };
  }

  // =========================================================================
  // FORM — fill di-override supaya scope by LABEL (name poin belum verified) +
  // scrollIntoView (dialog scrollable). Field select tetap lewat base.select().
  // =========================================================================
  fill(key, value) {
    const f = this._field(key);
    if (f.type === 'select') {
      throw new Error(`[${this.cfg.modul}] field "${key}" bertipe select — pakai select(), bukan fill()`);
    }
    const input = () => this.elements.fieldItem(key).find('input');
    input().scrollIntoView().should('be.visible').and('not.be.disabled').clear();
    if (value !== '' && value !== null && value !== undefined) {
      input().type(String(value), { delay: 10 });
    }
    return this;
  }

  // =========================================================================
  // SAVE
  // =========================================================================
  /** Sukses = POST 201 lalu dialog tertutup. */
  saveExpectSuccess() {
    this.save(); // base: intercept @saveAPI (POST api.save) + klik saveButton (auto-scroll)
    this.waitAlias('saveAPI', 201);
    cy.get(DIALOG, { timeout: this.t.dialog }).should('not.exist');
    return this;
  }

  /**
   * Validasi SERVER-SIDE (duplikat nama / overlap range) = klik Simpan → POST 400
   * → toast error, dialog TETAP terbuka. Dipakai S-06 (duplikat) & S-07 (overlap).
   */
  saveExpectServerError(message) {
    this.save();
    this.waitAlias('saveAPI', 400);
    this.elements.errorToast().should('be.visible');
    if (message) this.elements.errorToastDesc().should('contain.text', message);
    cy.get(DIALOG, { timeout: this.t.dialog }).should('be.visible');
    return this;
  }

  /** Alias semantik untuk kasus duplikat nama. */
  saveExpectDuplicate(message) {
    return this.saveExpectServerError(message);
  }

  /**
   * Validasi INLINE (range poin) = klik Simpan, submit ke-block RHF (TIDAK ada
   * POST), pesan muncul di form-message dalam dialog. Field-agnostic: cukup pesan
   * ada di salah satu form-message (map field→pesan tidak selalu pasti).
   */
  saveExpectInlineError(message) {
    this.save(); // submit ke-block; @saveAPI tidak akan fire, tidak di-wait
    this.assertInlineError(message);
    cy.get(DIALOG, { timeout: this.t.dialog }).should('be.visible');
    return this;
  }

  assertInlineError(message) {
    cy.contains(`${DIALOG} [data-slot="form-message"]`, message, { timeout: this.t.dialog }).should('be.visible');
    return this;
  }

  /** Simpan hasil EDIT — verb/status belum diverifikasi, cukup dialog tertutup. */
  saveEditExpectSuccess() {
    this.elements.saveButton().click();
    cy.get(DIALOG, { timeout: this.t.dialog }).should('not.exist');
    return this;
  }

  // =========================================================================
  // ASSERTIONS
  // =========================================================================
  /** Toast sukses: title KONSTAN "Berhasil!"; pesan asli di description. */
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
  isiForm({ instansi, nama, poinMin, poinMax } = {}) {
    this.fillForm({ instansi, nama, poinMin, poinMax });
    return this;
  }

  tambah({ instansi, nama, poinMin, poinMax } = {}) {
    this.openAddModal();
    this.isiForm({ instansi, nama, poinMin, poinMax });
    this.saveExpectSuccess();
    return this;
  }
}

export default new TipePelanggaranPage();
