// JurusanPage.js — POM modul Jurusan (Pengaturan > Akademik > Jurusan)
// Route: /setting/academic/major  |  Konvensi sama Kelas/Tingkat.
// Catatan: di modal Edit ada 2 Select (Instansi + Status) -> select di-scope BY LABEL.
//          Opsi dipilih via EXACT match ("Aktif" substring "Tidak Aktif", dst).

const ROUTE = '/setting/academic/major';
const DIALOG = '[data-slot="dialog-content"]';
const SETTLE = 1200; // jeda settle modal re-mount (form shadcn load async)

const rx = (t) => new RegExp(`^\\s*${String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
// form-item di dalam dialog yang label-nya = `label` (exact)
// form-item di dalam dialog yang label-nya mengandung `label` (3 label tidak saling substring -> aman)
const formItem = (label) =>
  cy.contains(`${DIALOG} [data-slot="form-label"]`, label).closest('[data-slot="form-item"]');

class JurusanPage {
  elements = {
    // LIST
    addButton: () => cy.contains('button[data-slot="dialog-trigger"]', 'Tambah Jurusan'),
    searchInput: () => cy.get('input[placeholder*="Cari" i]'),
    table: (opts) => cy.get('table', opts),
    tableRows: () => cy.get('table tbody tr'),
    rowByName: (name) => cy.contains('table tbody tr', name),

    // MODAL (re-use Tambah + Edit)
    dialog: () => cy.get(DIALOG),
    dialogTitle: () => cy.get(`${DIALOG} [data-slot="dialog-title"]`),
    jurusanInput: () => cy.get(`${DIALOG} input[name="name"]`),
    saveButton: () => cy.get(`${DIALOG} [data-slot="button"][type="submit"]`),
    cancelButton: () => cy.contains(`${DIALOG} [data-slot="dialog-close"]`, 'Batal'),
    formMessages: () => cy.get(`${DIALOG} [data-slot="form-message"]`),

    // SELECT (label-scoped) — Instansi & Status
    instansiTrigger: () => formItem('Instansi').find('[data-slot="select-trigger"]'),
    instansiValue: () => formItem('Instansi').find('[data-slot="select-value"]'),
    instansiError: () => formItem('Instansi').find('[data-slot="form-message"]'),
    statusTrigger: () => formItem('Status').find('[data-slot="select-trigger"]'),
    statusValue: () => formItem('Status').find('[data-slot="select-value"]'),
    jurusanError: () =>
      cy.get(`${DIALOG} input[name="name"]`).closest('[data-slot="form-item"]').find('[data-slot="form-message"]'),

    // OPSI (portal, di luar dialog) — exact match
    selectOption: (text) => cy.contains('[role="option"]', rx(text)),

    // TOAST
    successToast: () => cy.get('[data-sonner-toast][data-type="success"]'),

    // LIST FILTERS (toolbar, di luar dialog) — 2 select-trigger: [0]=Instansi, [1]=Status
    filterInstansiTrigger: () => cy.get('[data-slot="card-toolbar"] [data-slot="select-trigger"]').eq(0),
    filterStatusTrigger: () => cy.get('[data-slot="card-toolbar"] [data-slot="select-trigger"]').eq(1),
    emptyStateTitle: () => cy.contains('Data Jurusan tidak ditemukan'),

    // DELETE — popup konfirmasi pakai dialog-content yg sama (bukan alert-dialog).
    // Footer: tombol "Hapus" (data-slot="button", bg-destructive) + "Batal" (data-slot="dialog-close").
    deleteIcon: (name) => cy.contains('table tbody tr', name).find('svg.lucide-trash').closest('button'),
    deleteConfirmBtn: () => cy.contains(`${DIALOG} [data-slot="dialog-footer"] [data-slot="button"]`, /^\s*Hapus\s*$/),
    closeXButton: () => cy.get(DIALOG).find('svg.lucide-x').closest('button'),
  };

  // ===== NAVIGATION =====
  visit() {
    cy.visit(ROUTE);
    this.elements.table({ timeout: 15000 }).should('exist');
    return this;
  }

  openAddModal() {
    this.elements.addButton().click();
    this.elements.dialog().should('be.visible');
    cy.wait(SETTLE);
    this.elements.jurusanInput().should('be.visible'); // tunggu form benar-benar siap
    return this;
  }

  openEditByName(name) {
    cy.intercept('GET', '**/school-majors**').as('jrsList'); // tangkap request list
    this.search(name);
    cy.wait('@jrsList');                                     // tunggu response search landing dulu
    this.elements.rowByName(name).should('be.visible');      // tabel udah settle dgn hasil
    this.elements.rowByName(name)
      .find('svg.lucide-square-pen').closest('button')
      .should('be.visible').and('not.be.disabled')
      .click();
    this.elements.dialog().should('be.visible');
    this.elements.dialogTitle().should('be.visible');
    cy.wait(SETTLE);
    return this;
  }

  // ===== FORM ACTIONS =====
  selectInstansi(name) {
    this.elements.instansiTrigger().should('be.visible').and('not.be.disabled').click();
    this.elements.selectOption(name).should('be.visible').scrollIntoView().click({ force: true });
    this.elements.instansiValue().should('contain.text', name);
    return this;
  }

  selectStatus(value) {
    this.elements.statusTrigger().should('be.visible').and('not.be.disabled').click();
    this.elements.selectOption(value).should('be.visible').click({ force: true });
    this.elements.statusValue().should(($el) => { expect($el.text().trim()).to.eq(value); });
    return this;
  }

  fillJurusan(name) {
    this.elements.jurusanInput().should('be.visible').and('not.be.disabled');
    this.elements.jurusanInput().clear();      // re-query (anti stale)
    this.elements.jurusanInput().type(name);   // re-query lagi sebelum type
    return this;
  }

  clearJurusan() {
    this.elements.jurusanInput().should('not.be.disabled').clear();
    return this;
  }

  clickSave() { this.elements.saveButton().click(); return this; }
  clickCancel() { this.elements.cancelButton().click(); return this; }

  addJurusan(instansi, jurusan) {
    this.openAddModal();
    if (instansi) { this.selectInstansi(instansi); cy.wait(400); } // settle setelah form re-render
    if (jurusan) this.fillJurusan(jurusan);
    this.clickSave();
    return this;
  }

  search(term) {
    this.elements.searchInput().clear().type(term);
    cy.wait(600); // debounce
    return this;
  }

  clearSearch() {
    this.elements.searchInput().clear();
    cy.wait(600);
    return this;
  }

  filterByInstansi(name) {
    this.elements.filterInstansiTrigger().should('be.visible').click();
    this.elements.selectOption(name).should('be.visible').scrollIntoView().click({ force: true });
    cy.wait(600); // list refetch
    return this;
  }

  filterByStatus(value) {
    this.elements.filterStatusTrigger().should('be.visible').click();
    this.elements.selectOption(value).should('be.visible').click({ force: true });
    cy.wait(600);
    return this;
  }

  // ===== DELETE ACTIONS =====
  // Cari row -> klik ikon trash -> popup konfirmasi kebuka. Pola intercept sama openEditByName.
  openDeleteByName(name) {
    cy.intercept('GET', '**/school-majors**').as('jrsListDel');
    this.search(name);
    cy.wait('@jrsListDel');                                 // tunggu response search landing
    this.elements.rowByName(name).should('be.visible');     // tabel udah settle
    this.elements.deleteIcon(name)
      .should('be.visible').and('not.be.disabled')
      .click();
    this.elements.dialog().should('be.visible');
    this.elements.dialogTitle().should('be.visible');
    cy.wait(SETTLE);
    return this;
  }

  confirmDelete() { this.elements.deleteConfirmBtn().click(); return this; }

  deleteByName(name) {
    this.openDeleteByName(name);
    this.confirmDelete();
    return this;
  }

  // Tutup popup tanpa konfirmasi
  closeDeleteEscape() { cy.get('body').type('{esc}'); return this; }
  closeDeleteX() { this.elements.closeXButton().click(); return this; }

  // ===== ASSERTIONS =====
  assertDeleteDialogOpen() {
    this.elements.dialog().should('be.visible');
    this.elements.dialogTitle().should('contain.text', 'Hapus Jurusan');
    this.elements.deleteConfirmBtn().should('be.visible'); // tombol Hapus
    this.elements.cancelButton().should('be.visible');     // tombol Batal
    return this;
  }
  // Popup konfirmasi memuat nama jurusan (& instansi) target
  assertDeleteTextContains(text) {
    this.elements.dialog().should('contain.text', text);
    return this;
  }

  assertModalOpen(title = 'Tambah Jurusan') {
    this.elements.dialog().should('be.visible');
    this.elements.dialogTitle().should('contain.text', title);
    return this;
  }
  assertModalClosed() { cy.get(DIALOG).should('not.exist'); return this; }

  assertFormEmpty(placeholderInstansi = 'Pilih Instansi') {
    this.elements.instansiValue().should('contain.text', placeholderInstansi);
    this.elements.jurusanInput().should('have.value', '');
    this.elements.saveButton().should('exist');
    this.elements.cancelButton().should('exist');
    return this;
  }

  assertSuccessToast(text = 'Jurusan berhasil ditambahkan') {
    this.elements.successToast().should('be.visible').and('contain.text', text);
    return this;
  }
  assertNoSuccessToast() { cy.get('[data-sonner-toast][data-type="success"]').should('not.exist'); return this; }

  assertInstansiError(text = 'Instansi wajib diisi') {
    this.elements.instansiError().should('be.visible').and('contain.text', text);
    return this;
  }
  assertJurusanError(text = 'Jurusan wajib diisi') {
    this.elements.jurusanError().should('be.visible').and('contain.text', text);
    return this;
  }

  // prefill / field checks (Edit)
  assertStatusFieldExists() { this.elements.statusTrigger().should('be.visible'); return this; }
  assertJurusanValue(val) { this.elements.jurusanInput().should('have.value', val); return this; }
  assertInstansiValue(val) { this.elements.instansiValue().should('contain.text', val); return this; }
  assertStatusValue(val) { this.elements.statusValue().should(($el) => { expect($el.text().trim()).to.eq(val); }); return this; }

  assertRowExists(name) { cy.contains('table tbody tr', name).should('exist'); return this; }

  // Verifikasi data BENERAN persisted di backend: reload halaman dulu (list fresh dari server,
  // bukan state optimistic FE), baru cari & cek row. Kalau gagal di sini tapi toast sukses muncul
  // = FE false-success (data ga kesimpen walau UI bilang berhasil).
  assertPersisted(name) {
    this.visit();
    this.search(name);
    cy.contains('table tbody tr', name, { timeout: 10000 }).should('exist');
    return this;
  }
  assertNotPersisted(name) {
    this.visit();
    this.search(name);
    cy.get('table tbody').then(($b) => {
      if ($b.find('tr').length) cy.contains('table tbody tr', name).should('not.exist');
    });
    return this;
  }
  assertRowCount(n) { cy.get('table tbody tr').should('have.length', n); return this; }
  assertRowNotExists(name) {
    cy.get('table tbody').then(($b) => {
      if ($b.find('tr').length) cy.contains('table tbody tr', name).should('not.exist');
    });
    return this;
  }
  assertRowStatus(name, status) {
    this.elements.rowByName(name).should(($row) => {
      expect(Cypress.$($row).find('[data-slot="badge"]').text().trim()).to.eq(status);
    });
    return this;
  }
  assertRowInstansi(name, instansi) {
    this.elements.rowByName(name).should(($row) => {
      expect(Cypress.$($row).find('td').eq(0).text().trim()).to.eq(instansi);
    });
    return this;
  }

  // ===== LIST assertions =====
  assertColumns() {
    cy.get('table thead').within(() => {
      cy.contains('Instansi').should('exist');
      cy.contains('Jurusan').should('exist');
      cy.contains('Status').should('exist');
    });
    cy.get('table tbody tr').first().find('td').should('have.length', 6); // Instansi|Jurusan|Status|Dibuat Pada|Edit|Hapus
    return this;
  }
  assertRowHasActions() {
    cy.get('table tbody tr').first().within(() => {
      cy.get('svg.lucide-square-pen').should('exist');
      cy.get('svg.lucide-trash').should('exist');
    });
    return this;
  }
  assertFirstRowName(name) {
    cy.get('table tbody tr').first().should(($row) => {
      expect(Cypress.$($row).find('td').eq(1).text().trim()).to.eq(name);
    });
    return this;
  }
  assertAllRowsInstansi(instansi) {
    // .should(callback) auto-retry kalau list re-render (anti detached DOM)
    cy.get('table tbody tr').should(($rows) => {
      $rows.each((i, row) => {
        expect(Cypress.$(row).find('td').eq(0).text().trim()).to.eq(instansi);
      });
    });
    return this;
  }
  assertAllRowsStatus(status) {
    cy.get('table tbody tr').should(($rows) => {
      $rows.each((i, row) => {
        expect(Cypress.$(row).find('[data-slot="badge"]').text().trim()).to.eq(status);
      });
    });
    return this;
  }
  assertHasRows() {
    cy.get('table tbody tr').its('length').should('be.gt', 0);
    return this;
  }
  assertEmptyState() {
    this.elements.emptyStateTitle().should('be.visible');
    return this;
  }
}

export default new JurusanPage();