// hapusjurusan.cy.js — Spec Hapus Jurusan
// Modul: Pengaturan > Akademik > Jurusan — Hapus (via ikon trash di list)  |  Route: /setting/academic/major
// TC ref: TC_Jurusan_Hapus__revisi.xlsx (TC-JRS-HPS-001..009).
// Catatan: Hapus Jurusan saat ini PLAIN DELETE (belum terkoneksi PPDB/menu lain) -> tanpa kriteria khusus.
// Tiap test seed datanya sendiri (rerun-safe QA<6digit-ts><seq>) lalu hapus row tsb.

import jurusan from '../../../support/pageobjects/JurusanPage';
import login from '../../../support/pageobjects/LoginPage';

describe('Jurusan — Hapus (CARDS School)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;
  const uniq = () => `${d.testData.prefix}${ts}${String(++seq).padStart(2, '0')}`;

  // seed 1 jurusan baru (default Aktif), balikin namanya
  const seed = (instansi) => {
    const nama = uniq();
    jurusan.addJurusan(instansi || d.instansi.primary, nama);
    jurusan.assertSuccessToast(d.messages.addSuccess);
    return nama;
  };

  before(() => { cy.fixture('jurusan').then((data) => { d = data; }); });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    jurusan.visit();
  });

  // ---------- HAPPY ----------
  it('TC-JRS-HPS-001 | Buka popup konfirmasi Hapus via ikon trash', () => {
    const nama = seed();
    jurusan.openDeleteByName(nama);
    jurusan.assertDeleteDialogOpen(); // judul "Hapus Jurusan" + tombol Hapus & Batal
  });

  it('TC-JRS-HPS-002 | Hapus jurusan -> sukses, row hilang', () => {
    const nama = seed();
    jurusan.deleteByName(nama);
    jurusan.assertSuccessToast(d.messages.deleteSuccess);
    jurusan.assertModalClosed();
    jurusan.search(nama);
    jurusan.assertRowNotExists(nama);
  });

  it('TC-JRS-HPS-003 | Klik Batal di popup -> tidak terhapus', () => {
    const nama = seed();
    jurusan.openDeleteByName(nama);
    jurusan.clickCancel();
    jurusan.assertModalClosed();
    jurusan.search(nama);
    jurusan.assertRowExists(nama); // baris target TETAP ada
  });

  // ---------- POSITIF ----------
  it('TC-JRS-HPS-004 | Hapus jurusan pada instansi sekunder (Sekolah Alam)', () => {
    const nama = seed(d.instansi.secondary);
    jurusan.deleteByName(nama);
    jurusan.assertSuccessToast(d.messages.deleteSuccess);
    jurusan.search(nama);
    jurusan.assertRowNotExists(nama);
  });

  it('TC-JRS-HPS-005 | Hapus jurusan setelah Cari by nama', () => {
    const nama = seed();
    // openDeleteByName sudah pakai cy.intercept + wait('@alias') saat search
    jurusan.deleteByName(nama);
    jurusan.assertSuccessToast(d.messages.deleteSuccess);
    jurusan.assertRowNotExists(nama);
  });

  // ---------- EDGE ----------
  it('TC-JRS-HPS-006 | Tutup popup via Escape -> tidak terhapus', () => {
    const nama = seed();
    jurusan.openDeleteByName(nama);
    jurusan.closeDeleteEscape();
    jurusan.assertModalClosed();
    jurusan.search(nama);
    jurusan.assertRowExists(nama);
  });

  it('TC-JRS-HPS-007 | Hapus baris terakhir hasil pencarian -> empty state', () => {
    const nama = seed();
    jurusan.deleteByName(nama); // search aktif menyisakan tepat 1 baris -> setelah hapus jadi 0
    jurusan.assertSuccessToast(d.messages.deleteSuccess);
    jurusan.assertEmptyState();
  });

  it('TC-JRS-HPS-008 | Persistence: data tetap hilang setelah reload', () => {
    const nama = seed();
    jurusan.deleteByName(nama);
    jurusan.assertSuccessToast(d.messages.deleteSuccess);
    jurusan.assertNotPersisted(nama); // reload (visit) lalu cari -> tidak ada
  });

  it('TC-JRS-HPS-009 | Popup konfirmasi menampilkan nama jurusan target', () => {
    const nama = seed();
    jurusan.openDeleteByName(nama);
    jurusan.assertDeleteTextContains(nama);              // memuat nama jurusan
    jurusan.assertDeleteTextContains(d.instansi.primary); // & instansi (HTML: "...dari instansi SDIT?")
  });
});
