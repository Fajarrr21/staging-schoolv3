// Spec: Edit Kelas (Pengaturan > Akademik > Kelas, via Aksi > Edit)
// Sumber: PRD Edit Kelas + test case sheet (tab "Edit Kelas") + Catatan Edit
// Data dari fixture cypress/fixtures/kelas.json

const kelasPage = require('../../../../../support/pageobjects/KelasPage');

const uniq = (p, seq) => `${p}${Date.now().toString().slice(-6)}${seq}`;

describe('Pengaturan > Akademik > Kelas — Edit Kelas', () => {
  let data;
  const listUrl = () => `${data.urls.base}${data.urls.kelasList}`;

  // seed kelas baru lalu buka form Edit-nya (rerun-safe)
  const seedAndEdit = (nama) => {
    kelasPage.tambahKelas(data.instansi.primary, nama).assertSuccessToast(data.messages.addSuccess);
    kelasPage.visit(listUrl()).openEditForm(nama);
  };
  const seedOnly = (nama) => {
    kelasPage.tambahKelas(data.instansi.primary, nama).assertSuccessToast(data.messages.addSuccess);
    kelasPage.visit(listUrl());
  };

  before(() => {
    cy.fixture('kelas').then((d) => { data = d; });
  });

  beforeEach(() => {
    // TODO: ganti dgn command login bersama kalau ada (creds dari fixture)
    cy.session('admin-cazh-session', () => {
      cy.visit(`${data.urls.base}${data.urls.login}`);
      cy.get('input[type="email"], input[name="email"]').first().type(data.credentials.email);
      cy.get('input[type="password"], input[name="password"]').first()
        .type(data.credentials.password, { log: false });
      cy.contains('button', /masuk|login|sign in/i).click();
      cy.location('pathname', { timeout: data.timeouts.dialog }).should('not.include', data.urls.login);
    });
    kelasPage.visit(listUrl());
  });

  // ---------- HAPPY ----------
  it('TC-EDT-001 - buka form Edit (ter-prefill)', () => {
    const nama = uniq(data.testData.prefix, '01');
    seedAndEdit(nama);
    kelasPage.assertEditDialog()
      .assertKelasValue(nama)
      .assertInstansiValue(data.instansi.primary)
      .assertStatusValue(data.labels.statusActive);
  });

  it('TC-EDT-002 - form Edit punya field Status (prefilled Aktif)', () => {
    const nama = uniq(data.testData.prefix, '02');
    seedAndEdit(nama);
    kelasPage.assertStatusValue(data.labels.statusActive);
  });

  it('TC-EDT-003 - edit nama kelas valid', () => {
    const nama = uniq(data.testData.prefix, '03');
    const baru = uniq(data.testData.prefix, '03b');
    seedAndEdit(nama);
    kelasPage.fillKelas(baru).save().assertSuccessToast(data.messages.editSuccess);
    kelasPage.visit(listUrl()).search(baru).assertRowExists(baru);
  });

  // ---------- POSITIF ----------
  it('TC-EDT-004 - ubah Status Aktif -> Tidak Aktif', () => {
    const nama = uniq(data.testData.prefix, '04');
    seedAndEdit(nama);
    kelasPage.selectStatus(data.labels.statusInactive).save().assertSuccessToast(data.messages.editSuccess);
    kelasPage.visit(listUrl()).search(nama).assertRowStatus(nama, data.labels.statusInactive);
  });

  it('TC-EDT-005 - ubah Status Tidak Aktif -> Aktif', () => {
    const nama = uniq(data.testData.prefix, '05');
    seedAndEdit(nama);
    kelasPage.selectStatus(data.labels.statusInactive).save().assertSuccessToast(data.messages.editSuccess);
    kelasPage.visit(listUrl()).openEditForm(nama);
    kelasPage.selectStatus(data.labels.statusActive).save().assertSuccessToast(data.messages.editSuccess);
    kelasPage.visit(listUrl()).search(nama).assertRowStatus(nama, data.labels.statusActive);
  });

  it('TC-EDT-006 - simpan tanpa mengubah apapun (bukan duplikat)', () => {
    const nama = uniq(data.testData.prefix, '06');
    seedAndEdit(nama);
    kelasPage.save().assertSuccessToast(data.messages.editSuccess);
  });

  it('TC-EDT-007 - edit nama kombinasi huruf+angka', () => {
    const nama = uniq(data.testData.prefix, '07');
    seedAndEdit(nama);
    kelasPage.fillKelas(uniq(data.testData.prefix, '07b')).save().assertSuccessToast(data.messages.editSuccess);
  });

  it('TC-EDT-008 - edit nama dengan spasi', () => {
    const nama = uniq(data.testData.prefix, '08');
    seedAndEdit(nama);
    kelasPage.fillKelas(`${uniq(data.testData.prefix, '08b')} A`).save().assertSuccessToast(data.messages.editSuccess);
  });

  it('TC-EDT-009 - Batal setelah ubah -> perubahan tidak tersimpan', () => {
    const nama = uniq(data.testData.prefix, '09');
    const baru = uniq(data.testData.prefix, '09b');
    seedAndEdit(nama);
    kelasPage.fillKelas(baru).cancel().assertDialogClosed();
    kelasPage.visit(listUrl()).search(nama).assertRowExists(nama); // nama lama tetap ada
  });

  it('TC-EDT-010 - Batal tanpa ubah', () => {
    const nama = uniq(data.testData.prefix, '10');
    seedAndEdit(nama);
    kelasPage.cancel().assertDialogClosed();
  });

  // ---------- NEGATIF ----------
  it('TC-EDT-011 - Kelas kosong', () => {
    const nama = uniq(data.testData.prefix, '11');
    seedAndEdit(nama);
    kelasPage.fillKelas('').save();
    kelasPage.assertValidation(data.messages.nameRequired).assertDialogOpen();
  });

  it.skip('TC-EDT-012 - Instansi kosong [N/A di Edit]', () => {
    // Instansi ter-prefill & Radix select tidak punya opsi kosong/clear -> tidak bisa dikosongkan
    // via UI saat Edit. Required Instansi sudah ke-cover di modul Tambah (TC-TBH-009).
  });

  it.skip('TC-EDT-013 - Status kosong [N/A di Edit]', () => {
    // Status ter-prefill (Aktif) & select tidak punya opsi kosong -> tidak bisa dikosongkan via UI.
  });

  it('TC-EDT-014 - karakter khusus "!"', () => {
    const nama = uniq(data.testData.prefix, '14');
    seedAndEdit(nama);
    kelasPage.fillKelas(`${nama}${data.testData.specialBang}`).save();
    kelasPage.assertValidation(data.messages.invalidChar).assertNoSuccessToast();
  });

  it('TC-EDT-015 - karakter khusus campuran @#$%', () => {
    const nama = uniq(data.testData.prefix, '15');
    seedAndEdit(nama);
    kelasPage.fillKelas(data.testData.specialMix).save();
    kelasPage.assertValidation(data.messages.invalidChar).assertNoSuccessToast();
  });

  it('TC-EDT-016 - karakter lain (dash) -> ditolak', () => {
    const nama = uniq(data.testData.prefix, '16');
    seedAndEdit(nama);
    kelasPage.fillKelas(`${nama}${data.testData.dashSuffix}`).save();
    kelasPage.assertValidation(data.messages.invalidChar).assertNoSuccessToast();
  });

  // ---------- DUPLIKAT (FE silent) ----------
  it('TC-EDT-017 - edit nama jadi duplikat (instansi sama) [BUG-010: FE silent]', () => {
    const a = uniq(data.testData.prefix, '17a');
    const b = uniq(data.testData.prefix, '17b');
    seedOnly(a);
    seedOnly(b);
    kelasPage.openEditForm(b);
    kelasPage.fillKelas(a).save();
    // EXPECTED (PRD): pesan error duplikat. ACTUAL (BUG-010): FE silent, BE balikin status:false.
    kelasPage.assertNoSuccessToast();
  });

  // ---------- EDGE ----------
  it('TC-EDT-018 - ubah Instansi saat Edit (editable)', () => {
    const nama = uniq(data.testData.prefix, '18');
    seedAndEdit(nama);
    kelasPage.selectInstansi(data.instansi.secondary).save().assertSuccessToast(data.messages.editSuccess);
  });

  it('TC-EDT-019 - duplikat beda case [DISCOVERY]', () => {
    // discovery: asumsi duplikat case-insensitive -> FE silent (no success).
    const base = uniq(data.testData.prefix, '19');
    const other = uniq(data.testData.prefix, '19b');
    seedOnly(base);
    seedOnly(other);
    kelasPage.openEditForm(other);
    kelasPage.fillKelas(base.toLowerCase()).save();
    kelasPage.assertNoSuccessToast();
  });

  it('TC-EDT-020 - nama sangat panjang [DISCOVERY]', () => {
    // discovery: asumsi tidak ada maxlength -> tersimpan (success).
    const nama = uniq(data.testData.prefix, '20');
    seedAndEdit(nama);
    kelasPage.fillKelas(`QA${'A'.repeat(250)}`).save().assertSuccessToast(data.messages.editSuccess);
  });

  it('TC-EDT-021 - nama dengan spasi mengelilingi [DISCOVERY]', () => {
    // discovery: simpan nama dgn leading/trailing space (karakter valid).
    const nama = uniq(data.testData.prefix, '21');
    seedAndEdit(nama);
    kelasPage.fillKelas(`  ${uniq(data.testData.prefix, '21b')}  `).save().assertSuccessToast(data.messages.editSuccess);
  });
});