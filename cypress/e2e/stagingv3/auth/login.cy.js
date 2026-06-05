import LoginPage from '../../../support/pageobjects/LoginPage'

describe('Login Cards School New - Fajar Ardiansyah', () => {
  let data

  before(() => {
    cy.fixture('login').then((fixtureData) => {
      data = fixtureData
    })
  })

  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    LoginPage.visit(data.urls.base, data.urls.login)
  })

  // =============================================
  // TS-LOGIN001 : Akses Halaman Login
  // =============================================

  it('TC-LOGIN001 : Halaman login berhasil dimuat', () => {
    cy.url().should('contain', data.urls.login)
    LoginPage.elements.emailInput().should('be.visible')
    LoginPage.elements.passwordInput().should('be.visible')
  })

  it('TC-LOGIN002 : Title halaman tidak kosong', () => {
    cy.title().should('not.be.empty')
  })

  it('TC-LOGIN003 : Akses landing tanpa login menampilkan halaman public', () => {
  LoginPage.visitRoot(data.urls.base)
  // Verify user belum login (avatar tidak muncul)
  cy.get('img[alt="User Avatar"]').should('not.exist')
})

  // =============================================
  // TS-LOGIN002 : Verifikasi UI
  // =============================================

  it('TC-LOGIN004 : Field email tampil dengan placeholder yang benar', () => {
    LoginPage.elements.emailInput()
      .should('be.visible')
      .should('have.attr', 'placeholder', data.labels.emailPlaceholder)
  })

  it('TC-LOGIN005 : Field password tampil dengan benar', () => {
    LoginPage.elements.passwordInput()
      .should('be.visible')
      .should('have.attr', 'type', 'password')
  })

  it('TC-LOGIN006 : Field password bertipe password (teks tersembunyi)', () => {
    LoginPage.fillPassword(data.credentials.valid.password)
    LoginPage.elements.passwordInput().should('have.attr', 'type', 'password')
  })

  it('TC-LOGIN007 : Tombol Masuk tampil dan aktif', () => {
    LoginPage.elements.submitBtn()
      .should('be.visible')
      .should('be.enabled')
      .should('contain', data.labels.submitButton)
  })

  it('TC-LOGIN008 : Link lupa password tampil', () => {
    LoginPage.elements.forgotLink().should('be.visible')
  })

  it('TC-LOGIN009 : Logo tampil di halaman login', () => {
    LoginPage.elements.logo().should('be.visible')
  })

  // =============================================
  // TS-LOGIN003 : Login Berhasil
  // =============================================

  it('TC-LOGIN010 : Login dengan email dan password valid berhasil', () => {
    LoginPage.login(data.credentials.valid.email, data.credentials.valid.password)
    LoginPage.elements.userAvatar().should('be.visible')
  })

  it('TC-LOGIN011 : Setelah login navbar dan avatar user tampil', () => {
    LoginPage.login(data.credentials.valid.email, data.credentials.valid.password)
    cy.url().should('not.contain', 'callbackUrl')
    LoginPage.elements.userAvatar().should('be.visible')
    LoginPage.elements.container().should('be.visible')
  })

  it('TC-LOGIN012 : Login menggunakan submit form (Enter) berhasil', () => {
    LoginPage.login(data.credentials.valid.email, data.credentials.valid.password, 'submit')
    cy.url().should('not.contain', 'callbackUrl')
    LoginPage.elements.userAvatar().should('be.visible')
  })

  it('TC-LOGIN013 : Response time login kurang dari 8 detik', () => {
    LoginPage.fillEmail(data.credentials.valid.email)
    LoginPage.fillPassword(data.credentials.valid.password)
    const start = Date.now()
    LoginPage.clickSubmit()
    LoginPage.elements.userAvatar().should('be.visible').then(() => {
      expect(Date.now() - start).to.be.lessThan(data.performance.maxLoginMs)
    })
  })

  // =============================================
  // TS-LOGIN004 : Login Gagal - Data Invalid
  // =============================================

  it('TC-LOGIN014 : Login dengan password salah menampilkan toast error', () => {
    LoginPage.login(data.credentials.wrongPassword.email, data.credentials.wrongPassword.password)
    LoginPage.assertErrorToast(data.messages.invalidCredentials)
    cy.url().should('contain', data.urls.login)
  })

  it('TC-LOGIN015 : Login dengan email tidak terdaftar menampilkan toast error', () => {
    LoginPage.login(data.credentials.unregisteredEmail.email, data.credentials.unregisteredEmail.password)
    LoginPage.assertErrorToast(data.messages.invalidCredentials)
    cy.url().should('contain', data.urls.login)
  })

  it('TC-LOGIN016 : Login dengan email dan password salah menampilkan toast error', () => {
    LoginPage.login(data.credentials.allWrong.email, data.credentials.allWrong.password)
    LoginPage.assertErrorToast(data.messages.invalidCredentials)
    cy.url().should('contain', data.urls.login)
  })

  it('TC-LOGIN017 : Login dengan format email tidak valid menampilkan validasi', () => {
    LoginPage.login(data.credentials.invalidFormat.email, data.credentials.invalidFormat.password)
    LoginPage.assertValidationMessage()
    cy.url().should('contain', data.urls.login)
  })

  it('TC-LOGIN018 : Login dengan karakter khusus menampilkan toast error', () => {
    LoginPage.login(data.credentials.specialChar.email, data.credentials.specialChar.password)
    cy.url().should('contain', data.urls.login)
  })

  it('TC-LOGIN019 : Login email lowercase berhasil (case insensitive)', () => {
    LoginPage.login(data.credentials.validLowercase.email, data.credentials.validLowercase.password)
    LoginPage.elements.avatarRounded().should('be.visible')
  })

  // =============================================
  // TS-LOGIN005 : Validasi Field Kosong
  // =============================================

  it('TC-LOGIN020 : Klik login tanpa isi email menampilkan pesan validasi', () => {
    LoginPage.fillPassword(data.credentials.valid.password)
    LoginPage.clickSubmit()
    LoginPage.assertValidationMessage(data.messages.emailRequired)
  })

  it('TC-LOGIN021 : Klik login tanpa isi password menampilkan pesan validasi', () => {
    LoginPage.fillEmail(data.credentials.valid.email)
    LoginPage.clickSubmit()
    LoginPage.assertValidationMessage()
  })

  it('TC-LOGIN022 : Klik login semua field kosong menampilkan pesan validasi', () => {
    LoginPage.clickSubmit()
    LoginPage.assertValidationMessage(data.messages.emailRequired)
  })

  // =============================================
  // TS-LOGIN006 : Lupa Password
  // =============================================

  it('TC-LOGIN023 : Klik lupa password redirect ke halaman reset', () => {
    LoginPage.clickForgotPassword()
    cy.url().should('contain', data.urls.forgotPassword)
    LoginPage.elements.emailInput().should('be.visible')
  })

  it('TC-LOGIN024 : Halaman reset password punya field email', () => {
    LoginPage.clickForgotPassword()
    LoginPage.elements.emailInput()
      .should('be.visible')
      .should('have.attr', 'placeholder')
  })

  // =============================================
  // TS-LOGIN007 : Session
  // =============================================

  it('TC-LOGIN025 : Setelah clear session avatar user hilang', () => {
  LoginPage.login(data.credentials.valid.email, data.credentials.valid.password)
  LoginPage.elements.avatarRounded().should('be.visible')

  LoginPage.clearSession()
  LoginPage.visitRoot(data.urls.base)
  cy.get('img[alt="User Avatar"]').should('not.exist')
})

  // =============================================
  // TS-LOGIN008 : Responsif
  // =============================================

  it('TC-LOGIN026 : Halaman login responsif di Mobile (375x812)', () => {
    const vp = data.viewports.mobile
    cy.viewport(vp.width, vp.height)
    LoginPage.visit(data.urls.base, data.urls.login)
    LoginPage.elements.emailInput().should('be.visible')
    LoginPage.elements.passwordInput().should('be.visible')
    LoginPage.elements.submitBtn().should('be.visible').should('contain', data.labels.submitButton)
  })

  it('TC-LOGIN027 : Halaman login responsif di Tablet (768x1024)', () => {
    const vp = data.viewports.tablet
    cy.viewport(vp.width, vp.height)
    LoginPage.visit(data.urls.base, data.urls.login)
    LoginPage.elements.emailInput().should('be.visible')
    LoginPage.elements.passwordInput().should('be.visible')
    LoginPage.elements.submitBtn().should('be.visible').should('contain', data.labels.submitButton)
  })

  it('TC-LOGIN028 : Halaman login responsif di Desktop (1280x800)', () => {
    const vp = data.viewports.desktop
    cy.viewport(vp.width, vp.height)
    LoginPage.visit(data.urls.base, data.urls.login)
    LoginPage.elements.emailInput().should('be.visible')
    LoginPage.elements.passwordInput().should('be.visible')
    LoginPage.elements.submitBtn().should('be.visible').should('contain', data.labels.submitButton)
  })

})