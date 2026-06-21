// edit_jurusan.cy.js — Spec Edit Jurusan
// Modul: Pengaturan > Akademik > Jurusan — Edit (via Aksi/ikon pensil)  |  Route: /setting/academic/major
// Tiap test seed datanya sendiri (rerun-safe QA<6digit-ts><seq>) lalu edit row tsb.
// Cleanup (zzz_cleanup_jurusan) nyusul bareng modul Hapus.

import jurusan from '../../../../../support/pageobjects/JurusanPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Jurusan — Edit (CARDS School)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;
  const uniq = () => `${d.testData.prefix}${ts}${String(++seq).padStart(2, '0')}`;
  const longName = (minLen) => {
    let s = `${d.testData.prefix}${ts}`; let i = 1;
    while (s.length < minLen) { s += ` kata${String(i).padStart(2, '0')}`; i += 1; }
    return s;
  };
  // seed 1 jurusan baru (default Aktif) di instansi primary, balikin namanya
  const seed = () => {
    const nama = uniq();
    jurusan.addJurusan(d.instansi.primary, nama);
    jurusan.assertSuccessToast(d.messages.addSuccess);
    return nama;
  };

  before(() => { cy.fixture('jurusan').then((data) => { d = data; }); });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    jurusan.visit();
  });

  it('TC-JRS-EDT-001 | Buka form Edit via Aksi (ikon pensil), prefilled', () => {
    const nama = seed();
    jurusan.openEditByName(nama);
    jurusan.assertModalOpen(d.labels.editTitle);
    jurusan.assertJurusanValue(nama);
    jurusan.assertInstansiValue(d.instansi.primary);
    jurusan.assertStatusValue(d.labels.statusActive);
  });

  it('TC-JRS-EDT-002 | Form Edit punya field Status', () => {
    const nama = seed();
    jurusan.openEditByName(nama);
    jurusan.assertStatusFieldExists();
    jurusan.assertStatusValue(d.labels.statusActive);
  });

  it('TC-JRS-EDT-003 | Edit nama Jurusan valid', () => {
    const nama = seed();
    const baru = uniq();
    jurusan.openEditByName(nama);
    jurusan.fillJurusan(baru);
    jurusan.clickSave();
    jurusan.assertSuccessToast(d.messages.editSuccess);
    jurusan.assertModalClosed();
    jurusan.search(baru);
    jurusan.assertRowExists(baru);
  });

  it('TC-JRS-EDT-004 | Ubah Status Aktif -> Tidak Aktif', () => {
    const nama = seed();
    jurusan.openEditByName(nama);
    jurusan.selectStatus(d.labels.statusInactive);
    jurusan.clickSave();
    jurusan.assertSuccessToast(d.messages.editSuccess);
    jurusan.search(nama);
    jurusan.assertRowStatus(nama, d.labels.statusInactive);
  });

  it('TC-JRS-EDT-005 | Ubah Status Tidak Aktif -> Aktif', () => {
    const nama = seed();
    // set ke Tidak Aktif dulu
    jurusan.openEditByName(nama);
    jurusan.selectStatus(d.labels.statusInactive);
    jurusan.clickSave();
    jurusan.assertSuccessToast(d.messages.editSuccess);
    // balik ke Aktif
    jurusan.openEditByName(nama);
    jurusan.selectStatus(d.labels.statusActive);
    jurusan.clickSave();
    jurusan.assertSuccessToast(d.messages.editSuccess);
    jurusan.search(nama);
    jurusan.assertRowStatus(nama, d.labels.statusActive);
  });

  it('TC-JRS-EDT-006 | Ubah Instansi', () => {
    const nama = seed();
    jurusan.openEditByName(nama);
    jurusan.selectInstansi(d.instansi.secondary);
    jurusan.clickSave();
    jurusan.assertSuccessToast(d.messages.editSuccess);
    jurusan.search(nama);
    jurusan.assertRowInstansi(nama, d.instansi.secondary); // konfirmasi Instansi memang editable
  });

  it('TC-JRS-EDT-007 | Batal saat edit, perubahan tidak tersimpan', () => {
    const nama = seed();
    const baru = uniq();
    jurusan.openEditByName(nama);
    jurusan.fillJurusan(baru);
    jurusan.clickCancel();
    jurusan.assertModalClosed();
    jurusan.search(baru);
    jurusan.assertRowNotExists(baru);
    jurusan.search(nama);
    jurusan.assertRowExists(nama); // nama lama tetap
  });

  it('TC-JRS-EDT-008 | Kosongkan Jurusan -> error required', () => {
    const nama = seed();
    jurusan.openEditByName(nama);
    jurusan.clearJurusan();
    jurusan.clickSave();
    jurusan.assertJurusanError(d.messages.nameRequired);
    jurusan.assertModalOpen(d.labels.editTitle);
    jurusan.assertNoSuccessToast();
  });

  it('TC-JRS-EDT-009 | Edit nama jadi duplikat (instansi sama) [KANDIDAT BUG]', () => {
    const namaA = seed();      // target duplikat
    const namaB = seed();      // row yang diedit
    jurusan.openEditByName(namaB);
    jurusan.fillJurusan(namaA); // ubah jadi sama dgn namaA di instansi yang sama
    jurusan.clickSave();
    // PRD: harus tampil error duplikat, tidak tersimpan. Pola BUG-012 (no uniqueness) =>
    // kemungkinan malah SUKSES. RED = surface bug di jalur Edit.
    jurusan.assertNoSuccessToast();
    jurusan.assertModalOpen(d.labels.editTitle);
  });

  it('TC-JRS-EDT-010 | Edit nama jadi karakter spesial -> ditolak', () => {
    const nama = seed();
    jurusan.openEditByName(nama);
    jurusan.fillJurusan(d.testData.specialMix);
    jurusan.clickSave();
    jurusan.assertJurusanError(d.messages.invalidChar);
    jurusan.assertModalOpen(d.labels.editTitle);
    jurusan.assertNoSuccessToast();
  });

  it('TC-JRS-EDT-011 | Edit nama jadi >255 char -> tidak tersimpan', () => {
    const nama = seed();
    jurusan.openEditByName(nama);
    jurusan.fillJurusan(longName(d.testData.boundaries.nameOverflow));
    jurusan.clickSave();
    // BUG-013 pattern: backend tolak varchar(255), FE silent. Invariant: tidak tersimpan.
    jurusan.assertNoSuccessToast();
  });

  it('TC-JRS-EDT-012 | Edit nama jadi whitespace only -> error required', () => {
    const nama = seed();
    jurusan.openEditByName(nama);
    jurusan.fillJurusan(d.testData.spaceOnly);
    jurusan.clickSave();
    jurusan.assertJurusanError(d.messages.nameRequired);
    jurusan.assertModalOpen(d.labels.editTitle);
  });

  it('TC-JRS-EDT-013 | Edit nama dengan leading/trailing space -> trim', () => {
    const nama = seed();
    const core = uniq();
    jurusan.openEditByName(nama);
    jurusan.fillJurusan(`  ${core}  `);
    jurusan.clickSave();
    jurusan.assertSuccessToast(d.messages.editSuccess);
    jurusan.search(core);
    jurusan.assertRowExists(core);
  });

  it('TC-JRS-EDT-014 | Simpan tanpa ubah apapun (no-op)', () => {
    const nama = seed();
    jurusan.openEditByName(nama);
    jurusan.clickSave();
    jurusan.assertSuccessToast(d.messages.editSuccess);
  });
});