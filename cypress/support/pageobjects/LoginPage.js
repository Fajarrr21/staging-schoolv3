// Endpoint login — terverifikasi, sudah dipakai spec tingkat & tahun ajaran
// (`cy.intercept('POST', '**/api/auth/login')`). Juga ada di fixture: login.json -> api.login
const API_LOGIN = '**/api/auth/login';
const DASHBOARD_PATH = '/dashboard';

class LoginPage {
  elements = {
    emailInput: () => cy.get('input[name="email"]'),
    passwordInput: () => cy.get('input[type="password"]'),
    submitBtn: () => cy.get('button[type="submit"]'),
    forgotLink: () => cy.contains('Lupa'),
    logo: () => cy.get('img').first(),
    formMessage: () => cy.get('[data-slot="form-message"]'),
    errorToast: () => cy.get('[data-sonner-toast][data-type="error"]'),
    userAvatar: () => cy.get('img[alt="User Avatar"]', { timeout: 10000 }),
    avatarRounded: () => cy.get('img[data-nimg="1"][class*="rounded-full"]', { timeout: 10000 }),
    container: () => cy.get('[data-slot="container"]'),
    form: () => cy.get('form'),
  };

  visit(baseUrl, loginPath) {
    cy.visit(`${baseUrl}${loginPath}`);
    return this;
  }

  visitRoot(baseUrl) {
    cy.visit(`${baseUrl}/`);
    return this;
  }

  fillEmail(email) {
    this.elements.emailInput().clear().type(email);
    return this;
  }

  fillPassword(password) {
    this.elements.passwordInput().clear().type(password);
    return this;
  }

  clickSubmit() {
    this.elements.submitBtn().click();
    return this;
  }

  submitForm() {
    this.elements.form().submit();
    return this;
  }

  clickForgotPassword() {
    this.elements.forgotLink().click();
    return this;
  }

  login(email, password, method = 'click') {
    if (email) this.fillEmail(email);
    if (password) this.fillPassword(password);
    return method === 'submit' ? this.submitForm() : this.clickSubmit();
  }

  clearSession() {
    cy.clearCookies();
    cy.clearLocalStorage();
    return this;
  }

  /**
   * Login via cy.session dengan URL-based validation (lebih reliable).
   * Gak depend pada userAvatar selector yang bisa berubah.
   *
   * FIX-002 — ada opsi `validate()`. Tanpa ini, sesi yang tokennya sudah mati tetap
   *   dipulihkan dari cache dan spec gagal dengan error selector yang menyesatkan.
   *   Validasinya lewat URL: kalau sesi mati, app melempar balik ke halaman login.
   *   (Jangan tiru qa-cazh yang cuma cek body tidak memuat teks tertentu — halaman
   *   login juga tidak memuat teks itu, jadi validasinya bocor.)
   *
   * FIX-003 — `cy.wait(1000)` diganti `cy.wait('@loginAPI')`. Sekarang yang ditunggu
   *   response login yang sebenarnya, bukan jeda tebakan. Pola ini diangkat dari spec
   *   tingkat & tahun ajaran yang sudah memakainya inline.
   *
   * @param {object} opts - { redirect, dashboard, apiLogin } — semua opsional
   */
  loginViaSession(email, password, baseUrl, loginPath, opts = {}) {
    const redirect = opts.redirect || 15000;
    const dashboard = opts.dashboard || DASHBOARD_PATH;
    const apiLogin = opts.apiLogin || API_LOGIN;

    // ENVIRONMENT SWITCH — kalau run dijalankan dengan environment tertentu
    // (--env environment=staging / CYPRESS_ENV=staging), cypress.config.js sudah
    // menaruh URL + kredensial env itu ke Cypress.env. Nilai itu MENANG atas
    // argumen fixture (yang default production). Inilah yang bikin satu repo
    // melayani dua environment tanpa mengedit tiap spec/fixture.
    const environment = Cypress.env('environment') || 'production';
    const e = Cypress.env('appEmail') || email;
    const p = Cypress.env('appPassword') || password;
    const b = Cypress.env('appBase') || baseUrl;
    const l = Cypress.env('appLogin') || loginPath;

    cy.session(
      // Namespace per-env: sesi production & staging tidak boleh saling menimpa.
      `session-${environment}-${e}`,
      () => {
        cy.intercept('POST', apiLogin).as('loginAPI');
        cy.visit(`${b}${l}`);
        this.elements.emailInput().should('be.visible').clear().type(e);
        this.elements.passwordInput().should('be.visible').clear().type(p, { log: false });
        this.elements.submitBtn().should('be.enabled').click();

        cy.wait('@loginAPI', { timeout: redirect })
          .its('response.statusCode')
          .should('eq', 200);
        cy.url({ timeout: redirect }).should('not.include', l);
      },
      {
        validate() {
          cy.visit(`${b}${dashboard}`, { failOnStatusCode: false });
          cy.url({ timeout: redirect }).should('not.include', l);
        },
      },
    );
    return this;
  }

  assertOnLoginPage(loginPath) {
    cy.url().should('contain', loginPath);
    this.elements.emailInput().should('be.visible');
    return this;
  }

  assertLoggedIn() {
    cy.url().should('not.contain', 'callbackUrl');
    cy.url().should('not.contain', '/auth');
    return this;
  }

  assertErrorToast(message) {
    this.elements.errorToast().should('be.visible').and('contain', message);
    return this;
  }

  assertValidationMessage(message) {
    const chain = this.elements.formMessage().should('be.visible');
    if (message) chain.and('contain', message);
    return this;
  }
}

export default new LoginPage();