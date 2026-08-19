// KategoriInventarisPage.js — POM modul Kategori Inventaris
// Menu: PENGATURAN > Inventaris > Kategori Inventaris
//
// ✅ STATUS: TERVERIFIKASI 19 Agustus 2026 (DOM + Network asli), MENGGANTIKAN
// kerangka lama (yang API-nya masih null). Master data kategori barang inventaris.
//
// Bentuk: list + form DIALOG, 2 field (Instansi + Nama Kategori Inventaris).
// Empat hal khas yang membedakan dari Jenis Guru/Staff:
//
//   1. Endpoint TIDAK nurut URL path: halaman `/setting/inventory` tapi API
//      `/api/proxy/inventory-categories` (HYPHEN, bukan underscore, bukan
//      /setting/inventory). POST sukses balik **200** (bukan 201).
//   2. Tabel TANPA kolom Status — cuma Instansi(0) / Nama(1) / Dibuat pada(2)
//      + 2 aksi. Jangan petakan kolom status.
//   3. Toast: title KONSTAN "Berhasil", pesan asli di [data-description].
//      assertToast(title, desc) → title selalu "Berhasil", desc = pesan modul.
//   4. Naming app inkonsisten: empty state <h3>"Data inventaris tidak ditemukan"</h3>
//      & tombol empty-state "Tambah Inventaris" — TAPI tombol utama & judul dialog
//      "Tambah Kategori Inventaris". addButton exact-match jadi tidak bentrok.
//
// ⚠️ TEMUAN: Kategori Inventaris MENGIZINKAN duplikat nama+instansi (POST 200,
// tidak 409). 3 dari 4 master data (Guru/Staff/Inventaris) izinkan, cuma Jenis
// Tagihan yang tolak — kemungkinan by-design. S-06 dokumentasi behavior aktual,
// bukan expect-error, sampai PRD memutuskan.

import CrudListPage from './base/CrudListPage';
import { DIALOG } from './helpers';

class KategoriInventarisPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/inventory',
      modul: 'Kategori Inventaris',
      addButtonText: 'Tambah Kategori Inventaris',
      titles: {
        add: 'Tambah Kategori Inventaris',
        // edit/delete: judul dialog belum ter-capture — dibiarkan kosong.
      },
      emptyState: 'Data inventaris tidak ditemukan', // naming app: "inventaris", bukan "Kategori Inventaris"
      fields: {
        instansi: { type: 'select', label: 'Instansi', placeholder: 'Pilih Instansi' }, // combobox, NO name
        nama: { type: 'text', label: 'Nama Kategori Inventaris', name: 'name', placeholder: 'Contoh: Meja atau Kursi' },
        // Tidak ada field Status.
      },
      columns: {
        instansi: 0, // <span class="font-medium">
        nama: 1, // "Meja & Kursi Siswa" (header: "Nama Kategori")
        dibuatPada: 2, // "Selasa, 04 Agt 2026 17:05"
        // aksi: edit = kolom 3, hapus = kolom 4 (dicari lewat ikon, bukan index).
        // TIDAK ada kolom Status.
      },
      api: {
        list: '**/api/proxy/inventory-categories*', // GET -> 200
        save: '**/api/proxy/inventory-categories', // POST -> 200 (BUKAN 201)
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
      // Deskripsi toast sukses — DI SINI pesan sebenarnya (title cuma "Berhasil").
      toastDesc: () => cy.get('[data-sonner-toast][data-type="success"] [data-description]', { timeout: this.t.toast }),
    };
  }

  // =========================================================================
  // SAVE — POST balik 200 (bukan 201).
  // =========================================================================
  saveExpectSuccess() {
    this.save(); // base: intercept @saveAPI (POST api.save) + klik saveButton (type=submit)
    this.waitAlias('saveAPI', 200);
    cy.get(DIALOG, { timeout: this.t.dialog }).should('not.exist');
    return this;
  }

  /**
   * Simpan hasil EDIT. Verb/status HTTP edit belum diverifikasi — cukup pastikan
   * dialog tertutup. Persistensi dicek terpisah lewat assertPersisted().
   */
  saveEditExpectSuccess() {
    this.elements.saveButton().click();
    cy.get(DIALOG, { timeout: this.t.dialog }).should('not.exist');
    return this;
  }

  // =========================================================================
  // ASSERTIONS
  // =========================================================================
  /**
   * Toast sukses. Modul ini title KONSTAN "Berhasil"; pesan asli di description.
   * @param {string} title  biasanya d.messages.toastTitle ("Berhasil")
   * @param {string} [desc] pesan modul (addSuccess/editSuccess/deleteSuccess)
   */
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
  tambah({ instansi, nama } = {}) {
    this.openAddModal();
    this.fillForm({ instansi, nama });
    this.saveExpectSuccess();
    return this;
  }
}

export default new KategoriInventarisPage();
