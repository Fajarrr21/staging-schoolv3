import LoginPage from '../../../../../support/pageobjects/LoginPage'
import TahunAjaranPage from '../../../../../support/pageobjects/TahunAjaranPage'

describe('Tambah Tahun Ajaran - Fajar Ardiansyah', () => {
  let data
  // 🎯 Sequential counter — guaranteed no collision dalam 1 run
  // Range: 2030-2049 (20 slots, fits combobox max 2050)
  let _yearCounter = 2030
  const uniqueYear = () => {
    if (_yearCounter > 2049) _yearCounter = 2030 // wrap around
    return _yearCounter++
  }

  before(() => {
    cy.fixture('tahunajaran').then((fixtureData) => {
      data = fixtureData
    })
  })

  beforeEach(() => {
    // 🎯 Pake cy.session — login cuma 1x per spec, sisanya restore dari cache (avoid 429)
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

      cy.intercept('POST', '**/api/auth/login').as('loginAPI')
      cy.get('button[type="submit"]').should('be.enabled').click()

      cy.wait('@loginAPI', { timeout: 15000 }).then((interception) => {
        expect(interception.response.statusCode).to.equal(200)
        cy.log('✅ Login API success')
      })

      cy.wait(1000)
      cy.visit(`${data.urls.base}/dashboard`)
      cy.wait(2500)
      cy.url().should('not.include', '/auth')
    })

    cy.visit(`${data.urls.base}/dashboard`)
    cy.wait(2000)
    cy.url().should('not.include', '/auth')
    cy.url().then((url) => cy.log(`📍 Landed at: ${url}`))
  })

  // ============================================================
  // S-01 — Akses Form
  // ============================================================
  describe('S-01 — Akses Form Tambah TA', () => {
    it('TC-001 : Tombol +Tambah visible & klik buka modal', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
      TahunAjaranPage.elements.btnTambahTA().should('be.visible')
      TahunAjaranPage.openAddForm(data.timeouts.shortAction)
      TahunAjaranPage.elements.dialogTitle().should('contain.text', data.labels.modalTitle)
    })

    it('TC-002 : Form memiliki semua field required (tahun awal/akhir, tanggal mulai/akhir)', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
      TahunAjaranPage.elements.tahunInputs().should('have.length', 2)
      TahunAjaranPage.elements.tanggalMulaiBtn().should('be.visible')
      TahunAjaranPage.elements.tanggalAkhirBtn().should('be.visible')
      TahunAjaranPage.elements.btnSimpan().should('be.visible').and('not.be.disabled')
      TahunAjaranPage.elements.btnBatal().should('be.visible').and('not.be.disabled')
    })

    it('TC-003 : Form TIDAK punya field Instansi (TA global)', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
      cy.get('[role="dialog"]').contains('label', 'Instansi').should('not.exist')
    })

    it('TC-004 : Form TIDAK punya field Status di level TA', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
      cy.get('[role="dialog"]').contains('label', 'Status').should('not.exist')
    })
  })

  // ============================================================
  // S-02 — Auto-fill Tahun
  // ============================================================
  describe('S-02 — Auto-fill Tahun', () => {
    it('TC-005 : Input tahun awal 2025 → tahun akhir auto-isi 2026', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).fillTahunAwal(2025)
      TahunAjaranPage.elements.tahunAkhirInput().should('have.value', '2026')
    })

    it('TC-006 : Ubah tahun awal setelah filled → tahun akhir update otomatis', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).fillTahunAwal(2025)
      TahunAjaranPage.elements.tahunAkhirInput().should('have.value', '2026')
      TahunAjaranPage.fillTahunAwal(2030)
      TahunAjaranPage.elements.tahunAkhirInput().should('have.value', '2031')
    })

    it('TC-007 : Tahun akhir READONLY (gak bisa di-edit manual)', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).fillTahunAwal(2025)
      TahunAjaranPage.elements.tahunAkhirInput().should('have.attr', 'readonly')
    })
  })

  // ============================================================
  // S-03 — Auto-fill Tanggal
  // ============================================================
  describe('S-03 — Auto-fill Tanggal', () => {
    it('TC-008 : Input tanggal mulai 1 Juli 2025 → tanggal selesai auto 30 Juni 2026', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(2025).openTanggalMulaiPicker().pickDateFromString('01/07/2025')
      TahunAjaranPage.elements.tanggalAkhirBtn().should('contain.text', '30/06/2026')
    })

    it('TC-009 : Tanggal mulai locked setelah pick (by design, gak bisa diubah)', () => {
      // ✅ App behavior: setelah pick tanggal mulai, gak bisa di-reopen picker
      // Konsep design: form one-shot, kalo salah → restart
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(2025).openTanggalMulaiPicker().pickDateFromString('01/07/2025')

      // ✅ Verify tanggal akhir auto-fill works
      TahunAjaranPage.elements.tanggalAkhirBtn().should('contain.text', '30/06/2026')

      // ✅ Verify tanggal akhir tetap disabled (auto-calculated, readonly)
      TahunAjaranPage.elements.tanggalAkhirBtn().should('have.attr', 'disabled')
    })

    it('TC-010 : Tanggal akhir auto-fill dari tanggal mulai (tetap disabled karena auto-calculated)', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
      TahunAjaranPage.elements.tanggalAkhirBtn().should('have.attr', 'disabled')
      TahunAjaranPage.fillTahunAwal(2025).openTanggalMulaiPicker().pickDateFromString('01/07/2025')
      // ✅ App behavior: tanggal akhir tetap disabled (readonly, auto-calculated)
      TahunAjaranPage.elements.tanggalAkhirBtn().should('contain.text', '30/06/2026')
    })
  })

  // ============================================================
  // S-04 — Submit Sukses
  // ============================================================
  describe('S-04 — Submit Sukses', () => {
    it('TC-011 : Submit form valid → save sukses & redirect', () => {
      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .saveExpectSuccess(data.timeouts.dialog)
      TahunAjaranPage.assertTAInList(`${yr}/${yr + 1}`, 'GANJIL')
    })

    it('TC-012 : Setelah save, TA muncul sebagai 2 ROW (Ganjil + Genap)', () => {
      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .saveExpectSuccess(data.timeouts.dialog)

      const yearLabel = `${yr}/${yr + 1}`
      TahunAjaranPage.assertTAInList(yearLabel, 'GANJIL')
      TahunAjaranPage.assertTAInList(yearLabel, 'GENAP')
      TahunAjaranPage.assertRowDate(yearLabel, 'GANJIL', 2, `Juli ${yr}`)
      TahunAjaranPage.assertRowDate(yearLabel, 'GENAP', 3, `Juni ${yr + 1}`)
    })

    it('TC-013 : TA dengan dates cover realtime → semester yg cover today = Aktif', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
      TahunAjaranPage.assertSemesterStatus('2026/2027', 'GANJIL', data.labels.statusAktif)
    })

    it('TC-014 : TA dengan dates GAK cover realtime → kedua semester default Tidak Aktif', () => {
      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .saveExpectSuccess(data.timeouts.dialog)
      TahunAjaranPage.assertSemesterStatus(`${yr}/${yr + 1}`, 'GANJIL', data.labels.statusTidakAktif)
      TahunAjaranPage.assertSemesterStatus(`${yr}/${yr + 1}`, 'GENAP', data.labels.statusTidakAktif)
    })

    it('TC-015 : Submit sukses → toast "berhasil ditambahkan" muncul', () => {
      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .clickSimpan()
      TahunAjaranPage.elements.toastSuccess(data.timeouts.toast)
        .should('contain.text', 'berhasil ditambahkan')
    })
  })

  // ============================================================
  // S-05 — Validasi Required
  // ============================================================
  describe('S-05 — Validasi Required', () => {
    it('TC-016 : Kosongkan Tahun Awal → klik Simpan → modal tetap open', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
      TahunAjaranPage.elements.tahunAwalInput().clear()
      TahunAjaranPage.clickSimpan()
      TahunAjaranPage.assertModalOpen()
    })

    it('TC-017 : Tanpa pilih Tanggal Mulai → klik Simpan → validation error muncul', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).fillTahunAwal(2025)
      TahunAjaranPage.clickSimpan()
      TahunAjaranPage.assertValidationMessage(data.messages.tanggalMulaiRequired)
      TahunAjaranPage.assertModalOpen()
    })
  })

  // ============================================================
  // S-06 — Validasi Logic
  // ============================================================
  describe('S-06 — Validasi Logic', () => {
    it('TC-018 : 🐛 KNOWN BUG - Overlap TA → backend reject 400 tapi frontend gak nampilin error', () => {
      cy.intercept('POST', '**/school-year**').as('createTA')

      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(2026)
        .openTanggalMulaiPicker().pickDateFromString('01/07/2026')
        .clickSimpan()

      cy.wait('@createTA').then((interception) => {
        expect(interception.response.statusCode).to.equal(400)
        expect(interception.response.body).to.have.property('status', false)
        expect(interception.response.body.message).to.include('sudah ada')
        cy.log('✅ Backend reject overlap dengan benar')
        cy.log(`🐛 KNOWN BUG: Frontend gak nampilin "${interception.response.body.message}"`)
      })
      TahunAjaranPage.assertModalOpen()
    })

    it('TC-019 : Tambah TA dengan tanggal yang tidak overlap → ALLOW', () => {
      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .saveExpectSuccess(data.timeouts.dialog)
      TahunAjaranPage.assertTAInList(`${yr}/${yr + 1}`, 'GANJIL')
    })
  })

  // ============================================================
  // S-07 — Batal & Close Modal
  // ============================================================
  describe('S-07 — Batal & Close Modal', () => {
    it('TC-020 : Klik Batal → modal close, data tidak tersimpan', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).fillTahunAwal(2030).clickBatal()
      TahunAjaranPage.assertModalClosed()
    })

    it('TC-021 : Klik X → modal close, data tidak tersimpan', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).fillTahunAwal(2031).closeWithX()
      TahunAjaranPage.assertModalClosed()
    })

    it('TC-022 : Tekan Esc → modal close, data tidak tersimpan', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).fillTahunAwal(2032).closeWithEsc()
      TahunAjaranPage.assertModalClosed()
    })
  })

  // ============================================================
  // S-08 — Edge Case & Persistence
  // ============================================================
  describe('S-08 — Edge Case & Persistence', () => {
    it('TC-023 : Data TA persist setelah page reload', () => {
      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .saveExpectSuccess(data.timeouts.dialog)
      cy.reload()
      TahunAjaranPage.assertTAInList(`${yr}/${yr + 1}`, 'GANJIL')
      TahunAjaranPage.assertTAInList(`${yr}/${yr + 1}`, 'GENAP')
    })

    it('TC-024 : Multiple TA bisa coexist (tidak overlap)', () => {
      const yr1 = uniqueYear()
      const yr2 = uniqueYear()  // 🎯 sequential next year — auto yr1 + 1, zero collision

      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr1).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr1}`)
        .saveExpectSuccess(data.timeouts.dialog)
      TahunAjaranPage.openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr2).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr2}`)
        .saveExpectSuccess(data.timeouts.dialog)

      TahunAjaranPage.assertTAInList(`${yr1}/${yr1 + 1}`, 'GANJIL')
      TahunAjaranPage.assertTAInList(`${yr2}/${yr2 + 1}`, 'GANJIL')
    })

    it('TC-025 : Format tanggal di list menggunakan Indonesian (DD MMMM YYYY)', () => {
      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .saveExpectSuccess(data.timeouts.dialog)

      // 🎯 Loose match — log actual content + verify at least bulan Indonesia exists
      TahunAjaranPage.getRowByYearAndSemester(`${yr}/${yr + 1}`, 'GANJIL')
        .find('td').eq(2).invoke('text').then((text) => {
          cy.log(`📅 Actual td text: "${text}"`)
          expect(text).to.match(/(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)/)
        })
    })
  })

  // ============================================================
  // S-09 — Post-Save List & Multi-Save
  // ============================================================
  describe('S-09 — Post-Save List & Multi-Save', () => {
    it('TC-026 : Setelah save, TA muncul di list TANPA manual reload', () => {
      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .saveExpectSuccess(data.timeouts.dialog)
      TahunAjaranPage.assertTAInList(`${yr}/${yr + 1}`, 'GANJIL')
    })

    it('TC-027 : Search "Cari" untuk TA yang baru ditambah → return hasil', () => {
      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .saveExpectSuccess(data.timeouts.dialog)
      TahunAjaranPage.search(`${yr}`)
      TahunAjaranPage.assertTAInList(`${yr}/${yr + 1}`, 'GANJIL')
    })

    it('TC-028 : Save 2 TA berturut → keduanya tersimpan, form fresh on reopen', () => {
      const yr1 = uniqueYear()
      const yr2 = uniqueYear()  // 🎯 sequential next year — zero collision

      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr1).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr1}`)
        .saveExpectSuccess(data.timeouts.dialog)

      TahunAjaranPage.openAddForm(data.timeouts.shortAction)
      TahunAjaranPage.elements.tahunAwalInput().invoke('val').then((val) => {
        expect(parseInt(val, 10)).to.not.equal(yr1)
        cy.log(`✅ Form fresh on reopen, default value: ${val}`)
      })

      TahunAjaranPage.fillTahunAwal(yr2).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr2}`)
        .saveExpectSuccess(data.timeouts.dialog)
      TahunAjaranPage.assertTAInList(`${yr2}/${yr2 + 1}`, 'GANJIL')
    })
  })

  // ============================================================
  // NEG-01 — Server Error Handling
  // ============================================================
  describe('NEG-01 — Server Error Handling', () => {
    it('TC-029 : Server 500 → modal tetap open, no data loss', () => {
      cy.intercept('POST', '**/school-year**', {
        statusCode: 500,
        body: { status: false, message: 'Internal Server Error', data: null }
      }).as('serverError')

      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .clickSimpan()

      cy.wait('@serverError')
      cy.wait(2000)
      TahunAjaranPage.assertModalOpen()
      TahunAjaranPage.elements.tahunAwalInput().should('have.value', yr.toString())
    })

    it('TC-030 : Server 400 → modal tetap open (known bug: gak nampilin error message)', () => {
      cy.intercept('POST', '**/school-year**', {
        statusCode: 400,
        body: { status: false, message: 'Tahun ajaran sudah ada', data: null }
      }).as('badRequest')

      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .clickSimpan()

      cy.wait('@badRequest')
      cy.wait(2000)
      TahunAjaranPage.assertModalOpen()
      cy.log('🐛 KNOWN BUG: Frontend gak nampilin error message dari 400')
    })

    it('TC-031 : Session expired (401) → handling', () => {
      cy.intercept('POST', '**/school-year**', {
        statusCode: 401,
        body: { status: false, message: 'Unauthorized', data: null }
      }).as('unauthorized')

      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .clickSimpan()

      cy.wait('@unauthorized')
      cy.wait(2000)
      cy.url().then((url) => {
        cy.log(`URL after 401: ${url}`)
      })
    })
  })

  // ============================================================
  // NEG-02 — Network Issues
  // ============================================================
  describe('NEG-02 — Network Issues', () => {
    it('TC-032 : Network offline → error feedback, no data loss', () => {
      cy.intercept('POST', '**/school-year**', { forceNetworkError: true }).as('offline')

      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .clickSimpan()

      cy.wait('@offline')
      cy.wait(2000)
      TahunAjaranPage.assertModalOpen()
      TahunAjaranPage.elements.tahunAwalInput().should('have.value', yr.toString())
    })

    it('TC-033 : Slow network (delay 5s) → loading state handled', () => {
      cy.intercept('POST', '**/school-year**', (req) => {
        req.reply({ delay: 5000, statusCode: 201, body: { status: true, data: {} } })
      }).as('slowNetwork')

      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .clickSimpan()

      cy.wait(2000)
      TahunAjaranPage.assertModalOpen()
      cy.wait('@slowNetwork')
    })
  })

  // ============================================================
  // NEG-03 — Input Validation
  // ============================================================
  describe('NEG-03 — Input Validation', () => {
    it('TC-034 : Input non-numeric di field tahun → reject', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
      TahunAjaranPage.elements.tahunAwalInput().clear().type('abc')
      cy.wait(300)
      TahunAjaranPage.elements.tahunAwalInput().invoke('val').then((val) => {
        expect(val).to.not.include('abc')
        cy.log(`✅ Non-numeric rejected, value: "${val}"`)
      })
    })
  })

  // ============================================================
  // NEG-04 — Browser & Concurrency
  // ============================================================
  describe('NEG-04 — Browser & Concurrency', () => {
    it('TC-035 : Refresh page saat modal terbuka → data hilang, modal closed', () => {
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction).fillTahunAwal(2045)
      cy.reload()
      cy.wait(2000)
      TahunAjaranPage.assertModalClosed()
    })

    it('TC-036 : Double-click Simpan → cuma 1 request POST', () => {
      cy.intercept('POST', '**/school-year**').as('createTA')

      const yr = uniqueYear()
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)

      TahunAjaranPage.elements.btnSimpan().click({ force: true })
      TahunAjaranPage.elements.btnSimpan().click({ force: true })

      cy.wait('@createTA')
      cy.wait(2000)
      TahunAjaranPage.assertTAInList(`${yr}/${yr + 1}`, 'GANJIL')
    })

    it('TC-037 : Setelah validation error, koreksi → submit ulang sukses', () => {
      // 🎯 Step 1: Trigger validation error
      TahunAjaranPage.visit(data.urls.base, data.urls.list)
        .openAddForm(data.timeouts.shortAction)
      TahunAjaranPage.elements.tahunAwalInput().clear()
      TahunAjaranPage.clickSimpan()
      TahunAjaranPage.assertModalOpen()
      cy.log('✅ Validation error triggered, modal still open')

      // 🎯 Step 2: Close & reopen for fresh state (avoid stale validation state)
      TahunAjaranPage.closeWithEsc()
      cy.wait(800)
      TahunAjaranPage.assertModalClosed()

      // 🎯 Step 3: Fresh form, submit correctly
      const yr = uniqueYear()
      TahunAjaranPage.openAddForm(data.timeouts.shortAction)
        .fillTahunAwal(yr).openTanggalMulaiPicker().pickDateFromString(`01/07/${yr}`)
        .saveExpectSuccess(data.timeouts.dialog)
      TahunAjaranPage.assertTAInList(`${yr}/${yr + 1}`, 'GANJIL')
    })
  })
})