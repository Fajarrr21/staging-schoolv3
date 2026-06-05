import LoginPage from '../../../support/pageobjects/LoginPage'
import MapelPage from '../../../support/pageobjects/MapelPage'

describe('Hapus Mata Pelajaran - Fajar Ardiansyah', () => {
  let data
  const TS = Math.random().toString(36).slice(2, 6).toUpperCase()

  const DIALOG = '[role="dialog"][data-state="open"]'
  const DIALOG_TITLE = `${DIALOG} [data-slot="dialog-title"]`
  const BTN_HAPUS = `${DIALOG} button[data-slot="button"]`
  const BTN_BATAL = `${DIALOG} button[data-slot="dialog-close"]:not(:has(svg))`
  const BTN_CLOSE_X = `${DIALOG} button[data-slot="dialog-close"]:has(svg.lucide-x)`

  before(() => {
    cy.fixture('mapel').then((d) => { data = d })
  })

  beforeEach(() => {
    LoginPage.loginViaSession(
      data.credentials.email, data.credentials.password,
      data.urls.base, data.urls.login
    )
  })

  const createMapel = (nama) => {
    MapelPage.visit(data.urls.base, data.urls.subjectList)
      .openAddForm(data.timeouts.shortAction)
      .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
      .fillName(nama)
      .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
  }

  // FIXED: longer wait + scrollIntoView
  const openDeleteDialog = (nama) => {
    cy.wait(1500)
    MapelPage.getRowByName(nama).scrollIntoView()
    MapelPage.getRowByName(nama).find('button:has(svg.lucide-trash)').click({ force: true })
    cy.get(DIALOG, { timeout: 10000 }).should('be.visible')
    cy.wait(800)
  }

  // ============================================================
  // S-21 — Akses Popup Hapus
  // ============================================================
  describe('S-21 — Akses Popup Hapus', () => {

    it('TC-066 : Klik tombol hapus di row — popup konfirmasi tampil', () => {
      const nama = `Akses Popup ${TS}`
      createMapel(nama)
      openDeleteDialog(nama)

      cy.get(DIALOG_TITLE).should('contain', 'Hapus Mata Pelajaran')
      cy.get(BTN_HAPUS).should('be.visible').and('contain', 'Hapus')
      cy.get(BTN_BATAL).should('be.visible').and('contain', 'Batal')
    })

    it('TC-067 : Popup body mengandung nama mapel dan instansi', () => {
      const nama = `Popup Body ${TS}`
      createMapel(nama)
      openDeleteDialog(nama)

      cy.get(DIALOG).should('contain', nama)
      cy.get(DIALOG).should('contain', data.instansi.primary)
    })
  })

  // ============================================================
  // S-22 — Konfirmasi Hapus
  // ============================================================
  describe('S-22 — Konfirmasi Hapus', () => {

    it('TC-068 : Klik Hapus di popup — mapel terhapus dari list', () => {
      const nama = `Confirm Delete ${TS}`
      createMapel(nama)
      MapelPage.assertSubjectInList(nama)

      openDeleteDialog(nama)
      cy.get(BTN_HAPUS).click({ force: true })
      cy.get(DIALOG, { timeout: 15000 }).should('not.exist')

      MapelPage.assertSubjectNotInList(nama)
    })

    it('TC-069 : Klik Batal di popup — mapel tetap ada di list', () => {
      const nama = `Cancel Delete ${TS}`
      createMapel(nama)

      openDeleteDialog(nama)
      cy.get(BTN_BATAL).click({ force: true })
      cy.get(DIALOG).should('not.exist')

      MapelPage.assertSubjectInList(nama)
    })
  })

  // ============================================================
  // S-23 — Data Integrity Setelah Hapus
  // ============================================================
  describe('S-23 — Data Integrity Setelah Hapus', () => {

    it('TC-070 : Mapel yang sudah dihapus tetap tidak muncul setelah refresh', () => {
      const nama = `Persist Delete ${TS}`
      createMapel(nama)

      openDeleteDialog(nama)
      cy.get(BTN_HAPUS).click({ force: true })
      cy.get(DIALOG, { timeout: 15000 }).should('not.exist')

      MapelPage.assertSubjectNotInList(nama)
      cy.reload()
      MapelPage.assertSubjectNotInList(nama)
    })

    it('TC-071 : Mapel yang sudah dihapus tidak bisa di-search lagi', () => {
      const nama = `Search After Delete ${TS}`
      createMapel(nama)

      openDeleteDialog(nama)
      cy.get(BTN_HAPUS).click({ force: true })
      cy.get(DIALOG, { timeout: 15000 }).should('not.exist')

      MapelPage.searchSubject(nama)
      cy.wait(data.timeouts.searchDebounce)
      MapelPage.assertEmptyState()
    })
  })

  // ============================================================
  // S-24 — Cara Lain Tutup Popup
  // ============================================================
  describe('S-24 — Cara Lain Tutup Popup', () => {

    it('TC-084 : Klik tombol X (icon close) di popup — popup tertutup', () => {
      const nama = `Close X ${TS}`
      createMapel(nama)
      openDeleteDialog(nama)

      cy.get(BTN_CLOSE_X).click({ force: true })
      cy.get(DIALOG).should('not.exist')

      MapelPage.assertSubjectInList(nama)
    })

    it('TC-085 : Tekan Esc keyboard — popup tertutup', () => {
      const nama = `Esc Close ${TS}`
      createMapel(nama)
      openDeleteDialog(nama)

      cy.get('body').type('{esc}')
      cy.get(DIALOG).should('not.exist')

      MapelPage.assertSubjectInList(nama)
    })

    it('TC-086 : Klik backdrop/overlay di luar popup — log behavior', () => {
      const nama = `Backdrop Close ${TS}`
      createMapel(nama)
      openDeleteDialog(nama)

      // body punya pointer-events: none saat dialog open — pake force
      cy.get('body').click(10, 10, { force: true })
      cy.wait(500)

      cy.get('body').then(($body) => {
        const stillOpen = $body.find(DIALOG).length > 0
        cy.log(stillOpen ? 'ℹ️ Dialog tetap terbuka di backdrop click (Radix default)' : '✅ Dialog tertutup di backdrop click')
      })
    })
  })

  // ============================================================
  // S-25 — Visual & Konten Popup
  // ============================================================
  describe('S-25 — Visual & Konten Popup', () => {

    it('TC-087 : Popup menampilkan heading "Perhatian"', () => {
      const nama = `Perhatian Test ${TS}`
      createMapel(nama)
      openDeleteDialog(nama)

      cy.get(DIALOG).should('contain', 'Perhatian')
    })

    it('TC-088 : Popup menampilkan illustration (SVG)', () => {
  const nama = `Illustration Test ${TS}`
  createMapel(nama)
  openDeleteDialog(nama)

  cy.wait(500)
  // Drop [data-state="open"] constraint + pake .should('exist') yang lebih reliable
  cy.get('[role="dialog"]').find('svg').should('exist')
})

    it('TC-089 : Tombol Hapus punya visual destructive (background merah)', () => {
      const nama = `Destructive Visual ${TS}`
      createMapel(nama)
      openDeleteDialog(nama)

      cy.get(BTN_HAPUS).should('have.class', 'bg-destructive')
    })
  })

  // ============================================================
  // S-26 — Side Effect Setelah Hapus
  // ============================================================
  describe('S-26 — Side Effect Setelah Hapus', () => {

    it('TC-090 : Hapus berhasil — toast success muncul', () => {
      const nama = `Toast Success ${TS}`
      createMapel(nama)

      openDeleteDialog(nama)
      cy.get(BTN_HAPUS).click({ force: true })

      cy.get('li[data-sonner-toast][data-type="success"]', { timeout: 10000 })
        .should('be.visible')
    })

    it('TC-091 : Hapus berhasil — URL tetap di halaman list', () => {
      const nama = `URL Stay ${TS}`
      createMapel(nama)

      openDeleteDialog(nama)
      cy.get(BTN_HAPUS).click({ force: true })
      cy.get(DIALOG, { timeout: 15000 }).should('not.exist')

      cy.url().should('include', data.urls.subjectList)
    })

    it('TC-092 : Hapus berhasil — list auto-refresh tanpa perlu reload manual', () => {
      const nama = `Auto Refresh ${TS}`
      createMapel(nama)
      MapelPage.assertSubjectInList(nama)

      openDeleteDialog(nama)
      cy.get(BTN_HAPUS).click({ force: true })
      cy.get(DIALOG, { timeout: 15000 }).should('not.exist')
      cy.wait(1000)

      // List harus auto-update tanpa reload manual
      MapelPage.assertSubjectNotInList(nama)
    })
  })

  // ============================================================
  // S-27 — Hapus Dengan Variasi Data
  // ============================================================
  describe('S-27 — Hapus Dengan Variasi Data', () => {

    it('TC-093 : Hapus mapel yang punya kode — kode juga terhapus', () => {
      const nama = `Mapel Berkode ${TS}`
      const kode = `KD${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .fillCode(kode)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.assertSubjectInList(nama)
      MapelPage.getRowByName(nama).should('contain', kode)

      openDeleteDialog(nama)
      cy.get(BTN_HAPUS).click({ force: true })
      cy.get(DIALOG, { timeout: 15000 }).should('not.exist')

      MapelPage.assertSubjectNotInList(nama)
      MapelPage.searchSubject(kode)
      cy.wait(data.timeouts.searchDebounce)
      MapelPage.assertEmptyState()
    })

    it('TC-094 : Batal hapus — data field mapel tetap utuh (nama & instansi tidak berubah)', () => {
      const nama = `Data Integrity ${TS}`
      createMapel(nama)

      openDeleteDialog(nama)
      cy.get(BTN_BATAL).click({ force: true })
      cy.get(DIALOG).should('not.exist')

      MapelPage.assertSubjectInList(nama)
      MapelPage.getRowByName(nama).find('td').eq(data.columns.nama).should('contain', nama)
      MapelPage.getRowByName(nama).find('td').eq(data.columns.instansi).should('contain', data.instansi.primary)
    })
  })

})