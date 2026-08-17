// CrudListPage.js — base class untuk modul berpola "list + modal CRUD".
//
// Kenapa ada: TagPage.js ~570 baris, dan sekitar 60% isinya pola yang berulang
// persis di tiap POM (buka select Radix, body scroll-lock, assertion toast,
// assertion semua-baris, persistence check). Tiap modul baru selama ini menyalin
// ulang semua itu — termasuk menyalin ulang bug-nya.
//
// Primitif bersama (Radix, switch, toast, sidebar, timeouts) ada di BasePage.
// File ini khusus perilaku CRUD-nya.
//
// Dibangun sendiri mengikuti konvensi repo ini, BUKAN salinan repo qa-cazh.
// Perbedaan sikap yang disengaja terhadap repo mereka:
//   - Menunggu pakai cy.intercept + cy.wait('@alias'), bukan jeda angka.
//   - Tidak ada OR-list selector 4-6 alternatif.
//   - Tidak ada auto-create data dummy di tengah test.
//   - Tidak ada retry "klik Simpan dua kali" — kalau FE diam, itu harus FAIL.
//
// ---------------------------------------------------------------------------
// BENTUK CONFIG
// ---------------------------------------------------------------------------
//   route          string   path halaman list
//   modul          string   nama modul untuk pesan assertion
//   addButtonText  string   teks tombol tambah
//   titles         { add, edit, delete }   judul dialog
//   emptyState     string   teks empty state
//   fields         { key: { type, label, name?, placeholder? } }
//                  type: 'text' | 'number' | 'select'
//   columns        { key: index }  index kolom <td> di tabel
//   api            { list?, save?, delete? }  pola URL untuk cy.intercept
//   timeouts       override DEFAULT_TIMEOUTS (sebaiknya diisi dari fixture)
//
// STATUS SELECTOR: selector struktural di sini berlabel `crosschecked` di
// cypress/fixtures/app.json. Yang WAJIB diverifikasi per modul adalah isi
// CONFIG-nya — teks tombol, judul dialog, nama field, index kolom.

import { DIALOG, DIALOG_OPEN, rx, formItem, cellText } from './helpers';
import BasePage from './BasePage';

export default class CrudListPage extends BasePage {
  constructor(config) {
    super({ titles: {}, fields: {}, columns: {}, api: {}, ...config });
  }

  // =========================================================================
  // ELEMENTS — tiap elemen adalah fungsi supaya DOM di-re-query setiap dipakai.
  // Ini yang mencegah stale/detached element saat form re-render (RHF sering
  // remount controlled input setelah validasi).
  // =========================================================================
  get elements() {
    const { addButtonText, emptyState } = this.cfg;
    return {
      // ---------- LIST ----------
      addButton: () => cy.contains('button', rx(addButtonText)),
      searchInput: () => cy.get('input[placeholder*="Cari" i]', { timeout: this.t.table }),
      table: (opts) => cy.get('table', { timeout: this.t.table, ...opts }),
      tableRows: () => cy.get('table tbody tr'),
      rowByText: (text) => cy.contains('table tbody tr', text),
      emptyState: () => cy.contains(emptyState),

      // ---------- ROW ACTIONS (dibedakan lewat ikon, bukan posisi) ----------
      editIcon: (text) =>
        cy.contains('table tbody tr', text).find('svg.lucide-square-pen').closest('button'),
      deleteIcon: (text) =>
        cy.contains('table tbody tr', text).find('svg.lucide-trash').closest('button'),

      // ---------- DIALOG ----------
      dialog: () => cy.get(DIALOG, { timeout: this.t.dialog }),
      dialogOpen: () => cy.get(DIALOG_OPEN, { timeout: this.t.dialog }),
      dialogTitle: () => cy.get(`${DIALOG} [data-slot="dialog-title"]`),
      saveButton: () => cy.get(`${DIALOG} button[type="submit"]`),
      cancelButton: () => cy.contains(`${DIALOG} [data-slot="dialog-close"]`, /^\s*Batal\s*$/),
      closeXButton: () => cy.get(DIALOG).find('svg.lucide-x').closest('button'),
      deleteConfirmButton: () =>
        cy.contains(`${DIALOG} [data-slot="dialog-footer"] button`, /^\s*Hapus\s*$/),

      // ---------- FIELD (label-scoped) ----------
      fieldItem: (key) => formItem(this._field(key).label),
      input: (key) =>
        cy.get(`${DIALOG} input[name="${this._field(key).name}"]`, { timeout: this.t.dialog }),
      selectTrigger: (key) => formItem(this._field(key).label).find('[data-slot="select-trigger"]'),
      selectValue: (key) => formItem(this._field(key).label).find('[data-slot="select-value"]'),
      fieldError: (key) => formItem(this._field(key).label).find('[data-slot="form-message"]'),

      // ---------- PORTAL (opsi Radix di-render di luar dialog) ----------
      option: (text) => cy.contains('[role="option"]', rx(text), { timeout: this.t.dropdown }),
      anyOption: () => cy.get('[role="option"]', { timeout: this.t.dropdown }),
    };
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
  // NETWORK — cara menunggu yang diutamakan (aturan anti-flaky CLAUDE.md).
  // =========================================================================
  interceptList(alias = 'listAPI') {
    if (this.cfg.api.list) cy.intercept('GET', this.cfg.api.list).as(alias);
    return this;
  }

  interceptSave(alias = 'saveAPI') {
    if (this.cfg.api.save) cy.intercept('POST', this.cfg.api.save).as(alias);
    return this;
  }

  /**
   * Tunggu alias kalau intercept-nya terpasang. Kalau `api.*` belum diisi di
   * config (endpoint belum diketahui), ini sengaja no-op — supaya POM tetap
   * jalan, tapi TIDAK diam-diam diganti jeda angka.
   */
  waitAlias(alias, statusCode = 200) {
    if (!(this.cfg.api.list || this.cfg.api.save || this.cfg.api.delete)) {
      cy.log(`[${this.cfg.modul}] api.* belum diisi di config — @${alias} dilewati`);
      return this;
    }
    cy.wait(`@${alias}`, { timeout: this.t.api })
      .its('response.statusCode')
      .should('eq', statusCode);
    return this;
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================
  visit() {
    this.interceptList();
    cy.visit(this.cfg.route);
    this.elements.table().should('exist');
    return this;
  }

  // =========================================================================
  // FORM ACTIONS
  // =========================================================================
  openAddModal() {
    this.waitBodyUnlocked();
    this.elements.addButton().click();
    this.elements.dialogOpen().should('be.visible');
    if (this.cfg.titles.add) {
      this.elements.dialogTitle().should('contain.text', this.cfg.titles.add);
    }
    this._assertFormReady();
    return this;
  }

  openEditByText(text) {
    this.waitBodyUnlocked();
    this.elements.rowByText(text).should('be.visible');
    this.elements.editIcon(text).scrollIntoView().should('be.visible').and('not.be.disabled').click();
    this.elements.dialogOpen().should('be.visible');
    if (this.cfg.titles.edit) {
      this.elements.dialogTitle().should('contain.text', this.cfg.titles.edit);
    }
    this._assertFormReady();
    return this;
  }

  /**
   * Sinyal "form siap" = field text pertama mount & tidak disabled.
   * Ini menggantikan jeda angka `SETTLE` di POM lama: menunggu kondisi nyata,
   * bukan menebak berapa lama shadcn selesai me-mount form.
   */
  _assertFormReady() {
    const firstText = Object.values(this.cfg.fields).find(
      (f) => f.type === 'text' || f.type === 'number',
    );
    if (firstText) {
      cy.get(`${DIALOG} input[name="${firstText.name}"]`, { timeout: this.t.dialog })
        .should('be.visible')
        .and('not.be.disabled');
    }
    return this;
  }

  /** Isi field text/number. String kosong = kosongkan field. */
  fill(key, value) {
    const f = this._field(key);
    if (f.type === 'select') {
      throw new Error(`[${this.cfg.modul}] field "${key}" bertipe select — pakai select(), bukan fill()`);
    }
    const sel = `${DIALOG} input[name="${f.name}"]`;
    cy.get(sel, { timeout: this.t.dialog }).should('be.visible').and('not.be.disabled');
    cy.get(sel).clear();
    if (value !== '' && value !== null && value !== undefined) {
      cy.get(sel).type(String(value), { delay: 10 });
    }
    return this;
  }

  /** Buka Radix select lalu pilih opsi (exact-match). Mekanismenya di BasePage. */
  select(key, value) {
    this.openSelectAndPick(() => this.elements.selectTrigger(key), value);
    this.elements.selectValue(key).should('contain.text', value);
    return this;
  }

  /** Isi banyak field sekaligus: { instansi: 'X', nama: 'Y' } */
  fillForm(values = {}) {
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined) return;
      if (this._field(key).type === 'select') this.select(key, value);
      else this.fill(key, value);
    });
    return this;
  }

  save() {
    this.interceptSave();
    this.elements.saveButton().click();
    return this;
  }

  /** save() + pastikan dialog benar-benar tertutup (indikasi simpan diterima). */
  saveExpectSuccess() {
    this.save();
    cy.get(DIALOG, { timeout: this.t.dialog }).should('not.exist');
    return this;
  }

  cancel() {
    this.elements.cancelButton().click();
    cy.get(DIALOG).should('not.exist');
    return this;
  }

  closeByX() {
    this.elements.closeXButton().click();
    cy.get(DIALOG).should('not.exist');
    return this;
  }

  // =========================================================================
  // SEARCH
  // =========================================================================
  search(term) {
    this.interceptList('searchAPI');
    this.elements.searchInput().clear().type(term, { delay: 0 });
    this.waitAlias('searchAPI');
    return this;
  }

  clearSearch() {
    this.interceptList('clearSearchAPI');
    this.elements.searchInput().clear();
    this.waitAlias('clearSearchAPI');
    return this;
  }

  // =========================================================================
  // DELETE
  // =========================================================================
  openDeleteByText(text) {
    this.waitBodyUnlocked();
    this.elements.rowByText(text).should('be.visible');
    this.elements.deleteIcon(text).scrollIntoView().should('be.visible').and('not.be.disabled').click();
    this.elements.dialogOpen().should('be.visible');
    if (this.cfg.titles.delete) {
      this.elements.dialogTitle().should('contain.text', this.cfg.titles.delete);
    }
    return this;
  }

  confirmDelete() {
    this.elements.deleteConfirmButton().click();
    cy.get(DIALOG, { timeout: this.t.dialog }).should('not.exist');
    return this;
  }

  deleteByText(text) {
    this.openDeleteByText(text);
    this.confirmDelete();
    return this;
  }

  // =========================================================================
  // ASSERTIONS — DIALOG & FIELD
  // =========================================================================
  assertDialogOpen(title) {
    this.elements.dialog().should('be.visible');
    if (title) this.elements.dialogTitle().should('contain.text', title);
    return this;
  }

  assertDialogClosed() {
    cy.get(DIALOG).should('not.exist');
    return this;
  }

  assertFieldError(key, text) {
    const chain = this.elements.fieldError(key).should('be.visible');
    if (text) chain.and('contain.text', text);
    return this;
  }

  /** Field TIDAK di-flag error (dipakai TC boundary yang seharusnya lolos). */
  assertFieldValid(key) {
    this.elements.fieldItem(key).should('have.attr', 'data-invalid', 'false');
    return this;
  }

  assertFormPrefilled(values = {}) {
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined) return;
      if (this._field(key).type === 'select') {
        this.elements.selectValue(key).should('contain.text', value);
      } else {
        this.elements.input(key).should('have.value', String(value));
      }
    });
    return this;
  }

  /**
   * Assert dropdown berisi TEPAT opsi yang diharapkan.
   * Dibandingkan sebagai SET (di-sort), bukan array berurutan — tahan terhadap
   * perubahan urutan tanpa kehilangan kepastian jumlah & isinya.
   */
  assertOptions(key, expected = []) {
    this.elements.selectTrigger(key).click();
    this.elements.anyOption().should('have.length.gte', 1);
    cy.get('[role="option"]').should(($opts) => {
      const labels = [...$opts].map((o) => o.textContent.trim()).sort();
      expect(labels, `opsi field "${key}"`).to.deep.equal([...expected].sort());
    });
    this.pressEscape();
    return this;
  }

  /**
   * FE TIDAK boleh diam: harus ada toast sukses, toast error, ATAU pesan validasi.
   * Dipakai untuk kasus known-bug "FE silent" — assertion ini SENGAJA gagal
   * sampai bug diperbaiki. Jangan diakali dengan klik-ulang Simpan.
   */
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

  // =========================================================================
  // ASSERTIONS — LIST & ROW
  // =========================================================================
  assertRowExists(text) {
    cy.contains('table tbody tr', text).should('exist');
    return this;
  }

  assertRowNotExists(text) {
    cy.get('table tbody').then(($b) => {
      if ($b.find('tr').length) cy.contains('table tbody tr', text).should('not.exist');
    });
    return this;
  }

  assertRowCell(rowText, colKey, expected) {
    const idx = this._col(colKey);
    this.elements.rowByText(rowText).should(($row) => {
      expect(cellText($row[0], idx), `kolom "${colKey}" pada baris "${rowText}"`).to.eq(expected);
    });
    return this;
  }

  /** Baris teratas = data terbaru (sort default newest-first). */
  assertFirstRowCell(colKey, expected) {
    const idx = this._col(colKey);
    cy.get('table tbody tr').first().should(($row) => {
      expect(cellText($row[0], idx), `kolom "${colKey}" baris pertama`).to.eq(expected);
    });
    return this;
  }

  /**
   * Semua baris harus punya nilai kolom X yang sama — untuk memverifikasi filter.
   * Pakai .should(callback) + Cypress.$ sinkron. JANGAN .each() + cy.wrap():
   * itu menahan referensi elemen lama dan pecah kalau tabel re-render.
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

  assertHasRows() {
    cy.get('table tbody tr').its('length').should('be.gt', 0);
    return this;
  }

  assertEmptyState() {
    this.elements.emptyState().should('be.visible');
    return this;
  }

  assertColumnCount(count) {
    cy.get('table tbody tr').first().find('td').should('have.length', count);
    return this;
  }

  // =========================================================================
  // PERSISTENCE — reload dulu, jangan percaya optimistic UI update.
  // =========================================================================
  assertPersisted(text) {
    this.visit();
    this.search(text);
    cy.contains('table tbody tr', text, { timeout: this.t.table }).should('exist');
    return this;
  }

  assertNotPersisted(text) {
    this.visit();
    this.search(text);
    this.assertRowNotExists(text);
    return this;
  }

  // =========================================================================
  // CLEANUP — dipakai spec utility, BUKAN test case.
  // =========================================================================
  purgeByPrefix(prefix = 'QA', maxDelete = 30) {
    const step = (remaining) => {
      if (remaining <= 0) {
        cy.log(`[${this.cfg.modul}] batas MAX_DELETE tercapai — berhenti`);
        return;
      }
      cy.get('body').then(($b) => {
        const target = [...$b.find('table tbody tr')].find((tr) =>
          tr.textContent.includes(prefix),
        );
        if (!target) {
          cy.log(`[${this.cfg.modul}] tidak ada lagi baris berprefix "${prefix}"`);
          return;
        }
        const label = Cypress.$(target).text().match(new RegExp(`${prefix}\\w*`))[0];
        this.deleteByText(label);
        step(remaining - 1);
      });
    };
    step(maxDelete);
    return this;
  }
}
