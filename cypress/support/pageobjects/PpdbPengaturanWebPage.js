// PpdbPengaturanWebPage.js — POM modul PPDB/SPMB Pengaturan Web
// Menu: ANGGOTA > SPMB/PPDB > Pengaturan Web
//
// ⚠️ STATUS: KERANGKA — belum lewat checkpoint element analysis.
//
// BENTUK: halaman bertab dengan 7 tab, tiap tab isinya form/section berbeda.
//
// CATATAN SCOPE: modul ini terlalu besar untuk satu TC sheet (40 TC di qa-cazh
// menyentuh 7 layar berbeda). Saat digarap, PECAH per tab jadi TC sheet
// terpisah — jangan ikut menggabung seperti mereka.
//
// Perlu dikonfirmasi saat element analysis:
//   (?) route (qa-cazh: 'member/admission/setting', tanpa leading slash)
//   (?) 7 nama tab & urutannya
//   (?) filter Instansi — qa-cazh memakai [data-slot="popover-trigger"],
//       jadi kemungkinan Popover, BUKAN Select biasa. Kalau benar, penanganannya
//       beda dari select() dan perlu method sendiri.
//   (?) tautan "buka halaman PPDB" (qa-cazh: a[target="_blank"])
//   (?) field per tab — belum dipetakan sama sekali

import TabbedPage from './base/TabbedPage';

class PpdbPengaturanWebPage extends TabbedPage {
  constructor() {
    super({
      modul: 'PPDB Pengaturan Web',
      route: '/member/admission/setting', // (?)
      pageTitle: 'Pengaturan Web', // (?)
      pageSubtitle: 'Ringkasan Data Pengaturan Web', // (?)
      tabs: [
        'Profil', 'Beranda', 'Jadwal', 'Status Kustom',
        'Formulir Standar', 'Formulir Kustom', 'Program Khusus',
      ], // (?)
      defaultTab: 'Profil', // (?)
      columns: {},
      emptyState: 'Data tidak ditemukan', // (?)
      api: { list: null },
    });
  }

  get extraElements() {
    return {
      // (?) Popover, bukan Select — perlu dikonfirmasi. Kalau ternyata Select,
      // ganti ke pola select() dan hapus method pilihInstansi() di bawah.
      instansiTrigger: () => cy.get('[data-slot="popover-trigger"]').first(),
      instansiPanel: () => cy.get('[data-slot="popover-content"]', { timeout: this.t.dropdown }),
      landingPageLink: () => cy.get('a[target="_blank"]').first(),
    };
  }

  /**
   * Filter Instansi diduga memakai Popover (bukan Radix Select), jadi opsinya
   * TIDAK muncul sebagai [role="option"]. Method ini sengaja dipisah dari
   * select() supaya salahnya kelihatan kalau dugaan ini meleset.
   */
  pilihInstansi(nama) {
    this.waitBodyUnlocked();
    this.extraElements.instansiTrigger().click();
    this.extraElements.instansiPanel().should('be.visible');
    cy.contains('[data-slot="popover-content"] button', nama).click();
    return this;
  }

  /**
   * Tautan ke halaman PPDB publik dibuka di tab baru. JANGAN diklik —
   * Cypress tidak mengikuti target="_blank". Cukup verifikasi href-nya.
   */
  assertLandingPageLink() {
    this.extraElements.landingPageLink()
      .should('have.attr', 'href')
      .and('not.be.empty');
    return this;
  }

  assertSemuaTabAda() {
    this.assertTabsExist();
    return this.assertTabCount(7);
  }
}

export default new PpdbPengaturanWebPage();
