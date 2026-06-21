// hapuskamar.cy.js — Spec Hapus Kamar
// Modul: Pengaturan > Akademik > Kamar  |  Route: /setting/academic/room
// Sumber TC: docs/test-cases/TC_Kamar_Hapus.xlsx (TC-KMR-DEL-001..011).
// Konvensi: reuse cy.session; fixed-wait (no intercept); naming rerun-safe QA<6digit-ts><seq>.
// TC-009 di-skip: validasi kamar dipakai data siswa/presensi -> fitur downstream belum bisa diuji.

import kamar from '../../../../../support/pageobjects/KamarPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Kamar — Hapus (CARDS School)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;

  const uniq = () => `${d.testData.prefix}${ts}${String(++seq).padStart(2, '0')}`;
  const uniqLok = () => `LOK${ts}${String(++seq).padStart(2, '0')}`;

  before(() => {
    cy.fixture('kamar').then((data) => { d = data; });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    kamar.visit();
  });

  // helper: tambah 1 kamar lalu reload ke list bersih
  const seed = (instansi, nama, opts = {}) => {
    kamar.addKamar(instansi, nama, opts);
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.visit();
  };

  // ---------- HAPPY ----------
  it('TC-KMR-DEL-001 | Happy | Klik ikon Hapus → popup konfirmasi muncul dengan judul & info kamar', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    kamar.openDeleteByName(nama);
    kamar.assertModalOpen(d.labels.deleteTitle);
    // pesan konfirmasi harus menyebut nama kamar + instansi (PRD)
    kamar.assertDeleteDialogShows(nama, d.instansi.primary);
    // tutup tanpa konfirmasi biar tidak menghapus data di TC ini
    kamar.clickCancel();
    kamar.assertModalClosed();
  });

  it('TC-KMR-DEL-002 | Happy | Konfirmasi Hapus → toast sukses & kamar hilang dari list', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    kamar.deleteByName(nama);
    kamar.assertSuccessToast(d.messages.deleteSuccess);
    kamar.assertModalClosed();
    // setelah delete, search input masih punya term `nama` -> baris harus hilang
    kamar.assertRowNotExists(nama);
  });

  it('TC-KMR-DEL-003 | Happy | Hapus persist setelah reload halaman (backend benar-benar terhapus)', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    kamar.deleteByName(nama);
    kamar.assertSuccessToast(d.messages.deleteSuccess);
    // reload page lalu cari ulang -> harus tetap tidak ada (assertNotPersisted = visit + search + assertRowNotExists)
    kamar.assertNotPersisted(nama);
  });

  // ---------- POSITIF ----------
  it('TC-KMR-DEL-004 | Positif | Klik Batal di popup → popup tutup, data tetap ada', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    kamar.openDeleteByName(nama);
    kamar.clickCancel();
    kamar.assertModalClosed();
    kamar.assertNoSuccessToast();
    // search input masih ada nama -> baris harus tetap ada
    kamar.assertRowExists(nama);
  });

  it('TC-KMR-DEL-005 | Positif | Hapus kamar dengan PIC terisi → tetap berhasil', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama, { pic: 'first' }); // alias @picName ter-set
    cy.get('@picName').then((pic) => {
      if (!pic) { cy.log('Instansi tidak punya guru/staff -> tetap lanjut hapus (data seed punya PIC tidak terverifikasi)'); }
      kamar.deleteByName(nama);
      kamar.assertSuccessToast(d.messages.deleteSuccess);
      kamar.assertRowNotExists(nama);
    });
  });

  it('TC-KMR-DEL-006 | Positif | Hapus kamar dengan Lokasi terisi → tetap berhasil', () => {
    const nama = uniq();
    const lok = uniqLok();
    seed(d.instansi.primary, nama, { lokasi: lok });
    kamar.deleteByName(nama);
    kamar.assertSuccessToast(d.messages.deleteSuccess);
    kamar.assertRowNotExists(nama);
  });

  it('TC-KMR-DEL-007 | Positif | Hapus kamar berstatus Tidak Aktif → tetap berhasil', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama); // default Aktif
    // setup: ubah status ke Tidak Aktif via modul Edit
    kamar.openEditByName(nama);
    kamar.selectStatus(d.labels.statusInactive);
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.editSuccess);
    kamar.visit();
    // test: hapus
    kamar.deleteByName(nama);
    kamar.assertSuccessToast(d.messages.deleteSuccess);
    kamar.assertRowNotExists(nama);
  });

  it('TC-KMR-DEL-008 | Positif | Hapus beberapa kamar berturut-turut → masing-masing popup independen', () => {
    const namaA = uniq();
    const namaB = uniq();
    seed(d.instansi.primary, namaA);
    seed(d.instansi.primary, namaB);
    // hapus A
    kamar.deleteByName(namaA);
    kamar.assertSuccessToast(d.messages.deleteSuccess);
    kamar.assertRowNotExists(namaA);
    // tanpa visit/reload, lanjut hapus B (search ulang lewat deleteByName -> search baru)
    kamar.deleteByName(namaB);
    kamar.assertSuccessToast(d.messages.deleteSuccess);
    kamar.assertRowNotExists(namaB);
  });

  // ---------- NEGATIF ----------
  it.skip('TC-KMR-DEL-009 | Negatif | Hapus kamar yg dipakai data siswa/presensi → SKIP: fitur downstream belum bisa diuji', () => {
    // PRD: "Kamar yang berhasil dihapus tidak dapat digunakan kembali untuk data diri siswa
    //   serta pengaturan presensi kegiatan."
    // Modul data siswa & presensi tidak bisa diakses dari konteks ini -> ditunda sampai
    //   fitur terkait tersedia & punya entry point yg bisa dipakai untuk setup test data.
  });

  // ---------- EDGE ----------
  it('TC-KMR-DEL-010 | Edge | Tekan ESC saat popup konfirmasi → popup tutup, tidak terhapus', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    kamar.openDeleteByName(nama);
    kamar.pressEscape();
    kamar.assertModalClosed();
    kamar.assertNoSuccessToast();
    kamar.assertRowExists(nama);
  });

  it('TC-KMR-DEL-011 | Edge | Setelah hapus, nama bisa dipakai ulang di instansi yang sama (hard delete)', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    kamar.deleteByName(nama);
    kamar.assertSuccessToast(d.messages.deleteSuccess);
    kamar.visit();
    // re-create dengan nama persis sama di instansi yang sama -> harus sukses
    //   (kalau gagal duplicate -> kandidat bug: soft delete masih meng-occupy unique constraint)
    kamar.addKamar(d.instansi.primary, nama);
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.assertPersisted(nama);
  });
});
