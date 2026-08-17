// DashboardPage.js — POM halaman Dashboard
// Route: /dashboard (halaman utama setelah login)
//
// ⚠️ STATUS: KERANGKA — belum lewat checkpoint element analysis.
//
// BENTUK: read-only. Tidak ada CRUD, jadi tidak mewarisi CrudListPage —
// cukup BasePage untuk penanganan Radix & toast.
//
// KENAPA MODUL INI KANDIDAT PILOT YANG BAIK: sepenuhnya baca-saja, jadi nol
// risiko mencemari data staging. Sekaligus menguji apakah pola POM kita cocok
// untuk modul non-CRUD (kartu metrik, grafik recharts, scroll area).
//
// Perlu dikonfirmasi saat element analysis:
//   (?) label 7 kartu metrik & nilainya diambil dari elemen mana
//   (?) apakah grafik memang recharts (svg.recharts-surface)
//   (?) judul section persisnya
//   (?) banner PIN lemah hanya muncul untuk akun tertentu
//
// CATATAN DATA UJI: banner + popup "Perkuat Keamanan PIN Anda" muncul pada akun
// PIN lemah (cypress/fixtures/app.json -> accounts.weakPin). Akun itu JANGAN
// dipakai untuk session global — dialognya menutupi UI dan bikin spec modul lain
// merah bukan karena bug.

import BasePage from './base/BasePage';
import { rx } from './base/helpers';

const ROUTE = '/dashboard';

class DashboardPage extends BasePage {
  constructor() {
    super({ modul: 'Dashboard' });
  }

  get elements() {
    return {
      pageTitle: () => cy.contains('h1', rx('Dashboard'), { timeout: this.t.table }),

      // ---------- KARTU METRIK ----------
      cards: () => cy.get('[data-slot="card"]', { timeout: this.t.table }),
      cardByTitle: (title) => cy.contains('[data-slot="card"]', title, { timeout: this.t.table }),
      cardTitle: (title) => cy.contains('[data-slot="card-title"]', title),
      cardDescription: (title) =>
        cy.contains('[data-slot="card"]', title).find('[data-slot="card-description"]'),

      // ---------- GRAFIK (recharts) ----------
      // (?) belum kita buktikan app-nya memang pakai recharts
      chartIn: (cardTitle) =>
        cy.contains('[data-slot="card"]', cardTitle).find('svg.recharts-surface'),
      chartBars: (cardTitle) =>
        cy.contains('[data-slot="card"]', cardTitle).find('path.recharts-rectangle'),

      // Dropdown filter di dalam kartu grafik (Radix DropdownMenu)
      cardDropdownTrigger: (cardTitle) =>
        cy.contains('[data-slot="card"]', cardTitle).find('[data-slot="dropdown-menu-trigger"]'),
      dropdownContent: () => cy.get('[data-slot="dropdown-menu-content"]', { timeout: this.t.dropdown }),

      // ---------- SCROLL AREA (list di dalam kartu) ----------
      scrollAreaIn: (cardTitle) =>
        cy.contains('[data-slot="card"]', cardTitle).find('[data-radix-scroll-area-viewport]'),

      // ---------- BANNER PIN LEMAH ----------
      weakPinAlert: () => cy.get('[data-slot="alert"][role="alert"]'),
      weakPinAlertTitle: () => cy.get('[data-slot="alert"] [data-slot="alert-title"]'),
      weakPinCta: () => cy.contains('[data-slot="alert"] button', 'Ganti PIN'), // (?)
    };
  }

  visit() {
    cy.visit(ROUTE);
    this.elements.pageTitle().should('be.visible');
    return this;
  }

  // =========================================================================
  // ASSERTIONS
  // =========================================================================
  /**
   * Semua kartu metrik yang diharapkan hadir.
   * Daftar labelnya datang dari fixture, bukan hardcode di POM.
   */
  assertMetricCards(labels = []) {
    labels.forEach((l) => this.elements.cardByTitle(l).should('be.visible'));
    return this;
  }

  /**
   * Kartu metrik harus punya NILAI, bukan cuma judul.
   * Dashboard yang gagal load sering tetap merender judul kartu dengan isi kosong —
   * assertion "judul tampil" saja akan lolos padahal datanya tidak ada.
   */
  assertCardHasValue(title) {
    this.elements.cardByTitle(title).should(($card) => {
      const text = $card.text().replace(title, '').trim();
      expect(text.length, `kartu "${title}" harus punya nilai, bukan cuma judul`).to.be.gt(0);
    });
    return this;
  }

  assertChartRendered(cardTitle) {
    this.elements.chartIn(cardTitle).should('be.visible');
    return this;
  }

  assertSectionExists(title) {
    this.elements.cardByTitle(title).should('be.visible');
    return this;
  }

  /** Banner PIN lemah — hanya untuk akun tertentu, jangan diasumsikan selalu ada. */
  assertWeakPinBannerVisible() {
    this.elements.weakPinAlert().should('be.visible');
    return this;
  }

  assertWeakPinBannerAbsent() {
    cy.get('[data-slot="alert"][role="alert"]').should('not.exist');
    return this;
  }
}

export default new DashboardPage();
