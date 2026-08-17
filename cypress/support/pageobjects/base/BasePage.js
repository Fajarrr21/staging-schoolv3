// BasePage.js — primitif yang dipakai SEMUA bentuk halaman.
//
// Dipisah dari CrudListPage supaya modul yang bukan CRUD (modal-dari-sidebar,
// halaman bertab, dashboard read-only) tetap dapat penanganan Radix, toast, dan
// timeout yang sama — tanpa menyalin ulang kodenya tiga kali.
//
// Dibangun sendiri mengikuti konvensi repo ini. Dari repo qa-cazh kita hanya
// mengambil informasi *apa* yang ada di app (nama atribut, teks, struktur),
// bukan cara mereka menulis test.

import { rx, DEFAULT_TIMEOUTS } from './helpers';

export default class BasePage {
  constructor(config = {}) {
    this.cfg = {
      ...config,
      timeouts: { ...DEFAULT_TIMEOUTS, ...(config.timeouts || {}) },
    };
  }

  /** Inject timeouts dari fixture supaya angka tetap satu sumber (aturan FIX-001). */
  withTimeouts(timeouts = {}) {
    this.cfg.timeouts = { ...this.cfg.timeouts, ...timeouts };
    return this;
  }

  get t() {
    return this.cfg.timeouts;
  }

  // =========================================================================
  // RADIX — penanganan yang berulang di semua modul
  // =========================================================================
  /**
   * Radix mengunci scroll body (`pointer-events: none` + `data-scroll-locked`)
   * selama popper terbuka, dan kadang lupa melepasnya. Akibatnya klik berikutnya
   * diam-diam tidak kena. Ini pelajaran dari modul Tag di repo ini.
   */
  waitBodyUnlocked() {
    cy.get('body', { log: false }).then(($b) => {
      const popperOpen =
        $b.find('[data-slot="dropdown-menu-content"], [data-slot="select-content"], [role="option"]')
          .length > 0;
      if (popperOpen) {
        cy.get('body').type('{esc}', { force: true });
        cy.get('[role="option"]').should('not.exist');
      }
    });
    cy.get('body', { log: false }).then(($b) => {
      if ($b.css('pointer-events') === 'none') {
        cy.window({ log: false }).then((win) => {
          win.document.body.style.pointerEvents = '';
          win.document.body.removeAttribute('data-scroll-locked');
        });
      }
    });
    cy.get('body').should(($b) => {
      expect($b.css('pointer-events'), 'body tidak boleh terkunci Radix').not.to.eq('none');
    });
    return this;
  }

  /**
   * Buka Radix select lalu pilih opsi (exact-match).
   * `triggerFn` adalah fungsi yang mengembalikan chainable trigger-nya.
   * Retry sekali HANYA untuk membuka dropdown — bukan untuk mengulang aksi simpan.
   */
  openSelectAndPick(triggerFn, value) {
    triggerFn().should('be.visible').and('not.be.disabled').click();
    cy.get('body').then(($b) => {
      if (!$b.find('[role="option"]').length) {
        cy.log('dropdown tidak terbuka di klik pertama, retry');
        triggerFn().click();
      }
    });
    cy.get('[role="option"]', { timeout: this.t.dropdown }).should('have.length.gte', 1);
    cy.contains('[role="option"]', rx(value), { timeout: this.t.dropdown })
      .should('be.visible')
      .click();
    return this;
  }

  pressEscape() {
    cy.get('body').type('{esc}');
    return this;
  }

  // =========================================================================
  // SWITCH (Radix) — <button role="switch">, BUKAN <input type=checkbox>.
  // State dibaca dari data-state / aria-checked; `:checked` tidak berlaku.
  // =========================================================================
  setSwitch(switchFn, on = true) {
    switchFn().then(($sw) => {
      const checked =
        $sw.attr('data-state') === 'checked' || $sw.attr('aria-checked') === 'true';
      if (checked !== on) cy.wrap($sw).click();
    });
    switchFn().should('have.attr', 'data-state', on ? 'checked' : 'unchecked');
    return this;
  }

  assertSwitchState(switchFn, on) {
    switchFn().should('have.attr', 'data-state', on ? 'checked' : 'unchecked');
    return this;
  }

  // =========================================================================
  // TOAST (Sonner)
  // =========================================================================
  /**
   * Pola body + callback: satu timeout mencakup "toast muncul" DAN "teks cocok".
   * Chain .get().should().find().should() kadang jatuh ke timeout default.
   */
  assertSuccessToast(text) {
    cy.get('body', { timeout: this.t.toast }).should(() => {
      const $t = Cypress.$('[data-sonner-toast][data-type="success"]');
      expect($t.length, 'toast sukses muncul').to.be.gt(0);
      if (text) {
        const title = $t.find('[data-title]').first().text().trim() || $t.first().text().trim();
        expect(title, `toast memuat "${text}"`).to.include(text);
      }
    });
    return this;
  }

  assertErrorToast(text) {
    cy.get('body', { timeout: this.t.toast }).should(() => {
      const $t = Cypress.$('[data-sonner-toast][data-type="error"]');
      expect($t.length, 'toast error muncul').to.be.gt(0);
      if (text) expect($t.first().text(), `toast memuat "${text}"`).to.include(text);
    });
    return this;
  }

  /**
   * Toast warning — dipakai app untuk penolakan duplikasi.
   * Catatan: modul Jadwal Pelajaran memakai warning padahal semestinya
   * destructive (BUG-033). Jangan disamakan dengan error.
   */
  assertWarningToast(text) {
    cy.get('body', { timeout: this.t.toast }).should(() => {
      const $t = Cypress.$('[data-sonner-toast][data-type="warning"]');
      expect($t.length, 'toast warning muncul').to.be.gt(0);
      if (text) expect($t.first().text(), `toast memuat "${text}"`).to.include(text);
    });
    return this;
  }

  assertNoSuccessToast() {
    cy.get('[data-sonner-toast][data-type="success"]').should('not.exist');
    return this;
  }

  // =========================================================================
  // SIDEBAR — navigasi lewat menu, bukan cy.visit langsung.
  // Selector accordion masih berstatus `unverified` di app.json.
  // =========================================================================
  openSidebarMenu(label) {
    this.waitBodyUnlocked();
    cy.contains('[data-slot="accordion-menu-title"], [data-slot="accordion-menu-item"], a, button', rx(label), {
      timeout: this.t.dialog,
    })
      .should('be.visible')
      .click();
    return this;
  }

  /** Telusuri jalur menu berlapis: openSidebarPath(['Pengaturan', 'Kesiswaan', 'Tipe Pelanggaran']) */
  openSidebarPath(labels = []) {
    labels.forEach((l) => this.openSidebarMenu(l));
    return this;
  }
}
