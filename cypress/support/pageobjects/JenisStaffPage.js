// JenisStaffPage.js — POM modul Jenis Staff
// Menu: PENGATURAN > Kepegawaian > Jenis Staff
//
// ✅ STATUS: TERVERIFIKASI 19 Agustus 2026 (DOM + Network asli), MENGGANTIKAN
// kerangka lama. Master data tipe staff per instansi. TWIN dari Jenis Guru —
// struktur identik, cuma beda label "Guru"→"Staff" + endpoint.
//
// Bentuk: list + form DIALOG, 2 field. PALING pas dengan base CrudListPage —
// tombol Simpan `type="submit"` (default base), tidak ada field progresif.
// Empat hal khas yang perlu diperhatikan (sama persis Jenis Guru):
//
//   1. Endpoint pakai UNDERSCORE + proxy beda: `/api/proxy/setting/staffing/
//      staff_type` — URL halaman `staff-type` (hyphen) tapi API `staff_type`
//      (underscore). Gampang salah ketik.
//   2. POST sukses balik **200 OK**, BUKAN 201 — saveExpectSuccess() assert 200.
//   3. Hanya 2 field (Instansi + Jenis Staff). Tidak ada field Status di form
//      (default Aktif otomatis).
//   4. Toast punya title + description — assertToast() bisa cek keduanya.
//
// ⚠️ TEMUAN (bukan pesan): Jenis Staff MENGIZINKAN duplikat nama+instansi (POST
// tetap 200, tidak ada 409) — SAMA seperti Jenis Guru → pola sistemik di
// /setting/staffing/. Belum di-log sebagai bug: perlu konfirmasi PRD apakah
// seharusnya unique per instansi. Spec harus mendokumentasikan behavior AKTUAL
// (duplikat ter-create), bukan expect error.

import CrudListPage from './base/CrudListPage';
import { DIALOG } from './helpers';

class JenisStaffPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/staffing/staff-type',
      modul: 'Jenis Staff',
      addButtonText: 'Tambah Jenis Staff',
      titles: {
        add: 'Tambah Jenis Staff',
        // edit/delete: judul dialog belum ter-capture — dibiarkan kosong.
      },
      emptyState: 'Data Jenis Staff tidak ditemukan',
      fields: {
        instansi: { type: 'select', label: 'Instansi', placeholder: 'Pilih Instansi' }, // combobox, NO name
        nama: { type: 'text', label: 'Jenis Staff', name: 'name', placeholder: 'Contoh: Staff Administrasi' },
        // Tidak ada field Status di form — default Aktif.
      },
      columns: {
        instansi: 0, // <span class="font-medium">
        nama: 1, // "Staff IT A"
        status: 2, // badge "Aktif"
        dibuatPada: 3, // "Senin, 27 Jul 2026 11:31"
        // aksi: edit = kolom 4, hapus = kolom 5 (dicari lewat ikon, bukan index).
      },
      api: {
        list: '**/api/proxy/setting/staffing/staff_type*', // GET -> 200
        save: '**/api/proxy/setting/staffing/staff_type', // POST -> 200 (BUKAN 201)
      },
    });
  }

  // =========================================================================
  // ELEMENTS — override kecil di atas warisan base.
  // =========================================================================
  get elements() {
    return {
      ...super.elements,
      // Heading empty state (hindari :contains global yang bisa bentrok dgn tombol Tambah sekunder).
      emptyHeading: () => cy.contains('h3', this.cfg.emptyState),
      // Deskripsi toast sukses (Jenis Staff punya title + description).
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
  /** Toast sukses lengkap: title + (opsional) description. */
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

export default new JenisStaffPage();
