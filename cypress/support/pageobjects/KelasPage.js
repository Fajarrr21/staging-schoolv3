// Page Object Model: Pengaturan > Akademik > Kelas
// Route: /setting/academic/class
// Konvensi: elements{} + method chainable (return this) + assertion terpisah.
// Mencakup: Tambah (modal) + List (tabel, filter, search).

class KelasPage {
  constructor() {
    this.url = '/setting/academic/class';
    this.rowsSel = 'table tbody tr';
    this.searchDebounce = 800;
    this.elements = {
      // ---------- TAMBAH (modal) ----------
      addButton: () => cy.contains('button[data-slot="dialog-trigger"]', 'Tambah Kelas'),
      dialog: () => cy.get('[data-slot="dialog-content"][role="dialog"]', { timeout: 15000 }),
      instansiTrigger: () =>
        this.elements.dialog().find('button[role="combobox"][data-slot="select-trigger"]').eq(0),
      statusTrigger: () =>
        this.elements.dialog().find('button[role="combobox"][data-slot="select-trigger"]').eq(1),
      instansiNativeSelect: () => this.elements.dialog().find('select').eq(0),
      kelasInput: () => this.elements.dialog().find('input[name="name"]'),
      saveButton: () => this.elements.dialog().find('button[type="submit"][data-slot="button"]'),
      cancelButton: () => this.elements.dialog().contains('button', 'Batal'),
      formMessage: () => this.elements.dialog().find('[data-slot="form-message"]'),
      successToast: () => cy.get('[data-sonner-toast][data-type="success"]', { timeout: 8000 }),

      // ---------- LIST ----------
      filterInstansiTrigger: () => cy.get('button[role="combobox"][data-slot="select-trigger"]').eq(0),
      filterStatusTrigger: () => cy.get('button[role="combobox"][data-slot="select-trigger"]').eq(1),
      searchInput: () => cy.get('input[placeholder="Cari"]', { timeout: 15000 }),
      filterChip: (label) => cy.get('[data-slot="card-header"]').contains('[data-slot="badge"]', label),
      tableRows: () => cy.get(this.rowsSel),
      emptyState: () => cy.contains('Data Kelas tidak ditemukan'),

      // ---------- HAPUS (popup konfirmasi pakai dialog-content yg sama) ----------
      deleteConfirmBtn: () => this.elements.dialog().contains('button', 'Hapus'), // tombol merah "Hapus"
      deleteCancelBtn: () => this.elements.dialog().contains('button', 'Batal'),
      deleteCloseX: () => this.elements.dialog().find('svg.lucide-x').closest('button'),
    };
  }

  // ---------- actions: TAMBAH ----------
  visit(url) { cy.visit(url || this.url); return this; }

  openForm() {
    this.elements.addButton().click();
    this.elements.dialog().should('be.visible');
    return this;
  }

  selectInstansi(name) {
    this.elements.instansiTrigger().click();
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="option"]').contains(name).click();
    return this;
  }

  fillKelas(value) {
    this.elements.kelasInput().should('not.be.disabled').clear();
    if (value && value.length) {
      this.elements.kelasInput().should('not.be.disabled').type(value); // re-query + tunggu enabled lagi
    }
    return this;
  }

  save() {
    this.elements.dialog().should('be.visible');             // pastikan dialog masih ada (anti re-mount)
    this.elements.saveButton().should('be.enabled').click(); // tombol siap baru diklik
    return this;
  }
  cancel() { this.elements.cancelButton().click(); return this; }

  tambahKelas(instansi, nama) {
    this.openForm();
    if (instansi) this.selectInstansi(instansi);
    if (typeof nama !== 'undefined') this.fillKelas(nama);
    this.save();
    return this;
  }

  // ---------- actions: EDIT ----------
  openEditForm(nama) {
    this.elements.tableRows().contains('td', nama).should('be.visible');
    cy.wait(this.searchDebounce); // page berat (byk data) butuh waktu hydrate sblm klik -> handler nempel
    // klik tombol EDIT lewat icon pensilnya langsung -> anti salah tombol (hapus dll)
    this.elements.tableRows().contains('td', nama).parents('tr').first()
      .find('svg.lucide-square-pen').closest('button')
      .click();
    this.elements.dialog().should('be.visible');
    // form RE-MOUNT sekali tepat setelah open (load opsi instansi/status async).
    // bukti manual: dibuka tangan + nunggu sebentar -> form stabil; Cypress kena krn terlalu cepat.
    this.elements.kelasInput().should('have.value', nama);  // prefill awal muncul
    cy.wait(this.searchDebounce);                           // lewatin window re-mount
    this.elements.kelasInput().should('have.value', nama).and('not.be.disabled'); // stabil pasca re-mount
    return this;
  }

  selectStatus(value) {
    this.elements.statusTrigger().click();
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="option"]').contains(value).click();
    return this;
  }

  // ---------- actions: HAPUS ----------
  openDeleteConfirm(nama) {
    this.elements.tableRows().contains('td', nama).should('be.visible');
    cy.wait(this.searchDebounce); // page berat butuh waktu hydrate sblm klik
    // klik tombol HAPUS lewat icon trash-nya langsung -> anti salah tombol
    this.elements.tableRows().contains('td', nama).parents('tr').first()
      .find('svg.lucide-trash').closest('button')
      .click();
    this.elements.dialog().should('be.visible');
    return this;
  }

  confirmDelete() {
    this.elements.deleteConfirmBtn().should('be.enabled').click();
    return this;
  }

  cancelDelete() {
    this.elements.deleteCancelBtn().click();
    return this;
  }

  closeDeleteX() {
    this.elements.deleteCloseX().click();
    return this;
  }

  hapusKelas(nama) {
    this.openDeleteConfirm(nama);
    this.confirmDelete();
    return this;
  }

  // ---------- actions: LIST ----------
  filterByInstansi(name) {
    this.elements.filterInstansiTrigger().click();
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="option"]').contains(name).click();
    cy.get('[role="listbox"]').should('not.exist');
    cy.wait(this.searchDebounce);
    return this;
  }

  filterByStatus(value) {
    this.elements.filterStatusTrigger().click();
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="option"]').contains(value).click();
    cy.get('[role="listbox"]').should('not.exist');
    cy.wait(this.searchDebounce);
    return this;
  }

  search(keyword) {
    this.elements.searchInput().clear().type(keyword);
    cy.wait(this.searchDebounce);
    return this;
  }

  clearSearch() {
    this.elements.searchInput().clear();
    cy.wait(this.searchDebounce);
    return this;
  }

  resetFilterChip(label) {
    this.elements.filterChip(label).find('button').click();
    return this;
  }

  // ---------- assertions: TAMBAH ----------
  assertDialogOpen() { this.elements.dialog().should('be.visible'); return this; }
  assertDialogClosed() { cy.get('[data-slot="dialog-content"]').should('not.exist'); return this; }

  assertSuccessToast(text) {
    this.elements.successToast().should('be.visible').and('contain', text || 'Kelas berhasil ditambahkan');
    return this;
  }

  assertNoSuccessToast() {
    cy.get('[data-sonner-toast][data-type="success"]').should('not.exist');
    return this;
  }

  assertValidation(msg) { this.elements.formMessage().should('contain', msg); return this; }

  assertRowExists(nama) {
    this.elements.tableRows().contains('td', nama).should('exist');
    return this;
  }

  assertRowNotExists(nama) {
    cy.get('body').then(($b) => {
      if ($b.find(this.rowsSel).length) {
        this.elements.tableRows().contains('td', nama).should('not.exist');
      }
    });
    return this;
  }

  // ---------- assertions: LIST ----------
  assertTableVisible() { cy.get('table').should('be.visible'); return this; }
  assertHasRows() { this.elements.tableRows().should('have.length.at.least', 1); return this; }
  assertEmptyState() { this.elements.emptyState().should('be.visible'); return this; }

  // kolom: Instansi(0), Kelas(1), Status badge(2), Dibuat Pada(3), Edit(4), Hapus(5)
  assertColumnsPresent() {
    this.elements.tableRows().first().within(() => {
      cy.get('td').should('have.length.at.least', 5);
      cy.get('[data-slot="badge"]').should('exist');
      cy.get('svg.lucide-square-pen').should('exist');
      cy.get('svg.lucide-trash').should('exist');
    });
    return this;
  }

  // loop re-query per index (anti detached-DOM)
  assertEachRowHasActions() {
    cy.get(this.rowsSel).should(($rows) => {
      expect($rows.length, 'jumlah baris').to.be.greaterThan(0);
      $rows.each((i, el) => {
        expect(el.querySelector('svg.lucide-square-pen'), `edit icon row ${i}`).to.exist;
        expect(el.querySelector('svg.lucide-trash'), `hapus icon row ${i}`).to.exist;
      });
    });
    return this;
  }

  assertFirstRowName(nama) {
    this.elements.tableRows().first().find('td').eq(1).should('contain', nama);
    return this;
  }

  assertAllRowsInstansi(name) {
    cy.get(this.rowsSel).should(($rows) => {
      expect($rows.length, 'jumlah baris').to.be.greaterThan(0);
      $rows.each((i, el) => {
        const cell = el.querySelectorAll('td')[0];
        expect(cell && cell.textContent, `instansi row ${i}`).to.contain(name);
      });
    });
    return this;
  }

  // exact + .should(callback) yg retry (anti baca '' saat transisi)
  assertAllRowsStatus(value) {
    cy.get(this.rowsSel).should(($rows) => {
      expect($rows.length, 'jumlah baris').to.be.greaterThan(0);
      $rows.each((i, el) => {
        const cell = el.querySelectorAll('td')[2];
        expect(cell && cell.textContent.trim(), `status row ${i}`).to.eq(value);
      });
    });
    return this;
  }

  assertRowStatus(nama, value) {
    this.elements.tableRows().contains('td', nama).parents('tr').first()
      .find('td').eq(2).should(($c) => {
        expect($c.text().trim()).to.eq(value);
      });
    return this;
  }

  assertFilterChip(label, value) {
    this.elements.filterChip(label).should('contain', value);
    return this;
  }

  // ---------- assertions: EDIT ----------
  assertEditDialog() {
    this.elements.dialog().find('[data-slot="dialog-title"]').should('contain', 'Edit Kelas');
    return this;
  }

  assertKelasValue(nama) {
    this.elements.kelasInput().should('have.value', nama);
    return this;
  }

  assertInstansiValue(name) {
    this.elements.instansiTrigger().find('[data-slot="select-value"]').should('contain', name);
    return this;
  }

  assertStatusValue(value) {
    this.elements.statusTrigger().find('[data-slot="select-value"]').should(($s) => {
      expect($s.text().trim()).to.eq(value);
    });
    return this;
  }

  // ---------- assertions: HAPUS ----------
  assertDeleteDialog() {
    this.elements.dialog().find('[data-slot="dialog-title"]').should('contain', 'Hapus Kelas');
    this.elements.dialog().should('contain', 'Apakah anda yakin');
    return this;
  }
}

module.exports = new KelasPage();