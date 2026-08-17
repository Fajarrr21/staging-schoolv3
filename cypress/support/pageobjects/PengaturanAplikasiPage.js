// PengaturanAplikasiPage.js — POM modul Pengaturan Aplikasi
// Menu: PENGATURAN > Aplikasi
//
// ⚠️ STATUS: KERANGKA, paling kasar di antara semua POM kerangka.
//
// ⚠️ MASALAH SCOPE — WAJIB DIBERESKAN SEBELUM BIKIN TC:
// Di qa-cazh, kode "PGT-11" menggabung EMPAT sub-fitur berbeda jadi satu:
//   Halaman Utama · Partner · Tambah Banner · SPMB
// (terlihat dari cy.contains mereka: 'Aplikasi', 'Halaman Utama', 'Partner',
//  'Tambah Banner', 'SPMB').
// Empat layar dengan bentuk berbeda dijadikan satu kode modul — itu bikin TC
// sheet-nya tidak terbaca dan cakupannya tidak bisa diukur per fitur.
//
// KEPUTUSAN KITA: JANGAN ikut menggabung. Saat digarap, pecah jadi empat modul
// terpisah dengan TC sheet masing-masing. POM ini sengaja dibiarkan sebagai
// KERANGKA NAVIGASI saja — belum mendeklarasikan field apa pun, karena
// mendeklarasikannya sekarang berarti menebak empat form sekaligus.
//
// Perlu dikonfirmasi saat element analysis:
//   (?) route
//   (?) apakah keempat sub-fitur itu TAB, section dalam satu halaman, atau
//       halaman terpisah — ini menentukan base class mana yang dipakai
//   (?) field per sub-fitur

import BasePage from './base/BasePage';
import { rx } from './base/helpers';

const ROUTE = '/setting/application'; // (?) DUGAAN — belum pernah dibuka

/** Sub-fitur yang tergabung di menu ini. Masing-masing layak jadi modul sendiri. */
export const SUB_FITUR = ['Halaman Utama', 'Partner', 'Banner', 'SPMB'];

class PengaturanAplikasiPage extends BasePage {
  constructor() {
    super({ modul: 'Pengaturan Aplikasi' });
  }

  get elements() {
    return {
      pageTitle: () => cy.contains('h1', rx('Aplikasi'), { timeout: this.t.table }),
      // (?) belum diketahui apakah tab, section, atau link ke halaman lain
      subFitur: (name) => cy.contains(rx(name), { timeout: this.t.table }),
      addBannerButton: () => cy.contains('button', 'Tambah Banner'), // (?)
      saveButton: () => cy.contains('button', /^\s*Simpan\s*$/),
    };
  }

  visit() {
    cy.visit(ROUTE);
    this.elements.pageTitle().should('be.visible');
    return this;
  }

  /**
   * Buka salah satu sub-fitur. Implementasinya SENGAJA minimal sampai kita tahu
   * bentuknya (tab / section / halaman) — supaya tidak terlihat siap padahal
   * mekanismenya masih dugaan.
   */
  bukaSubFitur(name) {
    this.waitBodyUnlocked();
    this.elements.subFitur(name).click();
    return this;
  }

  assertSubFiturAda(names = SUB_FITUR) {
    names.forEach((n) => this.elements.subFitur(n).should('be.visible'));
    return this;
  }
}

export default new PengaturanAplikasiPage();
