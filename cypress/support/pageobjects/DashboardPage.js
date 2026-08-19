// DashboardPage.js — POM halaman Dashboard (/dashboard)
//
// ✅ STATUS: STRUKTUR TERVERIFIKASI 19 Agustus 2026 (DOM). API endpoints belum
//    ke-capture -> filter di-assert lewat teks DOM (footer), bukan wait('@alias').
//
// Modul RENDER/SMOKE + interaksi filter, BUKAN CRUD -> extend BasePage.
// READ-ONLY (tidak memutasi data) -> aman di prod, tanpa cleanup.
//
// API sudah ke-capture (semua GET 200) -> filter di-assert DETERMINISTIK lewat
// cy.intercept + cy.wait('@alias') + query param:
//   - periode  -> trend/methods, query period=weekly|monthly|yearly
//   - instansi -> overdue/summary, query store_ids=<id,...>
// Ditambah dobel-assert teks footer (UX) di spec.
//
// Yang SENGAJA tidak di-assert (jujur pada status verifikasi):
//   - svg chart (svg.recharts-surface) masih 🔶 unverified -> render grafik
//     dibuktikan lewat JUDUL (verified), bukan elemen svg.

import BasePage from './base/BasePage';
import { rx } from './base/helpers';

const CARD = '[data-slot="card"]';

class DashboardPage extends BasePage {
  constructor() {
    super({
      route: '/dashboard',
      modul: 'Dashboard',
    });
  }

  // =========================================================================
  // ELEMENTS
  // =========================================================================
  get elements() {
    return {
      subtitle: (text) => cy.contains(text, { timeout: this.t.table }),
      // Kartu/chart/widget di-scope lewat teks judul/label yang unik (verified).
      cardByText: (text) => cy.contains(CARD, text, { timeout: this.t.table }),
      periodeTrigger: (chartTitle) =>
        this.elements.cardByText(chartTitle).find('[data-slot="select-trigger"]'),
      instansiTrigger: (chartTitle) =>
        this.elements.cardByText(chartTitle).find('[data-slot="dropdown-menu-trigger"]'),
      menuItems: () => cy.get('[role="menuitem"]', { timeout: this.t.dropdown }),
    };
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================
  visit() {
    cy.visit(this.cfg.route);
    this.elements.subtitle(this.cfg.subtitle || 'Ringkasan').should('be.visible');
    return this;
  }

  // =========================================================================
  // SMOKE / RENDER
  // =========================================================================
  assertHeading(subtitle) {
    this.elements.subtitle(subtitle).should('be.visible');
    return this;
  }

  /**
   * Tiap kartu statistik hadir (dicari lewat label unik) & value-nya sesuai
   * FORMAT (money = memuat 'Rp'; number = memuat digit) — bukan angka pasti,
   * karena value dinamis ikut data.
   */
  assertStatCard({ label, valueType }) {
    this.elements.cardByText(label).should('be.visible').within(() => {
      if (valueType === 'money') {
        cy.contains('Rp').should('be.visible');
      } else {
        cy.contains(/\d/).should('be.visible');
      }
    });
    return this;
  }

  assertStatCards(cards = []) {
    cards.forEach((c) => this.assertStatCard(c));
    return this;
  }

  assertChartTitle(title) {
    this.elements.cardByText(title).should('be.visible');
    return this;
  }

  assertWidgetTitle(title) {
    this.elements.cardByText(title).should('be.visible');
    return this;
  }

  // =========================================================================
  // FILTER PERIODE (select) — Grafik Pembayaran Tagihan & Metode Pembayaran.
  // Deterministik: intercept API chart -> ganti periode -> wait + assert
  // query period=<param>. Footer di-assert terpisah di spec (dobel-assert UX).
  // =========================================================================
  setPeriode(chartTitle, value) {
    this.openSelectAndPick(() => this.elements.periodeTrigger(chartTitle), value);
    this.elements.periodeTrigger(chartTitle).should('contain.text', value);
    return this;
  }

  /**
   * Ganti periode DAN pastikan request chart terkirim dengan period=<param>.
   * @param apiPattern pola URL chart (charts.<x>.api)
   * @param expectedParam nilai period (weekly|monthly|yearly)
   */
  setPeriodeAndWait(chartTitle, value, apiPattern, expectedParam) {
    const alias = 'periodeAPI';
    cy.intercept('GET', apiPattern).as(alias);
    this.setPeriode(chartTitle, value);
    cy.wait(`@${alias}`, { timeout: this.t.api }).then(({ request, response }) => {
      expect(response.statusCode, 'status chart API').to.eq(200);
      expect(request.url, `query period=${expectedParam}`).to.include(`period=${expectedParam}`);
    });
    return this;
  }

  assertChartFooterPeriode(chartTitle, footerPrefix, periode) {
    // Footer memuat "<prefix> <periode>" setelah filter diganti.
    const re = new RegExp(`${footerPrefix}\\s+${periode}`, 'i');
    this.elements.cardByText(chartTitle).contains(re).should('be.visible');
    return this;
  }

  // =========================================================================
  // FILTER INSTANSI (dropdown-menu titik-tiga) — Grafik Tunggakan.
  // Deterministik: pilih instansi -> intercept overdue/summary -> wait +
  // assert query store_ids= terkirim.
  // =========================================================================
  openInstansiMenu(chartTitle) {
    this.waitBodyUnlocked();
    this.elements.instansiTrigger(chartTitle).should('be.visible').click();
    this.elements.menuItems().should('have.length.gte', 1);
    return this;
  }

  assertInstansiOptions(expected = []) {
    cy.get('[role="menuitem"]').should(($items) => {
      const labels = [...$items].map((i) => i.textContent.trim());
      expected.forEach((opt) => {
        expect(labels, `opsi instansi memuat "${opt}"`).to.include(opt);
      });
    });
    return this;
  }

  pickInstansi(value) {
    cy.contains('[role="menuitem"]', rx(value), { timeout: this.t.dropdown })
      .should('be.visible')
      .click();
    cy.get('[role="menuitem"]').should('not.exist'); // menu tertutup
    return this;
  }

  /**
   * Pilih instansi DAN pastikan request tunggakan terkirim dengan store_ids=.
   * @param apiPattern pola URL overdue/summary (charts.tunggakan.api)
   * @param param nama query param instansi ('store_ids')
   */
  pickInstansiAndWait(value, apiPattern, param = 'store_ids') {
    const alias = 'instansiAPI';
    cy.intercept('GET', apiPattern).as(alias);
    this.pickInstansi(value);
    cy.wait(`@${alias}`, { timeout: this.t.api }).then(({ request, response }) => {
      expect(response.statusCode, 'status tunggakan API').to.eq(200);
      expect(request.url, `query ${param}=`).to.include(`${param}=`);
    });
    return this;
  }
}

export default new DashboardPage();
