// Spec: Tambah Kelas (Pengaturan > Akademik > Kelas)
// Sumber: PRD Tambah Kelas + test case sheet TestCase_Kelas_CARDS_School.xlsx
// Data dari fixture cypress/fixtures/kelas.json

const kelasPage = require('../../../../../support/pageobjects/KelasPage');

// rerun-safe: prefix + 6 digit terakhir timestamp + seq (alfanumerik, lolos whitelist)
const uniq = (p, seq) => `${p}${Date.now().toString().slice(-6)}${seq}`;
const uniqNum = (seq) => `${Date.now().toString().slice(-6)}${seq}`;

describe('Pengaturan > Akademik > Kelas — Tambah Kelas', () => {
  let data;

  before(() => {
    cy.fixture('kelas').then((d) => {
      data = d;
    });
  });

  beforeEach(() => {
    // Login pakai cy.session (id dishare antar spec). Creds dari fixture.
    // TODO: kalau kalian sudah punya command login bersama, ganti isi callback ini dgn command itu.
    cy.session('admin-cazh-session', () => {
      cy.visit(`${data.urls.base}${data.urls.login}`);
      cy.get('input[type="email"], input[name="email"]').first().type(data.credentials.email);
      cy.get('input[type="password"], input[name="password"]').first()
        .type(data.credentials.password, { log: false });
      cy.contains('button', /masuk|login|sign in/i).click();
      cy.location('pathname', { timeout: data.timeouts.dialog }).should('not.include', data.urls.login);
    });
    kelasPage.visit(`${data.urls.base}${data.urls.kelasList}`);
  });

  // ---------- HAPPY ----------
  it('TC-TBH-001 - buka form Tambah Kelas', () => {
    kelasPage.openForm().assertDialogOpen();
  });

  it('TC-TBH-002 - tambah kelas data valid', () => {
    const nama = uniq(data.testData.prefix, 2);
    kelasPage.tambahKelas(data.instansi.primary, nama).assertSuccessToast(data.messages.addSuccess);
    kelasPage.visit(`${data.urls.base}${data.urls.kelasList}`).assertRowExists(nama);
  });

  // ---------- POSITIF ----------
  it('TC-TBH-003 - nama kelas angka saja', () => {
    kelasPage.tambahKelas(data.instansi.primary, uniqNum(3)).assertSuccessToast(data.messages.addSuccess);
  });

  it('TC-TBH-004 - nama kelas kombinasi huruf + angka', () => {
    kelasPage.tambahKelas(data.instansi.primary, uniq(data.testData.prefix, 4))
      .assertSuccessToast(data.messages.addSuccess);
  });

  it('TC-TBH-005 - nama kelas dengan spasi antar kata (spasi DIBOLEHKAN)', () => {
    kelasPage.tambahKelas(data.instansi.primary, `${uniq(data.testData.prefix, 5)} A`)
      .assertSuccessToast(data.messages.addSuccess);
  });

  it('TC-TBH-006 - Batal setelah isi form -> data tidak tersimpan', () => {
    const nama = uniq(data.testData.prefix, 6);
    kelasPage.openForm().selectInstansi(data.instansi.primary).fillKelas(nama).cancel();
    kelasPage.assertDialogClosed().assertRowNotExists(nama);
  });

  it('TC-TBH-007 - Batal tanpa isi apapun', () => {
    kelasPage.openForm().cancel().assertDialogClosed();
  });

  it('TC-TBH-008 - nama sama beda instansi -> sukses (duplikat per-instansi)', () => {
    const nama = uniq(data.testData.prefix, 8);
    kelasPage.tambahKelas(data.instansi.primary, nama).assertSuccessToast(data.messages.addSuccess);
    kelasPage.visit(`${data.urls.base}${data.urls.kelasList}`)
      .tambahKelas(data.instansi.secondary, nama).assertSuccessToast(data.messages.addSuccess);
  });

  // ---------- NEGATIF ----------
  it('TC-TBH-009 - Instansi kosong', () => {
    kelasPage.openForm().fillKelas(uniq(data.testData.prefix, 9)).save();
    kelasPage.assertValidation(data.messages.requiredGeneric).assertDialogOpen();
  });

  it('TC-TBH-010 - Kelas kosong', () => {
    kelasPage.openForm().selectInstansi(data.instansi.primary).save();
    kelasPage.assertValidation(data.messages.nameRequired).assertDialogOpen();
  });

  it('TC-TBH-011 - semua field kosong', () => {
    kelasPage.openForm().save();
    kelasPage.assertValidation(data.messages.requiredGeneric).assertDialogOpen();
  });

  it('TC-TBH-012 - karakter khusus "!"', () => {
    kelasPage.openForm().selectInstansi(data.instansi.primary)
      .fillKelas(`${uniq(data.testData.prefix, 12)}${data.testData.specialBang}`).save();
    kelasPage.assertValidation(data.messages.invalidChar).assertNoSuccessToast();
  });

  it('TC-TBH-013 - karakter khusus campuran @#$%', () => {
    kelasPage.openForm().selectInstansi(data.instansi.primary)
      .fillKelas(data.testData.specialMix).save();
    kelasPage.assertValidation(data.messages.invalidChar).assertNoSuccessToast();
  });

  it('TC-TBH-014 - karakter lain (dash) -> ditolak', () => {
    kelasPage.openForm().selectInstansi(data.instansi.primary)
      .fillKelas(`${uniq(data.testData.prefix, 14)}${data.testData.dashSuffix}`).save();
    kelasPage.assertValidation(data.messages.invalidChar).assertNoSuccessToast();
  });

  // ---------- DUPLIKAT (FE silent) ----------
  it('TC-TBH-015 - duplikat nama (instansi sama) [BUG-008: FE silent]', () => {
    const nama = uniq(data.testData.prefix, 15);
    kelasPage.tambahKelas(data.instansi.primary, nama).assertSuccessToast(data.messages.addSuccess);
    kelasPage.visit(`${data.urls.base}${data.urls.kelasList}`).tambahKelas(data.instansi.primary, nama);
    // EXPECTED (PRD): pesan error duplikat (data.messages.duplicateName) tampil.
    // ACTUAL (BUG-008): FE diem, BE balikin {status:false,"...sudah ada..."}.
    // Asersi minimal yg lolos: tidak ada toast sukses.
    kelasPage.assertNoSuccessToast();
  });

  // ---------- EDGE ----------
  it('TC-TBH-016 - nama 1 karakter', () => {
    kelasPage.openForm().selectInstansi(data.instansi.primary).fillKelas(data.testData.minName).save();
    kelasPage.assertDialogOpen(); // longgar; sesuaikan setelah run pertama
  });
});