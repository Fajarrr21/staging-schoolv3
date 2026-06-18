// list_jurusan.cy.js — Spec List Jurusan
// Modul: Pengaturan > Akademik > Jurusan — List  |  Route: /setting/academic/major
// Tiap test seed datanya sendiri bila perlu (rerun-safe QA<6digit-ts><seq>).

import jurusan from '../../../support/pageobjects/JurusanPage';
import login from '../../../support/pageobjects/LoginPage';

describe('Jurusan — List (CARDS School)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;
  const uniq = () => `${d.testData.prefix}${ts}${String(++seq).padStart(2, '0')}`;

  const seed = () => {
    const nama = uniq();
    jurusan.addJurusan(d.instansi.primary, nama);
    jurusan.assertSuccessToast(d.messages.addSuccess);
    return nama;
  };
  const seedInactive = () => {
    const nama = seed();
    jurusan.openEditByName(nama);
    jurusan.selectStatus(d.labels.statusInactive);
    jurusan.clickSave();
    jurusan.assertSuccessToast(d.messages.editSuccess);
    return nama;
  };

  before(() => { cy.fixture('jurusan').then((data) => { d = data; }); });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    jurusan.visit();
  });

  it('TC-JRS-LST-001 | List menampilkan kolom lengkap', () => {
    jurusan.assertColumns();
  });

  it('TC-JRS-LST-002 | Tiap row punya Aksi Edit & Hapus', () => {
    jurusan.assertRowHasActions();
  });

  it('TC-JRS-LST-003 | Urutan terbaru -> terlama', () => {
    seed();              // A
    const b = seed();    // B (lebih baru)
    jurusan.visit();     // reload, default sort newest-first, tanpa filter
    jurusan.assertFirstRowName(b);
  });

  it('TC-JRS-LST-004 | Filter Instansi', () => {
    seed();
    jurusan.filterByInstansi(d.instansi.primary);
    jurusan.assertHasRows();
    jurusan.assertAllRowsInstansi(d.instansi.primary);
  });

  it('TC-JRS-LST-005 | Filter Status = Aktif', () => {
    seed();
    jurusan.filterByStatus(d.labels.statusActive);
    jurusan.assertHasRows();
    jurusan.assertAllRowsStatus(d.labels.statusActive);
  });

  it('TC-JRS-LST-006 | Filter Status = Tidak Aktif', () => {
    seedInactive();
    jurusan.filterByStatus(d.labels.statusInactive);
    jurusan.assertHasRows();
    jurusan.assertAllRowsStatus(d.labels.statusInactive);
  });

  it('TC-JRS-LST-007 | Filter Status = Semua', () => {
    jurusan.filterByStatus(d.labels.filterStatusAll); // "Semua"
    jurusan.assertHasRows(); // tampil semua status
  });

  it('TC-JRS-LST-008 | Filter kombinasi Instansi + Status [BUG-014]', () => {
    const nama = seed(); // SDIT, Aktif
    jurusan.filterByInstansi(d.instansi.primary);
    jurusan.filterByStatus(d.labels.statusActive);
    // BUG-014 (CONFIRMED): kombinasi filter Instansi + Status mengembalikan 0 data padahal ada
    // (pola sama BUG-009 Kelas). Assertion RED sampai di-fix; auto-hijau begitu diperbaiki.
    jurusan.assertHasRows();
    jurusan.assertAllRowsInstansi(d.instansi.primary);
    jurusan.assertAllRowsStatus(d.labels.statusActive);
    jurusan.assertRowExists(nama);
  });

  it('TC-JRS-LST-009 | Filter aktif + tidak ada hasil -> empty state', () => {
    // empty deterministik: filter Status aktif lalu cari string yang pasti tidak ada
    jurusan.filterByStatus(d.labels.statusActive);
    jurusan.search(d.testData.noMatchSearch);
    jurusan.assertEmptyState();
  });

  it('TC-JRS-LST-010 | Cari by nama Jurusan', () => {
    const nama = seed();
    jurusan.search(nama);
    jurusan.assertRowExists(nama);
  });

  it('TC-JRS-LST-011 | Cari by nama Instansi', () => {
    seed(); // pastikan ada data di instansi primary
    jurusan.search(d.instansi.primary); // PRD: Cari juga by Instansi
    jurusan.assertHasRows();
    jurusan.assertAllRowsInstansi(d.instansi.primary);
  });

  it('TC-JRS-LST-012 | Cari tanpa hasil -> empty state', () => {
    jurusan.search(d.testData.noMatchSearch);
    jurusan.assertEmptyState();
  });

  it('TC-JRS-LST-013 | Clear Cari -> list kembali penuh', () => {
    const nama = seed();
    jurusan.search(nama);
    jurusan.assertRowExists(nama);
    jurusan.clearSearch();
    cy.get('table tbody tr').its('length').should('be.gt', 1); // list ter-restore
  });

  it('TC-JRS-LST-014 | Cari case-insensitive', () => {
    const nama = seed();
    jurusan.search(nama.toLowerCase()); // beda kapital
    jurusan.assertRowExists(nama);       // tetap ketemu kalau case-insensitive
  });
});