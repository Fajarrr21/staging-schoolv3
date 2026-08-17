// SidebarModalPage.js — base class untuk modul yang TIDAK punya halaman sendiri.
//
// Bentuk ini nyata di app: item sidebar-nya langsung membuka [role="dialog"]
// di atas halaman yang sedang aktif. Terkonfirmasi untuk Legalitas Bukti Bayar
// dan Pengaturan Perizinan.
//
// Kenapa perlu base terpisah: POM bergaya konstanta ROUTE tidak cocok di sini.
// Kalau dipaksa, hasilnya seperti kekeliruan di repo qa-cazh — PermissionTimePage
// mereka cy.visit ke halaman violation-type (modul yang beda!) lalu klik sidebar,
// dan fixture-nya menyimpan DUA kandidat route karena tidak pernah dipastikan.
// Di sini kita jujur: tidak ada route, yang ada `anchorRoute` (halaman mana pun
// yang dipakai sebagai pijakan) + `sidebarPath`.
//
// ---------------------------------------------------------------------------
// BENTUK CONFIG
// ---------------------------------------------------------------------------
//   modul        string    nama modul
//   anchorRoute  string    halaman pijakan sebelum klik sidebar
//   sidebarPath  string[]  jalur menu, cth ['Pengaturan', 'Tagihan', 'Legalitas Bukti Bayar']
//   dialogTitle  string    judul dialog untuk memastikan yang terbuka benar
//   fields       { key: { type, label, name? } }   type: text|select|switch|file|time
//   api          { save? }
//   timeouts     override

import { DIALOG, DIALOG_OPEN, formItem } from './helpers';
import BasePage from './BasePage';

export default class SidebarModalPage extends BasePage {
  constructor(config) {
    super({ fields: {}, api: {}, sidebarPath: [], ...config });
  }

  _field(key) {
    const f = this.cfg.fields[key];
    if (!f) {
      throw new Error(
        `[${this.cfg.modul}] field "${key}" belum dideklarasikan di config POM. ` +
          `Field tersedia: ${Object.keys(this.cfg.fields).join(', ') || '(kosong)'}`,
      );
    }
    return f;
  }

  get elements() {
    return {
      dialog: () => cy.get(DIALOG, { timeout: this.t.dialog }),
      dialogOpen: () => cy.get(DIALOG_OPEN, { timeout: this.t.dialog }),
      dialogTitle: () => cy.get(`${DIALOG} [data-slot="dialog-title"]`),
      saveButton: () => cy.get(`${DIALOG} button[type="submit"]`),
      closeButton: () => cy.get(`${DIALOG} [data-slot="dialog-close"]`),

      fieldItem: (key) => formItem(this._field(key).label),
      input: (key) =>
        cy.get(`${DIALOG} input[name="${this._field(key).name}"]`, { timeout: this.t.dialog }),
      selectTrigger: (key) => formItem(this._field(key).label).find('[data-slot="select-trigger"]'),
      selectValue: (key) => formItem(this._field(key).label).find('[data-slot="select-value"]'),
      fieldError: (key) => formItem(this._field(key).label).find('[data-slot="form-message"]'),

      // Switch Radix: <button role="switch">, state di data-state.
      switch: (key) => formItem(this._field(key).label).find('button[role="switch"]'),

      // Input file biasanya disembunyikan di balik dropzone — pakai selectFile
      // dengan { force: true } karena elemennya memang tidak visible by design.
      fileInput: () => cy.get(`${DIALOG} input[type="file"]`),

      // React Aria time field: BUKAN <input type="time">. Tiap segmen terpisah.
      timeField: (key) => formItem(this._field(key).label).find('[data-slot="datefield"]'),
      timeSegment: (key, type) =>
        formItem(this._field(key).label).find(`[data-slot="datefield"] [data-type="${type}"]`),
    };
  }

  // =========================================================================
  // NAVIGATION — tidak ada cy.visit ke modul ini; masuk lewat sidebar.
  // =========================================================================
  open() {
    if (this.cfg.anchorRoute) cy.visit(this.cfg.anchorRoute);
    this.openSidebarPath(this.cfg.sidebarPath);
    this.elements.dialogOpen().should('be.visible');
    if (this.cfg.dialogTitle) {
      this.elements.dialogTitle().should('contain.text', this.cfg.dialogTitle);
    }
    return this;
  }

  close() {
    this.elements.closeButton().click();
    cy.get(DIALOG).should('not.exist');
    return this;
  }

  // =========================================================================
  // FORM ACTIONS
  // =========================================================================
  fill(key, value) {
    const f = this._field(key);
    const sel = `${DIALOG} input[name="${f.name}"]`;
    cy.get(sel, { timeout: this.t.dialog }).should('be.visible').and('not.be.disabled');
    cy.get(sel).clear();
    if (value !== '' && value !== null && value !== undefined) {
      cy.get(sel).type(String(value), { delay: 10 });
    }
    return this;
  }

  select(key, value) {
    this.openSelectAndPick(() => this.elements.selectTrigger(key), value);
    this.elements.selectValue(key).should('contain.text', value);
    return this;
  }

  toggle(key, on = true) {
    return this.setSwitch(() => this.elements.switch(key), on);
  }

  /**
   * Upload file. `force: true` disengaja: input[type=file] memang sengaja
   * disembunyikan di balik dropzone, jadi ini BUKAN kasus force menutupi bug.
   */
  upload(filePath) {
    this.elements.fileInput().selectFile(filePath, { force: true });
    return this;
  }

  /**
   * Isi time field React Aria per segmen ("HH:mm").
   * Tidak bisa .clear().type() seperti input biasa — tiap segmen elemen sendiri.
   */
  fillTime(key, timeString) {
    const [hh, mm] = String(timeString).split(':');
    if (hh !== undefined) this.elements.timeSegment(key, 'hour').click().type(hh);
    if (mm !== undefined) this.elements.timeSegment(key, 'minute').type(mm);
    return this;
  }

  assertTime(key, expected) {
    const [hh, mm] = String(expected).split(':');
    if (hh !== undefined) this.elements.timeSegment(key, 'hour').should('have.text', hh);
    if (mm !== undefined) this.elements.timeSegment(key, 'minute').should('have.text', mm);
    return this;
  }

  fillForm(values = {}) {
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined) return;
      const type = this._field(key).type;
      if (type === 'select') this.select(key, value);
      else if (type === 'switch') this.toggle(key, value);
      else if (type === 'time') this.fillTime(key, value);
      else this.fill(key, value);
    });
    return this;
  }

  save() {
    if (this.cfg.api.save) cy.intercept('POST', this.cfg.api.save).as('saveAPI');
    this.elements.saveButton().click();
    return this;
  }

  // =========================================================================
  // ASSERTIONS
  // =========================================================================
  assertDialogOpen() {
    this.elements.dialog().should('be.visible');
    if (this.cfg.dialogTitle) {
      this.elements.dialogTitle().should('contain.text', this.cfg.dialogTitle);
    }
    return this;
  }

  assertDialogClosed() {
    cy.get(DIALOG).should('not.exist');
    return this;
  }

  assertFieldVisible(key) {
    this.elements.fieldItem(key).should('be.visible');
    return this;
  }

  assertFieldHidden(key) {
    cy.contains(`${DIALOG} [data-slot="form-label"]`, this._field(key).label).should('not.exist');
    return this;
  }

  assertFieldError(key, text) {
    const chain = this.elements.fieldError(key).should('be.visible');
    if (text) chain.and('contain.text', text);
    return this;
  }

  assertFormPrefilled(values = {}) {
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined) return;
      const type = this._field(key).type;
      if (type === 'select') this.elements.selectValue(key).should('contain.text', value);
      else if (type === 'switch') this.assertSwitchState(() => this.elements.switch(key), value);
      else if (type === 'time') this.assertTime(key, value);
      else this.elements.input(key).should('have.value', String(value));
    });
    return this;
  }

  /**
   * Verifikasi persistensi: tutup dialog, buka lagi, nilai harus sama.
   * Untuk modul modal-dari-sidebar ini pengganti "reload halaman".
   */
  assertPersisted(values = {}) {
    this.close();
    this.open();
    return this.assertFormPrefilled(values);
  }

  assertNotSilent() {
    cy.get('body').should(() => {
      const ok = Cypress.$('[data-sonner-toast][data-type="success"]').length > 0;
      const err = Cypress.$('[data-sonner-toast][data-type="error"]').length > 0;
      const msg = Cypress.$(`${DIALOG} [data-slot="form-message"]`)
        .toArray()
        .some((el) => el.textContent.trim().length > 0);
      expect(
        ok || err || msg,
        'FE harus memberi feedback (toast sukses/error atau pesan validasi), bukan diam',
      ).to.be.true;
    });
    return this;
  }
}
