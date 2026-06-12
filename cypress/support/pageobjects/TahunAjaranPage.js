// 🔧 FIX MASTER: Single attribute selector (ends-with) — eliminates CSS comma precedence bug
// Match BOTH role="dialog" dan role="alertdialog" karena keduanya end with "dialog"
const DIALOG = '[role$="dialog"][data-state="open"]'

class TahunAjaranPage {
  // ========================================
  // ELEMENTS
  // ========================================
  elements = {
    // Sidebar
    sidebarLink: () => cy.get('a[href="/setting/academic/school-year"]'),
    akademikGroup: () => cy.contains('Akademik'),
    pengaturanGroup: () => cy.contains('PENGATURAN'),

    // Page header — 🔧 FIX: Flexible heading (h1/h2/h3/data-slot)
    pageTitle: (timeout = 10000) =>
      cy.contains('h1, h2, h3, [data-slot="page-title"]', 'Tahun Ajaran', { timeout }).first(),
    btnTambahTA: () => cy.contains('button', 'Tambah Tahun Ajaran'),

    // Modal
    dialog: (timeout = 10000) => cy.get(DIALOG, { timeout }),
    // 🔧 FIX: Lebih fleksibel — match h2 inside dialog (works for both Dialog & AlertDialog)
    dialogTitle: () => cy.get(DIALOG).find('h2').first(),

    // 🎯 FORM FIELDS — TAHUN (2 inputs dengan attribute berbeda)
    tahunInputs: () => cy.get(`${DIALOG} input[data-slot="form-control"]`)
      .filter('[type="number"], [readonly][placeholder="YYYY"]'),
    tahunAwalInput: () => cy.get(`${DIALOG} input[type="number"][maxlength="4"]`),
    tahunAkhirInput: () => cy.get(`${DIALOG} input[readonly][placeholder="YYYY"]`),

    // Form fields — Tanggal (buttons trigger date picker)
    tanggalMulaiBtn: () =>
      cy.get(`${DIALOG} [data-slot="form-item"]`)
        .contains('label', 'Tanggal Mulai')
        .parent()
        .find('button[data-slot="form-control"]'),
    tanggalAkhirBtn: () =>
      cy.get(`${DIALOG} [data-slot="form-item"]`)
        .contains('label', 'Tanggal Akhir')
        .parent()
        .find('button[data-slot="form-control"]'),

    // Action buttons
    btnSimpan: () => cy.get(`${DIALOG} button[type="submit"]`),
    // 🔧 FIX: btnBatal by TEXT (alertdialog gak punya data-slot="dialog-close")
    btnBatal: () =>
      cy.get(DIALOG).find('button')
        .filter((i, el) => Cypress.$(el).text().trim() === 'Batal')
        .first(),
    btnCloseX: () => cy.get(`${DIALOG} button:has(svg.lucide-x)`).first(),

    // Validation
    formMessage: () => cy.get(`${DIALOG} [data-slot="form-message"]`),
    formItemInvalid: () => cy.get(`${DIALOG} [data-slot="form-item"][data-invalid="true"]`),

    // List/table
    searchInput: () => cy.get('input[placeholder="Cari"]'),
    tableRows: () => cy.get('tbody tr'),
    paginationCounter: () => cy.contains(/\d+ - \d+ Dari \d+/),

    // Toast (sonner-based)
    toastSuccess: (timeout = 10000) =>
      cy.contains('Tahun ajaran berhasil ditambahkan', { timeout }),

    // ========================================
    // 🆕 LIST PAGE ELEMENTS
    // ========================================

    // Status badge
    statusBadge: () => cy.get('span[data-slot="badge"]'),

    // Sorting — 🔧 FIX: Generic selector (data-slot mungkin gak ada di rendered button)
    columnHeader: (text) =>
      cy.contains('th button', text),
    sortMenuItem: (text) => cy.contains('[role="menuitem"]', text),

    // Pagination — Detailed Controls
    paginationContainer: () => cy.get('[data-slot="data-grid-pagination"]'),
    perPageTrigger: () =>
      cy.get('[data-slot="data-grid-pagination"] button[role="combobox"]'),
    perPageValue: () =>
      cy.get('[data-slot="data-grid-pagination"] span[data-slot="select-value"]'),
    counter: () =>
      cy.get('[data-slot="data-grid-pagination"] .text-muted-foreground')
        .contains(/Dari/),
    prevBtn: () =>
      cy.get('[data-slot="data-grid-pagination"] button[data-slot="button"]')
        .filter((i, el) => Cypress.$(el).find('svg.lucide-move-left').length > 0)
        .first(),
    nextBtn: () =>
      cy.get('[data-slot="data-grid-pagination"] button[data-slot="button"]')
        .filter((i, el) => Cypress.$(el).find('svg.lucide-move-right').length > 0)
        .first(),

    // 🔧 FIX: Per-row Action Buttons — BROADER selector (no data-slot filter)
    editBtnInRow: ($row) =>
      cy.wrap($row).find('button')
        .filter((i, el) => Cypress.$(el).find('svg.lucide-square-pen').length > 0)
        .first(),
    deleteBtnInRow: ($row) =>
      cy.wrap($row).find('button')
        .filter((i, el) => Cypress.$(el).find('svg.lucide-trash').length > 0)
        .first(),

    // 🆕 EDIT MODAL — Field Aliases (reuse selector existing tahun inputs)
    editTahunAwal: () => cy.get(`${DIALOG} input[type="number"][maxlength="4"]`),
    editTahunAkhir: () => cy.get(`${DIALOG} input[readonly][placeholder="YYYY"]`),
    editSemesterCombobox: () => cy.get(`${DIALOG} button[role="combobox"]`).eq(0),
    editStatusCombobox: () => cy.get(`${DIALOG} button[role="combobox"]`).eq(1),
    editTanggalAkhirBtn: () =>
      cy.get(`${DIALOG} button[data-slot="form-control"][aria-haspopup="menu"]`).eq(1),

    // 🆕 EDIT TA — year fields READONLY (di EDIT, Tahun Ajaran pakai readonly, bukan type=number)
    //    Ada 2 input placeholder="YYYY": eq(0)=Awal, eq(1)=Akhir
    editYearAwal: () => cy.get(`${DIALOG} input[placeholder="YYYY"]`).eq(0),
    editYearAkhir: () => cy.get(`${DIALOG} input[placeholder="YYYY"]`).eq(1),

    // 🆕 Toast EDIT success (beda dari add: "diperbarui" bukan "ditambahkan")
    toastEditSuccess: (timeout = 10000) =>
      cy.contains('Tahun ajaran berhasil diperbarui', { timeout }),

    // 🆕 Toast delete success (sonner [data-title])
    toastDeleteSuccess: (timeout = 10000) =>
      cy.contains('Tahun ajaran berhasil dihapus', { timeout }),

    // 🆕 Status option (Radix Select) — exact match biar "Aktif" gak ke-match "Tidak Aktif"
    statusOption: (text) =>
      cy.get('[role="option"]')
        .filter((i, el) => Cypress.$(el).text().trim() === text)
        .first(),

    // 🔧 FIX: Delete Confirm — find by text (works for alertdialog)
    btnConfirmDelete: () =>
      cy.get(DIALOG).find('button')
        .filter((i, el) => Cypress.$(el).text().trim() === 'Hapus')
        .first(),

    // Empty State
    emptyState: () => cy.contains('h3', 'Data Tahun Ajaran tidak ditemukan'),
    emptyStateTambahBtn: () => cy.contains('button', 'Tambah Tahun Ajaran'),
  }

  // ========================================
  // NAVIGATION — via Sidebar (Nested: PENGATURAN → Akademik → Tahun Ajaran)
  // ========================================
  visit(baseUrl, listPath) {
    // 🔧 FIX: Close any stale modal dari test sebelumnya (e.g. TC-030 leaves modal open)
    cy.get('body').then(($body) => {
      if ($body.find('[role$="dialog"][data-state="open"]').length > 0) {
        cy.get('body').type('{esc}')
        cy.wait(300)
      }
    })

    cy.url().should('not.include', '/auth')
    cy.wait(1500)

    // Expand "PENGATURAN" kalo "Akademik" belum keliatan
    cy.get('body').then(($body) => {
      const akademikVisible = $body.find(':contains("Akademik"):visible').length > 0
      if (!akademikVisible) {
        cy.contains('PENGATURAN').click({ force: true })
        cy.wait(600)
      }
    })

    // Expand "Akademik" kalo link belum keliatan
    cy.get('body').then(($body) => {
      const linkVisible = $body.find('a[href="/setting/academic/school-year"]:visible').length > 0
      if (!linkVisible) {
        cy.contains('Akademik').click({ force: true })
        cy.wait(600)
      }
    })

    // Klik link Tahun Ajaran
    this.elements.sidebarLink().click({ force: true })
    cy.wait(2000)

    cy.url().should('include', listPath)
    this.elements.pageTitle().should('be.visible')
    return this
  }

  // ========================================
  // FORM ACTIONS
  // ========================================
  openAddForm(timeout = 5000) {
    this.elements.btnTambahTA().click()
    this.elements.dialog(timeout).should('be.visible')
    cy.wait(500)
    return this
  }

  fillTahunAwal(year) {
    this.elements.tahunAwalInput().clear().type(year.toString())
    this.elements.tahunAwalInput().blur()
    cy.wait(300)
    return this
  }

  /**
   * Open Tanggal Mulai picker + verify popup kebuka
   */
  openTanggalMulaiPicker() {
    this.elements.tanggalMulaiBtn().click({ force: true })
    cy.wait(600)
    cy.get('.rdp-root', { timeout: 8000 }).should('be.visible')
    return this
  }

  /**
   * Open Tanggal Akhir picker + verify popup kebuka
   */
  openTanggalAkhirPicker() {
    this.elements.tanggalAkhirBtn().click({ force: true })
    cy.wait(600)
    cy.get('.rdp-root', { timeout: 8000 }).should('be.visible')
    return this
  }

  // 🆕 Buka date picker Tanggal Mulai DARI DALAM modal edit (button trigger)
  openTanggalMulaiPickerInModal() {
    this.elements.tanggalMulaiBtn().click({ force: true })
    cy.wait(600)
    cy.get('.rdp-root', { timeout: 8000 }).should('be.visible')
    return this
  }

  // ========================================
  // 🎯 DATE PICKER — react-day-picker dengan combobox month/year
  // ========================================
  pickDateFromString(dateString) {
    const [dayStr, monthStr, yearStr] = dateString.split('/')
    const monthIdx = parseInt(monthStr, 10) - 1
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December']
    const targetMonth = monthNamesEn[monthIdx]
    const isoDate = `${yearStr}-${monthStr.padStart(2, '0')}-${dayStr.padStart(2, '0')}`

    cy.get('.rdp-root', { timeout: 8000 }).should('be.visible')
    cy.wait(300)

    const calendarScope = () => cy.get('.rdp-root').parent()

    calendarScope().find('button[role="combobox"]').first().click({ force: true })
    cy.wait(500)
    cy.contains('[role="option"]', targetMonth).click({ force: true })
    cy.wait(500)

    calendarScope().find('button[role="combobox"]').eq(1).click({ force: true })
    cy.wait(500)
    cy.contains('[role="option"]', yearStr).click({ force: true })
    cy.wait(600)

    cy.get(`td[data-day="${isoDate}"] button`).click({ force: true })
    cy.wait(400)
    return this
  }

  pickDate(day, month, year) {
    const monthNamesId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December']
    let monthNum
    if (typeof month === 'string') {
      monthNum = monthNamesId.indexOf(month) + 1
      if (monthNum === 0) monthNum = monthNamesEn.indexOf(month) + 1
    } else {
      monthNum = parseInt(month, 10)
    }
    const dateString = `${String(day).padStart(2, '0')}/${String(monthNum).padStart(2, '0')}/${year}`
    return this.pickDateFromString(dateString)
  }

  // 🆕 Clear Tanggal Mulai: klik hari yang SEDANG terpilih (aria-selected) → toggle off → kosong
  clearTanggalMulaiByToggle() {
    this.elements.tanggalMulaiBtn().click({ force: true })
    cy.wait(600)
    cy.get('.rdp-root', { timeout: 8000 }).should('be.visible')
    // 🔧 FIX: REAL click (tanpa force) di hari terpilih — force gak nge-trigger toggle react-day-picker
    cy.get('.rdp-root')
      .find('button[aria-selected="true"], button.rdp-day_selected, [aria-selected="true"] > button')
      .first()
      .scrollIntoView()
      .click() // real click → fire react onClick → toggle off
    cy.wait(500)
    cy.get('body').then(($b) => {
      if ($b.find('.rdp-root:visible').length > 0) {
        cy.get('body').type('{esc}')
        cy.wait(300)
      }
    })
    this.elements.tanggalMulaiBtn().should('contain.text', 'DD/MM/YYYY')
    return this
  }

  // 🆕 Set Tanggal Mulai ke tanggal baru (robust): navigate month/year → klik day →
  //    kalau ke-deselect (kosong), klik lagi. Handle picker yang toggle-off saat ada seleksi.
  setTanggalMulaiInModal(dateString) {
    const [d, m, y] = dateString.split('/')
    const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    const monthEn = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'][parseInt(m, 10) - 1]

    this.elements.tanggalMulaiBtn().click({ force: true })
    cy.wait(600)
    cy.get('.rdp-root', { timeout: 8000 }).should('be.visible')
    const scope = () => cy.get('.rdp-root').parent()

    scope().find('button[role="combobox"]').first().click({ force: true })
    cy.wait(400)
    cy.contains('[role="option"]', monthEn).click({ force: true })
    cy.wait(400)
    scope().find('button[role="combobox"]').eq(1).click({ force: true })
    cy.wait(400)
    cy.contains('[role="option"]', y).click({ force: true })
    cy.wait(400)

    cy.get(`td[data-day="${iso}"] button`).click({ force: true })
    cy.wait(400)
    // 🔧 kalau klik malah deselect (jadi kosong), klik sekali lagi buat select
    this.elements.tanggalMulaiBtn().invoke('text').then((t) => {
      if (t.includes('DD/MM/YYYY')) {
        cy.get(`td[data-day="${iso}"] button`).click({ force: true })
        cy.wait(400)
      }
    })
    // tutup popover
    cy.get('body').then(($b) => {
      if ($b.find('.rdp-root:visible').length > 0) {
        cy.get('body').type('{esc}')
        cy.wait(300)
      }
    })
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
    this.elements.btnCloseX().click({ force: true })
    return this
  }

  closeWithEsc() {
    cy.get('body').type('{esc}')
    return this
  }

  // ========================================
  // COMBINED ACTIONS
  // ========================================
  saveExpectSuccess(dialogTimeout = 10000) {
    this.clickSimpan()
    this.elements.dialog(dialogTimeout).should('not.exist')
    this.elements.toastSuccess(dialogTimeout).should('be.visible')
    cy.url().should('include', '/setting/academic/school-year')
    return this
  }

  saveExpectFailure(errorTimeout = 8000) {
    this.clickSimpan()
    this.elements.dialog(errorTimeout).should('be.visible')
    return this
  }

  // ========================================
  // ASSERTIONS — LIST/TABLE
  // ========================================
  search(text) {
    // 🔧 FIX FINAL: search = SERVER-SIDE via URL param. Ngetik di Cypress ternyata gak nge-trigger
    //    RSC re-fetch (beda sama manual). Solusi: VISIT langsung ke ?search=... — niru PERSIS akses
    //    URL manual (bukti screenshot: ?search=2034 → 2 baris ter-filter). Hard-reload = server pasti filter.
    cy.location('pathname').then((path) => {
      cy.visit(`${path}?search=${encodeURIComponent(String(text))}`)
    })
    cy.url().should('not.include', '/auth')
    // tunggu hasil filter ter-render: ada baris data ATAU empty-state
    cy.get('body', { timeout: 12000 }).should(($b) => {
      const hasRow = $b.find('tbody tr').length > 0
      const empty = $b.find(':contains("tidak ditemukan")').length > 0
      expect(hasRow || empty, 'hasil search sudah ter-render').to.be.true
    })
    cy.wait(700)
    return this
  }

  clearSearch() {
    this.elements.searchInput().clear()
    cy.wait(500)
    return this
  }

  getRowByYearAndSemester(year, semester) {
    // 🔧 FIX: match lentur — tahun cocok penuh ATAU first-year cocok di awal (tahan beda
    //    separator/format), semester pakai includes (tahan dot/badge). Hindari false-0.
    const wantYear = String(year).replace(/\D/g, '')
    const firstYear = String(year).split('/')[0].replace(/\D/g, '')
    const wantSem = String(semester).toUpperCase()
    return cy.get('tbody tr').filter((_, row) => {
      const cells = Cypress.$(row).find('td')
      const yearCell = cells.eq(0).text().replace(/\D/g, '')
      const semesterCell = cells.eq(1).text().trim().toUpperCase()
      const yearMatch = yearCell === wantYear || (firstYear.length === 4 && yearCell.startsWith(firstYear))
      return yearMatch && semesterCell.includes(wantSem)
    })
  }

  assertTAInList(year, semester) {
    this.getRowByYearAndSemester(year, semester).should('have.length.greaterThan', 0)
    return this
  }

  assertTANotInList(year, semester) {
    this.getRowByYearAndSemester(year, semester).should('have.length', 0)
    return this
  }

  assertSemesterStatus(year, semester, expectedStatus) {
    this.getRowByYearAndSemester(year, semester)
      .find('[data-slot="badge"] p')
      .should('contain.text', expectedStatus)
    return this
  }

  assertRowDate(year, semester, colIdx, expectedDate) {
    this.getRowByYearAndSemester(year, semester)
      .find('td')
      .eq(colIdx)
      .should('contain.text', expectedDate)
    return this
  }

  assertValidationMessage(message) {
    this.elements.formMessage()
      .filter(`:contains("${message}")`)
      .should('be.visible')
    return this
  }

  assertModalOpen() {
    this.elements.dialog().should('exist').and('be.visible')
    return this
  }

  assertModalClosed(timeout = 10000) {
    this.elements.dialog(timeout).should('not.exist')
    return this
  }

  assertToastSuccess(timeout = 10000) {
    this.elements.toastSuccess(timeout).should('be.visible')
    return this
  }

  // ========================================
  // 🆕 LIST PAGE ACTIONS — 🔧 FIX: Click outside + verify menu opened
  // ========================================
  openSortMenu(columnName) {
    // 🔧 FIX: Close any stale dropdown by clicking outside (safer dari {esc} di body)
    cy.get('body').click(0, 0, { force: true })
    cy.wait(300)

    this.elements.columnHeader(columnName)
      .should('be.visible')
      .click({ force: true })

    // 🔧 FIX: Verify menu actually opened di DOM (Radix portal)
    cy.get('[role="menu"][data-state="open"]', { timeout: 5000 }).should('be.visible')
    cy.contains('[role="menuitem"]', 'Asc', { timeout: 5000 }).should('be.visible')
    return this
  }

  selectSortOption(option) {
    this.elements.sortMenuItem(option).click({ force: true })
    cy.wait(1000)
    return this
  }

  changePerPage(value) {
    this.elements.perPageTrigger().click()
    cy.wait(300)
    cy.get('[role="option"]').contains(value.toString()).click()
    cy.wait(800)
    return this
  }

  // 🆕 Tampilin SEMUA baris di 1 halaman (pilih opsi per-page TERBESAR) — ganti total
  //    ketergantungan search/pagination. Setelah ini, scan tbody langsung pasti lengkap.
  showAllRows() {
    cy.get('body').then(($b) => {
      if ($b.find('[data-slot="data-grid-pagination"] button[role="combobox"]').length === 0) {
        return // gak ada kontrol per-page, skip
      }
      this.elements.perPageTrigger().click({ force: true })
      cy.wait(400)
      cy.get('[role="option"]').then(($opts) => {
        const nums = [...$opts]
          .map((o) => parseInt(Cypress.$(o).text().replace(/\D/g, ''), 10))
          .filter((n) => !isNaN(n))
        const max = nums.length ? Math.max(...nums) : 10
        cy.get('[role="option"]').contains(String(max)).click({ force: true })
      })
      cy.wait(1200) // tunggu re-render semua baris
    })
    return this
  }

  // ========================================
  // 🆕 EDIT — TARGET EXISTING ROW (no-add approach)
  //    Ambil row yang udah ada di list, gak perlu nambah TA dulu
  //    Kolom: [0]Tahun Ajaran [1]Semester [2]Tgl Mulai [3]Tgl Akhir [4]Status
  // ========================================
  getFirstRowTarget() {
    // 🔧 FIX: retry sampai ada baris DATA beneran (year match ####/####), skip skeleton/kosong
    return cy.get('tbody tr', { timeout: 15000 })
      .should(($rows) => {
        const ok = [...$rows].some((r) => /\d{4}\/\d{4}/.test(Cypress.$(r).find('td').eq(0).text()))
        expect(ok, 'tabel harus punya minimal 1 baris data (tahun terisi)').to.be.true
      })
      .then(($rows) => {
        const row = [...$rows].find((r) => /\d{4}\/\d{4}/.test(Cypress.$(r).find('td').eq(0).text()))
        const c = Cypress.$(row).find('td')
        return {
          year: c.eq(0).text().trim(),
          semester: c.eq(1).text().trim().toUpperCase(),
          status: c.eq(4).text().trim(),
        }
      })
  }

  getFirstEditableRowBySemester(semester) {
    // 🔧 FIX: retry sampai ada baris dengan semester target (data udah render)
    return cy.get('tbody tr', { timeout: 15000 })
      .should(($rows) => {
        const ok = [...$rows].some((r) =>
          Cypress.$(r).find('td').eq(1).text().trim().toUpperCase() === semester.toUpperCase()
        )
        expect(ok, `harus ada baris semester ${semester}`).to.be.true
      })
      .then(($rows) => {
        const match = [...$rows].find((r) =>
          Cypress.$(r).find('td').eq(1).text().trim().toUpperCase() === semester.toUpperCase()
        )
        const c = Cypress.$(match).find('td')
        return {
          year: c.eq(0).text().trim(),
          semester: c.eq(1).text().trim().toUpperCase(),
          status: c.eq(4).text().trim(),
        }
      })
  }

  getFirstTidakAktifRow() {
    // 🔧 FIX: retry sampai ada baris status Tidak Aktif (data udah render)
    return cy.get('tbody tr', { timeout: 15000 })
      .should(($rows) => {
        const ok = [...$rows].some((r) => Cypress.$(r).find('td').eq(4).text().includes('Tidak Aktif'))
        expect(ok, 'harus ada baris status Tidak Aktif').to.be.true
      })
      .then(($rows) => {
        const match = [...$rows].find((r) => Cypress.$(r).find('td').eq(4).text().includes('Tidak Aktif'))
        const c = Cypress.$(match).find('td')
        return {
          year: c.eq(0).text().trim(),
          semester: c.eq(1).text().trim().toUpperCase(),
        }
      })
  }

  // 🆕 Assert status badge dengan SEARCH dulu (handle pagination) + EXACT match
  //    ("Aktif" substring dari "Tidak Aktif", jadi harus exact biar gak false-positive)
  assertStatusBySearch(year, semester, expectedStatus) {
    // 🔧 FIX: force-tutup modal/overlay sisa (body bisa pointer-events:none → esc butuh force)
    cy.get('body').type('{esc}', { force: true })
    cy.wait(300)
    cy.get('body').then(($b) => {
      if ($b.find(DIALOG).length > 0) { cy.get('body').type('{esc}', { force: true }); cy.wait(300) }
    })
    // 🔧 FIX: clear search dulu + tunggu baris DATA beneran (pola tahun), hindari empty-state race
    this.elements.searchInput().clear({ force: true })
    cy.wait(500)
    cy.get('tbody tr', { timeout: 12000 }).should(($r) => {
      const ok = [...$r].some((x) => /\d{4}\/\d{4}/.test(Cypress.$(x).find('td').eq(0).text()))
      expect(ok, 'tabel harus ada baris data sebelum search').to.be.true
    })
    this.search(String(year).split('/')[0])
    cy.wait(800)
    // 🔧 FIX: tunggu row target muncul (retry) sebelum baca badge
    this.getRowByYearAndSemester(year, semester).should('have.length.greaterThan', 0)
    this.getRowByYearAndSemester(year, semester)
      .find('[data-slot="badge"] p')
      .should(($p) => {
        expect($p.text().trim()).to.eq(expectedStatus)
      })
    return this
  }

  // ========================================
  // 🆕 EDIT MODAL ACTIONS — 🔧 FIX: Search isolate + scrollIntoView + native click
  // ========================================
  openEditModal(yearLabel, semester) {
    // 🔧 FIX: tutup modal sisa dari test sebelumnya dulu
    cy.get('body').then(($b) => {
      if ($b.find(DIALOG).length > 0) { cy.get('body').type('{esc}'); cy.wait(300) }
    })
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1)
    // 🔧 FIX: GANTI search → tampilin semua baris (no search dependency, no pagination)
    this.showAllRows()

    const clickEdit = () => {
      this.getRowByYearAndSemester(yearLabel, semester)
        .should('have.length.greaterThan', 0)
      // 🔧 FIX: Cypress .click({force}) (event lengkap) ganti native btn.click() yang gak trigger Radix
      this.getRowByYearAndSemester(yearLabel, semester)
        .find('button')
        .filter((i, el) => Cypress.$(el).find('svg.lucide-square-pen').length > 0)
        .first()
        .scrollIntoView()
        .click({ force: true })
    }
    clickEdit()
    cy.wait(1000)
    // 🔧 FIX: retry kalau dialog belum kebuka (native click kadang flaky)
    cy.get('body').then(($b) => {
      if ($b.find(DIALOG).length === 0) {
        clickEdit()
        cy.wait(800)
      }
    })
    this.elements.dialog(8000).should('be.visible')
    cy.wait(800)
    return this
  }

  // 🔧 FIX: exact text match — "Tidak Aktif" mengandung "Aktif" sbg substring
  changeStatusInModal(statusText) {
    this.elements.editStatusCombobox().click()
    cy.wait(300)
    cy.get('[role="option"]')
      .filter((i, el) => Cypress.$(el).text().trim() === statusText)
      .first()
      .click({ force: true })
    cy.wait(300)
    return this
  }

  saveModal() {
    this.elements.btnSimpan().click({ force: true })
    return this
  }

  // ========================================
  // 🆕 DELETE DIALOG ACTIONS — 🔧 FIX: Search isolate + scrollIntoView + native click
  // ========================================
  openDeleteDialog(yearLabel, semester) {
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1)
    // 🔧 FIX: GANTI search → tampilin semua baris (no search dependency, no pagination)
    this.showAllRows()

    const clickTrash = () => {
      this.getRowByYearAndSemester(yearLabel, semester)
        .should('have.length.greaterThan', 0)
      // 🔧 FIX: pakai Cypress .click({force}) (fire event lengkap) — native btn.click()
      //    gak nge-trigger Radix AlertDialog trigger. force krn tombol bisa ke-clip kolom action.
      this.getRowByYearAndSemester(yearLabel, semester)
        .find('button')
        .filter((i, el) => Cypress.$(el).find('svg.lucide-trash').length > 0)
        .first()
        .scrollIntoView()
        .click({ force: true })
    }
    clickTrash()
    cy.wait(1000)
    // 🔧 FIX: retry klik kalau dialog belum kebuka (kadang klik pertama ke-miss)
    cy.get('body').then(($b) => {
      if ($b.find(DIALOG).length === 0) {
        clickTrash()
        cy.wait(800)
      }
    })
    this.elements.dialog(8000).should('be.visible')
    cy.wait(800)
    return this
  }

  confirmDelete() {
    this.elements.btnConfirmDelete().click({ force: true })
    return this
  }

  // ========================================
  // 🆕 LIST PAGE ASSERTIONS
  // ========================================
  assertEmptyState() {
    this.elements.emptyState().should('be.visible')
    return this
  }

  assertRowNotExists(yearLabel, semester) {
    cy.get('table tbody tr').then(($rows) => {
      const found = [...$rows].some((el) => {
        const text = Cypress.$(el).text()
        return text.includes(yearLabel) && text.includes(semester)
      })
      expect(found, `Row ${yearLabel} ${semester} should not exist`).to.be.false
    })
    return this
  }
}

export default new TahunAjaranPage()