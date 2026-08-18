// JenisTagihanPage.js — POM modul Jenis Tagihan
// Menu: PENGATURAN > Tagihan > Jenis Tagihan
//
// ✅ STATUS: TERVERIFIKASI 18 Agustus 2026 (DOM + Network asli), MENGGANTIKAN
// kerangka lama. Master data yang mengisi dropdown "Nama Jenis Tagihan" di
// modul Pengingat Tagihan.
//
// Bentuk: list + form DIALOG (cocok dengan base CrudListPage). Lima hal yang
// tetap butuh override / perhatian:
//
//   1. Form via DIALOG (bukan halaman) — openAddModal() diwarisi apa adanya.
//   2. Form PROGRESIF: awalnya 3 field (Instansi, Nama, Pengulangan). Setelah
//      Pengulangan dipilih, baru muncul Mengulang Setiap + Tanggal Mulai/Akhir.
//      => urutan isi WAJIB: pengulangan dulu, baru field tanggal. Lihat isiForm().
//      => field kondisional ditandai `conditional: true` — S-00 "semua field ada"
//         HANYA boleh mengecek field non-kondisional (3 field awal).
//   3. <select> Instansi & Pengulangan TANPA atribut name => dipilih lewat Radix
//      combobox (label-scoped selectTrigger), bukan select[name]. base.select()
//      sudah label-scoped, jadi aman.
//   4. Uniqueness KOMPOSIT (nama+instansi+pengulangan+periode) => POST duplikat
//      balik 409 Conflict. Lihat saveExpectDuplicate().
//   5. Tombol Simpan `type="button"` (bukan submit) => saveButton getter di-override
//      agar match by teks, bukan [type="submit"].
//
// Catatan empty state: heading "Data Jenis Tagihan tidak ditemukan" DISERTAI
// tombol "Tambah Jenis Tagihan" KEDUA. Teksnya sama dengan tombol header, jadi
// saat assert scope-in dulu (jangan :contains global) — lihat elements.emptyHeading.

import CrudListPage from './base/CrudListPage';
import { DIALOG, formItem, rx } from './helpers';

/** Opsi Pengulangan Tagihan — TERVERIFIKASI (urutan sesuai UI). */
export const OPSI_PENGULANGAN = [
  'Sekaligus Lunas',
  'Setiap Bulan',
  'Setiap 2 Bulan',
  'Setiap 3 Bulan',
  'Setiap 4 Bulan',
  'Setiap 6 Bulan',
  'Setiap Tahun',
  'Setiap Minggu',
];

class JenisTagihanPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/invoice/invoice-type',
      modul: 'Jenis Tagihan',
      addButtonText: 'Tambah Jenis Tagihan',
      titles: {
        add: 'Tambah Jenis Tagihan',
        // edit/delete: judul dialog belum ter-capture — dibiarkan kosong biar
        // base tidak meng-assert teks yang belum pasti.
      },
      emptyState: 'Data Jenis Tagihan tidak ditemukan',
      fields: {
        // --- selalu tampil ---
        instansi: { type: 'select', label: 'Instansi', placeholder: 'Pilih Instansi' }, // combobox, NO name
        nama: { type: 'text', label: 'Nama Jenis Tagihan', name: 'name', placeholder: 'Masukkan Nama Jenis Tagihan' },
        pengulangan: { type: 'select', label: 'Pengulangan Tagihan', placeholder: 'Pilih Pengulangan Tagihan' }, // combobox, NO name
        // --- kondisional: muncul setelah Pengulangan dipilih ---
        mengulangSetiap: { type: 'select', label: 'Mengulang Setiap', conditional: true },
        tanggalMulai: { type: 'date', label: 'Tanggal Mulai', format: 'dd/mm/yyyy', conditional: true }, // input text
        tanggalAkhir: { type: 'date', label: 'Tanggal Akhir', format: 'dd/mm/yyyy', conditional: true }, // input text
      },
      columns: {
        instansi: 0, // "Academy QA Engineer"
        nama: 1, // "SPP"
        pengulangan: 2, // "Setiap Bulan"
        periode: 3, // "2026-08-01 s/d 2026-08-28"
        status: 4, // badge "Aktif" / "Tidak Aktif"
      },
      api: {
        list: '**/api/proxy-banking/bill-types*', // GET ?page=1&limit=999&own=true -> 200
        save: '**/api/proxy-banking/bill-types', // POST -> 201 (atau 409 kalau duplikat)
      },
    });
  }

  // =========================================================================
  // ELEMENTS — override khusus modul ini di atas warisan base.
  // =========================================================================
  get elements() {
    return {
      ...super.elements,

      // Simpan bertipe button (bukan submit) — match by teks di footer dialog.
      saveButton: () => cy.contains(`${DIALOG} button`, rx('Simpan')),

      // Field tanggal = input text (format dd/mm/yyyy), label-scoped (tanpa name).
      dateInput: (key) => formItem(this._field(key).label).find('input'),

      // Heading empty state (hindari :contains global yang bentrok dgn 2 tombol Tambah).
      emptyHeading: () => cy.contains('h3', this.cfg.emptyState),
    };
  }

  // =========================================================================
  // FORM ACTIONS
  // =========================================================================
  /** Isi field tanggal (input text dd/mm/yyyy). */
  fillDate(key, value) {
    this.elements.dateInput(key).should('be.visible').and('not.be.disabled').clear();
    if (value !== '' && value !== null && value !== undefined) {
      this.elements.dateInput(key).type(String(value), { delay: 10 });
    }
    return this;
  }

  /** Generic dispatch (order-dependent). Untuk create pakai isiForm() yang urutannya aman. */
  fillForm(values = {}) {
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined) return;
      const type = this._field(key).type;
      if (type === 'select') this.select(key, value);
      else if (type === 'date') this.fillDate(key, value);
      else this.fill(key, value);
    });
    return this;
  }

  /**
   * Isi form dengan URUTAN yang benar untuk form progresif:
   * pengulangan dipilih SEBELUM field tanggal disentuh (karena field itu baru
   * dirender setelah pengulangan dipilih).
   */
  isiForm({ instansi, nama, pengulangan, mengulangSetiap, tanggalMulai, tanggalAkhir } = {}) {
    if (instansi !== undefined) this.select('instansi', instansi);
    if (nama !== undefined) this.fill('nama', nama);
    if (pengulangan !== undefined) this.select('pengulangan', pengulangan);
    // ---- di bawah ini field kondisional, hanya ada setelah pengulangan dipilih ----
    if (mengulangSetiap !== undefined) this.select('mengulangSetiap', mengulangSetiap);
    if (tanggalMulai !== undefined) this.fillDate('tanggalMulai', tanggalMulai);
    if (tanggalAkhir !== undefined) this.fillDate('tanggalAkhir', tanggalAkhir);
    return this;
  }

  // =========================================================================
  // SAVE — tombol type=button + tunggu POST.
  // =========================================================================
  /** Simpan sukses = POST 201 lalu dialog tertutup. */
  saveExpectSuccess() {
    this.save(); // base: intercept @saveAPI + klik saveButton (getter di-override)
    this.waitAlias('saveAPI', 201);
    cy.get(DIALOG, { timeout: this.t.dialog }).should('not.exist');
    return this;
  }

  /** Simpan duplikat = POST 409, dialog tetap terbuka + toast error. */
  saveExpectDuplicate() {
    this.save();
    cy.wait('@saveAPI', { timeout: this.t.api }).its('response.statusCode').should('eq', 409);
    return this;
  }

  /**
   * Simpan hasil EDIT. Verb/status HTTP edit belum diverifikasi (create = POST 201,
   * edit kemungkinan PUT/PATCH) — jadi TIDAK meng-assert status code, cukup pastikan
   * dialog tertutup sebagai indikasi diterima. Persistensi dicek terpisah lewat
   * assertPersisted(). Naikkan ke assert status saat verb-nya sudah dipastikan.
   */
  saveEditExpectSuccess() {
    this.elements.saveButton().click();
    cy.get(DIALOG, { timeout: this.t.dialog }).should('not.exist');
    return this;
  }

  // =========================================================================
  // ASSERTIONS
  // =========================================================================
  /** Verifikasi dropdown Pengulangan berisi TEPAT 8 opsi. */
  assertOpsiPengulangan(expected = OPSI_PENGULANGAN) {
    return this.assertOptions('pengulangan', expected);
  }

  assertEmptyState() {
    this.elements.emptyHeading().should('be.visible');
    return this;
  }

  // =========================================================================
  // KOMPOSISI
  // =========================================================================
  tambah(data = {}) {
    this.openAddModal();
    this.isiForm(data);
    this.saveExpectSuccess();
    return this;
  }
}

export default new JenisTagihanPage();
