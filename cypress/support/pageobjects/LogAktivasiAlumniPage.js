// LogAktivasiAlumniPage.js — POM modul Log Aktivasi Alumni
// Menu: MEMBER > Alumni > Log Aktivasi Alumni  (/member/alumni/activation-log)
//
// ✅ STATUS: STRUKTUR member-side TERVERIFIKASI 19 Agustus 2026 (DOM).
//    Alur approve/reject BLOCKED (Operational staging rusak) — TIDAK ada di POM ini.
//
// Modul APPROVAL, BUKAN CRUD — makanya extend BasePage (bukan CrudListPage):
//   - Tidak ada Tambah/Edit/Hapus. Aksi baris = "Lihat Detail" -> dialog read-only.
//   - Filter status lewat TABS radix ([data-slot="tabs-trigger"]), BUKAN search input.
//   - Status badge 3-STATE (Menunggu/Disetujui/Ditolak), bukan Aktif/Tidak Aktif.
//     Kolom Status index 5 -> reuse shared cy.assertRowStatus(row, 5, nilai).
//   - Dialog "Detail Pengajuan Aktivasi" di member-side VIEW-ONLY: satu-satunya
//     aksi = Close. Approve/reject ada di platform Operational terpisah (lihat
//     fixture.operational) — di luar cakupan POM ini sampai data Operational ada.
//
// Member-side READ-ONLY: POM ini tidak memutasi data -> aman di prod, tanpa cleanup.

import BasePage from './base/BasePage';
import { rx } from './base/helpers';

const DIALOG = '[data-slot="dialog-content"]';

class LogAktivasiAlumniPage extends BasePage {
  constructor() {
    super({
      route: '/member/alumni/activation-log',
      modul: 'Log Aktivasi Alumni',
      tabs: { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' },
      titles: { detailDialog: 'Detail Pengajuan Aktivasi' },
      labels: { detailButton: 'Lihat Detail', closeButton: 'Close' },
      emptyState: { heading: 'Belum ada log aktivasi' },
      columns: {
        tanggal: 0, pengaju: 1, tipeAnggota: 2, jumlah: 3,
        catatan: 4, status: 5, keputusan: 6, aksi: 7,
      },
    });
  }

  // =========================================================================
  // ELEMENTS — tiap elemen fungsi supaya DOM di-re-query (tahan re-render tab).
  // =========================================================================
  get elements() {
    const { emptyState, labels } = this.cfg;
    return {
      table: () => cy.get('table', { timeout: this.t.table }),
      rows: () => cy.get('table tbody tr'),
      tab: (label) => cy.contains('[data-slot="tabs-trigger"]', rx(label), { timeout: this.t.table }),
      anyTab: () => cy.get('[data-slot="tabs-trigger"]'),
      emptyHeading: () => cy.contains(emptyState.heading, { timeout: this.t.table }),
      // Aksi baris (kolom index 7 -> nth-child(8)).
      detailButton: (rowIndex = 0) =>
        cy.get('table tbody tr').eq(rowIndex).contains('button', rx(labels.detailButton)),
      // Dialog detail (member-side, read-only).
      dialog: () => cy.get(DIALOG, { timeout: this.t.dialog }),
      dialogTitle: () => cy.get(`${DIALOG} [data-slot="dialog-title"]`),
      closeButton: () => cy.contains(`${DIALOG} button`, rx(labels.closeButton)),
    };
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================
  visit() {
    // api.list belum ke-capture -> tidak ada intercept/wait alias (jangan diganti
    // jeda angka). Tunggu kondisi nyata: tab pending ter-mount.
    cy.visit(this.cfg.route);
    this.elements.tab(this.cfg.tabs.pending).should('be.visible');
    return this;
  }

  // =========================================================================
  // TABS — filter status di member-side lewat radix tabs.
  // =========================================================================
  selectTab(label) {
    this.waitBodyUnlocked();
    this.elements.tab(label).click();
    this.assertTabActive(label);
    return this;
  }

  assertTabActive(label) {
    this.elements.tab(label).should('have.attr', 'data-state', 'active');
    return this;
  }

  // =========================================================================
  // DIALOG DETAIL — VIEW-ONLY (member-side).
  // =========================================================================
  openDetail(rowIndex = 0) {
    this.waitBodyUnlocked();
    this.elements.detailButton(rowIndex).scrollIntoView().should('be.visible').click();
    this.elements.dialog().should('be.visible');
    if (this.cfg.titles.detailDialog) {
      this.elements.dialogTitle().should('contain.text', this.cfg.titles.detailDialog);
    }
    return this;
  }

  closeDetail() {
    this.elements.closeButton().click();
    cy.get(DIALOG).should('not.exist');
    return this;
  }

  // =========================================================================
  // ASSERTIONS
  // =========================================================================
  assertOnList() {
    cy.url().should('include', this.cfg.route);
    return this;
  }

  /** 3 tab status hadir dengan label yang benar. */
  assertTabsPresent() {
    Object.values(this.cfg.tabs).forEach((label) => {
      this.elements.tab(label).should('be.visible');
    });
    return this;
  }

  /** Member-side TIDAK punya search/filter input (filter cuma via tabs). */
  assertNoSearchInput() {
    cy.get('body').then(($b) => {
      expect(
        $b.find('input[placeholder*="Cari" i]').length,
        'member-side tidak boleh punya search input (filter via tabs)',
      ).to.eq(0);
    });
    return this;
  }

  /** Tab menampilkan tabel berisi data ATAU empty-state — bukan crash/kosong bisu. */
  assertTableOrEmpty() {
    cy.get('body').then(($b) => {
      const hasRows = $b.find('table tbody tr').length > 0;
      if (hasRows) this.elements.table().should('be.visible');
      else this.elements.emptyHeading().should('be.visible');
    });
    return this;
  }

  /** Kalau tab ada isinya, SEMUA badge status harus sama dengan status tab-nya. */
  assertAllRowsStatusOrEmpty(expectedStatus) {
    const col = this.cfg.columns.status;
    cy.get('body').then(($b) => {
      const $rows = $b.find('table tbody tr');
      if (!$rows.length) {
        cy.log(`Tab "${expectedStatus}" kosong — assert empty-state.`);
        this.elements.emptyHeading().should('be.visible');
        return;
      }
      cy.get('table tbody tr').should(($trs) => {
        [...$trs].forEach((tr, i) => {
          const badge = Cypress.$(tr).find(`td:nth-child(${col + 1}) [data-slot="badge"] p`);
          expect(badge.text().trim(), `baris ${i + 1} status`).to.eq(expectedStatus);
        });
      });
    });
    return this;
  }

  /**
   * Bukti klaim kunci: dialog detail member-side VIEW-ONLY.
   * Ada tombol Close, dan TIDAK ada tombol keputusan (Disetujui/Ditolak).
   */
  assertDetailViewOnly() {
    this.elements.closeButton().should('be.visible');
    this.elements.dialog().within(() => {
      cy.contains('button', rx(this.cfg.tabs.approved)).should('not.exist'); // Disetujui
      cy.contains('button', rx(this.cfg.tabs.rejected)).should('not.exist'); // Ditolak
    });
    return this;
  }

  assertEmptyState() {
    this.elements.emptyHeading().should('be.visible');
    return this;
  }
}

export default new LogAktivasiAlumniPage();
