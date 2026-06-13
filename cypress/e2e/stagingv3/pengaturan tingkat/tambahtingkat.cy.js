import TingkatPage from '../../../support/pageobjects/TingkatPage'

describe('Tambah Tingkat - Fajar Ardiansyah', () => {
  let data

  // 🎯 Nama tingkat unik per RUN → zero collision, rerun-safe tanpa cleanup manual.
  //    Format: QA + 6 digit terakhir timestamp + counter. Alfanumerik (valid, no special char).
  const runId = Date.now().toString().slice(-6)
  let _seq = 1
  const uniqueTingkat = () => `QA${runId}${_seq++}`

  before(() => {
    cy.fixture('tingkat').then((d) => { data = d })
  })

  beforeEach(() => {
    // session id SAMA dgn spec Tahun Ajaran → share cache, hindari 429
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

  // ============================================================
  // S-01 — Akses & Struktur Form
  // ============================================================
  describe('S-01 — Akses & Struktur Form', () => {
    it('TC-ADD-001 : Tombol "Tambah Tingkat" visible & klik buka modal', () => {
      TingkatPage.visit(data.urls.base, data.urls.list)
      TingkatPage.elements.btnTambah().should('be.visible')
      TingkatPage.openAddForm(data.timeouts.shortAction)
      TingkatPage.elements.dialogTitle().should('contain.text', data.labels.modalTitle)
    })

    it('TC-ADD-002 : Form punya field Instansi + Tingkat + tombol Simpan/Batal', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).openAddForm(data.timeouts.shortAction)
      TingkatPage.elements.dialog().contains('label', 'Instansi').should('exist')
      TingkatPage.elements.dialog().contains('label', 'Tingkat').should('exist')
      TingkatPage.elements.instansiTrigger().should('be.visible')
      TingkatPage.elements.tingkatInput().should('be.visible')
      TingkatPage.elements.btnSimpan().should('be.visible').and('not.be.disabled')
      TingkatPage.elements.btnBatal().should('be.visible').and('not.be.disabled')
    })

    it('TC-ADD-003 : Default Instansi = placeholder "Pilih Instansi" & Tingkat kosong', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).openAddForm(data.timeouts.shortAction)
      TingkatPage.elements.instansiValue().should('contain.text', 'Pilih Instansi')
      TingkatPage.elements.tingkatInput().should('have.value', '')
    })
  })

  // ============================================================
  // S-02 — Happy Path (Submit Sukses)
  // ============================================================
  describe('S-02 — Happy Path', () => {
    it('TC-ADD-004 : Tambah valid (alfanumerik) → toast sukses & masuk list', () => {
      const name = uniqueTingkat()
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .addTingkat(data.instansi.primary, name)
      TingkatPage.assertToastSuccess(data.timeouts.toast)
      TingkatPage.visitSearch(data.urls.base, data.urls.list, name)
        .assertRowInList(data.instansi.primary, name)
    })

    it('TC-ADD-005 : Tambah hanya huruf → tersimpan', () => {
      const name = `QAhuruf${runId}`
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .addTingkat(data.instansi.primary, name)
      TingkatPage.assertToastSuccess(data.timeouts.toast)
    })

    it('TC-ADD-006 : Tambah hanya angka → tersimpan', () => {
      const name = `99${runId}` // digit only
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .addTingkat(data.instansi.primary, name)
      TingkatPage.assertToastSuccess(data.timeouts.toast)
    })
  })

  // ============================================================
  // S-03 — Validasi Required
  // ============================================================
  describe('S-03 — Validasi Required', () => {
    it('TC-ADD-007 : Instansi kosong → Simpan tidak bekerja, modal tetap open', () => {
      const name = uniqueTingkat()
      TingkatPage.visit(data.urls.base, data.urls.list).openAddForm(data.timeouts.shortAction)
      TingkatPage.fillTingkat(name).clickSimpan()
      TingkatPage.assertNoSuccessToast().assertModalOpen()
      TingkatPage.assertFieldInvalid('Instansi')
    })

    it('TC-ADD-008 : Tingkat kosong → Simpan tidak bekerja, modal tetap open', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).openAddForm(data.timeouts.shortAction)
      TingkatPage.selectInstansi(data.instansi.primary).clickSimpan()
      TingkatPage.assertNoSuccessToast().assertModalOpen()
      TingkatPage.assertFieldInvalid('Tingkat')
    })

    it('TC-ADD-009 : Semua field kosong → error required di kedua field', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).openAddForm(data.timeouts.shortAction)
      TingkatPage.clickSimpan()
      TingkatPage.assertNoSuccessToast().assertModalOpen()
      TingkatPage.assertFieldInvalid('Instansi')
      TingkatPage.assertFieldInvalid('Tingkat')
    })

    it('TC-ADD-010 : Tingkat hanya spasi → diperlakukan kosong/invalid', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).openAddForm(data.timeouts.shortAction)
      TingkatPage.selectInstansi(data.instansi.primary)
      TingkatPage.elements.tingkatInput().clear().type('   ')
      TingkatPage.clickSimpan()
      TingkatPage.assertNoSuccessToast().assertModalOpen()
    })
  })

  // ============================================================
  // S-04 — Validasi Duplikat (per Instansi)  [BUG-007: error ga muncul di FE]
  // ============================================================
  describe('S-04 — Validasi Duplikat', () => {
    it('TC-ADD-011 : Nama sama di instansi sama → backend reject, FE ga nampilin (BUG-007)', () => {
      const name = uniqueTingkat()

      // precondition: bikin dulu 1 data (sukses)
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .addTingkat(data.instansi.primary, name)
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      // attempt duplikat (nama + instansi sama)
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .addTingkat(data.instansi.primary, name)
      cy.wait(1500)

      // BUG-007: backend tolak duplikat tapi FE DIAM (no toast/error).
      // Bukti rejected (behavioral, ga butuh tau endpoint API):
      //   1) ga ada toast sukses, 2) nama cuma ada 1 row (ga ke-create dobel).
      TingkatPage.assertNoSuccessToast()
      cy.log('🐛 BUG-007: duplikat di-reject backend tapi FE ga nampilin error apa pun')

      TingkatPage.visitSearch(data.urls.base, data.urls.list, name)
      TingkatPage.elements.rows().filter(`:contains("${name}")`).should('have.length', 1)
    })

    it('TC-ADD-012 : [TBD] Duplikat beda kapital (case-sensitive?) — OBSERVASI', () => {
      const base = `QAcase${runId}`
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .addTingkat(data.instansi.primary, base)
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      // coba versi UPPERCASE di instansi sama
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .addTingkat(data.instansi.primary, base.toUpperCase())
      cy.wait(1500)
      cy.get('body').then(($b) => {
        const sukses = $b.find('[data-sonner-toast][data-type="success"]').length > 0
        cy.log(`🔎 TBD case-sensitivity → UPPERCASE tersimpan? ${sukses} ` +
          (sukses ? '→ case-SENSITIVE (uppercase dianggap beda, boleh)'
                  : '→ case-INSENSITIVE (uppercase dianggap duplikat, ditolak)'))
      })
    })

    it('TC-ADD-013 : Nama sama, instansi BEDA → boleh tersimpan', () => {
      const name = uniqueTingkat()
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .addTingkat(data.instansi.primary, name)
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .addTingkat(data.instansi.secondary, name)
      TingkatPage.assertToastSuccess(data.timeouts.toast)
    })
  })

  // ============================================================
  // S-05 — Validasi Karakter
  // ============================================================
  describe('S-05 — Validasi Karakter', () => {
    it('TC-ADD-014 : Special char di tengah ("QA@10") → ditolak via inline validation', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).openAddForm(data.timeouts.shortAction)
      TingkatPage.selectInstansi(data.instansi.primary).fillTingkat('QA@10').clickSimpan()
      TingkatPage.assertValidationText(data.messages.invalidChar)
      TingkatPage.assertNoSuccessToast().assertModalOpen()
    })

    it('TC-ADD-015 : Full special char ("!@#$%^&*") → ditolak via inline validation', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).openAddForm(data.timeouts.shortAction)
      TingkatPage.selectInstansi(data.instansi.primary).fillTingkat('!@#$%^&*').clickSimpan()
      TingkatPage.assertValidationText(data.messages.invalidChar)
      TingkatPage.assertNoSuccessToast().assertModalOpen()
    })

    it('TC-ADD-016 : Spasi di tengah ("Kelas <id>") → VALID, tersimpan', () => {
      const name = `Kelas ${runId}` // huruf + spasi + angka = valid
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .addTingkat(data.instansi.primary, name)
      TingkatPage.assertToastSuccess(data.timeouts.toast)
      TingkatPage.visitSearch(data.urls.base, data.urls.list, name)
        .assertRowInList(data.instansi.primary, name)
    })

    it('TC-ADD-017 : Hyphen ("QA-10") → ditolak via inline validation', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).openAddForm(data.timeouts.shortAction)
      TingkatPage.selectInstansi(data.instansi.primary).fillTingkat('QA-10').clickSimpan()
      TingkatPage.assertValidationText(data.messages.invalidChar)
      TingkatPage.assertNoSuccessToast().assertModalOpen()
    })
  })

  // ============================================================
  // S-06 — Edge / Boundary  [TBD — observasi]
  // ============================================================
  describe('S-06 — Edge / Boundary (TBD)', () => {
    it('TC-ADD-018 : [TBD] Input sangat panjang (256 char) — OBSERVASI', () => {
      const long = 'QA' + 'a'.repeat(254)
      TingkatPage.visit(data.urls.base, data.urls.list).openAddForm(data.timeouts.shortAction)
      TingkatPage.selectInstansi(data.instansi.primary)
      TingkatPage.elements.tingkatInput().clear().type(long, { delay: 0 })
      TingkatPage.elements.tingkatInput().invoke('val').then((v) => {
        cy.log(`🔎 TBD max length → panjang ke-input: ${v.length}`)
      })
      TingkatPage.clickSimpan()
      cy.wait(1500)
    })

    it('TC-ADD-019 : [TBD] Trim spasi depan/belakang (" 12 ") — OBSERVASI', () => {
      const name = ` ${uniqueTingkat()} `
      TingkatPage.visit(data.urls.base, data.urls.list).openAddForm(data.timeouts.shortAction)
      TingkatPage.selectInstansi(data.instansi.primary).fillTingkat(name).clickSimpan()
      cy.wait(1500)
      cy.get('body').then(($b) => {
        const sukses = $b.find('[data-sonner-toast][data-type="success"]').length > 0
        cy.log(`🔎 TBD trimming → toast sukses? ${sukses} (input='${name}')`)
      })
    })
  })

  // ============================================================
  // S-07 — Batal
  // ============================================================
  describe('S-07 — Batal', () => {
    it('TC-ADD-020 : Klik Batal setelah isi → modal close, data tidak tersimpan', () => {
      const name = uniqueTingkat()
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary).fillTingkat(name)
      TingkatPage.clickBatal()
      TingkatPage.assertModalClosed()
      // pastikan ga ketambah
      TingkatPage.visitSearch(data.urls.base, data.urls.list, name)
      TingkatPage.elements.rows().should('not.contain.text', name)
    })

    it('TC-ADD-021 : Klik Batal tanpa isi → modal close, balik ke list', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).openAddForm(data.timeouts.shortAction)
      TingkatPage.clickBatal()
      TingkatPage.assertModalClosed()
      cy.url().should('include', data.urls.list)
    })
  })
})