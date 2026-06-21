import TingkatPage from '../../../../../support/pageobjects/TingkatPage'

describe('List Tingkat - Fajar Ardiansyah', () => {
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

  // ============================================================
  // S-01 — Akses & Struktur List
  // ============================================================
  describe('S-01 — Akses & Struktur List', () => {
    it('TC-LIST-001 : Navigasi ke halaman List Tingkat', () => {
      TingkatPage.visit(data.urls.base, data.urls.list)
      cy.get('table').should('be.visible')
    })

    it('TC-LIST-002 : Verifikasi 5 kolom (Instansi, Tingkat, Status, Dibuat Pada, Aksi)', () => {
      TingkatPage.visit(data.urls.base, data.urls.list)
      TingkatPage.assertColumns(data.list.columns) // Instansi, Tingkat, Status, Dibuat Pada
      // kolom aksi = 2 th terakhir (kosong) -> total 6 th
      cy.get('table thead th').should('have.length', 6)
    })

    it('TC-LIST-003 : Tiap row punya tombol Edit & Hapus', () => {
      TingkatPage.visit(data.urls.base, data.urls.list)
      TingkatPage.elements.rows().first().within(() => {
        cy.get('.lucide-square-pen').should('exist') // edit
        cy.get('.lucide-trash').should('exist')      // hapus
      })
    })
  })

  // ============================================================
  // S-02 — Sorting (terbaru -> terlama)
  // ============================================================
  describe('S-02 — Sorting', () => {
    it('TC-LIST-004 : Data terbaru tampil paling atas', () => {
      const a = `QAsortA${runId}`
      const b = `QAsortB${runId}`
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).addTingkat(data.instansi.primary, a)
      TingkatPage.assertToastSuccess(data.timeouts.toast)
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).addTingkat(data.instansi.primary, b)
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      // di list default, B (paling baru) harus di atas A
      TingkatPage.visit(data.urls.base, data.urls.list)
      TingkatPage.assertRowOrder(b, a)
    })
  })

  // ============================================================
  // S-03 — Status default Aktif
  // ============================================================
  describe('S-03 — Status Default', () => {
    it('TC-LIST-005 : Tingkat baru -> status default Aktif di list', () => {
      const name = uniqueTingkat()
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).addTingkat(data.instansi.primary, name)
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      // baris terbaru = paling atas; cek nama + status Aktif
      TingkatPage.visit(data.urls.base, data.urls.list)
      TingkatPage.elements.rows().first().within(() => {
        cy.contains(name).should('exist')
        cy.get('td').eq(2).should('contain.text', data.list.statusAktif)
      })
    })
  })

  // ============================================================
  // S-04 — Filter (Instansi & Status)
  // ============================================================
  describe('S-04 — Filter', () => {
    it('TC-LIST-006 : Filter by Instansi (Koperasi SMP) -> hanya row instansi itu', () => {
      TingkatPage.filterByOffice(data.urls.base, data.urls.list, data.office.primaryId)
      cy.wait(1000)
      TingkatPage.assertAllRowsInstansi(data.instansi.primary)
    })

    it('TC-LIST-007 : Filter Instansi lain (SDIT) -> konsisten semua row SDIT', () => {
      // seed 1 data SDIT dulu biar deterministik (SDIT pasti punya minimal 1 row)
      const name = uniqueTingkat()
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).addTingkat(data.instansi.secondary, name)
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      TingkatPage.filterByOffice(data.urls.base, data.urls.list, data.office.secondaryId)
      cy.wait(1000)
      TingkatPage.assertAllRowsInstansi(data.instansi.secondary)
    })

    it('TC-LIST-008 : Filter Status = Aktif -> semua row Aktif', () => {
      TingkatPage.visit(data.urls.base, data.urls.list)
      TingkatPage.selectStatus(data.list.statusAktif)
      cy.wait(1000)
      TingkatPage.assertAllRowsStatus(data.list.statusAktif)
    })

    it('TC-LIST-009 : [TBD] Filter Status = Tidak Aktif — OBSERVASI', () => {
      TingkatPage.visit(data.urls.base, data.urls.list)
      TingkatPage.selectStatus(data.list.statusTidakAktif)
      cy.wait(2000)
      cy.get('body').then(($b) => {
        const rows = $b.find('table tbody tr').length
        const empty = $b.text().includes(data.list.emptyText)
        cy.log(`🔎 Tidak Aktif -> rows:${rows} | empty:${empty}`)
      })
    })

    it('TC-LIST-010 : Filter Status = Semua -> tampil semua', () => {
      TingkatPage.visit(data.urls.base, data.urls.list)
      TingkatPage.selectStatus(data.list.statusSemua)
      cy.wait(1000)
      TingkatPage.assertHasRows()
    })

    it('TC-LIST-011 : [TBD] Filter Instansi + Status bersamaan — OBSERVASI', () => {
      // kombinasi via Radix-after-URL belum reliable (status bisa nge-replace ?office=).
      // Hard-assert nyusul kalau filter Status terbukti lewat URL param.
      TingkatPage.filterByOffice(data.urls.base, data.urls.list, data.office.primaryId)
      cy.wait(800)
      TingkatPage.selectStatus(data.list.statusAktif)
      cy.wait(1500)
      cy.url().then((url) => cy.log(`🔎 URL setelah office+status: ${url}`))
      cy.get('body').then(($b) => {
        const dataRows = [...$b.find('table tbody tr')].filter((r) => r.children.length >= 4)
        cy.log(`🔎 kombinasi -> data row: ${dataRows.length}`)
      })
    })

    it('TC-LIST-012 : [TBD] Filter kombinasi tanpa hasil -> empty — OBSERVASI', () => {
      TingkatPage.filterByOffice(data.urls.base, data.urls.list, data.office.secondaryId)
      cy.wait(800)
      TingkatPage.selectStatus(data.list.statusTidakAktif)
      cy.wait(1000)
      cy.get('body').then(($b) => {
        const empty = $b.text().includes(data.list.emptyText)
        cy.log(`🔎 SDIT + Tidak Aktif -> empty state? ${empty}`)
      })
    })
  })

  // ============================================================
  // S-05 — Search (Instansi & Tingkat)
  // ============================================================
  describe('S-05 — Search', () => {
    it('TC-LIST-013 : Search by nama Tingkat -> row muncul', () => {
      const name = uniqueTingkat()
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).addTingkat(data.instansi.primary, name)
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(name)
      cy.contains('table tbody tr', name).should('exist')
    })

    it.skip('TC-LIST-014 : Search by Instansi -> row instansi itu muncul', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(data.instansi.primary)
      TingkatPage.assertHasRows()
      cy.get('table tbody tr').first().find('td').eq(0)
        .should('contain.text', data.instansi.primary)
    })

    it('TC-LIST-015 : Search partial (potongan keyword) -> tetap match', () => {
      const name = `QApart${runId}`
      TingkatPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).addTingkat(data.instansi.primary, name)
      TingkatPage.assertToastSuccess(data.timeouts.toast)

      TingkatPage.visit(data.urls.base, data.urls.list).searchFor(`QApart${runId}`.slice(0, 6))
      TingkatPage.assertHasRows()
    })

    it('TC-LIST-016 : Search keyword tidak ada -> empty state', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).searchFor('zzzznotexist123')
      TingkatPage.assertEmptyState()
    })

    it('TC-LIST-017 : [TBD] Search case-insensitive? — OBSERVASI', () => {
      TingkatPage.visit(data.urls.base, data.urls.list)
        .searchFor(data.instansi.primary.toUpperCase())
      cy.get('body').then(($b) => {
        const rows = [...$b.find('table tbody tr')].filter((r) => r.children.length >= 4).length
        cy.log(`🔎 Search UPPERCASE '${data.instansi.primary.toUpperCase()}' -> data row: ${rows} ` +
          (rows > 0 ? '(case-INSENSITIVE)' : '(case-SENSITIVE / tidak ketemu)'))
      })
    })
  })

  // ============================================================
  // S-06 — Empty State & Reset
  // ============================================================
  describe('S-06 — Empty State & Reset', () => {
    it('TC-LIST-018 : Empty state tampil dgn teks & tombol Tambah', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).searchFor('zzzznotexist999')
      TingkatPage.assertEmptyState()
      cy.contains('button', 'Tambah Tingkat').should('exist')
    })

    it('TC-LIST-019 : Clear search -> list balik penuh', () => {
      TingkatPage.visit(data.urls.base, data.urls.list).searchFor('zzzznotexist888')
      TingkatPage.assertEmptyState()
      TingkatPage.clearSearch()
      TingkatPage.assertHasRows()
    })

    it('TC-LIST-020 : Reset filter Status (Semua) -> list balik penuh', () => {
      TingkatPage.visit(data.urls.base, data.urls.list)
      TingkatPage.selectStatus(data.list.statusAktif)
      cy.wait(800)
      TingkatPage.selectStatus(data.list.statusSemua)
      cy.wait(800)
      TingkatPage.assertHasRows()
    })
  })
})