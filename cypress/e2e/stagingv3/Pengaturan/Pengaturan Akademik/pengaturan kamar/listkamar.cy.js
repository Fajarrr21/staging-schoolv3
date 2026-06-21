// listkamar.cy.js — Spec List Kamar
// Modul: Pengaturan > Akademik > Kamar  |  Route: /setting/academic/room
// Sumber TC: docs/test-cases/TC_Kamar_List.xlsx (TC-KMR-LST-001..016).
// Konvensi: reuse cy.session; fixed-wait (no intercept); naming rerun-safe QA<6digit-ts><seq>.
// Bug-target (fail-on-bug): TC-006/008/009 filter Status -> BUG-016; TC-011 search by Instansi -> BUG-018;
//   TC-012 search by PIC -> BUG-017. Semua dikonfirmasi manual; assertion sengaja fail sampai app fix.
// CATATAN: beberapa TC nge-seed data via addKamar (reuse fase Tambah) biar deterministik & rerun-safe.

import kamar from '../../../../../support/pageobjects/KamarPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Kamar — List (CARDS School)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;

  const uniq = () => `${d.testData.prefix}${ts}${String(++seq).padStart(2, '0')}`; // QA<6digit><2digit-seq>
  const uniqLok = () => `LOK${ts}${String(++seq).padStart(2, '0')}`;

  before(() => {
    cy.fixture('kamar').then((data) => { d = data; });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    kamar.visit();
  });

  // helper seed: bikin 1 kamar valid (default Status=Aktif) lalu balik ke list bersih
  const seed = (instansi, nama) => {
    kamar.addKamar(instansi, nama);
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.visit();
  };

  // ---------- DISPLAY ----------
  it('TC-KMR-LST-001 | Happy | List menampilkan kolom lengkap sesuai PRD', () => {
    seed(d.instansi.primary, uniq());
    kamar.assertHasRows();
    kamar.assertColumns(); // Instansi|Kamar|Lokasi|PIC|Status|Dibuat Pada|Edit|Hapus = 8 td
  });

  it('TC-KMR-LST-002 | Happy | Setiap baris punya aksi Edit & Hapus', () => {
    seed(d.instansi.primary, uniq());
    kamar.assertHasRows();
    kamar.assertRowHasActions();
  });

  it('TC-KMR-LST-003 | Positif | Urutan default terbaru -> terlama', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama); // seed() sudah reload ke list bersih (tanpa filter/search)
    kamar.assertFirstRowName(nama); // kamar terbaru di baris paling atas
  });

  // ---------- FILTER ----------
  it('TC-KMR-LST-004 | Happy | Filter by Instansi -> hanya kamar instansi tsb', () => {
    seed(d.instansi.primary, uniq());
    kamar.filterByInstansi(d.instansi.primary);
    kamar.assertHasRows();
    kamar.assertAllRowsInstansi(d.instansi.primary);
  });

  it('TC-KMR-LST-005 | Positif | Ganti filter Instansi -> list ter-update', () => {
    seed(d.instansi.primary, uniq());
    seed(d.instansi.secondary, uniq());
    kamar.filterByInstansi(d.instansi.primary);
    kamar.assertAllRowsInstansi(d.instansi.primary);
    kamar.filterByInstansi(d.instansi.secondary);
    kamar.assertAllRowsInstansi(d.instansi.secondary);
  });

  it('TC-KMR-LST-006 | Happy | Filter Status=Aktif -> hanya kamar Aktif [BUG-016]', () => {
    seed(d.instansi.primary, uniq()); // default Aktif -> data Aktif PASTI ada
    kamar.filterByStatus(d.labels.statusActive);
    // Expected benar: tampil kamar Aktif (minimal seed). Aktual (BUG-016): filter Status balik
    //   empty state padahal data ada -> assertHasRows SENGAJA fail sampai bug fixed.
    kamar.assertHasRows();
    kamar.assertAllRowsStatus(d.labels.statusActive);
  });

  it('TC-KMR-LST-007 | Positif | Filter Status=Semua -> tampil semua status', () => {
    seed(d.instansi.primary, uniq());
    kamar.filterByStatus(d.labels.statusActive);
    kamar.filterByStatus(d.labels.filterStatusAll); // reset ke "Semua"
    kamar.assertHasRows();
  });

  it('TC-KMR-LST-008 | Positif | Filter Status=Tidak Aktif -> hanya kamar Tidak Aktif [BUG-016]', () => {
    // Butuh minimal 1 kamar berstatus Tidak Aktif di staging (status diubah via modul Edit) —
    //   dikonfirmasi ADA secara manual. Expected: tampil kamar Tidak Aktif. Aktual (BUG-016):
    //   filter Status balik empty state padahal data ada -> assertHasRows SENGAJA fail sampai fixed.
    kamar.filterByStatus(d.labels.statusInactive);
    kamar.assertHasRows();
    kamar.assertAllRowsStatus(d.labels.statusInactive);
  });

  it('TC-KMR-LST-009 | Negatif | Filter kombinasi Instansi + Status=Aktif [BUG-016]', () => {
    seed(d.instansi.primary, uniq()); // SDIT + Aktif -> data PASTI ada
    kamar.filterByInstansi(d.instansi.primary);
    kamar.filterByStatus(d.labels.statusActive);
    // Expected benar: tampil kamar SDIT & Aktif (minimal seed). Aktual (BUG-016): kombinasi balik
    //   empty padahal data ada (pola BUG-009/014) -> assertHasRows SENGAJA fail sampai fixed.
    kamar.assertHasRows();
    kamar.assertAllRowsInstansi(d.instansi.primary);
    kamar.assertAllRowsStatus(d.labels.statusActive);
  });

  // ---------- SEARCH ----------
  it('TC-KMR-LST-010 | Happy | Cari by Nama Kamar', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    kamar.search(nama);
    kamar.assertRowExists(nama);
  });

  it('TC-KMR-LST-011 | Positif | Cari by Instansi [BUG-018]', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    kamar.search(d.instansi.primary); // "SDIT"
    // PRD: cari by Instansi harus nampilin kamar instansi tsb (seed kita, newest -> teratas).
    //   Aktual (BUG-018): search by Instansi balik empty padahal data ada (dikonfirmasi manual,
    //   pola BUG-001 Mapel) -> assertRowExists SENGAJA fail sampai bug fixed.
    kamar.assertRowExists(nama);
  });

  it('TC-KMR-LST-012 | Positif | Cari by PIC [BUG-017]', () => {
    const nama = uniq();
    kamar.openAddModal();
    kamar.selectInstansi(d.instansi.primary);
    kamar.fillKamar(nama);
    kamar.selectFirstPic(); // -> alias @picName
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.addSuccess);
    cy.get('@picName').then((pic) => {
      if (!pic) { cy.log('Instansi tidak punya guru -> skip pencarian PIC'); return; }
      kamar.visit();
      kamar.search(pic);
      // PRD: search by PIC harus nampilin kamar yang PIC-nya cocok. Aktual (BUG-017): search by PIC
      //   balik empty state padahal data ada (dikonfirmasi manual) -> assertRowExists SENGAJA fail
      //   sampai bug fixed. Search by Nama (TC-010) normal; hanya by PIC yang rusak.
      kamar.assertRowExists(nama);
    });
  });

  it('TC-KMR-LST-013 | Edge | Cari case-insensitive (huruf kecil) [ASUMSI]', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    kamar.search(nama.toLowerCase()); // expected: search tidak case-sensitive
    kamar.assertRowExists(nama);
  });

  it('TC-KMR-LST-014 | Negatif | Cari keyword tidak ada -> halaman kosong', () => {
    kamar.search(d.testData.noMatchSearch);
    kamar.assertEmptyState();
  });

  it('TC-KMR-LST-015 | Positif | Clear search -> list kembali tampil', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    kamar.search(nama);
    kamar.assertRowExists(nama);
    kamar.clearSearch();
    kamar.assertHasRows(); // list balik (tidak ter-filter)
  });

  // ---------- EDGE ----------
  it('TC-KMR-LST-016 | Edge | Cari pakai teks Lokasi -> TIDAK ditemukan (Lokasi bukan kriteria) [ASUMSI]', () => {
    const nama = uniq();
    const lok = uniqLok();
    kamar.openAddModal();
    kamar.selectInstansi(d.instansi.primary);
    kamar.fillKamar(nama);
    kamar.fillLokasi(lok);
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.visit();
    kamar.search(lok);
    // PRD: search hanya Instansi/Nama/PIC -> Lokasi BUKAN kriteria -> kamar tak muncul lewat lokasi.
    //   Kalau MALAH muncul = behavior beda dari PRD (TC fail = info, bukan lock).
    kamar.assertRowNotExists(nama);
  });
});
