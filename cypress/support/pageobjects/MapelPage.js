class MapelPage {
  elements = {
    // ===== List page =====
    pageTitle: () => cy.contains('h1', 'Mata Pelajaran'),
    btnTambah: () => cy.contains('button', 'Tambah Mata Pelajaran'),
    dataGrid: () => cy.get('table[data-slot="data-grid-table"]'),
    dataGridRows: () => cy.get('table[data-slot="data-grid-table"] tbody tr'),

    // ===== Search & Filter toolbar =====
    searchInput: () => cy.get('input[data-slot="input"][placeholder="Cari"]'),
    filterInstansiTrigger: () => cy.get('[data-slot="select-trigger"][class*="max-w-48"]').eq(0),
    filterStatusTrigger: () => cy.get('[data-slot="select-trigger"][class*="max-w-48"]').eq(1),
    sortHeader: (columnName) => cy.contains('th button[data-slot="dropdown-menu-trigger"]', columnName),
    columnHeader: (columnName) => cy.contains('th', columnName),

    // ===== Empty state =====
    emptyState: () => cy.contains('h3', 'Data Mata Pelajaran tidak ditemukan', { timeout: 10000 }),

    // ===== Action buttons in row =====
    btnEditInRow: (name) => cy.contains('table[data-slot="data-grid-table"] tr', name)
      .find('button:has(svg.lucide-square-pen)'),
    btnDeleteInRow: (name) => cy.contains('table[data-slot="data-grid-table"] tr', name)
      .find('button:has(svg.lucide-trash)'),

    // ===== Form dialog (support Dialog & AlertDialog) =====
    dialog: (timeout) => timeout
      ? cy.get('[role="dialog"], [role="alertdialog"]', { timeout })
      : cy.get('[role="dialog"], [role="alertdialog"]'),
    dialogTitle: () => cy.get('[role="dialog"] [data-slot="dialog-title"], [role="alertdialog"] [data-slot="alert-dialog-title"]'),
    nameInput: () => cy.get('input[name="name"]'),
    codeInput: () => cy.get('input[name="code"]'),

    // ===== Select triggers (label-based) =====
    instansiTrigger: () => cy.contains('[data-slot="form-item"] label', 'Instansi')
      .parent()
      .find('[data-slot="select-trigger"]'),
    statusTrigger: () => cy.contains('[data-slot="form-item"] label', 'Status')
      .parent()
      .find('[data-slot="select-trigger"]'),
    instansiListbox: (timeout = 6000) => cy.get('[role="listbox"]', { timeout }),

    // ===== Buttons in dialog =====
    btnSimpan: () => cy.contains('button', 'Simpan'),
    btnBatal: () => cy.contains('button', 'Batal'),
    btnCloseX: () => cy.get('[role="dialog"] button[data-slot="dialog-close"], [role="alertdialog"] button[data-slot="dialog-close"]')
      .filter(':has(svg.lucide-x)'),

    // ===== Delete dialog specific =====
    btnHapusInDialog: () => cy.get('[role="dialog"], [role="alertdialog"]').contains('button', 'Hapus'),
    btnBatalInDialog: () => cy.get('[role="dialog"], [role="alertdialog"]').contains('button', 'Batal'),

    // ===== Validation & toast =====
    formMessage: () => cy.get('[data-slot="form-message"]'),
    toast: () => cy.get('li[data-sonner-toast]'),
    visibleToast: () => cy.get('li[data-sonner-toast][data-visible="true"]'),
    successToast: () => cy.get('li[data-sonner-toast][data-type="success"]'),
    errorToast: () => cy.get('li[data-sonner-toast][data-type="error"]'),
  }

  // ===== Navigation =====
  visit(baseUrl, subjectPath) {
    cy.visit(`${baseUrl}${subjectPath}`)
    cy.url().should('include', subjectPath)
    return this
  }

  // ===== Add Form actions =====
  openAddForm(waitMs = 800) {
    this.elements.btnTambah().click()
    this.elements.dialog().should('be.visible')
    this.elements.nameInput().should('be.visible').and('not.be.disabled')
    cy.wait(waitMs)
    return this
  }

  // ===== Edit Form actions (FIXED: longer wait + scrollIntoView + flexible dialog check) =====
  openEditForm(name, waitMs = 800) {
    cy.wait(1500) // wait for toast dismissal
    this.elements.btnEditInRow(name).scrollIntoView()
    this.elements.btnEditInRow(name).click({ force: true })
    cy.get('[role="dialog"], [role="alertdialog"]', { timeout: 10000 }).should('be.visible')
    cy.wait(500) // wait dialog stabilize
    this.elements.nameInput().should('be.visible').and('not.be.disabled')
    cy.wait(waitMs)
    return this
  }

  // ===== Delete actions =====
  openDeleteDialog(name, waitMs = 500) {
    cy.wait(1500)
    this.elements.btnDeleteInRow(name).scrollIntoView()
    this.elements.btnDeleteInRow(name).click({ force: true })
    cy.get('[role="dialog"], [role="alertdialog"]', { timeout: 10000 }).should('be.visible')
    cy.wait(waitMs)
    return this
  }

  confirmDelete(dialogTimeout = 15000) {
    this.elements.btnHapusInDialog().click({ force: true })
    this.elements.dialog(dialogTimeout).should('not.exist')
    cy.log('✅ Mata pelajaran berhasil dihapus')
    return this
  }

  cancelDelete() {
    this.elements.btnBatalInDialog().click({ force: true })
    this.elements.dialog().should('not.exist')
    cy.log('✅ Delete dibatalkan — dialog tertutup')
    return this
  }

  // ===== Search & Filter actions =====
  searchSubject(text) {
    this.elements.searchInput().clear()
    if (text) this.elements.searchInput().type(text)
    return this
  }

  clearSearch() {
    this.elements.searchInput().clear()
    return this
  }

  filterByInstansi(name, dropdownTimeout = 6000) {
    this.elements.filterInstansiTrigger().click({ force: true })
    this.elements.instansiListbox(dropdownTimeout).should('exist')
    cy.contains('[role="option"]', name).click({ force: true })
    return this
  }

  filterByStatus(status, dropdownTimeout = 6000) {
    this.elements.filterStatusTrigger().click({ force: true })
    this.elements.instansiListbox(dropdownTimeout).should('exist')
    cy.contains('[role="option"]', status).click({ force: true })
    return this
  }

  // ===== Form field actions (BULLETPROOF) =====
  selectInstansi(name, dropdownTimeout = 6000) {
    cy.get('[role="dialog"], [role="alertdialog"]', { timeout: 10000 }).should('be.visible')
    cy.wait(500)

    cy.get('[role="dialog"], [role="alertdialog"]')
      .contains('label', 'Instansi', { timeout: 5000 })
      .parent()
      .find('[data-slot="select-trigger"]')
      .should('be.visible')
      .click({ force: true })

    cy.get('[role="listbox"]', { timeout: dropdownTimeout }).should('exist')
    cy.contains('[role="option"]', name).click({ force: true })
    return this
  }

  selectStatus(statusText, dropdownTimeout = 6000) {
    cy.get('[role="dialog"], [role="alertdialog"]', { timeout: 10000 }).should('be.visible')
    cy.wait(500)

    cy.get('[role="dialog"], [role="alertdialog"]')
      .contains('label', 'Status', { timeout: 5000 })
      .parent()
      .find('[data-slot="select-trigger"]')
      .should('be.visible')
      .click({ force: true })

    cy.get('[role="listbox"]', { timeout: dropdownTimeout }).should('exist')
    cy.contains('[role="option"]', statusText).click({ force: true })
    return this
  }

  fillName(name) {
    this.elements.nameInput().type(name)
    return this
  }

  fillCode(code) {
    this.elements.codeInput().type(code)
    return this
  }

  clearAndFillName(name) {
    this.elements.nameInput().clear()
    if (name) this.elements.nameInput().type(name)
    return this
  }

  clearAndFillCode(code) {
    this.elements.codeInput().clear()
    if (code) this.elements.codeInput().type(code)
    return this
  }

  // ===== Button clicks (FIXED: clickSimpan dengan force) =====
  clickSimpan() {
    this.elements.btnSimpan().click({ force: true })
    return this
  }

  clickBatal() {
    this.elements.btnBatal().click({ force: true })
    return this
  }

  closeWithX() {
    this.elements.btnCloseX().click({ force: true })
    return this
  }

  closeWithEsc() {
    cy.get('body').type('{esc}')
    return this
  }

  // ===== Save / Update flows =====
  saveExpectSuccess(dialogTimeout = 15000, subjectPath = '/setting/academic/subject') {
    this.clickSimpan()
    this.elements.dialog(dialogTimeout).should('not.exist')
    cy.url().should('include', subjectPath)
    cy.log('✅ Form berhasil disimpan — dialog tertutup')
    return this
  }

  saveExpectFailure(waitMs = 2000) {
    this.clickSimpan()
    cy.wait(waitMs)
    this.elements.dialog().should('exist')
    cy.log('✅ Sistem menolak input — dialog tetap terbuka')
    return this
  }

  updateExpectSuccess(dialogTimeout = 15000, subjectPath = '/setting/academic/subject') {
    this.clickSimpan()
    this.elements.dialog(dialogTimeout).should('not.exist')
    cy.url().should('include', subjectPath)
    cy.log('✅ Update berhasil — dialog tertutup')
    return this
  }

  updateExpectFailure(waitMs = 2000) {
    this.clickSimpan()
    cy.wait(waitMs)
    this.elements.dialog().should('exist')
    cy.log('✅ Update gagal — dialog tetap terbuka')
    return this
  }

  // ===== Assertions =====
  assertSubjectInList(name) {
    this.elements.dataGrid().should('contain', name)
    return this
  }

  assertSubjectNotInList(name) {
    this.elements.dataGrid().should('not.contain', name)
    return this
  }

  assertEmptyState() {
    this.elements.emptyState().should('be.visible')
    return this
  }

  assertValidationMessage(message) {
    this.elements.formMessage().should('be.visible').and('contain', message)
    return this
  }

  assertValidationNotContains(message) {
    this.elements.formMessage().should('not.contain', message)
    return this
  }

  assertStatusActive(name) {
    this.getRowByName(name).should('not.contain', 'Tidak Aktif')
    return this
  }

  assertStatusInactive(name) {
    this.getRowByName(name).should('contain', 'Tidak Aktif')
    return this
  }

  assertColumnHeader(columnName) {
    this.elements.columnHeader(columnName).should('be.visible')
    return this
  }

  // ===== Row helpers =====
  getRowByName(name) {
    return cy.contains('table[data-slot="data-grid-table"] tr', name)
  }

  getCellTextFromRow(name, columnIndex) {
    return this.getRowByName(name).find('td').eq(columnIndex).invoke('text')
  }
}

export default new MapelPage()