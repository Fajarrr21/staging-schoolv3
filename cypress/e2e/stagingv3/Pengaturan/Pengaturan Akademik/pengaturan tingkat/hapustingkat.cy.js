import TingkatPage from '../../../../../support/pageobjects/TingkatPage'

// CATATAN: Fitur Hapus TIDAK punya PRD formal. Test case di-derive dari:
//  - konvensi delete standar CRUD
//  - pola fitur Hapus yang sudah ada di modul Tahun Ajaran
//  - konfirmasi langsung dari tim: hapus = plain delete, TANPA constraint
//    (tingkat status Aktif maupun Tidak Aktif sama-sama bisa dihapus)
// Mohon divalidasi PM (Safki) bila nanti PRD resmi terbit.

describe('Hapus Tingkat - Fajar Ardiansyah', () => {
  let data

  const runId = Date.now().toString().slice(-6)
  let _seq = 1
  const uniqueTingkat = () => `QA${runId}${_seq++}`

  before(() => {
    cy.fixture('tingkat').then((d) => { data = d })
  })

  beforeEach(() => {
    cy.session('admin-cazh-session', () => {
      cy.clearAllCookies()
      cy.clearAllLocalStorage()
      cy.clearAllSessionStorage()

      cy.visit(`${data.urls.base}${data.urls.login}`)
      cy.wait(2000)
      cy.get('input[name="email"]').should('be.visible')
        .clear().type(data.credentials.email, { delay: 50 })
      cy.get('input[type="password"]').should('be.visible')
        .clear().type(data.credentials.password, { delay: 50 })
      cy.wait(500)
      cy.intercept('POST', data.api.login).as('loginAPI')
      cy.get('button[type="submit"]').should('be.enabled').click()
      cy.wait('@loginAPI', { timeout: 15000 }).then((i) => {
        expect(i.response.statusCode).to.equal(200)
      })
      cy.wait(1000)
      cy.visit(`${data.urls.base}${data.urls.dashboard}`)
      cy.wait(2500)
      cy.url().should('not.include', '/auth')
    })

    cy.visit(`${data.urls.base}${data.urls.dashboard}`)
    cy.wait(1500)
    cy.url().should('not.include', '/auth')
  })

  // seed 1 tingkat (default status Aktif) -> nama unik biar rerun-safe
  const seed = (name, instansi) => {
    TingkatPage.visit(data.urls.base, data.urls.list)
      .openAddForm(data.timeouts.shortAction)
      .addTingkat(instansi || data.instansi.primary, name)
    TingkatPage.assertToastSuccess(data.timeouts.toast)
  }

  // ============================================================
  // S-01 — Akses & Konfirmasi
  // ============================================================
  describe('S-01 — Akses & Konfirmasi', () => {
    it('TC-DEL-001 : Klik ikon Hapus -> confirm dialog "Hapus Tingkat" muncul', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openDeleteDialog(name, data.timeouts.shortAction)
      TingkatPage.elements.dialog().should('be.visible')
      // pesan konfirmasi menyebut nama tingkat + instansi
      TingkatPage.elements.dialog().within(() => {
        cy.contains('Apakah anda yakin').should('exist')
        cy.contains(name).should('exist')
        cy.contains(data.instansi.primary).should('exist')
      })
    })
  })

  // ============================================================
  // S-02 — Cancel (data harus aman)
  // ============================================================
  describe('S-02 — Cancel', () => {
    it('TC-DEL-002 : Batal di confirm -> dialog tutup, data tetap ada', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openDeleteDialog(name, data.timeouts.shortAction)
      TingkatPage.cancelDelete()
      TingkatPage.assertModalClosed()

      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(name)
      cy.contains('table tbody tr', name).should('exist') // masih ada
    })

    it('TC-DEL-003 : Tutup via Esc -> dialog tutup, data tetap ada', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openDeleteDialog(name, data.timeouts.shortAction)
      TingkatPage.closeWithEsc()
      TingkatPage.assertModalClosed()

      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(name)
      cy.contains('table tbody tr', name).should('exist')
    })
  })

  // ============================================================
  // S-03 — Happy Path (hapus beneran)
  // ============================================================
  describe('S-03 — Happy Path', () => {
    it('TC-DEL-004 : Konfirmasi Hapus -> toast sukses + row hilang dari list', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openDeleteDialog(name, data.timeouts.shortAction)
      TingkatPage.confirmDelete()
      TingkatPage.assertToastSuccess(data.timeouts.toast) // "Tingkat berhasil dihapus"
    })

    it('TC-DEL-005 : Setelah dihapus, cari nama tsb -> tidak ditemukan (benar2 terhapus)', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openDeleteDialog(name, data.timeouts.shortAction)
      TingkatPage.confirmDelete()
      TingkatPage.assertToastSuccess(data.timeouts.toast)
      cy.wait(1000)

      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(name)
      TingkatPage.assertRowGone(name)
    })
  })

  // ============================================================
  // S-04 — Edge (no constraint: status apapun bisa dihapus)
  // ============================================================
  describe('S-04 — Edge', () => {
    it('TC-DEL-006 : Tingkat status "Tidak Aktif" tetap bisa dihapus (tanpa constraint)', () => {
      const name = uniqueTingkat()
      seed(name)
      // set Tidak Aktif dulu lewat Edit
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.setStatus(data.list.statusTidakAktif).clickSimpan()
      TingkatPage.assertToastSuccess(data.timeouts.toast)
      // lalu hapus
      TingkatPage.visit(data.urls.base, data.urls.list)
      TingkatPage.openDeleteDialog(name, data.timeouts.shortAction)
      TingkatPage.confirmDelete()
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(name)
      TingkatPage.assertRowGone(name)
    })
  })
})