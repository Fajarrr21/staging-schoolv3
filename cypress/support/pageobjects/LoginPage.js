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

  loginViaSession(email, password, baseUrl, loginPath) {
    cy.session(`session-${email}`, () => {
      cy.visit(`${baseUrl}${loginPath}`);
      this.elements.emailInput().type(email);
      this.elements.passwordInput().type(password);
      this.elements.submitBtn().click();
      this.elements.userAvatar().should('be.visible');
    });
    return this;
  }

  assertOnLoginPage(loginPath) {
    cy.url().should('contain', loginPath);
    this.elements.emailInput().should('be.visible');
    return this;
  }

  assertLoggedIn() {
    cy.url().should('not.contain', 'callbackUrl');
    this.elements.userAvatar().should('be.visible');
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