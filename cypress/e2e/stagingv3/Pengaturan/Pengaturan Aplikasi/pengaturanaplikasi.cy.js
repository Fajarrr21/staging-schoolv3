// Spec Pengaturan Aplikasi — PAP
// POM: cypress/support/pageobjects/PengaturanAplikasiPage.js
// Fixture: cypress/fixtures/pengaturan_aplikasi.json
//
// =========================================================================
// STATUS: KERANGKA NAVIGASI SAJA — sengaja paling minim.
// =========================================================================
// MASALAH SCOPE (lihat FIX-019 di docs/Action_Items_QA.xlsx):
// Di repo qa-cazh, kode PGT-11 menggabung EMPAT sub-fitur berbeda jadi satu:
// Halaman Utama, Partner, Banner, SPMB. Empat layar dengan bentuk berbeda di
// bawah satu kode bikin TC tidak terbaca dan cakupan tidak bisa diukur per fitur.
//
// KEPUTUSAN KITA: jangan ikut menggabung. Spec ini HANYA membuktikan halaman
// bisa dibuka dan keempat sub-fiturnya memang ada. Begitu bentuknya diketahui
// (tab / section / halaman terpisah), PECAH jadi empat modul dengan TC sheet
// masing-masing — dan spec ini diganti.
//
// Route di POM masih DUGAAN dan belum pernah dibuka. TC-PAP-001 adalah yang
// pertama membuktikannya; kalau merah, jangan lanjut.

import Aplikasi from '../../../../support/pageobjects/PengaturanAplikasiPage';
import LoginPage from '../../../../support/pageobjects/LoginPage';

describe('Pengaturan Aplikasi — PAP (navigasi)', () => {
  let d;

  before(() => {
    cy.fixture('pengaturan_aplikasi').then((data) => { d = data; });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    Aplikasi.withTimeouts(d.timeouts);
  });

  describe('S-00 — Kontrak config', () => {
    it('TC-PAP-001 | Happy | Halaman Pengaturan Aplikasi bisa dibuka', () => {
      // Route masih dugaan — TC ini yang membuktikannya.
      Aplikasi.visit();
      Aplikasi.elements.pageTitle().should('be.visible');
    });

    it('TC-PAP-002 | Happy | Keempat sub-fitur tersedia', () => {
      Aplikasi.visit().assertSubFiturAda(d.subFitur);
    });
  });

  // Sengaja TIDAK ada blok form. Isi keempat sub-fitur baru ditulis setelah
  // dipecah jadi modul sendiri-sendiri, masing-masing lewat PRD + TC sheet.
});
