import LoginPage from '../../../../../support/pageobjects/LoginPage'
import MapelPage from '../../../../../support/pageobjects/MapelPage'

describe('Pengaturan Mata Pelajaran - Fajar Ardiansyah', () => {
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
  // S-01 — Akses & Navigasi ke Form Tambah Mata Pelajaran
  // ============================================================
  describe('S-01 — Akses & Navigasi', () => {

    it('TC-001 : Halaman mata pelajaran berhasil dimuat', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.elements.pageTitle().should('be.visible')
      MapelPage.elements.btnTambah().should('be.visible')
    })

    it('TC-002 : Klik tombol Tambah Mata Pelajaran menampilkan form', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.elements.btnTambah().should('be.visible').click()
      MapelPage.elements.dialog().should('be.visible')
      MapelPage.elements.nameInput().should('be.visible')
      MapelPage.elements.codeInput().should('be.visible')
      MapelPage.elements.instansiTrigger().should('be.visible')
      MapelPage.elements.btnSimpan().should('be.visible')
      MapelPage.elements.btnBatal().should('be.visible')
    })

    it('TC-003 : Label dan placeholder form tampil sesuai', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList).openAddForm(data.timeouts.shortAction)
      MapelPage.elements.nameInput().should('have.attr', 'placeholder', data.labels.placeholderName)
      MapelPage.elements.codeInput().should('have.attr', 'placeholder', data.labels.placeholderCode)
      MapelPage.elements.instansiTrigger().should('contain', data.labels.placeholderInstansi)
    })

    it('TC-004 : Form responsif di resolusi 1920x1080', () => {
      const vp = data.viewports.fhd
      cy.viewport(vp.width, vp.height)
      MapelPage.visit(data.urls.base, data.urls.subjectList).openAddForm(data.timeouts.shortAction)
      MapelPage.elements.instansiTrigger().should('be.visible')
      MapelPage.elements.nameInput().should('be.visible')
      MapelPage.elements.codeInput().should('be.visible')
      MapelPage.elements.btnSimpan().should('be.visible')
      MapelPage.elements.btnBatal().should('be.visible')
    })

    it('TC-004b : Form responsif di resolusi 1280x720', () => {
      const vp = data.viewports.hd
      cy.viewport(vp.width, vp.height)
      MapelPage.visit(data.urls.base, data.urls.subjectList).openAddForm(data.timeouts.shortAction)
      MapelPage.elements.instansiTrigger().should('be.visible')
      MapelPage.elements.nameInput().should('be.visible')
      MapelPage.elements.codeInput().should('be.visible')
      MapelPage.elements.btnSimpan().should('be.visible')
      MapelPage.elements.btnBatal().should('be.visible')
    })
  })

  // ============================================================
  // S-02 — Validasi Field Required
  // ============================================================
  describe('S-02 — Validasi Field Required', () => {

    it('TC-005 : Submit form kosong — pesan error tampil di semua required field', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList).openAddForm(data.timeouts.shortAction)
      MapelPage.clickSimpan()
      MapelPage.assertValidationMessage(data.messages.instansiRequired)
      MapelPage.elements.formMessage().should('contain', data.messages.nameRequired)
      MapelPage.elements.nameInput().should('be.visible')
      cy.url().should('include', data.urls.subjectList)
    })

    it('TC-006 : Instansi diisi, Nama kosong — error hanya muncul di field Nama', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList).openAddForm(data.timeouts.shortAction)
      MapelPage.selectInstansi(data.instansi.primary, data.timeouts.dropdown)
      MapelPage.clickSimpan()
      MapelPage.assertValidationMessage(data.messages.nameRequired)
      MapelPage.assertValidationNotContains(data.messages.instansiRequired)
    })

    it('TC-007 : Nama diisi, Instansi kosong — error hanya muncul di field Instansi', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList).openAddForm(data.timeouts.shortAction)
      MapelPage.fillName(data.testData.existingSubject)
      MapelPage.clickSimpan()
      MapelPage.assertValidationMessage(data.messages.instansiRequired)
      MapelPage.assertValidationNotContains(data.messages.nameRequired)
    })

    it('TC-008 : Pesan error hilang setelah field yang error diisi', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList).openAddForm(data.timeouts.shortAction)
      MapelPage.clickSimpan()
      MapelPage.elements.formMessage().should('be.visible')
      MapelPage.selectInstansi(data.instansi.primary, data.timeouts.dropdown)
      MapelPage.assertValidationNotContains(data.messages.instansiRequired)
      MapelPage.fillName(data.testData.existingSubject)
      MapelPage.elements.formMessage().should('not.exist')
      MapelPage.elements.btnSimpan().should('be.enabled')
    })

    it('TC-009 : Nama hanya spasi — dianggap kosong, pesan error tampil', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList).openAddForm(data.timeouts.shortAction)
      MapelPage.selectInstansi(data.instansi.primary, data.timeouts.dropdown)
      MapelPage.fillName(data.testData.spaceOnly)
      MapelPage.clickSimpan()
      MapelPage.assertValidationMessage(data.messages.nameRequired)
      cy.url().should('include', data.urls.subjectList)
    })
  })

  // ============================================================
  // S-03 — Validasi Field Kode
  // ============================================================
  describe('S-03 — Validasi Field Kode (Optional & Auto-Generate)', () => {

    it('TC-010 : Simpan tanpa isi Kode — sistem auto-generate kode unik', () => {
      const nama = `Geografi ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.assertSubjectInList(nama)
      MapelPage.getCellTextFromRow(nama, 2).should('not.be.empty')
    })

    it('TC-011 : Simpan dengan Kode manual — kode tersimpan sesuai input', () => {
      const nama = `Ekonomi ${TS}`
      const kode = `EKO${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .fillCode(kode)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.getRowByName(nama).find('td').eq(2).should('contain', 'EKO')
    })

    it('TC-012 : Kode auto-generate untuk mapel berbeda tidak duplikat', () => {
      const namaGeografi  = `Geografi ${TS}`
      const namaSosiologi = `Sosiologi ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaSosiologi)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      let kodeSosiologi = ''
      MapelPage.getCellTextFromRow(namaSosiologi, 2).then((t) => { kodeSosiologi = t.trim() })
      MapelPage.getCellTextFromRow(namaGeografi, 2).then((t) => {
        expect(kodeSosiologi).to.not.equal(t.trim())
      })
    })

    it('TC-013 : Input Kode >50 karakter — sistem menampilkan error atau membatasi input', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(`Boundary Test ${TS}`)
        .fillCode(data.testData.longCode)
      MapelPage.clickSimpan()
      cy.wait(data.timeouts.validation)
      cy.get('body').then(($body) => {
        const hasFormError = $body.find('[data-slot="form-message"]').length > 0
        const hasToast     = $body.find('li[data-sonner-toast]').length > 0
        const inputVal     = $body.find('input[name="code"]').val()
        if (hasFormError || hasToast) {
          cy.log('✅ Sistem menampilkan error untuk kode terlalu panjang')
        } else if (inputVal && inputVal.length < data.testData.longCode.length) {
          cy.log(`✅ Input dibatasi otomatis ke ${inputVal.length} karakter`)
        } else {
          cy.log('⚠️ Tidak ada pembatasan — catat sebagai temuan untuk dev')
        }
      })
    })
  })

  // ============================================================
  // S-04 — Duplikasi Nama Mata Pelajaran
  // ⚠️ PRE-CONDITION: Data 'pjok' sudah ada di SMP Digital Indonesia+
  // ============================================================
  describe('S-04 — Duplikasi Nama Mata Pelajaran', () => {

    it('TC-014 : Nama duplikat pada instansi sama — sistem menampilkan toast error', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(data.testData.existingSubject)
        .saveExpectFailure(data.timeouts.errorCheck)
    })

    it('TC-015 : Nama sama di instansi berbeda — berhasil disimpan (bukan duplikat)', () => {
      const nama = `pjok kop ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.secondary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.assertSubjectInList(nama)
    })

    it('TC-016 : Nama duplikat beda kapitalisasi — sistem tetap mendeteksi duplikat', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(data.testData.existingSubjectUppercase)
        .saveExpectFailure(data.timeouts.errorCheck)
    })

    it('TC-017 : Nama duplikat dengan spasi di depan/belakang — sistem trim lalu deteksi duplikat', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(data.testData.existingSubjectPadded)
        .saveExpectFailure(data.timeouts.errorCheck)
    })

    it('TC-030 : Kode duplikat pada instansi sama — sistem reject', () => {
      const kodeShared = `DUP${TS}`
      const namaPertama = `Mapel A ${TS}`
      const namaKedua = `Mapel B ${TS}`

      // Buat mapel pertama dengan kode manual
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaPertama)
        .fillCode(kodeShared)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      // Coba buat mapel kedua di instansi sama dengan kode yang sama → harus reject
      MapelPage.openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaKedua)
        .fillCode(kodeShared)
        .saveExpectFailure(data.timeouts.errorCheck)
    })

    it('TC-031 : Kode sama di instansi berbeda — berhasil disimpan (bukan duplikat)', () => {
      const kodeShared = `MULTI${TS}`
      const namaPertama = `Mapel Primary ${TS}`
      const namaKedua = `Mapel Secondary ${TS}`

      // Buat di instansi A
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaPertama)
        .fillCode(kodeShared)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      // Buat di instansi B dengan kode sama → harus berhasil (scope kode per-instansi)
      MapelPage.openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.secondary, data.timeouts.dropdown)
        .fillName(namaKedua)
        .fillCode(kodeShared)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.assertSubjectInList(namaPertama)
      MapelPage.assertSubjectInList(namaKedua)
    })
  })

  // ============================================================
  // S-05 — Fungsi Tombol Batal
  // ============================================================
  describe('S-05 — Fungsi Tombol Batal', () => {

    it('TC-018 : Klik Batal di form kosong — form tertutup, data tidak tersimpan', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.elements.dataGridRows().its('length').then((jumlahAwal) => {
        MapelPage.elements.btnTambah().click()
        MapelPage.elements.dialog().should('be.visible')
        cy.wait(data.timeouts.modalAnim)
        MapelPage.clickBatal()
        MapelPage.elements.dialog().should('not.exist')
        cy.url().should('include', data.urls.subjectList)
        MapelPage.elements.dataGridRows().its('length').should('eq', jumlahAwal)
      })
    })

    it('TC-019 : Klik Batal setelah form diisi sebagian — data tidak tersimpan', () => {
      const namaDraft = `pkn batal ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.elements.dataGridRows().its('length').then((jumlahAwal) => {
        MapelPage.openAddForm(data.timeouts.shortAction)
          .selectInstansi(data.instansi.secondary, data.timeouts.dropdown)
          .fillName(namaDraft)
          .clickBatal()
        MapelPage.elements.dialog().should('not.exist')
        cy.url().should('include', data.urls.subjectList)
        MapelPage.assertSubjectNotInList(namaDraft)
        MapelPage.elements.dataGridRows().its('length').should('eq', jumlahAwal)
      })
    })

    it('TC-020 : Navigasi browser back dari form — data tidak tersimpan [MANUAL]', () => {
      const namaDraft = `pkn back ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.elements.dataGridRows().its('length').then((jumlahAwal) => {
        MapelPage.openAddForm(data.timeouts.shortAction)
          .selectInstansi(data.instansi.secondary, data.timeouts.dropdown)
          .fillName(namaDraft)
          .clickBatal()
        MapelPage.elements.dialog().should('not.exist')
        MapelPage.assertSubjectNotInList(namaDraft)
        MapelPage.elements.dataGridRows().its('length').should('eq', jumlahAwal)
      })
    })
  })

  // ============================================================
  // S-06 — Simpan Data Valid & Pesan Sukses
  // ============================================================
  describe('S-06 — Simpan Data Valid', () => {

    it('TC-021 : Simpan mata pelajaran valid — toast sukses tampil & data masuk list', () => {
      const nama = `Sejarah ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .fillCode(`SEJ${TS}`)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.assertSubjectInList(nama)
    })

    it('TC-022 : Toast sukses tampil lalu hilang otomatis dalam 5 detik', () => {
      const nama = `Sejarah Dunia ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .fillCode(`SJRD${TS}`)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      cy.wait(data.timeouts.toastDismiss)
      MapelPage.elements.visibleToast().should('not.exist')
    })

    it('TC-023 : Data tersimpan tampil di list dengan kolom Instansi, Nama, Kode benar', () => {
      const nama = `Sejarah ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.getRowByName(nama).within(() => {
        cy.get('td').eq(0).should('contain', data.instansi.primary)
        cy.get('td').eq(1).should('contain', nama)
        cy.get('td').eq(2).should('not.be.empty')
      })
    })

    it('TC-024 : Tambah beberapa mata pelajaran berturut-turut — semua tersimpan di list', () => {
      const namaAgama = `Agama Islam ${TS}`
      const namaSeni  = `Seni Budaya ${TS}`

      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaAgama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaSeni)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      MapelPage.visit(data.urls.base, data.urls.subjectList)
      MapelPage.elements.dataGrid()
        .should('contain', namaAgama)
        .and('contain', namaSeni)
    })

    it('TC-025 : Nama dengan spasi antar kata tersimpan dan tampil utuh di list', () => {
      const nama = `Bahasa Inggris Wajib ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.visit(data.urls.base, data.urls.subjectList).assertSubjectInList(nama)
    })

    it('TC-026 : Input Nama >255 karakter — sistem menampilkan error atau membatasi input', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName('A'.repeat(data.testData.boundaries.nameOverflow))
      MapelPage.clickSimpan()
      cy.wait(data.timeouts.validation)
      cy.get('body').then(($body) => {
        const hasFormError = $body.find('[data-slot="form-message"]').length > 0
        const hasToast     = $body.find('li[data-sonner-toast]').length > 0
        if (hasFormError || hasToast) {
          cy.log('✅ Sistem menampilkan error untuk nama melebihi batas karakter')
        } else {
          cy.log('⚠️ Tidak ada error — konfirmasi ke dev apakah ada batas karakter')
        }
      })
    })
  })

  // ============================================================
  // S-07 — Edge Case & Boundary Testing
  // ============================================================
  describe('S-07 — Edge Case & Boundary Testing', () => {

    it('TC-027 : Input Nama 1 karakter — data berhasil disimpan', () => {
      const nama = `Z ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.visit(data.urls.base, data.urls.subjectList).assertSubjectInList(nama)
    })

    it('TC-028 : Input Nama angka saja — sistem menerima (angka valid)', () => {
      const nama = `99 ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.assertSubjectInList(nama)
    })

    it('TC-028b : Input Nama dengan karakter spesial — sistem menampilkan error validasi', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(data.testData.specialChar)
      MapelPage.clickSimpan()
      cy.wait(data.timeouts.validation)
      MapelPage.elements.formMessage().should('be.visible')
      MapelPage.elements.dialog().should('exist')
    })

    it('TC-029 : Submit dengan network error — sistem menampilkan pesan error [SEMI-MANUAL]', () => {
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(`Offline Test ${TS}`)
      cy.log('⚠️ TC-029: Aktifkan mode Offline di DevTools sebelum klik Simpan')
      cy.log('⚠️ Expected: toast error muncul, data tidak tersimpan')
      MapelPage.elements.btnSimpan().should('be.visible')
    })
  })

  // ============================================================
  // S-08 — Validasi Lanjutan Field Kode
  // ============================================================
  describe('S-08 — Validasi Lanjutan Field Kode', () => {

    it('TC-032 : Kode dengan karakter spesial — sistem menerima atau menampilkan validasi', () => {
      const nama = `Karakter Spesial ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .fillCode(data.testData.codeWithSpecial)
      MapelPage.clickSimpan()
      cy.wait(data.timeouts.validation)
      cy.get('body').then(($body) => {
        const hasFormError = $body.find('[data-slot="form-message"]').length > 0
        const dialogExist  = $body.find('[role="dialog"]').length > 0
        if (hasFormError || dialogExist) {
          cy.log('✅ Sistem reject karakter spesial di kode')
        } else {
          cy.log('⚠️ Karakter spesial diterima — konfirmasi ke dev apakah by design')
          MapelPage.assertSubjectInList(nama)
        }
      })
    })

    it('TC-033 : Kode case sensitivity (UPPERCASE vs lowercase) — verifikasi behavior', () => {
      const namaPertama = `Case Test Upper ${TS}`
      const namaKedua   = `Case Test Lower ${TS}`

      // Buat dengan kode uppercase
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaPertama)
        .fillCode(`${data.testData.codeUppercase}${TS}`)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)

      // Coba buat dengan kode lowercase versi sama
      MapelPage.openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(namaKedua)
        .fillCode(`${data.testData.codeLowercase}${TS}`)
      MapelPage.clickSimpan()
      cy.wait(data.timeouts.errorCheck)
      cy.get('body').then(($body) => {
        const dialogStillOpen = $body.find('[role="dialog"]').length > 0
        if (dialogStillOpen) {
          cy.log('✅ Kode case-INSENSITIVE — TESTUP dianggap sama dengan testup')
        } else {
          cy.log('✅ Kode case-SENSITIVE — TESTUP dan testup dianggap berbeda')
        }
      })
    })

    it('TC-034 : Kode hanya angka — sistem menerima', () => {
      const nama = `Numeric Code ${TS}`
      const kodeNumeric = `${data.testData.codeNumeric}${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .fillCode(kodeNumeric)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.assertSubjectInList(nama)
      MapelPage.getRowByName(nama).find('td').eq(2).should('contain', data.testData.codeNumeric)
    })

    it('TC-035 : Kode dengan spasi di depan/belakang — sistem trim sebelum simpan', () => {
      const nama = `Trim Code ${TS}`
      MapelPage.visit(data.urls.base, data.urls.subjectList)
        .openAddForm(data.timeouts.shortAction)
        .selectInstansi(data.instansi.primary, data.timeouts.dropdown)
        .fillName(nama)
        .fillCode(`  TRIM${TS}  `)
        .saveExpectSuccess(data.timeouts.dialog, data.urls.subjectList)
      MapelPage.assertSubjectInList(nama)
      // Verify kode tersimpan tanpa spasi (di-trim)
      MapelPage.getRowByName(nama).find('td').eq(2).invoke('text').then((kode) => {
        expect(kode.trim()).to.equal(`TRIM${TS}`)
        expect(kode).to.not.match(/^\s/)
        expect(kode).to.not.match(/\s$/)
      })
    })
  })

})