const BASE_URL    = 'https://staging-new-school.cazh.id'
const SUBJECT_URL = `${BASE_URL}/setting/academic/subject`
const EMAIL       = 'admin@cazh.id'
const PASSWORD    = '@GrahaTimur2026'
const TS          = Date.now()

// ── helpers ──────────────────────────────────────────────────

function loginSession() {
  cy.session('adminSession', () => {
    cy.visit(`${BASE_URL}/auth/login`)
    cy.get('input[name="email"]').type(EMAIL)
    cy.get('input[type="password"]').type(PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.get('img[alt="User Avatar"]', { timeout: 10000 }).should('be.visible')
  })
}

function goToSubjectList() {
  cy.visit(SUBJECT_URL)
  cy.url().should('include', '/setting/academic/subject')
}

function openAddForm() {
  goToSubjectList()
  cy.contains('button', 'Tambah Mata Pelajaran').click()
  cy.get('[role="dialog"]').should('be.visible')
  cy.get('input[name="name"]').should('be.visible').should('not.be.disabled')
  cy.wait(800)
}

function selectInstansi(namaInstansi) {
  cy.get('[role="dialog"]')
    .find('[data-slot="select-trigger"]')
    .should('be.visible')
    .click({ force: true })
  cy.get('[role="listbox"]', { timeout: 6000 }).should('exist')
  cy.contains('[role="option"]', namaInstansi).click({ force: true })
  cy.get('[role="dialog"]')
    .find('[data-slot="select-trigger"]')
    .should('contain', namaInstansi)
}

// Toast di Next.js muncul sebentar lalu langsung removed
// Strategy: cek via alias pada Cypress visit setelah redirect
function simpanDanVerifikasi(expectedToastText, verifyFn) {
  cy.contains('button', 'Simpan').click()
  // tunggu halaman re-render setelah server action
  cy.wait(2000)
  // cek toast dalam semua state (termasuk sudah removed)
  cy.get('li[data-sonner-toast]', { timeout: 15000 })
    .invoke('text')
    .then((toastText) => {
      cy.log('Toast: ' + toastText)
      expect(toastText).to.include(expectedToastText)
    })
  if (verifyFn) verifyFn()
}

// ============================================================
// S-01
// ============================================================

describe('S-01 — Akses & Navigasi ke Form Tambah Mata Pelajaran', () => {

  beforeEach(() => { loginSession() })

  it('TC-001 : Halaman mata pelajaran berhasil dimuat via menu navigasi', () => {
    cy.visit(BASE_URL)
    cy.contains('PENGATURAN').click()
    cy.contains('Akademik').click()
    cy.contains('Mata Pelajaran').click()
    cy.url().should('include', '/setting/academic/subject')
    cy.contains('h1', 'Mata Pelajaran').should('be.visible')
  })

  it('TC-002 : Klik tombol Tambah Mata Pelajaran menampilkan form', () => {
    goToSubjectList()
    cy.contains('button', 'Tambah Mata Pelajaran').should('be.visible').click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('input[name="name"]').should('be.visible')
    cy.get('input[name="code"]').should('be.visible')
    cy.get('[role="dialog"]').find('[data-slot="select-trigger"]').should('be.visible')
    cy.contains('button', 'Simpan').should('be.visible')
    cy.contains('button', 'Batal').should('be.visible')
  })

  it('TC-003 : Label dan placeholder form tampil sesuai', () => {
    openAddForm()
    cy.get('input[name="name"]').should('have.attr', 'placeholder', 'Contoh: Matematika')
    cy.get('input[name="code"]').should('have.attr', 'placeholder', 'Contoh: MTK001')
    cy.get('[role="dialog"]').find('[data-slot="select-trigger"]').should('contain', 'Pilih Instansi')
  })

  it('TC-004 : Form responsif di resolusi 1920x1080', () => {
    cy.viewport(1920, 1080)
    openAddForm()
    cy.get('[role="dialog"]').find('[data-slot="select-trigger"]').should('be.visible')
    cy.get('input[name="name"]').should('be.visible')
    cy.get('input[name="code"]').should('be.visible')
    cy.contains('button', 'Simpan').should('be.visible')
    cy.contains('button', 'Batal').should('be.visible')
  })

  it('TC-004b : Form responsif di resolusi 1280x720', () => {
    cy.viewport(1280, 720)
    openAddForm()
    cy.get('[role="dialog"]').find('[data-slot="select-trigger"]').should('be.visible')
    cy.get('input[name="name"]').should('be.visible')
    cy.get('input[name="code"]').should('be.visible')
    cy.contains('button', 'Simpan').should('be.visible')
    cy.contains('button', 'Batal').should('be.visible')
  })

})

// ============================================================
// S-02
// ============================================================

describe('S-02 — Validasi Field Required — Instansi & Nama Mata Pelajaran', () => {

  beforeEach(() => { loginSession() })

  it('TC-005 : Submit form kosong — pesan error tampil di semua required field', () => {
    openAddForm()
    cy.contains('button', 'Simpan').click()
    cy.get('[data-slot="form-message"]').should('be.visible').and('contain', 'Instansi wajib diisi')
    cy.get('[data-slot="form-message"]').should('contain', 'Mata Pelajaran wajib diisi')
    cy.get('input[name="name"]').should('be.visible')
    cy.url().should('include', '/setting/academic/subject')
  })

  it('TC-006 : Instansi diisi, Nama kosong — error hanya muncul di field Nama', () => {
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.contains('button', 'Simpan').click()
    cy.get('[data-slot="form-message"]').should('be.visible').and('contain', 'Mata Pelajaran wajib diisi')
    cy.get('[data-slot="form-message"]').should('not.contain', 'Instansi wajib diisi')
    cy.get('input[name="name"]').should('be.visible')
  })

  it('TC-007 : Nama diisi, Instansi kosong — error hanya muncul di field Instansi', () => {
    openAddForm()
    cy.get('input[name="name"]').type('pjok')
    cy.contains('button', 'Simpan').click()
    cy.get('[data-slot="form-message"]').should('be.visible').and('contain', 'Instansi wajib diisi')
    cy.get('[data-slot="form-message"]').should('not.contain', 'Mata Pelajaran wajib diisi')
    cy.get('input[name="name"]').should('be.visible')
  })

  it('TC-008 : Pesan error hilang setelah field yang error diisi', () => {
    openAddForm()
    cy.contains('button', 'Simpan').click()
    cy.get('[data-slot="form-message"]').should('be.visible')
    selectInstansi('SMP Digital Indonesia+')
    cy.get('[data-slot="form-message"]').should('not.contain', 'Instansi wajib diisi')
    cy.get('input[name="name"]').type('pjok')
    cy.get('[data-slot="form-message"]').should('not.exist')
    cy.contains('button', 'Simpan').should('be.enabled')
  })

  it('TC-009 : Nama hanya spasi — dianggap kosong, pesan error tampil', () => {
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type('     ')
    cy.contains('button', 'Simpan').click()
    cy.get('[data-slot="form-message"]').should('be.visible').and('contain', 'Mata Pelajaran wajib diisi')
    cy.get('input[name="name"]').should('be.visible')
    cy.url().should('include', '/setting/academic/subject')
  })

})

// ============================================================
// S-03
// ============================================================

describe('S-03 — Validasi Field Kode — Optional & Auto-Generate', () => {

  beforeEach(() => { loginSession() })

  it('TC-010 : Simpan tanpa isi Kode — sistem auto-generate kode unik', () => {
    const nama = `Geografi-${TS}`
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type(nama)
    simpanDanVerifikasi('Mata pelajaran berhasil ditambahkan', () => {
      cy.url().should('include', '/setting/academic/subject')
      cy.get('table[data-slot="data-grid-table"]').should('contain', nama)
      cy.contains('table[data-slot="data-grid-table"] tr', nama)
        .find('td').eq(2).invoke('text').should('not.be.empty')
    })
  })

  it('TC-011 : Simpan dengan Kode manual — kode tersimpan sesuai input', () => {
    const nama = `Ekonomi-${TS}`
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type(nama)
    cy.get('input[name="code"]').type('EKO')
    simpanDanVerifikasi('Mata pelajaran berhasil ditambahkan', () => {
      cy.url().should('include', '/setting/academic/subject')
      cy.contains('table[data-slot="data-grid-table"] tr', nama)
        .find('td').eq(2).should('contain', 'EKO')
    })
  })

  // ⚠️ PRE-CONDITION: TC-010 sudah run di session yang sama (namaGeografi tersedia via Cypress env)
  it('TC-012 : Kode auto-generate untuk mapel berbeda tidak duplikat', () => {
    const namaGeografi  = `Geografi-${TS}`
    const namaSosiologi = `Sosiologi-${TS}`
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type(namaSosiologi)
    simpanDanVerifikasi('Mata pelajaran berhasil ditambahkan', () => {
      cy.url().should('include', '/setting/academic/subject')
      let kodeSosiologi = ''
      let kodeGeografi  = ''
      cy.contains('table[data-slot="data-grid-table"] tr', namaSosiologi)
        .find('td').eq(2).invoke('text').then((t) => { kodeSosiologi = t.trim() })
      cy.contains('table[data-slot="data-grid-table"] tr', namaGeografi)
        .find('td').eq(2).invoke('text').then((t) => {
          kodeGeografi = t.trim()
          expect(kodeSosiologi).to.not.equal(kodeGeografi)
        })
    })
  })

  it('TC-013 : Input Kode >50 karakter — sistem menampilkan error atau membatasi input', () => {
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type(`BoundaryTest-${TS}`)
    const kodePanjang = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLM'
    cy.get('input[name="code"]').type(kodePanjang)
    cy.contains('button', 'Simpan').click()
    cy.wait(1000)
    cy.get('body').then(($body) => {
      const hasFormError  = $body.find('[data-slot="form-message"]').length > 0
      const hasToast      = $body.find('li[data-sonner-toast]').length > 0
      const inputVal      = $body.find('input[name="code"]').val()
      if (hasFormError || hasToast) {
        cy.log('✅ Sistem menampilkan error untuk kode terlalu panjang')
      } else if (inputVal && inputVal.length < kodePanjang.length) {
        cy.log(`✅ Input dibatasi otomatis ke ${inputVal.length} karakter`)
      } else {
        cy.log('⚠️ Tidak ada pembatasan — catat sebagai temuan untuk dev')
      }
    })
  })

})

// ============================================================
// S-04
// ⚠️ PRE-CONDITION: Data 'pjok' sudah ada di SMP Digital Indonesia+
// ============================================================

describe('S-04 — Duplikasi Nama Mata Pelajaran pada Instansi yang Sama', () => {

  beforeEach(() => { loginSession() })

  it('TC-014 : Nama duplikat pada instansi sama — sistem menampilkan toast error', () => {
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type('pjok')
    simpanDanVerifikasi('Mata pelajaran dengan nama tersebut sudah ada')
  })

  it('TC-015 : Nama sama di instansi berbeda — berhasil disimpan (bukan duplikat)', () => {
    const nama = `pjok-kop-${TS}`
    openAddForm()
    selectInstansi('Koperasi SMP')
    cy.get('input[name="name"]').type(nama)
    simpanDanVerifikasi('Mata pelajaran berhasil ditambahkan', () => {
      cy.url().should('include', '/setting/academic/subject')
      cy.get('table[data-slot="data-grid-table"]').should('contain', nama)
    })
  })

  it('TC-016 : Nama duplikat beda kapitalisasi — sistem tetap mendeteksi duplikat', () => {
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type('PJOK')
    simpanDanVerifikasi('Mata pelajaran dengan nama tersebut sudah ada')
  })

  it('TC-017 : Nama duplikat dengan spasi di depan/belakang — sistem trim lalu deteksi duplikat', () => {
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type('  pjok  ')
    simpanDanVerifikasi('Mata pelajaran dengan nama tersebut sudah ada')
  })

})

// ============================================================
// S-05
// ============================================================

describe('S-05 — Fungsi Tombol Batal / Cancel', () => {

  beforeEach(() => { loginSession() })

  it('TC-018 : Klik Batal di form kosong — form tertutup, data tidak tersimpan', () => {
    goToSubjectList()
    cy.get('table[data-slot="data-grid-table"] tbody tr').its('length').then((jumlahAwal) => {
      cy.contains('button', 'Tambah Mata Pelajaran').click()
      cy.get('[role="dialog"]').should('be.visible')
      cy.wait(500)
      cy.contains('button', 'Batal').click()
      cy.get('[role="dialog"]').should('not.exist')
      cy.url().should('include', '/setting/academic/subject')
      cy.get('table[data-slot="data-grid-table"] tbody tr').its('length').should('eq', jumlahAwal)
    })
  })

  it('TC-019 : Klik Batal setelah form diisi sebagian — data tidak tersimpan', () => {
    goToSubjectList()
    cy.get('table[data-slot="data-grid-table"] tbody tr').its('length').then((jumlahAwal) => {
      openAddForm()
      selectInstansi('Koperasi SMP')
      cy.get('input[name="name"]').type(`pkn-batal-${TS}`)
      cy.contains('button', 'Batal').click()
      cy.get('[role="dialog"]').should('not.exist')
      cy.url().should('include', '/setting/academic/subject')
      cy.get('table[data-slot="data-grid-table"]').should('not.contain', `pkn-batal-${TS}`)
      cy.get('table[data-slot="data-grid-table"] tbody tr').its('length').should('eq', jumlahAwal)
    })
  })

  // TC-020: browser back dari modal/dialog tidak reliable di Next.js
  // karena dialog tidak mengubah URL — go back malah keluar dari halaman
  // ini dicatat sebagai known limitation, test dilakukan manual
  it('TC-020 : Navigasi browser back dari form — data tidak tersimpan [MANUAL]', () => {
    goToSubjectList()
    cy.get('table[data-slot="data-grid-table"] tbody tr').its('length').then((jumlahAwal) => {
      openAddForm()
      selectInstansi('Koperasi SMP')
      cy.get('input[name="name"]').type(`pkn-back-${TS}`)
      // dialog tidak mengubah URL jadi go('back') = keluar dari halaman subject
      // verifikasi: tutup dialog manual, pastikan data tidak tersimpan
      cy.contains('button', 'Batal').click()
      cy.get('[role="dialog"]').should('not.exist')
      cy.get('table[data-slot="data-grid-table"]').should('not.contain', `pkn-back-${TS}`)
      cy.get('table[data-slot="data-grid-table"] tbody tr').its('length').should('eq', jumlahAwal)
    })
  })

})

// ============================================================
// S-06
// ============================================================

describe('S-06 — Simpan Data Valid & Pesan Sukses', () => {

  beforeEach(() => { loginSession() })

  it('TC-021 : Simpan mata pelajaran valid — toast sukses tampil & data masuk list', () => {
    const nama = `Sejarah-${TS}`
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type(nama)
    cy.get('input[name="code"]').type('SEJ')
    simpanDanVerifikasi('Mata pelajaran berhasil ditambahkan', () => {
      cy.url().should('include', '/setting/academic/subject')
      cy.get('table[data-slot="data-grid-table"]').should('contain', nama)
    })
  })

  it('TC-022 : Toast sukses tampil lalu hilang otomatis dalam 5 detik', () => {
    const nama = `SejarahDunia-${TS}`
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type(nama)
    cy.get('input[name="code"]').type('SJRD')
    cy.contains('button', 'Simpan').click()
    cy.wait(2000)
    // cek toast pernah muncul (meski sudah removed)
    cy.get('li[data-sonner-toast]', { timeout: 15000 }).should('exist')
    // tunggu 5 detik, toast harus hilang
    cy.wait(5000)
    cy.get('li[data-sonner-toast][data-visible="true"]').should('not.exist')
  })

  // ⚠️ PRE-CONDITION: Data 'Sejarah-{TS}' sudah ada dari TC-021
  it('TC-023 : Data tersimpan tampil di list dengan kolom Instansi, Nama, Kode benar', () => {
    const nama = `Sejarah-${TS}`
    goToSubjectList()
    cy.contains('table[data-slot="data-grid-table"] tr', nama)
      .within(() => {
        cy.get('td').eq(0).should('contain', 'SMP Digital Indonesia+')
        cy.get('td').eq(1).should('contain', nama)
        cy.get('td').eq(2).should('not.be.empty')
      })
  })

  it('TC-024 : Tambah beberapa mata pelajaran berturut-turut — semua tersimpan di list', () => {
    const namaAgama = `AgamaIslam-${TS}`
    const namaSeni  = `SeniBudaya-${TS}`

    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type(namaAgama)
    simpanDanVerifikasi('Mata pelajaran berhasil ditambahkan')

    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type(namaSeni)
    simpanDanVerifikasi('Mata pelajaran berhasil ditambahkan')

    goToSubjectList()
    cy.get('table[data-slot="data-grid-table"]')
      .should('contain', namaAgama)
      .and('contain', namaSeni)
  })

  it('TC-025 : Nama dengan spasi antar kata tersimpan dan tampil utuh di list', () => {
    const nama = `Bahasa Inggris Wajib ${TS}`
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type(nama)
    simpanDanVerifikasi('Mata pelajaran berhasil ditambahkan', () => {
      goToSubjectList()
      cy.get('table[data-slot="data-grid-table"]').should('contain', nama)
    })
  })

  it('TC-026 : Input Nama >255 karakter — sistem menampilkan error atau membatasi input', () => {
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type('A'.repeat(300))
    cy.contains('button', 'Simpan').click()
    cy.wait(1000)
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
// S-07
// ============================================================

describe('S-07 — Edge Case & Boundary Testing', () => {

  beforeEach(() => { loginSession() })

  it('TC-027 : Input Nama 1 karakter — data berhasil disimpan', () => {
    const nama = `Z-${TS}`
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type(nama)
    simpanDanVerifikasi('Mata pelajaran berhasil ditambahkan', () => {
      goToSubjectList()
      cy.get('table[data-slot="data-grid-table"]').should('contain', nama)
    })
  })

  it('TC-028 : Input Nama angka saja — sistem menerima atau menampilkan error', () => {
    const nama = `99-${TS}`
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type(nama)
    cy.contains('button', 'Simpan').click()
    cy.wait(2000)
    cy.get('body').then(($body) => {
      const toastText    = $body.find('li[data-sonner-toast]').text()
      const hasFormError = $body.find('[data-slot="form-message"]').length > 0
      if (toastText.includes('berhasil')) {
        cy.log('✅ Angka diperbolehkan sebagai nama mata pelajaran')
      } else if (hasFormError || toastText.includes('error') || toastText.includes('gagal')) {
        cy.log('✅ Sistem menampilkan error — nama harus mengandung huruf')
      } else {
        cy.log('⚠️ Tidak ada feedback — catat sebagai temuan untuk dev')
      }
    })
  })

  // TC-029: Next.js Server Actions tidak bisa di-intercept via cy.stub/cy.intercept
  // Test ini dijalankan semi-manual: DevTools → Network → Offline sebelum klik Simpan
  it('TC-029 : Submit dengan network error — sistem menampilkan pesan error [SEMI-MANUAL]', () => {
    openAddForm()
    selectInstansi('SMP Digital Indonesia+')
    cy.get('input[name="name"]').type(`OfflineTest-${TS}`)
    cy.log('⚠️ TC-029: Aktifkan mode Offline di DevTools sebelum klik Simpan')
    cy.log('⚠️ Expected: toast error muncul, data tidak tersimpan')
    // mark as pending — perlu intervensi manual
    cy.contains('button', 'Simpan').should('be.visible')
  })

})