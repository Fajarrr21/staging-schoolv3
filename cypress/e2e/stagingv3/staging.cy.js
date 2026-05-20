describe('Login Cards School New - Fajar Ardiansyah', () => {

  const BASE_URL = 'https://staging-new-school.cazh.id'
  const LOGIN_URL = `${BASE_URL}/auth/login`
  const VALID_EMAIL = 'admin@cazh.id'
  const VALID_PASS = '@GrahaTimur2026'

  beforeEach(() => {
    cy.visit(LOGIN_URL)
  })

  // =============================================
  // TS-LOGIN001 : Akses Halaman Login
  // =============================================

  it('TC-LOGIN001 : Halaman login berhasil dimuat', () => {
    cy.url().should('contain', '/auth/login')
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
  })

  it('TC-LOGIN002 : Title halaman tidak kosong', () => {
    cy.title().should('not.be.empty')
  })

  it('TC-LOGIN003 : Akses dashboard tanpa login redirect ke halaman login', () => {
    cy.visit(`${BASE_URL}/`)
    cy.url().should('contain', '/auth/login')
    cy.get('input[name="email"]').should('be.visible')
  })

  // =============================================
  // TS-LOGIN002 : Verifikasi UI
  // =============================================

  it('TC-LOGIN004 : Field email tampil dengan placeholder yang benar', () => {
    cy.get('input[name="email"]')
      .should('be.visible')
      .should('have.attr', 'placeholder', 'Masukkan email')
  })

  it('TC-LOGIN005 : Field password tampil dengan benar', () => {
    cy.get('input[type="password"]')
      .should('be.visible')
      .should('have.attr', 'type', 'password')
  })

  it('TC-LOGIN006 : Field password bertipe password (teks tersembunyi)', () => {
    cy.get('input[type="password"]')
      .type(VALID_PASS)
      .should('have.attr', 'type', 'password')
  })

  it('TC-LOGIN007 : Tombol Masuk tampil dan aktif', () => {
    cy.get('button[type="submit"]')
      .should('be.visible')
      .should('be.enabled')
      .should('contain', 'Masuk')
  })

  it('TC-LOGIN008 : Link lupa password tampil', () => {
    cy.contains('Lupa').should('be.visible')
  })

  it('TC-LOGIN009 : Logo tampil di halaman login', () => {
    cy.get('img').first().should('be.visible')
  })

  // =============================================
  // TS-LOGIN003 : Login Berhasil
  // =============================================

  it('TC-LOGIN010 : Login dengan email dan password valid berhasil', () => {
  cy.get('input[name="email"]').type(VALID_EMAIL)
  cy.get('input[type="password"]').type(VALID_PASS)
  cy.get('button[type="submit"]').click()
  cy.get('img[alt="User Avatar"]', { timeout: 10000 }).should('be.visible')
})

  it('TC-LOGIN011 : Setelah login navbar dan avatar user tampil', () => {
    cy.get('input[name="email"]').type(VALID_EMAIL)
    cy.get('input[type="password"]').type(VALID_PASS)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.contain', 'callbackUrl')
    cy.get('img[alt="User Avatar"]').should('be.visible')
    cy.get('[data-slot="container"]').should('be.visible')
  })

  it('TC-LOGIN012 : Login menggunakan submit form (Enter) berhasil', () => {
    cy.get('input[name="email"]').type(VALID_EMAIL)
    cy.get('input[type="password"]').type(VALID_PASS)
    cy.get('form').submit()
    cy.url().should('not.contain', 'callbackUrl')
    cy.get('img[alt="User Avatar"]').should('be.visible')
  })

  it('TC-LOGIN013 : Response time login kurang dari 5 detik', () => {
    cy.get('input[name="email"]').type(VALID_EMAIL)
    cy.get('input[type="password"]').type(VALID_PASS)
    const start = Date.now()
    cy.get('button[type="submit"]').click()
    cy.get('img[alt="User Avatar"]').should('be.visible').then(() => {
      expect(Date.now() - start).to.be.lessThan(5000)
    })
  })

  // =============================================
  // TS-LOGIN004 : Login Gagal - Data Invalid
  // =============================================

  it('TC-LOGIN014 : Login dengan password salah menampilkan toast error', () => {
    cy.get('input[name="email"]').type(VALID_EMAIL)
    cy.get('input[type="password"]').type('passwordsalah123')
    cy.get('button[type="submit"]').click()
    cy.get('[data-sonner-toast][data-type="error"]')
      .should('be.visible')
      .should('contain', 'Identitas tersebut tidak cocok dengan data kami')
    cy.url().should('contain', '/auth/login')
  })

  it('TC-LOGIN015 : Login dengan email tidak terdaftar menampilkan toast error', () => {
    cy.get('input[name="email"]').type('tidakterdaftar@email.com')
    cy.get('input[type="password"]').type(VALID_PASS)
    cy.get('button[type="submit"]').click()
    cy.get('[data-sonner-toast][data-type="error"]')
      .should('be.visible')
      .should('contain', 'Identitas tersebut tidak cocok dengan data kami')
    cy.url().should('contain', '/auth/login')
  })

  it('TC-LOGIN016 : Login dengan email dan password salah menampilkan toast error', () => {
    cy.get('input[name="email"]').type('salah@email.com')
    cy.get('input[type="password"]').type('passwordsalah')
    cy.get('button[type="submit"]').click()
    cy.get('[data-sonner-toast][data-type="error"]')
      .should('be.visible')
      .should('contain', 'Identitas tersebut tidak cocok dengan data kami')
    cy.url().should('contain', '/auth/login')
  })

  it('TC-LOGIN017 : Login dengan format email tidak valid menampilkan validasi', () => {
    cy.get('input[name="email"]').type('admincazh')
    cy.get('input[type="password"]').type(VALID_PASS)
    cy.get('button[type="submit"]').click()
    cy.get('[data-slot="form-message"]')
      .should('be.visible')
    cy.url().should('contain', '/auth/login')
  })

  it('TC-LOGIN018 : Login dengan karakter khusus menampilkan toast error', () => {
    cy.get('input[name="email"]').type('@@##$$%%')
    cy.get('input[type="password"]').type('@@##$$%%')
    cy.get('button[type="submit"]').click()
    cy.url().should('contain', '/auth/login')
  })

  it('TC-LOGIN019 : Login email lowercase berhasil (case insensitive)', () => {
  cy.get('input[name="email"]').type('admin@cazh.id')
  cy.get('input[type="password"]').type(VALID_PASS)
  cy.get('button[type="submit"]').click()
  cy.get('img[data-nimg="1"][class*="rounded-full"]', { timeout: 10000 }).should('be.visible')
})

  // =============================================
  // TS-LOGIN005 : Validasi Field Kosong
  // =============================================

  it('TC-LOGIN020 : Klik login tanpa isi email menampilkan pesan validasi', () => {
    cy.get('input[type="password"]').type(VALID_PASS)
    cy.get('button[type="submit"]').click()
    cy.get('[data-slot="form-message"]')
      .should('be.visible')
      .should('contain', 'Email wajib diisi')
  })

  it('TC-LOGIN021 : Klik login tanpa isi password menampilkan pesan validasi', () => {
    cy.get('input[name="email"]').type(VALID_EMAIL)
    cy.get('button[type="submit"]').click()
    cy.get('[data-slot="form-message"]')
      .should('be.visible')
  })

  it('TC-LOGIN022 : Klik login semua field kosong menampilkan pesan validasi', () => {
    cy.get('button[type="submit"]').click()
    cy.get('[data-slot="form-message"]')
      .should('be.visible')
      .should('contain', 'Email wajib diisi')
  })

  // =============================================
  // TS-LOGIN006 : Lupa Password
  // =============================================

  it('TC-LOGIN023 : Klik lupa password redirect ke halaman reset', () => {
  cy.contains('Lupa').click()
  cy.url().should('contain', '/forgot-password')
  cy.get('input[name="email"]').should('be.visible')
})

  it('TC-LOGIN024 : Halaman reset password punya field email', () => {
    cy.contains('Lupa').click()
    cy.get('input[name="email"]')
      .should('be.visible')
      .should('have.attr', 'placeholder')
  })

  // =============================================
  // TS-LOGIN007 : Session
  // =============================================

  it('TC-LOGIN025 : Setelah clear session tidak bisa akses dashboard', () => {
  cy.get('input[name="email"]').type(VALID_EMAIL)
  cy.get('input[type="password"]').type(VALID_PASS)
  cy.get('button[type="submit"]').click()
  cy.get('img[data-nimg="1"][class*="rounded-full"]', { timeout: 10000 }).should('be.visible')

  cy.clearCookies()
  cy.clearLocalStorage()

  cy.visit(`${BASE_URL}/`)
  cy.url().should('contain', '/auth/login')
  cy.get('input[name="email"]').should('be.visible')
})

  // =============================================
  // TS-LOGIN008 : Responsif
  // =============================================

  it('TC-LOGIN026 : Halaman login responsif di Mobile (375x812)', () => {
    cy.viewport(375, 812)
    cy.visit(LOGIN_URL)
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible').should('contain', 'Masuk')
  })

  it('TC-LOGIN027 : Halaman login responsif di Tablet (768x1024)', () => {
    cy.viewport(768, 1024)
    cy.visit(LOGIN_URL)
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible').should('contain', 'Masuk')
  })

  it('TC-LOGIN028 : Halaman login responsif di Desktop (1280x800)', () => {
    cy.viewport(1280, 800)
    cy.visit(LOGIN_URL)
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible').should('contain', 'Masuk')
  })

})