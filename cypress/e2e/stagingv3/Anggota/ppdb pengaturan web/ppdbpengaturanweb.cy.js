// Spec PPDB Pengaturan Web — PPW
// POM: cypress/support/pageobjects/PpdbPengaturanWebPage.js
// Fixture: cypress/fixtures/ppdb_pengaturan_web.json
//
// =========================================================================
// STATUS: BELUM TERVERIFIKASI — baca ini dulu.
// =========================================================================
// BENTUK MODUL: halaman bertab, 7 tab, tiap tab isinya form berbeda.
//
// SCOPE SPEC INI SENGAJA DIBATASI ke NAVIGASI & STRUKTUR saja.
// Isi form per tab TIDAK diuji di sini — 7 layar berbeda tidak boleh dijejalkan
// ke satu spec (itu yang bikin TC repo qa-cazh tidak terbaca). Saat modul ini
// digarap serius, PECAH jadi spec per tab dengan TC sheet masing-masing.
//
// Asumsi paling rapuh: filter Instansi diduga memakai Popover, BUKAN Radix
// Select — kalau dugaan ini salah, TC-PPW-020 yang akan menangkapnya.

import Ppdb from '../../../../support/pageobjects/PpdbPengaturanWebPage';
import LoginPage from '../../../../support/pageobjects/LoginPage';

// Daftar tab dideklarasikan sebagai konstanta, BUKAN dari fixture: nama tab
// dipakai untuk membangun it() saat file di-load, sedangkan cy.fixture() baru
// tersedia di dalam before() (sudah terlambat untuk membangun test).
// Harus tetap sinkron dengan cypress/fixtures/ppdb_pengaturan_web.json -> tabs.
const TABS = [
  'Profil', 'Beranda', 'Jadwal', 'Status Kustom',
  'Formulir Standar', 'Formulir Kustom', 'Program Khusus',
];

describe('PPDB Pengaturan Web — PPW (navigasi & struktur)', () => {
  let d;

  before(() => {
    cy.fixture('ppdb_pengaturan_web').then((data) => { d = data; });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    Ppdb.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-PPW-001 | Happy | Halaman bisa dibuka & tablist tampil', () => {
      Ppdb.visit();
      cy.url().should('include', Ppdb.cfg.route);
      Ppdb.elements.tablist().should('be.visible');
    });

    it('TC-PPW-002 | Happy | Judul & deskripsi halaman sesuai', () => {
      Ppdb.visit().assertPageHeader();
    });

    it('TC-PPW-003 | Happy | Ketujuh tab tersedia dengan jumlah tepat', () => {
      Ppdb.visit().assertSemuaTabAda();
    });
  });

  // ==========================================================================
  // S-01 — Navigasi antar tab
  // ==========================================================================
  describe('S-01 — Navigasi tab', () => {
    it('TC-PPW-010 | Happy | Tab default aktif saat halaman dibuka', () => {
      Ppdb.visit().assertActiveTab(TABS[0]);
    });

    // Satu TC per tab: kalau ada satu tab yang rusak, yang merah cuma tab itu —
    // bukan satu TC gabungan yang menyembunyikan tab mana yang bermasalah.
    TABS.forEach((tab, i) => {
      it(`TC-PPW-0${11 + i} | Happy | Pindah ke tab "${tab}"`, () => {
        Ppdb.visit().switchTab(tab).assertActiveTab(tab);
      });
    });
  });

  // ==========================================================================
  // S-02 — Filter instansi & tautan halaman publik
  // ==========================================================================
  describe('S-02 — Filter & tautan', () => {
    it('TC-PPW-020 | Happy | Filter Instansi bisa dibuka & dipilih', () => {
      Ppdb.visit().pilihInstansi(d.instansi.primary);
      Ppdb.elements.tablist().should('be.visible'); // halaman tetap utuh setelah filter
    });

    it('TC-PPW-021 | Positif | Tautan halaman PPDB publik punya href valid', () => {
      // JANGAN diklik: target="_blank" tidak diikuti Cypress. Cukup cek href.
      Ppdb.visit().assertLandingPageLink();
    });

    it('TC-PPW-022 | Positif | Daftar tab di fixture sinkron dengan konstanta spec', () => {
      // Penjaga agar TABS di spec ini tidak diam-diam menyimpang dari fixture.
      expect(TABS, 'TABS di spec harus sama dengan fixture.tabs').to.deep.equal(d.tabs);
    });
  });
});
