/// <reference types="cypress" />
/**
 * Page Object Model — Pengaturan > Akademik > Tingkat (School Level)
 * CARDS School staging — route: /setting/academic/school-level
 * Author: Fajar Ardiansyah (QA)
 *
 * GOTCHA yang udah dibuktiin (jangan diulang):
 *  - SEARCH server-side via ?search= → pakai cy.visit('...?search=X'), jangan ngetik di kolom
 *  - Modal/dialog Radix → click({force:true}), JANGAN native $el[0].click()
 *  - Instansi = Radix Select; opsi render di PORTAL (di luar [role=dialog])
 *  - Toast = sonner → [data-title]; sukses = [data-type="success"]
 *  - BUG-007: error duplikat ("...sudah ada") TIDAK di-surface di FE → assert via cy.intercept
 */

const DIALOG = '[role="dialog"][data-state="open"]'

class TingkatPage {
  elements = {
    btnTambah: () => cy.contains('button', 'Tambah Tingkat'),
    dialog: () => cy.get(DIALOG),
    dialogTitle: () => cy.get(`${DIALOG} [data-slot="dialog-title"]`),
    // scope by form-item label (di form Edit ada 2 select: Instansi & Status)
    instansiTrigger: () =>
      cy.get(`${DIALOG} [data-slot="form-item"]`).filter(':has(label:contains("Instansi"))').find('[data-slot="select-trigger"]'),
    instansiValue: () =>
      cy.get(`${DIALOG} [data-slot="form-item"]`).filter(':has(label:contains("Instansi"))').find('[data-slot="select-value"]'),
    statusTrigger: () =>
      cy.get(`${DIALOG} [data-slot="form-item"]`).filter(':has(label:contains("Status"))').find('[data-slot="select-trigger"]'),
    statusValue: () =>
      cy.get(`${DIALOG} [data-slot="form-item"]`).filter(':has(label:contains("Status"))').find('[data-slot="select-value"]'),
    tingkatInput: () => cy.get(`${DIALOG} input[name="name"]`),
    btnSimpan: () => cy.get(DIALOG).contains('button', 'Simpan'),
    btnBatal: () => cy.get(DIALOG).contains('button', 'Batal'),
    // X close = dialog-close terakhir (Batal juga data-slot=dialog-close, tapi posisinya lebih awal)
    btnClose: () => cy.get(`${DIALOG} button[data-slot="dialog-close"]`).last(),
    // form-item per label, buat cek data-invalid="true"
    formItem: (labelText) =>
      cy.get(`${DIALOG} [data-slot="form-item"]`).filter(`:has(label:contains("${labelText}"))`),
    toastSuccess: (timeout = 8000) =>
      cy.get('[data-sonner-toast][data-type="success"] [data-title]', { timeout }),
    rows: () => cy.get('table tbody tr'),
  }

  // ---------- NAV ----------
  visit(base, list) {
    cy.visit(`${base}${list}`)
    cy.url().should('include', list)
    return this
  }

  // reliable filter (server-side) — buat cleanup / verifikasi list
  visitSearch(base, list, keyword) {
    cy.visit(`${base}${list}?search=${encodeURIComponent(keyword)}`)
    return this
  }

  openAddForm(timeout = 1500) {
    this.elements.btnTambah().should('be.visible').click()
    this.elements.dialog().should('be.visible')
    this.elements.dialogTitle().should('contain.text', 'Tambah Tingkat')
    cy.wait(timeout) // settle animasi radix
    return this
  }

  // ---------- FIELD ACTIONS ----------
  selectInstansi(name) {
    this.elements.instansiTrigger().click({ force: true })
    // opsi Radix render di portal (body), bukan di dalam dialog
    cy.contains('[role="option"]', new RegExp(`^\\s*${name}\\s*$`), { timeout: 8000 })
      .click({ force: true })
    this.elements.instansiValue().should('contain.text', name)
    return this
  }

  fillTingkat(value) {
    this.elements.tingkatInput().clear().type(value, { delay: 25 })
    return this
  }

  // set field Status di FORM (Edit) — label: Aktif / Tidak Aktif. (beda dari filter status di list)
  setStatus(label) {
    this.elements.statusTrigger().click({ force: true })
    cy.contains('[role="option"]', new RegExp(`^\\s*${label}\\s*$`), { timeout: 8000 })
      .click({ force: true })
    this.elements.statusValue().should('contain.text', label)
    return this
  }

  // buka form Edit utk row dgn nama tertentu: isolasi via search lalu klik ikon pensil
  openEditForm(name, timeout = 1500) {
    this.searchFor(name)
    cy.contains('table tbody tr', name)
      .find('button[data-slot="dialog-trigger"]').first() // tombol pertama = Edit (pensil)
      .click({ force: true })
    this.elements.dialog().should('be.visible')
    this.elements.dialogTitle().should('contain.text', 'Edit Tingkat')
    cy.wait(timeout)
    return this
  }

  // ---------- DELETE ----------
  // buka confirm dialog Hapus utk row dgn nama tertentu (klik ikon trash)
  openDeleteDialog(name, timeout = 1200) {
    this.searchFor(name)
    cy.contains('table tbody tr', name)
      .find('.lucide-trash').parents('button').first()
      .click({ force: true })
    this.elements.dialog().should('be.visible')
    this.elements.dialogTitle().should('contain.text', 'Hapus Tingkat')
    cy.wait(timeout)
    return this
  }

  // klik tombol "Hapus" (destructive) di confirm dialog
  confirmDelete() {
    this.elements.dialog().contains('button', 'Hapus').click({ force: true })
    return this
  }

  // batal hapus (reuse tombol Batal di dialog)
  cancelDelete() {
    this.elements.btnBatal().click({ force: true })
    return this
  }

  // pastikan row dgn nama tsb sudah tidak ada di list
  assertRowGone(name) {
    cy.contains('table tbody tr', name, { timeout: 8000 }).should('not.exist')
    return this
  }

  addTingkat(instansi, name) {
    this.selectInstansi(instansi).fillTingkat(name).clickSimpan()
    return this
  }

  clickSimpan() {
    this.elements.btnSimpan().click({ force: true })
    return this
  }

  clickBatal() {
    this.elements.btnBatal().click({ force: true })
    return this
  }

  closeWithX() {
    this.elements.btnClose().click({ force: true })
    return this
  }

  closeWithEsc() {
    cy.get('body').type('{esc}')
    return this
  }

  // ---------- ASSERTIONS ----------
  assertModalOpen() {
    this.elements.dialog().should('be.visible')
    return this
  }

  assertModalClosed() {
    cy.get(DIALOG).should('not.exist')
    return this
  }

  assertNoSuccessToast() {
    cy.get('[data-sonner-toast][data-type="success"]').should('not.exist')
    return this
  }

  // generik: cocok utk Tambah ("...ditambahkan") & Edit ("...diperbarui"), dua-duanya ada "berhasil"
  assertToastSuccess(timeout = 8000) {
    this.elements.toastSuccess(timeout).should('contain.text', 'berhasil')
    return this
  }

  assertFieldInvalid(labelText) {
    this.elements.formItem(labelText).should('have.attr', 'data-invalid', 'true')
    return this
  }

  // cek pesan validasi inline (mis. "Nama hanya boleh berisi huruf, angka, dan spasi")
  assertValidationText(text) {
    cy.get(DIALOG).contains(text).should('be.visible')
    return this
  }

  // cari row by nama tingkat, lalu pastikan instansi-nya cocok (kolom: Instansi | Tingkat | ...)
  assertRowInList(instansi, tingkat) {
    cy.contains('table tbody tr', tingkat, { timeout: 8000 })
      .should('exist')
      .within(() => {
        cy.contains(instansi).should('exist')
      })
    return this
  }

  // cek badge Status (td ke-3) pada row dgn nama tingkat tertentu
  assertRowStatus(tingkatName, status) {
    cy.contains('table tbody tr', tingkatName, { timeout: 10000 })
      .find('td').eq(2).should('contain.text', status)
    return this
  }

  // ============================================================
  // LIST — filter, search, pagination
  // (kolom: Instansi=td0 | Tingkat=td1 | Status=td2 | Dibuat=td3 | Edit=td4 | Hapus=td5)
  // ============================================================
  searchInput() { return cy.get('input[placeholder="Cari"]') }
  emptyState() { return cy.contains('Data Tingkat tidak ditemukan') }

  // PENTING: cy.visit('?search=') TIDAK nge-filter saat load utk modul ini.
  // Filter baru jalan kalau DIKETIK di kolom Cari (URL lalu jadi ?search=).
  searchFor(keyword) {
    // clear lalu PASTIKAN input benar2 kosong dulu (nahan race React controlled input
    // yg bisa balikin nilai lama -> ketikan nempel jadi "QAQA")
    this.searchInput().clear()
    this.searchInput().should('have.value', '')
    this.searchInput().type(keyword, { delay: 30 })
    this.searchInput().should('have.value', keyword) // mastiin ga nempel/akumulasi
    cy.url().should('include', 'search=') // tunggu URL update = bukti filter ke-trigger
    cy.wait(1200) // settle hasil server-side
    return this
  }

  clearSearch() {
    this.searchInput().clear()
    cy.wait(1000)
    return this
  }
  // status filter trigger = select-trigger ke-2 di toolbar (bukan yg di pagination).
  // by posisi, biar tetap kena walau label berubah (Status -> Aktif/Tidak Aktif/Semua)
  filterStatusTrigger() {
    return cy.get('[data-slot="select-trigger"]')
      .filter((i, el) => !el.closest('[data-slot="data-grid-pagination"]'))
      .eq(1)
  }
  perPageTrigger() { return cy.get('[data-slot="data-grid-pagination"] [data-slot="select-trigger"]') }

  // Filter Instansi via URL param ?office=<id> (confirmed reliable)
  filterByOffice(base, list, officeId) {
    cy.visit(`${base}${list}?office=${officeId}`)
    return this
  }

  // Filter Status via UI (Radix). label: Semua / Aktif / Tidak Aktif
  selectStatus(label) {
    this.filterStatusTrigger().click({ force: true })
    cy.contains('[role="option"]', new RegExp(`^\\s*${label}\\s*$`), { timeout: 8000 })
      .click({ force: true })
    return this
  }

  // set per-page ke opsi terbesar (scan langsung, hindari pagination)
  showAllRows() {
    this.perPageTrigger().click({ force: true })
    cy.get('[role="option"]', { timeout: 8000 }).last().click({ force: true })
    return this
  }

  // ---------- LIST assertions ----------
  assertColumns(cols) {
    cols.forEach((c) => cy.get('table thead').contains(c).should('exist'))
    return this
  }

  assertEmptyState() {
    this.emptyState().should('be.visible')
    return this
  }

  assertHasRows() {
    cy.get('table tbody tr', { timeout: 10000 }).should(($rows) => {
      const dataRows = [...$rows].filter((r) => r.children.length >= 4)
      expect(dataRows.length, 'ada minimal 1 data row').to.be.gte(1)
    })
    return this
  }

  assertAllRowsInstansi(name) {
    cy.get('table tbody tr', { timeout: 10000 }).should(($rows) => {
      const dataRows = [...$rows].filter((r) => r.children.length >= 4)
      expect(dataRows.length, 'ada minimal 1 data row').to.be.gte(1)
      const bad = dataRows.filter((r) => !r.children[0].innerText.includes(name))
      expect(bad.length, `semua row Instansi = ${name}`).to.eq(0)
    })
    return this
  }

  assertAllRowsStatus(status) {
    cy.get('table tbody tr', { timeout: 10000 }).should(($rows) => {
      const dataRows = [...$rows].filter((r) => r.children.length >= 4)
      expect(dataRows.length, 'ada minimal 1 data row').to.be.gte(1)
      const bad = dataRows.filter((r) => !r.children[2].innerText.includes(status))
      expect(bad.length, `semua row Status = ${status}`).to.eq(0)
    })
    return this
  }

  // baris paling baru ada di paling atas (sort created desc). should() -> retry sampai render selesai
  assertRowOrder(firstName, secondName) {
    cy.get('table tbody tr', { timeout: 10000 }).should(($rows) => {
      const texts = [...$rows].map((r) => r.innerText)
      const iFirst = texts.findIndex((t) => t.includes(firstName))
      const iSecond = texts.findIndex((t) => t.includes(secondName))
      expect(iFirst, `row "${firstName}" ada di list`).to.be.gte(0)
      expect(iSecond, `row "${secondName}" ada di list`).to.be.gte(0)
      expect(iFirst, `"${firstName}" harus di atas "${secondName}"`).to.be.lessThan(iSecond)
    })
    return this
  }
}

export default new TingkatPage()