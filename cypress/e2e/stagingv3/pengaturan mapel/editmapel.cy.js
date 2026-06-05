import LoginPage from '../../../support/pageobjects/LoginPage'
import MapelPage from '../../../support/pageobjects/MapelPage'

describe('Edit Mata Pelajaran - Fajar Ardiansyah', () => {
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
  // S-09 — Akses Form Edit Mata Pelajaran
  // ============================================================
  describe('S-09 — Akses Form Edit', () => {

    it('TC-036 : Tombol edit visible di kolom action setiap row', () => {
      const nama = `Edit Visible ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.elements.btnEditInRow(nama).should('be.visible')
    })

    it('TC-037 : Klik tombol edit menampilkan modal Edit Mata Pelajaran', () => {
      const nama = `Edit Open ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
      MapelPage.elements.dialogTitle().should('contain', data.labels.editTitle)
    })

    it('TC-038 : Form edit ter-prefill dengan data lama', () => {
      const nama = `Prefill ${TS}`
      const kode = `PRE${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .fillCode(kode)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
      MapelPage.elements.nameInput().should('have.value', nama)
      MapelPage.elements.codeInput().should('have.value', kode)
      MapelPage.elements.instansiTrigger().should('contain', data.instansi.primary)
      MapelPage.elements.statusTrigger().should('contain', data.labels.statusActive)
    })

    it('TC-095 : Modal edit punya tombol Simpan dan Batal yang visible', () => {
      const nama = `Btn Edit ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
      MapelPage.elements.btnSimpan().should('be.visible').and('not.be.disabled')
      MapelPage.elements.btnBatal().should('be.visible').and('not.be.disabled')
    })

    it('TC-096 : Edit mapel inactive — status ter-prefill "Tidak Aktif"', () => {
      const nama = `Prefill Inactive ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .selectStatus(data.labels.statusInactive, data.timeouts.dropdown)
      cy.get('[role="listbox"]').should('not.exist')
      cy.wait(500)
      MapelPage.updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
      MapelPage.elements.statusTrigger().should('contain', data.labels.statusInactive)
    })
  })

  // ============================================================
  // S-10 — Update Data Sukses
  // ============================================================
  describe('S-10 — Update Data Sukses', () => {

    it('TC-039 : Update nama saja — data tersimpan dengan nama baru', () => {
      const namaLama = `Update Nama Old ${TS}`
      const namaBaru = `Update Nama New ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaLama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(namaLama, data.timeouts.shortAction)
        .clearAndFillName(namaBaru)
        .updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.assertSubjectInList(namaBaru)
      MapelPage.assertSubjectNotInList(namaLama)
    })

    it('TC-040 : Update kode saja — kode tersimpan dengan nilai baru', () => {
      const nama = `Update Kode ${TS}`
      const kodeBaru = `NEW${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .fillCode(`OLD${TS}`)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .clearAndFillCode(kodeBaru)
        .updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.getRowByName(nama).find('td').eq(2).should('contain', kodeBaru)
    })

    it('TC-041 : Pindahkan mapel ke instansi lain', () => {
      const nama = `Pindah Instansi ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .selectInstansi(data.instansi.secondary, data.timeouts.dropdown)

      cy.get('[role="listbox"]').should('not.exist')
      MapelPage.elements.instansiTrigger().should('contain', data.instansi.secondary)
      cy.wait(500)
      MapelPage.updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.getRowByName(nama).find('td').eq(0).should('contain', data.instansi.secondary)
    })

    it('TC-042 : Ubah status ke Tidak Aktif — indikator muncul di list', () => {
      const nama = `Status Inactive ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .selectStatus(data.labels.statusInactive, data.timeouts.dropdown)

      cy.get('[role="listbox"]').should('not.exist')
      MapelPage.elements.statusTrigger().should('contain', data.labels.statusInactive)
      cy.wait(500)
      MapelPage.updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.assertStatusInactive(nama)
    })

    it('TC-043 : Update semua field sekaligus', () => {
      const namaLama = `All Old ${TS}`
      const namaBaru = `All New ${TS}`
      const kodeBaru = `ALL${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaLama)
        .fillCode(`OLD${TS}`)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(namaLama, data.timeouts.shortAction)
        .clearAndFillName(namaBaru)
        .clearAndFillCode(kodeBaru)
        .selectInstansi(data.instansi.secondary, data.timeouts.dropdown)
        .selectStatus(data.labels.statusInactive, data.timeouts.dropdown)

      cy.get('[role="listbox"]').should('not.exist')
      MapelPage.elements.instansiTrigger().should('contain', data.instansi.secondary)
      MapelPage.elements.statusTrigger().should('contain', data.labels.statusInactive)
      cy.wait(500)
      MapelPage.updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.assertSubjectInList(namaBaru)
      MapelPage.assertStatusInactive(namaBaru)
      MapelPage.getRowByName(namaBaru).find('td').eq(0).should('contain', data.instansi.secondary)
      MapelPage.getRowByName(namaBaru).find('td').eq(2).should('contain', kodeBaru)
    })

    it('TC-097 : Update berhasil — toast success muncul', () => {
      const namaLama = `Toast Old ${TS}`
      const namaBaru = `Toast New ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaLama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(namaLama, data.timeouts.shortAction)
        .clearAndFillName(namaBaru)
      MapelPage.clickSimpan()

      cy.get('li[data-sonner-toast][data-type="success"]', { timeout: 10000 })
        .should('be.visible')
    })

    it('TC-098 : Update berhasil — URL tetap di halaman list', () => {
      const namaLama = `URL Old ${TS}`
      const namaBaru = `URL New ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaLama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(namaLama, data.timeouts.shortAction)
        .clearAndFillName(namaBaru)
        .updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      cy.url().should('include', data.urls.subjectList)
    })

    it('TC-099 : Save tanpa perubahan (no-change) — sistem tetap simpan tanpa error', () => {
      const nama = `No Change ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
      cy.wait(500)
      MapelPage.updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.assertSubjectInList(nama)
    })

    it('TC-100 : Edit instansi A → B → balik ke A — final state correct', () => {
      const nama = `AB Toggle ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      // A → B
      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .selectInstansi(data.instansi.secondary, data.timeouts.dropdown)
      cy.get('[role="listbox"]').should('not.exist')
      cy.wait(500)
      MapelPage.updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.getRowByName(nama).find('td').eq(0).should('contain', data.instansi.secondary)

      // B → A
      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
      cy.get('[role="listbox"]').should('not.exist')
      cy.wait(500)
      MapelPage.updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.getRowByName(nama).find('td').eq(0).should('contain', data.instansi.primary)
    })
  })

  // ============================================================
  // S-11 — Update Gagal & Validasi
  // ============================================================
  describe('S-11 — Update Gagal & Validasi', () => {

    it('TC-044 : Kosongkan nama saat edit — validation error muncul', () => {
      const nama = `Empty Name Edit ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
      MapelPage.elements.nameInput().clear()
      MapelPage.clickSimpan()
      MapelPage.assertValidationMessage(data.messages.nameRequired)
      MapelPage.elements.dialog().should('exist')
    })

    it('TC-045 : Edit nama ke nilai duplikat di instansi sama — sistem reject', () => {
      const namaA = `Dup Edit A ${TS}`
      const namaB = `Dup Edit B ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaA)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaB)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(namaB, data.timeouts.shortAction)
        .clearAndFillName(namaA)
        .updateExpectFailure(data.timeouts.errorCheck)
    })

    it('TC-046 : Kosongkan kode saat edit — sistem tetap valid (auto-generate)', () => {
      const nama = `Empty Code Edit ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .fillCode(`KEEP${TS}`)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
      MapelPage.elements.codeInput().clear()
      MapelPage.updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.getCellTextFromRow(nama, 2).should('not.be.empty')
    })

    it('TC-101 : Edit nama dengan spasi awal/akhir — sistem trim atau accept (log behavior)', () => {
      const nama = `Trim Test ${TS}`
      const namaWithSpace = `   ${nama} Updated   `

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .clearAndFillName(namaWithSpace)
        .updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.getRowByName(nama.trim()).should('exist')
    })

    it('TC-102 : Edit nama dengan karakter spesial — log behavior accept/reject', () => {
      const nama = `Special Test ${TS}`
      const namaSpesial = `Math & Sci ${TS} #${Math.floor(Math.random() * 99)}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .clearAndFillName(namaSpesial)
      MapelPage.clickSimpan()
      cy.wait(2000)

      cy.get('body').then(($body) => {
        const dialogStillOpen = $body.find('[role="dialog"]').length > 0
        if (dialogStillOpen) {
          cy.log('⚠️ Sistem reject karakter spesial (dialog tetap terbuka)')
        } else {
          cy.log('✅ Sistem accept karakter spesial')
          MapelPage.assertSubjectInList(namaSpesial)
        }
      })
    })

    it('TC-103 : Edit nama duplikat di instansi BERBEDA — sistem allow (scope per-instansi)', () => {
      const namaDuplikat = `Cross Instansi ${TS}`
      const namaOriginal = `Original Sec ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaDuplikat)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.secondary, data.timeouts.dropdown)
        .fillName(namaOriginal)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(namaOriginal, data.timeouts.shortAction)
        .clearAndFillName(namaDuplikat)
        .updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.filterByInstansi(data.instansi.primary, data.timeouts.dropdown)
      cy.wait(1500)
      MapelPage.assertSubjectInList(namaDuplikat)
    })
  })

  // ============================================================
  // S-12 — Batal & Close Modal Edit
  // ============================================================
  describe('S-12 — Batal & Close Modal Edit', () => {

    it('TC-047 : Klik Batal saat edit — perubahan tidak tersimpan', () => {
      const nama = `Batal Edit ${TS}`
      const namaDraft = `Should Not Save Batal ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .clearAndFillName(namaDraft)
        .clickBatal()

      MapelPage.elements.dialog().should('not.exist')
      MapelPage.assertSubjectInList(nama)
      MapelPage.assertSubjectNotInList(namaDraft)
    })

    it('TC-048 : Klik tombol X saat edit — modal close, data tidak berubah', () => {
      const nama = `Close X Edit ${TS}`
      const namaDraft = `Should Not Save X ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .clearAndFillName(namaDraft)
        .closeWithX()

      MapelPage.elements.dialog().should('not.exist')
      MapelPage.assertSubjectInList(nama)
      MapelPage.assertSubjectNotInList(namaDraft)
    })

    it('TC-049 : Tekan Esc saat edit — modal close, data tidak berubah', () => {
      const nama = `Esc Edit ${TS}`
      const namaDraft = `Should Not Save Esc ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .clearAndFillName(namaDraft)
        .closeWithEsc()

      MapelPage.elements.dialog().should('not.exist')
      MapelPage.assertSubjectInList(nama)
      MapelPage.assertSubjectNotInList(namaDraft)
    })

    it('TC-104 : Open edit → langsung close tanpa edit — data tidak berubah', () => {
      const nama = `Open Close ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .clickBatal()

      MapelPage.elements.dialog().should('not.exist')
      MapelPage.assertSubjectInList(nama)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
      MapelPage.elements.nameInput().should('have.value', nama)
    })

    it('TC-105 : Klik Batal setelah ubah field — perubahan dropped saat reopen', () => {
      const nama = `Drop Changes ${TS}`
      const draft = `Should Drop ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .clearAndFillName(draft)
        .clickBatal()

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
      MapelPage.elements.nameInput().should('have.value', nama)
      MapelPage.elements.nameInput().should('not.have.value', draft)
    })
  })

  // ============================================================
  // S-13 — Edge Case Edit
  // ============================================================
  describe('S-13 — Edge Case Edit', () => {

    it('TC-050 : Toggle status Tidak Aktif → Aktif — indikator hilang', () => {
      const nama = `Toggle Status ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .selectStatus(data.labels.statusInactive, data.timeouts.dropdown)
      cy.get('[role="listbox"]').should('not.exist')
      MapelPage.elements.statusTrigger().should('contain', data.labels.statusInactive)
      cy.wait(500)
      MapelPage.updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.assertStatusInactive(nama)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .selectStatus(data.labels.statusActive, data.timeouts.dropdown)
      cy.get('[role="listbox"]').should('not.exist')
      MapelPage.elements.statusTrigger().should('contain', data.labels.statusActive)
      cy.wait(500)
      MapelPage.updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.assertStatusActive(nama)
    })

    it('TC-051 : Data hasil edit persist setelah page refresh', () => {
      const namaLama = `Persist Old ${TS}`
      const namaBaru = `Persist New ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaLama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(namaLama, data.timeouts.shortAction)
        .clearAndFillName(namaBaru)
        .updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      cy.reload()
      MapelPage.assertSubjectInList(namaBaru)
      MapelPage.assertSubjectNotInList(namaLama)
    })

    it('TC-106 : Multiple edit berturut-turut di mapel yang sama — semua perubahan persist', () => {
      const namaAwal = `Multi Edit 0 ${TS}`
      const nama1 = `Multi Edit 1 ${TS}`
      const nama2 = `Multi Edit 2 ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaAwal)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(namaAwal, data.timeouts.shortAction)
        .clearAndFillName(nama1)
        .updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama1, data.timeouts.shortAction)
        .clearAndFillName(nama2)
        .updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.assertSubjectInList(nama2)
      MapelPage.assertSubjectNotInList(nama1)
      MapelPage.assertSubjectNotInList(namaAwal)
    })

    it('TC-107 : Edit mapel inactive → ubah jadi active — bisa di-search lagi (filter Aktif)', () => {
      const nama = `Reactivate ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .selectStatus(data.labels.statusInactive, data.timeouts.dropdown)
      cy.get('[role="listbox"]').should('not.exist')
      cy.wait(500)
      MapelPage.updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openEditForm(nama, data.timeouts.shortAction)
        .selectStatus(data.labels.statusActive, data.timeouts.dropdown)
      cy.get('[role="listbox"]').should('not.exist')
      cy.wait(500)
      MapelPage.updateExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.filterByStatus(data.labels.statusActive, data.timeouts.dropdown)
      cy.wait(1500)
      MapelPage.assertSubjectInList(nama)
    })
  })

})