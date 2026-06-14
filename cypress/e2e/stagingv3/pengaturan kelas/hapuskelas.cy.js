// Spec: Hapus Kelas (Pengaturan > Akademik > Kelas, via ikon trash di list)
// Sumber: PRD Hapus Kelas (diberikan user) + tab "Hapus Kelas" + Catatan Hapus.
// Bagian "kelas terhapus tidak dapat digunakan kembali untuk..." di-SKIP sesuai instruksi.
// Data dari fixture cypress/fixtures/kelas.json

const kelasPage = require('../../../support/pageobjects/KelasPage');

const uniq = (p, seq) => `${p}${Date.now().toString().slice(-6)}${seq}`;

describe('Pengaturan > Akademik > Kelas — Hapus Kelas', () => {
  let data;
  const listUrl = () => `${data.urls.base}${data.urls.kelasList}`;

  // seed kelas baru lalu balik ke list (rerun-safe)
  const seed = (nama) => {
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
  it('TC-DEL-001 - buka popup konfirmasi Hapus', () => {
    const nama = uniq(data.testData.prefix, '01');
    seed(nama);
    kelasPage.openDeleteConfirm(nama).assertDeleteDialog();
  });

  it('TC-DEL-002 - hapus kelas (konfirmasi) -> sukses + row hilang', () => {
    const nama = uniq(data.testData.prefix, '02');
    seed(nama);
    kelasPage.hapusKelas(nama).assertSuccessToast(data.messages.deleteSuccess);
  });

  // ---------- POSITIF ----------
  it('TC-DEL-003 - Batal hapus -> popup nutup, row TETAP ada', () => {
    const nama = uniq(data.testData.prefix, '03');
    seed(nama);
    kelasPage.openDeleteConfirm(nama).cancelDelete().assertDialogClosed();
    kelasPage.visit(listUrl()).search(nama).assertRowExists(nama);
  });

  it('TC-DEL-004 - hapus kelas status Aktif -> sukses (PRD: no constraint)', () => {
    const nama = uniq(data.testData.prefix, '04');
    seed(nama); // kelas baru default Aktif
    kelasPage.hapusKelas(nama).assertSuccessToast(data.messages.deleteSuccess);
  });

  it('TC-DEL-005 - hapus kelas status Tidak Aktif -> sukses', () => {
    const nama = uniq(data.testData.prefix, '05');
    seed(nama);
    // set status jadi Tidak Aktif dulu lewat Edit
    kelasPage.openEditForm(nama).selectStatus(data.labels.statusInactive).save()
      .assertSuccessToast(data.messages.editSuccess);
    kelasPage.visit(listUrl());
    kelasPage.hapusKelas(nama).assertSuccessToast(data.messages.deleteSuccess);
  });

  // ---------- EDGE ----------
  it('TC-DEL-006 - verifikasi persistensi: data benar2 hilang setelah reload', () => {
    const nama = uniq(data.testData.prefix, '06');
    seed(nama);
    kelasPage.hapusKelas(nama).assertSuccessToast(data.messages.deleteSuccess);
    kelasPage.visit(listUrl()).search(nama).assertEmptyState();
  });

  it('TC-DEL-007 - tutup popup via X -> row TIDAK terhapus', () => {
    const nama = uniq(data.testData.prefix, '07');
    seed(nama);
    kelasPage.openDeleteConfirm(nama).closeDeleteX().assertDialogClosed();
    kelasPage.visit(listUrl()).search(nama).assertRowExists(nama);
  });
});