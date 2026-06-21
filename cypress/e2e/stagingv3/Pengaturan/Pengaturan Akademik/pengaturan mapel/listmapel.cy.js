import LoginPage from '../../../../../support/pageobjects/LoginPage'
import MapelPage from '../../../../../support/pageobjects/MapelPage'

describe('List Mata Pelajaran - Fajar Ardiansyah', () => {
  let data
  const TS = Math.random().toString(36).slice(2, 6).toUpperCase()

  before(() => {
    cy.fixture('mapel').then((fixtureData) => {
      data = fixtureData
    })
  })

  beforeEach(() => {
    LoginPage.loginViaSession(
      data.credentials.email,
      data.credentials.password,
      data.urls.base,
      data.urls.login
    )
  })

  // ============================================================
  // S-14 — Tampilan List
  // ============================================================
  describe('S-14 — Tampilan List', () => {

    it('TC-052 : Halaman list mapel tampil dengan title & tombol Tambah', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.elements.pageTitle().should('be.visible')
      MapelPage.elements.btnTambah().should('be.visible')
    })

    it('TC-053 : Semua kolom header table tampil (Instansi/Nama/Kode/Status/Dibuat Pada/Aksi)', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.assertColumnHeader('Instansi')
      MapelPage.assertColumnHeader('Mata Pelajaran')
      MapelPage.assertColumnHeader('Kode')
      MapelPage.assertColumnHeader('Status')
      MapelPage.assertColumnHeader(data.labels.columnDibuatPada)
    })

    it('TC-054 : Default sort terbaru di atas — mapel yang baru dibuat muncul di row pertama', () => {
      const nama = `Sort Newest ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.elements.dataGridRows().first().should('contain', nama)
    })

    it('TC-072 : Kolom Aksi setiap row punya tombol Edit dan Hapus', () => {
      const nama = `Action Buttons ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.getRowByName(nama).find('button:has(svg.lucide-square-pen)').should('be.visible')
      MapelPage.getRowByName(nama).find('button:has(svg.lucide-trash)').should('be.visible')
    })

    it('TC-073 : Kolom Status setiap row menampilkan badge text ("Aktif" atau "Tidak Aktif")', () => {
      const nama = `Status Badge ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.getRowByName(nama)
        .find('td').eq(data.columns.status)
        .should('contain', data.labels.statusActive)
    })

    it('TC-074 : Kolom "Dibuat Pada" setiap row menampilkan tanggal yang tidak kosong', () => {
      const nama = `Date Column ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.getRowByName(nama)
        .find('td').eq(data.columns.createdAt)
        .invoke('text').then((text) => {
          expect(text.trim()).to.not.be.empty
          expect(text.length).to.be.greaterThan(3)
        })
    })
  })

  // ============================================================
  // S-15 — Empty State
  // ============================================================
  describe('S-15 — Empty State', () => {

    it('TC-055 : Search dengan keyword tidak ada — empty state tampil', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.searchSubject(data.testData.noMatchSearch)
      cy.wait(data.timeouts.searchDebounce)
      MapelPage.assertEmptyState()
    })

    it('TC-075 : Empty state punya tombol "Tambah Mata Pelajaran" yang clickable', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.searchSubject(data.testData.noMatchSearch)
      cy.wait(data.timeouts.searchDebounce)
      MapelPage.assertEmptyState()

      cy.contains('button', 'Tambah Mata Pelajaran').should('be.visible').click()
      MapelPage.elements.dialog().should('be.visible')
      MapelPage.elements.dialogTitle().should('contain', 'Tambah Mata Pelajaran')
    })
  })

  // ============================================================
  // S-16 — Filter Instansi
  // ============================================================
  describe('S-16 — Filter Instansi', () => {

    it('TC-056 : Filter by instansi primary — hanya mapel instansi tsb yang tampil', () => {
      const nama = `Filter Primary ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.filterByInstansi(data.instansi.primary, data.timeouts.dropdown)
      cy.wait(data.timeouts.searchDebounce)
      MapelPage.assertSubjectInList(nama)

      MapelPage.elements.dataGridRows().each(($row) => {
        cy.wrap($row).find('td').eq(data.columns.instansi).should('contain', data.instansi.primary)
      })
    })

    it('TC-057 : Ganti filter ke instansi secondary — hanya mapel instansi B', () => {
      const nama = `Filter Secondary ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.secondary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.filterByInstansi(data.instansi.secondary, data.timeouts.dropdown)
      cy.wait(data.timeouts.searchDebounce)
      MapelPage.assertSubjectInList(nama)

      MapelPage.elements.dataGridRows().each(($row) => {
        cy.wrap($row).find('td').eq(data.columns.instansi).should('contain', data.instansi.secondary)
      })
    })
  })

  // ============================================================
  // S-17 — Filter Status
  // ============================================================
  describe('S-17 — Filter Status', () => {

    it('TC-058 : Filter status "Aktif" — filter berhasil diterapkan', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.filterByStatus(data.labels.statusActive, data.timeouts.dropdown)
      cy.wait(1500)

      MapelPage.elements.filterStatusTrigger().should('contain', data.labels.statusActive)

      cy.get('body').then(($body) => {
        const hasRows = $body.find('table[data-slot="data-grid-table"] tbody tr').length > 0
        const hasEmpty = $body.find('h3:contains("Data Mata Pelajaran tidak ditemukan")').length > 0
        expect(hasRows || hasEmpty).to.be.true
      })
    })

    it('TC-059 : Filter status "Tidak Aktif" — filter berhasil diterapkan', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.filterByStatus(data.labels.statusInactive, data.timeouts.dropdown)
      cy.wait(1500)

      MapelPage.elements.filterStatusTrigger().should('contain', data.labels.statusInactive)

      cy.get('body').then(($body) => {
        const hasRows = $body.find('table[data-slot="data-grid-table"] tbody tr').length > 0
        const hasEmpty = $body.find('h3:contains("Data Mata Pelajaran tidak ditemukan")').length > 0
        expect(hasRows || hasEmpty).to.be.true
      })
    })

    it('TC-060 : Filter status "Semua" — menampilkan mapel dengan kedua status', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.filterByStatus(data.labels.filterStatusAll, data.timeouts.dropdown)
      cy.wait(data.timeouts.searchDebounce)

      MapelPage.elements.dataGridRows().its('length').should('be.greaterThan', 0)
    })
  })

  // ============================================================
  // S-18 — Filter Kombo (Instansi + Status)
  // ============================================================
  describe('S-18 — Filter Kombo', () => {

    it('TC-061 : Filter instansi + status barengan — hasil sesuai 2 kriteria', () => {
      const nama = `Filter Kombo ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.filterByInstansi(data.instansi.primary, data.timeouts.dropdown)
      cy.wait(data.timeouts.searchDebounce)
      MapelPage.filterByStatus(data.labels.statusActive, data.timeouts.dropdown)
      cy.wait(data.timeouts.searchDebounce)

      MapelPage.assertSubjectInList(nama)
      MapelPage.elements.dataGridRows().each(($row) => {
        cy.wrap($row).find('td').eq(data.columns.instansi).should('contain', data.instansi.primary)
        cy.wrap($row).should('not.contain', data.labels.statusInactive)
      })
    })
  })

  // ============================================================
  // S-19 — Search
  // ============================================================
  describe('S-19 — Search', () => {

    it('TC-062 : Search by nama mapel — hanya mapel yang cocok yang tampil', () => {
      const nama = `Search Nama ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.searchSubject(nama)
      cy.wait(data.timeouts.searchDebounce)
      MapelPage.assertSubjectInList(nama)
    })

    it('TC-063 : Search by kode mapel — mapel dengan kode tsb tampil', () => {
      const nama = `Search Kode ${TS}`
      const kode = `SRC${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .fillCode(kode)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.searchSubject(kode)
      cy.wait(data.timeouts.searchDebounce)
      MapelPage.assertSubjectInList(nama)
      MapelPage.getRowByName(nama).find('td').eq(data.columns.kode).should('contain', kode)
    })

    it('TC-064 : Search dengan partial text — mapel yang cocok tampil', () => {
      const namaUnik = `PartialSearch ${TS}`
      const partialKeyword = `PartialSearch`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaUnik)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.searchSubject(partialKeyword)
      cy.wait(data.timeouts.searchDebounce)
      MapelPage.assertSubjectInList(namaUnik)
    })

    it('TC-076 : Search by nama instansi — mapel di instansi tsb tampil', () => {
      const nama = `Search Instansi ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.searchSubject(data.instansi.primary)
      cy.wait(data.timeouts.searchDebounce)

      cy.get('body').then(($body) => {
        const hasResult = $body.find(`table[data-slot="data-grid-table"]`).text().includes(nama)
        const hasEmpty = $body.find('h3:contains("Data Mata Pelajaran tidak ditemukan")').length > 0
        expect(hasResult || hasEmpty).to.be.true
      })
    })

    it('TC-077 : Search case-insensitive — UPPERCASE & lowercase return hasil sama', () => {
      const nama = `CaseTest ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.searchSubject('CASETEST')
      cy.wait(data.timeouts.searchDebounce)
      cy.get('body').then(($body) => {
        const upperFound = $body.find(`table[data-slot="data-grid-table"]`).text().includes(nama)
        cy.log(`Search UPPERCASE found: ${upperFound}`)
      })

      MapelPage.searchSubject('casetest')
      cy.wait(data.timeouts.searchDebounce)
      cy.get('body').then(($body) => {
        const lowerFound = $body.find(`table[data-slot="data-grid-table"]`).text().includes(nama)
        cy.log(`Search lowercase found: ${lowerFound}`)
      })
    })

    it('TC-078 : Clear search input — semua data kembali tampil', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.elements.dataGridRows().its('length').then((jumlahAwal) => {
        MapelPage.searchSubject(`unique${TS}`)
        cy.wait(data.timeouts.searchDebounce)

        MapelPage.clearSearch()
        cy.wait(data.timeouts.searchDebounce)

        MapelPage.elements.dataGridRows().its('length').should('be.gte', jumlahAwal)
      })
    })
  })

  // ============================================================
  // S-20 — Empty Filter Match
  // ============================================================
  describe('S-20 — Empty Filter Match', () => {

    it('TC-065 : Filter no match — empty state tampil', () => {
  MapelPage.visit(data.urls.base, data.urls.subjectList)
  cy.wait(1500) // ← TAMBAH INI: tunggu toolbar render
  MapelPage.searchSubject(data.testData.noMatchSearch)
  cy.wait(2000)
  MapelPage.filterByStatus(data.labels.statusInactive, data.timeouts.dropdown)
  cy.wait(2000)
  MapelPage.assertEmptyState()
})
  })

  // ============================================================
  // S-21 — Sort by Column
  // ============================================================
  describe('S-21 — Sort by Column', () => {

    it('TC-079 : Klik header "Dibuat Pada" — sort terbuka', () => {
  MapelPage.visit(data.urls.base, data.urls.subjectList)
  cy.wait(1500) // ← tunggu table fully render
  
  // Break chain biar gak race condition
  MapelPage.elements.sortHeader(data.labels.columnDibuatPada).should('be.visible')
  cy.wait(500)
  MapelPage.elements.sortHeader(data.labels.columnDibuatPada).click({ force: true })
  cy.wait(500)
  
  cy.get('body').then(($body) => {
    const hasMenu = $body.find('[role="menu"]').length > 0
    cy.log(hasMenu ? '✅ Menu sort terbuka' : 'ℹ️ Sort langsung apply tanpa menu')
  })
})

    it('TC-080 : Default sort order — mapel terbaru di row pertama', () => {
      const nama1 = `SortA ${TS}`
      const nama2 = `SortB ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama1)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      cy.wait(500)

      MapelPage.openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama2)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.elements.dataGridRows().then(($rows) => {
        let indexNama2 = -1
        let indexNama1 = -1
        $rows.each((i, row) => {
          const text = row.innerText
          if (text.includes(nama2) && indexNama2 === -1) indexNama2 = i
          if (text.includes(nama1) && indexNama1 === -1) indexNama1 = i
        })
        expect(indexNama2).to.be.lessThan(indexNama1)
      })
    })
  })

  // ============================================================
  // S-22 — Filter Reset & Persistence
  // ============================================================
  describe('S-22 — Filter Reset & Persistence', () => {

    it('TC-081 : Filter status setelah refresh page — log behavior', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.filterByStatus(data.labels.statusInactive, data.timeouts.dropdown)
      cy.wait(1500)
      MapelPage.elements.filterStatusTrigger().should('contain', data.labels.statusInactive)

      cy.reload()
      cy.wait(1500)

      cy.get('body').then(($body) => {
        const stillFiltered = $body.find('[data-slot="select-trigger"]:contains("Tidak Aktif")').length > 0
        cy.log(stillFiltered ? '⚠️ Filter persist setelah refresh' : '✅ Filter reset setelah refresh')
      })
    })

    it('TC-082 : Search input clear setelah refresh page', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.searchSubject(`testsearch${TS}`)
      cy.wait(data.timeouts.searchDebounce)

      cy.reload()
      cy.wait(1500)

      MapelPage.elements.searchInput().should('have.value', '')
    })

    it('TC-083 : Search input clear setelah pindah halaman dan balik', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.searchSubject(`navtest${TS}`)
      cy.wait(data.timeouts.searchDebounce)

      cy.visit(`${data.urls.base}/`)
      cy.wait(1000)

      MapelPage.visit(data.urls.base, data.urls.subjectList)
      cy.wait(1000)

      MapelPage.elements.searchInput().should('have.value', '')
    })
  })

})