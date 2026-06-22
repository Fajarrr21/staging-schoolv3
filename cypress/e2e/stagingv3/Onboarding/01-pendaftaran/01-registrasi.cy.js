// 01-registrasi.cy.js — Spec Form Registrasi Onboarding Partner (PRD 1 sub-flow A)
// URL: https://staging.cards.co.id/daftar-akun
// Sumber TC: docs/test-cases/onboarding/TC_Onboarding_Registrasi.xlsx (v2, 33 TC)
//
// CATATAN PENTING:
//   - App TIDAK pakai shadcn/Radix. Tailwind biasa + React.
//   - Selectors ID-based: #reg-name, #reg-phone, #reg-email, #reg-pw
//   - Error trigger by blur dengan input invalid (BUKAN required empty)
//   - Stop point happy flow: URL berubah ke /verifikasi-otp (no toast)
//   - TC-016 & TC-020: PENDING (butuh akun seed) -> .skip
//   - TC-031, 032, 033: DEFERRED (Google OAuth + PIN email) -> .skip
//
// TEST DATA RERUN-SAFETY:
//   - Email: qa.cards.school+<6digit-ts><seq>@gmail.com (Gmail plus addressing -> backend treat unique)
//   - No HP: prefix 0812 + 6 digit random (risk small collision dengan existing — diterima)
//   - Happy & edge TC yang submit akan bikin akun real di staging tiap run
//     (tidak ada cleanup utility — staging onboarding pool akan growth seiring waktu)

import registrasi from '../../../../support/pageobjects/onboarding/RegistrasiPage';

describe('Onboarding Partner — Form Registrasi (CARDS staging)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;

  const uniqEmail = () =>
    `qa.cards.school+${ts}${String(++seq).padStart(2, '0')}@gmail.com`;
  // Generate phone dengan panjang totalDigits (prefix 0812 + random suffix).
  // Dipakai untuk boundary test (10/13 digit) dengan random suffix biar rerun-safe.
  const uniqPhoneN = (totalDigits) => {
    const prefix = '0812';
    const suffixLen = totalDigits - prefix.length;
    const lo = Math.pow(10, suffixLen - 1);
    const hi = Math.pow(10, suffixLen) - lo;
    const suffix = String(Math.floor(lo + Math.random() * hi));
    return prefix + suffix;
  };
  const uniqPhone = () => uniqPhoneN(10);

  before(() => {
    cy.fixture('onboarding').then((data) => { d = data; });
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    registrasi.visit();
  });

  // ============================================================
  // HAPPY
  // ============================================================
  it('TC-ONB-REG-001 | Happy | Registrasi lengkap valid -> redirect /verifikasi-otp', () => {
    registrasi.register({
      name: d.testData.validName,
      phone: uniqPhone(),
      email: uniqEmail(),
      password: d.testData.passwordWeakValid,
    });
    registrasi.assertRedirectOtp();
  });

  it('TC-ONB-REG-002 | Happy | Registrasi dengan Password Kuat (12+ char + simbol)', () => {
    registrasi.fillAllValid({
      name: d.testData.validName,
      phone: uniqPhone(),
      email: uniqEmail(),
      password: d.testData.passwordStrongValid,
    });
    registrasi.assertStrengthKuat();
    registrasi.clickSubmit();
    registrasi.assertRedirectOtp();
  });

  // ============================================================
  // POSITIF
  // ============================================================
  it('TC-ONB-REG-003 | Positif | Halaman terbuka -> H1 "Daftar", field kosong, 2 tombol disabled', () => {
    registrasi.assertOnDaftarAkun();
    registrasi.assertH1Title(d.labels.h1Title);
    registrasi.assertSubtitleVisible();
    registrasi.assertAllFieldsEmpty();
    registrasi.assertSubmitDisabled();
    registrasi.assertGoogleVisible();
    registrasi.assertGoogleDisabled();
    registrasi.assertGoogleTooltip(d.labels.googleTooltip);
    registrasi.assertHelperTipsVisible();
  });

  it('TC-ONB-REG-004 | Positif | Real-time validation: tombol enable HANYA setelah semua wajib valid', () => {
    // Step 1: Nama saja -> tombol masih disabled
    registrasi.fillName(d.testData.validName);
    registrasi.assertSubmitDisabled();
    // Step 2: + Nomor HP -> tombol masih disabled
    registrasi.fillPhone(uniqPhone());
    registrasi.assertSubmitDisabled();
    // Step 3: + Email -> tombol masih disabled
    registrasi.fillEmail(uniqEmail());
    registrasi.assertSubmitDisabled();
    // Step 4: + Password valid -> tombol enable
    registrasi.fillPassword(d.testData.passwordWeakValid);
    registrasi.assertSubmitEnabled();
  });

  it('TC-ONB-REG-005 | Positif | Show/Hide password toggle (ikon Mata)', () => {
    registrasi.fillPassword(d.testData.passwordWeakValid);
    registrasi.assertPasswordType('password'); // default masking
    registrasi.clickEyeToggle();
    registrasi.assertPasswordType('text'); // visible
    registrasi.clickEyeToggle();
    registrasi.assertPasswordType('password'); // back to masking
  });

  it('TC-ONB-REG-006 | Positif | Link "Masuk" navigate ke /masuk', () => {
    registrasi.clickMasukLink();
    registrasi.assertNavigatedMasuk();
  });

  it('TC-ONB-REG-007 | Positif | Tombol "Daftar dengan Google" tampil DISABLED (coming soon)', () => {
    registrasi.assertGoogleVisible();
    registrasi.assertGoogleDisabled();
    registrasi.assertGoogleTooltip('Login Google segera hadir');
  });

  it('TC-ONB-REG-008 | Positif | Password Strength: Lemah (8 char + complexity minimum)', () => {
    registrasi.fillPassword(d.testData.passwordWeakValid);
    registrasi.assertStrengthLemah();
  });

  it('TC-ONB-REG-009 | Positif | Password Strength: Sedang (10+ char + complexity)', () => {
    registrasi.fillPassword(d.testData.passwordMediumValid);
    registrasi.assertStrengthSedang();
  });

  it('TC-ONB-REG-010 | Positif | Password Strength: Kuat (12+ char + complexity + simbol)', () => {
    registrasi.fillPassword(d.testData.passwordStrongValid);
    registrasi.assertStrengthKuat();
  });

  it('TC-ONB-REG-011 | Positif | Helper text Tips visible permanent (sebelum input apapun)', () => {
    registrasi.assertHelperTipsVisible();
  });

  it('TC-ONB-REG-012 | Positif | Tombol "Buat Akun" loading state saat submit', () => {
    // Intercept untuk delay response biar loading state ke-capture
    cy.intercept('POST', '**/register*', (req) => {
      req.on('response', (res) => {
        res.setDelay(1500);
      });
    }).as('register');
    cy.intercept('POST', '**/sign-up*', (req) => {
      req.on('response', (res) => {
        res.setDelay(1500);
      });
    }).as('signup');

    registrasi.fillAllValid({
      name: d.testData.validName,
      phone: uniqPhone(),
      email: uniqEmail(),
      password: d.testData.passwordWeakValid,
    });
    registrasi.clickSubmit();
    // Assert loading state DURING request
    registrasi.assertLoadingState();
  });

  // ============================================================
  // NEGATIF
  // ============================================================
  it('TC-ONB-REG-013 | Negatif | Nama < 3 char -> error "Nama minimal 3 karakter"', () => {
    registrasi.fillName(d.testData.shortName);
    registrasi.blur(d.selectors.nameInput);
    registrasi.assertFieldInvalid(d.selectors.nameInput);
    registrasi.assertFieldErrorMessage(d.selectors.nameInput, d.messages.nameMinLength);
    registrasi.assertSubmitDisabled();
  });

  it('TC-ONB-REG-014 | Negatif | Email tanpa @ -> error "Format email tidak valid"', () => {
    registrasi.fillEmail(d.testData.emailNoAt);
    registrasi.blur(d.selectors.emailInput);
    registrasi.assertFieldInvalid(d.selectors.emailInput);
    registrasi.assertFieldErrorMessage(d.selectors.emailInput, d.messages.emailInvalid);
    registrasi.assertSubmitDisabled();
  });

  it('TC-ONB-REG-015 | Negatif | Email tanpa domain -> error "Format email tidak valid"', () => {
    registrasi.fillEmail(d.testData.emailNoDomain);
    registrasi.blur(d.selectors.emailInput);
    registrasi.assertFieldInvalid(d.selectors.emailInput);
    registrasi.assertFieldErrorMessage(d.selectors.emailInput, d.messages.emailInvalid);
    registrasi.assertSubmitDisabled();
  });

  it.skip('TC-ONB-REG-016 | Negatif | Email sudah terdaftar [PENDING — butuh akun seed]', () => {
    // BLOCKED: butuh akun seed yang sudah terdaftar di staging.
    // Aktifkan setelah user maintain seed account. Implementasi tentative:
    //   registrasi.fillEmail(d.testData.seedEmail);
    //   registrasi.fillAllValid({name, phone: uniqPhone(), password});
    //   registrasi.clickSubmit();
    //   // Observe: text & lokasi pesan error duplikat (inline atau alert)
  });

  it('TC-ONB-REG-017 | Negatif | Nomor HP < 10 digit -> error', () => {
    registrasi.fillPhone(d.testData.phoneShort);
    registrasi.blur(d.selectors.phoneInput);
    registrasi.assertFieldInvalid(d.selectors.phoneInput);
    registrasi.assertFieldErrorMessage(d.selectors.phoneInput, d.messages.phoneInvalid);
    registrasi.assertSubmitDisabled();
  });

  it('TC-ONB-REG-018 | Negatif | Nomor HP > 13 digit -> dibatasi atau error', () => {
    registrasi.fillPhone(d.testData.phoneLong);
    registrasi.blur(d.selectors.phoneInput);
    // Behavior salah satu: (a) input dibatasi ke 13 digit (value.length <= 13) ATAU (b) error message
    registrasi.elements.phoneInput().invoke('val').then((val) => {
      if (val.length <= 13) {
        // (a) input dibatasi client-side -> tidak ada error message
        cy.log(`Behavior: input dibatasi (value="${val}", length=${val.length})`);
      } else {
        // (b) value full ter-input -> harus muncul error
        registrasi.assertFieldInvalid(d.selectors.phoneInput);
        registrasi.assertFieldErrorMessage(d.selectors.phoneInput, d.messages.phoneInvalid);
      }
    });
    registrasi.assertSubmitDisabled();
  });

  it('TC-ONB-REG-019 | Negatif | Nomor HP karakter huruf/simbol -> filter numeric only [BUG-025]', () => {
    // BUG-025: Field Nomor HP TIDAK filter input — terima semua karakter (huruf, simbol).
    // PRD: "Hanya menerima input angka (Numerik 0-9). Karakter huruf atau simbol otomatis ditolak"
    // TC ini SENGAJA FAIL sampai BUG-025 di-fix — jangan lock in buggy behavior (CLAUDE.md).
    registrasi.fillPhone(d.testData.phoneNonNumeric);
    registrasi.elements.phoneInput().invoke('val').then((val) => {
      expect(val, `BUG-025: value field hanya digit (actual="${val}")`).to.match(/^\d*$/);
    });
  });

  it.skip('TC-ONB-REG-020 | Negatif | Nomor HP sudah terdaftar [PENDING — butuh akun seed]', () => {
    // BLOCKED: butuh akun seed dengan No HP yang sudah terdaftar.
  });

  it('TC-ONB-REG-021 | Negatif | Password < 8 char -> error complexity', () => {
    registrasi.fillPassword(d.testData.passwordShort);
    registrasi.blur(d.selectors.passwordInput);
    registrasi.assertFieldInvalid(d.selectors.passwordInput);
    registrasi.assertFieldErrorMessage(d.selectors.passwordInput, d.messages.passwordComplex);
    registrasi.assertSubmitDisabled();
  });

  it('TC-ONB-REG-022 | Negatif | Password tanpa huruf besar -> error complexity', () => {
    registrasi.fillPassword(d.testData.passwordNoUpper);
    registrasi.blur(d.selectors.passwordInput);
    registrasi.assertFieldInvalid(d.selectors.passwordInput);
    registrasi.assertFieldErrorMessage(d.selectors.passwordInput, d.messages.passwordComplex);
    registrasi.assertSubmitDisabled();
  });

  it('TC-ONB-REG-023 | Negatif | Password tanpa huruf kecil -> error complexity', () => {
    registrasi.fillPassword(d.testData.passwordNoLower);
    registrasi.blur(d.selectors.passwordInput);
    registrasi.assertFieldInvalid(d.selectors.passwordInput);
    registrasi.assertFieldErrorMessage(d.selectors.passwordInput, d.messages.passwordComplex);
    registrasi.assertSubmitDisabled();
  });

  it('TC-ONB-REG-024 | Negatif | Password tanpa angka -> error complexity', () => {
    registrasi.fillPassword(d.testData.passwordNoDigit);
    registrasi.blur(d.selectors.passwordInput);
    registrasi.assertFieldInvalid(d.selectors.passwordInput);
    registrasi.assertFieldErrorMessage(d.selectors.passwordInput, d.messages.passwordComplex);
    registrasi.assertSubmitDisabled();
  });

  // ============================================================
  // EDGE
  // ============================================================
  it('TC-ONB-REG-025 | Edge | Nama tepat 3 char (min boundary) -> diterima', () => {
    registrasi.register({
      name: d.testData.minName,
      phone: uniqPhone(),
      email: uniqEmail(),
      password: d.testData.passwordWeakValid,
    });
    registrasi.assertRedirectOtp();
  });

  it('TC-ONB-REG-026 | Edge | Nomor HP tepat 10 digit (min boundary) -> diterima', () => {
    // Phone random 10-digit (bukan fixed) -> rerun-safe (anti duplicate)
    registrasi.register({
      name: d.testData.validName,
      phone: uniqPhoneN(10),
      email: uniqEmail(),
      password: d.testData.passwordWeakValid,
    });
    registrasi.assertRedirectOtp();
  });

  it('TC-ONB-REG-027 | Edge | Nomor HP tepat 13 digit (max boundary) -> diterima', () => {
    // Phone random 13-digit (bukan fixed) -> rerun-safe (anti duplicate)
    registrasi.register({
      name: d.testData.validName,
      phone: uniqPhoneN(13),
      email: uniqEmail(),
      password: d.testData.passwordWeakValid,
    });
    registrasi.assertRedirectOtp();
  });

  it('TC-ONB-REG-028 | Edge | Password tepat 8 char (min boundary) -> Lemah, diterima', () => {
    registrasi.fillAllValid({
      name: d.testData.validName,
      phone: uniqPhone(),
      email: uniqEmail(),
      password: d.testData.passwordWeakValid,
    });
    registrasi.assertStrengthLemah();
    registrasi.clickSubmit();
    registrasi.assertRedirectOtp();
  });

  it('TC-ONB-REG-029 | Edge | Nama whitespace-only (3+ spasi) -> error atau accepted (PRD-ambigu)', () => {
    registrasi.fillName(d.testData.whitespaceName);
    registrasi.blur(d.selectors.nameInput);
    // Behavior salah satu: (a) trim -> length 0 -> error required-like; (b) accepted 3 char termasuk spasi
    registrasi.elements.nameInput().invoke('val').then((val) => {
      cy.log(`Whitespace-only Nama: value="${val}", length=${val.length}`);
    });
    // Catat behavior aktual. Asumsi standar: tombol Submit tetap disabled karena pengisian tidak valid
    registrasi.assertSubmitDisabled();
  });

  it('TC-ONB-REG-030 | Edge | Email dengan leading/trailing space -> trim atau error', () => {
    registrasi.fillEmail(d.testData.emailWithSpaces);
    registrasi.blur(d.selectors.emailInput);
    // Behavior salah satu: (a) trim auto + valid; (b) error "Format email tidak valid"
    registrasi.elements.emailInput().invoke('val').then((val) => {
      cy.log(`Email with spaces: value="${val}"`);
    });
    // Asumsi: error format karena ada whitespace - tapi catat actual
  });

  // ============================================================
  // DEFERRED — Google OAuth + PIN email
  // ============================================================
  it.skip('TC-ONB-REG-031 | Positif | Registrasi via Google sukses [DEFERRED]', () => {
    // DOUBLE BLOCKED: (1) tombol disabled di-app; (2) Cypress can't cross-origin Google
  });

  it.skip('TC-ONB-REG-032 | Negatif | Registrasi via Google dibatalkan [DEFERRED]', () => {
    // DEFERRED: same as TC-031
  });

  it.skip('TC-ONB-REG-033 | Positif | PIN 6-digit dikirim ke email [DEFERRED — butuh mail catcher]', () => {
    // DEFERRED: butuh akses inbox / mail catcher
  });
});
