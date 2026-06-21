// tambah_jurusan.cy.js — Spec Tambah Jurusan
// Modul: Pengaturan > Akademik > Jurusan  |  Route: /setting/academic/major
// Konvensi: cy.session('admin-cazh-session') via cy.login(), naming rerun-safe QA<6digit-ts><seq>.
// Semua label/message/instansi/testData dibaca dari fixture jurusan.json (source of truth).
// CATATAN DATA: spec ini bikin row QA tiap run. Cleanup utility (zzz_cleanup_jurusan)
//   nyusul bareng modul Hapus — inget pelajaran bloat Kelas (290+ row = flaky).

import jurusan from '../../../../../support/pageobjects/JurusanPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Jurusan — Tambah (CARDS School)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;

  const uniq = () => `${d.testData.prefix}${ts}${String(++seq).padStart(2, '0')}`; // QA<6digit><2digit-seq>

  before(() => {
    cy.fixture('jurusan').then((data) => { d = data; });
  });

  beforeEach(() => {
    // reuse session yang sama dgn spec Kelas/Tingkat: cy.session(`session-${email}`)
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    jurusan.visit();
  });

  // ---------- HAPPY ----------
  it('TC-JRS-ADD-001 | Happy | Tambah jurusan baru dengan data valid', () => {
    const nama = uniq();
    jurusan.addJurusan(d.instansi.primary, nama);
    jurusan.assertSuccessToast(d.messages.addSuccess);
    jurusan.assertModalClosed();
    jurusan.search(nama);
    jurusan.assertRowExists(nama); // row baru muncul (default Status = Aktif)
  });

  // ---------- POSITIF ----------
  it('TC-JRS-ADD-002 | Positif | Form tambah terbuka dengan field kosong', () => {
    jurusan.openAddModal();
    jurusan.assertModalOpen(d.labels.addTitle);
    jurusan.assertFormEmpty(d.labels.placeholderInstansi);
  });

  it('TC-JRS-ADD-003 | Positif | Batal menutup form tanpa menambah data', () => {
    jurusan.openAddModal();
    jurusan.clickCancel();
    jurusan.assertModalClosed();
  });

  it('TC-JRS-ADD-004 | Positif | Isi form valid lalu Batal -> data tidak tersimpan', () => {
    const nama = uniq();
    jurusan.openAddModal();
    jurusan.selectInstansi(d.instansi.primary);
    jurusan.fillJurusan(nama);
    jurusan.clickCancel();
    jurusan.assertModalClosed();
    jurusan.search(nama);
    jurusan.assertRowNotExists(nama);
  });

  it('TC-JRS-ADD-005 | Positif | Tambah beberapa jurusan berbeda dalam 1 instansi', () => {
    jurusan.addJurusan(d.instansi.primary, uniq());
    jurusan.assertSuccessToast(d.messages.addSuccess);
    jurusan.addJurusan(d.instansi.primary, uniq());
    jurusan.assertSuccessToast(d.messages.addSuccess);
  });

  it('TC-JRS-ADD-006 | Positif | Nama sama beda instansi -> sukses [ASUMSI per-instansi]', () => {
    const nama = uniq();
    jurusan.addJurusan(d.instansi.primary, nama);
    jurusan.assertSuccessToast(d.messages.addSuccess);
    jurusan.addJurusan(d.instansi.secondary, nama);
    jurusan.assertSuccessToast(d.messages.addSuccess); // gagal -> uniqueness ternyata GLOBAL
  });

  // ---------- NEGATIF ----------
  it('TC-JRS-ADD-007 | Negatif | Simpan dengan field Jurusan kosong', () => {
    jurusan.openAddModal();
    jurusan.selectInstansi(d.instansi.primary);
    jurusan.clickSave();
    jurusan.assertJurusanError(d.messages.nameRequired);
    jurusan.assertModalOpen(d.labels.addTitle); // dialog tetap kebuka, Simpan ga jalan
    jurusan.assertNoSuccessToast();
  });

  it('TC-JRS-ADD-008 | Negatif | Simpan dengan field Instansi kosong', () => {
    jurusan.openAddModal();
    jurusan.fillJurusan(uniq());
    jurusan.clickSave();
    jurusan.assertInstansiError(d.messages.instansiRequired);
    jurusan.assertModalOpen(d.labels.addTitle);
    jurusan.assertNoSuccessToast();
  });

  it('TC-JRS-ADD-009 | Negatif | Simpan dengan kedua field kosong', () => {
    jurusan.openAddModal();
    jurusan.clickSave();
    jurusan.assertInstansiError(d.messages.instansiRequired);
    jurusan.assertJurusanError(d.messages.nameRequired);
    jurusan.assertModalOpen(d.labels.addTitle);
    jurusan.assertNoSuccessToast();
  });

  it('TC-JRS-ADD-010 | Negatif | Tambah duplikat (nama & instansi sama) [KANDIDAT BUG]', () => {
    const nama = uniq();
    jurusan.addJurusan(d.instansi.primary, nama); // seed
    jurusan.assertSuccessToast(d.messages.addSuccess);
    jurusan.addJurusan(d.instansi.primary, nama); // duplikat
    // Expected benar: ditolak -> TANPA success toast, dialog tetap kebuka (idealnya msg d.messages.duplicateName).
    // Kalau malah sukses & nutup modal = FE-silent (pola BUG-008/010 Kelas) -> log BUG baru (BUG-012).
    jurusan.assertNoSuccessToast();
    jurusan.assertModalOpen(d.labels.addTitle);
  });

  // ---------- EDGE ----------
  it('TC-JRS-ADD-011 | Edge | Input Jurusan whitespace-only (spasi saja)', () => {
    jurusan.openAddModal();
    jurusan.selectInstansi(d.instansi.primary);
    jurusan.fillJurusan(d.testData.spaceOnly);
    jurusan.clickSave();
    jurusan.assertJurusanError(d.messages.nameRequired); // expected: ter-trim -> dianggap kosong
    jurusan.assertModalOpen(d.labels.addTitle);
  });

  it('TC-JRS-ADD-012 | Edge | Leading/trailing space -> trim saat simpan', () => {
    const core = uniq();
    jurusan.addJurusan(d.instansi.primary, `  ${core}  `);
    jurusan.assertSuccessToast(d.messages.addSuccess);
    jurusan.search(core);
    jurusan.assertRowExists(core); // ketemu tanpa spasi tepi = ter-trim
  });

  it('TC-JRS-ADD-013 | Edge | Nama sangat panjang (300 char) [KANDIDAT BUG layout]', () => {
    const len = d.testData.boundaries.nameOverflow;
    const nama = `${d.testData.prefix}${ts}${'X'.repeat(len - (d.testData.prefix.length + 6))}`;
    jurusan.openAddModal();
    jurusan.selectInstansi(d.instansi.primary);
    jurusan.fillJurusan(nama);
    jurusan.elements.jurusanInput().invoke('val').then((v) => {
      cy.log(`panjang value ke-set: ${v.length} (target ${len})`); // no maxlength = risiko overflow (BUG-011)
    });
    jurusan.clickSave();
    jurusan.assertSuccessToast(d.messages.addSuccess);
  });

  it('TC-JRS-ADD-014 | Edge | Nama 1 karakter (min boundary)', () => {
    // minName statis ("A") -> ga rerun-safe. Kalau app nolak duplikat, bisa false-fail di run ke-2.
    jurusan.addJurusan(d.instansi.primary, d.testData.minName);
    jurusan.assertSuccessToast(d.messages.addSuccess);
  });

  it('TC-JRS-ADD-015 | Edge | Nama valid alfanumerik + spasi', () => {
    const nama = `${uniq()} VALID`; // huruf, angka, spasi -> harus diizinkan
    jurusan.addJurusan(d.instansi.primary, nama);
    jurusan.assertSuccessToast(d.messages.addSuccess);
  });

  it('TC-JRS-ADD-016 | Edge | Karakter spesial ditolak [ASUMSI: punya rule charset spt Kelas]', () => {
    jurusan.openAddModal();
    jurusan.selectInstansi(d.instansi.primary);
    jurusan.fillJurusan(d.testData.specialMix); // "Jurusan@#$%"
    jurusan.clickSave();
    // Expected (kalau Jurusan punya rule sama spt Kelas): tolak + pesan invalidChar.
    // Kalau Jurusan TIDAK punya rule -> bakal sukses & TC ini fail = info: behavior beda dari Kelas.
    jurusan.assertJurusanError(d.messages.invalidChar);
    jurusan.assertModalOpen(d.labels.addTitle);
    jurusan.assertNoSuccessToast();
  });
});