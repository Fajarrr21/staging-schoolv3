// Spec Dashboard — DSH
// POM: cypress/support/pageobjects/DashboardPage.js
// Fixture: cypress/fixtures/dashboard.json
//
// =========================================================================
// STATUS: BELUM TERVERIFIKASI — tapi paling aman dijalankan duluan.
// =========================================================================
// Modul ini SEPENUHNYA READ-ONLY: tidak membuat, mengubah, atau menghapus data.
// Jadi nol risiko mencemari staging — kandidat terbaik untuk run pertama
// sekaligus menguji apakah pola POM kita cocok untuk modul non-CRUD.
//
// Asumsi paling rapuh: label kartu metrik & apakah grafiknya memang recharts.
//
// CATATAN AKUN: banner + popup "Perkuat Keamanan PIN Anda" hanya muncul pada
// akun PIN lemah (cypress/fixtures/app.json -> accounts.weakPin). Spec ini
// memakai akun normal, jadi TC-DSH-030 meng-assert banner itu TIDAK ada.
// Jangan memakai akun weakPin untuk session global — dialognya menutupi UI
// dan bikin spec modul lain merah bukan karena bug.

import Dashboard from '../../../support/pageobjects/DashboardPage';
import LoginPage from '../../../support/pageobjects/LoginPage';

describe('Dashboard — DSH', () => {
  let d;

  before(() => {
    cy.fixture('dashboard').then((data) => { d = data; });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    Dashboard.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-DSH-001 | Happy | Dashboard termuat setelah login', () => {
      Dashboard.visit();
      cy.url().should('include', '/dashboard');
      Dashboard.elements.pageTitle().should('be.visible');
    });

    it('TC-DSH-002 | Happy | Ada kartu yang dirender di halaman', () => {
      Dashboard.visit();
      Dashboard.elements.cards().should('have.length.gt', 0);
    });
  });

  // ==========================================================================
  // S-01 — Kartu metrik
  // ==========================================================================
  describe('S-01 — Kartu metrik', () => {
    it('TC-DSH-010 | Happy | Semua kartu metrik yang diharapkan tampil', () => {
      Dashboard.visit().assertMetricCards(d.metricCards);
    });

    // Satu TC per kartu: kalau satu kartu gagal load, yang merah cuma kartu itu.
    // Assertion gabungan akan menyembunyikan kartu mana yang bermasalah.
    ['Saldo Tunai', 'Tagihan Aktif', 'Siswa', 'Guru'].forEach((label, i) => {
      it(`TC-DSH-01${1 + i} | Positif | Kartu "${label}" punya nilai, bukan cuma judul`, () => {
        Dashboard.visit().assertCardHasValue(label);
      });
    });
  });

  // ==========================================================================
  // S-02 — Section & grafik
  // ==========================================================================
  describe('S-02 — Section & grafik', () => {
    it('TC-DSH-020 | Happy | Semua section utama tampil', () => {
      Dashboard.visit();
      d.sections.forEach((s) => Dashboard.assertSectionExists(s));
    });

    it('TC-DSH-021 | Positif | Grafik Tunggakan benar-benar dirender', () => {
      // Kalau gagal dengan "element not found" pada svg.recharts-surface,
      // berarti app TIDAK memakai recharts — ganti selector chart di POM.
      Dashboard.visit().assertChartRendered('Tunggakan');
    });
  });

  // ==========================================================================
  // S-03 — Banner PIN lemah
  // ==========================================================================
  describe('S-03 — Banner PIN', () => {
    it('TC-DSH-030 | Positif | Akun normal tidak memunculkan banner PIN lemah', () => {
      Dashboard.visit().assertWeakPinBannerAbsent();
    });
  });
});
