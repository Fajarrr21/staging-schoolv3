// Spec Dashboard — DSB
// POM: cypress/support/pageobjects/DashboardPage.js
// Fixture: cypress/fixtures/dashboard.json
//
// =========================================================================
// STATUS: TERVERIFIKASI 100% 19 Agustus 2026 (DOM + Network / API).
// =========================================================================
// ⚠️ TARGET = PRODUCTION (v3.cazh.id), TAPI spec ini READ-ONLY (render/smoke +
//    filter). TIDAK membuat/mengubah/menghapus data -> AMAN di prod, TANPA cleanup.
//
// Modul render/smoke + interaksi filter (BUKAN CRUD):
//   - 8 kartu statistik (value dinamis -> assert FORMAT, bukan angka pasti).
//   - 3 grafik (render dibuktikan lewat JUDUL; svg chart 🔶 unverified, TIDAK di-assert).
//   - Filter periode -> intercept trend/methods (period=<param>) + footer berubah.
//   - Filter instansi -> intercept overdue/summary (store_ids=).

import Dashboard from '../../../support/pageobjects/DashboardPage';
import LoginPage from '../../../support/pageobjects/LoginPage';
import { currentEnv } from '../../../support/pageobjects/base/helpers';

describe('Dashboard — DSB', () => {
  let d;

  before(() => {
    cy.fixture('dashboard').then((data) => {
      d = data;
      // Resolusi opsi instansi per-env supaya staging & production tidak nyampur.
      // Dashboard READ-ONLY -> tidak fail-fast di sini; S-02 yang skip kalau kosong.
      const inst = (d.instansiByEnv && d.instansiByEnv[currentEnv()]) || { options: [], pick: '' };
      d.charts.tunggakan.instansiOptions = inst.options;
      d.testData.instansiPilih = inst.pick;
    });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    Dashboard.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Smoke / render
  // ==========================================================================
  describe('S-00 — Smoke / render', () => {
    it('TC-DSB-001 | Happy | Halaman dashboard terbuka (heading + subtitle)', () => {
      Dashboard.visit();
      cy.url().should('include', d.urls.list);
      Dashboard.assertHeading(d.subtitle);
    });

    it('TC-DSB-002 | Happy | 8 kartu statistik render dengan value sesuai format', () => {
      Dashboard.visit().assertStatCards(d.statCards);
    });

    it('TC-DSB-003 | Happy | 3 judul grafik tampil', () => {
      Dashboard.visit();
      Dashboard.assertChartTitle(d.charts.tunggakan.title);
      Dashboard.assertChartTitle(d.charts.pembayaranTagihan.title);
      Dashboard.assertChartTitle(d.charts.metodePembayaran.title);
    });

    it('TC-DSB-004 | Happy | 3 judul widget data tampil', () => {
      Dashboard.visit();
      Dashboard.assertWidgetTitle(d.widgets.dataLembaga.title);
      Dashboard.assertWidgetTitle(d.widgets.metodePembayaran.title);
      Dashboard.assertWidgetTitle(d.widgets.transaksiTerakhir.title);
    });
  });

  // ==========================================================================
  // S-01 — Filter periode: intercept API (period=<param>) + footer berubah
  // ==========================================================================
  describe('S-01 — Filter periode', () => {
    it('TC-DSB-010 | Happy | Grafik Pembayaran Tagihan: Tahunan -> API period=yearly + footer', () => {
      const chart = d.charts.pembayaranTagihan;
      const param = d.periodeParam[d.testData.periodeBaru]; // yearly
      Dashboard.visit().setPeriodeAndWait(chart.title, d.testData.periodeBaru, chart.api, param);
      Dashboard.assertChartFooterPeriode(chart.title, chart.footerPrefix, d.testData.periodeBaru);
    });

    it('TC-DSB-011 | Happy | Grafik Metode Pembayaran: Tahunan -> API period=yearly + footer', () => {
      const chart = d.charts.metodePembayaran;
      const param = d.periodeParam[d.testData.periodeBaru];
      Dashboard.visit().setPeriodeAndWait(chart.title, d.testData.periodeBaru, chart.api, param);
      Dashboard.assertChartFooterPeriode(chart.title, chart.footerPrefix, d.testData.periodeBaru);
    });
  });

  // ==========================================================================
  // S-02 — Filter instansi (dropdown titik-tiga) di Grafik Tunggakan
  // ==========================================================================
  describe('S-02 — Filter instansi', () => {
    // Opsi instansi = data per-env. Kalau env aktif belum diisi (mis. staging
    // kosong), skip blok ini biar tidak assert data prod di staging & sebaliknya.
    beforeEach(function () {
      if (!d.charts.tunggakan.instansiOptions || d.charts.tunggakan.instansiOptions.length === 0) {
        cy.log(`Opsi instansi untuk env "${currentEnv()}" belum diisi (instansiByEnv) — S-02 dilewati.`);
        this.skip();
      }
    });

    it('TC-DSB-020 | Happy | Dropdown instansi memuat 5 opsi lembaga', () => {
      const chart = d.charts.tunggakan;
      Dashboard.visit().openInstansiMenu(chart.title);
      Dashboard.assertInstansiOptions(chart.instansiOptions);
    });

    it('TC-DSB-021 | Happy | Pilih instansi -> API overdue/summary dgn store_ids=', () => {
      const chart = d.charts.tunggakan;
      Dashboard.visit().openInstansiMenu(chart.title);
      Dashboard.pickInstansiAndWait(d.testData.instansiPilih, chart.api, chart.instansiParam);
    });
  });

  // ==========================================================================
  // S-03 — Navigasi widget (BLOCKED) — selector panah & route detail belum ada
  // --------------------------------------------------------------------------
  // 🚫 Klik panah "→" di widget Data Lembaga -> halaman detail lembaga.
  //    Belum ke-capture: (1) selector tombol panah per baris widget,
  //    (2) route/halaman tujuan detail lembaga. Aktifkan setelah element analysis.
  // ==========================================================================
  describe.skip('S-03 — Navigasi widget (BLOCKED)', () => {
    it('TODO-DSB-030 | Happy | Klik detail di Data Lembaga -> pindah ke halaman detail', () => {});
  });
});
