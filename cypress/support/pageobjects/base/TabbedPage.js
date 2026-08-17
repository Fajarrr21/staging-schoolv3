// TabbedPage.js — base class untuk halaman yang isinya dipisah lewat tab Radix.
//
// Dipakai modul seperti Log Aktivasi Alumni (tab Menunggu/Disetujui/Ditolak)
// dan PPDB Pengaturan Web (7 tab).
//
// Elemen tab Radix (dari pengamatan app, status `unverified` sampai kita
// konfirmasi sendiri ke HTML):
//   [role="tablist"]                    wadah tab
//   [role="tab"]                        tiap tab
//   [role="tab"][data-state="active"]   tab yang sedang aktif
//   [role="tabpanel"]                   isi tab aktif
//
// Catatan sikap: switchTab() di repo qa-cazh isinya `cy.get('[role="tab"]')
// .first().click()` — parameter tabName-nya diabaikan, jadi selalu klik tab
// pertama apa pun yang diminta. Di sini tab dipilih lewat teksnya dan
// keberhasilan pindah TAB DIVERIFIKASI lewat data-state.
//
// ---------------------------------------------------------------------------
// BENTUK CONFIG
// ---------------------------------------------------------------------------
//   modul        string
//   route        string
//   pageTitle    string
//   pageSubtitle string (opsional)
//   tabs         string[]  daftar tab sesuai urutan tampil
//   defaultTab   string    tab yang aktif saat halaman dibuka
//   columns      { key: index }  index kolom tabel (kalau tab-nya berisi tabel)
//   emptyState   string
//   api          { list? }

import { rx, cellText } from './helpers';
import BasePage from './BasePage';

export default class TabbedPage extends BasePage {
  constructor(config) {
    super({ tabs: [], columns: {}, api: {}, ...config });
  }

  get elements() {
    return {
      pageTitle: () => cy.contains('h1', rx(this.cfg.pageTitle), { timeout: this.t.table }),
      pageSubtitle: () => cy.contains('p', this.cfg.pageSubtitle),

      tablist: () => cy.get('[role="tablist"]', { timeout: this.t.table }),
      tabs: () => cy.get('[role="tab"]'),
      tab: (name) => cy.contains('[role="tab"]', rx(name), { timeout: this.t.table }),
      activeTab: () => cy.get('[role="tab"][data-state="active"]'),
      tabPanel: () => cy.get('[role="tabpanel"]', { timeout: this.t.table }),

      table: (opts) => cy.get('table', { timeout: this.t.table, ...opts }),
      tableRows: () => cy.get('table tbody tr'),
      rowByText: (text) => cy.contains('table tbody tr', text),
      emptyState: () => cy.contains(this.cfg.emptyState),
      searchInput: () => cy.get('input[placeholder*="Cari" i]', { timeout: this.t.table }),
    };
  }

  _col(key) {
    const idx = this.cfg.columns[key];
    if (idx === undefined) {
      throw new Error(
        `[${this.cfg.modul}] kolom "${key}" belum dipetakan di config POM. ` +
          `Kolom tersedia: ${Object.keys(this.cfg.columns).join(', ') || '(kosong)'}`,
      );
    }
    return idx;
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================
  visit() {
    if (this.cfg.api.list) cy.intercept('GET', this.cfg.api.list).as('listAPI');
    cy.visit(this.cfg.route);
    this.elements.tablist().should('be.visible');
    return this;
  }

  /** Pindah tab lalu VERIFIKASI benar-benar pindah (bukan asal klik). */
  switchTab(name) {
    this.waitBodyUnlocked();
    this.elements.tab(name).click();
    this.elements.tab(name).should('have.attr', 'data-state', 'active');
    return this;
  }

  // =========================================================================
  // ASSERTIONS — TAB
  // =========================================================================
  assertPageHeader() {
    this.elements.pageTitle().should('be.visible');
    if (this.cfg.pageSubtitle) this.elements.pageSubtitle().should('be.visible');
    return this;
  }

  /** Semua tab yang dideklarasikan di config harus ada di UI. */
  assertTabsExist(expected = this.cfg.tabs) {
    this.elements.tablist().should('be.visible');
    expected.forEach((name) => this.elements.tab(name).should('be.visible'));
    return this;
  }

  /**
   * Jumlah tab TEPAT sesuai config — menangkap tab yang ditambah/dihapus dev
   * tanpa pemberitahuan. assertTabsExist() saja tidak menangkap tab ekstra.
   */
  assertTabCount(count = this.cfg.tabs.length) {
    this.elements.tabs().should('have.length', count);
    return this;
  }

  assertActiveTab(name = this.cfg.defaultTab) {
    this.elements.tab(name).should('have.attr', 'data-state', 'active');
    return this;
  }

  // =========================================================================
  // ASSERTIONS — ISI TAB
  // =========================================================================
  assertHasRows() {
    cy.get('table tbody tr').its('length').should('be.gt', 0);
    return this;
  }

  assertEmptyState() {
    this.elements.emptyState().should('be.visible');
    return this;
  }

  assertRowExists(text) {
    cy.contains('table tbody tr', text).should('exist');
    return this;
  }

  assertRowCell(rowText, colKey, expected) {
    const idx = this._col(colKey);
    this.elements.rowByText(rowText).should(($row) => {
      expect(cellText($row[0], idx), `kolom "${colKey}" pada baris "${rowText}"`).to.eq(expected);
    });
    return this;
  }

  /**
   * Semua baris di tab ini harus punya nilai kolom yang sama — dipakai untuk
   * memastikan tab Status benar-benar memfilter (mis. tab "Disetujui" tidak
   * boleh memuat baris berstatus "Menunggu").
   */
  assertAllRowsCell(colKey, expected) {
    const idx = this._col(colKey);
    cy.get('table tbody tr').should(($rows) => {
      expect($rows.length, 'tabel harus ada isinya').to.be.gt(0);
      [...$rows].forEach((tr, i) => {
        expect(cellText(tr, idx), `baris ${i + 1} kolom "${colKey}"`).to.eq(expected);
      });
    });
    return this;
  }

  /** Header kolom tabel sesuai urutan yang diharapkan. */
  assertColumns(expected = []) {
    cy.get('table thead th').should(($th) => {
      const labels = [...$th].map((el) => el.textContent.trim()).filter(Boolean);
      expected.forEach((name) => {
        expect(labels, `kolom "${name}" ada di header`).to.include(name);
      });
    });
    return this;
  }
}
