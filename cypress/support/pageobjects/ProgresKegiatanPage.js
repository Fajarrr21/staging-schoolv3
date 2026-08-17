// ProgresKegiatanPage.js — POM modul Progres Kegiatan
// Menu: KESISWAAN > Progres Kegiatan
//
// ⚠️ STATUS: KERANGKA — belum lewat checkpoint element analysis.
//
// Ini modul dengan TC terbanyak di qa-cazh (87), tapi POM mereka paling tipis
// (110 baris, cuma 3 selector). Jadi jangan tertipu angkanya — asetnya sedikit.
//
// Yang mereka catat dan TERLIHAT spesifik (bukan OR-list, jadi kemungkinan
// memang hasil lihat DOM):
//   h1 "Progres Kegiatan"
//   p  "Ringkasan Data dan Penambahan"
//   button "Import Progres"  &  button "Tambah Progres Kegiatan"
//   table[data-slot="data-grid-table"]
//   button[aria-label="Select all"]        -> ada kolom checkbox
//   header kolom berupa BUTTON (sortable): Nama, Nama Kegiatan, Dibuat Oleh,
//                                          Progress Terakhir, Tanggal Dibuat
//   empty state: "Data Progres Kegiatan tidak ditemukan"
// Semua tetap (?) sampai kita lihat sendiri.
//
// CATATAN PENTING: modul ini punya IMPORT (kemungkinan upload file/Excel).
// Kalau TC-nya menyentuh hasil import, kita butuh task Node baca file —
// itu FIX-007 yang masih Open di docs/Action_Items_QA.xlsx.
//
// Perlu dikonfirmasi saat element analysis:
//   (?) route
//   (?) index kolom (header sortable = <button> di dalam <th>)
//   (?) apakah tombol Tambah membuka modal atau halaman
//   (?) alur Import: modal? format file? validasi apa?

import CrudListPage from './base/CrudListPage';

class ProgresKegiatanPage extends CrudListPage {
  constructor() {
    super({
      route: '/student-affairs/progress', // (?)
      modul: 'Progres Kegiatan',
      addButtonText: 'Tambah Progres Kegiatan', // (?)
      titles: {
        add: 'Tambah Progres Kegiatan', // (?)
        edit: 'Edit Progres Kegiatan', // (?)
        delete: 'Hapus Progres Kegiatan', // (?)
      },
      emptyState: 'Data Progres Kegiatan tidak ditemukan', // (?)
      fields: {}, // (?) field form belum dipetakan sama sekali
      columns: {
        // (?) kolom 0 diduga checkbox (ada button[aria-label="Select all"]),
        // jadi kolom data mulai dari index 1. WAJIB dikonfirmasi.
        nama: 1,
        namaKegiatan: 2,
        dibuatOleh: 3,
        progressTerakhir: 4,
        tanggalDibuat: 5,
      },
      api: { list: null, save: null },
    });
  }

  get extraElements() {
    return {
      pageTitle: () => cy.contains('h1', 'Progres Kegiatan', { timeout: this.t.table }),
      importButton: () => cy.contains('button', 'Import Progres'), // (?)
      selectAllCheckbox: () => cy.get('button[aria-label="Select all"]'), // (?)
      // Header sortable berupa <button> di dalam <th>
      sortHeader: (label) => cy.contains('table thead button', label),
    };
  }

  assertPageHeader() {
    this.extraElements.pageTitle().should('be.visible');
    return this;
  }

  /** Kolom bisa di-sort lewat tombol di header. */
  sortBy(label) {
    this.extraElements.sortHeader(label).click();
    return this;
  }

  assertKolomLengkap() {
    ['Nama', 'Nama Kegiatan', 'Dibuat Oleh', 'Progress Terakhir', 'Tanggal Dibuat'].forEach(
      (label) => this.extraElements.sortHeader(label).should('be.visible'),
    );
    return this;
  }

  /**
   * Import Progres — alurnya BELUM diketahui (modal? langsung file picker?).
   * Sengaja tidak diimplementasikan supaya tidak jadi tebakan yang terlihat siap.
   * Butuh FIX-007 (task Node baca file) kalau TC-nya sampai memverifikasi isi.
   */
  bukaImport() {
    this.extraElements.importButton().click();
    return this;
  }
}

export default new ProgresKegiatanPage();
