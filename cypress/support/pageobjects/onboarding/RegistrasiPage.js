// RegistrasiPage.js — POM Form Registrasi Onboarding Partner
// URL: https://staging.cards.co.id/daftar-akun
//
// Catatan strategi selector:
//   - App TIDAK pakai shadcn/Radix (no data-slot). Tailwind biasa + React.
//   - Pakai ID-based selectors (#reg-name, #reg-phone, #reg-email, #reg-pw) — paling stabil.
//   - Error state: input.aria-invalid="true" + class border-pink-400; pesan: p.text-pink-600
//   - Strength indicator: div.mt-2 dengan <span> text-{red-500|yellow-600|green-600}
//   - Loading state: text "Membuat akun..." + span.animate-spin
//
// Stop point happy flow: URL berubah ke /verifikasi-otp (TIDAK ada toast di halaman ini)
//
// PENTING — DOMAIN OVERRIDE:
//   cypress.config.js baseUrl = "https://staging-new-school.cazh.id" (untuk modul Pengaturan).
//   Onboarding domain BEDA: https://staging.cards.co.id.
//   Maka cy.visit() di POM ini WAJIB pakai FULL URL absolute (bukan relative path), agar tidak
//   ke-resolve ke baseUrl + path -> redirect ke /auth/login dari sistem internal cazh.

const BASE_URL = 'https://staging.cards.co.id';
const ROUTE = `${BASE_URL}/daftar-akun`;
const URL_MASUK = `${BASE_URL}/masuk`;
const URL_OTP = `${BASE_URL}/verifikasi-otp`;
const TIMEOUT = { pageLoad: 15000, validation: 2000, submit: 10000, redirect: 8000 };

class RegistrasiPage {
  elements = {
    h1: () => cy.get('h1').contains('Daftar'),
    nameInput: () => cy.get('#reg-name'),
    phoneInput: () => cy.get('#reg-phone'),
    emailInput: () => cy.get('#reg-email'),
    passwordInput: () => cy.get('#reg-pw'),
    submitBtn: () => cy.get('button[type="submit"]'),
    googleBtn: () => cy.get('button[title="Login Google segera hadir"]'),
    eyeToggle: () => cy.get('button[aria-label*="password"]').first(),
    subtitleLink: () => cy.get('a[href="/masuk"]'),
    spinner: () => cy.get('button[type="submit"] span.animate-spin'),
    strengthContainer: () => cy.get('p').contains('Kekuatan password:').parent(),
    helperTips: () => cy.contains('p', 'Tips: Password minimal 8 karakter'),

    // field-scoped error message (sibling of input wrapper)
    fieldErrorMsg: (inputSelector) =>
      cy.get(inputSelector).closest('div').parent().find('p.text-pink-600'),
  };

  visit() {
    cy.visit(ROUTE, { timeout: TIMEOUT.pageLoad });
    this.elements.h1().should('be.visible');
    return this;
  }

  // ---------- Form actions ----------
  fillName(value) {
    this.elements.nameInput().clear().type(value, { delay: 0 });
    return this;
  }

  fillPhone(value) {
    this.elements.phoneInput().clear().type(value, { delay: 0 });
    return this;
  }

  fillEmail(value) {
    this.elements.emailInput().clear().type(value, { delay: 0 });
    return this;
  }

  fillPassword(value) {
    this.elements.passwordInput().clear().type(value, { delay: 0 });
    return this;
  }

  fillAllValid({ name, phone, email, password }) {
    if (name !== undefined) this.fillName(name);
    if (phone !== undefined) this.fillPhone(phone);
    if (email !== undefined) this.fillEmail(email);
    if (password !== undefined) this.fillPassword(password);
    return this;
  }

  clickSubmit() {
    this.elements.submitBtn().click();
    return this;
  }

  clickEyeToggle() {
    this.elements.eyeToggle().click();
    return this;
  }

  clickMasukLink() {
    this.elements.subtitleLink().click();
    return this;
  }

  // Composite: full registration in one call
  register({ name, phone, email, password }) {
    this.fillAllValid({ name, phone, email, password });
    this.elements.submitBtn().should('not.be.disabled');
    this.clickSubmit();
    return this;
  }

  // Blur a field to trigger validation
  blur(inputSelector) {
    cy.get(inputSelector).blur();
    return this;
  }

  // ---------- Assertions: page state ----------
  assertOnDaftarAkun() {
    cy.url().should('include', '/daftar-akun');
    cy.url().should('include', 'staging.cards.co.id');
    return this;
  }

  assertH1Title(text = 'Daftar') {
    this.elements.h1().should('contain.text', text);
    return this;
  }

  assertSubtitleVisible() {
    cy.contains('Sudah punya akun?').should('be.visible');
    this.elements.subtitleLink().should('be.visible').and('contain.text', 'Masuk');
    return this;
  }

  assertAllFieldsEmpty() {
    this.elements.nameInput().should('have.value', '');
    this.elements.phoneInput().should('have.value', '');
    this.elements.emailInput().should('have.value', '');
    this.elements.passwordInput().should('have.value', '');
    return this;
  }

  // ---------- Assertions: button states ----------
  assertSubmitDisabled() {
    this.elements.submitBtn().should('be.disabled');
    return this;
  }

  assertSubmitEnabled() {
    this.elements.submitBtn().should('not.be.disabled');
    return this;
  }

  assertGoogleDisabled() {
    this.elements.googleBtn().should('be.disabled');
    return this;
  }

  assertGoogleTooltip(text = 'Login Google segera hadir') {
    this.elements.googleBtn().should('have.attr', 'title', text);
    return this;
  }

  assertGoogleVisible() {
    this.elements.googleBtn().should('be.visible').and('contain.text', 'Daftar dengan Google');
    return this;
  }

  // ---------- Assertions: field state ----------
  assertFieldValid(inputSelector) {
    cy.get(inputSelector).should('not.have.attr', 'aria-invalid', 'true');
    return this;
  }

  assertFieldInvalid(inputSelector) {
    cy.get(inputSelector, { timeout: TIMEOUT.validation })
      .should('have.attr', 'aria-invalid', 'true');
    return this;
  }

  assertFieldErrorMessage(inputSelector, message) {
    this.elements.fieldErrorMsg(inputSelector)
      .should('be.visible')
      .and('contain.text', message);
    return this;
  }

  assertNoFieldErrorMessage(inputSelector) {
    // p.text-pink-600 should NOT exist within field's wrapper
    cy.get(inputSelector).closest('div').parent().find('p.text-pink-600').should('not.exist');
    return this;
  }

  assertPasswordType(expected) {
    this.elements.passwordInput().should('have.attr', 'type', expected);
    return this;
  }

  // ---------- Assertions: password strength ----------
  // NOTE: assertion warna bersifat LENIENT — PRD eksplisit bilang Weak boleh "merah/orange".
  // Yang strict di-assert: label text + jumlah bar terisi. Warna di-log via cy.log untuk diagnosis.
  assertStrengthLemah() {
    this.elements.strengthContainer().within(() => {
      cy.get('span.font-semibold').should('contain.text', 'Lemah').then(($el) => {
        const cls = $el.attr('class') || '';
        cy.log(`Strength Lemah color: ${cls.match(/text-\S+/g)?.join(' ')}`);
        expect(cls, 'warna Lemah harus dalam range merah/orange (per PRD)').to.match(/text-(red|orange)-\d+/);
      });
      cy.get('span.h-1').then(($bars) => {
        // Bar 1 terisi (warna), 2 lainnya slate
        expect($bars[0].className, 'bar-1 harus terisi (red/orange)').to.match(/bg-(red|orange)-\d+/);
        expect($bars[1].className, 'bar-2 harus kosong (slate)').to.match(/bg-slate-200/);
        expect($bars[2].className, 'bar-3 harus kosong (slate)').to.match(/bg-slate-200/);
      });
    });
    return this;
  }

  assertStrengthSedang() {
    this.elements.strengthContainer().within(() => {
      cy.get('span.font-semibold').should('contain.text', 'Sedang').then(($el) => {
        const cls = $el.attr('class') || '';
        cy.log(`Strength Sedang color: ${cls.match(/text-\S+/g)?.join(' ')}`);
        expect(cls, 'warna Sedang harus kuning').to.match(/text-yellow-\d+/);
      });
      cy.get('span.h-1').then(($bars) => {
        expect($bars[0].className, 'bar-1 harus kuning').to.match(/bg-yellow-\d+/);
        expect($bars[1].className, 'bar-2 harus kuning').to.match(/bg-yellow-\d+/);
        expect($bars[2].className, 'bar-3 harus kosong (slate)').to.match(/bg-slate-200/);
      });
    });
    return this;
  }

  assertStrengthKuat() {
    this.elements.strengthContainer().within(() => {
      cy.get('span.font-semibold').should('contain.text', 'Kuat').then(($el) => {
        const cls = $el.attr('class') || '';
        cy.log(`Strength Kuat color: ${cls.match(/text-\S+/g)?.join(' ')}`);
        expect(cls, 'warna Kuat harus hijau').to.match(/text-green-\d+/);
      });
      cy.get('span.h-1').then(($bars) => {
        expect($bars[0].className, 'bar-1 harus hijau').to.match(/bg-green-\d+/);
        expect($bars[1].className, 'bar-2 harus hijau').to.match(/bg-green-\d+/);
        expect($bars[2].className, 'bar-3 harus hijau').to.match(/bg-green-\d+/);
      });
    });
    return this;
  }

  // ---------- Assertions: helper text ----------
  assertHelperTipsVisible() {
    this.elements.helperTips()
      .should('be.visible')
      .and('contain.text', 'Tips: Password minimal 8 karakter dengan huruf besar, kecil, dan angka.');
    return this;
  }

  // ---------- Assertions: submit loading ----------
  assertLoadingState() {
    this.elements.submitBtn().should('contain.text', 'Membuat akun...');
    this.elements.spinner().should('exist');
    return this;
  }

  // ---------- Assertions: redirect / navigation ----------
  assertRedirectOtp() {
    cy.url({ timeout: TIMEOUT.redirect })
      .should('include', 'staging.cards.co.id')
      .and('include', '/verifikasi-otp');
    return this;
  }

  assertNavigatedMasuk() {
    cy.url({ timeout: TIMEOUT.redirect })
      .should('include', 'staging.cards.co.id')
      .and('include', '/masuk');
    return this;
  }
}

export default new RegistrasiPage();
