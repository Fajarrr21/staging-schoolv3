import TingkatPage from '../../../support/pageobjects/TingkatPage'

describe('Edit Tingkat - Fajar Ardiansyah', () => {
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

  // seed 1 tingkat (default status Aktif) -> rerun-safe pakai nama unik
  const seed = (name, instansi) => {
    TingkatPage.visit(data.urls.base, data.urls.list)
      .openAddForm(data.timeouts.shortAction)
      .addTingkat(instansi || data.instansi.primary, name)
    TingkatPage.assertToastSuccess(data.timeouts.toast)
  }

  // ============================================================
  // S-01 — Akses & Struktur Form
  // ============================================================
  describe('S-01 — Akses & Struktur', () => {
    it('TC-EDIT-001 : Buka form Edit via ikon pensil -> modal "Edit Tingkat"', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.elements.dialog().should('be.visible')
    })

    it('TC-EDIT-002 : Form punya Instansi + Tingkat + Status + Simpan/Batal', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.elements.dialog().within(() => {
        cy.contains('label', 'Instansi').should('exist')
        cy.contains('label', 'Tingkat').should('exist')
        cy.contains('label', 'Status').should('exist')
      })
      TingkatPage.elements.btnSimpan().should('be.visible')
      TingkatPage.elements.btnBatal().should('be.visible')
    })

    it('TC-EDIT-003 : Form pre-filled sesuai data row', () => {
      const name = uniqueTingkat()
      seed(name) // default Instansi=primary, Status=Aktif
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.elements.tingkatInput().should('have.value', name)
      TingkatPage.elements.instansiValue().should('contain.text', data.instansi.primary)
      TingkatPage.elements.statusValue().should('contain.text', data.list.statusAktif)
    })
  })

  // ============================================================
  // S-02 — Happy Path
  // ============================================================
  describe('S-02 — Happy Path', () => {
    it('TC-EDIT-004 : Edit nama Tingkat valid -> tersimpan & ter-update di list', () => {
      const name = uniqueTingkat()
      const newName = uniqueTingkat()
      seed(name)
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.fillTingkat(newName).clickSimpan()
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(newName)
      cy.contains('table tbody tr', newName).should('exist')
    })

    it('TC-EDIT-005 : Ubah Status Aktif -> Tidak Aktif -> badge list berubah', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.setStatus(data.list.statusTidakAktif).clickSimpan()
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(name)
      TingkatPage.assertRowStatus(name, data.list.statusTidakAktif)
    })

    it('TC-EDIT-006 : Ubah Status Tidak Aktif -> Aktif -> badge list berubah', () => {
      const name = uniqueTingkat()
      seed(name)
      // set Tidak Aktif dulu
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.setStatus(data.list.statusTidakAktif).clickSimpan()
      TingkatPage.assertToastSuccess(data.timeouts.toast)
      // balik ke Aktif
      TingkatPage.visit(data.urls.base, data.urls.list)
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.setStatus(data.list.statusAktif).clickSimpan()
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(name)
      TingkatPage.assertRowStatus(name, data.list.statusAktif)
    })
  })

  // ============================================================
  // S-03 — Validasi Required
  // ============================================================
  describe('S-03 — Validasi Required', () => {
    it('TC-EDIT-007 : Kosongkan Tingkat -> Simpan tidak bekerja', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.elements.tingkatInput().clear()
      TingkatPage.clickSimpan()
      TingkatPage.assertNoSuccessToast().assertModalOpen()
      TingkatPage.assertFieldInvalid('Tingkat')
    })

    // TC-EDIT-008 (kosongkan Instansi) DI-SKIP — by design: di form Edit, Instansi adalah
    // select pre-filled TANPA opsi kosong, jadi tidak mungkin dikosongkan (required terpenuhi otomatis).
    it.skip('TC-EDIT-008 : Kosongkan Instansi -> error required (N/A: Instansi tak bisa dikosongkan)', () => {})
  })

  // ============================================================
  // S-04 — Validasi Duplikat  [BUG-007: silent FE juga saat edit]
  // ============================================================
  describe('S-04 — Validasi Duplikat', () => {
    it('TC-EDIT-009 : Edit -> nama existing di instansi sama -> ditolak (FE silent, BUG-007)', () => {
      const nameA = uniqueTingkat()
      const nameB = uniqueTingkat()
      seed(nameA)
      seed(nameB) // instansi sama (primary)

      TingkatPage.openEditForm(nameA, data.timeouts.shortAction)
      TingkatPage.fillTingkat(nameB).clickSimpan()
      cy.wait(1500)
      // BUG-007 (edit): backend tolak duplikat, FE diam. Bukti: no toast sukses + A tidak berubah.
      TingkatPage.assertNoSuccessToast()
      cy.log('🐛 BUG-007 (edit): duplikat di-reject backend tapi FE ga nampilin error')

      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(nameA)
      cy.contains('table tbody tr', nameA).should('exist') // A masih ada (tidak ke-rename)
    })
  })

  // ============================================================
  // S-05 — Validasi Karakter
  // ============================================================
  describe('S-05 — Validasi Karakter', () => {
    it('TC-EDIT-010 : Special char -> ditolak via inline validation', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.fillTingkat('QA@10').clickSimpan()
      TingkatPage.assertValidationText(data.messages.invalidChar)
      TingkatPage.assertNoSuccessToast().assertModalOpen()
    })

    it('TC-EDIT-011 : Spasi -> valid, tersimpan', () => {
      const name = uniqueTingkat()
      const spaced = `Kelas ${runId}${_seq++}`
      seed(name)
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.fillTingkat(spaced).clickSimpan()
      TingkatPage.assertToastSuccess(data.timeouts.toast)
    })
  })

  // ============================================================
  // S-06 — Cancel
  // ============================================================
  describe('S-06 — Cancel', () => {
    it('TC-EDIT-012 : Edit lalu Batal -> data tidak berubah', () => {
      const name = uniqueTingkat()
      const changed = uniqueTingkat()
      seed(name)
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.fillTingkat(changed)
      TingkatPage.clickBatal()
      TingkatPage.assertModalClosed()

      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(name)
      cy.contains('table tbody tr', name).should('exist') // nama lama tetap
    })

    it('TC-EDIT-013 : Edit lalu Esc -> data tidak berubah', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.fillTingkat(uniqueTingkat())
      TingkatPage.closeWithEsc()
      TingkatPage.assertModalClosed()
    })
  })

  // ============================================================
  // S-07 — Edge
  // ============================================================
  describe('S-07 — Edge', () => {
    it('TC-EDIT-014 : Simpan tanpa ubah apa-apa (no-op) -> tetap sukses', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      TingkatPage.clickSimpan()
      TingkatPage.assertToastSuccess(data.timeouts.toast)
    })

    it('TC-EDIT-015 : Edit HANYA Status (nama tetap) -> sukses, TIDAK kena duplikat thd diri sendiri', () => {
      const name = uniqueTingkat()
      seed(name)
      TingkatPage.openEditForm(name, data.timeouts.shortAction)
      // nama Tingkat TIDAK diubah, cuma Status
      TingkatPage.setStatus(data.list.statusTidakAktif).clickSimpan()
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(name)
      TingkatPage.assertRowStatus(name, data.list.statusTidakAktif)
    })
  })
})